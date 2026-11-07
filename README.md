# GHOSTBUYER AI

**AI-guided checkout testing. Clear payment evidence. Verified fixes.**

GHOSTBUYER tests a deliberately instrumented merchant checkout with four customer failure scenarios. It checks whether an order was actually captured before access was granted, records the event history, and allows developers to replay the same scenario after correcting the store. A structured AI planner and the PayPal Sandbox can be connected to the runnable Node.js application.

> **What is real?** The standalone HTML and default local tests use deterministic simulated payment outcomes. The backend contains separate integrations for genuine PayPal Sandbox Orders and model-based AI planning. These integrations require developer-owned credentials and have **not** been verified against your accounts in this package. Always label the provenance of a test result.

## Start in under a minute

**Option A: preview the interface.** Open `public/index.html` in Chrome, Edge or Firefox. All visuals, styling and scripts are embedded, so no installation is required. The simulation does not transfer money or make an AI request.

**Option B: run the application.** Install Node.js 22 or newer, then from the project directory:

```bash
cp .env.example .env
npm start
```

On PowerShell, use `Copy-Item .env.example .env`. Open **http://127.0.0.1:3100**. The default app listens on localhost and supports simulated tests without credentials.

To check it: `npm test`. For a separate HTTP smoke test while the server is running: `npm run smoke`.

## The shortest judge walkthrough

1. Choose **Unlucky Buyer** and **Original checkout** in the Test lab.
2. Click **Run the test**. The provider is `NOT_CAPTURED`, yet the deliberately vulnerable merchant grants product access. The safety check fails.
3. Click **Replay the fix**. This starts a fresh, corrected test. The merchant keeps access locked, and the regression check passes.
4. Scrub the event timeline and export both evidence records. Alternatively, use the five-step **Judge Mode** in the top navigation.

The original/fixed difference is a controlled test of the code, not evidence of a live payment incident.

## Connect PayPal and AI

1. Create a PayPal **Sandbox Business REST application** in the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/).
2. Add these server-side variables to `.env`: `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`.
3. Use **PayPal Sandbox** under **Use PayPal Sandbox or live AI tools** in the Test lab. The companion `/shop` page creates an order, initiates Sandbox buyer approval with the JavaScript SDK v6, captures via Orders v2 and reconciles the resulting payment status. Only Sandbox funds are used.
4. For rejected-capture tests, enable PayPal Sandbox Negative Testing for your merchant and set `ENABLE_NEGATIVE_TESTING=true`. Test this with your own accounts before recording claims.
5. For AI planning and diagnoses, supply `OPENAI_API_KEY` server-side. `OPENAI_MODEL` is configurable. The model selects a bounded scenario and interprets **observed** evidence; deterministic assertions determine pass/fail.
6. For local Chromium browser automation, install Chrome or Chromium, optionally setting `CHROME_PATH` in `.env`. This tests the instrumented local merchant—not an arbitrary outside shop or unattended PayPal login.

**Never publish `.env`, API secrets, live account credentials or personal customer data.** The frontend intentionally cannot store these secrets. All Sandbox and AI endpoints use server-side configuration.

## Evidence types

| Label | Meaning |
|---|---|
| **Local simulation** | Deterministic fixture with simulated payment state; no PayPal or AI API calls |
| **Browser / local fixture** | Browser executed actions against the local demonstration store; provider state remains simulated |
| **PayPal Sandbox** | Genuine PayPal API responses from a credentialed Sandbox test; capture state should be independently checked |
| **AI analysis** | Model-assisted plan or explanation of recorded facts; never the source of the payment verdict |

## Project structure

- `public/index.html`: self-contained offline homepage, Test lab, Judge Mode, results and evidence export.
- `public/shop.html`, `public/shop.css` and `public/shop.js`: controlled merchant test checkout.
- `lib/paypal.mjs`: server-side PayPal Sandbox REST integration.
- `lib/ai.mjs`: bounded structured AI planning and diagnosis.
- `lib/invariants.mjs`, `lib/store.mjs`: deterministic payment checks, sessions and evidence.
- `lib/browser-agent.mjs`: local Chromium test execution.
- `tests/`: automated unit and HTTP tests.
- `docs/`: architecture, demo storyboard, safety notes and Devpost submission requirements.

This project is MIT-licensed. Before publishing, review the rights to any included media and third-party trademarks. Explain the team's original contribution and how significant development occurred during the hackathon period.

## Submission is a separate step

The source archive **does not by itself complete the PayPal AI Hackathon submission**. A public repository with a visible open-source license, a working build or hosted demo, an English description, exact AI/PayPal tool attribution and a publicly accessible **YouTube demo under three minutes** are still required. Demonstrate credentialed AI and Sandbox functionality, make the entry freely testable through judging, and submit before **November 12, 2026 at 12:00 PM Pacific Standard Time**.

See [`docs/SUBMISSION_CHECKLIST.md`](docs/SUBMISSION_CHECKLIST.md) and [`docs/DEVPOST_DRAFT.md`](docs/DEVPOST_DRAFT.md). Official rules: <https://paypalaihackathon.devpost.com/rules>.
