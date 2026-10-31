import * as T from 'three';
export class PlayerMarkers {
 constructor(hud){this.root=document.createElement('div');this.root.id='nameplates';this.near=document.createElement('div');this.near.id='nearby-players';hud.append(this.root,this.near);this.nodes=new Map();this.candidates=[];this.cards=Array.from({length:3},()=>{const node=document.createElement('div'),arrow=document.createElement('b'),label=document.createElement('span');node.className='nearby-target';arrow.textContent='↑';node.append(arrow,label);this.near.append(node);return {node,arrow,label};});}
 update({players,actors,camera,worldRoot,arena,rings,id,spectating,time,phase='round'}){
  if(phase==='ascent'){for(const rec of this.nodes.values())rec.node.hidden=true;this.cards.forEach(c=>c.node.hidden=true);this.candidates=[];return;}
  camera.updateMatrixWorld();const inverse=worldRoot.matrixWorld.clone().invert(),eye=camera.position.clone().applyMatrix4(inverse),me=players.find(p=>p.id===id),important=[];this.candidates=[];
  for(const p of players){let rec=this.nodes.get(p.id);if(!rec){const node=document.createElement('span');node.className='player-nameplate';this.root.append(node);rec={node,last:-1,clear:true};this.nodes.set(p.id,rec);}const actor=actors.get(p.id);rec.node.hidden=true;if(!actor||!p.alive)continue;
   actor.model.updateWorldMatrix(true,true);const head=actor.model.getObjectByName('mixamorigHead'),anchor=head?head.getWorldPosition(new T.Vector3()):actor.model.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,1,0));anchor.y+=.43;
   const local=anchor.clone().applyMatrix4(inverse),d=me?Math.hypot(p.x-me.x,p.z-me.z):eye.distanceTo(local),cameraDistance=eye.distanceTo(local),projected=anchor.clone().project(camera),front=anchor.clone().applyMatrix4(camera.matrixWorldInverse).z<0,onscreen=front&&Math.abs(projected.x)<.95&&Math.abs(projected.y)<.90;
   if(onscreen&&time-rec.last>.12){rec.clear=arena.sightClear(eye,local,rings);rec.last=time;}
   const visible=onscreen&&rec.clear&&cameraDistance<(spectating?220:48);if(visible){rec.node.hidden=false;rec.node.textContent=p.name+(p.slapper?' ●':'');rec.node.dataset.carrier=p.slapper?'1':'0';rec.node.style.left=(projected.x*.5+.5)*innerWidth+'px';rec.node.style.top=(-projected.y*.5+.5)*innerHeight+'px';rec.node.style.opacity=String(p.id===id?.55:Math.max(.2,Math.min(1,1-(cameraDistance-16)/(spectating?220:34))));rec.node.style.transform=`translate(-50%,-100%) scale(${Math.max(.68,Math.min(1,10/cameraDistance))})`;}
   if(phase==='round'&&!spectating&&me?.alive&&p.id!==id&&!visible&&d<32&&((me.slapper&&!p.slapper)||(!me.slapper&&p.slapper))){const approach=((me.x-p.x)*p.vx+(me.z-p.z)*p.vz)/(d||1);important.push({p,d,score:d-approach*2});}
  }
  for(const [key,rec] of this.nodes)if(!players.some(p=>p.id===key)){rec.node.remove();this.nodes.delete(key);}
  const forward=camera.getWorldDirection(new T.Vector3()).transformDirection(inverse),yaw=Math.atan2(forward.x,forward.z);const targets=important.sort((a,b)=>a.score-b.score).slice(0,3);this.cards.forEach(({node,arrow,label},i)=>{const target=targets[i];node.hidden=!target;if(!target)return;const {p,d}=target;arrow.style.transform=`rotate(${(Math.atan2(p.x-me.x,p.z-me.z)-yaw)*180/Math.PI}deg)`;const text=p.name+' · '+Math.round(d)+' m';if(label.textContent!==text)label.textContent=text;this.candidates.push(p.id);});
 }
 clear(){for(const r of this.nodes.values())r.node.remove();this.nodes.clear();this.cards.forEach(c=>c.node.hidden=true);}
}
