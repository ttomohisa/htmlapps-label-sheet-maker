import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));
const tests=fs.readdirSync(path.join(root,'tests')).filter(name=>name.endsWith('.test.mjs')).sort();
function run(names,source,label){
  console.log(`\n[App tests] ${label}`);
  const result=spawnSync(process.execPath,['--test',...names.map(name=>path.join(root,'tests',name))],{cwd:root,stdio:'inherit',env:{...process.env,...(source?{LABEL_SHEET_TEST_SOURCE:source}:{})}});
  if(result.error)throw result.error;
  if(result.status!==0)throw new Error(`${label} tests failed (${result.status??result.signal}).`);
}
run(tests,null,'all source and packaging tests');
const runtimeTests=tests.filter(name=>name.endsWith('core.test.mjs')||/v1\.0(?:\.1)?-(?:work-protection|import|pdf|startup)/.test(name));
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'label-sheet-tests-'));
try{
  const loader=fs.readFileSync(path.join(root,'dist/index.self-extract.html'),'utf8');
  const payload=loader.match(/<script id="self-extract-payload"[^>]*>([A-Za-z0-9+/=]+)<\/script>/);
  if(!payload)throw new Error('Self-extract payload is absent.');
  const restored=path.join(temp,'restored.html');fs.writeFileSync(restored,gunzipSync(Buffer.from(payload[1],'base64')));
  for(const [name,file] of [['readable','dist/index.html'],['root download','label-sheet-maker.html'],['restored self-extract',restored]])run(runtimeTests,path.isAbsolute(file)?file:path.join(root,file),name);
}finally{fs.rmSync(temp,{recursive:true,force:true});}
console.log('\n[OK] All app tests passed across every release variant.');
