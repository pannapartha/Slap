import * as T from 'three';
export const CAMERA_SETTINGS=Object.freeze({distance:2.8,targetHeight:.9,fov:70,minPitch:-.22,maxPitch:1.05,radius:.22});
const damping=(rate,dt)=>1-Math.exp(-rate*dt);
function otherLimit(a,b,players,id,radius){
 const d=b.clone().sub(a),length=d.length();if(!length)return 1;d.divideScalar(length);let limit=1;
 for(const p of players){if(p.id===id||!p.alive)continue;for(const [height,r] of [[.32,.28],[.7,.28],[.99,.36]]){const centre=new T.Vector3(p.x,p.y+height,p.z),delta=a.clone().sub(centre),projection=delta.dot(d),q=delta.lengthSq()-(r+radius)**2,disc=projection*projection-q;if(disc<0)continue;const t=-projection-Math.sqrt(disc);if(t>=0&&t<length)limit=Math.min(limit,Math.max(0,(t-.06)/length));}}
 return limit;
}
export {otherLimit as playerCameraLimit};
export class FollowCamera {
 constructor(camera,arena,terrain){this.camera=camera;this.arena=arena;this.terrain=terrain;this.target=new T.Vector3();this.yaw=0;this.pitch=.18;this.distance=2.8;this.initialized=false;this.stats={};camera.fov=70;camera.updateProjectionMatrix();}
 reset(yaw=0,pitch=.18){this.yaw=yaw;this.pitch=pitch;this.initialized=false;this.distance=2.8;}
 limit(a,b,rings,players,id){return Math.min(this.arena.cameraSweep(a,b,rings,.22),this.terrain?.cameraSweep(a,b,rings,.22)??1,otherLimit(a,b,players,id,.16));}
 update({position,yaw,pitch,rings,players,id,worldMatrix,dt}){
  const focus=position.clone().add(new T.Vector3(0,.9,0));
  if(!this.initialized){this.target.copy(focus);this.yaw=yaw;this.pitch=pitch;}else{this.target.lerp(focus,damping(26,dt));this.yaw+=Math.atan2(Math.sin(yaw-this.yaw),Math.cos(yaw-this.yaw))*damping(28,dt);this.pitch+=(pitch-this.pitch)*damping(28,dt);}
  this.pitch=T.MathUtils.clamp(this.pitch,-.22,1.05);if(this.arena.cameraBlocked(this.target.x,this.target.y,this.target.z,rings)||this.terrain?.cameraBlocked(this.target.x,this.target.y,this.target.z,rings))this.target.copy(focus);
  let direction=new T.Vector3(-Math.sin(this.yaw)*Math.cos(this.pitch),Math.sin(this.pitch),-Math.cos(this.yaw)*Math.cos(this.pitch));
  let desired=this.target.clone().addScaledVector(direction,2.8),fraction=this.limit(this.target,desired,rings,players,id),safe=2.8*fraction;
  // Try raised/backward booms first, but only when both the entire sphere sweep
  // and its sightline are clear. Never extend through an intervening solid.
  let avoidance='none';
  if(fraction<.99){
   const side=this.side||1;
   for(const [back,up,lateral] of [[3.05,1.25,0],[3.25,2.0,0],[1.2,1.2,3.4*side],[1.2,1.2,-3.4*side],[2.8,2.8,0],[1.9,3.1,0],[.7,1.15,0]]){
    const offset=new T.Vector3(-Math.sin(this.yaw)*back+Math.cos(this.yaw)*lateral,up,-Math.cos(this.yaw)*back-Math.sin(this.yaw)*lateral),end=this.target.clone().add(offset),f=this.limit(this.target,end,rings,players,id);
    if(f>.99&&offset.length()>safe+.2){direction=offset.normalize();safe=this.target.distanceTo(end);avoidance=lateral?'raised-side':'raised';if(lateral)this.side=Math.sign(lateral);break;}
   }
  }
  // A blocked boom may never collapse into the local skull. Search a full clear
  // orbit/overhead boom before using a short view; the final damped pose is checked too.
  const selfClear=p=>[[.30,.30],[.72,.30],[1.0,.37]].every(([h,r])=>p.distanceTo(position.clone().add(new T.Vector3(0,h,0)))>r+.22);
  if(safe<1.25||!selfClear(this.target.clone().addScaledVector(direction,safe))){
   const candidates=[];for(const turn of [0,.5,-.5,1,-1,1.6,-1.6,Math.PI])for(const elevation of [.55,.95,1.35]){const a=this.yaw+turn,d=new T.Vector3(-Math.sin(a)*Math.cos(elevation),Math.sin(elevation),-Math.cos(a)*Math.cos(elevation));for(const length of [2.8,2,1.4]){const end=this.target.clone().addScaledVector(d,length);if(selfClear(end)&&this.limit(this.target,end,rings,players,id)>.99)candidates.push({d,length,score:length-Math.abs(turn)*.2-elevation*.2});}}
   const overhead=this.target.clone().add(new T.Vector3(0,2.5,0));if(this.limit(this.target,overhead,rings,players,id)>.99)candidates.push({d:new T.Vector3(0,1,0),length:2.5,score:1});
   const best=candidates.sort((a,b)=>b.score-a.score)[0];if(best){direction=best.d;safe=best.length;avoidance='self-safe';}
  }
  this.distance+=(safe-this.distance)*damping(safe<this.distance?42:7,dt);this.distance=Math.min(safe,this.distance);
  const wanted=this.target.clone().addScaledVector(direction,this.distance),inverse=worldMatrix.clone().invert();
  let local=this.initialized?this.camera.position.clone().applyMatrix4(inverse).lerp(wanted,damping(24,dt)):wanted;
  // Validate the damped position again; interpolation around a corner must not cut through it.
  const finalLimit=this.limit(this.target,local,rings,players,id);if(finalLimit<1)local=this.target.clone().lerp(local,finalLimit);
  if(this.initialized){const previous=this.camera.position.clone().applyMatrix4(inverse),sweep=this.limit(previous,local,rings,players,id);if(sweep<1){const slide=previous.clone().lerp(local,sweep);if(selfClear(slide)&&this.limit(this.target,slide,rings,players,id)>.99)local=slide;}}
  if(!selfClear(local)||local.distanceTo(this.target)<1.25)if(selfClear(wanted)&&this.limit(this.target,wanted,rings,players,id)>.99)local=wanted.clone();
  this.camera.position.copy(local.applyMatrix4(worldMatrix));const targetWorld=this.target.clone().applyMatrix4(worldMatrix),matrix=new T.Matrix4().lookAt(this.camera.position,targetWorld,new T.Vector3(0,1,0)),rotation=new T.Quaternion().setFromRotationMatrix(matrix);
  if(!this.initialized)this.camera.quaternion.copy(rotation);else this.camera.quaternion.slerp(rotation,damping(30,dt));this.initialized=true;
  const localCamera=this.camera.position.clone().applyMatrix4(inverse),forward=this.camera.getWorldDirection(new T.Vector3()).transformDirection(inverse);this.stats={selfClear:selfClear(localCamera),distance:this.camera.position.distanceTo(targetWorld),desiredDistance:2.8,viewYaw:Math.atan2(forward.x,forward.z),compressed:fraction<.99,terrainClear:!(this.terrain?.cameraBlocked(localCamera.x,localCamera.y,localCamera.z,rings)),geometryClear:!this.arena.cameraBlocked(localCamera.x,localCamera.y,localCamera.z,rings),avoidance,localCamera:localCamera.toArray(),target:this.target.toArray()};
 }
}
