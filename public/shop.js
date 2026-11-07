const $=id=>document.getElementById(id);
const sessionId=new URLSearchParams(location.search).get('session');
const state={session:null,config:null,working:false};
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&quot;'}[ch]));
async function api(url,payload){const res=await fetch(url,{method:payload===undefined?'GET':'POST',headers:{'Content-Type':'application/json'},body:payload===undefined?undefined:JSON.stringify(payload)});const data=await res.json();if(!res.ok)throw Error(data.error||'Request failed');return data;}
function message(text,error=false){const node=$('shop-message');node.textContent=text;node.classList.toggle('error',Boolean(error));}
function renderSession(s){state.session=s;const sandbox=s.mode==='paypal_sandbox';
  $('shop-mode-badge').textContent=sandbox?'REAL PAYPAL SANDBOX':'LOCAL FIXTURE · NO PAYMENT';
  $('shop-environment').textContent=sandbox?'PayPal Sandbox REST API':'Controlled local fixture';
  const labels={capture_declined:'Unlucky Buyer: tests whether access is mistakenly granted after a rejected capture.',double_click:'Impatient Buyer: duplicate callback is delivered without making a second payment.',network_drop:'Disconnected Buyer: merchant cannot verify capture outcome.',happy_path:'Normal Buyer: completed capture should unlock once.'};
  $('shop-scenario-text').textContent=labels[s.scenarioId]+' Merchant mode: '+(s.implementation==='vulnerable'?'INTENTIONALLY VULNERABLE.':'FIXED.');
  $('shop-provider').textContent=s.providerState.replaceAll('_',' ');
  $('shop-grants').textContent=s.fulfillments;$('shop-callbacks').textContent=s.callbacks;
  $('shop-retry').hidden=!(s.scenarioId==='double_click'&&s.callbacks===1);
  $('shop-reconcile').hidden=!(sandbox&&s.orderId&&s.captureAttempted!==false);
  const verdict=$('shop-verdict');verdict.className='shop-verdict'+(s.completed?(s.checks.passed?' pass':' fail'):'');
  verdict.textContent=!s.completed?'No checkout executed yet.':s.checks.passed?'✓ CHECKS PASSED · Store behavior is consistent with confirmed payment':'✕ DEFECT DETECTED · The merchant violated a payment invariant';
  const root=$('shop-event-list');root.innerHTML=s.events.map(x=>`<div class="shop-event"><span class="event-mark">${x.type==='FAULT'?'!':'◉'}</span><div><b>${escapeHTML(x.title)}</b><p>${escapeHTML(x.detail)} · ${escapeHTML(x.source)}</p></div></div>`).join('')||'<p>No events yet.</p>';
  if(!sandbox){$('fixture-checkout').hidden=s.callbacks>0;$('paypal-button-area').hidden=true;}
}
async function refresh(){const {session}=await api('/api/shop/'+sessionId);renderSession(session);}
async function fixtureClick(action){if(state.working)return;state.working=true;try{const {session}=await api('/api/shop/'+sessionId+'/action',{action});renderSession(session);message(action==='retry'?'Duplicate callback delivered. No additional provider capture was made.':'Fixture test executed; these are controlled values, not PayPal transactions.');}catch(e){message(e.message,true);}finally{state.working=false;}}
async function setupPayPal(){if(!state.config.paypalConfigured){message('PayPal Sandbox not configured. Add client ID and secret to .env, then restart.',true);return;}
  const container=$('paypal-button-area');container.hidden=false;$('fixture-checkout').hidden=true;
  if(state.session.scenarioId==='capture_declined'&&!state.config.negativeTestingEnabled){message('Enable negative testing for your merchant account and ENABLE_NEGATIVE_TESTING=true in .env.',true);return;}
  const script=document.createElement('script');script.src='https://www.sandbox.paypal.com/web-sdk/v6/core';script.async=true;
  script.onload=async()=>{try{
    const sdk=await window.paypal.createInstance({clientId:state.config.paypalClientId,components:['paypal-payments'],pageType:'checkout'});
    const eligible=await sdk.findEligibleMethods({currencyCode:'USD'});
    if(!eligible.isEligible('paypal'))throw Error('PayPal is not eligible in this browser / Sandbox account.');
    const paymentSession=await sdk.createPayPalOneTimePaymentSession({
      async onApprove(data){try{
        message('Buyer approved. Capturing with Sandbox and reconciling provider truth…');
        const {session,captureStatus,paypalIssue}=await api(`/api/paypal/sessions/${sessionId}/capture`,{orderId:data.orderId});
        renderSession(session);message('Sandbox capture '+captureStatus+(paypalIssue?' ('+paypalIssue+')':'')+'. Check evidence in dashboard.');
      }catch(e){message('Capture result unknown: '+e.message+' — reconcile before fulfilling.',true);await refresh();}},
      onCancel(){message('Sandbox buyer cancelled; no capture performed.');},
      onError(error){message('Checkout error: '+(error?.message||'PayPal SDK error'),true);},
    });
    const button=document.createElement('paypal-button');container.replaceChildren(button);
    button.addEventListener('click',async()=>{try{
      const promise=api(`/api/paypal/sessions/${sessionId}/create`,{}).then(d=>({orderId:d.orderId}));
      await paymentSession.start({presentationMode:'auto'},promise);
    }catch(e){message('Could not launch PayPal approval: '+e.message,true);}});
    message('Sandbox button ready. Log in with your Sandbox Personal buyer account, not a real account.');
  }catch(e){message('Sandbox SDK initialization: '+e.message,true);}};
  script.onerror=()=>message('Could not download PayPal Sandbox JS SDK v6. Check your network.',true);
  document.head.append(script);
}
$('fixture-checkout').addEventListener('click',()=>fixtureClick('checkout'));
$('shop-retry').addEventListener('click',async()=>{try{if(state.session.mode==='fixture')return await fixtureClick('retry');const {session}=await api(`/api/paypal/sessions/${sessionId}/duplicate`,{});renderSession(session);message('Locally simulated duplicate callback, no additional PayPal API capture.');}catch(e){message(e.message,true);}});
$('shop-reconcile').addEventListener('click',async()=>{try{const {session}=await api(`/api/paypal/sessions/${sessionId}/reconcile`,{});renderSession(session);message('Sandbox order retrieved and reconciled.');}catch(e){message(e.message,true);}});
(async()=>{try{if(!sessionId)throw Error('Missing test session ID. Launch a new checkout from the lab.');const [c,s]=await Promise.all([api('/api/status'),api('/api/shop/'+sessionId)]);state.config=c;renderSession(s.session);if(s.session.mode==='paypal_sandbox')await setupPayPal();else message('Local scenario ready. This mode performs NO real PayPal transactions.');}catch(e){message(location.protocol==='file:'?'The demo storefront requires the Node.js server. Open the offline dashboard preview instead, or run npm start and launch a test at http://127.0.0.1:3100.':e.message,true);}})();
