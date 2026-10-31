import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
export function exactFile(root,relative){let current=path.resolve(root);for(const part of relative.replaceAll('\\','/').split('/')){if(!part||part==='.'||part==='..'||!fs.existsSync(current)||!fs.statSync(current).isDirectory()||!fs.readdirSync(current).includes(part))return false;current=path.join(current,part)}return fs.statSync(current).isFile();}
export function staticAudit(root){
 root=path.resolve(root);const files=fs.readdirSync(root,{recursive:true,withFileTypes:true}).filter(f=>f.isFile()).map(f=>path.join(f.parentPath||f.path,f.name));
 for(const f of ['index.html','main.mjs','runtime-config.js','connection.mjs','style.css','arena.bin','arena-94063.bin','camera-terrain.bin','animations/GetUp.glb','audio/slap-theme.m4a','vendor/build/three.module.js','assets/world/BopKingdom.glb','assets/world/BopKingdom-collision.glb','assets/bopling/Bopling.glb','world-api/environment.js'])if(!exactFile(root,f))throw Error('Static artifact missing or case-mismatched required file: '+f);
 const forbidden=files.filter(f=>/(^|[\\/])(?:\.env[^\\/]*|\.npmrc|[^\\/]*\.(?:pfx|pem|key))$/i.test(f));if(forbidden.length)throw Error('Private configuration/key file present in static artifact');
 const sizes=files.map(f=>({path:path.relative(root,f).replaceAll('\\','/'),bytes:fs.statSync(f).size})).sort((a,b)=>b.bytes-a.bytes),total=sizes.reduce((n,f)=>n+f.bytes,0);
 if(total>100_000_000||sizes[0].bytes>100_000_000)throw Error('Static upload exceeds conservative 100 MB preflight budget');
 for(const f of files.filter(f=>path.dirname(f)===root&&f.endsWith('.mjs'))){const text=fs.readFileSync(f,'utf8');for(const m of text.matchAll(/(?:from\s*|import\s*\()\s*['"](\.\.?\/[^'"]+)['"]/g)){const target=path.resolve(path.dirname(f),m[1]);if(!target.startsWith(root+path.sep)||!exactFile(root,path.relative(root,target)))throw Error('Broken or case-mismatched local runtime module import: '+path.basename(f));}}
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');if(!html.includes('width=device-width')||!html.includes('viewport-fit=cover'))throw Error('Mobile viewport configuration missing');
 return {files:files.length,totalBytes:total,largest:sizes.slice(0,5),privateFiles:0,relativeRuntimeImports:'PASS',mobileViewport:'PASS'};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const report=staticAudit(process.argv[2]||'dist');console.log(JSON.stringify(report,null,2));}
