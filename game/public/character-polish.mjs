import * as THREE from 'three';
export function polishCharacter(material){
 const eye=/Eyes/.test(material.name),face=/Face/.test(material.name);material.userData.faceSensitive=eye?.04:face?.30:1;material.roughness=eye?.25:.36;material.metalness=0;if('clearcoat'in material){material.clearcoat=eye?.36:.24;material.clearcoatRoughness=eye?.16:.28;}material.envMapIntensity=eye?.85:.65;
 material.userData.bopColor={value:new THREE.Color(1,1,1)};material.userData.bopTint={value:0};material.userData.bopPulse={value:0};
 material.onBeforeCompile=s=>{s.uniforms.uBopColor=material.userData.bopColor;s.uniforms.uBopTint=material.userData.bopTint;s.uniforms.uBopPulse=material.userData.bopPulse;s.vertexShader='varying vec3 vBopRest;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBopRest=position;');s.fragmentShader='uniform vec3 uBopColor; uniform float uBopTint; uniform float uBopPulse; varying vec3 vBopRest;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 ${eye?`#ifdef USE_COLOR
 float iris=step(.016,vColor.b)*(1.0-step(.15,vColor.b))*step(vColor.r*2.0,vColor.b);
 vec2 radial=vec2((abs(vBopRest.x)-.192)/.096,(vBopRest.y-1.855)/.132);
 float detail=.5+.5*sin(atan(radial.y,radial.x)*32.0+length(radial)*10.0);
 diffuseColor.rgb=mix(diffuseColor.rgb,mix(vec3(.012,.055,.14),vec3(.022,.17,.32),detail*.18+.35),iris);
 #endif`:face?`float cheek=exp(-pow((abs(vBopRest.x)-.31)/.09,2.)-pow((vBopRest.y-1.72)/.075,2.))*step(.25,vBopRest.z);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(1.,.34,.23),cheek*.16);float smile=(1.-smoothstep(.005,.009,abs(vBopRest.y-(1.64+3.0*vBopRest.x*vBopRest.x))))*(1.-smoothstep(.095,.12,abs(vBopRest.x)))*step(.28,vBopRest.z);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.12,.045,.033),smile);`:`#ifdef USE_COLOR
 float softInk=(1.-step(.08,max(vColor.r,max(vColor.g,vColor.b))))*step(1.58,vBopRest.y)*step(.28,vBopRest.z);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.09,.045,.04),softInk*.55);
 float mouthZone=step(1.58,vBopRest.y)*(1.-step(1.71,vBopRest.y))*step(.28,vBopRest.z)*(1.-step(.14,abs(vBopRest.x)));
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(1.,.745,.423),mouthZone);
 float smile=(1.-smoothstep(.005,.009,abs(vBopRest.y-(1.64+3.0*vBopRest.x*vBopRest.x))))*(1.-smoothstep(.095,.12,abs(vBopRest.x)))*mouthZone;
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.12,.045,.033),smile);
 #endif`}`);};const coral=!eye;const previous=material.onBeforeCompile;material.onBeforeCompile=s=>{previous(s);s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`float bodyMask=${coral?'1.0':'0.0'}*step(diffuseColor.g*2.0,diffuseColor.r)*step(diffuseColor.b*3.0,diffuseColor.r)*step(.1,diffuseColor.r);float facial=step(1.58,vBopRest.y)*(1.-step(1.83,vBopRest.y))*step(.28,vBopRest.z)*(1.-step(.36,abs(vBopRest.x)));bodyMask*=1.-facial;diffuseColor.rgb=mix(diffuseColor.rgb,uBopColor*clamp(diffuseColor.r/.905,.4,1.2),bodyMask*uBopTint);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(1.,.008,.018),uBopPulse*mix(${material.userData.faceSensitive.toFixed(2)},1.0,bodyMask));\n#include <roughnessmap_fragment>`);};material.customProgramCacheKey=()=>eye?'bop-blue-iris-v2':face?'bop-soft-cheeks-v2':'bop-soft-ink-v2';return material;
}

