import {test} from 'node:test';
import assert from 'node:assert/strict';
import {logDraftKey,readLogDraft,writeLogDraft,listNewLogDrafts} from '../src/util/projectLogDraft.js';
const store=()=>{const data=new Map();return {get length(){return data.size},key:i=>[...data.keys()][i],getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}};
const blank={title:'',content:''};
test('draft identities isolate user, project, date, create and individual edit logs',()=>{
 const keys=[logDraftKey('a',19,'2026-10-23'),logDraftKey('b',19,'2026-10-23'),logDraftKey('a',20,'2026-10-23'),logDraftKey('a',19,'2026-10-24'),logDraftKey('a',19,'2026-10-23',1),logDraftKey('a',19,'2026-10-23',2)];
 assert.equal(new Set(keys).size,6);assert.equal(logDraftKey('',19,'2026-10-23'),null);
 assert.notEqual(logDraftKey('a:b',1,'2026-10-23'),logDraftKey('a',1,'2026-10-23'));
});
test('persists exact Markdown, paragraphs and title across reload; cleanup isolates keys',()=>{
 const s=store(),key=logDraftKey('a',19,'2026-10-23'),other=logDraftKey('a',19,'2026-10-23',1);
 const v={title:'작업 기록',content:'# 제목\n\n둘째 문단\n- 목록\n'};
 writeLogDraft(s,key,v,blank);writeLogDraft(s,other,{title:'다른 수정',content:'내용'},blank);
 assert.deepEqual({...readLogDraft(s,key),version:undefined,savedAt:undefined},{...v,version:undefined,savedAt:undefined});
 s.removeItem(key);assert.equal(readLogDraft(s,key),null);assert.equal(readLogDraft(s,other).title,'다른 수정');
});
test('empty or unchanged content creates no draft, returning to baseline clears it',()=>{
 const s=store();writeLogDraft(s,'key',{title:' ',content:'\n'},blank);assert.equal(readLogDraft(s,'key'),null);
 const base={title:'기존',content:'본문'};writeLogDraft(s,'key',{title:'수정',content:'본문'},base);assert.ok(readLogDraft(s,'key'));
 writeLogDraft(s,'key',base,base);assert.equal(readLogDraft(s,'key'),null);
});
test('malformed data is ignored and quota/private storage errors are observable',()=>{
 const s=store();s.setItem('key','{');assert.equal(readLogDraft(s,'key'),null);
 s.setItem('key',JSON.stringify({version:1,title:123,content:'x',savedAt:1}));assert.equal(readLogDraft(s,'key'),null);
 assert.throws(()=>writeLogDraft({setItem(){throw new Error('quota')}},'key',{title:'x',content:'y'},blank),/quota/);
});

test('resume list includes older new entries only for the same account and project',()=>{
 const s=store(),blank={title:'',content:''};
 for(const [user,project,date,id] of [['a',19,'2026-10-22',null],['a',19,'2026-10-23',2],['b',19,'2026-10-22',null],['a',20,'2026-10-22',null]]){
  writeLogDraft(s,logDraftKey(user,project,date,id),{title:'기록',content:'본문'},blank);
 }
 const list=listNewLogDrafts(s,'a',19);
 assert.equal(list.length,1);assert.equal(list[0].date,'2026-10-22');
});
