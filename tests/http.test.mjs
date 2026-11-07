import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import net from 'node:net';
function port(){return new Promise(resolve=>{const socket=net.createServer();socket.listen(0,'127.0.0.1',()=>{const p=socket.address().port;socket.close(()=>resolve(p));});});}
test('HTTP full local fixture workflow and public pages',async()=>{
 const p=await port();const child=spawn(process.execPath,['server.mjs'],{cwd:new URL('../',import.meta.url).pathname,env:{...process.env,PORT:String(p),HOST:'127.0.0.1',PAYPAL_CLIENT_ID:'',PAYPAL_CLIENT_SECRET:'',OPENAI_API_KEY:''},stdio:'ignore'});
 try{
  let ready=false;
  for(let i=0;i<45;i++){
   await delay(120);
   try{const res=await fetch(`http://127.0.0.1:${p}/api/status`);if(res.ok){ready=true;break;}}catch{}
  }
  assert.ok(ready,'server started');
  const base=`http://127.0.0.1:${p}`;
  const page=await fetch(base+'/');assert.equal(page.status,200);assert.match(await page.text(),/GHOSTBUYER/);
  const shop=await fetch(base+'/shop');assert.equal(shop.status,200);assert.match(await shop.text(),/Orbit Digital/);
  const icon=await fetch(base+'/brandmark.svg');assert.equal(icon.status,200);assert.match(icon.headers.get('content-type'),/image\/svg\+xml/);assert.match(await icon.text(),/#8cc6ff/);
  const shopCss=await fetch(base+'/shop.css');assert.equal(shopCss.status,200);assert.match(await shopCss.text(),/companion QA storefront/);
  const shopJs=await fetch(base+'/shop.js');assert.equal(shopJs.status,200);
  const scenarios=await (await fetch(base+'/api/scenarios')).json();assert.equal(scenarios.scenarios.length,4);
  const runRes=await fetch(base+'/api/fixture/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scenarioId:'double_click',implementation:'vulnerable'})});
  assert.equal(runRes.status,200);const {run}=await runRes.json();assert.equal(run.verdict.passed,false);assert.equal(run.callbacks,2);
  const retrieved=await (await fetch(base+'/api/runs/'+run.id)).json();assert.equal(retrieved.run.id,run.id);
  const exportRes=await fetch(base+'/api/runs/'+run.id+'/download');assert.equal(exportRes.status,200);
  assert.match(exportRes.headers.get('content-disposition'),/attachment/);
  const forbidden=await fetch(base+'/api/paypal/sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scenarioId:'happy_path'})});
  assert.equal(forbidden.status,503);
  const aiForbidden=await fetch(base+'/api/ai/plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({goal:'Test error handling'})});
  assert.equal(aiForbidden.status,503);
  const traversal=await fetch(base+'/api/screenshots/notfound.png');assert.equal(traversal.status,404);
  const cors=await fetch(base+'/api/fixture/run',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://evil.example'},body:'{}'});assert.equal(cors.status,403);
 }finally{child.kill('SIGTERM');}
});
