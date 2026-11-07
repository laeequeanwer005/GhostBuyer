import test from 'node:test';
import assert from 'node:assert/strict';
process.env.OPENAI_API_KEY='AI_FAKE_KEY';
process.env.OPENAI_MODEL='gpt-4o-mini';
const {planTest,diagnose}=await import('../lib/ai.mjs');
const response=value=>({ok:true,status:200,json:async()=>({output:[{content:[{type:'output_text',text:JSON.stringify(value)}]}]})});
test('structured AI selects an allowlisted experiment (mock provider response)',async()=>{
  const old=global.fetch;let req;
  global.fetch=async(url,args)=>{req={url,body:JSON.parse(args.body)};return response({scenarioId:'capture_declined',hypothesis:'Approval does not imply capture',merchantRisk:'Unpaid unlocks',decisionReason:'Highest consequence',steps:['Approve','Reject capture','Check access']});};
  try{const plan=await planTest('Test an approved but rejected payment');assert.equal(plan.scenarioId,'capture_declined');assert.equal(plan.mode,'REAL_AI_PLAN');
    assert.equal(req.url,'https://api.openai.com/v1/responses');assert.equal(req.body.text.format.type,'json_schema');
    assert.equal(req.body.store,false);
  }finally{global.fetch=old;}
});
test('AI output cannot invent arbitrary scenarios',async()=>{
  const old=global.fetch;global.fetch=async()=>response({scenarioId:'attack_merchant',hypothesis:'',merchantRisk:'',decisionReason:'',steps:[]});
  try{await assert.rejects(()=>planTest('Leave test store'),/outside the allowed/);}finally{global.fetch=old;}
});
test('diagnosis uses observed facts and never computes verdict',async()=>{
 const old=global.fetch;global.fetch=async()=>response({headline:'Missing capture guard',cause:'Unlock happened before capture',fix:'Wait for completed capture',regressionTest:'Repeat with mocked decline',impact:'Incorrect access'});
 try{const run={scenarioId:'capture_declined',implementation:'vulnerable',mode:'fixture',providerState:'NOT_CAPTURED',fulfillments:1,callbacks:1,verdict:{checks:[{key:'CAPTURE_BEFORE_ACCESS',passed:false,detail:'Access granted'}]},timeline:[{type:'FAULT',title:'Access unlocked',detail:'No capture'}]};
 const result=await diagnose(run);assert.equal(result.headline,'Missing capture guard');assert.equal(result.mode,'REAL_AI_DIAGNOSIS');}finally{global.fetch=old;}
});
