# GHOSTBUYER AI — Technical architecture and evidence rules

## High-level architecture

```
Developer goal
    | (OpenAI Responses API, schema-constrained; optional until key configured)
    v
Mission planner --> scenario allowlist + policy --> run/session journal
                                               |
                        +----------------------+---------------------+
                        |                                            |
                     LOCAL LAB                              PAYPAL SANDBOX LAB
                        |                                            |
              Chromium CDP runner                         Buyer uses PayPal SDK v6
                        |                                            |
         instrumented Orbit demo store                  Orders v2 create / capture
                        |                                            |
              fixture payment adapter                    independent Orders v2 GET
                        |                                            |
                        +------------------+-------------------------+
                                           |
                        Provider state vs merchant access grants
                                           |
                               DETERMINISTIC ASSERTIONS
                                           |
                        Timeline + source tag + JSON evidence
                                           |
                            Optional AI grounded diagnosis
```

## Trust boundaries

- AI outputs only `scenarioId`, hypothesis, merchant risk, rationale, and human-readable steps. Server validates the scenario ID and ignores arbitrary instructions; AI cannot run shell commands, visit arbitrary targets, read credentials, or set assertion results.
- The Chrome DevTools Protocol runner is local and navigates to exactly `http://localhost:<port>/shop?session=<uuid>`. No external browser navigation is exposed through API parameters. Browser agent clicks only known local test controls.
- **Fixtures are never labeled as PayPal.** They simulate outcomes through a documented local adapter. Local network drops and duplicate callbacks are simulated by this application and are not PayPal network faults.
- In Sandbox mode, the buyer approves through official PayPal UI (v6). Server keeps OAuth client secret. It calls `POST /v2/checkout/orders`, `POST /v2/checkout/orders/{id}/capture`, then `GET /v2/checkout/orders/{id}` independently.
- In Sandbox capture-declined mode, when explicitly enabled, the server sends `PayPal-Mock-Response: {"mock_application_codes":"INSTRUMENT_DECLINED"}`. Result depends on the PayPal Sandbox merchant's Negative Testing settings.
- `PayPal-Request-Id` is assigned to the capture attempt to communicate idempotency; the local app blocks repeated capture requests for the same session. A duplicate merchant callback is simulated locally without another capture.
- A completed capture returned by PayPal means payment truth = `CAPTURED`. A mere `APPROVED` order means `NOT_CAPTURED`. If retrieval is unavailable and no completed capture is proved, truth is `UNKNOWN`. The app must not promise that an UNKNOWN capture failed.

## Failing behavior vs fixed behavior

The code explicitly contains a **demonstration anti-pattern** in `lib/store.mjs`:

```
if (implementation === 'vulnerable') {
  // Bug: grants access whenever a checkout callback fires,
  // even if capture is rejected or the callback is duplicated.
  fulfillments++;
} else {
  // Correct: access only after confirmed capture, max once.
  if (providerState === 'CAPTURED' && fulfillments === 0) fulfillments = 1;
}
```

This deliberately produces a visible before-and-after regression proof. Do not copy the vulnerable branch into any real checkout.

## Automated browser experiments

The local agent launches an isolated Chrome/Chromium user profile, enables CDP `Page` and `Runtime`, navigates to the instrumented store, clicks the checkout button, optionally clicks the callback-replay control, reads DOM state back, and captures a PNG screenshot under `data/screenshots/`.

No browser-extension/Playwright dependency is required. The current Chromium runner does not bypass enterprise managed-browser URL policies. It will need testing on an ordinary Chrome installation that permits localhost.

## Judgment versus interpretation

The pass/fail decision is **not** made by AI, which may hallucinate. A successful safety experiment must satisfy:

1. No access unless payment state is verified `CAPTURED`.
2. At most one fulfillment per order even if a callback repeats.
3. In normal checkout, exactly one access grant after completed capture.

`UNKNOWN` blocks any access. It is not automatically a confirmed failed payment.

## Artifact boundaries

- `data/runs.json`: persists run reports locally (excluded from Git by default).
- Screenshots: saved locally and served from UUID-only filenames (excluded from Git by default).
- Server sessions: in-memory; may be reset by restarting the process.
- Public repository: code, assets, docs, LICENSE; never `.env` secrets, user transactions, or account credentials.

## Next production engineering work (not claimed as implemented)

- Proper login and tenant isolation for a multi-user deployment.
- Real signed webhook event processing and replay persistence.
- Real distributed idempotency storage (not in-memory).
- Production-grade observability, retention policies, backups and background jobs.
- Comprehensive browser matrix across OS/browsers and Sandbox integration environment.
