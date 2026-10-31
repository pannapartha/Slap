import test from 'node:test';import assert from 'node:assert/strict';
import {Arena} from '../public/arena.mjs';import {Match,RULES} from '../simulation.mjs';import {loadWorld} from '../server.mjs';import {validColor,RECOVERY} from '../public/character-options.mjs';
import * as T from 'three';import {AscentPresentation} from '../public/ascent.mjs';
const world=loadWorld(),make=()=>new Match({...world,seed:42,players:Array.from({length:10},(_,i)=>({id:'p'+i,name:'Bop '+i,color:i%8})),bombs:3});
function quad(a,b,c,d){return [...a,...b,...c,0,...a,...c,...d,0]}
test('swept full capsule cannot tunnel through a thin wall, overhead slab or landing platform',()=>{
 const floor=quad([-5,0,-5],[-5,0,5],[5,0,5],[5,0,-5]),wall=quad([1,0,-5],[1,4,-5],[1,4,5],[1,0,5]),ceiling=quad([-5,1.5,-5],[5,1.5,-5],[5,1.5,5],[-5,1.5,5]);
 const a=new Arena(new Float32Array([...floor,...wall,...ceiling])),p={x:0,y:0,z:0,grounded:false};assert.equal(a.vertical(p,2,9),true);assert.ok(p.y<=.303&&p.y>.29);assert.ok(a.capsuleDepth(p.x,p.y,p.z,9)<.003);a.move(p,4,0,9);assert.ok(p.x<.704);assert.ok(a.capsuleDepth(p.x,p.y,p.z,9)<.003);
 const platform=new Arena(new Float32Array(quad([-3,1.4,-3],[-3,1.4,3],[3,1.4,3],[3,1.4,-3]))),fall={x:0,y:4,z:0,grounded:false};platform.vertical(fall,-8,9);assert.ok(Math.abs(fall.y-1.4)<.005);assert.ok(platform.capsuleDepth(0,fall.y,0,9)<.003);
});
test('real staircase jump/dash paths stay outside collider surfaces and land safely',()=>{
 for(const [x,z] of [[0,12],[1.2,11.8],[12,0],[-12,0],[0,-12],[25,0]]){
  const m=make(),p=m.players[0];m.beginRound();m.deadline=m.fuseEnd=m.tick+2000;Object.assign(p,{x,z,y:world.arena.groundHeight(x,z,3,9),grounded:true,slapper:false});let airborne=0,depth=world.arena.capsuleDepth(p.x,p.y,p.z,9);
  for(let i=0;i<150;i++){m.setInput(p.id,{seq:i,actionSeq:i===0?1:i<25?1:2,x:Math.abs(x)>10?-Math.sign(x):0,z:Math.abs(z)>10?-Math.sign(z):0,yaw:0,jump:i===0,dash:i===25});m.step();if(!p.grounded){airborne++;const current=world.arena.capsuleDepth(p.x,p.y,p.z,9);assert.ok(current<=Math.max(.006,depth+.001),JSON.stringify({x,z,i,current,depth,p:[p.x,p.y,p.z]}));depth=current;}else depth=world.arena.capsuleDepth(p.x,p.y,p.z,9);assert.ok(Number.isFinite(p.y)&&p.y>-1);}
  assert.ok(airborne>0);assert.ok(p.grounded,JSON.stringify({x,z,p:[p.x,p.y,p.z]}));
 }
});
test('cinematic freezes every body/input/cooldown; first 2.5s then 1.5s; next fuse starts after return',()=>{
 const m=make();m.beginRound();m.players.forEach(p=>Object.assign(p,{x:0,y:1.28,z:4,vx:1,vy:2,vz:1,dashAt:m.time-.5}));
 for(const seconds of [2.5,1.5]){m.futureRings=m.activeRings-1;m.warningRings=['ring_09'];m.detach();assert.equal(m.ascentDuration,seconds);const positions=m.players.map(p=>[p.x,p.y,p.z]),round=m.round,remaining=m.time-m.players[0].dashAt;for(let i=0;i<seconds*60-1;i++){assert.equal(m.setInput('p0',{seq:1000+i,actionSeq:1000+i,jump:true,dash:true,x:1,z:1}),false);m.step();assert.equal(m.phase,'ascent');assert.equal(m.round,round);m.players.forEach((p,j)=>assert.deepEqual([p.x,p.y,p.z],positions[j]));assert.ok(Math.abs(m.time-m.players[0].dashAt-remaining)<1e-8);}m.step();assert.equal(m.phase,'round');assert.equal(m.round,round+1);assert.ok(m.fuseEnd-m.tick>=RULES.roundMin*60);}
});
test('normal and near-fuse tags both use full two-second authoritative recovery, without stacking',()=>{
 for(const left of [10,2.5]){const m=make();m.beginRound();const [a,b]=m.players;for(let i=2;i<m.players.length;i++)Object.assign(m.players[i],{x:25+i,y:0,z:0});Object.assign(a,{x:0,z:4,y:1.28,yaw:0,slapper:true});Object.assign(b,{x:0,z:5.5,y:1.28,slapper:false,passProtectedUntil:0});m.deadline=m.fuseEnd=m.tick+left*60;assert.equal(m.slap(a),true);assert.equal(b.recoveryDuration,RECOVERY.duration);assert.equal(b.reaction,'tag');assert.equal(b.slapper,true);assert.equal(m.slap(b),false);for(let i=0;i<RECOVERY.duration*60-1;i++){m.setInput(b.id,{seq:i,actionSeq:i+1,x:1,z:0,jump:true,dash:true,slap:true});m.step();assert.equal(b.vx,0);assert.equal(b.jumpSeq,0);assert.equal(b.dashSeq,0);}assert.ok(b.recoveryUntil>=m.time);}
 assert.equal(validColor(-1),0);assert.equal(validColor('7'),0);assert.equal(validColor(8),0);assert.equal(validColor(7),7);
});
test('cinematic camera keeps safe segments and restores the chosen spectator pose',()=>{
 const camera=new T.PerspectiveCamera(70,1.6,.06,1500),root=new T.Group(),orbit={target:new T.Vector3(0,2.5,4),enabled:true};camera.position.set(0,3,6);camera.lookAt(orbit.target);const position=camera.position.clone(),rotation=camera.quaternion.clone(),target=orbit.target.clone(),cine=new AscentPresentation(camera,root),s={phase:'ascent',ascentStart:60,ascentDuration:2.5,activeRings:6,warningRings:['ring_09','ring_08','ring_07'],players:[]};
 for(let i=0;i<150;i++){cine.update(s,1+i/60,world.arena,orbit,true);assert.ok(cine.stats.cameraClear);assert.ok(cine.stats.entrySafe&&cine.stats.exitSafe);}cine.update({...s,phase:'round'},3.5,world.arena,orbit,true);assert.ok(camera.position.distanceTo(position)<1e-8);assert.ok(camera.quaternion.angleTo(rotation)<1e-7);assert.ok(orbit.target.distanceTo(target)<1e-8);assert.equal(cine.stats.active,false);assert.equal(cine.light.intensity,0);assert.equal(cine.trails.visible,false);
});
test('a survivor left on detached ground falls after the pause instead of being rescued by the old edge guard',()=>{
 const m=make();m.beginRound();const p=m.players[0];Object.assign(p,{x:46,y:0,z:0,grounded:true,input:{x:0,z:0,yaw:0},lastInput:m.time});m.futureRings=6;m.warningRings=['ring_09','ring_08','ring_07'];m.detach();assert.equal(p.stranded,true);for(let i=0;i<150;i++)m.step();assert.ok(p.x>40);for(let i=0;i<240&&p.alive;i++)m.step();assert.equal(p.alive,false);assert.ok(m.events.some(e=>e.type==='eliminated'&&e.id===p.id&&e.reason==='fell'));
});

test('rounded prop-edge support remains continuous for real 60 Hz walking steps',()=>{
 const a=world.arena,p={x:-3.6,y:a.groundHeight(-3.6,15,2,1),z:15,grounded:true};
 for(let i=0;i<38;i++){a.move(p,.016,0,1);assert.ok(a.capsuleDepth(p.x,p.y,p.z,1)<.003);}
 assert.ok(p.x>-3.01,'Small movement steps must traverse the same supported edge as the nav probe');
});

test('navigation clearance does not invent a hovering start beside the western prop',()=>{
 const g=world.navigation.grid(5),i=12102,q=world.navigation.position(i);
 assert.ok(!g.valid[i]||Math.abs(g.height[i]-world.arena.groundHeight(q.x,q.z,g.height[i]+.08,5))<.04);
});

test('descending across a rounded rail uses shallow upper contact faces without snagging',()=>{
 const a=world.arena,p={x:-4.2,z:38.4,y:a.groundHeight(-4.2,38.4,1,9),grounded:true};
 for(let i=0;i<30;i++){a.move(p,0,-.063,9);assert.ok(a.capsuleDepth(p.x,p.y,p.z,9)<.003);}
 assert.ok(p.z<36.6);
});


test('slap sightline crosses a small real courtyard floor-height change at chest level',()=>{
 const m=make();m.beginRound();const [a,b]=m.players;
 for(const p of m.players.slice(2))Object.assign(p,{x:25+Number(p.id.slice(1)),y:0,z:0});
 Object.assign(a,{x:0,z:4,y:world.arena.groundHeight(0,4,2,9),yaw:0,slapper:true,passProtectedUntil:0});
 Object.assign(b,{x:0,z:5.65,y:world.arena.groundHeight(0,5.65,2,9),slapper:false,passProtectedUntil:0});
 assert.equal(m.slap(a),true);assert.equal(b.slapper,true);
});
test('roof evacuation keeps supported height through turns instead of cutting across a facade',()=>{
 const w=loadWorld(94063),m=new Match({...w,seed:5,players:Array.from({length:8},(_,i)=>({id:'p'+i,bot:true}))}),p=m.players[0],g=w.navigation.grid(7),i=10121;
 for(const q of m.players)if(q!==p)q.alive=false;Object.assign(p,{...w.navigation.position(i),y:g.height[i],grounded:true,knockdownUntil:.65});m.pendingEliminations=['p1','p2'];m.startWarning();let escaped=false;
 for(let t=0;t<299;t++){m.step();if(w.arena.inside(p.x,p.z,5,.25)){escaped=true;break;}}
 assert.equal(escaped,true);
});
