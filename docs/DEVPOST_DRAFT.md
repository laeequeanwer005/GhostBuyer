# Devpost submission copy — review and personalize before posting

## Project name
**GHOSTBUYER AI — AI Customers That Break Your Checkout Before Real Customers Do**

## Elevator pitch
PayPal helps merchants move money. GHOSTBUYER AI tests what happens when checkout doesn't go according to plan. An AI-directed customer-agent runs realistic failure scenarios against an instrumented merchant shop, while deterministic rules compare PayPal's financial state with merchant fulfillment. Developers can observe the bug, inspect evidence and verify the fix.

## Inspiration
A payment bug can be invisible: an approval notification is mistaken for a completed capture, or a duplicate callback grants access twice. Manual test scripts often skip these tricky edge cases. We wanted to give developers a small, focused QA lab with adversarial customers and strong evidence.

## What it does

- Uses a real AI model to select one of four bounded checkout-testing personas and write a risk hypothesis, when an API key is configured.
- Drives a real local browser through an instrumented fictional checkout for local failure tests and records the steps and screenshot (Chrome/Chromium required).
- Integrates PayPal JavaScript SDK v6 and PayPal Sandbox Orders v2 to create and capture test payments with human Sandbox buyer approval.
- Supports PayPal Sandbox negative testing, with merchant-side failure injection clearly labeled.
- Evaluates fixed payment invariants: never fulfill without verified capture, and never fulfill twice.
- Displays the provider record next to the merchant record with an event timeline, source labels and JSON evidence export.
- Uses AI (when configured) to explain a failure and suggest a concrete regression test, without allowing AI to change pass/fail.

## How we built it
Node.js built-in HTTP server, browser UI in HTML/CSS/JavaScript, Chromium DevTools Protocol for local browser automation, OpenAI Responses API for schema-constrained AI planning/diagnosis, PayPal REST Orders v2 and the official PayPal JavaScript SDK v6. No third-party npm runtime dependencies. PayPal secrets remain server-side.

## Challenges
**Only keep the challenges that actually occurred on your project.** E.g. separating approval from capture; ensuring a second merchant callback didn't trigger a second capture; labeling local fixtures separately from genuine Sandbox responses; limiting the AI to safe, reproducible actions.

## What we're proud of
**After you test it, describe your real verified results here** (PayPal transaction tests run, exact bugs reproduced and screenshots) instead of making up counts or claims.

## What's next
Browser matrix, real signed-webhook verification, a sandbox test-suite builder and hardened multi-tenant staging support. These are roadmap items, not implemented features.

## Built with
- JavaScript, Node.js, HTML/CSS
- OpenAI Responses API structured outputs (if real AI tested)
- PayPal Orders v2 Sandbox REST API
- PayPal JavaScript SDK v6
- Chromium DevTools Protocol

## Demo & repository
- GitHub / GitLab / Bitbucket public repository: **[INSERT ACTUAL PUBLIC URL]**
- Public YouTube video under 3 minutes: **[INSERT ACTUAL URL]**
- App URL or reliable local run instructions: **[INSERT VERIFIED DETAILS]**
- Team members: **[INSERT ACCURATE NAMES / CREDITS]**

## How to run
Node 22+, `cp .env.example .env`, `npm start`, visit `http://127.0.0.1:3100`. Controlled fixture tests are available immediately. For actual PayPal and AI features, configure your own Sandbox and AI API credentials per README. For judges, provide test Sandbox account access securely and without exposing secrets in the public repository.

## Explicit evidence statement
The three levels are deliberately separate: (1) LOCAL FIXTURE simulates provider outcomes and makes no PayPal transaction, (2) REAL BROWSER runs the controlled local store in Chromium and is still not a PayPal payment, and (3) PAYPAL SANDBOX uses the PayPal REST API and SDK v6, after real Sandbox buyer approval. Our screenshots and claims must retain these labels.

## Future vision (planned, not implemented)

We may eventually offer GhostBuyer Pro for engineering teams: reusable scenario libraries, scheduled regression suites, collaboration and CI/CD checks. Subscription billing is **not** part of this prototype. The hackathon application is free to run and evaluate.
