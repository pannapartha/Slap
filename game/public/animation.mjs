import {COLORS,validColor,RECOVERY} from './character-options.mjs';
import {polishCharacter} from './character-polish.mjs';
import * as THREE from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {CHARACTER} from './character-config.mjs';
const upperBone=name=>/Spine|Neck|Head|Shoulder|Arm|ForeArm|Hand/.test(name);
export function prepareAnimations(asset){
 const clips=new Map();
 for(const clip of asset.animations){
  const tracks=clip.tracks.filter(t=>t.name.endsWith('.quaternion')||(/Hips/.test(t.name)&&t.name.endsWith('.position'))).map(t=>{if(!t.name.endsWith('.position'))return t;const copy=t.clone(),bone=asset.scene.getObjectByName(t.name.split('.')[0]);for(let i=0;i<copy.values.length;i+=3){copy.values[i]=bone?.position.x||0;copy.values[i+1]=bone?.position.y||0;}return copy;});
  clips.set(clip.name,new THREE.AnimationClip(clip.name,clip.duration,tracks));
  clips.set(clip.name+'Lower',new THREE.AnimationClip(clip.name+'Lower',clip.duration,tracks.filter(t=>!upperBone(t.name))));
  clips.set(clip.name+'Upper',new THREE.AnimationClip(clip.name+'Upper',clip.duration,tracks.filter(t=>upperBone(t.name))));
 }
 // Trim away the Mixamo run-up. Air poses have two identical samples: never cycle legs.
 const jump=clips.get('Jump');
 function slice(name,start,end){const sub=THREE.AnimationUtils.subclip(jump,name,Math.round(start*30),Math.round(end*30),30);for(const layer of ['Lower','Upper'])clips.set(name+layer,new THREE.AnimationClip(name+layer,sub.duration,sub.tracks.filter(t=>layer==='Upper'?upperBone(t.name):!upperBone(t.name))));}
 function hold(name,time){for(const layer of ['Lower','Upper']){const tracks=jump.tracks.filter(t=>layer==='Upper'?upperBone(t.name):!upperBone(t.name)).filter(t=>!t.name.endsWith('.position')).map(t=>{const value=Array.from(t.createInterpolant().evaluate(time));return new t.constructor(t.name,[0,1],[...value,...value]);});clips.set(name+layer,new THREE.AnimationClip(name+layer,1,tracks));}}
 slice('Takeoff',1.0,1.20);hold('Air',1.60);hold('Fall',1.85);slice('Land',2.03,2.23);
 const stagger=THREE.AnimationUtils.subclip(clips.get('Hit'),'Stagger',20,30,30);for(const layer of ['Lower','Upper'])clips.set('Stagger'+layer,new THREE.AnimationClip('Stagger'+layer,stagger.duration,stagger.tracks.filter(t=>layer==='Upper'?upperBone(t.name):!upperBone(t.name))));
 const segment=(source,name,start,end)=>{const clip=THREE.AnimationUtils.subclip(clips.get(source),name,Math.round(start*30),Math.round(end*30),30);for(const layer of ['Lower','Upper'])clips.set(name+layer,new THREE.AnimationClip(name+layer,clip.duration,clip.tracks.filter(t=>layer==='Upper'?upperBone(t.name):!upperBone(t.name))));};segment('Hit','TagFall',.85,1.45);segment('GetUp','RecoverRise',1.6,2.7);for(const layer of ['Lower','Upper']){const tracks=clips.get('Hit'+layer).tracks.map(t=>{const value=Array.from(t.createInterpolant().evaluate(1.45));return new t.constructor(t.name,[0,1],[...value,...value]);});clips.set('Down'+layer,new THREE.AnimationClip('Down'+layer,1,tracks));}
 // Keep full-clip Jump aliases for tools; gameplay uses the held Air pose.

 return clips;
}
export class BoplingActor {
 constructor(asset,clips,id){
  this.visual=clone(asset.scene);this.visual.scale.setScalar(CHARACTER.scale);this.model=new THREE.Group();this.model.add(this.visual);this.model.name='Bopling '+id;this.id=id;this.clips=clips;this.mixer=new THREE.AnimationMixer(this.model);this.layers={};this.stats={transitions:0,slaps:0,baseRestarts:0};this.lastSlap=-1;this.lastHit=-1;this.fading=[];this.motion=false;
  this.materials=[];const materialMap=new Map();this.model.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.castShadow=true;o.receiveShadow=true;const source=Array.isArray(o.material)?o.material:[o.material];const materials=source.map(m=>{if(!materialMap.has(m)){const c=m.clone();c.userData.originalColor=c.color.clone();polishCharacter(c);materialMap.set(m,c);this.materials.push(c);}return materialMap.get(m)});o.material=Array.isArray(o.material)?materials:materials[0];}});
  // Reuse actual sole vertices for cheap vertical grounding; no new mesh or foot IK.
  this.soles=[];this.supportSamples=[];this.model.updateMatrixWorld(true);this.model.traverse(o=>{if(!o.isSkinnedMesh)return;o.skeleton.update();const pos=o.geometry.attributes.position;for(let index=0;index<pos.count;index+=Math.max(1,Math.ceil(pos.count/180)))this.supportSamples.push({mesh:o,index});let eligible=[];for(let i=0;i<pos.count;i++){const v=o.applyBoneTransform(i,new THREE.Vector3().fromBufferAttribute(pos,i)).applyMatrix4(o.matrixWorld);if(v.y<.14)eligible.push(i);}const stride=Math.max(1,Math.floor(eligible.length/80));for(let k=0;k<eligible.length;k+=stride)this.soles.push({mesh:o,index:eligible[k]});});
 }
 choose(layer,name,{fade=.18,loop=true,timeScale=1,age=0}={}){
  const old=this.layers[layer];if(old?.name===name){old.action.timeScale=timeScale;return old.action;}
  const clip=this.clips.get(name);if(!clip)return null;const action=this.mixer.clipAction(clip).reset().setEffectiveWeight(1).setEffectiveTimeScale(timeScale);action.setLoop(loop?THREE.LoopRepeat:THREE.LoopOnce,Infinity);action.clampWhenFinished=!loop;action.time=loop?age%clip.duration:Math.min(age*timeScale,clip.duration);action.play();if(old){action.crossFadeFrom(old.action,fade,false);this.fading.push({action:old.action,until:this.mixer.time+fade+.03});}else action.fadeIn(fade);this.layers[layer]={name,action};this.stats.transitions++;return action;
 }
 setColor(id){id=validColor(id);if(id===this.color)return;this.color=id;for(const m of this.materials){m.userData.bopColor.value.set(COLORS[id].hex);m.userData.bopTint.value=id===0?0:1;}}
 update(p,snapshot,dt,serverTime){
  this.setColor(p.color);if(snapshot.phase==='ascent'){for(const l of Object.values(this.layers))l.action.paused=true;this.presentation={...this.presentation,cinematic:true};return;}
  if(p.frozen){for(const l of Object.values(this.layers))l.action.paused=true;for(const m of this.materials){m.color.copy(m.userData.originalColor);m.userData.bopPulse.value=.95;m.emissive.setHex(0xff1824);m.emissiveIntensity=.55*m.userData.faceSensitive;}this.presentation={base:'Frozen',upper:'Frozen',pulse:.95};return;}
  for(const l of Object.values(this.layers))l.action.paused=false;
  const speed=Math.hypot(p.vx,p.vz),slapAge=serverTime-p.slapAt,hitAge=serverTime-p.hitAt;let base='Idle',upper='Idle',lowerLoop=true,scale=1,recoveryPhase=null;
  if(!p.alive){base=upper='Elimination';lowerLoop=false;scale=1;}
  else if(snapshot.phase==='won'&&p.id===snapshot.winner){base=upper=snapshot.dance;}
  else if(p.frozen){base=upper='Idle';}
  else if(p.recoveryUntil>serverTime){const age=serverTime-p.hitAt;base=upper=age<RECOVERY.fall?'TagFall':age<RECOVERY.fall+RECOVERY.down?'Down':age<RECOVERY.duration-RECOVERY.settle?'RecoverRise':'Idle';recoveryPhase=base==='TagFall'?'Hit':base==='RecoverRise'?'GetUp':base==='Idle'?'Stand':'Down';lowerLoop=base==='Idle';scale=1;}
  else if(p.reaction==='knockdown'&&hitAge>=0&&hitAge<1.35){base=upper='Hit';lowerLoop=false;scale=this.clips.get('Hit').duration/1.35;}
  else if(!p.grounded){base=upper=serverTime-p.jumpAt<.13?'Takeoff':p.vy<-.2?'Fall':'Air';lowerLoop=false;scale=base==='Takeoff'?this.clips.get('TakeoffLower').duration/.13:1;}
  else if(serverTime-p.landAt<(speed>.25?.06:.12)){base=upper='Land';lowerLoop=false;scale=this.clips.get('LandLower').duration/.10;}
  else if(speed>(this.motion?.06:.16)){base=upper=speed<1.65?'Walk':'Run';scale=base==='Run'?Math.max(.25,Math.min(4.5,speed/1.4)):Math.max(.12,speed/.8);}
  this.motion=base==='Walk'||base==='Run';
  if(!p.recoveryUntil||serverTime>=p.recoveryUntil)if(slapAge>=0&&slapAge<.6&&!p.frozen&&p.alive){upper='Slap';if(this.lastSlap!==p.slapSeq){this.lastSlap=p.slapSeq;this.stats.slaps++;if(this.layers.upper?.name==='SlapUpper')this.layers.upper.action.reset();}}
  else if(!['knockdown','tag','stagger'].includes(p.reaction)&&hitAge>=0&&hitAge<.65&&p.alive){upper='Hit';}
  const lowerAge=base==='TagFall'?hitAge:base==='Down'?0:base==='RecoverRise'?Math.max(0,hitAge-RECOVERY.fall-RECOVERY.down):base==='Hit'||base==='Stagger'?hitAge:base==='Takeoff'?Math.max(0,serverTime-p.jumpAt):base==='GetUp'?Math.max(0,hitAge-.38):base==='Elimination'?Math.max(0,serverTime-p.eliminatedAt):base==='Land'?Math.max(0,serverTime-p.landAt):serverTime;
  const upperAge=upper==='Slap'?slapAge:upper==='Hit'?hitAge:lowerAge;
  this.choose('lower',base+'Lower',{loop:lowerLoop,timeScale:scale,age:lowerAge,fade:base==='Land'?.15:.2});
  const upperAction=this.choose('upper',upper+'Upper',{loop:upper===base?lowerLoop:false,timeScale:upper==='Slap'?1:upper==='Hit'&&upper!==base?this.clips.get('Hit').duration/.7:scale,age:upperAge,fade:upper==='Slap'?.15:.2});
  if(upper===base&&upperAction&&this.layers.lower)upperAction.time=this.layers.lower.action.time;
  for(const f of this.fading)if(this.mixer.time>=f.until&&!Object.values(this.layers).some(l=>l.action===f.action))f.action.stop();this.fading=this.fading.filter(f=>this.mixer.time<f.until);
  // Event clips align to authoritative start times; don't reset actions on ordinary snapshots.
  if(upper==='Slap'&&upperAction&&Math.abs(upperAction.time-slapAge)>.12)upperAction.time=Math.min(.599,slapAge);
  this.mixer.update(dt);
  this.visual.position.y=0;this.model.updateMatrixWorld(true);for(const mesh of new Set(this.soles.map(s=>s.mesh)))mesh.skeleton.update();let sole=Infinity;const inverse=this.model.matrixWorld.clone().invert();for(const {mesh,index} of (['Hit','GetUp','TagFall','Down','RecoverRise'].includes(base)?this.supportSamples:this.soles)){const v=mesh.applyBoneTransform(index,new THREE.Vector3().fromBufferAttribute(mesh.geometry.attributes.position,index)).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse);sole=Math.min(sole,v.y);}if(p.grounded&&p.alive&&Number.isFinite(sole))this.visual.position.y=THREE.MathUtils.clamp(-sole,['Hit','GetUp','TagFall','Down','RecoverRise'].includes(base)?-1.2:-.45,1.2);this.stats.soleHeight=sole;this.stats.groundOffset=this.visual.position.y;
  if(p.frozen){for(const l of Object.values(this.layers))l.action.paused=true;}else for(const l of Object.values(this.layers))l.action.paused=false;
  let pulse=0;if(p.slapper&&p.alive){const left=Math.max(0,(snapshot.fuseEnd-snapshot.tick)/60),urgency=1-Math.min(1,left/14),period=.8-.64*urgency;pulse=p.frozen?.9:((serverTime-snapshot.roundStarted)%period)<period*.48?.35+.6*urgency:0;}
  for(const m of this.materials){m.color.copy(m.userData.originalColor);m.userData.bopPulse.value=pulse;m.emissive.setHex(0xff1824);m.emissiveIntensity=pulse*.65*m.userData.faceSensitive;}
  this.presentation={base:recoveryPhase||base,upper:recoveryPhase||upper,recoveryPhase,locomotion:base==='Run'&&speed>3.2?'Sprint':base,runSlap:base==='Run'&&upper==='Slap',pulse};
 }
 dispose(){this.shadow?.geometry.dispose();this.shadow?.material.dispose();this.shadow?.removeFromParent();this.mixer.stopAllAction();this.materials.forEach(m=>m.dispose());this.model.removeFromParent()}
}
