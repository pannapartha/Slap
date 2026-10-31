import {RULES} from './simulation.mjs';
export function botIntent(m,p){
 const hard=m.difficulty==='hard',needs=['round','freeze','warning'].includes(m.phase);if(!needs||p.frozen||m.time<p.recoveryUntil){p.stuckAnchor={x:p.x,z:p.z,at:m.time};return {x:0,z:0,yaw:p.yaw};}
 if(p.planRings!==m.activeRings||p.planPhase!==m.phase){p.route=[];p.thinkAt=0;p.planRings=m.activeRings;p.planPhase=m.phase;}
 if(!p.stuckAnchor)p.stuckAnchor={x:p.x,z:p.z,at:m.time};
 if(Math.hypot(p.x-p.stuckAnchor.x,p.z-p.stuckAnchor.z)>.18){p.stuckAnchor={x:p.x,z:p.z,at:m.time};p.stuckAttempts=0;}
 if(m.time-p.stuckAnchor.at>=1.5){if(p.navWanted&&Math.hypot(p.x-p.stuckAnchor.x,p.z-p.stuckAnchor.z)<.18){p.stuckRecoveries=(p.stuckRecoveries||0)+1;p.route=[];p.thinkAt=0;p.escapePlan=-1;p.detourUntil=m.time+.5;p.detour=null;const g=m.nav.grid(m.activeRings),i=m.nav.nearest(m.nav.index(p.x,p.z),g,p.grounded?p.y:undefined),point=index=>({...m.nav.position(index),y:g.height[index]}),options=g.dirs.map((d,k)=>({index:i+d,k})).filter(q=>(g.edges[i]&(1<<q.k))&&m.arena.walkClear(p,point(q.index),m.activeRings,.015));const centre=point(i);if(i>=0&&Math.hypot(centre.x-p.x,centre.z-p.z)>.06&&m.arena.walkClear(p,centre,m.activeRings,.015))p.detour=centre;else if(options.length)p.detour=point(options[(p.stuckRecoveries-1)%options.length].index);}
  if(p.navWanted){p.stuckAttempts=(p.stuckAttempts||0)+1;if(p.stuckAttempts>=2&&m.phase==='round'&&p.grounded&&m.arena.inside(p.x,p.z,m.activeRings,1.3)&&m.time-p.jumpAt>1.3){p.unstuckJumpUntil=m.time+.2;p.botActionSeq=(p.botActionSeq||0)+1;}}
  p.stuckAnchor={x:p.x,z:p.z,at:m.time};}
 const targets=m.alive.filter(q=>q!==p&&!q.slapper&&m.time>=q.recoveryUntil),threats=m.alive.filter(q=>q!==p&&q.slapper),distance=q=>Math.hypot(q.x-p.x,q.z-p.z);let nearestThreat=threats.sort((a,b)=>distance(a)-distance(b))[0];
 if((m.phase==='warning'?p.thinkAt===0:m.time>=p.thinkAt)||!p.route.length){p.thinkAt=m.time+(hard?.16:.48)+m.rng()*(hard?.06:.18);let target;
  if(m.phase==='warning'){
   const map=m.escape;let i=m.nav.nearest(m.nav.index(p.x,p.z),map.grid,p.grounded?p.y:undefined);p.route=[];if(i>=0&&Number.isFinite(map.dist[i]))for(let steps=0;steps<1000&&map.next[i]!==i;steps++){i=map.next[i];p.route.push({...m.nav.position(i),y:map.grid.height[i]});}const start=m.nav.nearest(m.nav.index(p.x,p.z),map.grid,p.grounded?p.y:undefined);if(start>=0){const centre={...m.nav.position(start),y:map.grid.height[start]};if(distance(centre)>.06&&p.route.length&&!m.arena.walkClear(p,p.route[0],m.activeRings,.015))p.route.unshift(centre);}
  }else{
   if(p.slapper&&targets.length){target=targets.sort((a,b)=>distance(a)-distance(b))[0];if(hard)target={y:target.y,x:target.x+Math.max(-1,Math.min(1,target.vx*.25)),z:target.z+Math.max(-1,Math.min(1,target.vz*.25))};}
   else if(nearestThreat&&distance(nearestThreat)<(hard?17:11)){
    // Score supported public map cells: distance from visible threats, edge safety and route cost.
    const g=m.nav.grid(m.activeRings);let best=-Infinity;
    for(let i=0;i<g.valid.length;i+=hard?13:31)if(g.valid[i]){const q=m.nav.position(i),d=distance(q);if(d<3||d>10||!m.arena.inside(q.x,q.z,m.activeRings,1.2))continue;const separation=Math.min(...threats.map(t=>Math.hypot(q.x-t.x,q.z-t.z))),score=separation-d*.30;if(score>best){best=score;target=q;}}
   }else if(p.roamTarget&&distance(p.roamTarget)>1&&m.time<p.roamUntil)target=p.roamTarget;
   else{const g=m.nav.grid(m.activeRings),choices=[];for(let i=0;i<g.valid.length;i+=23)if(g.valid[i]){const q=m.nav.position(i);if(distance(q)>4&&m.arena.inside(q.x,q.z,m.activeRings,1.5))choices.push(q);}target=choices[Math.floor(m.rng()*choices.length)]||{x:0,z:4};p.roamTarget=target;p.roamUntil=m.time+5;}
   if(target){p.botTarget={...target};p.route=m.arena.walkClear(p,{...target,y:p.y},m.activeRings,.05)&&distance(target)<9?[target]:m.nav.route(p,target,m.activeRings);}
  }
 }
 if(m.time<p.detourUntil&&p.detour)p.route=[p.detour];
 while(p.route.length&&distance(p.route[0])<(m.phase==='warning'?.15:.06))p.route.shift();
 while(p.route.length>1){const q=p.route[1];if(p.grounded&&distance(q)<2.4&&m.arena.walkClear(p,q,m.activeRings,.05))p.route.shift();else break;}
 let target=p.route[0],jump=m.time<(p.unstuckJumpUntil||0);
 if(!target&&(m.phase==='round'||!m.arena.inside(p.x,p.z,m.futureRings,.3))){const g=m.nav.grid(m.activeRings),i=m.nav.nearest(m.nav.index(p.x,p.z),g,p.grounded?p.y:undefined);if(i>=0){const centre={...m.nav.position(i),y:g.height[i]};if(distance(centre)>.2)target=centre;else for(let k=0;k<g.dirs.length;k++)if(g.edges[i]&(1<<k)){const q=i+g.dirs[k];target={...m.nav.position(q),y:g.height[q]};break;}}}

 // Hard bots may vault a low, supported obstacle on a visible pursuit line. Same jump impulse as humans.
 if(hard&&m.phase==='round'&&p.grounded&&m.time-p.jumpAt>1.3&&p.botTarget){const d=distance(p.botTarget),dx=(p.botTarget.x-p.x)/(d||1),dz=(p.botTarget.z-p.z)/(d||1),x=p.x+dx*.9,z=p.z+dz*.9,h=m.arena.floor(x,z,p.y+1.2,m.activeRings),landing={x:p.x+dx*1.7,z:p.z+dz*1.7};if(d>1.5&&d<12&&h>p.y+.55&&h<p.y+1.18&&m.arena.inside(landing.x,landing.z,m.activeRings,1)){target=p.botTarget;jump=true;}}
 // Static routes cannot predict moving bodies. Steer around a blocking survivor using
 // supported, collision-clear local directions, then return to the same route.
 if(target&&m.phase==='round'){
  const angle=Math.atan2(target.x-p.x,target.z-p.z),others=m.alive.filter(q=>q!==p&&Math.abs(q.y-p.y)<.8&&distance(q)<2),ahead={x:p.x+Math.sin(angle)*.65,z:p.z+Math.cos(angle)*.65};
  if(others.some(q=>Math.hypot(q.x-ahead.x,q.z-ahead.z)<.78))for(const turn of [Math.PI/2,-Math.PI/2,Math.PI/3,-Math.PI/3,Math.PI*2/3,-Math.PI*2/3]){const a=angle+turn,q={x:p.x+Math.sin(a)*.9,y:p.y,z:p.z+Math.cos(a)*.9};if(others.every(o=>Math.hypot(q.x-o.x,q.z-o.z)>.85)&&m.arena.walkClear(p,q,m.activeRings,.015)){target=q;break;}}
 }
 p.navWanted=!!target;if(!target)return {x:0,z:0,yaw:p.yaw,jump,actionSeq:p.botActionSeq||0};const dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz)||1,den=Math.max(d,.55),sprint=m.phase==='warning'||(hard&&(p.slapper||nearestThreat&&distance(nearestThreat)<17))||p.slapper&&distance(target)<10;
 if(p.slapper){const q=targets.sort((a,b)=>distance(a)-distance(b))[0];if(q&&distance(q)<RULES.slapRange-.08){m.slap(p);}}
 if(jump)p.botActionSeq=(p.botActionSeq||0)+1;
 return {x:dx/den,z:dz/den,yaw:Math.atan2(dx,dz),sprint,jump,actionSeq:p.botActionSeq||0};
}



