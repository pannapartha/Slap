import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {WebSocket} from 'ws';
import {productionOrigin} from '../deployment/origin.mjs';import {prepareOutput,gameRoot} from '../deployment/artifacts.mjs';import {createGameServer,parseAllowedOrigins} from '../server.mjs';
import {checkPublicHealth} from '../deployment/check-public.mjs';
test('public deployment build gate requires genuine SLAP health and refuses redirects',async()=>{
 const previous=globalThis.fetch;try{
  globalThis.fetch=async(url,options)=>{assert.equal(options.redirect,'error');assert.equal(url,'https://unit-health-guard.up.railway.app/health');return {ok:true,json:async()=>({ok:true,game:'PASS THE BOMB'})}};
  assert.equal(await checkPublicHealth('https://unit-health-guard.up.railway.app'),'https://unit-health-guard.up.railway.app');
  globalThis.fetch=async()=>({ok:true,json:async()=>({ok:true,game:'different service'})});await assert.rejects(checkPublicHealth('https://unit-health-guard.up.railway.app'));
 }finally{globalThis.fetch=previous;}
});
test('production origin rejects placeholder, local, insecure and credential-bearing endpoints',()=>{
 for(const s of ['', 'https://slap-game-server.example.com','https://relay.example','https://demo.invalid','https://localhost','https://127.0.0.2','https://192.168.1.2','https://[::1]','http://host.up.railway.app','https://user:password@host.up.railway.app','https://host.up.railway.app/ws'])assert.throws(()=>productionOrigin(s));
 assert.equal(productionOrigin('https://unit-origin-guard.up.railway.app/'),'https://unit-origin-guard.up.railway.app');
 assert.deepEqual(parseAllowedOrigins(' https://front.vercel.app/ ,https://other.vercel.app'),['https://front.vercel.app','https://other.vercel.app']);assert.throws(()=>parseAllowedOrigins('https://front.vercel.app/path'));
});
test('rebuilding staged output preserves old bytes and rejects unrelated directories',()=>{
 fs.mkdirSync(path.join(gameRoot,'archive/deployment-artifacts'),{recursive:true});
 const out=path.join(gameRoot,'release/preflight/preserve-probe-'+Date.now());fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'previous.txt'),'working artifact');const before=new Set(fs.readdirSync(path.join(gameRoot,'archive/deployment-artifacts')));prepareOutput(out);
 const dir=fs.readdirSync(path.join(gameRoot,'archive/deployment-artifacts')).find(p=>!before.has(p));assert.equal(fs.readFileSync(path.join(gameRoot,'archive/deployment-artifacts',dir,'previous.txt'),'utf8'),'working artifact');assert.throws(()=>prepareOutput(gameRoot));
});
test('Railway lockfile is self contained, production-only and aligned with package dependencies',()=>{
 const p=JSON.parse(fs.readFileSync(new URL('../deployment/server.package.json',import.meta.url))),l=JSON.parse(fs.readFileSync(new URL('../deployment/server.package-lock.json',import.meta.url)));
 assert.deepEqual(Object.keys(p.dependencies).sort(),['@fontsource/dm-sans','three','ws']);assert.deepEqual(p.dependencies,l.packages[''].dependencies);assert.ok(!p.devDependencies);
 for(const [k,v] of Object.entries(l.packages)){assert.ok(!v.link&&!k.startsWith('..'));if(k)assert.ok(v.resolved.startsWith('https://registry.npmjs.org/'));}assert.equal(p.scripts.start,'node Slap/game/server.mjs');const railway=JSON.parse(fs.readFileSync(new URL('../deployment/railway.json',import.meta.url)));assert.equal(railway.deploy.startCommand,p.scripts.start);
});
const open=(url,origin)=>new Promise((resolve,reject)=>{const ws=new WebSocket(url,{origin});ws.once('error',reject);ws.once('open',()=>resolve(ws))});
const message=ws=>new Promise(resolve=>ws.once('message',b=>resolve(JSON.parse(b))));
test('production handshake is closed by default and configured server enforces ten seats then closes gracefully',async()=>{
 const denied=createGameServer({port:0,quiet:true,production:true,allowedOrigins:[]}),dp=await denied.listen();
 try{await new Promise((resolve,reject)=>{const w=new WebSocket(`ws://127.0.0.1:${dp}/ws`,{origin:'https://front.test'});w.on('unexpected-response',(_,r)=>{assert.equal(r.statusCode,401);r.resume();resolve()});w.on('open',()=>{w.close();reject(Error('Default production origin policy was open'))});w.on('error',()=>{})})}finally{await denied.close()}
 const origin='https://front.test',app=createGameServer({port:0,quiet:true,production:true,allowedOrigins:[origin]}),port=await app.listen(),peers=[];
 try{
  const url=`ws://127.0.0.1:${port}/ws`;let code;
  for(let i=0;i<10;i++){const ws=await open(url,origin);peers.push(ws);const next=message(ws);ws.send(JSON.stringify(i?{t:'join',code,name:'Seat '+i}:{t:'create',name:'Host'}));const seat=await next;assert.equal(seat.t,'seat');code=seat.code;}
  const overflow=await open(url,origin);peers.push(overflow);const next=message(overflow);overflow.send(JSON.stringify({t:'join',code}));assert.match((await next).message,/full/);assert.equal(app.rooms.get(code).members.length,10);
  const closed=Promise.all(peers.map(ws=>new Promise(resolve=>ws.once('close',(code)=>resolve(code)))));await app.close();assert.ok((await closed).every(c=>c===1012));await app.close();
 }finally{for(const w of peers)w.terminate();await app.close()}
});
