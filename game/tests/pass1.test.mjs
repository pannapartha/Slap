import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as T from 'three';
import {loadWorld} from '../server.mjs';import {Match,RULES} from '../simulation.mjs';import {CHARACTER} from '../public/character-config.mjs';import {cityPlacements} from '../public/city-layout.mjs';import {FollowCamera} from '../public/follow-camera.mjs';import {Arena,boundaryRadius} from '../public/arena.mjs';
const world=loadWorld(),manifest=JSON.parse(fs.readFileSync(new URL('../../world-assets/manifest.json',import.meta.url))),plan=cityPlacements(manifest),bytes=fs.readFileSync(new URL('../public/camera-terrain.bin',import.meta.url)),terrain=new Arena(new Float32Array(bytes.buffer,bytes.byteOffset,bytes.length/4));
const make=(n=10,seed=22)=>new Match({players:Array.from({length:n},(_,i)=>({id:'p'+i,name:'Bop '+i})),...world,seed});
test('half-height Bopling, body, door/floor ratios and owned parked car colliders agree',()=>{
 assert.equal(CHARACTER.scale,.5);assert.equal(CHARACTER.height,1.20);assert.ok(1.4*1.54/CHARACTER.height>1.6&&1.4*1.54/CHARACTER.height<1.8);assert.ok(Math.abs(1.8*1.54/CHARACTER.height-2.3)<.02);
 assert.equal(plan.filter(p=>p.id.startsWith('city_home_')).length,32);const cars=plan.filter(p=>p.id.startsWith('parked_car_'));assert.equal(cars.length,8);
 for(const c of cars){const [x,,z]=c.position,h=world.arena.floor(x,z,2,9);assert.ok(h>.9&&h<1.2);assert.equal(world.arena.blocked(x,z,0,9),true);assert.equal(world.arena.blocked(x,z,h,9),false);assert.equal(world.arena.floor(x,z,2,Number(c.owner.slice(-2))-1),-Infinity);}
});
test('2, 5, 10 spawns randomize across seeds, remain connected, separated and supported',()=>{
 const report=[];for(const n of [2,5,10]){const patterns=new Set();for(let seed=1;seed<=8;seed++){const m=make(n,seed),g=world.navigation.grid(n-1);patterns.add(JSON.stringify(m.spawnLocations));let min=Infinity;for(const p of m.players){assert.equal(g.valid[world.navigation.index(p.x,p.z)],1);assert.ok(Math.abs(world.arena.groundHeight(p.x,p.z,p.y+.05,n-1)-p.y)<.04);for(const q of m.players)if(q!==p)min=Math.min(min,Math.hypot(p.x-q.x,p.z-q.z));}assert.ok(min>=CHARACTER.spacing);report.push({n,seed,min,positions:m.spawnLocations});}assert.equal(patterns.size,8);}
 fs.writeFileSync(new URL('../evidence/pass1-spawns.json',import.meta.url),JSON.stringify(report,null,2));
});
test('all eight parked cars can be jumped onto and support a grounded Bopling',()=>{
 const report=[];for(const car of plan.filter(p=>p.id.startsWith('parked_car_'))){const m=make(),p=m.players[0];while(m.phase!=='round')m.step();const [cx,,cz]=car.position,dx=-Math.cos(car.yaw),dz=Math.sin(car.yaw);Object.assign(p,{x:cx-dx*1.9,y:0,z:cz-dz*1.9,grounded:true,moveVx:0,moveVz:0});let roof=false,max=0;for(let i=0;i<100;i++){const moving=Math.hypot(p.x-cx,p.z-cz)>.1&&i<65;m.setInput(p.id,{seq:i+1,actionSeq:1,x:moving?dx:0,z:moving?dz:0,yaw:Math.atan2(dx,dz),jump:i===0});m.step();max=Math.max(max,p.y);if(p.grounded&&p.y>.95)roof=true;}assert.ok(roof,car.id);report.push({id:car.id,roof,max,end:[p.x,p.y,p.z]});}
 fs.writeFileSync(new URL('../evidence/pass1-car-climbing.json',import.meta.url),JSON.stringify(report,null,2));
});
test('danger targets all doomed rings and clears/reappears immediately on crossing',()=>{
 const m=make();m.pendingEliminations=['p7','p8','p9'];for(const p of m.players.slice(7))p.alive=false;m.startWarning();const p=m.players[0];
 for(const ring of [7,8,9]){p.x=13.2+(ring-.5)*3.8;p.z=0;assert.equal(m.snapshot().players[0].collapseDanger,true);}
 p.x=30;p.z=0;assert.equal(m.snapshot().players[0].collapseDanger,false);p.x=42;assert.equal(m.snapshot().players[0].collapseDanger,true);p.alive=false;assert.equal(m.snapshot().players[0].collapseDanger,false);assert.equal(m.deadline-m.tick,300);
});
test('camera sphere and sightline stay outside houses, castle, walls and rooftops across all orbit angles',()=>{
 const positions=[new T.Vector3(0,1.19,-1.5),new T.Vector3(-5,3,3),new T.Vector3(0,world.arena.floor(0,-7.5,30,9),-7.5),new T.Vector3(-3,1.27,4)];
 for(const home of plan.filter(p=>p.id.startsWith('city_home_'))){const [x,,z]=home.position;for(const side of [-1,1]){const p=new T.Vector3(x+Math.sin(home.yaw)*2.2,0,z+Math.cos(home.yaw)*2.2*side);if(!world.arena.blocked(p.x,p.z,0,9))positions.push(p);}}
 let samples=0,raised=0;for(const position of positions)for(let angle=0;angle<16;angle++)for(const pitch of [-.22,.18,.7,1.05]){const camera=new T.PerspectiveCamera(),f=new FollowCamera(camera,world.arena,terrain);f.update({position,yaw:angle*Math.PI/8,pitch,rings:9,players:[],id:'test',worldMatrix:new T.Matrix4(),dt:1/60});assert.ok(f.stats.selfClear&&f.stats.distance>=1.25&&f.stats.geometryClear&&f.stats.terrainClear,JSON.stringify({position,angle,pitch,stats:f.stats}));assert.equal(world.arena.cameraSweep(new T.Vector3(...f.stats.target),new T.Vector3(...f.stats.localCamera),9),1);if(f.stats.avoidance.startsWith('raised'))raised++;samples++;}
 assert.ok(raised>0);fs.writeFileSync(new URL('../evidence/pass1-camera-orbits.json',import.meta.url),JSON.stringify({positions:positions.length,samples,raised,clear:true},null,2));
});
test('each ring sector has two broad exits into neighbouring regions at actual capsule size',()=>{
 const g=world.navigation.grid(9),report=[];for(let ring=1;ring<=9;ring++)for(let sector=0;sector<8;sector++){const exits=[];for(let i=0;i<g.valid.length;i++){if(!g.valid[i]||g.height[i]>.1)continue;const p=world.navigation.position(i),angle=(Math.atan2(p.z,p.x)+Math.PI*2)%(Math.PI*2),r=Math.hypot(p.x,p.z);if(Math.floor(angle/(Math.PI/4))!==sector||r<boundaryRadius(ring-1,angle)||r>boundaryRadius(ring,angle))continue;for(let k=0;k<g.dirs.length;k++)if(g.edges[i]&(1<<k)){const q=world.navigation.position(i+g.dirs[k]),a=(Math.atan2(q.z,q.x)+Math.PI*2)%(Math.PI*2),qr=Math.hypot(q.x,q.z);if(qr<boundaryRadius(ring-1,a)||Math.floor(a/(Math.PI/4))!==sector)exits.push(p);}}
 let separation=0;for(const a of exits)for(const b of exits)separation=Math.max(separation,Math.hypot(a.x-b.x,a.z-b.z));assert.ok(separation>2,`Ring ${ring} sector ${sector} has insufficient independent exits`);report.push({ring,sector,exits:exits.length,separation});}
 fs.writeFileSync(new URL('../evidence/pass1-region-exits.json',import.meta.url),JSON.stringify(report,null,2));
});
