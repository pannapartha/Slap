import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {productionOrigin} from './deployment/origin.mjs';
import {prepareOutput} from './deployment/artifacts.mjs';
import {staticAudit} from './deployment/static-audit.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),out=path.join(here,'.vercel/output');
if(!fs.existsSync(path.join(here,'dist/runtime-config.js')))throw Error('No configured production build. Set the actual SLAP_SERVER_URL and run npm run build:production first');
const runtime=fs.readFileSync(path.join(here,'dist/runtime-config.js'),'utf8'),match=runtime.match(/SLAP_CONFIG\s*=\s*(\{[^;]+\})/);if(!match)throw Error('Production runtime config missing');productionOrigin(JSON.parse(match[1]).serverURL);
staticAudit(path.join(here,'dist'));prepareOutput(out);fs.cpSync(path.join(here,'dist'),path.join(out,'static'),{recursive:true});
fs.writeFileSync(path.join(out,'config.json'),JSON.stringify({version:3,routes:[{src:'/runtime-config.js',headers:{'Cache-Control':'no-store'},continue:true},{src:'/(.*)',headers:{'X-Content-Type-Options':'nosniff'},continue:true},{handle:'filesystem'}]},null,2));console.log('PASS Vercel Build Output API static package:',out);
