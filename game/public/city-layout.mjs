import {boundaryRadius} from './arena.mjs';
export const LAYOUT_SEEDS=[73129,94063];export const DEFAULT_LAYOUT=LAYOUT_SEEDS[0];
function random(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};}
export function cityPlacements(manifest,seed=DEFAULT_LAYOUT){
 const rng=random(seed),out=[],building=/townhouse|garden_villa|twin_gable|market_arcade|terrace_bakery|apartment|^cafe$|^shop$/,occupied=[];
 const size=(key,scale)=>{const b=manifest.prefabs[key].bounds_blender;return [(b[1][0]-b[0][0])*scale[0],(b[1][1]-b[0][1])*scale[2]];};
 for(const p of manifest.props){if(building.test(p.prefab)||p.prefab.startsWith('car_')||['street_lamp','cafe_seating'].includes(p.prefab))continue;out.push({id:p.id,source:p.id,owner:p.owner,chunk:p.chunk});if(p.owner!=='castle_core'){const b=manifest.prefabs[p.prefab].bounds_blender;occupied.push({x:p.position[0],z:p.position[2],r:Math.hypot((b[1][0]-b[0][0])*p.scale[0],(b[1][1]-b[0][1])*p.scale[1])/2+.25});}}
 const cars=manifest.props.find(p=>p.prefab==='car_coral');for(const ring of [2,4,6,8])for(const j of [1,6]){const a=(j+.65)*Math.PI/4,r=13.2+(ring-.5)*3.8,p={id:`parked_car_${ring}_${j}`,source:cars.id,owner:`ring_${String(ring).padStart(2,'0')}`,chunk:`ring_${String(ring).padStart(2,'0')}_chunk_${String(j).padStart(2,'0')}`,position:[r*Math.cos(a),.02,r*Math.sin(a)],yaw:-a,scale:[.8,.8,.8]};out.push(p);occupied.push({x:p.position[0],z:p.position[2],r:1.4});}
 const keys=['townhouse_coral','townhouse_teal','townhouse_lavender','garden_villa','twin_gable','market_arcade','terrace_bakery'],anchors=Array.from({length:7},(_,i)=>({angle:(i+rng()*.7)*Math.PI*2/7,r:19+rng()*23}));
 for(let serial=0;serial<32;serial++){let placed=false;for(let attempt=0;attempt<1800&&!placed;attempt++){
  const anchor=anchors[(serial+Math.floor(attempt/60))%anchors.length],ring=Math.max(2,Math.min(9,Math.round((anchor.r-13.2)/3.8+.5+(rng()-.5)*3))),a=(anchor.angle+(rng()-.5)*.8+Math.PI*2)%(Math.PI*2),r=13.2+(ring-.5)*3.8+(rng()-.5)*.3,j=Math.floor(a/(Math.PI/4)),key=serial===0?'townhouse_coral':keys[Math.floor(rng()*keys.length)],source=manifest.props.find(p=>p.prefab===key),scale=key.startsWith('townhouse')?[.75+rng()*.18,1.3+rng()*.35,.80]:[.52+rng()*.12,.9+rng()*.25,.80],yaw=-a-Math.PI/2+(rng()-.5)*.13,[w,d]=size(key,scale),x=r*Math.cos(a),z=r*Math.sin(a),radius=Math.hypot(w,d)/2;
  if(occupied.some(p=>Math.hypot(x-p.x,z-p.z)<radius+p.r+.55))continue;
  let fits=true;for(const u of [-w/2,w/2])for(const v of [-d/2,d/2]){const cx=x+Math.cos(yaw)*u+Math.sin(yaw)*v,cz=z-Math.sin(yaw)*u+Math.cos(yaw)*v,ang=(Math.atan2(cz,cx)+Math.PI*2)%(Math.PI*2),rr=Math.hypot(cx,cz);if(rr<boundaryRadius(ring-1,ang)+.2||rr>boundaryRadius(ring,ang)-.2||ang<j*Math.PI/4+.02||ang>(j+1)*Math.PI/4-.02)fits=false;}if(!fits)continue;
  out.push({id:'city_home_'+serial,source:source.id,owner:`ring_${String(ring).padStart(2,'0')}`,chunk:`ring_${String(ring).padStart(2,'0')}_chunk_${String(j).padStart(2,'0')}`,position:[x,.05,z],yaw,scale});occupied.push({x,z,r:radius});placed=true;
 }if(!placed)throw Error('Cannot fit deterministic neighbourhood '+serial+' seed '+seed);}
 return out;
}
