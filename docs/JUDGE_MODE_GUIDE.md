# Guided Judge Mode - how to present it

Launch **Judge Mode** from the top navigation or footer. It uses the existing fixture experiment code; it is not an animation that invents verdicts.

1. **The challenge** - explain why checkout approval must not be mistaken for captured money.
2. **Release the agent** - run the *Unlucky Buyer* against the intentionally vulnerable merchant. The same fixture test engine used by the Test Lab runs here.
3. **Find the mismatch** - show `NOT_CAPTURED` on the simulated provider side while the merchant reports `ACCESS_GRANTED`. The rule `Never deliver without verified capture` fails.
4. **Prove the fix** - run the **same scenario** against the corrected merchant as a **new fixture test**. It should keep access locked.
5. **Export the evidence** - compare two independent run records; download the before/after JSON or open the full inspector and scrub the recorded events.

## The crucial honest-labeling rule

Judge Mode is a **controlled LOCAL FIXTURE**. It does **not** generate a genuine PayPal receipt, query PayPal, access real funds or call a live model. The `PayPal Sandbox` and `AI mission planner` controls in the backend-connected app are separate and require real credentials. Do not show the Judge Mode simulation as proof that a PayPal Sandbox negative response was received.

## For a compelling hackathon recording

Show (a) the working interactive user experience, (b) one separately verified real AI plan, (c) a genuine Sandbox order/capture test with real source details, and (d) a corrected regression. Keep all secrets out of the recording and ensure recorded operations are repeatable on the judging machine.
