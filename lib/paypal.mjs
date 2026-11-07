import {randomUUID} from 'node:crypto';
import {config,paypalConfigured} from './config.mjs';
// Intentionally NO support for live money: the API endpoint is fixed to Sandbox.
const BASE='https://api-m.sandbox.paypal.com';
let token='';let expiry=0;
const SUPPORTED_ERRORS=['INSTRUMENT_DECLINED','TRANSACTION_REFUSED'];
export async function bearer(){
  if(!paypalConfigured())throw Object.assign(new Error('Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env'),{status:503});
  if(token && Date.now()<expiry-60000)return token;
  const auth=Buffer.from(config.paypalClientId+':'+config.paypalSecret).toString('base64');
  let res;
  try{res=await fetch(BASE+'/v1/oauth2/token',{method:'POST',headers:{Authorization:'Basic '+auth,'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(15000)});}
  catch{throw Object.assign(new Error('PayPal Sandbox OAuth network error'),{status:502});}
  const json=await res.json().catch(()=>({}));
  if(!res.ok||!json.access_token)throw Object.assign(new Error('PayPal Sandbox credentials rejected; check the Business app credentials'),{status:502});
  token=json.access_token;expiry=Date.now()+Number(json.expires_in||300)*1000;
  return token;
}
export async function paypalRequest(path,{method='GET',body,requestId,mockError}={}){
  if(!/^\/v2\/checkout\/orders(?:\/|$)/.test(path))throw new Error('Disallowed PayPal Sandbox API path');
  if(mockError && !SUPPORTED_ERRORS.includes(mockError))throw Object.assign(new Error('Negative test not allowed'),{status:400});
  if(mockError && !config.negativeTesting)throw Object.assign(new Error('Enable negative testing in .env and on your sandbox merchant account'),{status:409});
  const authorization=await bearer();
  const headers={'Authorization':'Bearer '+authorization,'Content-Type':'application/json','Accept':'application/json'};
  if(requestId)headers['PayPal-Request-Id']=requestId;
  if(mockError)headers['PayPal-Mock-Response']=JSON.stringify({mock_application_codes:mockError});
  let res;
  try{res=await fetch(BASE+path,{method,headers,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});}
  catch{throw Object.assign(new Error('Could not reach PayPal Sandbox; payment outcome must be reconciled'),{status:502});}
  const data=await res.json().catch(()=>({}));
  return {ok:res.ok,httpStatus:res.status,data,debugId:res.headers.get('paypal-debug-id')||data.debug_id||null};
}
function validOrderId(id){if(!/^[A-Z0-9]{10,32}$/.test(id))throw Object.assign(new Error('Invalid PayPal order identifier'),{status:400});}
export async function createOrder(){
  return paypalRequest('/v2/checkout/orders',{method:'POST',requestId:randomUUID(),body:{
    intent:'CAPTURE',purchase_units:[{reference_id:'GHOSTBUYER-DEMO',description:'Orbit Digital Asset Pack (Sandbox test)',amount:{currency_code:'USD',value:'12.00'}}],
  }});
}
export async function captureOrder(id,{requestId,mockError}={}){
  validOrderId(id);
  return paypalRequest(`/v2/checkout/orders/${id}/capture`,{method:'POST',requestId:requestId||randomUUID(),mockError});
}
export async function retrieveOrder(id){validOrderId(id);return paypalRequest(`/v2/checkout/orders/${id}`);}
