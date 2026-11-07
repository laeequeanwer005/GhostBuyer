/** Lightweight Chromium DevTools Protocol runner. No npm dependencies.
 * It visits ONLY this project's loopback demonstration store.
 * No PayPal credential entry or hosted checkout is automated.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {ROOT,config} from './config.mjs';
const candidates=[config.chromePath,'/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome','/opt/google/chrome/chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
export function detectChrome(){return candidates.find(x=>fs.existsSync(x))||null;}
async function freePort(){return new Promise((resolve,reject)=>{let socket=net.createServer();socket.once('error',reject);socket.listen(0,'127.0.0.1',()=>{const port=socket.address().port;socket.close(()=>resolve(port));});});}
class CDP {
  constructor(ws){this.ws=ws;this.nextId=1;this.pending=new Map();ws.addEventListener('message',evt=>{
    let message;try{message=JSON.parse(String(evt.data));}catch{return;}
    if(!message.id)return;
    const job=this.pending.get(message.id);if(!job)return;
    this.pending.delete(message.id);
    if(message.error)job.reject(Error(message.error.message));else job.resolve(message.result||{});
  });}
  send(method,params={}) {return new Promise((resolve,reject)=>{const id=this.nextId++;let timer=setTimeout(()=>{this.pending.delete(id);reject(Error('Chromium command timed out: '+method));},10000);this.pending.set(id,{resolve:x=>{clearTimeout(timer);resolve(x);},reject:e=>{clearTimeout(timer);reject(e);}});this.ws.send(JSON.stringify({id,method,params}));});}
  eval(expression){return this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true}).then(r=>{
    if(r.exceptionDetails)throw Error(r.exceptionDetails.text||'Browser script failed');return r.result?.value;});}
  close(){this.ws.close();}
}
async function waitUntil(action,timeoutMs=12000){const until=Date.now()+timeoutMs;while(Date.now()<until){try{const value=await action();if(value)return value;}catch{}await delay(130);}throw Error('Browser observation timed out');}
async function startChrome(binary){
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ghostbuyer-chrome-'));
  const port=await freePort();
  const args=['--headless=new','--no-first-run','--no-default-browser-check','--disable-extensions','--disable-gpu','--disable-dev-shm-usage','--no-proxy-server',
    '--no-sandbox',`--user-data-dir=${temp}`,'--remote-debugging-address=127.0.0.1',`--remote-debugging-port=${port}`,'--window-size=1440,980','about:blank'];
  const proc=spawn(binary,args,{stdio:'ignore'});
  try{
    const page=await waitUntil(async()=>{
      const result=await fetch(`http://127.0.0.1:${port}/json/list`,{signal:AbortSignal.timeout(700)});
      const tabs=await result.json();return tabs.find(t=>t.type==='page'&&t.webSocketDebuggerUrl)?.webSocketDebuggerUrl;
    },10000);
    const ws=new WebSocket(page);await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
    return {cdp:new CDP(ws),proc,temp};
  } catch(error){proc.kill('SIGKILL');fs.rmSync(temp,{recursive:true,force:true});throw new Error('Cannot start headless Chromium: '+error.message);}
}
export async function runBrowser({sessionId,scenarioId,port}){
  const executable=detectChrome();
  if(!executable)throw Object.assign(new Error('Chromium not detected. Install Chrome/Chromium and configure CHROME_PATH to enable browser experiments.'),{status:503});
  const browser=await startChrome(executable),steps=[],errors=[];
  try{
    const cdp=browser.cdp;
    await cdp.send('Page.enable');await cdp.send('Runtime.enable');
    const url=`http://127.0.0.1:${port}/shop?session=${encodeURIComponent(sessionId)}`;
    await cdp.send('Page.navigate',{url});
    try { await waitUntil(()=>cdp.eval('Boolean(document.querySelector("[data-testid=checkout-trigger]"))')); } catch (e) { const debug=await cdp.eval('document.body?.innerText?.slice(0,500)');const err=new Error('Store page failed to load controls: '+debug);if(/is blocked|doesn.t allow/i.test(debug||''))err.status=503;throw err; }
    steps.push({action:'NAVIGATE',observation:'Real headless Chromium loaded the instrumented checkout',time:new Date().toISOString()});
    const click=async selector=>{
      const box=await cdp.eval(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)return null;el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
      if(!box)throw Error('Expected checkout control missing: '+selector);
      await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:box.x,y:box.y});
      await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',x:box.x,y:box.y,button:'left',clickCount:1});
      await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:box.x,y:box.y,button:'left',clickCount:1});
    };
    await click('[data-testid=checkout-trigger]');
    try { await waitUntil(()=>cdp.eval('Number(document.querySelector("[data-testid=callback-count]")?.textContent||0)>=1')); } catch (e) { const debug=await cdp.eval('document.body?.innerText?.slice(-500)');throw new Error('Store checkout callback did not complete: '+debug); }
    steps.push({action:'CHECKOUT_CLICK',observation:'Browser clicked the actual store button; first callback was processed',time:new Date().toISOString()});
    if(scenarioId==='double_click'){
      await waitUntil(()=>cdp.eval('Boolean(document.querySelector("[data-testid=retry-trigger]"))'));
      await click('[data-testid=retry-trigger]');
      await waitUntil(()=>cdp.eval('Number(document.querySelector("[data-testid=callback-count]")?.textContent||0)>=2'));
      steps.push({action:'DUPLICATE_CALLBACK',observation:'Browser re-delivered callback; the payment adapter performed no new capture',time:new Date().toISOString()});
    }
    const observed=await cdp.eval('({provider:document.querySelector("[data-testid=provider-state]")?.textContent,fulfillments:document.querySelector("[data-testid=fulfillment-count]")?.textContent,callbacks:document.querySelector("[data-testid=callback-count]")?.textContent})');
    steps.push({action:'INSPECT_DOM',observation:JSON.stringify(observed),time:new Date().toISOString()});
    const shot=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    const fileName=`${sessionId}.png`;
    const screenshot=path.join(ROOT,'data','screenshots',fileName);fs.mkdirSync(path.dirname(screenshot),{recursive:true});
    fs.writeFileSync(screenshot,Buffer.from(shot.data,'base64'));
    browser.cdp.close();
    return {steps,consoleErrors:errors,screenshot:`/api/screenshots/${fileName}`,observed};
  }finally{
    browser.proc.kill('SIGKILL');
    await delay(100);
    try{fs.rmSync(browser.temp,{recursive:true,force:true,maxRetries:3,retryDelay:100});}catch{}
  }
}
