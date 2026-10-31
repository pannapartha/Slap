import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
export const SKY_STOPS=[{at:0,top:0x78b8e4,horizon:0xc2e1ee,sun:0xffd5a5,power:2.7,ambient:1.2},{at:.30,top:0xb8a7dd,horizon:0xffc49a,sun:0xffbb83,power:2.7,ambient:1.15},{at:.65,top:0x5e609e,horizon:0xd7a5c9,sun:0xffb7a3,power:1.9,ambient:1.1},{at:1,top:0x121e45,horizon:0x646891,sun:0xb9cdff,power:1.65,ambient:1.05}];
export function atmosphereAt(progress){const p=T.MathUtils.clamp(progress,0,1),b=SKY_STOPS.find(s=>s.at>=p)||SKY_STOPS.at(-1),a=SKY_STOPS[Math.max(0,SKY_STOPS.indexOf(b)-1)],t=b.at===a.at?0:(p-a.at)/(b.at-a.at),f=t*t*(3-2*t);return {top:new T.Color(a.top).lerp(new T.Color(b.top),f),horizon:new T.Color(a.horizon).lerp(new T.Color(b.horizon),f),sun:new T.Color(a.sun).lerp(new T.Color(b.sun),f),power:T.MathUtils.lerp(a.power,b.power,f),ambient:T.MathUtils.lerp(a.ambient,b.ambient,f),night:T.MathUtils.smoothstep(p,.3,.9)};}
function surfaceShader(material,{ground=false}={}){
 const night={value:0};material.userData.night=night;
 material.onBeforeCompile=s=>{s.uniforms.toyNight=night;s.vertexShader='varying vec3 vToyPosition;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvToyPosition=(modelMatrix*vec4(position,1.0)).xyz;');s.fragmentShader='varying vec3 vToyPosition;\nuniform float toyNight;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   #ifdef USE_COLOR
    ${ground?`float meadow=step(vColor.r*1.05,vColor.g);float variation=sin(vToyPosition.x*.23+sin(vToyPosition.z*.17))*sin(vToyPosition.z*.31)*.035;
    float angle=atan(vToyPosition.z,vToyPosition.x),r=length(vToyPosition.xz);float grout=min(fract(r*1.3),fract(angle*max(8.,floor(r*.7))));float line=1.-smoothstep(.018,.035,grout);diffuseColor.rgb*=1.0+variation;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.38,.32,.27),line*.20*(1.-meadow));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.52,.39,.27)*(1.+variation),(1.-meadow)*.28);diffuseColor.rgb=mix(diffuseColor.rgb*vec3(1.03,.97,.89),diffuseColor.rgb*vec3(.87,1.06,.82),meadow);`:''}
   #endif`);
  if(!ground)s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   #ifdef USE_COLOR
    float windowMask=(1.0-smoothstep(.02,.055,vColor.r))*step(.025,vColor.b)*step(vColor.r*1.5,vColor.b);
    totalEmissiveRadiance+=vec3(1.0,.46,.13)*windowMask*toyNight*.72;
    float lampMask=step(.7,vColor.r)*step(.38,vColor.g)*(1.0-step(.3,vColor.b));
    totalEmissiveRadiance+=vec3(1.0,.55,.20)*lampMask*toyNight*.12;
   #endif`);
 };material.customProgramCacheKey=()=>ground?'toy-ground-v1':'toy-window-v1';return material;
}
export class ToyWorldVisuals {
 constructor({renderer,scene,worldRoot,camera,hemisphere,sun,mobile}){
  Object.assign(this,{renderer,scene,worldRoot,camera,hemisphere,sun,mobile});this.lightweight=localStorage.getItem('slap-graphics')?localStorage.getItem('slap-graphics')==='light':mobile;this.materials=new Set();this.elapsed=0;this.lastShadow=-1;this.shadowCentre=new T.Vector3(1e5,0,0);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;sun.castShadow=true;sun.shadow.bias=-.0003;sun.shadow.normalBias=.025;sun.shadow.radius=2;sun.shadow.camera.near=.5;sun.shadow.camera.far=130;scene.add(sun.target);this.setQuality(this.lightweight);
  const room=new RoomEnvironment(),pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(room,.06).texture;scene.environmentIntensity=.35;room.dispose();pmrem.dispose();renderer.toneMappingExposure=.95;
  this.sky=new T.Mesh(new T.SphereGeometry(900,24,12),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color()},horizon:{value:new T.Color()}},vertexShader:'varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 vDirection;uniform vec3 top;uniform vec3 horizon;void main(){float h=smoothstep(-.24,.45,normalize(vDirection).y);gl_FragColor=vec4(mix(horizon,top,h),1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>}'.replace(';#include',';\n#include')}));this.sky.renderOrder=-100;this.sky.frustumCulled=false;scene.add(this.sky);
  // Cheap, instanced vertical wisps supply parallax; no extra realtime lights/postprocessing.
  this.wisps=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({color:0xe2edff,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}),mobile?12:24);this.homes=Array.from({length:this.wisps.count},(_,i)=>({a:i*2.399,r:65+(i%5)*13,y:(i*31)%210}));scene.add(this.wisps);this.dummy=new T.Object3D();this.update(0,0,new T.Vector3(),0,true);
 }
 setQuality(light){this.lightweight=light;localStorage.setItem('slap-graphics',light?'light':'standard');this.renderer.setPixelRatio(Math.min(devicePixelRatio,light?1:1.5));this.renderer.setSize(innerWidth,innerHeight);const size=light?1024:2048;if(this.sun.shadow.mapSize.x!==size){this.sun.shadow.map?.dispose();this.sun.shadow.map=null;this.sun.shadow.mapSize.set(size,size);}const r=light?19:27;Object.assign(this.sun.shadow.camera,{left:-r,right:r,top:r,bottom:-r});this.sun.shadow.camera.updateProjectionMatrix();this.renderer.shadowMap.needsUpdate=true;}
 prepare(scene){scene.traverse(o=>{if(!o.isMesh||o.name==='Contact shadow')return;const terrain=/_rock$|core_terrain|_garden_/.test(o.name);o.receiveShadow=true;o.castShadow=!terrain;
  for(const m of Array.isArray(o.material)?o.material:[o.material]){if(this.materials.has(m)||!m.isMeshStandardMaterial)continue;this.materials.add(m);m.side=T.FrontSide;m.metalness=0;m.roughness=terrain?.88:.64;if('clearcoat'in m){m.clearcoat=terrain?0:.12;m.clearcoatRoughness=.5;}m.envMapIntensity=.45;if(m.vertexColors&&!/reactor|exhaust/i.test(m.name))surfaceShader(m,{ground:terrain});m.needsUpdate=true;}
 });this.renderer.shadowMap.needsUpdate=true;}
 update(altitude,time,focus,dt,reduced=false){
  const progress=Math.min(1,altitude/2639),a=atmosphereAt(progress);this.state={progress,night:a.night,shadowSize:this.sun.shadow.mapSize.x,lightweight:this.lightweight};this.elapsed+=dt;
  this.sky.position.copy(this.camera.position);this.sky.material.uniforms.top.value.copy(a.top);this.sky.material.uniforms.horizon.value.copy(a.horizon);this.scene.background.copy(a.horizon);this.scene.fog.color.copy(a.horizon);this.scene.fog.near=95;this.scene.fog.far=350+progress*150;
  this.hemisphere.color.copy(a.horizon).lerp(new T.Color(0xdce9ff),.4);this.hemisphere.groundColor.set(0x84747d);this.hemisphere.intensity=a.ambient;this.sun.color.copy(a.sun);this.sun.intensity=a.power;
  for(const m of this.materials)if(m.userData.night)m.userData.night.value=a.night;
  const centre=focus.clone().applyMatrix4(this.worldRoot.matrixWorld);if(centre.distanceTo(this.shadowCentre)>3){this.shadowCentre.copy(centre);this.sun.position.copy(centre).add(new T.Vector3(-24,42,23));this.sun.target.position.copy(centre);this.sun.target.updateMatrixWorld();}
  if(this.elapsed-this.lastShadow>1/(this.lightweight?20:30)){this.renderer.shadowMap.needsUpdate=true;this.lastShadow=this.elapsed;}
  this.wisps.material.opacity=reduced?0:.07+progress*.04;for(let i=0;i<this.homes.length;i++){const h=this.homes[i];this.dummy.position.set(Math.cos(h.a)*h.r,centre.y+((h.y-altitude*.10+180)%210+210)%210-80,Math.sin(h.a)*h.r);this.dummy.rotation.set(0,-h.a+Math.PI/2,0);this.dummy.scale.set(.12+(i%3)*.05,7+(i%4)*5,1);this.dummy.updateMatrix();this.wisps.setMatrixAt(i,this.dummy.matrix);}this.wisps.instanceMatrix.needsUpdate=true;
 }
}
