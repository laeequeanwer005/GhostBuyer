import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENARIOS} from '../lib/personas.mjs';
import {createSession,runFixtureAction,buildRun,publicSession} from '../lib/store.mjs';
for(const scenario of SCENARIOS){
 for(const implementation of ['vulnerable','fixed']){
  test(`${scenario.id} / ${implementation} yields accurate assertions`,()=>{
   const s=createSession({scenarioId:scenario.id,implementation,mode:'fixture'});
   for(const action of scenario.actions)runFixtureAction(s,action);
   const result=buildRun(s);
   assert.equal(result.mode,'fixture');assert.equal(result.evidence.paypalOrderId,null);
   const expected=scenario.id==='happy_path'||implementation==='fixed';
   assert.equal(result.verdict.passed,expected);
   assert.equal(s.callbacks,scenario.actions.length);
   assert.equal(result.evidence.source,'CONTROLLED_LOCAL_FIXTURE_NO_PAYPAL_TRANSACTION');
   assert.equal(publicSession(s).checks.passed,expected);
  });
 }
}
test('a fixture cannot be replayed without a new session',()=>{
 const s=createSession({scenarioId:'capture_declined',mode:'fixture'});runFixtureAction(s,'checkout');
 assert.throws(()=>runFixtureAction(s,'checkout'),/already simulated/);
});
test('unsafe arbitrary test actions are rejected',()=>{
 const s=createSession({scenarioId:'capture_declined',mode:'fixture'});
 assert.throws(()=>runFixtureAction(s,'delete_database'),/Unsupported action/);
});
test('sandbox session refuses unsupported network fault',()=>{
 assert.throws(()=>createSession({scenarioId:'network_drop',mode:'paypal_sandbox'}),/Use local fixtures/);
});
