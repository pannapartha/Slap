import * as T from 'three';
export class MovementEffects {
 constructor(root){this.mesh=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.35,depthWrite:false}),80);this.mesh.frustumCulled=false;root.add(this.mesh);this.pool=Array.from({length:80},()=>({age:100}));this.cursor=0;this.dummy=new T.Object3D();this.seen=new Map();this.nextTrail=0;}
 puff(x,y,z,count=3,color=0xd8bea2){for(let i=0;i<count;i++){const k=this.cursor++%80;this.pool[k]={x,y,z,age:0,life:.35+Math.random()*.2,vx:(Math.random()-.5)*.65,vz:(Math.random()-.5)*.65};this.mesh.setColorAt(k,new T.Color(color));}if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;}
 clear(){this.pool.forEach(p=>p.age=100);this.seen.clear();this.winner=null;this.mesh.visible=false;this.active=0;}
 update(players,s,time,dt){for(const p of players){const old=this.seen.get(p.id)||{};if(s.phase!=='ascent'&&p.alive&&p.landAt!==old.land&&time-p.landAt<.2)this.puff(p.x,p.y+.025,p.z,5);if(s.phase!=='ascent'&&p.alive&&time-p.dashAt<.25&&time>(old.trail||0)){const n=Math.hypot(p.vx,p.vz)||1;this.puff(p.x-p.vx/n*.3,p.y+.04,p.z-p.vz/n*.3,2);old.trail=time+.04;}old.land=p.landAt;this.seen.set(p.id,old);}
  if(s.phase==='won'&&this.winner!==s.winner){this.winner=s.winner;const p=players.find(p=>p.id===s.winner);if(p)this.puff(p.x,p.y+.8,p.z,14,0xffd47a);}
  let live=0;for(let i=0;i<80;i++){const p=this.pool[i];p.age+=dt;const f=p.age/p.life;if(f<1){live++;this.dummy.position.set(p.x+p.vx*p.age,p.y+p.age*.3,p.z+p.vz*p.age);this.dummy.scale.setScalar((.04+Math.sin(f*Math.PI)*.09)*(1-f));}else this.dummy.scale.setScalar(0);this.dummy.updateMatrix();this.mesh.setMatrixAt(i,this.dummy.matrix);}this.mesh.instanceMatrix.needsUpdate=true;this.mesh.visible=live>0;this.active=live;
 }
}
