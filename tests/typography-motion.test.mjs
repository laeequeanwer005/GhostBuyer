import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');

test('Judge Edition functionality remains with modern type and balanced graphite palette',()=>{
  assert.match(html,/GhostBuyer AI/);
  assert.match(html,/--blue:#92a6dc/);
  assert.match(html,/Inter Display/);
  assert.match(html,/ghostbuyer-scroll-motion/);
  assert.match(html,/id="judge-modal"/);
  assert.match(html,/id="replay-fixed"/);
  assert.doesNotMatch(html,/<script[^>]+src=/);
});
test('scroll headings animate from left, right and upward',()=>{
  assert.match(html,/motion-from-/);
  assert.match(html,/\['\.how-title','left'\]/);
  assert.match(html,/\['\.cta-title','right'\]/);
  assert.match(html,/\['\.hero h1','up'\]/);
  assert.match(html,/IntersectionObserver/);
  assert.match(html,/title\.innerText\.replace/);
});
test('accessibility and offline fallback do not depend on animation',()=>{
  assert.match(html,/prefers-reduced-motion: reduce/);
  assert.match(html,/title\.setAttribute\('aria-label'/);
  assert.match(html,/No PayPal payments|LOCAL SIMULATION|LOCAL_SIMULATION_NO_PAYPAL_TRANSACTION/);
  assert.doesNotMatch(html,/fonts\.googleapis\.com/);
  assert.doesNotMatch(html,/src="https:\/\/.*?\.js"/);
});
