# PayPal AI Hackathon 2026 — compliance and release checklist

Checked against the official 2026 Devpost rules as published October 23, 2026. Check for updates before submitting. Reference: https://paypalaihackathon.devpost.com/rules

## Eligibility

- [ ] Every participant is of legal age of majority where they reside and is eligible under the geographic, sanctions and conflict-of-interest exclusions.
- [ ] The team has agreed on and authorized its Devpost representative.
- [ ] Team members own their original work and comply with all open-source dependencies and relevant tool terms.
- [ ] The significant work was completed during the submission window (Oct 1 – Nov 12, 2026); explain the new work if reusing earlier code.

## Functional submission

- [x] Runnable Node.js backend/frontend demo with no npm dependencies.
- [x] Controlled local fixture tests and deterministic payment assertions.
- [x] Source code for PayPal Sandbox Orders v2 and JavaScript SDK v6 integrations.
- [x] Source code for OpenAI structured-output test planning and evidence diagnosis.
- [x] Source code for local Chromium browser action runner (subject to environment compatibility).
- [x] Public MIT license file in project root.
- [ ] **Confirm a real Sandbox buyer checkout works with your own credentials.**
- [ ] **Confirm capture rejection is reproduced using PayPal Negative Testing on your merchant Sandbox account.**
- [ ] **Confirm a real AI plan and AI diagnosis are returned with your API key.**
- [ ] **Run the headless browser agent on a permitted Chromium installation and inspect its screenshot.**
- [ ] Verify every item of your recorded video matches actual behavior (no mislabeled mocks).
- [ ] Run `npm test`; confirm no broken steps on a clean clone.
- [ ] Review code for personal data, secrets, or unlicensed assets.
- [ ] If hosted publicly: add required access controls or use restricted-access hosting; default server is localhost only.

## Devpost artifacts (require manual user/team accounts and approval)

- [ ] Join official hackathon at https://paypalaihackathon.devpost.com/.
- [ ] Publish code in a **public GitHub, GitLab or Bitbucket repository** with README, setup instructions, source/assets and LICENSE visible at root.
- [ ] Make all technical setup and test accounts/instructions available to judges **through December 15, 2026**; avoid publishing secrets in the repository.
- [ ] Publish an **English, public YouTube demo video under three minutes** showing the project functioning on its intended device.
- [ ] Explain what AI tool/model was used and the exact part it performs in the app.
- [ ] Explain what PayPal API/SDK was used and why integration is central to the product.
- [ ] Supply a useful English project description, screenshots, demo instructions, team attribution, and links.
- [ ] If entering for a sponsor prize, check additional sponsor-specific rules; merely using a tool may not satisfy qualitative requirements.
- [ ] Submit the completed Devpost entry **before Nov 12, 2026, 12:00 PM PST** (Nov 13, 2026, 12:00 AM GST in UAE).

**This source package does NOT itself join or submit to Devpost, host a public repository or publish a YouTube video.** Those require your accounts, working credentials, real footage, and team authorization.

## Judge-facing evidence to capture

- [ ] A selected adversarial AI mission with real API-model output.
- [ ] Before-state: a deliberately vulnerable local merchant grants access while PayPal Sandbox did not confirm capture, including response HTTP/debug ID if supplied.
- [ ] After-state: fresh Sandbox order in fixed implementation passes. Never claim the same PayPal transaction was replayed if you actually created a new order.
- [ ] Duplicate callback test: distinguish local injected callback from real Sandbox capture.
- [ ] Screenshot evidence from Chromium browser run for a local fixture test.
- [ ] Evidence JSON export and clear demo README.

## Five equally weighted judging criteria

| Criterion | Concrete demo evidence |
|---|---|
| Technological implementation | Genuine Orders v2 + SDK v6 flow, deterministic state checks, actual AI plan, browser lab |
| Design | Coherent operations UI, merchant storefront, accessible mobile layout, source-labeled evidence |
| Potential impact | Real QA problem with a reproducible and demonstrably fixed access-control bug |
| Innovation | AI chooses adversarial personas and a real browser executes controlled payment experiments |
| Presentation | A clear 2:45 before/after live demonstration with accurate PayPal evidence |

No entry is guaranteed to score highly or win. Judges and rules have final authority.
