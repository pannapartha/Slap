import {boundaryRadius} from './public/arena.mjs';
import {CHARACTER} from './public/character-config.mjs';
const pointSegmentDistance=(p,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz)};
export function selectSpawns(arena,navigation,count,rings,rng=Math.random){
 const grid=navigation.grid(rings),candidates=[];
 for(let i=0;i<grid.valid.length;i+=2){if(!grid.valid[i]||grid.height[i]>1.5)continue;const p={...navigation.position(i),y:grid.height[i]},r=Math.hypot(p.x,p.z),angle=Math.atan2(p.z,p.x);
  if(!arena.inside(p.x,p.z,rings,2.5)||arena.blocked(p.x,p.z,p.y,rings,.55))continue;
  let seam=false;for(let k=0;k<=rings;k++)if(Math.abs(r-boundaryRadius(k,angle))<.65)seam=true;if(seam)continue;
  if([[.5,0],[-.5,0],[0,.5],[0,-.5]].some(([x,z])=>Math.abs(arena.floor(p.x+x,p.z+z,p.y+.2,rings)-p.y)>.18))continue;
  p.yaw=Math.atan2(-p.x,4-p.z);p.camera={x:p.x-Math.sin(p.yaw)*2.8,y:p.y+1.55,z:p.z-Math.cos(p.yaw)*2.8};
  if(arena.cameraSweep({x:p.x,y:p.y+.9,z:p.z},p.camera,rings)<.99)continue;candidates.push(p);
 }
 // Seeded shuffle makes each match reproducibly random, across the active island.
 for(let i=candidates.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
 const selected=[];
 while(selected.length<count){let best=null,score=-Infinity;
  for(const p of candidates){if(selected.includes(p))continue;const distance=selected.length?Math.min(...selected.map(q=>Math.hypot(p.x-q.x,p.z-q.z))):0;if(selected.length&&distance<CHARACTER.spacing)continue;
   if(selected.some(q=>pointSegmentDistance(p,q,q.camera)<1.05||pointSegmentDistance(q,p,p.camera)<1.05))continue;
   const value=selected.length?Math.min(distance,5):1;if(value>score){best=p;score=value;}}
  if(!best)throw Error(`Only ${selected.length} separated camera-clear spawn locations found for ${count} participants`);selected.push(best);
 }
 return selected.map(({camera,...p})=>p);
}
