import React, {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Editor} from '@toast-ui/react-editor';
import API from '../config/apiConfig.js';
import {logDraftKey, readLogDraft, writeLogDraft, listNewLogDrafts} from '../util/projectLogDraft.js';
import '../css/ProjectLogComposer.css';

export default function ProjectLogComposer({user, projectId, projectTitle, date, log, adapter, onClose, onSaved}) {
    const baseline = useRef({title:log?.logTitle || '', content:log?.logContent || ''}).current;
    const key = logDraftKey(user, projectId, date, log?.logId);
    const [title,setTitle] = useState(baseline.title), [initialContent,setInitialContent] = useState(baseline.content);
    const [revision,setRevision] = useState(0), [candidate,setCandidate] = useState(null), [ready,setReady] = useState(false);
    const [confirmDelete,setConfirmDelete] = useState(false), [savedAt,setSavedAt] = useState(null);
    const [storageError,setStorageError] = useState(''), [error,setError] = useState(''), [busy,setBusy] = useState(false);
    const editor=useRef(null), dialog=useRef(null), titleInput=useRef(null), timer=useRef(null);
    const current=useRef({...baseline}), dirty=useRef(false), completed=useRef(false), pending=useRef(true), mounted=useRef(false);
    const flush=()=>{
        clearTimeout(timer.current);
        if(completed.current || pending.current || !dirty.current)return;
        try {
            const draft=writeLogDraft(window.localStorage,key,current.current,baseline);
            if(mounted.current){setSavedAt(draft?.savedAt || null);setStorageError('');}
            dirty.current=false;
        } catch {
            if(mounted.current)setStorageError('이 브라우저에서 임시 저장을 할 수 없습니다. 작성 내용을 별도로 복사해 두세요.');
        }
    };
    const change=(next)=>{
        current.current={...current.current,...next};dirty.current=true;
        clearTimeout(timer.current);timer.current=setTimeout(flush,600);
    };
    useEffect(()=>{
        mounted.current=true;
        try {const draft=readLogDraft(window.localStorage,key);setCandidate(draft);pending.current=!!draft;}
        catch {pending.current=false;setStorageError('이 브라우저에서 임시 저장을 할 수 없습니다. 작성 내용을 별도로 복사해 두세요.');}
        setReady(true);
        const previous=document.activeElement, overflow=document.body.style.overflow;
        document.body.style.overflow='hidden';dialog.current.showModal();
        const hidden=()=>{if(document.visibilityState==='hidden')flush();};
        window.addEventListener('pagehide',flush);document.addEventListener('visibilitychange',hidden);
        return()=>{
            mounted.current=false;flush();clearTimeout(timer.current);
            window.removeEventListener('pagehide',flush);document.removeEventListener('visibilitychange',hidden);
            dialog.current?.close();document.body.style.overflow=overflow;
            if(previous?.isConnected)previous.focus({preventScroll:true});
        };
    },[]);
    const restore=()=>{
        const value={title:candidate.title,content:candidate.content};current.current=value;
        setTitle(value.title);setInitialContent(value.content);setRevision(n=>n+1);setSavedAt(candidate.savedAt);
        setCandidate(null);pending.current=false;setConfirmDelete(false);
        requestAnimationFrame(()=>titleInput.current?.focus());
    };
    const discard=()=>{
        try {window.localStorage.removeItem(key);setStorageError('');}
        catch {setStorageError('임시본을 삭제하지 못했습니다. 브라우저 저장소 설정을 확인해주세요.');return;}
        setCandidate(null);pending.current=false;setConfirmDelete(false);setSavedAt(null);
        requestAnimationFrame(()=>titleInput.current?.focus());
    };
    const close=()=>{if(!busy){flush();onClose();}};
    const submit=async event=>{
        event.preventDefault();if(busy||pending.current)return;
        const value={title:current.current.title,content:editor.current?.getInstance().getMarkdown() ?? current.current.content};
        current.current=value;dirty.current=true;flush();
        if(!value.title.trim()||!value.content.trim()){setError('제목과 내용을 입력해주세요.');return;}
        if(value.title.length>20){setError('로그 제목은 20자 이내로 입력해주세요.');return;}
        setBusy(true);setError('');
        try {
            const response=await fetch(`${API.API_BASE_URL}/project/daily/log${log?'/update':''}`,{
                method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},
                body:JSON.stringify({...(log?{logId:log.logId}:{}),logProjectId:String(projectId),logProjectDate:date,logProjectTitle:value.title,logProjectContent:value.content})
            });
            const result=await response.json();
            if(!response.ok || !(log?result.logUpdateStatus:result.logSavedStatus))
                throw new Error(response.status===401?'로그인이 만료되었습니다. 임시본을 보관한 뒤 다시 로그인해주세요.':result.logUpdateMessage||result.logSavedMessage||'저장하지 못했습니다. 입력 내용과 임시본은 유지됩니다. 다시 시도해주세요.');
            completed.current=true;clearTimeout(timer.current);
            try {window.localStorage.removeItem(key);} catch { /* Server save already succeeded. */ }
            onSaved({...value,logId:log?.logId});
        } catch(ex){setError(ex.message || '저장하지 못했습니다. 입력 내용은 유지됩니다. 다시 시도해주세요.');}
        finally {setBusy(false);}
    };
    return createPortal(<dialog ref={dialog} className="project-log-composer" aria-labelledby="project-log-composer-heading" onCancel={event=>{event.preventDefault();close();}}>
        <form onSubmit={submit}>
            <div className="project-log-composer-heading"><div><span>{projectTitle} · {date}</span><h2 id="project-log-composer-heading">{log?'프로젝트 기록 수정':'프로젝트 기록 작성'}</h2></div><button type="button" onClick={close} disabled={busy} aria-label="작성 창 닫기">×</button></div>
            {candidate&&<div className="project-log-draft-notice" role="status">
                <p>이 브라우저에 {new Date(candidate.savedAt).toLocaleString('ko-KR')} 임시 저장된 내용이 있습니다.</p>
                <p>다른 기기에는 동기화되지 않습니다.{log?' 서버의 현재 기록과 다를 수 있습니다.':''}</p>
                <p className="project-log-draft-title">{candidate.title||'제목 없음'}</p>
                {confirmDelete?<><p>임시본을 삭제하면 복구할 수 없습니다.</p><div className="project-log-composer-actions"><button type="button" onClick={()=>setConfirmDelete(false)}>취소</button><button type="button" onClick={discard}>임시본 삭제 확인</button></div></>:<div className="project-log-composer-actions"><button type="button" onClick={restore}>불러오기</button><button type="button" onClick={()=>setConfirmDelete(true)}>임시본 삭제</button></div>}
            </div>}
            {storageError&&<p role="alert" className="project-resource-error">{storageError}</p>}
            {ready&&!candidate&&<>
                <label htmlFor="project-log-compose-title">제목 <span>{title.length}/20</span></label>
                <input ref={titleInput} id="project-log-compose-title" autoFocus maxLength={20} value={title} disabled={busy} autoComplete="off" onChange={event=>{setTitle(event.target.value);change({title:event.target.value});}}/>
                <span className="project-log-content-label">기록 내용</span>
                <div inert={busy ? '' : undefined} aria-busy={busy}><Editor key={revision} ref={editor} initialValue={initialContent} initialEditType="markdown" previewStyle="tab" height="400px" hooks={{addImageBlobHook:adapter}} useCommandShortcut={true}
                    onChange={()=>{const content=editor.current?.getInstance().getMarkdown();if(content!==undefined)change({content});}}/></div>
                <p className="project-log-draft-status">{savedAt?`이 브라우저에 임시 저장됨 · ${new Date(savedAt).toLocaleTimeString('ko-KR')}`:'제목과 내용은 이 브라우저에 자동 임시 저장됩니다. 다른 기기에는 동기화되지 않습니다.'}</p>
                {error&&<p role="alert" className="project-resource-error">{error}</p>}
                <div className="project-log-composer-actions"><button type="button" onClick={close} disabled={busy}>닫기 · 임시본 유지</button><button type="submit" disabled={busy}>{busy?'저장 중…':log?'수정 저장':'기록 등록'}</button></div>
            </>}
        </form>
    </dialog>,document.body);
}


export function ProjectLogDraftList({user,projectId,refreshKey,onResume}) {
    const [drafts,setDrafts]=useState([]);
    useEffect(()=>{
        const read=()=>{try{setDrafts(listNewLogDrafts(window.localStorage,user,projectId));}catch{setDrafts([]);}};
        read();window.addEventListener('storage',read);
        return()=>window.removeEventListener('storage',read);
    },[user,projectId,refreshKey]);
    if(!drafts.length)return null;
    return <aside className="project-log-draft-list" aria-label="작성 중인 프로젝트 기록">
        <p>이 브라우저에 작성 중인 기록이 있습니다. 날짜가 지나도 이어서 작성할 수 있습니다.</p>
        {drafts.map(draft=><button type="button" key={draft.key} onClick={()=>onResume(draft.date)}>
            {draft.date} · {draft.title||'제목 없음'} · 이어쓰기
        </button>)}
    </aside>;
}
