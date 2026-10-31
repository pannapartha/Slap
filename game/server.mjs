import {validColor} from './public/character-options.mjs';
import {DEFAULT_LAYOUT,LAYOUT_SEEDS} from './public/city-layout.mjs';
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {randomBytes,randomInt} from 'node:crypto';import {WebSocketServer,WebSocket} from 'ws';
import {Arena,Navigation} from './public/arena.mjs';import {Match} from './simulation.mjs';
import os from 'node:os';
const here=path.dirname(fileURLToPath(import.meta.url)),dependencies=path.resolve(path.dirname(fileURLToPath(import.meta.resolve('three'))),'../..');
export function loadWorld(seed=DEFAULT_LAYOUT){const suffix=seed===DEFAULT_LAYOUT?'':'-'+seed;const b=fs.readFileSync(path.join(here,'public/arena'+suffix+'.bin'));const arena=new Arena(new Float32Array(b.buffer,b.byteOffset,b.length/4)),navigation=new Navigation(arena);const file=path.join(here,'navigation'+suffix+'.json');if(fs.existsSync(file))for(const g of JSON.parse(fs.readFileSync(file,'utf8'))){const heights=Buffer.from(g.height,'base64');navigation.cache.set(g.rings,{valid:new Uint8Array(Buffer.from(g.valid,'base64')),edges:new Uint8Array(Buffer.from(g.edges,'base64')),height:new Float32Array(heights.buffer,heights.byteOffset,heights.length/4),dirs:[1,-1,161,-161,162,-162,160,-160]});}return {arena,navigation,layoutSeed:seed}}
const cleanName=v=>String(v||'Bopling').replace(/[<>\x00-\x1f]/g,'').trim().slice(0,18)||'Bopling';
export function parseAllowedOrigins(value=''){
 return value.split(',').map(v=>v.trim()).filter(Boolean).map(value=>{let u;try{u=new URL(value)}catch{throw Error('SLAP_ALLOWED_ORIGINS must contain comma-separated HTTP(S) origins')}
  if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.hostname.includes('*')||u.pathname!=='/'||u.search||u.hash)throw Error('SLAP_ALLOWED_ORIGINS accepts origins only, without credentials, paths or wildcards');return u.origin;});
}
export function createGameServer({port=8894,host='0.0.0.0',world=loadWorld(),roundRange,quiet=false,allowedOrigins=parseAllowedOrigins(process.env.SLAP_ALLOWED_ORIGINS),production=process.env.NODE_ENV==='production'}={}){
 let closing=false,closePromise;
 const rooms=new Map(),worlds=new Map([[DEFAULT_LAYOUT,world]]);for(const seed of LAYOUT_SEEDS)if(!worlds.has(seed))worlds.set(seed,loadWorld(seed));let nextPlayer=1;
 const send=(ws,m)=>{if(ws?.readyState===WebSocket.OPEN&&ws.bufferedAmount<512000)ws.send(JSON.stringify(m))};
 const lobby=r=>({t:'room',code:r.code,host:r.host,layoutSeed:r.layoutSeed,settings:r.settings,state:r.match?'playing':'lobby',members:r.members.map(m=>({id:m.id,name:m.name,color:m.color,ready:m.ready,connected:!!m.ws})),matchNumber:r.number});
 const broadcast=(r,m)=>r.members.forEach(p=>send(p.ws,m));
 function roomCode(){let code;do{code=Array.from({length:5},()=> 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[randomInt(31)]).join('')}while(rooms.has(code));return code}
 function create(){const r={code:roomCode(),host:null,members:[],settings:{bots:9,bombs:3,difficulty:'easy'},layoutSeed:LAYOUT_SEEDS[randomInt(LAYOUT_SEEDS.length)],match:null,number:0,lastOccupied:Date.now()};rooms.set(r.code,r);return r}
 const server=http.createServer((req,res)=>{
  let url;try{url=new URL(req.url,'http://local')}catch{res.writeHead(400);res.end();return}
  if(url.pathname==='/health'){res.statusCode=closing?503:200;res.setHeader('content-type','application/json');res.end(JSON.stringify({ok:!closing,game:'PASS THE BOMB',rooms:rooms.size}));return}
  if(url.pathname==='/network'){const port=server.address()?.port||8894;res.setHeader('content-type','application/json');res.end(JSON.stringify({port,bind:host,lanURLs:Object.values(os.networkInterfaces()).flat().filter(n=>n.family==='IPv4'&&!n.internal&&!n.address.startsWith('169.254.')).map(n=>`http://${n.address}:${port}`)}));return}
  const routes=[['/assets/world/',path.join(here,'../world-assets')],['/assets/bopling/',path.join(here,'../bopling')],['/fonts/',path.join(dependencies,'@fontsource/dm-sans/files')],['/vendor/',path.join(dependencies,'three')],['/world-api/',path.join(here,'../world-assets/viewer')],['/',path.join(here,'public')]];
  const route=routes.find(([prefix])=>url.pathname.startsWith(prefix));let relative;try{relative=decodeURIComponent(url.pathname.slice(route[0].length))}catch{res.writeHead(400);res.end();return}
  const file=path.resolve(route[1],relative||'index.html');if(!file.startsWith(route[1]+path.sep)||!['.html','.mjs','.js','.css','.bin','.json','.glb','.png','.svg','.webm','.m4a','.woff2'].includes(path.extname(file))){res.writeHead(403);res.end();return}
  const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.bin':'application/octet-stream','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.svg':'image/svg+xml','.webm':'video/webm','.m4a':'audio/mp4','.woff2':'font/woff2'};
  const gz=file.endsWith('.bin')&&String(req.headers['accept-encoding']).includes('gzip')&&fs.existsSync(file+'.gz');fs.readFile(gz?file+'.gz':file,(e,data)=>{if(e){res.writeHead(404);res.end();return}res.setHeader('Content-Type',types[path.extname(file)]);res.setHeader('Cache-Control','no-cache');if(gz)res.setHeader('Content-Encoding','gzip');res.end(data)});
 });
 const wss=new WebSocketServer({server,path:'/ws',maxPayload:4096,verifyClient:info=>!closing&&(allowedOrigins.length?allowedOrigins.includes(info.origin):!production)});
 wss.on('connection',(ws,req)=>{
  let room=null,member=null,bucket=0,windowAt=Date.now();
  ws.on('message',buffer=>{
   if(Date.now()-windowAt>1000){bucket=0;windowAt=Date.now()}if(++bucket>90){ws.close(1008,'Too many messages');return}
   let m;try{m=JSON.parse(buffer)}catch{return}if(!m||typeof m!=='object')return;
   try{
    if(m.t==='create'||m.t==='join'||m.t==='resume'){
     if(member)return;room=m.t==='create'?create():rooms.get(String(m.code||'').toUpperCase());if(!room)throw Error('Room not found. Check the five-letter code.');
     if(m.t==='resume'){
      member=room.members.find(p=>p.token===m.token);if(!member)throw Error('Your seat expired. Join a new room.');member.ws?.close(4000,'Reconnected elsewhere');member.ws=ws;member.disconnectedAt=null;if(room.match){const p=room.match.players.find(p=>p.id===member.id);if(p)p.connected=true;}
     }else{
      if(room.match)throw Error('This match has started. Rejoin after the rematch.');if(room.members.length>=10)throw Error('Room is full.');member={id:'p'+nextPlayer++,token:randomBytes(24).toString('hex'),name:cleanName(m.name),color:validColor(m.color),ready:room.members.length===0,ws};room.members.push(member);room.host??=member.id;room.settings.bots=Math.min(room.settings.bots,10-room.members.length);
     }
     room.lastOccupied=Date.now();const actor=room.match?.players.find(p=>p.id===member.id);send(ws,{t:'seat',id:member.id,token:member.token,code:room.code,inputSeq:actor?.inputSeq||0,actionSeq:actor?.actionSeq||0});broadcast(room,lobby(room));if(room.match)send(ws,{t:'snapshot',code:room.code,matchNumber:room.number,...room.match.snapshot()});return;
    }
    if(!member||!room)return;
    if(m.t==='input'){room.match?.setInput(member.id,m);return}
    if(m.t==='color'){member.color=validColor(m.color);const actor=room.match?.players.find(p=>p.id===member.id);if(actor)actor.color=member.color;broadcast(room,lobby(room));return}
    if(m.t==='ready'&&!room.match){member.ready=!!m.ready;broadcast(room,lobby(room));return}
    if(m.t==='settings'&&member.id===room.host&&!room.match){room.settings={difficulty:m.difficulty==='hard'?'hard':m.difficulty==='easy'?'easy':room.settings.difficulty,bots:Math.max(0,Math.min(10-room.members.length,Math.floor(Number(m.bots)||0))),bombs:Math.max(1,Math.min(3,Math.floor(Number(m.bombs)||1)))};for(const p of room.members)p.ready=p.id===room.host;broadcast(room,lobby(room));return}
    if(m.t==='start'&&member.id===room.host&&!room.match){
     const total=room.members.length+room.settings.bots;if(total<2)throw Error('Add a friend or at least one bot.');if(room.members.some(p=>!p.ready||!p.ws))throw Error('Wait for everyone to be ready.');
     const players=room.members.map(({id,name,color})=>({id,name,color,bot:false}));const names=['Peaches','Wobble','Mochi','Biscuit','Pogo','Noodle','Pip','Bubbles','Tater'];for(let i=0;i<room.settings.bots;i++)players.push({id:'bot'+i,name:names[i],color:(i+1)%8,bot:true});
     room.match=new Match({players,bombs:Math.min(room.settings.bombs,total-1),...worlds.get(room.layoutSeed),layoutSeed:room.layoutSeed,difficulty:room.settings.difficulty,roundRange,matchNumber:++room.number});broadcast(room,lobby(room));return;
    }
    if(m.t==='rematch'&&member.id===room.host&&room.match?.phase==='won'){room.match=null;room.layoutSeed=LAYOUT_SEEDS[(LAYOUT_SEEDS.indexOf(room.layoutSeed)+1)%LAYOUT_SEEDS.length];for(const p of room.members)p.ready=p.id===room.host;broadcast(room,lobby(room));return}
   }catch(e){send(ws,{t:'error',message:e.message})}
  });
  ws.on('close',()=>{if(member?.ws===ws){member.ws=null;member.disconnectedAt=Date.now();if(room.match){const p=room.match.players.find(p=>p.id===member.id);if(p){p.connected=false;p.input={x:0,z:0,yaw:p.yaw};}}else broadcast(room,lobby(room));}});
  ws.on('error',()=>{});
 });
 let accumulator=0,last=performance.now(),ticks=0,lastSent=-1;const timer=setInterval(()=>{const now=performance.now();accumulator+=Math.min(.25,(now-last)/1000);last=now;
  while(accumulator>=1/60){accumulator-=1/60;ticks++;for(const r of rooms.values())if(r.match)r.match.step();}
  for(const r of rooms.values()){
   for(const m of [...r.members])if(!m.ws&&m.disconnectedAt&&Date.now()-m.disconnectedAt>15000){if(r.match){const p=r.match.players.find(p=>p.id===m.id);if(p?.alive)r.match.eliminate(p,'disconnected');}r.members.splice(r.members.indexOf(m),1);if(r.host===m.id){r.host=(r.members.find(p=>p.ws)||r.members[0])?.id||null;const next=r.members.find(p=>p.id===r.host);if(next)next.ready=true;}broadcast(r,lobby(r));}
   if(r.match&&ticks%3===0&&ticks!==lastSent)broadcast(r,{t:'snapshot',code:r.code,matchNumber:r.number,...r.match.snapshot()});
   if(!r.members.some(m=>m.ws)&&Date.now()-r.lastOccupied>180000){rooms.delete(r.code)}
  }if(ticks%3===0)lastSent=ticks;
 },1000/120);
 return {server,wss,rooms,world,listen:()=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,()=>{server.removeListener('error',reject);if(!quiet)console.log(`PASS THE BOMB listening on ${host}:${server.address().port}`);resolve(server.address().port)})}),close:({graceMs=1000}={})=>{
  if(closePromise)return closePromise;closing=true;clearInterval(timer);
  closePromise=new Promise(resolve=>{let httpDone=false,wsDone=false;let force;
   const done=()=>{if(httpDone&&wsDone){clearTimeout(force);resolve()}};
   force=setTimeout(()=>{for(const ws of wss.clients)ws.terminate();server.closeAllConnections?.()},graceMs);force.unref();
   server.close(()=>{httpDone=true;done()});server.closeIdleConnections?.();
   wss.close(()=>{wsDone=true;done()});for(const ws of wss.clients)ws.close(1012,'Server restarting');
  });return closePromise;
 }};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT??process.env.PTB_PORT??8897);if(!Number.isInteger(port)||port<1||port>65535)throw Error('PORT must be an integer from 1 to 65535');
 const app=createGameServer({port});let stopping=false;
 const shutdown=async()=>{if(stopping)return;stopping=true;await app.close();};process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
 if(process.env.NODE_ENV==='production'&&!process.env.SLAP_ALLOWED_ORIGINS)console.log('Production WebSockets deny all origins until SLAP_ALLOWED_ORIGINS is configured');
 await app.listen();
}

