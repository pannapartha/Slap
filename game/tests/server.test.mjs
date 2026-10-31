import test from 'node:test';import assert from 'node:assert/strict';import {WebSocket} from 'ws';import {createGameServer,loadWorld} from '../server.mjs';
const world=loadWorld();
async function peer(port){const ws=new WebSocket(`ws://127.0.0.1:${port}/ws`),messages=[];ws.on('message',b=>messages.push(JSON.parse(b)));await new Promise(r=>ws.once('open',r));return {ws,messages,send:m=>ws.send(JSON.stringify(m)),wait:async fn=>{for(let i=0;i<200;i++){const found=messages.find(fn);if(found)return found;await new Promise(r=>setTimeout(r,10))}throw Error('Timed out waiting for socket message')}}}
test('real WebSocket rooms enforce host, readiness, distinct seats, ownership, resume and shared rematch',async()=>{
 const app=createGameServer({port:0,host:'127.0.0.1',world,roundRange:[.15,.15],quiet:true}),port=await app.listen();let a,b,c;
 try{
  a=await peer(port);a.send({t:'create',name:'Host'});const seat=await a.wait(m=>m.t==='seat');b=await peer(port);b.send({t:'join',name:'Guest',code:seat.code});const guest=await b.wait(m=>m.t==='seat');assert.notEqual(seat.id,guest.id);assert.notEqual(seat.token,guest.token);
  b.send({t:'settings',bots:0,bombs:1});b.send({t:'start'});await new Promise(r=>setTimeout(r,40));assert.equal(app.rooms.get(seat.code).match,null);assert.equal(app.rooms.get(seat.code).settings.bots,8);
  a.send({t:'settings',bots:0,bombs:3});a.send({t:'start'});await a.wait(m=>m.t==='error'&&m.message.includes('ready'));b.send({t:'ready',ready:true});await new Promise(r=>setTimeout(r,30));a.send({t:'start'});const snap=await a.wait(m=>m.t==='snapshot');assert.equal(snap.players.length,2);assert.equal(snap.bombs,1);
  const room=app.rooms.get(seat.code);a.send({t:'input',id:guest.id,seq:90,actionSeq:4,x:1,z:0,yaw:0});await new Promise(r=>setTimeout(r,35));assert.equal(room.match.players.find(p=>p.id===seat.id).inputSeq,90);assert.equal(room.match.players.find(p=>p.id===guest.id).inputSeq,-1);
  a.ws.close();c=await peer(port);c.send({t:'resume',code:seat.code,token:seat.token});const resumed=await c.wait(m=>m.t==='seat');assert.equal(resumed.id,seat.id);assert.equal(resumed.inputSeq,90);assert.equal(room.members.length,2);
  // Lifecycle fixture isolates rematch authorization without waiting through cosmetic ascent.
  room.match.phase='won';room.match.winner=seat.id;b.send({t:'rematch'});await new Promise(r=>setTimeout(r,30));assert.ok(room.match);c.send({t:'rematch'});await c.wait(m=>m.t==='room'&&m.state==='lobby'&&m.matchNumber===1);assert.equal(room.match,null);assert.equal(room.code,seat.code);assert.equal(room.members.length,2);assert.equal(room.members.find(p=>p.id===guest.id).ready,false);
 }finally{for(const p of [a,b,c])p?.ws.terminate();await app.close();}
});
