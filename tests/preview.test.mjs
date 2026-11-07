import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const text=name=>readFileSync(path.join(root,name),'utf8');
test('new home page is entirely self-contained with all assets',()=>{
 const html=text('public/index.html');
 assert.match(html,/<style>[\s\S]+<\/style>/);
 assert.match(html,/<script>[\s\S]+<\/script>/);
 assert.match(html,/data:image\/webp;base64,/);
 assert.match(html,/AI CHECKOUT RELIABILITY TESTING/);
 assert.match(html,/ghostbuyer-ai|GhostBuyer AI/i);
 assert.doesNotMatch(html,/<script[^>]*src=/);
 assert.doesNotMatch(html,/<link[^>]*rel="stylesheet"/);
});
test('test merchant still loads external CSS and JS correctly',()=>{
 const html=text('public/shop.html');
 assert.match(html,/href="\.\/shop\.css"/);
 assert.match(html,/src="\.\/shop\.js"/);
 assert.doesNotMatch(html,/href="\/shop\.css"/);
});
test('standalone HTML runs local scenarios with honest evidence provenance',()=>{
 const html=text('public/index.html');
 assert.match(html,/LOCAL_SIMULATION_NO_PAYPAL_TRANSACTION/);
 assert.match(html,/Local simulations are not real PayPal transactions/);
 assert.match(html,/The HTML preview cannot securely store API secrets/);
 assert.match(html,/id="run-test"/);
 assert.match(html,/id="replay-fixed"/);
 assert.match(html,/id="intro"/);
});
