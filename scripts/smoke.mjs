// Does not create any PayPal transactions. Smoke-test localhost API with running server.
const base=process.env.GHOSTBUYER_URL||'http://127.0.0.1:3100';
for(const scenarioId of ['capture_declined','double_click','network_drop','happy_path']){
 for(const implementation of ['vulnerable','fixed']){
  const r=await fetch(base+'/api/fixture/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scenarioId,implementation})});
  const data=await r.json();if(!r.ok)throw Error(data.error);
  const expectPass=implementation==='fixed'||scenarioId==='happy_path';
  if(data.run.verdict.passed!==expectPass)throw Error('Unexpected verdict: '+scenarioId+'/'+implementation);
  console.log(`${data.run.verdict.passed?'PASS':'FOUND'} ${scenarioId.padEnd(18)} ${implementation}  [CONTROLLED FIXTURE]`);
 }
}
console.log('Smoke complete: eight deterministic scenarios executed. Not a live PayPal integration test.');
