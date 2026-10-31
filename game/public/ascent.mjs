import * as T from 'three';
import {playerCameraLimit} from './follow-camera.mjs';
const smooth=x=>{x=T.MathUtils.clamp(x,0,1);return x*x*(3-2*x)};
export function cameraPath(start,end,arena,rings,players=[]){
 const clear=(a,b)=>Math.min(arena.cameraSweep(a,b,rings,.25),playerCameraLimit(a,b,players,null,.25))>.999;
 if(clear(start,end))return [start.clone(),end.clone()];
 const height=Math.max(24,start.y+8,end.y+8),upEnd=new T.Vector3(end.x,height,end.z);
 for(const radius of [0,1,3,6,14,60])for(let k=0;k<(radius?16:1);k++){
  const a=k*Math.PI/8,side=start.clone().add(new T.Vector3(Math.cos(a)*radius,0,Math.sin(a)*radius)),up=new T.Vector3(side.x,height,side.z),points=[start,side,up,upEnd,end];
  if(points.slice(1).every((p,i)=>clear(points[i],p)))return points.map(p=>p.clone());
 }
 return [start.clone()]; // Hold a proven safe pose instead of crossing a solid.
}
function pathAt(points,t){const lengths=points.slice(1).map((p,i)=>p.distanceTo(points[i])),total=lengths.reduce((a,b)=>a+b,0);let at=smooth(t)*total;for(let i=0;i<lengths.length;i++){if(at<=lengths[i])return points[i].clone().lerp(points[i+1],lengths[i]?at/lengths[i]:1);at-=lengths[i];}return points.at(-1).clone();}
export class AscentPresentation {
 constructor(camera,worldRoot,{mobile=false}={}){
  Object.assign(this,{camera,worldRoot,mobile});this.root=new T.Group();this.root.name='Cinematic thruster exhaust';worldRoot.add(this.root);this.engines=[];this.dummy=new T.Object3D();
  const cone=new T.ConeGeometry(1,1,12).translate(0,-.5,0),outer=new T.MeshBasicMaterial({color:0xff8c25,transparent:true,opacity:.9,depthWrite:false,toneMapped:false}),inner=new T.MeshBasicMaterial({color:0xfff2c6,transparent:true,opacity:.95,depthWrite:false,toneMapped:false});
  this.fireTime={value:0};outer.onBeforeCompile=s=>{s.uniforms.fireTime=this.fireTime;s.vertexShader='varying vec2 jetUV;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\njetUV=uv;');s.fragmentShader='varying vec2 jetUV;uniform float fireTime;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat hot=smoothstep(.12,.75,jetUV.y)+.08*sin(jetUV.y*36.-fireTime*42.+jetUV.x*12.);diffuseColor.rgb=mix(vec3(1.,.19,.015),vec3(1.,.96,.74),clamp(hot,0.,1.));');};outer.customProgramCacheKey=()=> 'toy-rocket-flame-v1';
  for(const [x,z] of [[0,5],[4.330127,-2.5],[-4.330127,-2.5]]){const group=new T.Group();group.position.set(x,-28.6,z);const shell=new T.Mesh(cone,outer),core=new T.Mesh(cone,inner),flash=new T.Mesh(new T.IcosahedronGeometry(1,1),inner);group.add(shell,core,flash);this.root.add(group);this.engines.push({group,shell,core,flash});}
  this.trails=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),new T.MeshBasicMaterial({color:0xffd282,transparent:true,opacity:.65,depthWrite:false}),mobile?54:126);this.trails.frustumCulled=false;this.root.add(this.trails);this.light=new T.PointLight(0xffa34e,0,55,1.5);this.light.position.set(0,-27,0);worldRoot.add(this.light);this.root.visible=false;this.stats={active:false};
 }
 clear(){this.saved=null;this.key=null;this.trails.visible=false;this.light.intensity=0;this.root.visible=false;this.stats={active:false};}
 update(s,time,arena,orbit,spectating){
  const active=s.phase==='ascent',origin=this.worldRoot.position.y;
  if(!active&&this.saved){if(s.phase!=='won'){this.camera.position.copy(this.saved.position).add(new T.Vector3(0,origin,0));this.camera.quaternion.copy(this.saved.rotation);orbit.target.copy(this.saved.target).add(new T.Vector3(0,origin,0));}this.saved=null;this.stats.active=false;}
  if(!active){this.root.visible=false;this.trails.visible=false;this.light.intensity=0;return false;}this.root.visible=true;
  const key=s.ascentStart,p=T.MathUtils.clamp((time-s.ascentStart/60)/(s.ascentDuration||2.5),0,1),radius=13.2+3.8*(s.activeRings+s.warningRings.length),fov=Math.min(this.camera.fov*Math.PI/180,2*Math.atan(Math.tan(this.camera.fov*Math.PI/360)*this.camera.aspect)),distance=Math.max(radius,36)/Math.sin(fov/2)*1.14,look=new T.Vector3(0,-11,0),external=look.clone().add(new T.Vector3(1,.06,1.25).normalize().multiplyScalar(distance));
  if(this.key!==key||!this.saved){this.key=key;this.saved={position:this.camera.position.clone().sub(new T.Vector3(0,origin,0)),rotation:this.camera.quaternion.clone(),target:orbit.target.clone().sub(new T.Vector3(0,origin,0)),spectating};this.saved.look=spectating?this.saved.target.clone():this.saved.position.clone().add(this.camera.getWorldDirection(new T.Vector3()).multiplyScalar(2.8));this.entry=cameraPath(this.saved.position,external,arena,s.activeRings+s.warningRings.length,s.players);this.exit=this.entry.slice().reverse();}
  const entry=.18,exit=.22;let local,blend=1;
  if(p<entry){local=pathAt(this.entry,p/entry);blend=smooth(p/entry);}else if(p>1-exit){local=pathAt(this.exit,(p-1+exit)/exit);blend=1-smooth((p-1+exit)/exit);}else local=external;
  const old=this.camera.position.clone().sub(new T.Vector3(0,origin,0)),fraction=Math.min(arena.cameraSweep(old,local,s.activeRings+s.warningRings.length,.25),playerCameraLimit(old,local,s.players,null,.25));if(fraction<1)local=old.lerp(local,fraction);
  this.camera.position.copy(local).add(new T.Vector3(0,origin,0));const targetWorld=this.saved.look.clone().lerp(look,blend).add(new T.Vector3(0,origin,0));this.camera.lookAt(targetWorld);orbit.enabled=false;
  const charge=smooth(p/.15),ignite=Math.exp(-(((p-.18)/.065)**2)),boost=charge*(1-smooth((p-.82)/.18)),length=3+boost*19;
  for(let i=0;i<this.engines.length;i++){const e=this.engines[i],flicker=1+.055*Math.sin(time*39+i*2);e.shell.scale.set(1.8+boost*.9,length*flicker,1.8+boost*.9);e.core.scale.set(.9+boost*.45,length*.96*flicker,.9+boost*.45);e.flash.scale.setScalar(.7+ignite*2.5);}
  this.fireTime.value=time;this.light.intensity=(this.mobile?75:140)*(charge*.65+ignite*.5);this.trails.visible=boost>.05;
  for(let i=0;i<this.trails.count;i++){const jet=this.engines[i%3].group.position,age=(time*1.8+i*.618)%1,a=i*2.399,r=(.5+age*2.3),size=(1-age)*(.16+(i%4)*.05)*boost;this.dummy.position.set(jet.x+Math.cos(a)*r,jet.y-age*30,jet.z+Math.sin(a)*r);this.dummy.scale.set(size,size*(2+age*4),size);this.dummy.updateMatrix();this.trails.setMatrixAt(i,this.dummy.matrix);}this.trails.instanceMatrix.needsUpdate=true;
  this.stats={active:true,progress:p,duration:s.ascentDuration,boost,flameLength:length,trails:this.trails.count,entrySafe:this.entry.length>1,exitSafe:this.exit.length>1,cameraClear:!arena.cameraBlocked(local.x,local.y,local.z,s.activeRings,.25),external:external.toArray()};return true;
 }
}

