import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=name=>readFileSync(path.join(root,name),'utf8');

test('self-contained homepage includes functional judge and quick-demo controls',()=>{
 const html=read('public/index.html');
 for(const id of ['judge-modal','judge-next','judge-back','judge-export','quick-demo-modal','quick-run','quick-fix','open-quick-demo'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/ghostbuyer:run/);
 assert.match(html,/window\.GhostBuyerCore=/);
});

test('four personas, flight recorder, comparison and evidence vault are present',()=>{
 const html=read('public/index.html');
 for(const id of ['agents','flight-slider','flight-prev','flight-next','comparison','vault','vault-list'])
  assert.match(html,new RegExp('id="'+id+'"'));
 for(const scenario of ['capture_declined','double_click','network_drop','happy_path'])
  assert.match(html,new RegExp('data-ghost="'+scenario+'"'));
});

test('mock evidence is identified and full UI remains in a single HTML file',()=>{
 const html=read('public/index.html');
 assert.match(html,/LOCAL_SIMULATION_NO_PAYPAL_TRANSACTION/);
 assert.match(html,/NO REAL PAYPAL TRANSACTION/);
 assert.match(html,/The HTML preview cannot securely store API secrets/);
 assert.match(html,/data:image\/webp;base64,/);
 assert.doesNotMatch(html,/<link\s+[^>]*rel="stylesheet"/);
 assert.doesNotMatch(html,/<script\s+[^>]*src=/);
});

test('guided frontend honors keyboard focus, reduced motion and responsive layouts',()=>{
 const html=read('public/index.html');
 assert.match(html,/aria-modal="true"/);
 assert.match(html,/aria-pressed="true"/);
 assert.match(html,/prefers-reduced-motion:reduce/);
 assert.match(html,/modalTabTrap/);
 assert.match(html,/@media\(max-width:660px\)/);
});
