import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {productionOrigin} from './deployment/origin.mjs';
import {prepareOutput} from './deployment/artifacts.mjs';
import {checkPublicHealth} from './deployment/check-public.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),dependencies=path.resolve(path.dirname(fileURLToPath(import.meta.resolve('three'))),'../..');
export function buildProduction({serverURL=process.env.SLAP_SERVER_URL,allowLocal=false,out=path.join(here,'dist')}={}){
 if(!serverURL)throw Error('Set SLAP_SERVER_URL to the public HTTPS persistent game-server origin');
 const u=new URL(allowLocal?serverURL:productionOrigin(serverURL));if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw Error('SLAP_SERVER_URL must be an origin without credentials, path, query or fragment');
 if(allowLocal&&(path.resolve(out)===path.join(here,'dist')||!['localhost','127.0.0.1','[::1]'].includes(u.hostname)))throw Error('Local test endpoints require a separate staged output and loopback host');
 out=prepareOutput(out);
 const copy=(src,dest)=>{fs.mkdirSync(path.dirname(dest),{recursive:true});fs.cpSync(src,dest,{recursive:true})};
 for(const entry of fs.readdirSync(path.join(here,'public'),{withFileTypes:true})){if(entry.name.endsWith('.gz'))continue;copy(path.join(here,'public',entry.name),path.join(out,entry.name))}
 for(const file of ['BopKingdom.glb','BopKingdom-collision.glb','manifest.json'])copy(path.join(here,'../world-assets',file),path.join(out,'assets/world',file));copy(path.join(here,'../bopling/Bopling.glb'),path.join(out,'assets/bopling/Bopling.glb'));
 copy(path.join(here,'../world-assets/viewer/environment.js'),path.join(out,'world-api/environment.js'));
 copy(path.join(dependencies,'three/build'),path.join(out,'vendor/build'));copy(path.join(dependencies,'three/examples/jsm'),path.join(out,'vendor/examples/jsm'));copy(path.join(dependencies,'@fontsource/dm-sans/files'),path.join(out,'fonts'));
 fs.writeFileSync(path.join(out,'runtime-config.js'),'globalThis.SLAP_CONFIG = '+JSON.stringify({serverURL:u.origin})+';\n');fs.writeFileSync(path.join(out,'network'),JSON.stringify({lanURLs:[]}));
 console.log('PASS production static build:',out,'server:',u.origin);return out;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){await checkPublicHealth(process.env.SLAP_SERVER_URL);buildProduction();}
