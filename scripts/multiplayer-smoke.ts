import { spawn } from 'node:child_process';
import { Client, type Room, type SeatReservation } from '@colyseus/sdk';
import type { GameSnapshot } from '@mackerel/shared';

const port=Number(process.env.SMOKE_PORT??3321);
const base=`http://127.0.0.1:${port}`;
const ws=`ws://127.0.0.1:${port}/colyseus`;
const server=spawn(process.execPath,['apps/server/dist/index.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),DATABASE_PATH:`./data/smoke-${port}.sqlite`,LOG_LEVEL:'error'},stdio:['ignore','pipe','pipe']});
let serverLog='';server.stdout.on('data',chunk=>serverLog+=String(chunk));server.stderr.on('data',chunk=>serverLog+=String(chunk));
const stop=()=>{if(!server.killed)server.kill('SIGTERM');};process.on('exit',stop);
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const waitForHealth=async()=>{for(let i=0;i<80;i++){try{const response=await fetch(`${base}/health`);if(response.ok)return;}catch{await sleep(20);}await sleep(100);}throw new Error(`server did not start\n${serverLog}`);};
const post=async<T>(path:string,body:unknown):Promise<T>=>{const response=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});if(!response.ok)throw new Error(`${path}: ${response.status} ${await response.text()}`);return response.json() as Promise<T>;};
const connect=(reservation:SeatReservation):Promise<Room>=>new Client(ws).consumeSeatReservation(reservation);
const register=(room:Room,onSnapshot:(data:GameSnapshot)=>void)=>{room.onMessage('snapshot',(data:unknown)=>onSnapshot(data as GameSnapshot));room.onMessage('lobby',()=>{});room.onMessage('started',()=>{});room.onMessage('campaign',()=>{});room.onMessage('error',()=>{});};

try{
  await waitForHealth();
  const created=await post<{code:string;recoveryCode:string;campaign:{id:string;lastSeed:number};mode:string;reservation:SeatReservation}>('/api/rooms',{nickname:'Host'});
  const recoveredResponse=await fetch(`${base}/api/campaigns/recover/${created.recoveryCode}`);if(!recoveredResponse.ok)throw new Error('campaign recovery endpoint failed');const recovered=await recoveredResponse.json() as {campaign:{id:string}};
  const dailyA=await post<{mode:string;campaign:{lastSeed:number}}>('/api/rooms',{nickname:'Daily A',daily:true});const dailyB=await post<{mode:string;campaign:{lastSeed:number}}>('/api/rooms',{nickname:'Daily B',daily:true});
  const host=await connect(created.reservation);let hostSnapshot:GameSnapshot|null=null;let lobbyCount=0;
  register(host,data=>hostSnapshot=data);host.onMessage('lobby',(data:unknown)=>lobbyCount=(data as {players:unknown[]}).players.length);
  const joined=await post<{reservation:SeatReservation}>('/api/rooms/join',{code:created.code,nickname:'Guest'});
  const guest=await connect(joined.reservation);let guestSnapshot:GameSnapshot|null=null;let reconnected=false;
  register(guest,data=>guestSnapshot=data);guest.onReconnect(()=>{reconnected=true;});
  host.send('ready',{ready:true});guest.send('ready',{ready:true});await sleep(250);host.send('start');await sleep(400);
  const initialHost=(()=>hostSnapshot as GameSnapshot|null)(),initialGuest=(()=>guestSnapshot as GameSnapshot|null)();
  if(!initialHost||!initialGuest)throw new Error('initial snapshots missing');
  const before=initialHost.players[host.sessionId]!.position.x;
  host.send('input',{seq:1,move:{x:1,y:0},leftUse:false,rightUse:false,interact:false,dash:false,swapInventory:false,drop:false,ping:false,cartCommand:'none'});await sleep(500);
  const movedSnapshot=(()=>hostSnapshot as GameSnapshot|null)();if(!movedSnapshot)throw new Error('movement snapshot missing');
  const moved=movedSnapshot.players[host.sessionId]!.position.x>before;
  await sleep(4300);const beforeDrop=(()=>guestSnapshot as GameSnapshot|null)();if(!beforeDrop)throw new Error('guest snapshot missing');const oldTick=beforeDrop.tick;guest.connection.close();
  for(let i=0;i<35&&!reconnected;i++)await sleep(150);await sleep(250);
  const finalHost=(()=>hostSnapshot as GameSnapshot|null)(),finalGuest=(()=>guestSnapshot as GameSnapshot|null)();if(!finalHost||!finalGuest)throw new Error('final snapshots missing');
  const result={roomCode:created.code,lobbyPlayers:lobbyCount,snapshotPlayers:Object.keys(finalHost.players).length,moved,reconnected,tickContinued:finalGuest.tick>oldTick,recoveryWorks:recovered.campaign.id===created.campaign.id,dailyMode:dailyA.mode==='daily-coop'&&dailyB.mode==='daily-coop',dailySeedShared:dailyA.campaign.lastSeed===dailyB.campaign.lastSeed};
  console.log(JSON.stringify(result));
  if(result.lobbyPlayers!==2||result.snapshotPlayers!==2||!result.moved||!result.reconnected||!result.tickContinued||!result.recoveryWorks||!result.dailyMode||!result.dailySeedShared)process.exitCode=1;
} finally {stop();await Promise.race([new Promise<void>(resolve=>server.once('exit',()=>resolve())),sleep(1200)]);if(server.exitCode===null)server.kill('SIGKILL');}

process.exit(process.exitCode??0);
