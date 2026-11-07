import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {config,ROOT,paypalConfigured,aiConfigured,isLoopback} from './lib/config.mjs';
import {SCENARIOS,scenarioById} from './lib/personas.mjs';
import {createSession,mustSession,publicSession,runFixtureAction,pushEvent,applyCallback,allRuns,runById,addRun,buildRun,storePlan,getPlan,updateRun} from './lib/store.mjs';
import {createOrder,captureOrder,retrieveOrder} from './lib/paypal.mjs';
import {stateFromPayPal} from './lib/invariants.mjs';
import {planTest,diagnose} from './lib/ai.mjs';
import {detectChrome,runBrowser} from './lib/browser-agent.mjs';
const publicDir=path.join(ROOT,'public');
let agentBusy=false;
const fail=(status,message)=>Object.assign(new Error(message),{status});
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon'};
function headers(res,type='application/json; charset=utf-8',status=200,extra={}){
  res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'no-referrer','X-Frame-Options':'DENY',...extra});
}
function json(res,data,status=200){headers(res,undefined,status);res.end(JSON.stringify(data));}
function staticFile(res,file){const ext=path.extname(file);headers(res,mime[ext]||'application/octet-stream');fs.createReadStream(path.join(publicDir,file)).pipe(res);}
async function parseBody(req){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>16000)throw fail(413,'JSON request too large');}
  try{return JSON.parse(raw||'{}');}catch{throw fail(400,'Invalid JSON');}}
function segment(url){return new URL(url,'http://localhost').pathname.split('/').filter(Boolean);}
function assertFixtureSession(s){if(s.mode!=='fixture')throw fail(409,'Not a fixture session');}
function assertPaypalSession(s){if(s.mode!=='paypal_sandbox')throw fail(409,'Not a Sandbox session');}
async function handle(req,res){
  try {
    const parts=segment(req.url),location='/'+parts.join('/');
    if(req.method==='GET'){
      if(location==='/api/status')return json(res,{
        app:'GHOSTBUYER AI',version:'1.0.0',paypalConfigured:paypalConfigured(),aiConfigured:aiConfigured(),
        negativeTestingEnabled:config.negativeTesting,chromiumAvailable:Boolean(detectChrome()),
        aiModel:aiConfigured()?config.aiModel:null,paypalClientId:paypalConfigured()?config.paypalClientId:null,
        host:config.host,mode:'SANDBOX_ONLY; no production funds',
      });
      if(location==='/api/scenarios')return json(res,{scenarios:SCENARIOS});
      if(location==='/api/runs')return json(res,{runs:allRuns()});
      if(parts.length===3 && parts[0]==='api' && parts[1]==='runs'){
        const run=runById(parts[2]);if(!run)throw fail(404,'Run not found');return json(res,{run});
      }
      if(parts.length===4 && parts[0]==='api' && parts[1]==='runs' && parts[3]==='download'){
        const run=runById(parts[2]);if(!run)throw fail(404,'Run not found');
        headers(res,'application/json; charset=utf-8',200,{'Content-Disposition':`attachment; filename="ghostbuyer-evidence-${run.id.slice(0,8)}.json"`});
        return res.end(JSON.stringify(run,null,2));
      }
      if(parts.length===3 && parts[0]==='api' && parts[1]==='shop')return json(res,{session:publicSession(mustSession(parts[2]))});
      if(parts.length===3 && parts[0]==='api' && parts[1]==='screenshots'){
        const filename=parts[2];if(!/^[a-f0-9-]{36}\.png$/.test(filename))throw fail(404,'Unknown screenshot');
        const file=path.join(ROOT,'data','screenshots',filename);if(!fs.existsSync(file))throw fail(404,'Screenshot not found');
        headers(res,'image/png');return fs.createReadStream(file).pipe(res);
      }
      const resources={'/':'index.html','/index.html':'index.html','/shop':'shop.html','/shop.html':'shop.html',
        '/shop.css':'shop.css','/shop.js':'shop.js','/brandmark.svg':'brandmark.svg'};
      if(resources[location])return staticFile(res,resources[location]);
      throw fail(404,'Route not found');
    }
    if(req.method!=='POST')throw fail(405,'Only GET and POST supported');
    // Origin checks stop ordinary cross-site requests from triggering local actions.
    const origin=req.headers.origin;
    if(origin){let u;try{u=new URL(origin);}catch{throw fail(403,'Bad origin');}
      if(u.hostname!== '127.0.0.1'&&u.hostname!=='localhost'&&u.hostname!==config.host)throw fail(403,'Cross-origin mutation blocked');}
    const body=await parseBody(req);
    if(location==='/api/ai/plan'){
      const plan=storePlan(await planTest(body.goal));
      return json(res,{plan});
    }
    if(location==='/api/ai/explain'){
      const run=runById(String(body.runId||''));if(!run)throw fail(404,'Run not found');
      const analysis=await diagnose(run);updateRun(run.id,{aiDiagnosis:analysis});return json(res,{analysis});
    }
    if(location==='/api/agent/run' || location==='/api/fixture/run'){
      const browserRequested=location==='/api/agent/run';
      if(agentBusy)throw fail(429,'Another experiment is running');
      const plan=body.planId?getPlan(body.planId):null;
      if(body.planId && !plan)throw fail(400,'AI plan expired or missing');
      const scenarioId=plan?.scenarioId||String(body.scenarioId||'');
      if(!scenarioById(scenarioId))throw fail(400,'Invalid scenario');
      const s=createSession({scenarioId,implementation:body.implementation||'vulnerable',mode:'fixture'});
      let browser=null;
      agentBusy=true;
      try{
        if(browserRequested)browser=await runBrowser({sessionId:s.id,scenarioId,port:config.port});
        else {for(const action of scenarioById(scenarioId).actions)runFixtureAction(s,action);}
      }finally{agentBusy=false;}
      const record=addRun(buildRun(s,{browser,parentId:runById(body.parentId)?.id||null,aiPlan:plan}));
      return json(res,{run:record});
    }
    if(location==='/api/paypal/sessions'){
      if(!paypalConfigured())throw fail(503,'Configure PayPal Sandbox credentials first');
      const scenarioId=String(body.scenarioId||'');
      if(!scenarioById(scenarioId)?.supportedInSandbox)throw fail(400,'Choose a supported Sandbox scenario');
      if(scenarioId==='capture_declined'&&!config.negativeTesting)throw fail(409,'Negative testing is disabled. Enable it in .env and your PayPal sandbox business account.');
      const s=createSession({scenarioId,implementation:body.implementation||'vulnerable',mode:'paypal_sandbox'});
      return json(res,{session:publicSession(s),shopUrl:'/shop?session='+s.id});
    }
    if(parts.length===4&&parts[0]==='api'&&parts[1]==='shop'&&parts[3]==='action'){
      const s=mustSession(parts[2]);assertFixtureSession(s);
      return json(res,{session:runFixtureAction(s,String(body.action||''))});
    }
    if(parts.length===5&&parts[0]==='api'&&parts[1]==='paypal'&&parts[2]==='sessions'){
      const s=mustSession(parts[3]);assertPaypalSession(s);
      const action=parts[4];
      if(action==='create'){
        if(s.orderId)throw fail(409,'A Sandbox order was already created for this session');
        const reply=await createOrder();
        if(!reply.ok||!reply.data.id)throw fail(502,'PayPal Sandbox could not create the order (HTTP '+reply.httpStatus+', debug ID '+(reply.debugId||'unknown')+')');
        s.orderId=reply.data.id;s.captureRequestId=randomUUID();
        pushEvent(s,'PAYPAL','Sandbox order created',`Order ID: ${s.orderId}; status: ${reply.data.status}`,'REAL_SANDBOX_API');
        return json(res,{orderId:s.orderId});
      }
      if(action==='capture'){
        if(!s.orderId||s.orderId!==body.orderId)throw fail(400,'Order ID does not belong to this demo session');
        if(s.captureAttempted)throw fail(409,'Capture already attempted for this session; start a new test for another capture');
        s.captureAttempted=true;
        const mockError=s.scenarioId==='capture_declined'?'INSTRUMENT_DECLINED':undefined;
        let response;
        try {response=await captureOrder(s.orderId,{requestId:s.captureRequestId,mockError});}
        catch(error){
          pushEvent(s,'UNCERTAIN','PayPal capture network outcome unavailable',error.message,'REAL_SANDBOX_API');
          response={ok:false,data:{},httpStatus:null,debugId:null};
        }
        s.lastHttp=response.httpStatus;s.debugId=response.debugId;
        s.evidence.push({kind:'SANDBOX_CAPTURE_ATTEMPT',httpStatus:response.httpStatus,
          negativeTesting:mockError||null,issue:response.data?.details?.[0]?.issue||response.data?.name||null});
        pushEvent(s,response.ok?'PAYPAL':'PAYPAL_ERROR',response.ok?'Sandbox capture response received':'Sandbox capture rejected or not confirmed',
          `HTTP: ${response.httpStatus||'unavailable'}; issue: ${response.data?.details?.[0]?.issue||response.data?.name||'none'}`,'REAL_SANDBOX_API');
        let retrieved=null;
        try{retrieved=await retrieveOrder(s.orderId);}catch{}
        const fetchedTruth=retrieved?.ok ? stateFromPayPal(retrieved.data) : 'UNKNOWN';
        const capturedTruth=response.ok ? stateFromPayPal(response.data) : 'UNKNOWN';
        // A confirmed capture in EITHER verified PayPal API response outranks a stale GET /orders response.
        s.providerState=(fetchedTruth==='CAPTURED'||capturedTruth==='CAPTURED') ? 'CAPTURED' : fetchedTruth;
        const combinedCaptures=[...(retrieved?.data?.purchase_units||[]),...(response.data?.purchase_units||[])]
          .flatMap(u=>u?.payments?.captures||[]);
        s.captureId=combinedCaptures.find(c=>c.status==='COMPLETED')?.id||null;
        pushEvent(s,'RECONCILE','Independent order-state reconciliation',`GET /orders/{id}: ${retrieved?.ok?'HTTP '+retrieved.httpStatus:'unavailable'}; derived state: ${s.providerState}`,'REAL_SANDBOX_API');
        // Callback reflects an approved checkout or a failed capture response; buggy code is deliberately unsafe.
        applyCallback(s);s.completed=true;
        const run=addRun(buildRun(s));s.lastRunId=run.id;
        return json(res,{session:publicSession(s),runId:run.id,captureStatus:response.ok?'HTTP_SUCCESS':'HTTP_ERROR',paypalIssue:response.data?.details?.[0]?.issue||response.data?.name||null});
      }
      if(action==='duplicate'){
        if(s.scenarioId!=='double_click'||!s.captureAttempted)throw fail(409,'Only available after the duplicate-callback Sandbox checkout');
        pushEvent(s,'INJECTION','Locally re-delivered capture callback','No second PayPal capture request sent','LOCAL_FAULT_INJECTION');
        applyCallback(s);s.completed=true;
        const run=addRun(buildRun(s));s.lastRunId=run.id;
        return json(res,{session:publicSession(s),runId:run.id});
      }
      if(action==='reconcile'){
        if(!s.orderId)throw fail(409,'No order to reconcile');
        const response=await retrieveOrder(s.orderId);
        if(!response.ok)throw fail(502,'PayPal reconciliation failed: '+response.httpStatus);
        s.providerState=stateFromPayPal(response.data);
        pushEvent(s,'RECONCILE','Order state checked again',`Provider: ${s.providerState}`,'REAL_SANDBOX_API');
        const run=addRun(buildRun(s));s.lastRunId=run.id;
        return json(res,{session:publicSession(s),runId:run.id});
      }
    }
    throw fail(404,'Route not found');
  }catch(error){
    // Avoid reflecting any credential or provider response body in HTTP errors.
    const code=error.status&&Number.isInteger(error.status)?error.status:500;
    if(code===500)console.error('[SERVER]',error.message);
    return json(res,{error:code===500?'Unexpected server error (see server log)':error.message},code);
  }
}
const server=http.createServer(handle);
server.listen(config.port,config.host,()=>{
  console.log(`\nGHOSTBUYER AI  http://${config.host}:${config.port}`);
  console.log(`Chromium: ${detectChrome()?'available':'not found'} | PayPal Sandbox: ${paypalConfigured()?'configured':'not configured'} | AI: ${aiConfigured()?'configured':'not configured'}`);
  if(!isLoopback(config.host))console.warn('SECURITY: app is not protected by user authentication; do not expose to public internet without access controls.');
});
