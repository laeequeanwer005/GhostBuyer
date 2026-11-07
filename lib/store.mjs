import {randomUUID} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT} from './config.mjs';
import {scenarioById} from './personas.mjs';
import {evaluate} from './invariants.mjs';
const sessions = new Map();
const plans = new Map();
const DATA = path.join(ROOT,'data');
const LOG = path.join(DATA,'runs.json');
fs.mkdirSync(DATA,{recursive:true});
let runs = [];
try { runs = JSON.parse(fs.readFileSync(LOG,'utf8')).slice(0,200); } catch {}
const stamp = () => new Date().toISOString();
function saveRuns() {
  fs.mkdirSync(DATA,{recursive:true});
  fs.writeFileSync(LOG+'.tmp', JSON.stringify(runs,null,2));
  fs.renameSync(LOG+'.tmp',LOG);
}
export function allRuns() {return runs.map(({evidence,...r})=>({...r,evidence:{source:evidence?.source, captureId:evidence?.captureId, paypalOrderId:evidence?.paypalOrderId, debugId:evidence?.debugId}}));}
export function runById(id) {return runs.find(r=>r.id === id);}
export function addRun(run) { runs.unshift(run); runs=runs.slice(0,200); saveRuns(); return run; }
export function createSession({scenarioId,implementation='vulnerable',mode='fixture'}) {
  if (!scenarioById(scenarioId)) throw Object.assign(new Error('Unknown scenario'),{status:400});
  if (!['vulnerable','fixed'].includes(implementation)) throw Object.assign(new Error('Unknown implementation'),{status:400});
  if (!['fixture','paypal_sandbox'].includes(mode)) throw Object.assign(new Error('Unknown mode'),{status:400});
  if (mode === 'paypal_sandbox' && !scenarioById(scenarioId).supportedInSandbox) throw Object.assign(new Error('Use local fixtures for this scenario'),{status:400});
  const obj = {id:randomUUID(),scenarioId,implementation,mode,createdAt:stamp(),providerState:'UNKNOWN',fulfillments:0,callbacks:0,orderId:null,captureId:null,debugId:null,lastHttp:null, events:[], evidence:[], completed:false};
  sessions.set(obj.id,obj);
  pushEvent(obj,'EXPERIMENT_STARTED','New controlled demonstration-shop session',`Scenario: ${scenarioId}; implementation: ${implementation}; source: ${mode}`);
  if(sessions.size > 200) sessions.delete(sessions.keys().next().value);
  return obj;
}
export function getSession(id) {return sessions.get(id);}
export function mustSession(id) {const obj = getSession(id);if(!obj)throw Object.assign(new Error('Session not found'),{status:404});return obj;}
export function publicSession(s) {return {id:s.id,scenarioId:s.scenarioId,implementation:s.implementation,mode:s.mode,providerState:s.providerState,fulfillments:s.fulfillments,callbacks:s.callbacks,orderId:s.orderId,captureId:s.captureId,captureAttempted:Boolean(s.captureAttempted),completed:s.completed,events:s.events,checks:evaluate(s),negativeTest:s.scenarioId==='capture_declined'};}
export function pushEvent(session,type,title,detail,source='APPLICATION') {session.events.push({id:randomUUID(),time:stamp(),type,title,detail,source});}
export function applyCallback(s) {
  s.callbacks++;
  if(s.implementation === 'vulnerable'){
    // Educational anti-pattern: trust "approved" / callback before checking capture.
    s.fulfillments++;
    pushEvent(s,'FAULT','Vulnerable checkout grants access',`Grant #${s.fulfillments}; provider state ${s.providerState}; callback #${s.callbacks}`);
  } else if(s.providerState === 'CAPTURED' && s.fulfillments === 0){
    s.fulfillments = 1;
    pushEvent(s,'PASS','Verified checkout grants access once','A completed capture was confirmed before fulfillment');
  } else {
    pushEvent(s,'SAFE','Checkout safely blocks duplicate or unverified access',`Provider: ${s.providerState}; existing grants: ${s.fulfillments}`);
  }
}
export function runFixtureAction(s,action){
  if(s.mode!=='fixture') throw Object.assign(new Error('Fixture action only in fixture mode'),{status:400});
  if(!['checkout','retry'].includes(action)) throw Object.assign(new Error('Unsupported action'),{status:400});
  if(action==='retry' && s.scenarioId!=='double_click') throw Object.assign(new Error('Retries only supported in the duplicate-callback experiment'),{status:400});
  if(action==='checkout' && s.callbacks>0) throw Object.assign(new Error('Checkout already simulated; use retry where supported'),{status:409});
  if(action==='checkout') {
    s.providerState = s.scenarioId==='network_drop' ? 'UNKNOWN' : s.scenarioId==='capture_declined' ? 'NOT_CAPTURED' : 'CAPTURED';
    pushEvent(s,'PROVIDER','Fixture payment adapter returned a controlled outcome',`Provider state: ${s.providerState} (NOT a PayPal API response)`,'LOCAL_FIXTURE');
    if(s.scenarioId==='network_drop')pushEvent(s,'INJECTION','Merchant-side response intentionally dropped','Loss of response visibility is simulated locally','LOCAL_FIXTURE');
  } else pushEvent(s,'INJECTION','Duplicate notification delivered','Second local callback; no second capture','LOCAL_FIXTURE');
  applyCallback(s);
  s.completed=true;
  return publicSession(s);
}
export function storePlan(plan){const id=randomUUID();plans.set(id,{...plan,id,created:Date.now()});if(plans.size>100)plans.delete(plans.keys().next().value);return {...plan,id};}
export function getPlan(id){const p=plans.get(id);return p && Date.now()-p.created<1800000 ? p : null;}
export function buildRun(s,{browser=null,parentId=null,aiPlan=null}={}){
  return {
    id:randomUUID(),createdAt:stamp(),scenarioId:s.scenarioId,implementation:s.implementation,
    mode:s.mode, providerState:s.providerState,merchantState:s.fulfillments?'ACCESS_GRANTED':'ACCESS_LOCKED',
    fulfillments:s.fulfillments,callbacks:s.callbacks,verdict:evaluate(s),
    evidence:{ source: s.mode==='paypal_sandbox' ? 'PAYPAL_SANDBOX_API_WITH_LOCAL_STORE_LOGIC':'CONTROLLED_LOCAL_FIXTURE_NO_PAYPAL_TRANSACTION',
      paypalOrderId:s.orderId,captureId:s.captureId,debugId:s.debugId,captureHttpStatus:s.lastHttp,
      faultType:scenarioById(s.scenarioId).fault,
      notes: s.evidence, screenshot:browser?.screenshot||null,
    },
    timeline:structuredClone(s.events), browser:browser?{used:true,steps:browser.steps,consoleErrors:browser.consoleErrors||[],screenshot:browser.screenshot}: {used:false,steps:[]},
    ai:aiPlan?{used:true,model:aiPlan.model,hypothesis:aiPlan.hypothesis,steps:aiPlan.steps} : {used:false},
    parentId,
  };
}
export function updateRun(id, updates){const run=runById(id);if(!run)return null;Object.assign(run,updates);saveRuns();return run;}
