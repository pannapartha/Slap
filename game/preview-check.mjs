import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const url=process.env.PTB_URL||'http://localhost:8897',report={url,errors:[],resources:[]};
for(const file of ['/health','/network','/audio/slap-theme.m4a','/animations/GetUp.glb','/arena-94063.bin']){const r=await fetch(url+file);assert.ok(r.ok,file);const data=await r.arrayBuffer();report.resources.push({path:file,status:r.status,type:r.headers.get('content-type'),bytes:data.byteLength});if(file==='/network')report.network=JSON.parse(new TextDecoder().decode(data));}
const browser=await chromium.launch({channel:'chrome',headless:true});
try{const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>report.errors.push(e.message));await page.goto(url);await page.waitForFunction(()=>window.party?.ready);await page.screenshot({path:'evidence/deadline-live-preview.png'});report.ready=await page.evaluate(()=>party.ready);assert.deepEqual(report.errors,[]);fs.writeFileSync('evidence/deadline-live-preview.json',JSON.stringify(report,null,2));console.log('PASS',JSON.stringify(report,null,2));}finally{await browser.close();}
