import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

/** Environment presentation only. No eliminations, player state or physics engine. */
export class BopKingdomEnvironment {
  constructor(scene, collisionScene=null, participantCount=10) {
    this.scene=scene;this.collisionScene=collisionScene;this.core=scene.getObjectByName('castle_core');
    this.rings=Array.from({length:9},(_,i)=>scene.getObjectByName(`ring_${String(i+1).padStart(2,'0')}`));
    if(!this.core||this.rings.some(r=>!r))throw Error('Incomplete Bop Kingdom hierarchy');
    this.records=this.rings.map((root,i)=>({root,index:i,state:'unused',time:0,auto:false,chunks:root.children.filter(o=>o.userData.chunk===true).map((o,j)=>({object:o,position:o.position.clone(),quaternion:o.quaternion.clone(),index:j,lines:null}))}));
    if(this.records.some(r=>r.chunks.length!==8))throw Error('Each ring requires eight fracture chunks');
    this.colliders=[];collisionScene?.traverse(o=>{if(o.userData.collisionOnly)this.colliders.push(o)});
    this.warningSeconds=1.25;this.fractureSeconds=.38;this.cleanupDepth=120;this.listeners=[];
    this.setPlayerCount(participantCount);
  }
  setPlayerCount(count) {
    if(!Number.isInteger(count)||count<2||count>10)throw RangeError('Participants must be an integer from 2 to 10, including bots.');
    this.playerCount=count;this.activeCount=count-1;
    this.records.forEach((r,i)=>{r.state=i<count-1?'active':'unused';r.time=0;r.auto=false;r.root.visible=i<count-1;r.chunks.forEach(c=>{c.object.position.copy(c.position);c.object.quaternion.copy(c.quaternion);c.object.visible=true;if(c.lines)c.lines.visible=false;this.tint(c,0);});});
    this.core.visible=true;this.syncCollision();this.emit();return this.getState();
  }
  reset(){return this.setPlayerCount(this.playerCount)}
  /** Reserve the outermost still-active rings. Manual by default. */
  warnOuterRings(count=1,{automatic=false}={}) {
    if(!Number.isInteger(count)||count<0)throw RangeError('Ring count must be a non-negative integer.');
    const selected=this.records.filter(r=>r.state==='active').slice(-count || this.records.length).reverse();
    if(count===0)return [];
    selected.forEach(r=>{r.state='warning';r.time=0;r.auto=automatic;r.chunks.forEach(c=>this.makeCracks(c));this.transition(r,'warning')});
    this.activeCount=this.records.filter(r=>r.state==='active').length;this.emit();return selected.map(r=>r.root.name);
  }
  collapseOuterRings(count=1){return this.warnOuterRings(count,{automatic:true})}
  fractureRings(ids){for(const r of this.choose(ids)){if(r.state!=='warning')throw Error('Fracture requires warning state');r.state='fractured';r.time=0;this.transition(r,'fractured')}this.emit()}
  detachRings(ids){for(const r of this.choose(ids)){if(!['warning','fractured'].includes(r.state))throw Error('Detach requires warning or fractured state');r.state='falling';r.time=0;r.chunks.forEach(c=>{c.object.position.copy(c.position);c.object.quaternion.copy(c.quaternion);this.tint(c,0)});this.transition(r,'falling')}this.syncCollision();this.emit()}
  choose(ids){const names=ids||this.records.filter(r=>['warning','fractured'].includes(r.state)).map(r=>r.root.name);return names.map(id=>{const r=this.records.find(r=>r.root.name===id);if(!r)throw Error('Unknown ring '+id);return r})}
  transition(r,state){this.onTransition?.({ring:r.root.name,state});}
  syncCollision(){
    const enabledOwners=new Set(['castle_core',...this.records.filter(r=>['active','warning','fractured'].includes(r.state)).map(r=>r.root.name)]);
    const changed=[];for(const o of this.colliders){const enabled=enabledOwners.has(o.userData.owner);if(o.userData.enabled!==enabled)changed.push({id:o.name,owner:o.userData.owner,enabled});o.userData.enabled=enabled;o.visible=enabled;}
    if(changed.length)this.onCollisionChange?.(changed);
  }
  getActiveCollisionIds(){return this.colliders.filter(o=>o.userData.enabled).map(o=>o.name)}
  getState(){return {playerCount:this.playerCount,activeRings:this.records.filter(r=>r.state==='active').map(r=>r.root.name),visibleRings:this.records.filter(r=>r.root.visible).map(r=>r.root.name),states:Object.fromEntries(this.records.map(r=>[r.root.name,r.state])),coreVisible:this.core.visible}}
  emit(){this.onChange?.(this.getState())}
  makeCracks(c){
    if(c.lines){c.lines.visible=true;c.lines.geometry.setDrawRange(0,0);return;}
    const points=[];c.object.updateWorldMatrix(true,true);const inv=c.object.matrixWorld.clone().invert();
    c.object.traverse(o=>{if(!o.isMesh||!o.name.endsWith('_rock'))return;const edges=new THREE.EdgesGeometry(o.geometry,20),p=edges.attributes.position,m=new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld);
      for(let i=0;i<p.count;i+=2){const a=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(m),b=new THREE.Vector3().fromBufferAttribute(p,i+1).applyMatrix4(m);if(Math.abs(a.y-4)<.02&&Math.abs(b.y-4)<.02){a.y+=.07;b.y+=.07;points.push(a,b);}}
      edges.dispose();});
    const geo=new THREE.BufferGeometry().setFromPoints(points),mat=new THREE.LineBasicMaterial({color:0x8d483c,transparent:true,opacity:.9});
    c.lines=new THREE.LineSegments(geo,mat);c.lines.name='Warning fractures';c.lines.frustumCulled=false;c.object.add(c.lines);geo.setDrawRange(0,0);
  }
  tint(c,strength){c.object.traverse(o=>{if(o.isMesh&&o.name.endsWith('_rock')){if(!o.userData.warningMaterial){o.material=o.material.clone();o.userData.warningMaterial=true;}o.material.emissive.setHex(0xd36b42);o.material.emissiveIntensity=strength;}})}
  update(dt){
    if(!Number.isFinite(dt)||dt<0)throw RangeError('dt must be finite, non-negative seconds');
    for(const r of this.records){
      if(!['warning','fractured','falling'].includes(r.state))continue;r.time+=dt;
      if(r.state==='warning'){
        const spread=Math.min(1,r.time/this.warningSeconds);
        for(const c of r.chunks){c.object.position.copy(c.position);c.object.position.y+=Math.sin(r.time*42+c.index)*.035;this.tint(c,.055*(1+Math.sin(r.time*12)));if(c.lines)c.lines.geometry.setDrawRange(0,Math.floor(c.lines.geometry.attributes.position.count*spread/2)*2);}
        if(r.auto&&r.time>=this.warningSeconds)this.fractureRings([r.root.name]);
      } else if(r.state==='fractured') {
        const f=Math.min(1,r.time/this.fractureSeconds);
        for(const c of r.chunks){const radial=new THREE.Vector3(c.position.x,0,c.position.z).normalize();c.object.position.copy(c.position).addScaledVector(radial,.20*f);c.object.position.y-=.13*f;c.object.rotation.z=(c.index%2?1:-1)*.009*f;if(c.lines)c.lines.geometry.setDrawRange(0,Infinity);this.tint(c,.025);}
        if(r.auto&&r.time>=this.fractureSeconds)this.detachRings([r.root.name]);
      } else {
        const t=r.time;
        for(const c of r.chunks){const delay=c.index*.025,s=Math.max(0,t-delay),radial=new THREE.Vector3(c.position.x,0,c.position.z).normalize();
          c.object.position.copy(c.position).addScaledVector(radial,.20+(.7+c.index*.08)*s);c.object.position.y-=.13+1.5*s+9*s*s;
          const tangent=new THREE.Vector3(radial.z,0,-radial.x);const tilt=new THREE.Quaternion().setFromAxisAngle(tangent,(.16+c.index*.017)*s);const spin=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),(c.index%2?1:-1)*.065*s);c.object.quaternion.copy(c.quaternion).multiply(tilt).multiply(spin);
          if(c.lines)c.lines.visible=false;
          if(c.object.position.y-c.position.y < -this.cleanupDepth)c.object.visible=false;
        }
        if(r.chunks.every(c=>!c.object.visible)){r.state='removed';r.root.visible=false;this.transition(r,'removed');this.emit();}
      }
    }
  }
}

/** Merge presentation buffers only within a fracture chunk; named source nodes remain for lookup. */
export function instanceOwnedProps(scene){
  const owners=[];scene.traverse(o=>{if(o.userData.chunk===true||o.name==='castle_core')owners.push(o)});
  for(const owner of owners){const buckets=new Map();owner.updateWorldMatrix(true,true);owner.traverse(o=>{if(!o.isMesh||(!o.userData.prefab&&!o.parent.userData.prefab))return;const key=o.material.uuid;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o)});
    for(const group of buckets.values()){
      if(group.length<2)continue;const inv=owner.matrixWorld.clone().invert();
      const geometries=group.map(o=>{const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld));for(const name of Object.keys(g.attributes))if(!['position','normal','color'].includes(name))g.deleteAttribute(name);
        const src=g.attributes.color,colors=new Float32Array(g.attributes.position.count*3);for(let i=0;i<g.attributes.position.count;i++){colors[i*3]=src?src.getX(i):1;colors[i*3+1]=src?src.getY(i):1;colors[i*3+2]=src?src.getZ(i):1;}g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));return g;});
      const merged=mergeGeometries(geometries,false);if(!merged)throw Error('Chunk batching failed');const batch=new THREE.Mesh(merged,group[0].material);batch.name='BATCH_'+owner.name;group.forEach(o=>o.visible=false);owner.add(batch);geometries.forEach(g=>g.dispose());
    }
  }
}
