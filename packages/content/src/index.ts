import { z } from 'zod';
import { ArtifactRaritySchema, ContractSchema, ItemKindSchema, ItemSizeSchema } from '@mackerel/shared';

const MonsterDefSchema = z.object({
  id: z.string(), nameKo: z.string(), nameEn: z.string(), role: z.string(), unlockDay: z.number().int().positive(),
  speed: z.number().positive(), health: z.number().positive(), detection: z.number().positive(), hearing: z.number().positive(), damage: z.number().positive(),
  attackRange: z.number().positive(), attackCooldown: z.number().positive(), telegraph: z.string(), counter: z.string(), behavior: z.enum(['greed','mimic','juggernaut','shadow','mimic-loot','collector','leech','watcher','hook','split','echo','guardian','cable','swarm']), color: z.string()
});
export type MonsterDef = z.infer<typeof MonsterDefSchema>;

const MapDefSchema = z.object({
  id: z.string(), nameKo: z.string(), nameEn: z.string(), unlockDay: z.number().int().positive(), baseQuota: z.number().positive(), width: z.number().positive(), height: z.number().positive(),
  floor: z.string(), accent: z.string(), hazard: z.string(), description: z.string(), roomPattern: z.array(z.string()), monsterPool: z.array(z.string()), eventPool: z.array(z.string()), soloSafeRoute: z.boolean()
});
export type MapDef = z.infer<typeof MapDefSchema>;

const ItemDefSchema = z.object({
  id: z.string(), nameKo: z.string(), nameEn: z.string(), kind: ItemKindSchema, size: ItemSizeSchema, price: z.number().nonnegative(), unlockDay: z.number().int().positive(),
  cooldown: z.number().nonnegative(), batteryUse: z.number().nonnegative(), description: z.string(), icon: z.string(), effect: z.string()
});
export type ItemDef = z.infer<typeof ItemDefSchema>;

const ArtifactDefSchema = z.object({
  id: z.string(), nameKo: z.string(), nameEn: z.string(), size: ItemSizeSchema, rarity: ArtifactRaritySchema, baseMin: z.number().nonnegative(), baseMax: z.number().nonnegative(), weight: z.number().positive(),
  fragile: z.boolean(), waterSensitive: z.boolean(), metal: z.boolean(), icon: z.string()
});
export type ArtifactDef = z.infer<typeof ArtifactDefSchema>;

export const monsters: MonsterDef[] = z.array(MonsterDefSchema).parse([
  {id:'accountant-octopus',nameKo:'회계 문어',nameEn:'Accountant Octopus',role:'욕심 처벌형',unlockDay:1,speed:74,health:4,detection:280,hearing:440,damage:1,attackRange:50,attackCooldown:2.4,telegraph:'장부 도장 소리와 붉은 촉수 그림자',counter:'유물을 버리거나 가짜 유물을 던진다',behavior:'greed',color:'#b96cff'},
  {id:'copy-squid',nameKo:'복사 오징어',nameEn:'Copy Squid',role:'기만형',unlockDay:3,speed:68,health:3,detection:240,hearing:300,damage:0.5,attackRange:46,attackCooldown:3,telegraph:'그림자가 반대로 흔들린다',counter:'호스와 핑 신호를 확인한다',behavior:'mimic',color:'#42d7d1'},
  {id:'cannery-manager',nameKo:'통조림 관리자',nameEn:'Cannery Manager',role:'대형 추격형',unlockDay:5,speed:53,health:30,detection:520,hearing:650,damage:2,attackRange:74,attackCooldown:3.2,telegraph:'금속 발굽과 셔터 진동',counter:'압력문과 기둥을 이용해 시간을 번다',behavior:'juggernaut',color:'#ff7849'},
  {id:'human-hand',nameKo:'인간 손',nameEn:'Human Hand',role:'환경 낚아채기',unlockDay:4,speed:0.1,health:99,detection:600,hearing:0.1,damage:1,attackRange:80,attackCooldown:5,telegraph:'바닥에 커지는 손 그림자',counter:'그림자 밖으로 대시한다',behavior:'shadow',color:'#f1c6ae'},
  {id:'treasure-angler',nameKo:'가짜 보물 아귀',nameEn:'Treasure Angler',role:'가짜 유물',unlockDay:2,speed:38,health:5,detection:130,hearing:180,damage:1,attackRange:44,attackCooldown:3.5,telegraph:'가격 표시가 미세하게 떨린다',counter:'소나나 물건 투척으로 확인한다',behavior:'mimic-loot',color:'#ffd15a'},
  {id:'cleaning-robot',nameKo:'청소 로봇',nameEn:'Cleaning Robot',role:'유물 회수 방해',unlockDay:1,speed:62,health:5,detection:210,hearing:380,damage:0.25,attackRange:40,attackCooldown:2,telegraph:'삐빅 경고와 브러시 소리',counter:'길을 막거나 카트와 충돌시킨다',behavior:'collector',color:'#98a8b7'},
  {id:'cold-jelly',nameKo:'냉기 흡혈 해파리',nameEn:'Cold Leech Jelly',role:'냉기 흡수',unlockDay:2,speed:84,health:2,detection:220,hearing:250,damage:0.4,attackRange:36,attackCooldown:1.5,telegraph:'푸른 맥박과 유리 긁는 소리',counter:'전기 충격이나 벽 비비기로 제거한다',behavior:'leech',color:'#71e5ff'},
  {id:'watch-crab',nameKo:'감시 꽃게',nameEn:'Watch Crab',role:'경보 상승',unlockDay:1,speed:30,health:3,detection:330,hearing:190,damage:0.2,attackRange:38,attackCooldown:2.8,telegraph:'눈 렌즈가 노란색에서 붉게 변한다',counter:'뒤로 접근하거나 조명을 끈다',behavior:'watcher',color:'#ffb13b'},
  {id:'hook-eel',nameKo:'갈고리 장어',nameEn:'Hook Eel',role:'원거리 끌기',unlockDay:6,speed:58,health:5,detection:360,hearing:420,damage:0.8,attackRange:230,attackCooldown:4,telegraph:'갈고리 줄이 번쩍이고 감기는 소리',counter:'장애물 뒤로 숨거나 줄을 자른다',behavior:'hook',color:'#6db8a9'},
  {id:'split-tunicate',nameKo:'분열 멍게',nameEn:'Splitting Tunicate',role:'통로 봉쇄',unlockDay:7,speed:28,health:4,detection:150,hearing:320,damage:0.3,attackRange:42,attackCooldown:2,telegraph:'몸이 부풀고 균열음이 난다',counter:'공격하지 않고 우회하거나 얼린다',behavior:'split',color:'#d85c88'},
  {id:'alarm-nautilus',nameKo:'경보 앵무조개',nameEn:'Alarm Nautilus',role:'소음 증폭',unlockDay:8,speed:42,health:3,detection:200,hearing:600,damage:0.2,attackRange:52,attackCooldown:5,telegraph:'방금 낸 소리가 낮게 되감긴다',counter:'조용히 접근해 녹음 전에 기절한다',behavior:'echo',color:'#bc8cff'},
  {id:'scrapyard-queen',nameKo:'폐기장 여왕게',nameEn:'Scrapyard Queen',role:'엘리트 수호자',unlockDay:10,speed:48,health:20,detection:420,hearing:480,damage:1.5,attackRange:82,attackCooldown:3,telegraph:'집게를 세 번 두드리고 돌진한다',counter:'뒤쪽 약점과 자석 크레인을 활용한다',behavior:'guardian',color:'#d06045'},
  {id:'cable-eel',nameKo:'케이블 전기뱀장어',nameEn:'Cable Electric Eel',role:'장비 과열',unlockDay:9,speed:96,health:4,detection:260,hearing:500,damage:0.8,attackRange:64,attackCooldown:3.2,telegraph:'호스에 푸른 전류가 역주행한다',counter:'장비 전원을 끄고 건조 구역으로 유인한다',behavior:'cable',color:'#62f2ff'},
  {id:'ghost-sardines',nameKo:'유령 정어리 떼',nameEn:'Ghost Sardine Swarm',role:'밀어내기',unlockDay:11,speed:105,health:8,detection:400,hearing:350,damage:0.25,attackRange:70,attackCooldown:1.2,telegraph:'조명이 꺼지고 비늘 소리가 좌우로 이동한다',counter:'벽 틈에 숨거나 강한 조명을 비춘다',behavior:'swarm',color:'#b8f5ff'}
]);

export const maps: MapDef[] = z.array(MapDefSchema).parse([
  {id:'flooded-warehouse',nameKo:'침수 창고',nameEn:'Flooded Warehouse',unlockDay:1,baseQuota:1150,width:1800,height:1120,floor:'#163846',accent:'#3f8491',hazard:'수위 변화',description:'상자와 선반 사이로 얕은 물이 흐르는 입문 시설',roomPattern:['dock','shelves','pump','vault'],monsterPool:['watch-crab','cleaning-robot','cold-jelly','treasure-angler'],eventPool:['power-outage','water-rise','water-fall'],soloSafeRoute:true},
  {id:'freezer-line',nameKo:'냉동 포장 라인',nameEn:'Freezer Packing Line',unlockDay:3,baseQuota:1500,width:1920,height:1160,floor:'#25343d',accent:'#9bd8e8',hazard:'냉동 증기',description:'컨베이어와 자동문이 유물을 계속 이동시킨다',roomPattern:['conveyor','freezer','packing','control'],monsterPool:['cleaning-robot','cold-jelly','watch-crab','accountant-octopus'],eventPool:['conveyor-reverse','gas-leak','shutter-lock'],soloSafeRoute:true},
  {id:'disposal-zone',nameKo:'폐기 처리 구역',nameEn:'Disposal Zone',unlockDay:5,baseQuota:1900,width:1880,height:1200,floor:'#3a342e',accent:'#aa7449',hazard:'독성 바닥',description:'고철과 가짜 유물이 섞인 위험한 고수익 구역',roomPattern:['scrap','crusher','incinerator','heap'],monsterPool:['treasure-angler','split-tunicate','alarm-nautilus','scrapyard-queen'],eventPool:['toxic-leak','collapse','false-exit'],soloSafeRoute:true},
  {id:'research-wing',nameKo:'심해 연구동',nameEn:'Deep Research Wing',unlockDay:7,baseQuota:2350,width:2000,height:1240,floor:'#1d3038',accent:'#69bba8',hazard:'감시 카메라',description:'카드키와 실험 샘플, 변장형 생물이 기다린다',roomPattern:['lab','specimen','security','server'],monsterPool:['copy-squid','watch-crab','treasure-angler','cable-eel'],eventPool:['power-outage','security-scan','fake-alarm'],soloSafeRoute:true},
  {id:'cargo-dock',nameKo:'하역장과 도크',nameEn:'Cargo Dock',unlockDay:9,baseQuota:2800,width:2200,height:1320,floor:'#26313a',accent:'#d69b51',hazard:'이동식 크레인',description:'넓고 숨을 곳이 적지만 대형 유물이 많다',roomPattern:['dock','containers','crane','loading'],monsterPool:['hook-eel','cannery-manager','ghost-sardines','cleaning-robot'],eventPool:['crane-swing','shutter-lock','storm-surge'],soloSafeRoute:true},
  {id:'bio-storage',nameKo:'생물 저장 구역',nameEn:'Biological Storage',unlockDay:12,baseQuota:3300,width:1960,height:1260,floor:'#203b38',accent:'#77d09b',hazard:'깨지는 수조',description:'표본과 알 사이에 가짜 유물형 몬스터가 잠든다',roomPattern:['tanks','eggs','specimen','floodgate'],monsterPool:['treasure-angler','cold-jelly','split-tunicate','copy-squid'],eventPool:['tank-break','water-rise','bio-hatch'],soloSafeRoute:true},
  {id:'pressure-tunnel',nameKo:'압력 터널',nameEn:'Pressure Tunnel',unlockDay:16,baseQuota:3900,width:2300,height:960,floor:'#202b34',accent:'#7fa4bd',hazard:'압력문',description:'좁은 통로와 멀리 퍼지는 소리가 호스를 괴롭힌다',roomPattern:['tunnel','pressure','junction','airlock'],monsterPool:['hook-eel','alarm-nautilus','cable-eel','ghost-sardines'],eventPool:['air-blast','door-fault','friction-shift'],soloSafeRoute:true},
  {id:'cannery-floor',nameKo:'통조림 생산실',nameEn:'Cannery Production Floor',unlockDay:20,baseQuota:4800,width:2240,height:1360,floor:'#352f2e',accent:'#e16e44',hazard:'프레스와 회전 칼날',description:'생산라인 정지 퍼즐과 최종 공장장이 기다린다',roomPattern:['press','blade','magnet','manager'],monsterPool:['cannery-manager','cable-eel','accountant-octopus','human-hand'],eventPool:['conveyor-reverse','press-cycle','factory-lockdown'],soloSafeRoute:true}
]);

export const items: ItemDef[] = z.array(ItemDefSchema).parse([
  {id:'sonar',nameKo:'소나 탐지기',nameEn:'Sonar Scanner',kind:'equipment',size:'one-hand',price:420,unlockDay:1,cooldown:2,batteryUse:8,description:'주변 구조와 가짜 유물 위험을 드러낸다.',icon:'◎',effect:'sonar'},
  {id:'stunner',nameKo:'전기 충격기',nameEn:'Electric Stunner',kind:'equipment',size:'one-hand',price:520,unlockDay:1,cooldown:2.5,batteryUse:10,description:'근거리 몬스터를 잠시 기절시킨다.',icon:'ϟ',effect:'stun'},
  {id:'freeze-spray',nameKo:'냉동 스프레이',nameEn:'Freeze Spray',kind:'equipment',size:'one-hand',price:380,unlockDay:2,cooldown:0.4,batteryUse:4,description:'몬스터와 바닥을 얼린다.',icon:'❄',effect:'freeze'},
  {id:'price-scanner',nameKo:'가격 스캐너',nameEn:'Price Scanner',kind:'equipment',size:'one-hand',price:300,unlockDay:1,cooldown:1,batteryUse:3,description:'유물 예상가와 위험도를 표시한다.',icon:'₩',effect:'scan'},
  {id:'bait-can',nameKo:'미끼 참치캔',nameEn:'Bait Tuna Can',kind:'consumable',size:'one-hand',price:90,unlockDay:1,cooldown:1,batteryUse:0,description:'던져서 몬스터의 주의를 돌린다.',icon:'▣',effect:'bait'},
  {id:'wrench',nameKo:'수리 렌치',nameEn:'Repair Wrench',kind:'equipment',size:'one-hand',price:260,unlockDay:1,cooldown:1.2,batteryUse:0,description:'카트와 시설을 수리한다.',icon:'⌕',effect:'repair'},
  {id:'cutter',nameKo:'절단기',nameEn:'Cable Cutter',kind:'equipment',size:'one-hand',price:460,unlockDay:6,cooldown:1.8,batteryUse:0,description:'갈고리와 얇은 잠금장치를 절단한다.',icon:'✂',effect:'cut'},
  {id:'lantern',nameKo:'휴대용 랜턴',nameEn:'Portable Lantern',kind:'equipment',size:'one-hand',price:240,unlockDay:1,cooldown:0.2,batteryUse:1,description:'어둠을 밝히고 유령 떼를 흩뜨린다.',icon:'◉',effect:'light'},
  {id:'large-battery',nameKo:'대형 배터리',nameEn:'Large Battery',kind:'equipment',size:'two-hand',price:620,unlockDay:4,cooldown:1,batteryUse:0,description:'시설 또는 카트를 크게 충전한다.',icon:'▥',effect:'charge'},
  {id:'mobile-chiller',nameKo:'이동식 냉각기',nameEn:'Mobile Chiller',kind:'equipment',size:'two-hand',price:780,unlockDay:5,cooldown:5,batteryUse:25,description:'임시 안전 냉각 구역을 만든다.',icon:'❉',effect:'chill-zone'},
  {id:'industrial-magnet',nameKo:'산업용 자석',nameEn:'Industrial Magnet',kind:'equipment',size:'two-hand',price:850,unlockDay:8,cooldown:2,batteryUse:15,description:'금속 유물을 끌어당긴다.',icon:'∩',effect:'magnet'},
  {id:'large-cutter',nameKo:'대형 절단기',nameEn:'Industrial Cutter',kind:'equipment',size:'two-hand',price:920,unlockDay:10,cooldown:4,batteryUse:18,description:'대형 잠금문을 절단한다.',icon:'⋈',effect:'heavy-cut'},
  {id:'cold-pack',nameKo:'즉석 냉각팩',nameEn:'Instant Cold Pack',kind:'consumable',size:'one-hand',price:80,unlockDay:1,cooldown:1,batteryUse:0,description:'신선도를 즉시 회복한다.',icon:'◇',effect:'freshness'},
  {id:'repair-kit',nameKo:'수리 키트',nameEn:'Repair Kit',kind:'consumable',size:'one-hand',price:130,unlockDay:1,cooldown:1,batteryUse:0,description:'카트 또는 장비를 수리한다.',icon:'＋',effect:'repair-kit'},
  {id:'noise-firework',nameKo:'소음 폭죽',nameEn:'Noise Firework',kind:'consumable',size:'one-hand',price:110,unlockDay:3,cooldown:1,batteryUse:0,description:'큰 소음을 멀리 발생시킨다.',icon:'✦',effect:'noise'},
  {id:'fake-artifact',nameKo:'가짜 유물',nameEn:'Fake Artifact',kind:'consumable',size:'one-hand',price:140,unlockDay:4,cooldown:1,batteryUse:0,description:'욕심 많은 몬스터를 속인다.',icon:'◆',effect:'decoy'}
]);

export const artifacts: ArtifactDef[] = z.array(ArtifactDefSchema).parse([
  {id:'human-spoon',nameKo:'인간 숟가락',nameEn:'Human Spoon',size:'one-hand',rarity:'common',baseMin:90,baseMax:180,weight:1,fragile:false,waterSensitive:false,metal:true,icon:'⌁'},
  {id:'old-phone',nameKo:'오래된 휴대폰',nameEn:'Old Phone',size:'one-hand',rarity:'fine',baseMin:180,baseMax:420,weight:1.2,fragile:true,waterSensitive:true,metal:true,icon:'▯'},
  {id:'shiny-key',nameKo:'반짝이는 열쇠',nameEn:'Shiny Key',size:'one-hand',rarity:'rare',baseMin:320,baseMax:720,weight:0.6,fragile:false,waterSensitive:false,metal:true,icon:'⚿'},
  {id:'experiment-sample',nameKo:'실험 샘플',nameEn:'Experiment Sample',size:'one-hand',rarity:'special',baseMin:450,baseMax:980,weight:0.8,fragile:true,waterSensitive:false,metal:false,icon:'◈'},
  {id:'golden-pan',nameKo:'황금 프라이팬',nameEn:'Golden Frying Pan',size:'two-hand',rarity:'rare',baseMin:650,baseMax:1450,weight:3,fragile:false,waterSensitive:false,metal:true,icon:'◒'},
  {id:'pressure-valve',nameKo:'압력 밸브',nameEn:'Pressure Valve',size:'two-hand',rarity:'fine',baseMin:420,baseMax:860,weight:4,fragile:false,waterSensitive:false,metal:true,icon:'✥'},
  {id:'frozen-core',nameKo:'냉동 코어',nameEn:'Frozen Core',size:'two-hand',rarity:'classified',baseMin:1100,baseMax:2500,weight:5,fragile:true,waterSensitive:false,metal:true,icon:'❈'},
  {id:'giant-tuna',nameKo:'거대 냉동 참치',nameEn:'Giant Frozen Tuna',size:'coop',rarity:'special',baseMin:1600,baseMax:3000,weight:10,fragile:false,waterSensitive:false,metal:false,icon:'◁'},
  {id:'sub-engine',nameKo:'고대 잠수정 엔진',nameEn:'Ancient Sub Engine',size:'coop',rarity:'classified',baseMin:2400,baseMax:5200,weight:13,fragile:true,waterSensitive:true,metal:true,icon:'▰'},
  {id:'secret-server',nameKo:'회사 비밀 서버',nameEn:'Company Secret Server',size:'coop',rarity:'cursed',baseMin:3000,baseMax:8000,weight:15,fragile:true,waterSensitive:true,metal:true,icon:'▤'}
]);

export const contracts = z.array(ContractSchema).parse([
  {id:'standard',titleKey:'contract.standard',descriptionKey:'정해진 금액 이상 회수',rewardMultiplier:1,quotaMultiplier:1,rule:'quota'},
  {id:'big-haul',titleKey:'contract.bigHaul',descriptionKey:'대형 유물 하나 필수',rewardMultiplier:1.35,quotaMultiplier:1.08,rule:'large-artifact'},
  {id:'quiet-shift',titleKey:'contract.quiet',descriptionKey:'위험 단계 3 미만으로 탈출',rewardMultiplier:1.3,quotaMultiplier:1,rule:'danger-under-3'},
  {id:'no-down',titleKey:'contract.noDown',descriptionKey:'아무도 쓰러지지 않기',rewardMultiplier:1.25,quotaMultiplier:1.03,rule:'no-downed'},
  {id:'red-alert',titleKey:'contract.redAlert',descriptionKey:'위험 단계 3 이상에서 탈출',rewardMultiplier:1.45,quotaMultiplier:1.05,rule:'danger-at-least-3'},
  {id:'fragile',titleKey:'contract.fragile',descriptionKey:'유물 손상 없이 탈출',rewardMultiplier:1.3,quotaMultiplier:1.04,rule:'no-damage'}
]);

export const progression = {
  quota: { linear: 0.09, quadratic: 0.002, soloMultiplier: 0.69, coopMultiplier: 1 },
  streak: [{days:2,multiplier:1.1},{days:3,multiplier:1.2},{days:5,multiplier:1.35},{days:8,multiplier:1.5}],
  bossDays: [5,10,15,20,25,30],
  companyGradeDays: [10,20,30]
} as const;

export const localization = {
  ko: { title:'고등어 회사', subtitle:'오늘도 두 마리 출근', solo:'야간 단독 근무', coop:'2인 공동 근무', continue:'이어하기', daily:'일일 도전', settings:'설정', codex:'도감', credits:'크레딧', createRoom:'방 만들기', joinRoom:'방 참가', ready:'준비', start:'출근', quota:'할당량', value:'회수액', danger:'위험', freshness:'신선도', extraction:'탈출 가능', noInternet:'2인 공동 근무에는 인터넷 연결이 필요합니다.' },
  en: { title:'Mackerel Company', subtitle:'Another Shift', solo:'Night Solo Shift', coop:'Two-Fish Shift', continue:'Continue', daily:'Daily Challenge', settings:'Settings', codex:'Codex', credits:'Credits', createRoom:'Create Room', joinRoom:'Join Room', ready:'Ready', start:'Clock In', quota:'Quota', value:'Recovered', danger:'Danger', freshness:'Freshness', extraction:'Extraction Open', noInternet:'Two-player cooperative shift requires an internet connection.' }
} as const;

export function validateContent(): void {
  const ids = new Set(monsters.map(m => m.id));
  for (const map of maps) for (const monster of map.monsterPool) if (!ids.has(monster)) throw new Error(`Unknown monster ${monster} in ${map.id}`);
}
validateContent();
