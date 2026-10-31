import {DEFAULT_LAYOUT} from './public/city-layout.mjs';
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {loadWorld} from './server.mjs';import {RULES} from './simulation.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),{arena,navigation}=loadWorld(Number(process.argv[2])||DEFAULT_LAYOUT),grids=[],report=[];
navigation.cache.clear();
for(let r=0;r<=9;r++){const g=navigation.grid(r);grids.push({rings:r,valid:Buffer.from(g.valid).toString('base64'),edges:Buffer.from(g.edges).toString('base64'),height:Buffer.from(g.height.buffer).toString('base64')});
 if(r>0&&!g.valid.some((v,i)=>v&&!arena.inside(navigation.position(i).x,navigation.position(i).z,r-1)))throw Error('Navigation lost all walkable cells on ring '+r);
 for(let k=1;k<=Math.min(3,r);k++){const m=navigation.escapeMap(r,r-k);let max=0,unreachable=0,cells=0;for(let i=0;i<g.valid.length;i++)if(g.valid[i]){cells++;if(Number.isFinite(m.dist[i]))max=Math.max(max,m.dist[i]);else unreachable++;}report.push({currentRings:r,removed:k,cells,maxPathMetres:max,maxRunSeconds:max/RULES.runSpeed,maxSprintSeconds:max/RULES.sprintSpeed,reactionBudgetSeconds:.4,withinFiveSeconds:max/RULES.sprintSpeed+.4<5,unreachable});}
 console.log('Built navigation',r,g.valid.reduce((a,x)=>a+x,0));}
fs.writeFileSync(path.join(here,'navigation'+((Number(process.argv[2])||DEFAULT_LAYOUT)===DEFAULT_LAYOUT?'':'-'+process.argv[2])+'.json'),JSON.stringify(grids));fs.writeFileSync(path.join(here,'evidence/escape-paths-'+(Number(process.argv[2])||DEFAULT_LAYOUT)+'.json'),JSON.stringify(report,null,2));console.log('Worst escape',report.sort((a,b)=>b.maxPathMetres-a.maxPathMetres)[0]);
