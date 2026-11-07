export const SCENARIOS = Object.freeze([
  {
    id: 'capture_declined', name: 'The Unlucky Buyer', title: 'Rejected at the last second',
    icon: '✕', short: 'PayPal rejects capture after checkout approval.',
    question: 'Will the store unlock access even though capture failed?',
    fault: 'SANDBOX_NEGATIVE_TEST', expected: 'No fulfillment without confirmed capture',
    actions: ['checkout'], supportedInSandbox: true,
    severity: 'CRITICAL',
  },
  {
    id: 'double_click', name: 'The Impatient Buyer', title: 'One payment, two callbacks',
    icon: '↻', short: 'The same payment notification is processed twice.',
    question: 'Can a duplicated callback fulfill the order more than once?',
    fault: 'LOCAL_CALLBACK_DUPLICATION', expected: 'One completed capture yields at most one fulfillment',
    actions: ['checkout', 'retry'], supportedInSandbox: true,
    severity: 'HIGH',
  },
  {
    id: 'network_drop', name: 'The Disconnected Buyer', title: 'Connection lost at payment time',
    icon: '⌁', short: 'The merchant cannot confirm the outcome of capture.',
    question: 'Does the store grant access when payment truth is unknown?',
    fault: 'LOCAL_NETWORK_SIMULATION', expected: 'Unknown state must never trigger fulfillment',
    actions: ['checkout'], supportedInSandbox: false,
    severity: 'HIGH',
  },
  {
    id: 'happy_path', name: 'The Normal Buyer', title: 'The control experiment',
    icon: '✓', short: 'One completed capture unlocks exactly one product.',
    question: 'Can legitimate buyers complete checkout correctly?',
    fault: 'NONE', expected: 'Completed capture unlocks exactly once',
    actions: ['checkout'], supportedInSandbox: true,
    severity: 'CONTROL',
  },
]);
export function scenarioById(id) { return SCENARIOS.find(s => s.id === id); }
export const actionListFor = id => scenarioById(id)?.actions || [];
