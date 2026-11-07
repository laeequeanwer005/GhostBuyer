# Security and responsible testing

GHOSTBUYER AI is a research/QA demonstration, not payment processing software suitable for production.

1. **Sandbox-only.** The PayPal host is hardcoded to `https://api-m.sandbox.paypal.com`. There is no production-switch option; the browser loads the Sandbox v6 SDK. Do not enter real card numbers or authorize a real PayPal payment.
2. **Local-only attack surface.** The browser agent is restricted to an instrumented store running on the same host. It cannot test arbitrary web addresses; the AI only chooses among predefined scenarios. No credential-automation flows are offered.
3. **Secrets.** Keep `.env` out of Git. Use environment variable injection if deploying privately. Never include PayPal client secrets, AI API keys, or buyer passwords in a video or repository. The UI only exposes the public Sandbox client ID.
4. **Data labels.** Fixture states and network drops are explicitly labeled as local simulations. PayPal Sandbox observations come from OAuth-authorized REST calls. A Sandbox error does not imply production losses.
5. **Safe state transitions.** A payment approved by a buyer is not proof that funds were captured. The fixed merchant only unlocks after confirmed capture, and only once. UNKNOWN status must block fulfillment.
6. **Request controls.** Scenario IDs, browser targets and negative test error codes are allowlisted; PayPal API paths and order ID formats are validated. POST endpoints block ordinary foreign browser origins.
7. **No built-in authentication.** The default bind address is `127.0.0.1`. Do not set HOST=0.0.0.0 on a public host unless you add authentication, TLS, CSRF protection, rate limiting, safe audit retention, and tenant isolation.
8. **Do not submit evidence of others' transactions.** Use synthetic datasets and your own Sandbox accounts only. Do not attempt to investigate real merchants or capture payment credentials.
9. **No false technical claims.** An AI diagnosis is a hypothesis grounded in logs, not a formal verification. Deterministic invariants decide whether observed behavior matches the rules.

To report an issue, contact your project maintainers through a private channel rather than posting secrets in a public issue.
