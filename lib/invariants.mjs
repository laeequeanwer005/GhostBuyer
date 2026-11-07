/** Assertions are deterministic. LLM text must never change pass/fail. */
export function evaluate({providerState, fulfillments, callbacks, scenarioId}) {
  const checks = [
    {
      key:'CAPTURE_BEFORE_ACCESS', title:'Access requires confirmed capture',
      passed: fulfillments === 0 || providerState === 'CAPTURED',
      detail: `Provider: ${providerState}; access grants: ${fulfillments}`,
    },
    {
      key:'AT_MOST_ONCE', title:'Never fulfill the same order twice',
      passed: fulfillments <= 1,
      detail: `${fulfillments} grants across ${callbacks} callback(s)`,
    },
  ];
  if (scenarioId === 'happy_path') checks.push({
    key:'HAPPY_PATH', title:'Completed payment grants access exactly once',
    passed: providerState === 'CAPTURED' && fulfillments === 1,
    detail: `Provider: ${providerState}; grants: ${fulfillments}`,
  });
  return {passed: checks.every(x=>x.passed), checks,
    meaning: checks.every(x=>x.passed) ? 'No checkout invariant violated in this experiment' : 'Checkout safety invariant violated'};
}
export function stateFromPayPal(order) {
  if (!order || !Array.isArray(order.purchase_units)) return 'UNKNOWN';
  const captures = order.purchase_units.flatMap(x=>Array.isArray(x?.payments?.captures) ? x.payments.captures : []);
  if (captures.some(x=>x.status === 'COMPLETED')) return 'CAPTURED';
  // An approved order is NOT a completed payment.
  if (['CREATED','APPROVED','PAYER_ACTION_REQUIRED','SAVED','VOIDED'].includes(order.status)) return 'NOT_CAPTURED';
  if (captures.length) return 'NOT_CAPTURED';
  return 'UNKNOWN';
}
