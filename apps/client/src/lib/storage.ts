import { CampaignSchema, SettingsSchema, type Campaign, type Settings } from '@mackerel/shared';

const DB_NAME='mackerel-company'; const STORE='state'; const DB_VERSION=1;
function openDb():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE);};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function get<T>(key:string):Promise<T|undefined>{const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const req=tx.objectStore(STORE).get(key);req.onsuccess=()=>resolve(req.result as T|undefined);req.onerror=()=>reject(req.error);});}
async function put(key:string,value:unknown):Promise<void>{const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(value,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}
export async function loadCampaign(mode:'solo'|'coop'='solo'):Promise<Campaign|null>{const raw=await get<unknown>(`campaign:${mode}`);const parsed=CampaignSchema.safeParse(raw);return parsed.success?parsed.data:null;}
export async function saveCampaign(campaign:Campaign):Promise<void>{await put(`campaign:${campaign.mode==='coop'||campaign.mode==='daily-coop'?'coop':'solo'}`,campaign);}
export async function loadSettings(defaults:Settings):Promise<Settings>{const raw=await get<unknown>('settings');const parsed=SettingsSchema.safeParse(raw);return parsed.success?parsed.data:defaults;}
export async function saveSettings(settings:Settings):Promise<void>{await put('settings',settings);}
export async function exportSoloSave():Promise<string>{const campaign=await loadCampaign('solo');return JSON.stringify({type:'mackerel-company-save',version:1,campaign},null,2);}
export async function importSoloSave(text:string):Promise<Campaign>{const data=JSON.parse(text) as unknown;const envelope=data as {type?:unknown;version?:unknown;campaign?:unknown};if(envelope.type!=='mackerel-company-save'||envelope.version!==1)throw new Error('지원하지 않는 저장 파일입니다.');const campaign=CampaignSchema.parse(envelope.campaign);await saveCampaign(campaign);return campaign;}
