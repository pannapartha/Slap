import {fileURLToPath} from 'node:url';import {WebSocket} from 'ws';import {productionOrigin} from './origin.mjs';
export async function checkPublicHealth(value){
 const serverURL=productionOrigin(value);const r=await fetch(serverURL+'/health',{signal:AbortSignal.timeout(10000),redirect:'error'});if(!r.ok)throw Error('Public server /health did not return 200');const h=await r.json();if(h.ok!==true||h.game!=='PASS THE BOMB')throw Error('Public HTTPS origin is not the SLAP game server');return serverURL;
}
async function seat(serverURL,origin,message){
 return new Promise((resolve,reject)=>{const ws=new WebSocket(serverURL.replace('https:','wss:')+'/ws',{origin});const timer=setTimeout(()=>{ws.terminate();reject(Error('Public WSS timed out'))},10000);timer.unref();
  ws.on('error',()=>{clearTimeout(timer);reject(Error('Public WSS failed: check SLAP_ALLOWED_ORIGINS, TLS and Railway logs'))});ws.on('open',()=>ws.send(JSON.stringify(message)));ws.on('message',b=>{let m;try{m=JSON.parse(b)}catch{return}if(m.t==='error'){clearTimeout(timer);ws.close();reject(Error('Public server rejected room request'));}if(m.t==='seat'){clearTimeout(timer);resolve({ws,code:m.code})}});
 });
}
export async function checkPublic(frontendValue,serverValue){
 const frontend=productionOrigin(frontendValue),serverURL=await checkPublicHealth(serverValue);const page=await fetch(frontend+'/',{signal:AbortSignal.timeout(10000),redirect:'error'});if(!page.ok||!(await page.text()).includes('<title>SLAP'))throw Error('Frontend is not publicly serving SLAP; check routing/deployment protection');
 const r=await fetch(frontend+'/runtime-config.js',{signal:AbortSignal.timeout(10000),redirect:'error'});if(!r.ok)throw Error('Frontend runtime-config.js is missing');const m=(await r.text()).match(/SLAP_CONFIG\s*=\s*(\{[^;]+\})/);if(!m||productionOrigin(JSON.parse(m[1]).serverURL)!==serverURL)throw Error('Frontend was built against a different server; rebuild it');
 let a,b;try{a=await seat(serverURL,frontend,{t:'create',name:'Deploy check'});b=await seat(serverURL,frontend,{t:'join',code:a.code,name:'Join check'});return {frontend,serverURL,httpsHealth:'PASS',wssCreateJoin:'PASS'};}finally{a?.ws.close();b?.ws.close();}
}
if(process.argv[1]===fileURLToPath(import.meta.url)){try{const r=await checkPublic(process.argv[2],process.env.SLAP_SERVER_URL);console.log(JSON.stringify(r,null,2))}catch(e){console.error(e.message);process.exitCode=1}}
