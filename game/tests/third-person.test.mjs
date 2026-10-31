import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as T from 'three';import {loadWorld} from '../server.mjs';import {Match,RULES} from '../simulation.mjs';import {Arena,boundaryRadius} from '../public/arena.mjs';import {FollowCamera} from '../public/follow-camera.mjs';import {CHARACTER} from '../public/character-config.mjs';import {relativeMovement} from '../public/controls.mjs';
const world=loadWorld(),terrainBytes=fs.readFileSync(new URL('../public/camera-terrain.bin',import.meta.url)),terrain=new Arena(new Float32Array(terrainBytes.buffer,terrainBytes.byteOffset,terrainBytes.length/4));
const make=(n=2)=>new Match({players:Array.from({length:n},(_,i)=>({id:'p'+i,name:'Bop '+i})),...world,seed:3,roundRange:[100,100]});
const ready=m=>{while(m.phase!=='round')m.step();return m.players[0]};
test('2–10 separated spawns have supported feet, clear initial cameras and no seam/cliff placement',()=>{
 const result=[];for(let n=2;n<=10;n++){const m=make(n);let min=Infinity;for(const p of m.players){assert.ok(world.arena.inside(p.x,p.z,n-1,2.5));assert.equal(world.arena.blocked(p.x,p.z,p.y,n-1,.55),false);assert.ok(Math.abs(world.arena.floor(p.x,p.z,p.y+.05,n-1)-p.y)<.1);const r=Math.hypot(p.x,p.z);for(let k=0;k<n;k++)assert.ok(Math.abs(r-boundaryRadius(k,Math.atan2(p.z,p.x)))>=.65);const end={x:p.x-Math.sin(p.yaw)*2.8,y:p.y+1.55,z:p.z-Math.cos(p.yaw)*2.8};assert.equal(world.arena.cameraSweep({x:p.x,y:p.y+.9,z:p.z},end,n-1),1);for(const q of m.players)if(q!==p)min=Math.min(min,Math.hypot(p.x-q.x,p.z-q.z));}assert.ok(min>=2.5);result.push({participants:n,minSeparation:min,positions:m.spawnLocations});}fs.writeFileSync(new URL('../evidence/third-person-spawns.json',import.meta.url),JSON.stringify(result,null,2));
});
test('walk/run/sprint use smooth authoritative acceleration, deceleration and turning',()=>{
 for(const [mode,target] of [['walk',RULES.walkSpeed],['run',RULES.runSpeed],['sprint',RULES.sprintSpeed]]){const m=make(),p=ready(m);Object.assign(p,{x:-4,y:1.19,z:7,yaw:0});for(let i=0;i<60;i++){m.setInput(p.id,{seq:i,actionSeq:0,x:1,z:0,yaw:Math.PI/2,walk:mode==='walk',sprint:mode==='sprint',speed:10000});m.step();if(i===0){assert.ok(Math.hypot(p.vx,p.vz)<.18);assert.ok(p.yaw>0&&p.yaw<Math.PI/2);}}assert.ok(Math.abs(Math.hypot(p.vx,p.vz)-target)<.02);assert.ok(Math.abs(p.yaw-Math.PI/2)<.01);m.setInput(p.id,{seq:100,actionSeq:0,x:0,z:0,yaw:p.yaw});m.step();assert.ok(Math.hypot(p.vx,p.vz)>0);for(let i=0;i<25;i++)m.step();assert.ok(Math.hypot(p.vx,p.vz)<.01);}
});
test('dash covers 1.7 metres, has a four-second cooldown, and restores ordinary movement',()=>{
 const m=make(),p=ready(m);Object.assign(p,{x:-4,y:1.19,z:7,yaw:Math.PI/2});m.setInput(p.id,{seq:1,actionSeq:1,x:0,z:0,yaw:p.yaw,dash:true});for(let i=0;i<20;i++)m.step();assert.ok(Math.abs(p.x-(-4)-RULES.dashDistance)<.02);assert.equal(p.dashSeq,1);assert.ok(Math.hypot(p.vx,p.vz)<.01);
 m.setInput(p.id,{seq:2,actionSeq:2,x:0,z:0,yaw:p.yaw,dash:true});m.step();assert.equal(p.dashSeq,1);for(let i=0;i<240;i++)m.step();m.setInput(p.id,{seq:3,actionSeq:3,x:0,z:0,yaw:p.yaw,dash:true});m.step();assert.equal(p.dashSeq,2);assert.equal(RULES.dashCooldown,4);
});
test('WASD remains relative to camera yaw, independent of avatar heading',()=>{
 assert.deepEqual(relativeMovement(0,1,0),{x:0,z:1});const rotated=relativeMovement(Math.PI/2,1,0);assert.ok(Math.abs(rotated.x-1)<1e-9&&Math.abs(rotated.z)<1e-9);const right=relativeMovement(0,0,1);assert.equal(right.x,-1);assert.equal(right.z,0);
});
test('third-person camera retracts at walls, restores distance, avoids other Boplings and sees terrain',()=>{
 const camera=new T.PerspectiveCamera(),follow=new FollowCamera(camera,world.arena,terrain),matrix=new T.Matrix4(),position=new T.Vector3(0,1.19,-1.5),args={position,yaw:0,pitch:.18,rings:9,players:[],id:'local',worldMatrix:matrix,dt:1/60};
 for(let i=0;i<40;i++)follow.update(args);assert.ok(follow.stats.compressed);assert.ok(follow.stats.geometryClear&&follow.stats.terrainClear);assert.equal(camera.fov,70);
 args.position=new T.Vector3(0,1.27,3.6);for(let i=0;i<100;i++)follow.update(args);assert.ok(follow.stats.distance>2.75);args.players=[{id:'other',alive:true,x:0,y:1.27,z:1.2}];for(let i=0;i<30;i++)follow.update(args);assert.ok(follow.stats.compressed);assert.ok(follow.stats.geometryClear&&follow.stats.terrainClear);
 assert.equal(terrain.cameraBlocked(0,0,0,9,.22),true);assert.ok(terrain.cameraSweep({x:0,y:2,z:0},{x:0,y:-2,z:0},9)<1);
});
test('follow damping is stable at 30, 60 and 120 Hz without camera flips',()=>{
 const poses=[];for(const fps of [30,60,120]){const c=new T.PerspectiveCamera(),f=new FollowCamera(c,new Arena(new Float32Array()),null),a={position:new T.Vector3(0,0,0),yaw:0,pitch:.18,rings:9,players:[],id:'a',worldMatrix:new T.Matrix4(),dt:1/fps};f.update(a);a.position.set(1,0,0);a.yaw=1;a.pitch=10;for(let i=0;i<fps;i++)f.update(a);assert.ok(f.pitch<=1.05);poses.push(c.position.clone());}assert.ok(poses[0].distanceTo(poses[2])<.1);
});
test('open promenade supports authoritative traversal beside housing',()=>{
 const m=make(10),p=ready(m);Object.assign(p,{x:25,y:0,z:0,grounded:true,yaw:Math.PI/2,moveVx:0,moveVz:0});const c=new T.PerspectiveCamera(),f=new FollowCamera(c,world.arena,terrain);
 for(let i=0;i<150;i++){m.setInput(p.id,{seq:i,actionSeq:0,x:1,z:0,yaw:p.yaw});m.step();f.update({position:new T.Vector3(p.x,p.y,p.z),yaw:p.yaw,pitch:.18,rings:9,players:[],id:p.id,worldMatrix:new T.Matrix4(),dt:1/60});assert.ok(f.stats.geometryClear&&f.stats.terrainClear);}
 assert.ok(p.x>29);assert.equal(p.y,0);
});
