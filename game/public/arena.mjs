import {CHARACTER} from './character-config.mjs';
export const CORE=13.2, RING_WIDTH=3.8, PLAYER_RADIUS=CHARACTER.radius, PLAYER_HEIGHT=CHARACTER.height;
export const boundaryRadius=(rings,angle)=>CORE+rings*RING_WIDTH+.35*Math.sin(-3*angle)+.17*Math.sin(-7*angle);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// Closest-point triangle test, shared by the authoritative server and local prediction.
function distanceSq(px,py,pz,t){
 const ax=t[0],ay=t[1],az=t[2],bx=t[3],by=t[4],bz=t[5],cx=t[6],cy=t[7],cz=t[8];
 const abx=bx-ax,aby=by-ay,abz=bz-az,acx=cx-ax,acy=cy-ay,acz=cz-az,apx=px-ax,apy=py-ay,apz=pz-az;
 const d1=abx*apx+aby*apy+abz*apz,d2=acx*apx+acy*apy+acz*apz;
 let x,y,z;
 if(d1<=0&&d2<=0){x=ax;y=ay;z=az;}
 else {const bpx=px-bx,bpy=py-by,bpz=pz-bz,d3=abx*bpx+aby*bpy+abz*bpz,d4=acx*bpx+acy*bpy+acz*bpz;
 if(d3>=0&&d4<=d3){x=bx;y=by;z=bz;}
 else {const vc=d1*d4-d3*d2;
 if(vc<=0&&d1>=0&&d3<=0){const v=d1/(d1-d3);x=ax+v*abx;y=ay+v*aby;z=az+v*abz;}
 else {const cpx=px-cx,cpy=py-cy,cpz=pz-cz,d5=abx*cpx+aby*cpy+abz*cpz,d6=acx*cpx+acy*cpy+acz*cpz;
 if(d6>=0&&d5<=d6){x=cx;y=cy;z=cz;}
 else {const vb=d5*d2-d1*d6;
 if(vb<=0&&d2>=0&&d6<=0){const w=d2/(d2-d6);x=ax+w*acx;y=ay+w*acy;z=az+w*acz;}
 else {const va=d3*d6-d5*d4;
 if(va<=0&&(d4-d3)>=0&&(d5-d6)>=0){const w=(d4-d3)/((d4-d3)+(d5-d6));x=bx+w*(cx-bx);y=by+w*(cy-by);z=bz+w*(cz-bz);}
 else {const den=1/(va+vb+vc),v=vb*den,w=vc*den;x=ax+abx*v+acx*w;y=ay+aby*v+acy*w;z=az+abz*v+acz*w;}}}}}}
 return (px-x)**2+(py-y)**2+(pz-z)**2;
}

function segmentsSq(ax,ay,az,bx,by,bz,cx,cy,cz,dx,dy,dz){
 const ux=bx-ax,uy=by-ay,uz=bz-az,vx=dx-cx,vy=dy-cy,vz=dz-cz,wx=ax-cx,wy=ay-cy,wz=az-cz,a=ux*ux+uy*uy+uz*uz,b=ux*vx+uy*vy+uz*vz,c=vx*vx+vy*vy+vz*vz,d=ux*wx+uy*wy+uz*wz,e=vx*wx+vy*wy+vz*wz,den=a*c-b*b;
 let s=den>1e-12?clamp((b*e-c*d)/den,0,1):0,t=c>1e-12?(b*s+e)/c:0;if(t<0){t=0;s=clamp(-d/a,0,1)}else if(t>1){t=1;s=clamp((b-d)/a,0,1)}return (wx+s*ux-t*vx)**2+(wy+s*uy-t*vy)**2+(wz+s*uz-t*vz)**2;
}
function capsuleTriangleSq(x,y,z,r,height,t){
 const lo=y+r,hi=y+height-r,abx=t[3]-t[0],aby=t[4]-t[1],abz=t[5]-t[2],acx=t[6]-t[0],acy=t[7]-t[1],acz=t[8]-t[2],nx=aby*acz-abz*acy,ny=abz*acx-abx*acz,nz=abx*acy-aby*acx;
 if(Math.abs(ny)>1e-10){const hit=t[1]-(nx*(x-t[0])+nz*(z-t[2]))/ny;if(hit>=lo&&hit<=hi&&distanceSq(x,hit,z,t)<1e-10)return 0;}
 let best=Math.min(distanceSq(x,lo,z,t),distanceSq(x,hi,z,t));for(let k=0;k<3;k++){const a=k*3,b=(k+1)%3*3;best=Math.min(best,segmentsSq(x,lo,z,x,hi,z,t[a],t[a+1],t[a+2],t[b],t[b+1],t[b+2]));}return best;
}
// Highest lower-sphere contact on an edge, including rounded platform corners.
function edgeSupport(x,z,r,t,k){
 const a=k*3,b=(k+1)%3*3,dx=t[b]-t[a],dy=t[b+1]-t[a+1],dz=t[b+2]-t[a+2],px=x-t[a],pz=z-t[a+2],h2=dx*dx+dz*dz;let u;
 if(h2<1e-12){if(px*px+pz*pz>r*r)return -Infinity;u=dy>0?1:0;}else{const centre=(px*dx+pz*dz)/h2,remaining=r*r-(px*px+pz*pz-h2*centre*centre);if(remaining<0)return -Infinity;u=clamp(centre+dy*Math.sqrt(remaining)/(Math.sqrt(h2)*Math.sqrt(h2+dy*dy)),0,1);}
 const ex=t[a]+u*dx,ez=t[a+2]+u*dz,horizontal=(x-ex)**2+(z-ez)**2;if(horizontal>r*r)return -Infinity;const lift=Math.sqrt(Math.max(0,r*r-horizontal));return t[a+1]+u*dy+lift-r;
}

export class Arena {
 constructor(data){
  this.triangles=[];this.hash=new Map();this.cell=2;
  const f=data instanceof Float32Array?data:new Float32Array(data);
  for(let i=0;i<f.length;i+=10){const t=f.subarray(i,i+10),abx=t[3]-t[0],aby=t[4]-t[1],abz=t[5]-t[2],acx=t[6]-t[0],acy=t[7]-t[1],acz=t[8]-t[2];
   const nx=aby*acz-abz*acy,ny=abz*acx-abx*acz,nz=abx*acy-aby*acx,n=Math.hypot(nx,ny,nz);if(n<1e-7)continue;
   const rec={t,minX:Math.min(t[0],t[3],t[6]),maxX:Math.max(t[0],t[3],t[6]),minZ:Math.min(t[2],t[5],t[8]),maxZ:Math.max(t[2],t[5],t[8]),ring:t[9],normalX:nx/n,normalY:ny/n,normalZ:nz/n,minY:Math.min(t[1],t[4],t[7]),maxY:Math.max(t[1],t[4],t[7])},id=this.triangles.length;this.triangles.push(rec);
   for(let x=Math.floor((Math.min(t[0],t[3],t[6])-.4)/2);x<=Math.floor((Math.max(t[0],t[3],t[6])+.4)/2);x++)for(let z=Math.floor((Math.min(t[2],t[5],t[8])-.4)/2);z<=Math.floor((Math.max(t[2],t[5],t[8])+.4)/2);z++){const key=x+','+z;if(!this.hash.has(key))this.hash.set(key,[]);this.hash.get(key).push(id);}
  }
 }
 inside(x,z,rings,margin=0){return Math.hypot(x,z)<=boundaryRadius(rings,Math.atan2(z,x))-margin}
 near(x,z){return this.hash.get(Math.floor(x/2)+','+Math.floor(z/2))||[]}
 floor(x,z,ceiling,rings){
  if(!this.inside(x,z,rings))return -Infinity;let best=0;
  for(const id of this.near(x,z)){const {t,normalY,ring,minY}=this.triangles[id];if(ring>rings||normalY<.45||minY>ceiling)continue;
   const ax=t[0],az=t[2],bx=t[3],bz=t[5],cx=t[6],cz=t[8],den=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);if(Math.abs(den)<1e-9)continue;
   const a=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/den,b=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/den,c=1-a-b;
   if(a>=-.001&&b>=-.001&&c>=-.001){const y=a*t[1]+b*t[4]+c*t[7];if(y<=ceiling+.001&&y>best)best=y;}
  }return best;
 }
 blocked(x,z,y,rings,radius=PLAYER_RADIUS){
  for(const id of this.near(x,z)){const {t,ring,minY,maxY,minX,maxX,minZ,maxZ}=this.triangles[id];if(ring>rings||maxY<y-.002||minY>y+PLAYER_HEIGHT+.002||x+radius<minX||x-radius>maxX||z+radius<minZ||z-radius>maxZ)continue;
   if(capsuleTriangleSq(x,y,z,radius,PLAYER_HEIGHT,t)<(radius-.002)**2)return true;
  }return false;
 }
 // Rounded capsule contact supplies an invisible step ramp, without moving the art.
 // Search only one legal step above actual walkable support, never through a ceiling.
 groundHeight(x,z,ceiling,rings,radius=PLAYER_RADIUS){
  let floor=this.floor(x,z,ceiling,rings);if(!Number.isFinite(floor))return floor;
  for(const id of this.near(x,z)){const {t,ring,normalX:nx,normalY:ny,normalZ:nz,minX,maxX,minZ,maxZ,minY,maxY}=this.triangles[id];if(ring>rings||ny<.001||maxY<floor||minY>ceiling+radius||x+radius<minX||x-radius>maxX||z+radius<minZ||z-radius>maxZ)continue;
   const cy=t[1]+(radius-nx*(x-t[0])-nz*(z-t[2]))/ny,face=cy-radius;if(face>=floor&&face<=ceiling+.001&&distanceSq(x-radius*nx,cy-radius*ny,z-radius*nz,t)<1e-8)floor=face;
   for(let k=0;k<3;k++){const h=edgeSupport(x,z,radius,t,k);if(h>=floor&&h<=ceiling+.001)floor=h;}
  }return floor;
 }
 capsuleDepth(x,y,z,rings,radius=PLAYER_RADIUS){
  let depth=0;for(const id of this.near(x,z)){const {t,ring,minY,maxY,minX,maxX,minZ,maxZ}=this.triangles[id];if(ring>rings||maxY<y-.002||minY>y+PLAYER_HEIGHT+.002||x+radius<minX||x-radius>maxX||z+radius<minZ||z-radius>maxZ)continue;const sq=capsuleTriangleSq(x,y,z,radius,PLAYER_HEIGHT,t);if(sq<(radius-.002)**2)depth=Math.max(depth,radius-Math.sqrt(sq));}return depth;
 }
 capsuleBlockedBetween(a,b,rings){
  const r=PLAYER_RADIUS;for(const id of this.near(b.x,b.z)){const {t,ring,minY,maxY,minX,maxX,minZ,maxZ}=this.triangles[id];if(ring>rings||maxY<b.y-.002||minY>b.y+PLAYER_HEIGHT+.002||b.x+r<minX||b.x-r>maxX||b.z+r<minZ||b.z-r>maxZ)continue;const next=capsuleTriangleSq(b.x,b.y,b.z,r,PLAYER_HEIGHT,t);if(next>=(r-.002)**2)continue;const previous=capsuleTriangleSq(a.x,a.y,a.z,r,PLAYER_HEIGHT,t);if(Math.sqrt(previous)-Math.sqrt(next)>.0001||previous>=(r-.002)**2)return true;}return false;
 }
 vertical(p,dy,rings){
  const steps=Math.max(1,Math.ceil(Math.abs(dy)/.06)),d=dy/steps;let hit=false;
  for(let k=0;k<steps;k++){const old=p.y,next=old+d;if(this.capsuleBlockedBetween(p,{x:p.x,y:next,z:p.z},rings)){let low=0,high=1;for(let j=0;j<9;j++){const f=(low+high)/2;if(!this.capsuleBlockedBetween(p,{x:p.x,y:old+d*f,z:p.z},rings))low=f;else high=f;}p.y=old+d*low;hit=true;break;}p.y=next;}
  return hit;
 }
 move(p,dx,dz,rings){
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.08));let mx=0,mz=0;
  for(let i=0;i<steps;i++){
   for(const axis of ['x','z']){const d=(axis==='x'?dx:dz)/steps,x=p.x+(axis==='x'?d:0),z=p.z+(axis==='z'?d:0),floor=p.grounded?this.groundHeight(x,z,p.y+CHARACTER.step,rings):p.y,y=p.grounded&&floor>=p.y-CHARACTER.step?floor:p.y;
    const blocked=p.grounded?this.blocked(x,z,y,rings):this.capsuleBlockedBetween(p,{x,y:p.y,z},rings);
    if(!blocked){p[axis]+=d;if(p.grounded&&floor>=p.y-CHARACTER.step)p.y=y;if(axis==='x')mx+=d;else mz+=d;}
   }
  }return [mx,mz];
 }
 lineClear(a,b,rings){const d=Math.hypot(a.x-b.x,a.z-b.z),steps=Math.ceil(d/.2);for(let i=1;i<steps;i++){const f=i/steps;if(this.cameraBlocked(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f+.65,a.z+(b.z-a.z)*f,rings,.08))return false;}return true;}
 walkClear(a,b,rings,margin=.04){const p={...a,grounded:true},dx=b.x-a.x,dz=b.z-a.z,n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.1));for(let k=0;k<n;k++){this.move(p,dx/n,dz/n,rings);const support=this.groundHeight(p.x,p.z,p.y+.08,rings);if(!Number.isFinite(support)||p.y-support>CHARACTER.step+.02)return false;if(this.blocked(p.x,p.z,p.y,rings)||this.blocked(p.x,p.z,p.y+margin*2,rings,PLAYER_RADIUS+margin))return false;}return Math.hypot(p.x-b.x,p.z-b.z)<.03&&(!Number.isFinite(b.y)||Math.abs(p.y-b.y)<.12);}
 cameraBlocked(x,y,z,rings,radius=.22){
  for(const id of this.near(x,z)){const {t,ring,minY,maxY}=this.triangles[id];if(ring>rings||y+radius<minY||y-radius>maxY)continue;if(distanceSq(x,y,z,t)<radius*radius)return true;}return false;
 }
 cameraSweep(a,b,rings,radius=.22){
  const distance=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z),steps=Math.max(1,Math.ceil(distance/.10));
  for(let i=0;i<=steps;i++){const t=i/steps;if(this.cameraBlocked(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,a.z+(b.z-a.z)*t,rings,radius))return Math.max(0,(i-1)/steps);}return 1;
 }
 sightClear(a,b,rings){
  const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,n=Math.max(1,Math.ceil(Math.hypot(dx,dz))),seen=new Set();
  for(let i=0;i<=n;i++)for(const id of this.near(a.x+dx*i/n,a.z+dz*i/n)){if(seen.has(id))continue;seen.add(id);const {t,ring}=this.triangles[id];if(ring>rings)continue;const e1x=t[3]-t[0],e1y=t[4]-t[1],e1z=t[5]-t[2],e2x=t[6]-t[0],e2y=t[7]-t[1],e2z=t[8]-t[2],px=dy*e2z-dz*e2y,py=dz*e2x-dx*e2z,pz=dx*e2y-dy*e2x,det=e1x*px+e1y*py+e1z*pz;if(Math.abs(det)<1e-8)continue;const inv=1/det,tx=a.x-t[0],ty=a.y-t[1],tz=a.z-t[2],u=(tx*px+ty*py+tz*pz)*inv;if(u<0||u>1)continue;const qx=ty*e1z-tz*e1y,qy=tz*e1x-tx*e1z,qz=tx*e1y-ty*e1x,v=(dx*qx+dy*qy+dz*qz)*inv;if(v<0||u+v>1)continue;const f=(e2x*qx+e2y*qy+e2z*qz)*inv;if(f>.001&&f<.999)return false;
  }return true;
 }
}

export const NAV_STEP=.6,NAV_SIZE=161,NAV_ORIGIN=-48;
export class Navigation {
 constructor(arena){this.arena=arena;this.cache=new Map()}
 coord(x,z){return [clamp(Math.round((x-NAV_ORIGIN)/NAV_STEP),0,NAV_SIZE-1),clamp(Math.round((z-NAV_ORIGIN)/NAV_STEP),0,NAV_SIZE-1)]}
 index(x,z){const [a,b]=this.coord(x,z);return a+b*NAV_SIZE}
 position(i){return {x:NAV_ORIGIN+(i%NAV_SIZE)*NAV_STEP,z:NAV_ORIGIN+Math.floor(i/NAV_SIZE)*NAV_STEP}}
 grid(rings){
  if(this.cache.has(rings))return this.cache.get(rings);const size=NAV_SIZE*NAV_SIZE,valid=new Uint8Array(size),height=new Float32Array(size),edges=new Uint8Array(size);
  for(let i=0;i<size;i++){const {x,z}=this.position(i);if(!this.arena.inside(x,z,rings,.42))continue;const y=this.arena.groundHeight(x,z,3.0,rings);if(!this.arena.blocked(x,z,y,rings)&&!this.arena.blocked(x,z,y+.08,rings,PLAYER_RADIUS+.04)){valid[i]=1;height[i]=y;}}
  // Low castle courtyard/terraces are seeded from their own real top surfaces.
  for(let i=0;i<size;i++){const {x,z}=this.position(i);if(Math.hypot(x,z)<11.4){const y=this.arena.groundHeight(x,z,2.8,rings);if(!this.arena.blocked(x,z,y,rings)&&!this.arena.blocked(x,z,y+.08,rings,PLAYER_RADIUS+.04)){valid[i]=1;height[i]=y;}}}
  const dirs=[1,-1,NAV_SIZE,-NAV_SIZE,NAV_SIZE+1,-NAV_SIZE-1,NAV_SIZE-1,-NAV_SIZE+1];
  for(let i=0;i<size;i++)if(valid[i])for(let k=0;k<dirs.length;k++){const j=i+dirs[k];if(j<0||j>=size||!valid[j]||Math.abs(height[i]-height[j])>.76)continue;if(k>=4&&(!valid[i+([1,-1,-1,1][k-4])]||!valid[i+(k%2===0?NAV_SIZE:-NAV_SIZE)]))continue;const a=this.position(i),b=this.position(j),p={...a,y:height[i],grounded:true};this.arena.move(p,b.x-a.x,b.z-a.z,rings);if(Math.hypot(p.x-b.x,p.z-b.z)<.09)edges[i]|=1<<k;}
  // Navigation reserves reversible paths; jump-only drops are not used as escape guarantees.
  for(let i=0;i<size;i++)for(let k=0;k<dirs.length;k++)if(edges[i]&(1<<k)){const j=i+dirs[k];if(!(edges[j]&(1<<(k^1))))edges[i]&=~(1<<k);}
  // Discard sealed building interiors and other ground islands inaccessible from the courtyard.
  const connected=new Uint8Array(size),seed=this.index(0,4),queue=[seed];connected[seed]=1;
  for(let q=0;q<queue.length;q++){const i=queue[q];for(let k=0;k<dirs.length;k++)if(edges[i]&(1<<k)){const j=i+dirs[k];if(!connected[j]){connected[j]=1;queue.push(j);}}}
  for(let i=0;i<size;i++)if(!connected[i])valid[i]=edges[i]=0;
  const grid={valid,height,edges,dirs};this.cache.set(rings,grid);return grid;
 }
 route(from,to,rings){
  const g=this.grid(rings),start=this.nearest(this.index(from.x,from.z),g,from.y),target=this.nearest(this.index(to.x,to.z),g,to.y);if(start<0||target<0)return [];
  const came=new Int32Array(g.valid.length).fill(-1),queue=[start];came[start]=start;
  for(let q=0;q<queue.length&&came[target]<0;q++){const i=queue[q];for(let k=0;k<g.dirs.length;k++)if(g.edges[i]&(1<<k)){const j=i+g.dirs[k];if(came[j]<0){came[j]=i;queue.push(j);}}}
  if(came[target]<0)return [];
  const path=[];for(let i=target;i!==start;i=came[i])path.push({...this.position(i),y:g.height[i]});path.reverse();const centre=this.position(start);if(Math.hypot(from.x-centre.x,from.z-centre.z)>.06)path.unshift({...centre,y:g.height[start]});return path;
 }
 nearest(index,g,y){const supported=i=>g.valid[i]&&(!Number.isFinite(y)||Math.abs(g.height[i]-y)<.62);if(supported(index))return index;for(let r=1;r<12;r++)for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++){const i=index+dx+dz*NAV_SIZE;if(i>=0&&i<g.valid.length&&supported(i))return i;}return -1}
 escapeMap(current,future){
  const g=this.grid(current),dist=new Float32Array(g.valid.length).fill(Infinity),next=new Int32Array(g.valid.length).fill(-1),queue=[];
  for(let i=0;i<g.valid.length;i++)if(g.valid[i]){const p=this.position(i);if(this.arena.inside(p.x,p.z,future,.6)){dist[i]=0;next[i]=i;queue.push(i);}}
  for(let q=0;q<queue.length;q++){const i=queue[q];for(let k=0;k<g.dirs.length;k++){const j=i+g.dirs[k];if(j<0||j>=g.valid.length||!(g.edges[j]&(1<<(k^1))))continue;const cost=dist[i]+NAV_STEP*(k>=4?Math.SQRT2:1);if(cost<dist[j]-.001){dist[j]=cost;next[j]=i;queue.push(j);}}}
  return {dist,next,grid:g};
 }
}










