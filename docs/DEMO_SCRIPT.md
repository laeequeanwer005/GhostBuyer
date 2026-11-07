# GhostBuyer AI - 2:50 hackathon demo storyboard

Use only functionality and API responses your team has **actually verified**. No fabricated PayPal transaction data or model outputs.

| Time | Visual | Message |
|---|---|---|
| 0:00-0:18 | Brief hero + screenshot of a mismatch | "Most AI agents try to buy things. Ours find checkout bugs before customers do." |
| 0:18-0:38 | Four ghost customer personas | "We test declined capture, duplicate callbacks, network loss, and successful checkout." |
| 0:38-1:02 | Actual AI planner selects a scenario (requires model API configured) | "AI plans the failure experiment; deterministic rules decide whether a payment passes." |
| 1:02-1:32 | Actual local browser agent visits the instrumented store | Clearly label **browser / controlled fixture**, not a real PayPal transaction. |
| 1:32-2:05 | Separately verified PayPal Sandbox checkout / Orders v2 evidence | Show the **real** order/capture status and merchant state from your own authorized Sandbox account. |
| 2:05-2:28 | Fresh corrected Sandbox scenario, source-labeled before/after | "We don't just find a failure; we prove that the fix holds." |
| 2:28-2:50 | Judge Mode overview, scrub-able flight recorder, evidence export, GitHub | "An AI crash-test lab for payment reliability." |

Judge Mode is an excellent **UI walkthrough**, but it uses local fixtures. Show at least one independent genuine PayPal transaction and one model-driven test if claiming those integrations in the video. Under the official rules, the publicly visible YouTube demo should be under three minutes. Keep credentials, API keys, passwords, and personal data out of all footage.
