import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>readFileSync(path.join(root,p),'utf8');
for(const name of ['public/index.html']){
 test(`${name} keeps future Pro unobtrusive and separate from free testing`,()=>{
   const html=read(name);
   assert.match(html,/id="roadmap"/);
   assert.match(html,/class="roadmap-details"/);
   assert.match(html,/Future roadmap, not a paid product today/);
   assert.match(html,/No subscription checkout or paywall is implemented/);
   assert.match(html,/id="studio"/);
   assert.match(html,/id="judge-launch"/);
   assert.match(html,/href="#roadmap"/);
 });
}
test('future revenue proposal remains separate from core checkout validation',()=>{
 const doc=read('docs/GHOSTBUYER_PRO_ROADMAP.md');
 assert.match(doc,/NOT IMPLEMENTED/);
 assert.match(doc,/Priority 0/);
 assert.match(doc,/No pricing, subscriptions, premium login/);
 assert.match(doc,/Do \*\*not\*\* gate demonstration flows/);
});
