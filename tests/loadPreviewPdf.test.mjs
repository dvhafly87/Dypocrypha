import test from 'node:test';
import assert from 'node:assert/strict';
import {loadPreviewPdf} from '../src/utils/loadPreviewPdf.mjs';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(promise=Promise.resolve({numPages:2}),destroyError){
    let calls=0;
    return {task:{promise,destroy:async()=>{calls++;if(destroyError)throw destroyError;}},calls:()=>calls};
}
test('loaded document without destroy is released through its loading task on navigation',async()=>{
    const f=fixture(),c=new AbortController();
    const doc=await loadPreviewPdf(()=>f.task,{},c.signal);
    assert.equal(doc.destroy,undefined);assert.equal(f.calls(),0);
    c.abort();c.abort();await tick();assert.equal(f.calls(),1);
});
test('leaving while loading destroys once and rejects the aborted result',async()=>{
    let resolve;const pending=new Promise(r=>resolve=r),f=fixture(pending),c=new AbortController();
    const result=loadPreviewPdf(()=>f.task,{},c.signal);
    const rejection=assert.rejects(result,{name:'AbortError'});
    c.abort();resolve({numPages:1});await rejection;assert.equal(f.calls(),1);
});
test('already aborted navigation does not create a worker',async()=>{
    const c=new AbortController();c.abort();let created=false;
    await assert.rejects(loadPreviewPdf(()=>{created=true;},{},c.signal),{name:'AbortError'});
    assert.equal(created,false);
});
test('invalid document releases its worker and preserves the load error',async()=>{
    const error=new Error('invalid PDF'),f=fixture(Promise.reject(error)),c=new AbortController();
    await assert.rejects(loadPreviewPdf(()=>f.task,{},c.signal),error);
    c.abort();await tick();assert.equal(f.calls(),1);
});
test('asynchronous destruction failure is handled during navigation',async()=>{
    const error=new Error('worker shutdown failed'),errors=[],f=fixture(undefined,error),c=new AbortController();
    await loadPreviewPdf(()=>f.task,{},c.signal,e=>errors.push(e));
    c.abort();await tick();assert.deepEqual(errors,[error]);assert.equal(f.calls(),1);
});
test('synchronous destruction failure is handled without breaking navigation',async()=>{
    const c=new AbortController(),errors=[];
    await loadPreviewPdf(()=>({promise:Promise.resolve({}),destroy:()=>{throw new Error('shutdown');}}),{},c.signal,e=>errors.push(e.message));
    c.abort();await tick();assert.deepEqual(errors,['shutdown']);
});
