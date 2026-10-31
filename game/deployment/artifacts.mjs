import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
export const gameRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function preserveOutput(out){
 out=path.resolve(out);
 const allowed=out===path.join(gameRoot,'dist')||out===path.join(gameRoot,'.vercel/output')||out.startsWith(path.join(gameRoot,'release')+path.sep);
 if(!allowed)throw Error('Output must be the game dist, .vercel/output or a child of game/release');
 if(fs.existsSync(out)){
  const backup=path.join(gameRoot,'archive/deployment-artifacts',Date.now()+'-'+randomUUID().slice(0,8)+'-'+path.basename(out));
  fs.mkdirSync(path.dirname(backup),{recursive:true});fs.renameSync(out,backup);
  console.log('Preserved previous artifact:',path.relative(gameRoot,backup));
 }
 return out;
}
export function prepareOutput(out){out=preserveOutput(out);fs.mkdirSync(out,{recursive:true});return out;}
