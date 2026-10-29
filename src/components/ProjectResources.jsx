import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import API from '../config/apiConfig.js';
import '../css/ProjectResources.css';

export function safeProjectUrl(value) {
    try { const url=new URL(value); return ['http:','https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; }
    catch { return null; }
}
export function useProjectResources(projectId) {
    const [data,setData]=useState(null), [loading,setLoading]=useState(true), [loadError,setLoadError]=useState('');
    const [dialog,setDialog]=useState(null), [busy,setBusy]=useState(false), [formError,setFormError]=useState('');
    const [order,setOrder]=useState(null), [orderError,setOrderError]=useState(''), [orderNotice,setOrderNotice]=useState('');
    const currentId=useRef(projectId); currentId.current=projectId;
    const endpoint=`${API.API_BASE_URL}/project/${encodeURIComponent(projectId)}/resources`;
    useEffect(()=>{
        const controller=new AbortController(); setData(null); setLoading(true); setLoadError(''); setDialog(null); setOrder(null);setOrderError('');
        fetch(endpoint,{credentials:'include',cache:'no-store',signal:controller.signal})
            .then(async response=>{if(!response.ok) throw new Error(); return response.json();})
            .then(setData).catch(error=>{if(error.name!=='AbortError') setLoadError('프로젝트 추가 정보를 불러오지 못했습니다. 새로고침 후 다시 확인해주세요.');})
            .finally(()=>{if(!controller.signal.aborted) setLoading(false);});
        return ()=>controller.abort();
    },[endpoint]);
    const save=async(path,method,body)=>{
        const response=await fetch(endpoint+path,{method,credentials:'include',headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
        if(!response.ok) throw new Error(response.status===401?'로그인이 만료되었습니다. 입력 내용을 보관한 뒤 다시 로그인해주세요.':response.status===403?'프로젝트 관리자만 변경할 수 있습니다.':response.status===409?'다른 곳에서 링크가 변경되어 순서를 저장하지 못했습니다. 최신 목록을 불러온 뒤 다시 정렬해주세요.':response.status===400?'입력 내용이나 최대 링크 수(10개)를 확인해주세요.':'저장하지 못했습니다. 입력 내용은 유지됩니다. 다시 시도해주세요.');
        const next=await response.json();
        if(String(currentId.current)!==String(projectId)) throw new Error('프로젝트가 변경되었습니다.');
        setData(next); return next;
    };
    const openAdd=()=>{if(order)return;setFormError('');setDialog({mode:'add',label:'',url:''});};
    const openEdit=link=>{setFormError('');setDialog({mode:'edit',...link});};
    const openDelete=link=>{setFormError('');setDialog({mode:'delete',...link});};
    const submit=async event=>{
        event.preventDefault(); if(busy) return;
        if(dialog.mode!=='delete' && (!dialog.label.trim() || !safeProjectUrl(dialog.url.trim()))) {setFormError('링크 이름과 http:// 또는 https://로 시작하는 주소를 입력해주세요.');return;}
        setBusy(true);setFormError('');
        try {
            await save(dialog.mode==='add'?'/links':`/links/${dialog.id}`,dialog.mode==='add'?'POST':dialog.mode==='edit'?'PUT':'DELETE',dialog.mode==='delete'?null:{label:dialog.label.trim(),url:dialog.url.trim()});
            setDialog(null);
        } catch(error){setFormError(error.message || '저장하지 못했습니다. 입력 내용은 유지됩니다.');}
        finally{setBusy(false);}
    };
    const focusOrderButton=()=>requestAnimationFrame(()=>document.getElementById('project-links-reorder')?.focus({preventScroll:true}));
    const startOrder=()=>{const ids=(data?.links||[]).map(link=>link.id);setOrder({ids,expectedIds:[...ids]});setOrderError('');setOrderNotice('');requestAnimationFrame(()=>document.getElementById(`project-link-${ids[0]}-down`)?.focus());};
    const cancelOrder=()=>{setOrder(null);setOrderError('');setOrderNotice('');focusOrderButton();};
    const moveLink=(id,delta)=>{
        if(busy||!order)return;
        const ids=[...order.ids],index=ids.indexOf(id),target=index+delta;
        if(target<0||target>=ids.length)return;
        [ids[index],ids[target]]=[ids[target],ids[index]];setOrder({...order,ids});
        const label=data.links.find(link=>link.id===id)?.label;setOrderNotice(`${label}, ${ids.length}개 중 ${target+1}번째로 이동`);
        requestAnimationFrame(()=>{
            const direction=delta<0?'up':'down',other=delta<0?'down':'up';
            const button=document.getElementById(`project-link-${id}-${direction}`);
            (button?.disabled?document.getElementById(`project-link-${id}-${other}`):button)?.focus({preventScroll:true});
        });
    };
    const saveOrder=async()=>{
        if(busy||!order)return;setBusy(true);setOrderError('');
        try {await save('/links/order','PUT',order);setOrder(null);setOrderNotice('링크 순서가 저장되었습니다.');focusOrderButton();}
        catch(error){setOrderError(error.message||'순서를 저장하지 못했습니다. 편집한 순서는 유지됩니다. 다시 시도해주세요.');}
        finally{setBusy(false);}
    };
    const reloadOrder=async()=>{
        if(busy)return;setBusy(true);
        try {
            const response=await fetch(endpoint,{credentials:'include',cache:'no-store'});
            if(!response.ok)throw new Error();const next=await response.json();
            if(String(currentId.current)!==String(projectId))return;
            setData(next);setOrder(null);setOrderError('');setOrderNotice('최신 링크 목록을 불러왔습니다.');focusOrderButton();
        }catch{setOrderError('최신 목록을 불러오지 못했습니다. 편집한 순서는 유지됩니다. 다시 시도해주세요.');}
        finally{setBusy(false);}
    };
    return {data,loading,loadError,dialog,setDialog,busy,formError,save,openAdd,openEdit,openDelete,submit,
        order,orderError,orderNotice,startOrder,cancelOrder,moveLink,saveOrder,reloadOrder};
}
export function ProjectDescription({resources:r,fallbackSummary,canManage,onSaved}) {
    const [editing,setEditing]=useState(false),[summary,setSummary]=useState(''),[description,setDescription]=useState('');
    const [busy,setBusy]=useState(false),[error,setError]=useState('');
    const edit=()=>{setSummary(r.data?.summary??fallbackSummary??'');setDescription(r.data?.description||r.data?.summary||fallbackSummary||'');setError('');setEditing(true);};
    const save=async event=>{
        event.preventDefault();if(busy)return;setBusy(true);setError('');
        try {const next=await r.save('/description','PUT',{summary,description});onSaved(next);setEditing(false);}
        catch(error){setError(error.message || '저장하지 못했습니다. 입력 내용은 유지됩니다.');}
        finally{setBusy(false);}
    };
    return <section className="summary-section project-description-section">
        <div className="project-description-heading"><h3>프로젝트 설명</h3>{canManage&&!editing&&<button type="button" onClick={edit} disabled={r.loading||!r.data}>수정하기</button>}</div>
        {editing?<form className="project-description-form" onSubmit={save}>
            <label htmlFor="project-short-summary">목록·메인 요약 <span>{summary.length}/255</span></label>
            <textarea id="project-short-summary" rows={2} maxLength={255} value={summary} onChange={event=>setSummary(event.target.value)} disabled={busy}/>
            <label htmlFor="project-long-description">상세 설명 <span>{description.length}/10000</span></label>
            <textarea id="project-long-description" rows={8} maxLength={10000} value={description} onChange={event=>setDescription(event.target.value)} disabled={busy} aria-describedby="project-description-help"/>
            <p id="project-description-help">Enter로 줄을 바꾸고 빈 줄로 문단을 나눌 수 있습니다. 상세 설명은 이 페이지에 표시됩니다.</p>
            {error&&<p role="alert" className="project-resource-error">{error}</p>}
            <div className="project-resource-actions"><button type="button" onClick={()=>setEditing(false)} disabled={busy}>취소</button><button type="submit" disabled={busy}>{busy?'저장 중…':'설명 저장'}</button></div>
        </form>:<p className="project-detailed-description">{r.data?.description||r.data?.summary||fallbackSummary||'프로젝트 설명이 없습니다.'}</p>}
        {r.loadError&&<p className="project-resource-error" role="status">{r.loadError}</p>}
    </section>;
}
export function ProjectLinks({resources:r,canManage}) {
    const serverLinks=r.data?.links||[], ordering=canManage&&!!r.order;
    const links=ordering?r.order.ids.map(id=>serverLinks.find(link=>link.id===id)).filter(Boolean):serverLinks;
    if(!canManage&&!links.length)return null;
    const changed=ordering&&r.order.ids.some((id,index)=>id!==r.order.expectedIds[index]);
    return <section className="project-resources-card" aria-labelledby="project-links-heading">
        <div className="project-links-card-heading"><h3 id="project-links-heading" tabIndex={-1}>관련 링크{canManage&&<span className="project-resource-limit"> {links.length}/10</span>}</h3>
            {canManage&&links.length>1&&!ordering&&<button id="project-links-reorder" className="project-resource-add-btn" type="button" onClick={r.startOrder}>순서 변경</button>}
        </div>
        {ordering&&<p className="project-link-order-help">위·아래 버튼으로 이동한 뒤 순서를 저장해주세요.</p>}
        <p className="project-resource-sr-only" role="status">{r.orderNotice}</p>
        {r.loadError?<p role="status">{r.loadError}</p>:links.length?<ul>{links.map((link,index)=>{
            const url=safeProjectUrl(link.url);
            return <li key={link.id}><div className="project-resource-link-row">
                {ordering?<span className="project-link-order-name">{index+1}. {link.label}</span>:url?<a href={url} target="_blank" rel="noopener noreferrer"><span>{link.label}</span><span aria-hidden="true">↗</span><span className="project-resource-sr-only"> (새 탭)</span></a>:<span>{link.label} · 올바르지 않은 주소</span>}
                {url&&<span className="project-resource-host" title={link.url}>{new URL(url).host}</span>}
            </div>{canManage&&<div className="project-resource-actions">{ordering?<>
                <button id={`project-link-${link.id}-up`} type="button" onClick={()=>r.moveLink(link.id,-1)} disabled={r.busy||index===0} aria-label={`${link.label} 위로 이동`}>↑ 위로</button>
                <button id={`project-link-${link.id}-down`} type="button" onClick={()=>r.moveLink(link.id,1)} disabled={r.busy||index===links.length-1} aria-label={`${link.label} 아래로 이동`}>↓ 아래로</button>
            </>:<><button type="button" onClick={()=>r.openEdit(link)} aria-label={`${link.label} 링크 수정`}>수정</button><button type="button" onClick={()=>r.openDelete(link)} aria-label={`${link.label} 링크 삭제`}>삭제</button></>}</div>}</li>;
        })}</ul>:<p>{r.loading?'링크를 불러오는 중입니다.':'상단의 하이퍼링크 추가 버튼으로 사이트·저장소·문서를 연결해보세요.'}</p>}
        {ordering&&<>
            {r.orderError&&<div><p className="project-resource-error" role="alert">{r.orderError}</p><div className="project-resource-actions"><button type="button" onClick={r.reloadOrder} disabled={r.busy}>최신 목록 불러오기</button></div></div>}
            <div className="project-resource-actions"><button type="button" onClick={r.cancelOrder} disabled={r.busy}>취소</button><button type="button" className="project-link-order-save" onClick={r.saveOrder} disabled={r.busy||!changed}>{r.busy?'저장 중…':'순서 저장'}</button></div>
        </>}
    </section>;
}
export function ProjectLinkDialog({resources:r}) {
    const ref=useRef(null);
    const open=!!r.dialog;
    useEffect(()=>{
        if(!open)return;
        const previous=document.activeElement,dialog=ref.current,overflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();
        return()=>{dialog.close();document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus({preventScroll:true});else document.getElementById('project-links-heading')?.focus({preventScroll:true});};
    },[open]);
    if(!r.dialog)return null;
    const remove=r.dialog.mode==='delete';
    const close=()=>{if(!r.busy)r.setDialog(null);};
    return createPortal(<dialog ref={ref} className="project-resource-dialog" aria-labelledby="project-resource-dialog-title" onCancel={event=>{event.preventDefault();close();}}>
        <form onSubmit={r.submit}>
            <h2 id="project-resource-dialog-title">{remove?'링크 삭제':r.dialog.mode==='edit'?'하이퍼링크 수정':'하이퍼링크 추가'}</h2>
            {remove?<p><strong>{r.dialog.label}</strong> 링크를 삭제하시겠습니까?</p>:<>
                <label htmlFor="project-link-label">표시 이름</label>
                <input id="project-link-label" autoFocus required maxLength={60} value={r.dialog.label} onChange={event=>r.setDialog({...r.dialog,label:event.target.value})} disabled={r.busy} placeholder="예: GitHub 저장소"/>
                <label htmlFor="project-link-url">주소</label>
                <input id="project-link-url" type="url" inputMode="url" autoComplete="off" autoCapitalize="none" spellCheck={false} required maxLength={2048} value={r.dialog.url} onChange={event=>r.setDialog({...r.dialog,url:event.target.value})} disabled={r.busy} placeholder="https://example.com" aria-describedby="project-link-help"/>
                <p id="project-link-help">http·https 주소를 최대 10개까지 등록할 수 있습니다. 링크는 새 탭에서 열립니다.</p>
            </>}
            {r.formError&&<p className="project-resource-error" role="alert">{r.formError}</p>}
            <div className="project-resource-actions"><button type="button" onClick={close} disabled={r.busy} autoFocus={remove}>취소</button><button type="submit" disabled={r.busy}>{r.busy?'저장 중…':remove?'삭제':'링크 저장'}</button></div>
        </form>
    </dialog>,document.body);
}
