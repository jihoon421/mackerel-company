import type { Campaign, CartState, Contract, GameMode, GameSnapshot, HandSlots, ItemInstance, MonsterState, NoiseEvent, PlayerInput, PlayerState, Vec2 } from '@mackerel/shared';
import { artifacts, contracts, items as itemDefs, maps, monsters, progression } from '@mackerel/content';

export class Rng {
  private state: number;
  constructor(seed: number) { this.state = seed >>> 0 || 0x9e3779b9; }
  next(): number { let t = this.state += 0x6d2b79f5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  int(min: number, max: number): number { return Math.floor(this.next() * (max - min + 1)) + min; }
  pick<T>(list: readonly T[]): T { const value = list[Math.floor(this.next() * list.length)]; if (value === undefined) throw new Error('Cannot pick from empty list'); return value; }
  chance(probability: number): boolean { return this.next() < probability; }
}

const clamp = (n: number, min: number, max: number): number => Math.max(min, Math.min(max, n));
const length = (v: Vec2): number => Math.hypot(v.x, v.y);
const distance = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);
const normalized = (v: Vec2): Vec2 => { const l = length(v); return l > 0.0001 ? {x:v.x/l,y:v.y/l} : {x:0,y:0}; };
const toward = (a: Vec2, b: Vec2): Vec2 => normalized({x:b.x-a.x,y:b.y-a.y});
const id = (prefix: string, tick: number, n: number): string => `${prefix}-${tick}-${n}`;

export interface PayrollBreakdown {
  recovered: number;
  overQuotaBonus: number;
  contractBonus: number;
  rescueBonus: number;
  streakBonus: number;
  facilityDamage: number;
  coolingFee: number;
  repairFee: number;
  companyFund: number;
  total: number;
  multiplier: number;
}

export interface SimulationOptions {
  seed: number;
  day: number;
  mode: GameMode;
  playerIds: string[];
  nicknames?: string[];
  mapId?: string | undefined;
  contractId?: string | undefined;
  durationSeconds?: number | undefined;
}

export function calculateQuota(day: number, mapBaseQuota: number, mode: GameMode, contractMultiplier = 1): number {
  const difficulty = Math.max(0, day - 1);
  const quotaMultiplier = 1 + progression.quota.linear * difficulty + progression.quota.quadratic * difficulty * difficulty;
  const modeMultiplier = mode === 'solo' || mode === 'daily-solo' ? progression.quota.soloMultiplier : progression.quota.coopMultiplier;
  return Math.round(mapBaseQuota * quotaMultiplier * modeMultiplier * contractMultiplier / 10) * 10;
}

export function overQuotaMultiplier(ratio: number): number {
  if (ratio >= 2.5) return 2.25;
  if (ratio >= 2) return 2;
  if (ratio >= 1.75) return 2;
  if (ratio >= 1.5) return 1.6;
  if (ratio >= 1.25) return 1.25;
  return ratio >= 1 ? 1 : 0;
}

export function streakMultiplier(streak: number): number {
  let result = 1;
  for (const tier of progression.streak) if (streak >= tier.days) result = tier.multiplier;
  return result;
}

export function calculatePayroll(input: { recovered: number; quota: number; contractReward: number; rescued: number; streak: number; facilityDamage: number; coolingUsed: number; cartDamage: number; success: boolean }): PayrollBreakdown {
  if (!input.success) return {recovered:0,overQuotaBonus:0,contractBonus:0,rescueBonus:0,streakBonus:0,facilityDamage:0,coolingFee:0,repairFee:Math.round(input.cartDamage*5),companyFund:0,total:0,multiplier:0};
  const multiplier = overQuotaMultiplier(input.recovered / Math.max(1, input.quota));
  const recovered = Math.round(input.recovered);
  const overQuotaBonus = Math.max(0, Math.round(recovered * (multiplier - 1)));
  const contractBonus = Math.round(recovered * Math.max(0, input.contractReward - 1));
  const rescueBonus = input.rescued * 300;
  const streakBonus = Math.round((recovered + overQuotaBonus) * (streakMultiplier(input.streak) - 1));
  const facilityDamage = -Math.round(input.facilityDamage);
  const coolingFee = -Math.round(input.coolingUsed * 3.2);
  const repairFee = -Math.round(input.cartDamage * 4.5);
  const companyFund = -Math.min(400, Math.round((recovered + overQuotaBonus) * 0.04));
  const total = Math.max(0, recovered + overQuotaBonus + contractBonus + rescueBonus + streakBonus + facilityDamage + coolingFee + repairFee + companyFund);
  return {recovered,overQuotaBonus,contractBonus,rescueBonus,streakBonus,facilityDamage,coolingFee,repairFee,companyFund,total,multiplier};
}

export function createCampaign(mode: GameMode, seed = Date.now()): Campaign {
  return {version:1,id:`campaign-${seed.toString(36)}`,mode,day:1,salary:500,unlocks:['sonar','stunner','lantern'],equipment:['sonar','lantern','cold-pack'],streak:0,warnings:0,lastSeed:seed,tutorialComplete:false,codex:[],dailyRecords:{},updatedAt:new Date().toISOString()};
}

function makeSlots(): HandSlots { return {left:null,right:null,inventory:null}; }
function makePlayer(playerId: string, nickname: string, index: number, mapWidth: number, mapHeight: number): PlayerState {
  return {id:playerId,nickname,position:{x:150+index*70,y:mapHeight/2+index*55},velocity:{x:0,y:0},facing:0,freshness:100,injuries:3,downed:false,downedTimer:0,reviveShield:0,slots:makeSlots(),connected:true,ready:false,lastInputSeq:0,dashCooldown:0,valueCarried:0,color:index===0?'#62d9ff':'#ffcf5c'};
}

function makeArtifact(defId: string, instanceId: string, rng: Rng, position: Vec2): ItemInstance {
  const def = artifacts.find(a => a.id === defId) ?? artifacts[0];
  if (!def) throw new Error('No artifact definitions');
  const jackpot = rng.chance(0.035) ? rng.int(170,260)/100 : 1;
  const trash = rng.chance(0.08) ? rng.int(35,65)/100 : 1;
  const trueValue = Math.round((def.baseMin + rng.next()*(def.baseMax-def.baseMin))*jackpot*trash);
  const spread = def.rarity === 'common' ? 0.18 : def.rarity === 'classified' || def.rarity === 'cursed' ? 0.45 : 0.28;
  return {instanceId,contentId:def.id,kind:'artifact',size:def.size,durability:100,estimatedMin:Math.max(10,Math.round(trueValue*(1-spread)/10)*10),estimatedMax:Math.round(trueValue*(1+spread)/10)*10,trueValue,carriedBy:[],position};
}

function mapForDay(day: number, rng: Rng, requested?: string) {
  if (requested) return maps.find(m => m.id === requested) ?? maps[0]!;
  const available = maps.filter(m => m.unlockDay <= day);
  if (day === 30) return maps.find(m => m.id === 'cannery-floor') ?? available[0]!;
  return rng.pick(available);
}

function contractForDay(rng: Rng, requested?: string): Contract {
  if (requested) return contracts.find(c => c.id === requested) ?? contracts[0]!;
  return rng.pick(contracts);
}

function createItems(rng: Rng, mapWidth: number, mapHeight: number, quota: number, day: number): Record<string,ItemInstance> {
  const result: Record<string,ItemInstance> = {};
  let total = 0;
  let index = 0;
  const available = artifacts.filter((_,i) => i <= Math.min(artifacts.length-1, 3+Math.floor(day/4)));
  while (total < quota*2.15 && index < 42) {
    const def = rng.pick(available);
    const margin = 170;
    const item = makeArtifact(def.id, `loot-${index}`, rng, {x:rng.int(margin,mapWidth-margin),y:rng.int(margin,mapHeight-margin)});
    result[item.instanceId] = item; total += item.trueValue; index++;
  }
  const starterIds = ['sonar','lantern','stunner','cold-pack'];
  starterIds.forEach((contentId,i) => {
    const def = itemDefs.find(it=>it.id===contentId)!;
    result[`gear-${i}`] = {instanceId:`gear-${i}`,contentId,kind:def.kind,size:def.size,durability:100,estimatedMin:0,estimatedMax:0,trueValue:0,carriedBy:[],position:{x:210+i*65,y:mapHeight/2-120}};
  });
  return result;
}

function createMonsters(rng: Rng, mapWidth: number, mapHeight: number, day: number, pool: string[]): Record<string,MonsterState> {
  const result: Record<string,MonsterState> = {};
  const count = clamp(2 + Math.floor(day/2), 2, 14);
  const available = pool.filter(monsterId => (monsters.find(m=>m.id===monsterId)?.unlockDay ?? 99) <= day);
  const fallback = monsters.filter(m=>m.unlockDay<=day).map(m=>m.id);
  const source = available.length ? available : fallback;
  for (let i=0;i<count;i++) {
    const contentId = rng.pick(source);
    const def = monsters.find(m=>m.id===contentId)!;
    result[`monster-${i}`] = {id:`monster-${i}`,contentId,position:{x:rng.int(520,mapWidth-120),y:rng.int(120,mapHeight-120)},velocity:{x:0,y:0},state:def.behavior==='mimic-loot'?'disguised':'patrol',targetId:null,health:def.health,cooldown:rng.next()*2,alert:0,elite:false};
  }
  if (day%5===0) {
    const bossId = day===10?'scrapyard-queen':day>=25?'copy-squid':'cannery-manager';
    const def = monsters.find(m=>m.id===bossId)!;
    result.boss = {id:'boss',contentId:bossId,position:{x:mapWidth-260,y:mapHeight/2},velocity:{x:0,y:0},state:'patrol',targetId:null,health:def.health*1.5,cooldown:3,alert:0,elite:true};
  }
  return result;
}

export function createGame(options: SimulationOptions): GameSnapshot {
  const rng = new Rng(options.seed);
  const map = mapForDay(options.day,rng,options.mapId);
  const contract = contractForDay(rng,options.contractId);
  const quota = calculateQuota(options.day,map.baseQuota,options.mode,contract.quotaMultiplier);
  const players: Record<string,PlayerState> = {};
  options.playerIds.forEach((playerId,index)=>players[playerId]=makePlayer(playerId,options.nicknames?.[index] ?? `고등어 ${index+1}`,index,map.width,map.height));
  const cart: CartState|null = options.mode==='solo'||options.mode==='daily-solo'?{position:{x:95,y:map.height/2},velocity:{x:0,y:0},battery:100,health:100,mode:'follow',carriedItemId:null,recoveryAvailable:true,hoseTension:0}:null;
  return {tick:0,seed:options.seed,mode:options.mode,phase:'field',day:options.day,mapId:map.id,timeLeft:options.durationSeconds ?? clamp(540+options.day*4,540,720),quota,recoveredValue:0,danger:0,dangerProgress:0,extractionOpen:false,extractionCountdown:0,players,monsters:createMonsters(rng,map.width,map.height,options.day,map.monsterPool),cart,items:createItems(rng,map.width,map.height,quota,options.day),noises:[],activeContract:contract,mapWidth:map.width,mapHeight:map.height,events:['근무 시작'],completed:false,success:false};
}

export class GameSimulation {
  readonly state: GameSnapshot;
  private pendingInputs = new Map<string,PlayerInput>();
  private rng: Rng;
  private eventCounter = 0;
  private coolingUsed = 0;
  private facilityDamage = 0;
  private rescues = 0;
  constructor(options: SimulationOptions) { this.state=createGame(options); this.rng=new Rng(options.seed^0xabcdef); }
  applyInput(playerId:string,input:PlayerInput):void { const p=this.state.players[playerId]; if(!p||input.seq<=p.lastInputSeq)return; this.pendingInputs.set(playerId,input); }
  setConnected(playerId:string,connected:boolean):void { const p=this.state.players[playerId]; if(p)p.connected=connected; }
  setReady(playerId:string,ready:boolean):void { const p=this.state.players[playerId]; if(p)p.ready=ready; }
  addNoise(position:Vec2,radius:number,intensity:number,source:string):void { this.state.noises.push({id:id('noise',this.state.tick,this.eventCounter++),position:{...position},radius,intensity:clamp(intensity,0,1),ttl:1.4,source}); this.raiseDanger(intensity*0.085); }
  raiseDanger(amount:number):void { if(this.state.danger>=4)return; this.state.dangerProgress+=amount; while(this.state.dangerProgress>=1&&this.state.danger<4){this.state.dangerProgress-=1;this.state.danger++;this.state.events.push(`위험 단계 ${this.state.danger}`);if(this.state.danger===4)this.state.extractionCountdown=45;} }
  private nearestItem(position:Vec2,max=68):ItemInstance|null { let best:ItemInstance|null=null,bestD=max; for(const item of Object.values(this.state.items)){if(!item.position||(item.carriedBy.length&&item.size!=='coop'))continue;const d=distance(position,item.position);if(d<bestD){best=item;bestD=d;}} return best; }
  private assignItem(player:PlayerState,item:ItemInstance):boolean {
    if(item.size==='coop'){
      if(this.state.cart){
        if(this.state.cart.carriedItemId||distance(player.position,this.state.cart.position)>135)return false;
        this.state.cart.carriedItemId=item.instanceId;item.carriedBy=['cart'];delete item.position;this.addNoise(this.state.cart.position,260,0.28,'winch');return true;
      }
      if(item.carriedBy.includes(player.id)||item.carriedBy.length>=2)return false;
      const hand=!player.slots.left?'left':!player.slots.right?'right':null;if(!hand)return false;
      player.slots[hand]=item;item.carriedBy.push(player.id);
      if(item.carriedBy.length>=2)delete item.position;else item.position={...player.position};
      return true;
    }
    if(item.size==='two-hand'){
      if(player.slots.left||player.slots.right)return false;player.slots.left=item;player.slots.right=item;item.carriedBy=[player.id];delete item.position;return true;
    }
    if(!player.slots.left){player.slots.left=item;item.carriedBy=[player.id];delete item.position;return true;}
    if(!player.slots.right){player.slots.right=item;item.carriedBy=[player.id];delete item.position;return true;}
    if(!player.slots.inventory){player.slots.inventory=item;item.carriedBy=[player.id];delete item.position;return true;}
    return false;
  }
  pickup(playerId:string):boolean { const p=this.state.players[playerId];if(!p||p.downed)return false;const item=this.nearestItem(p.position);if(!item)return false;return this.assignItem(p,item); }
  equip(playerId:string,item:ItemInstance):boolean { const p=this.state.players[playerId];return !!p&&this.assignItem(p,item); }
  swapInventory(playerId:string,hand:'left'|'right'='right'):boolean { const p=this.state.players[playerId];if(!p||!p.slots.inventory)return false;const selected=p.slots[hand];if(selected?.size!=='one-hand')return false;p.slots[hand]=p.slots.inventory;p.slots.inventory=selected;return true; }
  drop(playerId:string,hand:'left'|'right'='right',throwForce=0):ItemInstance|null { const p=this.state.players[playerId];if(!p)return null;const selected=p.slots[hand];if(!selected)return null;
    if(selected.size==='coop'){
      p.slots[hand]=null;selected.carriedBy=selected.carriedBy.filter(id=>id!==playerId);const remaining=selected.carriedBy.map(id=>this.state.players[id]).find((candidate):candidate is PlayerState=>Boolean(candidate));selected.position=remaining?{...remaining.position}:{x:clamp(p.position.x+Math.cos(p.facing)*(45+throwForce),30,this.state.mapWidth-30),y:clamp(p.position.y+Math.sin(p.facing)*(45+throwForce),30,this.state.mapHeight-30)};
    }else{if(selected.size!=='one-hand'){p.slots.left=null;p.slots.right=null;}else p.slots[hand]=null;selected.carriedBy=[];selected.position={x:clamp(p.position.x+Math.cos(p.facing)*(45+throwForce),30,this.state.mapWidth-30),y:clamp(p.position.y+Math.sin(p.facing)*(45+throwForce),30,this.state.mapHeight-30)};}
    if(throwForce>20&&selected.position){selected.durability=clamp(selected.durability-(selected.kind==='artifact'?8:2),0,100);this.addNoise(selected.position,220,0.35,'throw');}return selected;
  }
  damagePlayer(playerId:string,amount:number):void { const p=this.state.players[playerId];if(!p||p.reviveShield>0||p.downed)return;p.injuries=clamp(p.injuries-Math.max(1,Math.round(amount)),0,3);if(p.injuries<=0)this.downPlayer(p); }
  private downPlayer(p:PlayerState):void { p.downed=true;p.downedTimer=20;p.velocity={x:0,y:0};this.state.events.push(`${p.nickname} 쓰러짐`); }
  revive(reviverId:string,targetId:string):boolean { const r=this.state.players[reviverId],t=this.state.players[targetId];if(!r||!t||!t.downed||distance(r.position,t.position)>78)return false;t.downed=false;t.downedTimer=0;t.injuries=1;t.freshness=Math.max(t.freshness,30);t.reviveShield=3;this.rescues++;this.state.events.push(`${t.nickname} 구조 성공`);return true; }
  private interact(player:PlayerState):void {
    const downed=Object.values(this.state.players).find(p=>p.id!==player.id&&p.downed&&distance(p.position,player.position)<78);if(downed&&this.revive(player.id,downed.id))return;
    if(player.position.x<155&&Math.abs(player.position.y-this.state.mapHeight/2)<190){this.depositPlayer(player);return;}
    if(!this.pickup(player.id)&&this.state.cart&&distance(player.position,this.state.cart.position)<90&&this.state.cart.health<100){this.state.cart.health=clamp(this.state.cart.health+12,0,100);}
  }
  private depositPlayer(player:PlayerState):void { const unique=new Map<string,ItemInstance>();[player.slots.left,player.slots.right,player.slots.inventory].forEach(item=>{if(item?.kind==='artifact'&&item.size!=='coop')unique.set(item.instanceId,item);});
    if(this.state.cart?.carriedItemId&&distance(this.state.cart.position,player.position)<150){const cartItem=this.state.items[this.state.cart.carriedItemId];if(cartItem)unique.set(cartItem.instanceId,cartItem);this.state.cart.carriedItemId=null;}
    for(const item of unique.values()){const value=Math.round(item.trueValue*(item.durability/100));this.state.recoveredValue+=value;delete this.state.items[item.instanceId];}player.slots=makeSlots();if(unique.size){this.state.events.push(`유물 입고 +${[...unique.values()].reduce((sum,item)=>sum+Math.round(item.trueValue*(item.durability/100)),0)}`);if(this.state.recoveredValue>=this.state.quota){this.state.extractionOpen=true;this.state.events.push('할당량 달성, 탈출 가능');}}
  }
  private useHand(player:PlayerState,hand:'left'|'right'):void { const item=player.slots[hand];if(!item)return;const def=itemDefs.find(d=>d.id===item.contentId);if(!def)return;
    if(def.effect==='sonar'){this.addNoise(player.position,160,0.12,'sonar');for(const m of Object.values(this.state.monsters))if(distance(player.position,m.position)<330)m.alert=Math.max(m.alert,0.35);}
    else if(def.effect==='stun'){for(const m of Object.values(this.state.monsters))if(distance(player.position,m.position)<95){m.state='stunned';m.cooldown=2.5;}}
    else if(def.effect==='freeze'){for(const m of Object.values(this.state.monsters))if(distance(player.position,m.position)<125){m.state='stunned';m.cooldown=1.2;}player.freshness=clamp(player.freshness-1,0,100);this.coolingUsed+=1;}
    else if(def.effect==='freshness'){player.freshness=clamp(player.freshness+35,0,100);this.consumeItem(player,item);}
    else if(def.effect==='noise'){const target={x:clamp(player.position.x+Math.cos(player.facing)*260,0,this.state.mapWidth),y:clamp(player.position.y+Math.sin(player.facing)*260,0,this.state.mapHeight)};this.addNoise(target,600,0.9,'firework');this.consumeItem(player,item);}
    else if(def.effect==='bait'){const dropped=this.drop(player.id,hand,150);if(dropped)this.addNoise(dropped.position!,320,0.45,'bait');}
    else if(def.effect==='repair'&&this.state.cart&&distance(player.position,this.state.cart.position)<110)this.state.cart.health=clamp(this.state.cart.health+18,0,100);
    else if(def.effect==='light')for(const m of Object.values(this.state.monsters))if(m.contentId==='ghost-sardines'&&distance(player.position,m.position)<210){m.state='retreat';m.cooldown=2;}
  }
  private consumeItem(player:PlayerState,item:ItemInstance):void { if(player.slots.left?.instanceId===item.instanceId)player.slots.left=null;if(player.slots.right?.instanceId===item.instanceId)player.slots.right=null;if(player.slots.inventory?.instanceId===item.instanceId)player.slots.inventory=null;delete this.state.items[item.instanceId]; }
  private updatePlayer(player:PlayerState,input:PlayerInput|undefined,dt:number):void {
    if(player.reviveShield>0)player.reviveShield=Math.max(0,player.reviveShield-dt);if(player.dashCooldown>0)player.dashCooldown=Math.max(0,player.dashCooldown-dt);
    if(player.downed){player.downedTimer=Math.max(0,player.downedTimer-dt);if(player.downedTimer===0){if(this.state.cart?.recoveryAvailable){this.state.cart.recoveryAvailable=false;player.downed=false;player.injuries=1;player.freshness=35;player.position={...this.state.cart.position};player.reviveShield=3;this.state.events.push('자동 냉동 복구 사용');}else this.fail();}return;}
    if(!input){player.velocity.x*=0.75;player.velocity.y*=0.75;return;}player.lastInputSeq=input.seq;
    const move=normalized(input.move);let speed=155;const carried=new Set([player.slots.left?.instanceId,player.slots.right?.instanceId].filter(Boolean));if(carried.size&&[player.slots.left,player.slots.right].some(i=>i?.size!=='one-hand'))speed*=(player.slots.left?.size==='coop'||player.slots.right?.size==='coop')?.5:.62;if(player.freshness<=15)speed*=0.65;
    if(input.dash&&player.dashCooldown<=0){speed*=2.45;player.dashCooldown=1.35;this.addNoise(player.position,190,0.22,'dash');}
    player.velocity={x:move.x*speed,y:move.y*speed};player.position.x=clamp(player.position.x+player.velocity.x*dt,25,this.state.mapWidth-25);player.position.y=clamp(player.position.y+player.velocity.y*dt,25,this.state.mapHeight-25);if(length(move)>0.1)player.facing=Math.atan2(move.y,move.x);
    const dry=player.position.y<this.state.mapHeight*0.23||player.position.y>this.state.mapHeight*0.78;let freshnessLoss=(dry?0.85:0.22)*dt;if(this.state.danger>=3)freshnessLoss*=1.22;player.freshness=clamp(player.freshness-freshnessLoss,0,100);
    if(this.state.cart){const d=distance(player.position,this.state.cart.position);if(d<135){player.freshness=clamp(player.freshness+4.8*dt,0,100);this.coolingUsed+=dt;}this.state.cart.hoseTension=clamp((d-330)/230,0,1);if(d>560){const pull=toward(player.position,this.state.cart.position);player.position.x+=pull.x*65*dt;player.position.y+=pull.y*65*dt;}}
    const other=Object.values(this.state.players).find(p=>p.id!==player.id);if(other){const d=distance(player.position,other.position);if(d>650){const pull=toward(player.position,other.position);player.position.x+=pull.x*(d-650)*0.8*dt;player.position.y+=pull.y*(d-650)*0.8*dt;}}
    for(const held of [player.slots.left,player.slots.right])if(held?.size==='coop'&&held.carriedBy.length===1)held.position={...player.position};
    if(player.freshness<=0)this.downPlayer(player);
    if(input.interact)this.interact(player);if(input.swapInventory)this.swapInventory(player.id);if(input.drop)this.drop(player.id,'right',80);if(input.leftUse)this.useHand(player,'left');if(input.rightUse)this.useHand(player,'right');if(input.cartCommand!=='none'&&this.state.cart)this.state.cart.mode=input.cartCommand==='stay'?'stay':input.cartCommand==='call'||input.cartCommand==='follow'?'follow':this.state.cart.mode;
    if(length(move)>0.65&&this.state.tick%14===0&&dry)this.addNoise(player.position,130,0.08,'flop');
  }
  private updateCart(dt:number):void { const cart=this.state.cart;if(!cart||cart.health<=0)return;const p=Object.values(this.state.players)[0];if(!p)return;if(cart.mode==='follow'){const d=distance(cart.position,p.position);if(d>105&&cart.battery>0){const dir=toward(cart.position,p.position);const speed=Math.min(cart.carriedItemId?72:105,d);cart.velocity={x:dir.x*speed,y:dir.y*speed};cart.position.x=clamp(cart.position.x+cart.velocity.x*dt,30,this.state.mapWidth-30);cart.position.y=clamp(cart.position.y+cart.velocity.y*dt,30,this.state.mapHeight-30);cart.battery=clamp(cart.battery-(cart.carriedItemId?1.7:.8)*dt,0,100);if(this.state.tick%30===0)this.addNoise(cart.position,cart.carriedItemId?310:180,cart.carriedItemId?.24:.12,'cart');}else cart.velocity={x:0,y:0};}if(cart.carriedItemId){const dragged=this.state.items[cart.carriedItemId];if(dragged)dragged.position={x:cart.position.x+55,y:cart.position.y+20};}if(cart.battery<=0)cart.mode='disabled'; }
  private chooseTarget(monster:MonsterState,def:typeof monsters[number]):PlayerState|null { const alive=Object.values(this.state.players).filter(p=>!p.downed);if(!alive.length)return null;if(def.behavior==='greed')return alive.sort((a,b)=>this.carriedValue(b)-this.carriedValue(a))[0]??null;return alive.sort((a,b)=>distance(a.position,monster.position)-distance(b.position,monster.position))[0]??null; }
  private carriedValue(p:PlayerState):number { return [...new Map([p.slots.left,p.slots.right,p.slots.inventory].filter((x):x is ItemInstance=>!!x).map(i=>[i.instanceId,i])).values()].reduce((s,i)=>s+i.trueValue,0); }
  private updateMonster(m:MonsterState,dt:number):void { const def=monsters.find(x=>x.id===m.contentId);if(!def)return;if(m.cooldown>0)m.cooldown=Math.max(0,m.cooldown-dt);if(m.state==='stunned'||m.state==='retreat'){if(m.cooldown<=0)m.state='patrol';return;}const target=this.chooseTarget(m,def);if(!target)return;const d=distance(m.position,target.position);let heard:NoiseEvent|undefined;for(const noise of this.state.noises)if(distance(m.position,noise.position)<Math.min(def.hearing,noise.radius))heard=noise;
    if(heard&&m.state!=='chase'){m.state='investigate';m.targetId=null;const dir=toward(m.position,heard.position);m.velocity={x:dir.x*def.speed,y:dir.y*def.speed};}
    const sees=d<def.detection*(this.state.danger>=2?1.25:1);if(sees&&!(def.behavior==='mimic-loot'&&m.state==='disguised'&&d>75)){m.state='chase';m.targetId=target.id;}
    if(def.behavior==='watcher'&&sees){m.alert=clamp(m.alert+dt*0.55,0,1);if(m.alert>=1){this.raiseDanger(0.22);m.alert=0.35;}}
    if(def.behavior==='echo'&&heard&&m.cooldown<=0){this.addNoise(m.position,Math.min(750,heard.radius*1.45),Math.min(1,heard.intensity*1.35),'echo');m.cooldown=5;}
    if(m.state==='chase'){
      const dir=toward(m.position,target.position);let speed=def.speed*(1+this.state.danger*0.055);if(def.behavior==='swarm')speed*=1.25;if(def.behavior==='juggernaut')speed*=0.9;m.velocity={x:dir.x*speed,y:dir.y*speed};m.position.x=clamp(m.position.x+m.velocity.x*dt,30,this.state.mapWidth-30);m.position.y=clamp(m.position.y+m.velocity.y*dt,30,this.state.mapHeight-30);
      if(def.behavior==='hook'&&d<def.attackRange&&d>90&&m.cooldown<=0){target.position.x+=(m.position.x-target.position.x)*0.22;target.position.y+=(m.position.y-target.position.y)*0.22;m.cooldown=def.attackCooldown;this.addNoise(target.position,220,0.26,'hook');}
      if(def.behavior==='leech'&&d<def.attackRange){target.freshness=clamp(target.freshness-15*dt,0,100);if(this.state.cart&&distance(m.position,this.state.cart.position)<50)this.state.cart.battery=clamp(this.state.cart.battery-20*dt,0,100);}
      if(def.behavior==='collector'){const item=this.nearestItem(m.position,150);if(item?.position){const idir=toward(m.position,item.position);m.position.x+=idir.x*def.speed*dt;m.position.y+=idir.y*def.speed*dt;if(distance(m.position,item.position)<30){item.durability=clamp(item.durability-8,0,100);item.position.x=clamp(item.position.x+40,20,this.state.mapWidth-20);}}}
      if(d<def.attackRange&&m.cooldown<=0){this.damagePlayer(target.id,def.damage);m.cooldown=def.attackCooldown;this.addNoise(target.position,190,0.24,'monster-hit');if(def.behavior==='greed'){const held=target.slots.right??target.slots.left;if(held?.kind==='artifact')this.drop(target.id,target.slots.right?'right':'left',100);}if(def.behavior==='cable'&&this.state.cart)this.state.cart.battery=clamp(this.state.cart.battery-16,0,100);}
    } else if(m.state==='investigate'&&heard){const dir=toward(m.position,heard.position);m.position.x+=dir.x*def.speed*0.7*dt;m.position.y+=dir.y*def.speed*0.7*dt;if(distance(m.position,heard.position)<35)m.state='patrol';}
    else { if(this.state.tick%100===0){m.velocity={x:(this.rng.next()-.5)*def.speed,y:(this.rng.next()-.5)*def.speed};}m.position.x=clamp(m.position.x+m.velocity.x*dt*.35,40,this.state.mapWidth-40);m.position.y=clamp(m.position.y+m.velocity.y*dt*.35,40,this.state.mapHeight-40); }
  }
  private updateExtraction(dt:number):void { if(this.state.danger===4){this.state.extractionCountdown=Math.max(0,this.state.extractionCountdown-dt);if(this.state.extractionCountdown===0)this.fail();}if(!this.state.extractionOpen)return;const players=Object.values(this.state.players);const atExit=players.filter(p=>!p.downed&&p.position.x<130&&Math.abs(p.position.y-this.state.mapHeight/2)<190);if(atExit.length===players.length&&players.length){this.complete(true);} }
  private fail():void { if(this.state.completed)return;this.state.completed=true;this.state.success=false;this.state.phase='failed';this.state.events.push('근무 실패'); }
  complete(success=true):void { if(this.state.completed)return;this.state.completed=true;this.state.success=success;this.state.phase=success?'appraisal':'failed';this.state.events.push(success?'탈출 성공':'근무 실패'); }
  step(dt=0.05):GameSnapshot { if(this.state.completed)return this.state;this.state.tick++;this.state.timeLeft=Math.max(0,this.state.timeLeft-dt);for(const [pid,p] of Object.entries(this.state.players)){const input=this.pendingInputs.get(pid);this.updatePlayer(p,input,dt);this.pendingInputs.delete(pid);}this.updateCart(dt);for(const m of Object.values(this.state.monsters))this.updateMonster(m,dt);for(const n of this.state.noises)n.ttl-=dt;this.state.noises=this.state.noises.filter(n=>n.ttl>0);if(this.state.timeLeft===0){this.raiseDanger(2);if(this.state.danger<4)this.state.danger=4;if(this.state.extractionCountdown<=0)this.state.extractionCountdown=45;}if(this.state.tick%600===0)this.raiseDanger(0.1+this.state.day*0.004);this.updateExtraction(dt);this.state.events=this.state.events.slice(-8);return this.state; }
  payroll(streak:number):PayrollBreakdown { return calculatePayroll({recovered:this.state.recoveredValue,quota:this.state.quota,contractReward:this.state.activeContract?.rewardMultiplier??1,rescued:this.rescues,streak,facilityDamage:this.facilityDamage,coolingUsed:this.coolingUsed,cartDamage:this.state.cart?100-this.state.cart.health:0,success:this.state.success}); }
}

export function isExitReachable(width:number,height:number,blocked:readonly {x:number;y:number;w:number;h:number}[]):boolean {
  const cell=40,cols=Math.ceil(width/cell),rows=Math.ceil(height/cell),start=[Math.floor((width-80)/cell),Math.floor(height/2/cell)] as const,goalX=1;
  const key=(x:number,y:number)=>`${x},${y}`;const queue:[number,number][]=[[start[0],start[1]]];const seen=new Set([key(...start)]);
  while(queue.length){const current=queue.shift();if(!current)break;const [x,y]=current;if(x<=goalX)return true;for(const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]] as [number,number][]){if(nx<0||ny<0||nx>=cols||ny>=rows||seen.has(key(nx,ny)))continue;const px=nx*cell+cell/2,py=ny*cell+cell/2;const hit=blocked.some(b=>px>b.x&&px<b.x+b.w&&py>b.y&&py<b.y+b.h);if(!hit){seen.add(key(nx,ny));queue.push([nx,ny]);}}}return false;
}

export function validateKeyPlacement(keyPosition:Vec2, lockedRooms:readonly {x:number;y:number;w:number;h:number}[]):boolean { return !lockedRooms.some(r=>keyPosition.x>=r.x&&keyPosition.x<=r.x+r.w&&keyPosition.y>=r.y&&keyPosition.y<=r.y+r.h); }
