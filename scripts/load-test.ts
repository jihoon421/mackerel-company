import { Client, type Room, type SeatReservation } from '@colyseus/sdk';

const base=process.env.SERVER_URL??'http://127.0.0.1:3000';
const roomCount=Math.max(1,Number(process.env.ROOMS??8));
const ws=base.replace(/^http/,'ws')+'/colyseus';
const post=async<T>(path:string,body:unknown):Promise<T>=>{const response=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});if(!response.ok)throw new Error(`${path}: ${response.status} ${await response.text()}`);return response.json() as Promise<T>;};
const connect=async(reservation:SeatReservation):Promise<Room>=>new Client(ws).consumeSeatReservation(reservation);

const started=Date.now();
const results=await Promise.all(Array.from({length:roomCount},async(_,index)=>{
  const host=await post<{code:string;reservation:SeatReservation}>('/api/rooms',{nickname:`부하방장${index}`});
  const a=await connect(host.reservation);a.onMessage('lobby',()=>{});a.onMessage('snapshot',()=>{});a.onMessage('started',()=>{});
  const guest=await post<{reservation:SeatReservation}>('/api/rooms/join',{code:host.code,nickname:`부하동료${index}`});
  const b=await connect(guest.reservation);b.onMessage('lobby',()=>{});b.onMessage('snapshot',()=>{});b.onMessage('started',()=>{});
  a.send('ready',{ready:true});b.send('ready',{ready:true});await new Promise(resolve=>setTimeout(resolve,80));a.send('start');await new Promise(resolve=>setTimeout(resolve,180));
  await Promise.all([a.leave(true),b.leave(true)]);return host.code;
}));
console.log(JSON.stringify({rooms:results.length,elapsedMs:Date.now()-started,codes:results}));
