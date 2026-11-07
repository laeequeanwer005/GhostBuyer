# GhostBuyer Pro — future product roadmap (NOT IMPLEMENTED)

**Status:** proposal only. GhostBuyer Pro is not for sale. No pricing, subscriptions, premium login, billing API, billing UI, or paid feature flags are implemented. The active hackathon demo is free to test.

## Priority 0 — earn trust before monetizing

1. Verify a real approved PayPal Sandbox buyer payment and completed capture with your own credentials.
2. Verify controlled Sandbox capture rejection, distinguish genuine PayPal responses from local injected faults, and keep the order locked when no capture is confirmed.
3. Verify the allowlisted AI planner and evidence-grounded explanation against an actual model API (not only fixture JSON).
4. Execute browser-driven checkout tests in an installed Chromium and check the evidence screenshot.
5. Test the fixed implementation using a fresh Sandbox order; export a before/after evidence report.
6. Finish README, license, public repository, short genuine YouTube demo, and unrestricted judge test access.

These are the work items that matter for this hackathon. Do not treat the roadmap as a substitute.

## Proposed future editions (not available in current build)

| Free / developer starter (concept) | GhostBuyer Pro (concept) |
| --- | --- |
| Basic manual checkout scenarios | Reusable custom AI scenario libraries |
| Session-level evidence and replay | Scheduled regression suites |
| Individual developer workflows | Team dashboards and extended history |
| Local testing workflows | CI/CD quality gates and alerts |

A possible longer-term model is paid team subscriptions, potentially through **PayPal Subscriptions**. This would require securely implemented entitlements, billing state, cancellation handling, webhook verification, audit logging, and customer support. **None of those are currently implemented or promised by this hackathon prototype.**

## Hackathon guardrails

- Do **not** gate demonstration flows behind paid subscriptions.
- Keep all required functional test access free for judges throughout the judging period.
- Never imply revenue, active subscribers, product-market fit or features not demonstrated.
- Allocate developer time to functional PayPal and AI evidence before anything in this document.
- Describe this only as a potential business direction in the Devpost project's future roadmap.

## Suggested 20-second pitch addendum

> Once we've validated that autonomous checkout tests reliably catch payment-state bugs, the longer-term vision is GhostBuyer Pro: repeatable AI-led regression suites for merchant engineering teams. That's a future roadmap, not a paid feature in our hackathon build.
