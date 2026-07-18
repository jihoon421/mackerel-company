import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCampaign } from '@mackerel/simulation';
import { CampaignDatabase } from './database.js';

const paths:string[]=[];
afterEach(()=>{for(const path of paths.splice(0))rmSync(path,{recursive:true,force:true});});

describe('CampaignDatabase',()=>{
  it('Day 완료 데이터를 복구 코드로 트랜잭션 저장하고 불러온다',()=>{
    const dir=mkdtempSync(join(tmpdir(),'mackerel-db-'));paths.push(dir);
    const db=new CampaignDatabase(join(dir,'campaign.sqlite'));
    const campaign={...createCampaign('coop',1234),day:7,salary:5580,streak:3};
    db.save(campaign,'FISHCODE10');
    expect(db.loadByRecoveryCode('FISHCODE10')).toMatchObject({id:campaign.id,day:7,salary:5580,streak:3});
    db.close();
  });
});
