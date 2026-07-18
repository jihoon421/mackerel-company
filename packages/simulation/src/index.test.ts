import { describe, expect, it } from 'vitest';
import type { ItemInstance, PlayerInput } from '@mackerel/shared';
import { GameSimulation, calculatePayroll, calculateQuota, createCampaign, isExitReachable, overQuotaMultiplier, streakMultiplier, validateKeyPlacement } from './index';

const input=(seq:number,overrides:Partial<PlayerInput>={}):PlayerInput=>({seq,move:{x:0,y:0},leftUse:false,rightUse:false,interact:false,dash:false,swapInventory:false,drop:false,ping:false,cartCommand:'none',...overrides});
const item=(id:string,size:'one-hand'|'two-hand'|'coop'='one-hand',kind:'artifact'|'equipment'='equipment'):ItemInstance=>({instanceId:id,contentId:kind==='artifact'?'human-spoon':'sonar',kind,size,durability:100,estimatedMin:10,estimatedMax:20,trueValue:100,carriedBy:[]});

describe('hand and inventory rules',()=>{
  it('equips one-hand items into separate hands',()=>{const sim=new GameSimulation({seed:1,day:1,mode:'solo',playerIds:['p']});expect(sim.equip('p',item('a'))).toBe(true);expect(sim.equip('p',item('b'))).toBe(true);expect(sim.state.players.p?.slots.left?.instanceId).toBe('a');expect(sim.state.players.p?.slots.right?.instanceId).toBe('b');});
  it('equips two-hand item in both hands',()=>{const sim=new GameSimulation({seed:2,day:1,mode:'solo',playerIds:['p']});const heavy=item('heavy','two-hand');expect(sim.equip('p',heavy)).toBe(true);expect(sim.state.players.p?.slots.left).toBe(heavy);expect(sim.state.players.p?.slots.right).toBe(heavy);});
  it('swaps inventory with selected hand',()=>{const sim=new GameSimulation({seed:3,day:1,mode:'solo',playerIds:['p']});sim.equip('p',item('a'));sim.equip('p',item('b'));sim.equip('p',item('c'));expect(sim.swapInventory('p','right')).toBe(true);expect(sim.state.players.p?.slots.right?.instanceId).toBe('c');expect(sim.state.players.p?.slots.inventory?.instanceId).toBe('b');});
  it('drops and damages a thrown artifact predictably',()=>{const sim=new GameSimulation({seed:4,day:1,mode:'solo',playerIds:['p']});const relic=item('r','one-hand','artifact');sim.equip('p',relic);const dropped=sim.drop('p','left',100);expect(dropped?.durability).toBe(92);expect(dropped?.position).toBeDefined();expect(sim.state.noises.length).toBeGreaterThan(0);});
  it('requires two players to stabilize a cooperative artifact',()=>{const sim=new GameSimulation({seed:5,day:1,mode:'coop',playerIds:['a','b']});const coop=item('coop','coop','artifact');coop.position={...sim.state.players.a!.position};sim.state.items.coop=coop;sim.state.players.b!.position={...sim.state.players.a!.position};expect(sim.pickup('a')).toBe(true);expect(coop.carriedBy).toEqual(['a']);expect(sim.pickup('b')).toBe(true);expect(coop.carriedBy).toEqual(['a','b']);expect(sim.state.players.a!.slots.left).toBe(coop);expect(sim.state.players.b!.slots.left).toBe(coop);});
  it('uses the solo cart as a winch for cooperative artifacts',()=>{const sim=new GameSimulation({seed:6,day:1,mode:'solo',playerIds:['p']});const coop=item('winch','coop','artifact');const p=sim.state.players.p!;sim.state.cart!.position={...p.position};coop.position={...p.position};sim.state.items.winch=coop;expect(sim.pickup('p')).toBe(true);expect(sim.state.cart?.carriedItemId).toBe('winch');expect(coop.carriedBy).toEqual(['cart']);});
});

describe('survival and rescue',()=>{
  it('freshness decreases on a dry route',()=>{const sim=new GameSimulation({seed:7,day:1,mode:'solo',playerIds:['p']});const p=sim.state.players.p!;p.position.y=30;const before=p.freshness;sim.applyInput('p',input(1,{move:{x:1,y:0}}));sim.step(1);expect(p.freshness).toBeLessThan(before);});
  it('cart cooling restores freshness nearby',()=>{const sim=new GameSimulation({seed:8,day:1,mode:'solo',playerIds:['p']});const p=sim.state.players.p!;p.freshness=40;sim.state.cart!.position={...p.position};sim.applyInput('p',input(1));sim.step(1);expect(p.freshness).toBeGreaterThan(40);});
  it('injury loss causes downed state',()=>{const sim=new GameSimulation({seed:9,day:1,mode:'coop',playerIds:['a','b']});sim.damagePlayer('a',3);expect(sim.state.players.a?.downed).toBe(true);});
  it('a nearby teammate revives a downed player',()=>{const sim=new GameSimulation({seed:10,day:1,mode:'coop',playerIds:['a','b']});sim.state.players.b!.position={...sim.state.players.a!.position};sim.damagePlayer('a',3);expect(sim.revive('b','a')).toBe(true);expect(sim.state.players.a?.downed).toBe(false);expect(sim.state.players.a?.reviveShield).toBe(3);});
  it('solo automatic frozen recovery is consumed once',()=>{const sim=new GameSimulation({seed:11,day:1,mode:'solo',playerIds:['p']});sim.damagePlayer('p',3);sim.state.players.p!.downedTimer=.01;sim.step(.05);expect(sim.state.players.p?.downed).toBe(false);expect(sim.state.cart?.recoveryAvailable).toBe(false);});
});

describe('risk, quota and payroll',()=>{
  it('noise raises danger progress and expires',()=>{const sim=new GameSimulation({seed:12,day:1,mode:'solo',playerIds:['p']});sim.addNoise({x:20,y:20},200,1,'test');expect(sim.state.dangerProgress).toBeGreaterThan(0);sim.step(2);expect(sim.state.noises).toHaveLength(0);});
  it('danger advances through stages',()=>{const sim=new GameSimulation({seed:13,day:1,mode:'solo',playerIds:['p']});sim.raiseDanger(3.2);expect(sim.state.danger).toBe(3);expect(sim.state.dangerProgress).toBeCloseTo(.2);});
  it('quota follows day and solo multipliers',()=>{expect(calculateQuota(1,1000,'solo')).toBe(690);expect(calculateQuota(10,1000,'coop')).toBeGreaterThan(1900);});
  it('overachievement tiers match design',()=>{expect(overQuotaMultiplier(1)).toBe(1);expect(overQuotaMultiplier(1.25)).toBe(1.25);expect(overQuotaMultiplier(1.5)).toBe(1.6);expect(overQuotaMultiplier(2)).toBe(2);});
  it('payroll adds earned bonuses and action-based fees',()=>{const pay=calculatePayroll({recovered:2000,quota:1000,contractReward:1.25,rescued:1,streak:3,facilityDamage:100,coolingUsed:10,cartDamage:5,success:true});expect(pay.overQuotaBonus).toBe(2000);expect(pay.contractBonus).toBe(500);expect(pay.rescueBonus).toBe(300);expect(pay.total).toBeGreaterThan(4000);expect(pay.coolingFee).toBe(-32);});
  it('failed shifts do not pay recovered artifacts',()=>{const pay=calculatePayroll({recovered:5000,quota:1000,contractReward:2,rescued:2,streak:8,facilityDamage:0,coolingUsed:0,cartDamage:10,success:false});expect(pay.recovered).toBe(0);expect(pay.total).toBe(0);});
  it('survival streak caps at 1.5x',()=>{expect(streakMultiplier(1)).toBe(1);expect(streakMultiplier(5)).toBe(1.35);expect(streakMultiplier(99)).toBe(1.5);});
  it('day difficulty changes generated quota and monster count',()=>{const early=new GameSimulation({seed:14,day:1,mode:'solo',playerIds:['p']});const late=new GameSimulation({seed:14,day:20,mode:'solo',playerIds:['p']});expect(late.state.quota).toBeGreaterThan(early.state.quota);expect(Object.keys(late.state.monsters).length).toBeGreaterThan(Object.keys(early.state.monsters).length);});
});

describe('monster and map validation',()=>{
  it('nearby players trigger a monster state transition',()=>{const sim=new GameSimulation({seed:15,day:8,mode:'solo',playerIds:['p']});const monster=Object.values(sim.state.monsters)[0]!;sim.state.players.p!.position={...monster.position};sim.applyInput('p',input(1));sim.step(.05);expect(['chase','attack']).toContain(monster.state);});
  it('reachable maps pass flood-fill validation',()=>{expect(isExitReachable(400,400,[])).toBe(true);expect(isExitReachable(400,400,[{x:70,y:0,w:70,h:400}])).toBe(false);});
  it('card keys cannot spawn inside their own locked room',()=>{const room={x:100,y:100,w:100,h:100};expect(validateKeyPlacement({x:150,y:150},[room])).toBe(false);expect(validateKeyPlacement({x:50,y:50},[room])).toBe(true);});
  it('campaign creation has versioned, recoverable progression data',()=>{const campaign=createCampaign('solo',123);expect(campaign.version).toBe(1);expect(campaign.day).toBe(1);expect(campaign.id).toContain('campaign-');});
});
