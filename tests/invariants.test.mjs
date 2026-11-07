import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluate,stateFromPayPal} from '../lib/invariants.mjs';
test('safe checkout never unlocks unverified payment',()=>{
 for(const value of ['UNKNOWN','NOT_CAPTURED'])assert.equal(evaluate({providerState:value,fulfillments:0,callbacks:1,scenarioId:'capture_declined'}).passed,true);
});
test('rejected capture with unlocked product is a defect',()=>{
 const x=evaluate({providerState:'NOT_CAPTURED',fulfillments:1,callbacks:1,scenarioId:'capture_declined'});
 assert.equal(x.passed,false);assert.equal(x.checks[0].key,'CAPTURE_BEFORE_ACCESS');
});
test('double delivery of same callback is detected',()=>{
 const x=evaluate({providerState:'CAPTURED',fulfillments:2,callbacks:2,scenarioId:'double_click'});
 assert.equal(x.passed,false);assert.equal(x.checks[1].passed,false);
});
test('replayed duplicate callback with idempotent fulfillment passes',()=>{
 assert.equal(evaluate({providerState:'CAPTURED',fulfillments:1,callbacks:2,scenarioId:'double_click'}).passed,true);
});
test('normal payment requires exactly one fulfillment',()=>{
 assert.equal(evaluate({providerState:'CAPTURED',fulfillments:1,callbacks:1,scenarioId:'happy_path'}).passed,true);
 assert.equal(evaluate({providerState:'CAPTURED',fulfillments:0,callbacks:1,scenarioId:'happy_path'}).passed,false);
});
test('approval is not payment capture',()=>{
 assert.equal(stateFromPayPal({status:'APPROVED',purchase_units:[{}]}),'NOT_CAPTURED');
});
test('GET order completed capture is a proved financial state',()=>{
 assert.equal(stateFromPayPal({status:'COMPLETED',purchase_units:[{payments:{captures:[{status:'COMPLETED',id:'ABCD'}]}}]}),'CAPTURED');
});
test('unknown and missing capture details remain unknown',()=>{
 assert.equal(stateFromPayPal({status:'COMPLETED',purchase_units:[{}]}),'UNKNOWN');
 assert.equal(stateFromPayPal({status:'COMPLETED'}),'UNKNOWN');
});
