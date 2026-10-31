import {botIntent} from './bots.mjs';
import {boundaryRadius,NAV_STEP} from './public/arena.mjs';
import {selectSpawns} from './spawn.mjs';
import {CHARACTER} from './public/character-config.mjs';
import {RECOVERY,validColor} from './public/character-options.mjs';
export const RULES=Object.freeze({hz:60,maxPlayers:10,carrierMultiplier:1.15,tagRecovery:RECOVERY.duration,walkSpeed:CHARACTER.walk,runSpeed:CHARACTER.run,sprintSpeed:CHARACTER.sprint,acceleration:10,deceleration:16,turnRate:16,dashDistance:CHARACTER.dash,dashSpeed:CHARACTER.dash/.22,dashSeconds:.22,dashCooldown:4,jumpImpulse:CHARACTER.jump,slapRange:CHARACTER.slap,slapCos:.35,slapCooldown:.52,passImmunity:.8,freezeSeconds:1.5,warningSeconds:5,ascentSeconds:2.5,laterAscentSeconds:1.5,roundMin:10,roundMax:17,earthRadiusKm:6371});
export const gravityAtAltitude=h=>9.81*(6371/(6371+Math.max(0,h)))**2;
export const HALF_GRAVITY_ALTITUDE=6371*(Math.SQRT2-1);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function seeded(seed=1){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;}}
export class Match {
 constructor({players,bombs=1,arena,navigation,seed=Date.now(),matchNumber=1,layoutSeed=73129,difficulty='easy',roundRange=[RULES.roundMin,RULES.roundMax]}){
  if(players.length<2||players.length>10)throw Error('A match needs 2–10 participants');this.arena=arena;this.nav=navigation;this.layoutSeed=layoutSeed;this.difficulty=difficulty==='hard'?'hard':'easy';this.rng=seeded(seed);this.initial=players.length;this.bombs=clamp(Math.floor(bombs),1,3);this.matchNumber=matchNumber;this.roundRange=roundRange;this.tick=0;this.time=0;this.phase='countdown';this.deadline=180;this.round=0;this.roundStarted=0;this.fuseEnd=0;this.altitude=0;this.gravity=9.81;this.activeRings=players.length-1;this.warningRings=[];this.events=[];this.eventId=0;this.winner=null;this.pendingEliminations=[];this.lastEliminated=[];this.ascentNumber=0;this.ascentDuration=0;this.ascentStart=0;this.ascentFrom=0;this.ascentTarget=0;
  this.spawnLocations=selectSpawns(arena,navigation,players.length,this.activeRings,this.rng);
  this.players=players.map((p,i)=>{const spawn=this.spawnLocations[i],yaw=spawn.yaw;return {...p,color:validColor(p.color),...spawn,moveVx:0,moveVz:0,dashRemaining:0,vx:0,vy:0,vz:0,yaw,alive:true,connected:true,slapper:false,frozen:false,grounded:true,input:{x:0,z:0,yaw},inputSeq:-1,actionSeq:0,slapAt:-100,slapSeq:0,jumpAt:-100,jumpSeq:0,dashAt:-100,dashSeq:0,landAt:-100,hitAt:-100,hitSeq:0,eliminatedAt:null,passProtectedUntil:0,route:[],thinkAt:0,stumbleUntil:0,knockdownUntil:0,recoveryUntil:0,recoveryDuration:0};});
  this.emit('countdown',{names:this.players.map(p=>p.name)});
 }
 get alive(){return this.players.filter(p=>p.alive)}
 emit(type,data={}){const e={...data,seq:++this.eventId,type,tick:this.tick,at:this.time};this.events.push(e);if(this.events.length>160)this.events.shift();return e}
 setInput(id,input){const p=this.players.find(p=>p.id===id);if(this.phase==='ascent'||!p||!p.alive||!Number.isSafeInteger(input.seq)||input.seq<=p.inputSeq)return false;p.inputSeq=input.seq;p.input={x:clamp(Number(input.x)||0,-1,1),z:clamp(Number(input.z)||0,-1,1),yaw:Number.isFinite(input.yaw)?input.yaw:p.yaw,jump:!!input.jump,dash:!!input.dash,slap:!!input.slap,walk:!!input.walk,sprint:!!input.sprint,lookYaw:Number.isFinite(input.lookYaw)?input.lookYaw:p.yaw,actionSeq:Number.isSafeInteger(input.actionSeq)?input.actionSeq:0};p.lastInput=this.time;return true}
 beginRound(){
  if(this.alive.length<=1)return this.finish();this.round++;this.phase='round';this.roundStarted=this.time;this.fuseEnd=this.tick+Math.round((this.roundRange[0]+this.rng()*(this.roundRange[1]-this.roundRange[0]))*60);this.deadline=this.fuseEnd;
  for(const p of this.players){p.slapper=false;p.frozen=false;p.passProtectedUntil=this.time+.75;}
  const pool=[...this.alive];for(let i=pool.length-1;i>0;i--){const j=Math.floor(this.rng()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  const count=Math.min(this.bombs,this.alive.length-1);for(const p of pool.slice(0,count))p.slapper=true;this.emit('round',{round:this.round,count,slappers:this.alive.filter(p=>p.slapper).map(p=>p.id),deadline:this.deadline});
 }
 freeze(){this.phase='freeze';this.deadline=this.tick+90;for(const p of this.alive)if(p.slapper){p.frozen=true;p.vx=p.vy=p.vz=0;p.frozenPosition=[p.x,p.y,p.z];}this.emit('freeze',{ids:this.alive.filter(p=>p.slapper).map(p=>p.id),explodeAt:this.deadline});}
 explode(){
  const victims=this.alive.filter(p=>p.frozen&&p.slapper),centres=victims.map(p=>({id:p.id,name:p.name,x:p.x,y:p.y,z:p.z}));
  for(const p of victims)this.eliminate(p,'explosion');
  for(const p of this.alive){let distance=Infinity;for(const b of centres)distance=Math.min(distance,Math.hypot(p.x-b.x,p.y-b.y,p.z-b.z));if(distance<18){p.hitAt=this.time;p.hitSeq++;p.reaction=distance<6?'knockdown':'stumble';p.knockdownUntil=distance<6?this.time+.65:0;p.stumbleUntil=this.time+(distance<6?1.35:.75);}}
  this.emit('explosion',{centres,names:victims.map(p=>p.name)});this.startWarning();
 }
 eliminate(p,reason){if(!p.alive)return;p.alive=false;p.slapper=false;p.frozen=false;p.eliminatedAt=this.time;p.vx=p.vz=0;this.pendingEliminations.push(p.id);this.emit('eliminated',{id:p.id,name:p.name,reason});}
 startWarning(){
  const count=Math.min(this.pendingEliminations.length,this.activeRings);this.lastEliminated=this.pendingEliminations.map(id=>this.players.find(p=>p.id===id)?.name);this.pendingEliminations=[];
  this.warningRings=Array.from({length:count},(_,i)=>`ring_${String(this.activeRings-i).padStart(2,'0')}`);this.futureRings=this.activeRings-count;this.phase='warning';this.warningStarted=this.tick;this.deadline=this.tick+300;
  this.escape=this.nav?.escapeMap(this.activeRings,this.futureRings);this.emit('warning',{rings:this.warningRings,names:this.lastEliminated,detachAt:this.deadline,futureRings:this.futureRings});
 }
 detach(){
  const rings=[...this.warningRings];this.activeRings=this.futureRings;this.phase='ascent';this.ascentNumber++;this.ascentDuration=this.ascentNumber===1?RULES.ascentSeconds:RULES.laterAscentSeconds;this.deadline=this.tick+Math.round(this.ascentDuration*60);this.ascentStart=this.tick;this.ascentFrom=this.altitude;
  for(const p of this.alive){p.stranded=!this.arena.inside(p.x,p.z,this.activeRings,.2);p.cinematicVelocity={vx:p.vx,vy:p.vy,vz:p.vz,moveVx:p.moveVx,moveVz:p.moveVz,dashRemaining:p.dashRemaining};p.vx=p.vy=p.vz=0;}
  const progress=this.initial<=2?1:clamp((this.initial-this.alive.length)/(this.initial-2),0,1);this.ascentTarget=HALF_GRAVITY_ALTITUDE*progress;
  this.emit('detach',{rings,activeRings:this.activeRings,altitudeTarget:this.ascentTarget,gravityTarget:gravityAtAltitude(this.ascentTarget),duration:this.ascentDuration,ascentNumber:this.ascentNumber});
 }
 finish(){this.phase='won';this.winner=this.alive[0]?.id||null;this.deadline=0;for(const p of this.players){p.slapper=false;p.frozen=false;p.vx=p.vz=0;}if(this.alive[0])Object.assign(this.alive[0],{x:0,y:1.28,z:4,yaw:0,vy:0,grounded:true});this.emit('winner',{id:this.winner,name:this.alive[0]?.name||'No survivor',dance:this.matchNumber%2?'VictoryA':'VictoryB'});}
 slap(p){
  if(this.phase!=='round'||!p.alive||p.frozen||this.time-p.slapAt<RULES.slapCooldown||this.time<Math.max(p.knockdownUntil,p.recoveryUntil))return false;
  p.slapAt=this.time;p.slapSeq++;const targets=this.alive.filter(q=>q!==p&&!q.frozen&&this.time>=q.recoveryUntil&&Math.abs(p.y-q.y)<1.1).map(q=>({q,d:Math.hypot(q.x-p.x,q.z-p.z)})).filter(({q,d})=>d<RULES.slapRange&&d>.01&&((q.x-p.x)*Math.sin(p.yaw)+(q.z-p.z)*Math.cos(p.yaw))/d>RULES.slapCos).sort((a,b)=>a.d-b.d);
  const target=targets.find(({q})=>this.arena.lineClear(p,q,this.activeRings))?.q;this.emit('slap',{id:p.id,target:target?.id||null,seq:p.slapSeq});
  if(!target||!p.slapper||target.slapper||this.time<target.passProtectedUntil)return false;
  p.slapper=false;target.slapper=true;const duration=RULES.tagRecovery;target.recoveryDuration=duration;target.recoveryUntil=this.time+duration;target.dashRemaining=0;target.moveVx=target.moveVz=target.vx=target.vz=0;p.passProtectedUntil=this.time+Math.max(RULES.passImmunity,duration+.15);target.passProtectedUntil=target.recoveryUntil+.15;target.hitSeq++;target.hitAt=this.time;target.reaction='tag';const max=p.input.walk?RULES.walkSpeed:p.input.sprint?RULES.sprintSpeed:RULES.runSpeed,n=Math.hypot(p.moveVx,p.moveVz);if(n>max){p.moveVx*=max/n;p.moveVz*=max/n;p.vx=p.moveVx;p.vz=p.moveVz;} this.emit('pass',{from:p.id,to:target.id,round:this.round});return true;
 }
 bot(p){p.input=botIntent(this,p);}

 step(){
  this.tick++;this.time=this.tick/60;
  if(this.tick>=this.deadline&&this.deadline){if(this.phase==='countdown')this.beginRound();else if(this.phase==='round')this.freeze();else if(this.phase==='freeze')this.explode();else if(this.phase==='warning')this.detach();else if(this.phase==='ascent'){this.altitude=this.ascentTarget;this.gravity=gravityAtAltitude(this.altitude);for(const p of this.alive)if(p.cinematicVelocity){Object.assign(p,p.cinematicVelocity);delete p.cinematicVelocity;p.input={x:0,z:0,yaw:p.yaw};}if(this.pendingEliminations.length)this.startWarning();else if(this.alive.length<=1)this.finish();else this.beginRound();}}
  if(this.phase==='ascent'){const f=clamp((this.tick-this.ascentStart)/(this.ascentDuration*60),0,1),s=f*f*(3-2*f);this.altitude=this.ascentFrom+(this.ascentTarget-this.ascentFrom)*s;this.gravity=gravityAtAltitude(this.altitude);for(const p of this.players)for(const field of ['slapAt','jumpAt','dashAt','landAt','hitAt','passProtectedUntil','recoveryUntil','knockdownUntil','stumbleUntil'])if(Number.isFinite(p[field]))p[field]+=1/60;}
  for(const p of this.players){
   if(!p.alive)continue;if(p.bot)this.bot(p);if(p.frozen||['countdown','won','ascent'].includes(this.phase)){p.vx=p.vz=p.moveVx=p.moveVz=0;continue;}
   let i=p.input;if(!p.bot&&this.time-(p.lastInput??this.time)>.4)i={x:0,z:0,yaw:p.yaw};const desiredYaw=i.yaw??p.yaw;p.yaw+=Math.atan2(Math.sin(desiredYaw-p.yaw),Math.cos(desiredYaw-p.yaw))*(1-Math.exp(-RULES.turnRate/60));
   const fresh=(i.actionSeq||0)>p.actionSeq;if(fresh){p.actionSeq=i.actionSeq;if(i.slap)this.slap(p);if(i.jump&&p.grounded&&this.time>=Math.max(p.knockdownUntil,p.recoveryUntil)){p.vy=RULES.jumpImpulse;p.grounded=false;p.jumpAt=this.time;p.jumpSeq++;}if(i.dash&&this.time-p.dashAt>=RULES.dashCooldown&&this.time>=Math.max(p.knockdownUntil,p.recoveryUntil)){p.dashAt=this.time;p.dashSeq++;const length=Math.hypot(i.x||0,i.z||0);p.dashDirection=length>.05?[i.x/length,i.z/length]:[Math.sin(p.yaw),Math.cos(p.yaw)];p.dashRemaining=RULES.dashDistance;}}
   const n=Math.hypot(i.x||0,i.z||0),baseSpeed=i.walk?RULES.walkSpeed:i.sprint?RULES.sprintSpeed:RULES.runSpeed,speed=this.time<Math.max(p.knockdownUntil,p.recoveryUntil)?0:baseSpeed*(p.slapper?RULES.carrierMultiplier:1);p.speedLimit=speed;
   const desiredX=n>.01?(i.x||0)/Math.max(1,n)*speed:0,desiredZ=n>.01?(i.z||0)/Math.max(1,n)*speed:0,deltaX=desiredX-p.moveVx,deltaZ=desiredZ-p.moveVz,difference=Math.hypot(deltaX,deltaZ),maxDelta=(n>.01?RULES.acceleration:RULES.deceleration)/60;
   if(difference<=maxDelta){p.moveVx=desiredX;p.moveVz=desiredZ;}else{p.moveVx+=deltaX/difference*maxDelta;p.moveVz+=deltaZ/difference*maxDelta;}
   let moveX=p.moveVx/60,moveZ=p.moveVz/60;
   if(p.dashRemaining>0&&this.time>=Math.max(p.knockdownUntil,p.recoveryUntil)){const burst=Math.min(p.dashRemaining,RULES.dashSpeed/60);moveX=p.dashDirection[0]*burst;moveZ=p.dashDirection[1]*burst;p.dashRemaining-=burst;}
   const oldX=p.x,oldZ=p.z,oldY=p.y;this.arena.move(p,moveX,moveZ,this.activeRings);
   // Evacuation grace prevents survivors body-blocking a certified five-second escape route.
   if(!['warning','ascent'].includes(this.phase)&&this.alive.some(q=>q!==p&&Math.abs(q.y-p.y)<.8&&Math.hypot(q.x-p.x,q.z-p.z)<.68&&Math.hypot(q.x-p.x,q.z-p.z)<Math.hypot(q.x-oldX,q.z-oldZ))){p.x=oldX;p.z=oldZ;p.y=oldY;}
   p.vx=(p.x-oldX)*60;p.vz=(p.z-oldZ)*60;
   const floor=this.arena.groundHeight(p.x,p.z,p.y+.08,this.activeRings);if(p.grounded&&p.y-floor>.08)p.grounded=false;else if(p.grounded&&Number.isFinite(floor)){p.y=floor;p.vy=0;}
   if(!p.grounded){const prev=p.y;p.vy-=this.gravity/60;const down=p.vy<=0,hit=this.arena.vertical(p,p.vy/60,this.activeRings),ground=this.arena.groundHeight(p.x,p.z,prev+.05,this.activeRings);if(down&&(p.y<=ground+.005||hit&&Math.abs(p.y-ground)<.12)){p.y=ground;p.vy=0;p.grounded=true;p.landAt=this.time;}else if(hit)p.vy=0;}
   if(p.y<-22)this.eliminate(p,'fell');
   // The original island edge is a safety boundary; only visibly detached ground can strand players.
   if(p.stranded&&p.grounded&&this.arena.inside(p.x,p.z,this.activeRings,.2))p.stranded=false;
   if(!p.stranded&&!['warning','ascent'].includes(this.phase)&&!this.arena.inside(p.x,p.z,this.activeRings,.2)){const a=Math.atan2(p.z,p.x),r=boundaryRadius(this.activeRings,a)-.25;p.x=Math.cos(a)*r;p.z=Math.sin(a)*r;}
  }
  if(this.phase==='round'&&this.alive.length<=1){this.pendingEliminations.length?this.startWarning():this.finish();}
 }
 snapshot(){return {layoutSeed:this.layoutSeed,difficulty:this.difficulty,tick:this.tick,time:this.time,phase:this.phase,deadline:this.deadline,round:this.round,roundStarted:this.roundStarted,fuseEnd:this.fuseEnd,activeRings:this.activeRings,warningRings:this.warningRings,futureRings:this.futureRings,gravity:this.gravity,altitude:this.altitude,ascentStart:this.ascentStart,ascentNumber:this.ascentNumber,ascentDuration:this.ascentDuration,ascentTarget:this.ascentTarget,ascentFrom:this.ascentFrom,initial:this.initial,bombs:this.bombs,winner:this.winner,dance:this.matchNumber%2?'VictoryA':'VictoryB',lastEliminated:this.lastEliminated,events:this.events.slice(-60),players:this.players.map(p=>{
  const fields=Object.fromEntries(['id','name','color','bot','x','y','z','vx','vy','vz','yaw','alive','connected','slapper','frozen','grounded','inputSeq','slapSeq','slapAt','jumpSeq','jumpAt','dashSeq','dashAt','hitSeq','hitAt','reaction','recoveryUntil','recoveryDuration','speedLimit','stuckRecoveries','landAt','eliminatedAt'].map(k=>[k,p[k]]));
  fields.collapseDanger=this.phase==='warning'&&p.alive&&!this.arena.inside(p.x,p.z,this.futureRings);
  if(this.phase==='warning'&&p.alive&&this.escape){const i=this.nav.nearest(this.nav.index(p.x,p.z),this.escape.grid),n=this.escape.next[i];if(n>=0)fields.escape={...this.nav.position(n),distance:this.escape.dist[i]};}return fields;
 })};}
}

