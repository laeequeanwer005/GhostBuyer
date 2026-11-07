import test from 'node:test';
import assert from 'node:assert/strict';
// The environment is set BEFORE dynamic import of config/paypal.
process.env.PAYPAL_CLIENT_ID='SANDBOX_FAKE_CLIENT_ID';
process.env.PAYPAL_CLIENT_SECRET='SANDBOX_FAKE_SECRET';
process.env.ENABLE_NEGATIVE_TESTING='true';
const {createOrder,captureOrder,retrieveOrder}=await import('../lib/paypal.mjs');
function fake(ok,status,data){return {ok,status,headers:{get:k=>k==='paypal-debug-id'?'DBG-TEST':null},json:async()=>data};}
test('sandbox calls use fixed Sandbox host and server-side credentials',async()=>{
  const old=global.fetch,calls=[];
  global.fetch=async(url,args={})=>{calls.push({url:String(url),args});
    if(String(url).endsWith('/v1/oauth2/token'))return fake(true,200,{access_token:'LOCAL_FAKE_OAUTH',expires_in:3600});
    if(String(url).endsWith('/v2/checkout/orders'))return fake(true,201,{id:'7FJ123456789',status:'CREATED'});
    if(String(url).endsWith('/capture'))return fake(false,422,{name:'UNPROCESSABLE_ENTITY',details:[{issue:'INSTRUMENT_DECLINED'}]});
    return fake(true,200,{status:'APPROVED',purchase_units:[{}]});
  };
  try{
    const created=await createOrder();assert.equal(created.data.id,'7FJ123456789');
    const body=JSON.parse(calls.find(c=>c.url.endsWith('/v2/checkout/orders')).args.body);
    assert.equal(body.purchase_units[0].amount.value,'12.00');
    const captured=await captureOrder('7FJ123456789',{requestId:'unique-retry-token',mockError:'INSTRUMENT_DECLINED'});
    assert.equal(captured.ok,false);assert.equal(captured.data.details[0].issue,'INSTRUMENT_DECLINED');
    const captureRequest=calls.find(c=>c.url.endsWith('/capture')).args;
    assert.equal(captureRequest.headers['PayPal-Request-Id'],'unique-retry-token');
    assert.equal(JSON.parse(captureRequest.headers['PayPal-Mock-Response']).mock_application_codes,'INSTRUMENT_DECLINED');
    const reviewed=await retrieveOrder('7FJ123456789');assert.equal(reviewed.data.status,'APPROVED');
    assert.ok(calls.every(c=>c.url.startsWith('https://api-m.sandbox.paypal.com/')));
    assert.ok(!JSON.stringify(body).includes('SANDBOX_FAKE_SECRET'));
    await assert.rejects(()=>captureOrder('https://evil.example'),/Invalid PayPal order identifier/);
    await assert.rejects(()=>captureOrder('7FJ123456789',{mockError:'ANY_CODE'}),/Negative test not allowed/);
  }finally{global.fetch=old;}
});
