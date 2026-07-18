import { Client, type Room, type SeatReservation } from '@colyseus/sdk';
import { GameSnapshotSchema, type Campaign, type GameMode, type GameSnapshot, type PlayerInput } from '@mackerel/shared';
import type { PayrollBreakdown } from '@mackerel/simulation';

export interface RoomCreateResponse{roomId:string;code:string;reconnectToken:string;recoveryCode:string;campaignId:string;mode:GameMode;campaign:Campaign;reservation:SeatReservation}
export interface RoomJoinResponse{roomId:string;code:string;reconnectToken:string;recoveryCode:string;mode:GameMode;campaign:Campaign;reservation:SeatReservation}
interface RoomReconnectResponse{reservation:SeatReservation}
function apiBase():string{return import.meta.env.PROD?location.origin:'';}
function wsEndpoint():string{if(import.meta.env.PROD)return `${location.protocol==='https:'?'wss':'ws'}://${location.host}/colyseus`;return `ws://${location.hostname}:3000/colyseus`;}
export async function createRoom(nickname:string,options?:{campaignId?:string;recoveryCode?:string;daily?:boolean}):Promise<RoomCreateResponse>{const res=await fetch(`${apiBase()}/api/rooms`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({nickname,...options})});if(!res.ok)throw new Error((await res.json() as {error?:string}).error??'방 생성 실패');return res.json() as Promise<RoomCreateResponse>;}
export async function findRoom(code:string,nickname:string,reconnectToken?:string):Promise<RoomJoinResponse>{const res=await fetch(`${apiBase()}/api/rooms/join`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code,nickname,reconnectToken})});if(!res.ok)throw new Error((await res.json() as {error?:string}).error??'방 참가 실패');return res.json() as Promise<RoomJoinResponse>;}
export class CoopConnection{
  room:Room|undefined; private client=new Client(wsEndpoint());
  async connect(reservation:SeatReservation):Promise<Room>{this.room=await this.client.consumeSeatReservation(reservation);return this.room;}
  async reconnect(token:string):Promise<Room>{const res=await fetch(`${apiBase()}/api/rooms/reconnect`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({reconnectionToken:token})});if(!res.ok)throw new Error((await res.json() as {error?:string}).error??'재접속 실패');const data=await res.json() as RoomReconnectResponse;this.room=await this.client.consumeSeatReservation(data.reservation);return this.room;}
  onSnapshot(callback:(snapshot:GameSnapshot)=>void){this.room?.onMessage('snapshot',(raw:unknown)=>{const parsed=GameSnapshotSchema.safeParse(raw);if(parsed.success)callback(parsed.data);});}
  onLobby(callback:(players:Array<{id:string;nickname:string;ready:boolean;connected:boolean}>)=>void){this.room?.onMessage('lobby',(data:{players:Array<{id:string;nickname:string;ready:boolean;connected:boolean}>})=>callback(data.players));}
  onStarted(callback:()=>void){this.room?.onMessage('started',callback);}
  onCampaign(callback:(data:{campaign:Campaign;recoveryCode:string;payroll:PayrollBreakdown})=>void){this.room?.onMessage('campaign',(data:{campaign:Campaign;recoveryCode:string;payroll:PayrollBreakdown})=>callback(data));}
  onError(callback:(message:string)=>void){this.room?.onMessage('error',(data:{message:string})=>callback(data.message));}
  sendInput(input:PlayerInput){this.room?.send('input',input);} setReady(ready:boolean){this.room?.send('ready',{ready});} start(){this.room?.send('start');}
  leave(){void this.room?.leave();this.room=undefined;}
}
