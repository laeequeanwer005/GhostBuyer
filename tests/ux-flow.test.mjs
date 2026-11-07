import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=name=>readFileSync(path.join(root,name),'utf8');
for(const filename of ['public/index.html']){
 test(`${filename} uses a clear test journey, honest provenance and accessible controls`,()=>{
   const html=read(filename);
   for(const id of ['scenario-select','mode-broken','mode-fixed','run-test','advanced-tools','replay-fixed','judge-launch','vault-list']){
     assert.match(html,new RegExp(`id="${id}"`));
   }
   assert.match(html,/1 \/ CHOOSE A TEST BUYER/);
   assert.match(html,/2 \/ CHOOSE CHECKOUT VERSION/);
   assert.match(html,/3 \/ Run the test/);
   assert.match(html,/Demo mode · Simulated payments, no money moved/);
   assert.match(html,/Use PayPal Sandbox or live AI tools/);
   assert.match(html,/aria-pressed="true"/);
   assert.match(html,/prefers-reduced-motion:reduce/);
 });
 test(`${filename} has working navigation without duplicated top-level actions`,()=>{
   const html=read(filename);
   const start=html.indexOf('<nav aria-label="Primary navigation"');
   const end=html.indexOf('</nav>',start);
   const nav=html.slice(start,end);
   for(const hash of ['#home','#how','#agents','#studio']) assert.ok(nav.includes(`href="${hash}"`));
   assert.ok(!nav.includes('href="#roadmap"'));
   assert.match(html,/href="#studio">Run a test/);
   assert.match(html,/backendAvailable/);
   assert.doesNotMatch(html,/forEach\(a=>a\.addEventListener\('click',\(\)=>selectPersona\('capture_declined'\)\)\)/);
 });
}
