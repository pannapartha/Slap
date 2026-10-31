import * as THREE from 'three';
export class BlastEffects {
 constructor(scene,{mobile=false}={}){this.root=new THREE.Group();scene.add(this.root);this.mobile=mobile;this.blasts=[];this.sphere=new THREE.IcosahedronGeometry(1,1);this.ring=new THREE.TorusGeometry(1,.035,4,48);this.cube=new THREE.BoxGeometry(.22,.22,.22);this.seed=1;}
 clear(){for(const b of this.blasts){b.group.traverse(o=>{if(o.material)o.material.dispose()});b.sparks.geometry.dispose();b.wind.geometry.dispose();b.group.removeFromParent();}this.blasts=[];}
 explosion(e,altitude=0){for(const c of e.centres){const group=new THREE.Group();group.position.set(c.x,c.y+1,c.z);this.root.add(group);const items=[];
  for(let i=0;i<(this.mobile?12:22);i++){const smoke=i>7,mat=new THREE.MeshBasicMaterial({color:smoke?new THREE.Color().setHSL(.07,.04,.24+Math.random()*.2):i%3?0xff7a2e:0xffe6a3,transparent:true,opacity:1,depthWrite:!smoke}),o=new THREE.Mesh(this.sphere,mat);group.add(o);const a=Math.random()*Math.PI*2,r=Math.random()*2.5;items.push({o,smoke,x:Math.cos(a)*r,z:Math.sin(a)*r,y:Math.random()*4,scale:smoke?1.5+Math.random()*2:.8+Math.random()*1.4});}
  const shock=new THREE.Mesh(this.ring,new THREE.MeshBasicMaterial({color:0xffe8ba,transparent:true,opacity:1,depthWrite:false,toneMapped:false}));shock.rotation.x=Math.PI/2;shock.position.y=-.6;group.add(shock);
  const flash=new THREE.Mesh(this.sphere,new THREE.MeshBasicMaterial({color:0xfff5dd,transparent:true,opacity:1,depthWrite:false,toneMapped:false}));group.add(flash);
  const count=this.mobile?40:90,positions=new Float32Array(count*3),velocity=[];for(let i=0;i<count;i++){velocity.push(new THREE.Vector3((Math.random()-.5)*24,Math.random()*18+3,(Math.random()-.5)*24));}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));const sparks=new THREE.Points(geo,new THREE.PointsMaterial({color:0xffd294,size:.18,transparent:true,depthWrite:false}));group.add(sparks);
  const debris=[];for(let i=0;i<(this.mobile?6:12);i++){const o=new THREE.Mesh(this.cube,new THREE.MeshBasicMaterial({color:[0xffbd84,0xb59ada,0x75b8b5][i%3]}));group.add(o);debris.push({o,v:new THREE.Vector3((Math.random()-.5)*12,Math.random()*10+5,(Math.random()-.5)*12)});}
  const windGeo=new THREE.BufferGeometry(),windPos=new Float32Array(24*6);windGeo.setAttribute('position',new THREE.BufferAttribute(windPos,3));const wind=new THREE.LineSegments(windGeo,new THREE.LineBasicMaterial({color:0xdbe9f2,transparent:true,opacity:.3,depthWrite:false}));group.add(wind);
  this.blasts.push({group,items,shock,flash,sparks,velocity,debris,wind,born:e.at,centre:c,altitude});}
 }
 update(time,altitude){
  for(const b of [...this.blasts]){const age=time-b.born;if(age<0)continue;if(age>15){b.group.traverse(o=>{if(o.material)o.material.dispose()});b.sparks.geometry.dispose();b.wind.geometry.dispose();b.group.removeFromParent();this.blasts.splice(this.blasts.indexOf(b),1);continue;}
   b.group.position.y=b.centre.y+1-(altitude-b.altitude)*.035;
   for(const p of b.items){const t=p.smoke?Math.max(0,age-.2):age;p.o.visible=p.smoke||age<1.5;p.o.position.set(p.x*(1+t*.32),p.y+Math.min(8,t*1.7),p.z*(1+t*.32));p.o.scale.setScalar(p.scale*(p.smoke?1+Math.min(2,t*.25):.3+Math.sin(Math.min(1,t/1.4)*Math.PI)*3));p.o.material.opacity=p.smoke?Math.max(0,1-age/15)*.72:Math.max(0,1-age/1.5);}
   b.flash.visible=age<.18;b.flash.scale.setScalar(1.4+age*22);b.flash.material.opacity=Math.max(0,1-age/.18);b.shock.visible=age<1.5;b.shock.scale.setScalar(1+age*22);b.shock.material.opacity=Math.max(0,1-age/1.5);
   for(const {o,v} of b.debris){o.visible=age<3;o.position.copy(v).multiplyScalar(age);o.position.y-=4.9*age*age;o.rotation.set(age*4,age*2,age*5);}
   b.wind.visible=age<1.2;const wind=b.wind.geometry.attributes.position;for(let i=0;i<24;i++){const a=i/24*Math.PI*2,r=2+age*20;wind.setXYZ(i*2,Math.cos(a)*r,.5+(i%4)*.4,Math.sin(a)*r);wind.setXYZ(i*2+1,Math.cos(a)*(r+2),.6+(i%4)*.4,Math.sin(a)*(r+2));}wind.needsUpdate=true;b.wind.material.opacity=Math.max(0,.35*(1-age/1.2));
   const arr=b.sparks.geometry.attributes.position;for(let i=0;i<b.velocity.length;i++){const v=b.velocity[i];arr.setXYZ(i,v.x*age,v.y*age-4.9*age*age,v.z*age);}arr.needsUpdate=true;b.sparks.visible=age<2.5;b.sparks.material.opacity=Math.max(0,1-age/2.5);
  }
 }
}
