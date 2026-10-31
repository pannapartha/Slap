import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {Match,RULES,gravityAtAltitude,HALF_GRAVITY_ALTITUDE} from '../simulation.mjs';import {loadWorld} from '../server.mjs';
const world=loadWorld(),players=(n,bot=false)=>Array.from({length:n},(_,i)=>({id:'p'+i,name:'Bop '+i,bot}));
const make=(n=10,bombs=3,options={})=>new Match({players:players(n),bombs,...world,seed:77,roundRange:[100,100],...options});
function until(m,phase,max=30000){for(let i=0;i<max&&m.phase!==phase;i++)m.step();assert.equal(m.phase,phase)}

test('distinct ownership, cap, exact freeze interval, synchronized blast and innocent survivor safety',()=>{
 const m=make();until(m,'round');assert.equal(m.alive.filter(p=>p.slapper).length,3);m.fuseEnd=m.deadline=m.tick+1;m.step();assert.equal(m.phase,'freeze');const frozen=m.alive.filter(p=>p.frozen),positions=frozen.map(p=>[p.x,p.y,p.z]);assert.equal(frozen.length,3);const freezeTick=m.tick;
 for(let i=0;i<89;i++){for(const p of frozen)m.setInput(p.id,{seq:i+1,actionSeq:i+1,x:1,z:1,yaw:1,jump:true,dash:true,slap:true});m.step();assert.equal(m.phase,'freeze');frozen.forEach((p,j)=>assert.deepEqual([p.x,p.y,p.z],positions[j]));assert.equal(m.slap(frozen[0]),false);}
 m.step();assert.equal(m.tick-freezeTick,90);assert.equal(m.phase,'warning');assert.equal(m.alive.length,7);assert.equal(m.warningRings.length,3);assert.deepEqual(m.warningRings,['ring_09','ring_08','ring_07']);const e=m.events.find(e=>e.type==='explosion');assert.equal(e.centres.length,3);assert.equal(new Set(m.players.filter(p=>!p.alive).map(p=>p.eliminatedAt)).size,1);assert.ok(m.alive.every(p=>!p.frozen));
 const cap=make(2,3);until(cap,'round');assert.equal(cap.alive.filter(p=>p.slapper).length,1);
});

test('passing requires authoritative range, facing, line of sight and cooldown',()=>{
 const m=make(2,1);until(m,'round');const [a,b]=m.players;Object.assign(a,{x:0,y:1.28,z:4,yaw:0,slapper:true});Object.assign(b,{x:0,y:1.28,z:5.5,slapper:false,passProtectedUntil:0});assert.equal(m.slap(a),true);assert.equal(a.slapper,false);assert.equal(b.slapper,true);assert.equal(m.events.at(-1).type,'pass');assert.equal(m.slap(a),false);
 a.slapAt=-100;a.slapper=true;b.slapper=false;b.passProtectedUntil=0;b.z=8;assert.equal(m.slap(a),false);a.slapAt=-100;b.z=2;assert.equal(m.slap(a),false);
 Object.assign(a,{x:0,z:-1,slapAt:-100});Object.assign(b,{x:0,z:-4});a.yaw=Math.PI;assert.equal(world.arena.lineClear(a,b,9),false);assert.equal(m.slap(a),false);
});

test('five-second warning changes authoritative collision rings only at the detach tick',()=>{
 const m=make();until(m,'round');m.deadline=m.tick+1;m.step();until(m,'warning');for(const [j,p] of m.alive.entries())Object.assign(p,{x:-3+j,y:1.19,z:4,grounded:true});const at=m.tick;for(let i=0;i<299;i++){m.step();assert.equal(m.activeRings,9);}m.step();assert.equal(m.tick-at,300);assert.equal(m.activeRings,6);assert.equal(m.phase,'ascent');assert.ok(!world.arena.inside(46,0,m.activeRings));until(m,'round');assert.ok(m.altitude>0);assert.ok(m.gravity<9.81);
});

test('inverse-square gravity is exact; constant impulse produces approximately double jump height at half gravity',()=>{
 assert.equal(gravityAtAltitude(0),9.81);assert.ok(Math.abs(gravityAtAltitude(HALF_GRAVITY_ALTITUDE)/9.81-.5)<1e-12);
 const heights=[];for(const g of [9.81,4.905]){const m=make(2);until(m,'round');const p=m.players[0];Object.assign(p,{x:0,z:4,y:1.28,grounded:true});m.gravity=g;m.setInput(p.id,{seq:1,actionSeq:1,jump:true,x:0,z:0,yaw:0});let max=p.y;for(let i=0;i<240;i++){m.step();max=Math.max(max,p.y);}heights.push(max-1.28);assert.ok(p.grounded);assert.ok(Math.abs(p.y-1.28)<.15);}assert.ok(heights[1]/heights[0]>1.95&&heights[1]/heights[0]<2.1);
});

test('jump and dash intents are edge-triggered; dash cooldown cannot be bypassed by repeated inputs',()=>{
 const m=make(2);until(m,'round');const p=m.players[0];Object.assign(p,{x:0,z:4,y:1.28,grounded:true});m.setInput(p.id,{seq:1,actionSeq:1,jump:true,dash:true,x:0,z:1,yaw:0});m.step();assert.equal(p.jumpSeq,1);assert.equal(p.dashSeq,1);for(let i=0;i<30;i++){m.setInput(p.id,{seq:i+2,actionSeq:i+2,jump:true,dash:true,x:0,z:1,yaw:0});m.step();}assert.equal(p.dashSeq,1);assert.equal(p.jumpSeq,1);assert.ok(Math.hypot(p.vx,p.vz)<=27.01);
});

test('opened city connects every supported route and bounds all 24 collapse paths below five seconds',()=>{
 const report=JSON.parse(fs.readFileSync(new URL('../evidence/escape-paths.json',import.meta.url)));assert.equal(report.length,24);for(const r of report){assert.equal(r.unreachable,0);assert.ok(r.cells>1500);assert.ok(r.maxPathMetres/RULES.sprintSpeed+.4<5,JSON.stringify(r));}
});
test('a complete ten-bot three-Slapper match ends with one winner; rematch parity alternates dances',()=>{
 const m=make(10,3,{players:players(10,true),roundRange:[10,10]});const log=new Map();for(let i=0;i<30000&&m.phase!=='won';i++){m.step();for(const e of m.events)log.set(e.seq,e);}assert.equal(m.phase,'won');assert.equal(m.alive.length,1);assert.ok(m.winner);assert.equal(m.activeRings,0);assert.ok([...log.values()].some(e=>e.type==='pass'));assert.ok([...log.values()].some(e=>e.type==='explosion'&&e.centres.length===3));assert.equal(m.snapshot().dance,'VictoryA');assert.equal(make(2,1,{matchNumber:2}).snapshot().dance,'VictoryB');
 fs.writeFileSync(new URL('../evidence/simulation-match.json',import.meta.url),JSON.stringify({time:m.time,winner:m.winner,rounds:m.round,altitude:m.altitude,gravity:m.gravity,events:[...log.values()]},null,2));
});
