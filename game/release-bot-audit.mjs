import fs from 'node:fs';import {loadWorld} from './server.mjs';import {Match} from './simulation.mjs';
const report=[];
for(const layoutSeed of [73129,94063])for(const difficulty of ['easy','hard']){if(process.argv[2]&&(layoutSeed!==Number(process.argv[2])||difficulty!==(process.argv[3]||'easy')))continue;
 const m=new Match({...loadWorld(layoutSeed),layoutSeed,difficulty,seed:22,bombs:1,players:Array.from({length:10},(_,i)=>({id:'p'+i,name:'Audit '+i,bot:i>0}))}),anchors=new Map(),r={layoutSeed,difficulty,worst:0,stalls:[]};
 for(let t=0;t<20000&&m.phase!=='won';t++){m.step();for(const p of m.players.filter(p=>p.bot&&p.alive)){if(m.phase!=='round'||p.frozen||m.time<Math.max(p.recoveryUntil,p.knockdownUntil)){anchors.delete(p.id);continue}let a=anchors.get(p.id);if(!a||Math.hypot(p.x-a.x,p.z-a.z)>.18){a={x:p.x,z:p.z,at:m.time};anchors.set(p.id,a)}const delay=m.time-a.at;if(delay>r.worst){r.worst=delay;r.worstState={time:m.time,id:p.id,x:p.x,y:p.y,z:p.z,grounded:p.grounded,navWanted:p.navWanted,route:p.route?.slice(0,4),target:p.botTarget,input:p.input,recoveries:p.stuckRecoveries,slapper:p.slapper,neighbors:m.alive.filter(q=>q!==p&&Math.hypot(p.x-q.x,p.z-q.z)<1.5).map(q=>({id:q.id,x:q.x,y:q.y,z:q.z}))}}}}
 r.finished=m.phase==='won';report.push(r);console.log(JSON.stringify(r));fs.writeFileSync('evidence/release-bot-audit.json',JSON.stringify(report,null,2));
}
