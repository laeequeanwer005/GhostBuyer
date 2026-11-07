import {config,aiConfigured} from './config.mjs';
import {SCENARIOS,scenarioById} from './personas.mjs';
const scenarioIds=SCENARIOS.map(s=>s.id);
function validation(message,status=502){return Object.assign(new Error(message),{status});}
const LIMIT=500;
async function structuredModel(system,user,schema,name){
  if(!aiConfigured())throw validation('Add OPENAI_API_KEY to .env to use real AI planning and analysis. Manual experiments still work.',503);
  let response;
  try {response=await fetch('https://api.openai.com/v1/responses',{
    method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+config.aiKey},signal:AbortSignal.timeout(30000),
    body:JSON.stringify({model:config.aiModel,store:false,max_output_tokens:550,
      input:[{role:'system',content:system},{role:'user',content:user}],
      text:{format:{type:'json_schema',name,strict:true,schema}}}),
  });} catch{throw validation('AI service unreachable. Check network or try again.');}
  const json=await response.json().catch(()=>({}));
  if(!response.ok)throw validation('AI request failed: '+(json.error?.message||response.status).toString().slice(0,170));
  const content=json.output?.flatMap(x=>x.content||[]).find(x=>x.type==='output_text')?.text || json.output_text;
  if(!content)throw validation('AI returned no structured output');
  try{return JSON.parse(content);}catch{throw validation('AI returned malformed structured output');}
}
const planSchema={type:'object',properties:{
  scenarioId:{type:'string',enum:scenarioIds},
  hypothesis:{type:'string'},
  merchantRisk:{type:'string'},
  decisionReason:{type:'string'},
  steps:{type:'array',items:{type:'string'}},
},required:['scenarioId','hypothesis','merchantRisk','decisionReason','steps'],additionalProperties:false};
export async function planTest(goal){
  const clean=String(goal||'').trim().slice(0,LIMIT);
  if(!clean)throw validation('Enter a testing goal',400);
  const context=SCENARIOS.map(({id,short,question,fault})=>({id,short,question,fault}));
  const system='You are GhostBuyer, a bounded QA agent that tests ONLY the local instrumented checkout demo. Select one scenario from '+JSON.stringify(context)+'. Do not claim transactions happened. Create 2-4 specific test steps involving the local store; never add external URLs, arbitrary shell commands or real-world purchases. Answer in JSON matching schema. Favor high-impact reproducible bugs.';
  const data=await structuredModel(system,clean,planSchema,'ghostbuyer_plan');
  if(!scenarioById(data.scenarioId))throw validation('The model suggested a scenario outside the allowed test environment');
  return {mode:'REAL_AI_PLAN',model:config.aiModel,scenarioId:data.scenarioId,
    hypothesis:String(data.hypothesis).slice(0,300),merchantRisk:String(data.merchantRisk).slice(0,300),
    decisionReason:String(data.decisionReason).slice(0,300),steps:data.steps.slice(0,4).map(s=>String(s).slice(0,170))};
}
const diagnosisSchema={type:'object',properties:{
  headline:{type:'string'},cause:{type:'string'},fix:{type:'string'},regressionTest:{type:'string'},impact:{type:'string'},
},required:['headline','cause','fix','regressionTest','impact'],additionalProperties:false};
export async function diagnose(run){
  const facts={scenarioId:run.scenarioId,implementation:run.implementation,mode:run.mode,
    provider:run.providerState,fulfillments:run.fulfillments,callbacks:run.callbacks,
    checks:run.verdict.checks.map(c=>({key:c.key,passed:c.passed,detail:c.detail})),
    events:run.timeline.map(e=>({type:e.type,title:e.title,detail:e.detail})).slice(0,10)};
  const system='You are an expert payment reliability engineer reviewing TEST EVIDENCE from a controlled merchant store. Explain strictly what evidence shows. This is NOT production fraud; local fixtures are NOT actual PayPal transactions. If the provider state is UNKNOWN, say the outcome is unknown. Do not claim verified financial loss. Return concise actionable engineering guidance as schema JSON. No invented PayPal data.';
  const data=await structuredModel(system,JSON.stringify(facts),diagnosisSchema,'ghostbuyer_diagnosis');
  return {mode:'REAL_AI_DIAGNOSIS',model:config.aiModel,...Object.fromEntries(Object.entries(data).map(([k,v])=>[k,String(v).slice(0,400)]))};
}
