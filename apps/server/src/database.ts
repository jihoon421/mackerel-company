import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Campaign } from '@mackerel/shared';

export class CampaignDatabase{
  private db:DatabaseSync;
  constructor(path:string){mkdirSync(dirname(path),{recursive:true});this.db=new DatabaseSync(path);this.db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');this.db.exec(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY, recovery_code TEXT UNIQUE NOT NULL, mode TEXT NOT NULL, day INTEGER NOT NULL,
      salary INTEGER NOT NULL, streak INTEGER NOT NULL, warnings INTEGER NOT NULL, data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_campaign_recovery ON campaigns(recovery_code);
  `);}
  save(campaign:Campaign,recoveryCode:string):void{this.db.exec('BEGIN IMMEDIATE');try{this.db.prepare(`INSERT INTO campaigns(id,recovery_code,mode,day,salary,streak,warnings,data_json,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET recovery_code=excluded.recovery_code,mode=excluded.mode,day=excluded.day,salary=excluded.salary,streak=excluded.streak,warnings=excluded.warnings,data_json=excluded.data_json,updated_at=excluded.updated_at`).run(campaign.id,recoveryCode,campaign.mode,campaign.day,campaign.salary,campaign.streak,campaign.warnings,JSON.stringify(campaign),campaign.updatedAt);this.db.exec('COMMIT');}catch(error){this.db.exec('ROLLBACK');throw error;}}
  loadByRecoveryCode(code:string):Campaign|null{const row=this.db.prepare('SELECT data_json FROM campaigns WHERE recovery_code = ?').get(code) as {data_json:string}|undefined;return row?JSON.parse(row.data_json) as Campaign:null;}
  close():void{this.db.close();}
}
