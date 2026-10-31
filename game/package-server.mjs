import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {prepareOutput} from './deployment/artifacts.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),out=prepareOutput(path.join(here,'release/railway')),game=path.join(out,'Slap/game');
fs.mkdirSync(game,{recursive:true});
for(const name of ['server.mjs','simulation.mjs','bots.mjs','spawn.mjs','navigation.json','navigation-94063.json','public'])fs.cpSync(path.join(here,name),path.join(game,name),{recursive:true});
for(const [folder,files] of [['world-assets',['BopKingdom.glb','BopKingdom-collision.glb','manifest.json','viewer/environment.js']],['bopling',['Bopling.glb']]])for(const file of files){const dest=path.join(out,'Slap',folder,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(here,'..',folder,file),dest)}
for(const [src,dest] of [['server.package.json','package.json'],['server.package-lock.json','package-lock.json'],['railway.json','railway.json']])fs.copyFileSync(path.join(here,'deployment',src),path.join(out,dest));
fs.writeFileSync(path.join(out,'.railwayignore'),'node_modules\n.git\n.env*\n*.log\n');
console.log('PASS packaged persistent Railway server (Railpack, locked production dependencies):',out);
