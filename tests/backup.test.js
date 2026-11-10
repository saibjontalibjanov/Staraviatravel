import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
test('SQLite backup verifies a copy and refuses to overwrite any existing file',()=>{
 const directory=mkdtempSync(join(tmpdir(),'staravia-backup-')),source=join(directory,'source.sqlite3'),target=join(directory,'copy.sqlite3')
 try{
  execFileSync('python',['-c',"import sqlite3,sys; c=sqlite3.connect(sys.argv[1]); c.execute('create table sample (id integer primary key, value text)'); c.execute(\"insert into sample(value) values ('fixture')\"); c.commit()",source])
  execFileSync('python',['scripts/backup_sqlite.py',source,target])
  assert.notEqual(spawnSync('python',['scripts/backup_sqlite.py',source,target]).status,0)
  execFileSync('python',['-c',"import sqlite3,sys; assert sqlite3.connect(sys.argv[1]).execute('select count(*) from sample').fetchone()[0]==1",source])
 }finally{rmSync(directory,{recursive:true,force:true})}
})
