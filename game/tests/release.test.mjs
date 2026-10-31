import test from 'node:test';import assert from 'node:assert/strict';import {socketURL} from '../public/connection.mjs';
import {buildProduction} from '../build-production.mjs';
import {loadWorld} from '../server.mjs';import {Match} from '../simulation.mjs';
test('same-host local/LAN and split HTTPS frontend select correct socket origin',()=>{
 assert.equal(socketURL({origin:'http://192.168.1.50:8897',protocol:'http:'},{}),'ws://192.168.1.50:8897/ws');
 assert.equal(socketURL({origin:'https://slap.example',protocol:'https:'},{serverURL:'https://relay.example'}),'wss://relay.example/ws');
 assert.throws(()=>socketURL({origin:'https://slap.example',protocol:'https:'},{serverURL:'http://relay.example'}));
 assert.throws(()=>socketURL({origin:'https://slap.example',protocol:'https:'},{serverURL:'https://user:secret@relay.example'}));
});
test('production build rejects missing, localhost, LAN and non-HTTPS endpoints before touching output',()=>{
 for(const serverURL of ['', 'http://localhost:8897','https://localhost','https://127.0.0.1','https://192.168.1.2','https://relay.example/ws','https://relay.example/?token=secret'])assert.throws(()=>buildProduction({serverURL}));
});
test('recorded castle-corner stall first recentres onto the certified path and moves away',()=>{
 const world=loadWorld(),m=new Match({...world,seed:22,difficulty:'easy',players:[{id:'a',name:'Corner',bot:true},{id:'b',name:'Human'}]});m.activeRings=9;m.beginRound();const p=m.players[0];for(const q of m.players)q.slapper=false;Object.assign(p,{x:-2.5405292529427506,y:0,z:-12.577060306879222,grounded:true,roamTarget:{x:-11.4,z:-13.8},roamUntil:100});const path=m.nav.route(p,p.roamTarget,9);assert.ok(Math.abs(path[0].x+2.4)<.001);assert.ok(Math.abs(path[0].z+12.6)<.001);const start={x:p.x,z:p.z};for(let i=0;i<180;i++)m.step();assert.ok(Math.hypot(p.x-start.x,p.z-start.z)>1);
});
test('opposing bots steer around survivor bodies instead of waiting in a shared route',()=>{
 const m=new Match({...loadWorld(),seed:22,difficulty:'easy',players:[{id:'a',bot:true},{id:'b',bot:true},{id:'c'}]});m.activeRings=9;m.beginRound();for(const p of m.players)p.slapper=false;const [a,b,c]=m.players;Object.assign(c,{x:0,y:1.27,z:4});for(const [p,z,target] of [[a,0,5],[b,.7,-5]])Object.assign(p,{x:25,y:0,z,grounded:true,thinkAt:100,planPhase:'round',planRings:9,route:[{x:25,y:0,z:target}]});for(let i=0;i<180;i++)m.step();assert.ok(a.z>1.5);assert.ok(b.z<-1.5);
});
test('stair-edge stuck recovery chooses a detour clear from the actual offset position',()=>{
 const m=new Match({...loadWorld(),seed:22,difficulty:'easy',players:[{id:'a',bot:true},{id:'b'}]});m.activeRings=9;m.beginRound();for(const p of m.players)p.slapper=false;const p=m.players[0];Object.assign(m.players[1],{x:0,y:1.27,z:4});Object.assign(p,{x:1.4245955792260392,y:.800000011920929,z:11.842514963405492,grounded:true,navWanted:true,stuckAnchor:{x:1.4245955792260392,z:11.842514963405492,at:m.time-1.6},roamTarget:{x:-6.6,z:15.6},roamUntil:100});const start={x:p.x,z:p.z};for(let i=0;i<150;i++)m.step();assert.ok(p.stuckRecoveries>0);assert.ok(Math.hypot(p.x-start.x,p.z-start.z)>.8);
});
test('the formerly lodged stair-lip position escapes on the shared capsule controller',()=>{
 const m=new Match({...loadWorld(),seed:22,difficulty:'easy',players:[{id:'a',bot:true},{id:'b'}]});m.activeRings=9;m.beginRound();for(const p of m.players)p.slapper=false;const p=m.players[0];Object.assign(m.players[1],{x:0,y:1.27,z:4});Object.assign(p,{x:-1.2,y:1.100000023841858,z:-11.7298529961751,grounded:true,navWanted:true,roamTarget:{x:7.2,z:-10.8},roamUntil:100});const start={x:p.x,z:p.z};for(let i=0;i<360;i++)m.step();assert.ok(Math.hypot(p.x-start.x,p.z-start.z)>1.5);assert.ok(m.arena.capsuleDepth(p.x,p.y,p.z,9)<.006);
});
