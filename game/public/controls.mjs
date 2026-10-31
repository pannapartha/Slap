export const relativeMovement=(yaw,forward,side)=>({x:Math.sin(yaw)*forward-Math.cos(yaw)*side,z:Math.cos(yaw)*forward+Math.sin(yaw)*side});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class GameplayControls {
 constructor({canvas,lookArea,joystick,buttons,mobile,active,sensitivity,action,onMode}){
  Object.assign(this,{canvas,lookArea,joystick,mobile,active,sensitivity,action,onMode});this.yaw=0;this.pitch=.18;this.keys=new Set();this.touch={x:0,z:0};this.lookPointer=null;this.joystickPointer=null;this.fallback=!canvas.requestPointerLock||!globalThis.isSecureContext;this.dragged=0;
  this.look=(x,y,touch=false)=>{const factor=(touch?.0032:.0022)*this.sensitivity();this.yaw-=clamp(x,-180,180)*factor;this.pitch=clamp(this.pitch+clamp(y,-180,180)*factor,-.22,1.05);};
  document.addEventListener('keydown',e=>{if(!this.active()||['INPUT','SELECT'].includes(e.target.tagName))return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ControlLeft','ControlRight'].includes(e.code))e.preventDefault();this.keys.add(e.code);if(e.repeat)return;if(e.code==='Space')action('jump');if(e.code==='KeyQ')action('dash');if(e.code==='KeyE')action('slap');});
  document.addEventListener('keyup',e=>this.keys.delete(e.code));addEventListener('blur',()=>this.reset());document.addEventListener('visibilitychange',()=>{if(document.hidden)this.reset()});
  document.addEventListener('pointerlockchange',()=>{this.lookPointer=null;if(document.pointerLockElement!==canvas)this.keys.clear();onMode?.(this.mode)});document.addEventListener('pointerlockerror',()=>{this.fallback=true;onMode?.(this.mode)});
  document.addEventListener('mousemove',e=>{if(this.active()&&document.pointerLockElement===canvas)this.look(e.movementX,e.movementY)});
  canvas.addEventListener('pointerdown',e=>{if(!this.active()||mobile||e.button!==0)return;if(document.pointerLockElement===canvas){action('slap');return;}this.lookPointer=e.pointerId;this.last=[e.clientX,e.clientY];this.dragged=0;try{canvas.setPointerCapture(e.pointerId)}catch{}if(!this.fallback)this.activate();});
  const move=e=>{if(!this.active()){if(this.lookPointer===e.pointerId)this.last=[e.clientX,e.clientY];return;}if(this.lookPointer!==e.pointerId||document.pointerLockElement===canvas)return;const dx=e.clientX-this.last[0],dy=e.clientY-this.last[1];this.last=[e.clientX,e.clientY];this.dragged+=Math.hypot(dx,dy);this.look(dx,dy,mobile);e.preventDefault()};
  const release=e=>{if(this.lookPointer===e.pointerId){if(!mobile&&this.fallback&&this.dragged<4)this.action('slap');this.lookPointer=null;}};
  canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('wheel',e=>{if(!this.active()||mobile)return;e.preventDefault();if(document.pointerLockElement!==canvas)this.look(e.deltaX,e.deltaY);},{passive:false});
  lookArea.addEventListener('pointerdown',e=>{if(!mobile||!this.active())return;e.preventDefault();this.lookPointer=e.pointerId;this.last=[e.clientX,e.clientY];this.dragged=0;try{lookArea.setPointerCapture(e.pointerId)}catch{}});
  lookArea.addEventListener('pointermove',move);lookArea.addEventListener('pointerup',release);lookArea.addEventListener('pointercancel',release);
  const knob=joystick.querySelector('i');const joystickMove=e=>{const r=joystick.getBoundingClientRect(),size=r.width*.38,dx=(e.clientX-r.left-r.width/2)/size,dy=(e.clientY-r.top-r.height/2)/size,n=Math.max(1,Math.hypot(dx,dy));this.touch.x=dx/n;this.touch.z=-dy/n;knob.style.transform=`translate(${this.touch.x*size*.78}px,${-this.touch.z*size*.78}px)`;};
  joystick.onpointerdown=e=>{if(!this.active())return;e.preventDefault();this.joystickPointer=e.pointerId;try{joystick.setPointerCapture(e.pointerId)}catch{}joystickMove(e)};
  joystick.onpointermove=e=>{if(this.joystickPointer===e.pointerId){e.preventDefault();joystickMove(e)}};
  joystick.onpointerup=joystick.onpointercancel=e=>{if(this.joystickPointer===e.pointerId){this.joystickPointer=null;this.touch.x=this.touch.z=0;knob.style.transform=''}};
  for(const [name,button] of Object.entries(buttons))button.onpointerdown=e=>{if(!this.active())return;e.preventDefault();e.stopPropagation();action(name)};
 }
 get mode(){return this.mobile?'touch':document.pointerLockElement===this.canvas?'locked':this.fallback?'drag':'click'}
 activate(){if(this.mobile||!this.active())return;if(this.fallback){this.onMode?.('drag');return}try{Promise.resolve(this.canvas.requestPointerLock()).catch(()=>{this.fallback=true;this.onMode?.('drag')})}catch{this.fallback=true;this.onMode?.('drag')}}
 setAngles(yaw,pitch=.18){this.yaw=yaw;this.pitch=pitch;this.reset()}
 reset(){this.keys.clear();this.touch.x=this.touch.z=0;this.lookPointer=this.joystickPointer=null;const knob=this.joystick?.querySelector('i');if(knob)knob.style.transform=''}
 input(currentYaw=0,cameraYaw=this.yaw){
  let forward=(this.keys.has('KeyW')||this.keys.has('ArrowUp')?1:0)-(this.keys.has('KeyS')||this.keys.has('ArrowDown')?1:0)+this.touch.z,side=(this.keys.has('KeyD')||this.keys.has('ArrowRight')?1:0)-(this.keys.has('KeyA')||this.keys.has('ArrowLeft')?1:0)+this.touch.x;
  const magnitude=Math.hypot(forward,side),norm=Math.max(1,magnitude);forward/=norm;side/=norm;if(magnitude<.12)forward=side=0;
  const {x,z}=relativeMovement(cameraYaw,forward,side),moving=Math.hypot(x,z)>.05;
  return {x,z,yaw:moving?Math.atan2(x,z):currentYaw,lookYaw:cameraYaw,walk:this.mobile?magnitude>.12&&magnitude<.55:this.keys.has('KeyC'),sprint:this.mobile?magnitude>.88:this.keys.has('ShiftLeft')||this.keys.has('ShiftRight')};
 }
}
