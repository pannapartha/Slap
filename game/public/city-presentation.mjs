import * as T from 'three';
import {cityPlacements} from './city-layout.mjs';
import {BUILDING} from './character-config.mjs';
export function arrangeCity(scene,manifest,seed){
 scene.updateMatrixWorld(true);const originals=new Map();scene.traverse(o=>{if(o.userData.prefab)originals.set(o.name,o);});
 const plan=cityPlacements(manifest,seed),keep=new Set(plan.filter(p=>p.id===p.source).map(p=>p.id));
 const buildings=[],props=[];
 for(const p of plan){let o=originals.get(p.source);if(!o)throw Error('Missing city kit '+p.source);
  if(p.position){o=o.clone(true);o.name=p.id;o.userData={...o.userData,owner:p.owner,chunk:p.chunk};const parent=scene.getObjectByName(p.chunk||p.owner);parent.add(o);parent.updateWorldMatrix(true,false);o.matrix.copy(new T.Matrix4().compose(new T.Vector3(...p.position),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),p.yaw),new T.Vector3(...p.scale))).premultiply(parent.matrixWorld.clone().invert());o.matrix.decompose(o.position,o.quaternion,o.scale);}
  props.push(o);if(BUILDING.test(o.userData.prefab)){o.traverse(mesh=>{if(!mesh.isMesh)return;mesh.material=Array.isArray(mesh.material)?mesh.material.map(m=>m.clone()):mesh.material.clone();});buildings.push(o);}
 }
 for(const [id,o] of originals)if(!keep.has(id))o.removeFromParent();scene.updateMatrixWorld(true);
 return {buildings,props,plan};
}
export class BuildingOcclusion {
 constructor(buildings){this.buildings=buildings;this.ray=new T.Raycaster();this.faded=0;}
 update(camera,focus,preferred,dt){
  const hit=new Set();for(const origin of [camera,preferred]){const direction=focus.clone().sub(origin),length=direction.length();this.ray.set(origin,direction.normalize());this.ray.far=length-.12;
   for(const b of this.buildings){if(!b.parent||!b.visible)continue;if(this.ray.intersectObject(b,true).length)hit.add(b);}}
  this.faded=0;for(const b of this.buildings){const target=hit.has(b)?0:1,current=b.userData.cameraOpacity??1,opacity=current+(target-current)*(1-Math.exp(-dt*(target===0?18:8)));b.userData.cameraOpacity=opacity;if(opacity<.98)this.faded++;
   b.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){const transparent=opacity<.995;if(m.transparent!==transparent){m.transparent=transparent;m.needsUpdate=true;}m.opacity=opacity<.005?0:opacity;m.depthWrite=!transparent;}});
  }
 }
}
let texture;
function shadowMaterial(){if(!texture){const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const c=canvas.getContext('2d'),g=c.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'rgba(27,23,43,.45)');g.addColorStop(.5,'rgba(27,23,43,.24)');g.addColorStop(1,'rgba(27,23,43,0)');c.fillStyle=g;c.fillRect(0,0,64,64);texture=new T.CanvasTexture(canvas);}return new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,toneMapped:false});}
export function contactShadow(parent,x,y,z,width,depth){const mesh=new T.Mesh(new T.PlaneGeometry(1,1),shadowMaterial());mesh.name='Contact shadow';mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y+.018,z);mesh.scale.set(width,depth,1);parent.add(mesh);return mesh;}
export function cityShadows(city,arena){for(const p of city.props){if(!BUILDING.test(p.userData.prefab)&&!/^car_|fountain|round_tree|garden_pavilion/.test(p.userData.prefab))continue;
 const box=new T.Box3().setFromObject(p),size=box.getSize(new T.Vector3()),centre=box.getCenter(new T.Vector3());if(p.userData.prefab==='castle_courtyard'){contactShadow(p.parent,0,0,0,26.5,26.5);continue;}const y=arena.floor(centre.x,centre.z,box.min.y+.08,9),point=p.parent.worldToLocal(new T.Vector3(centre.x,y,centre.z));contactShadow(p.parent,point.x,point.y,point.z,size.x*1.3,size.z*1.3);}}
