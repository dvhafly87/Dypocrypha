import { useCallback, useEffect, useRef, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const signature = value => JSON.stringify(value);
export function useEditorDraft({ boardId, postId, privateBoard, values, editorRef, applyValues, serverVersion, initialValues }) {
  const { isLogined, nickname } = useAuth();
  const key = isLogined && nickname ? `editor-draft:v1:${encodeURIComponent(nickname)}:${privateBoard ? 'private' : 'public'}:${boardId}:${postId || 'new'}` : null;
  const latest = useRef();
  latest.current = { values, applyValues, serverVersion, initialValues };
  const baseline = useRef(null), dirtyRef = useRef(false), bypass = useRef(false), timer = useRef();
  const storeRef = useRef(null), keyRef = useRef(null), rawRef = useRef(null), candidateRef = useRef(null);
  const [ready, setReady] = useState(false), [dirty, setDirty] = useState(false);
  const [candidate, setCandidate] = useState(null), [status, setStatus] = useState('idle'), [savedAt, setSavedAt] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [leaveRequest, setLeaveRequest] = useState(null);
  const current = useCallback(() => ({ ...latest.current.values, content: editorRef.current?.getData() || '' }), [editorRef]);
  const pending = () => !!editorRef.current?.plugins.get('PendingActions')?.hasAny;
  const flush = useCallback(() => {
    clearTimeout(timer.current);
    if (!dirtyRef.current) return true;
    if (candidateRef.current) return false;
    const store = storeRef.current, storageKey = keyRef.current;
    if (!store || !storageKey) { setStatus('error'); return false; }
    try {
      if (store.getItem(storageKey) !== rawRef.current) { setStatus('conflict'); return false; }
      const time = Date.now();
      const raw = JSON.stringify({ version: 1, data: current(), savedAt: time, serverVersion: latest.current.serverVersion || null });
      store.setItem(storageKey, raw); rawRef.current = raw;
      setSavedAt(time); setStatus(pending() ? 'uploading' : 'saved');
      return !pending();
    } catch { setStatus('error'); return false; }
  }, [current]);
  const changed = useCallback(() => {
    if (!ready || baseline.current === null) return;
    const modified = signature(current()) !== baseline.current || pending();
    dirtyRef.current = modified; setDirty(modified); bypass.current = false;
    clearTimeout(timer.current);
    if (!modified) {
      if (!candidateRef.current) {
        try {
          const store = storeRef.current, storageKey = keyRef.current;
          if (store && storageKey && store.getItem(storageKey) === rawRef.current) {
            store.removeItem(storageKey); rawRef.current = null; setSavedAt(null);
          }
        } catch { setStatus('error'); return; }
      }
      setStatus('idle'); return;
    }
    if (candidateRef.current) return;
    setStatus(pending() ? 'uploading' : 'saving');
    timer.current = setTimeout(flush, 1000);
  }, [current, flush, ready]);
  const onReady = () => {
    baseline.current = signature({ ...(latest.current.initialValues || { title: '', isPinned: false, isAnonymous: false }), content: current().content }); dirtyRef.current = false; setDirty(false); setReady(true);
  };
  useEffect(() => {
    if (!ready) return;
    keyRef.current = key; storeRef.current = null; candidateRef.current = null; setCandidate(null);
    if (!key) return;
    try {
      const store = privateBoard ? sessionStorage : localStorage;
      storeRef.current = store;
      const raw = store.getItem(key); rawRef.current = raw;
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.version === 1 && Number.isFinite(saved.savedAt) && saved.savedAt > 0 && typeof saved.data?.title === 'string' && typeof saved.data?.content === 'string') {
          if (signature(saved.data) !== baseline.current) {
            candidateRef.current = saved; setCandidate(saved); setStatus('recovery');
          }
        }
      }
    } catch { setStatus('error'); }
  }, [key, privateBoard, ready]);
  useEffect(changed, [values.title, values.isPinned, values.isAnonymous, changed]);
  useEffect(() => {
    const unload = event => {
      if (!dirtyRef.current || bypass.current) return;
      flush(); event.preventDefault(); event.returnValue = '';
    };
    const hidden = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('beforeunload', unload);
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      clearTimeout(timer.current);
      window.removeEventListener('beforeunload', unload); window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [flush]);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirtyRef.current && !bypass.current && currentLocation.pathname + currentLocation.search !== nextLocation.pathname + nextLocation.search);
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    setLeaveRequest({ route: true, saved: flush() });
  }, [blocker.state]);
  const restore = () => {
    const saved = candidateRef.current;
    if (!saved) return;
    latest.current.applyValues(saved.data);
    editorRef.current?.setData(saved.data.content);
    candidateRef.current = null; setCandidate(null); setSavedAt(saved.savedAt);
    editorRef.current?.editing.view.focus();
    dirtyRef.current = true; setDirty(true); setStatus('saving');
    timer.current = setTimeout(flush, 1000);
  };
  const keepCurrent = () => {
    if (!window.confirm('이전 임시 글 대신 현재 편집 내용을 사용하시겠습니까?')) return;
    try {
      if (storeRef.current?.getItem(keyRef.current) !== rawRef.current) {
        setStatus('conflict'); return;
      }
      storeRef.current?.removeItem(keyRef.current); rawRef.current = null;
    } catch { setStatus('error'); return; }
    candidateRef.current = null; setCandidate(null);
    changed();
  };
  const markSaved = () => {
    clearTimeout(timer.current); bypass.current = true; dirtyRef.current = false; setDirty(false);
    baseline.current = signature(current());
    try { if (storeRef.current?.getItem(keyRef.current) === rawRef.current) storeRef.current.removeItem(keyRef.current); } catch { /* The server save already succeeded. */ }
    rawRef.current = null; candidateRef.current = null; setCandidate(null); setSubmitError(''); setStatus('idle');
  };
  const leave = action => {
    if (!dirtyRef.current) { action(); return; }
    setLeaveRequest({ action, saved: flush() });
  };
  const stay = () => { setLeaveRequest(null); if (blocker.state === 'blocked') blocker.reset(); };
  const proceed = () => {
    bypass.current = true;
    const request = leaveRequest;
    setLeaveRequest(null);
    if (request?.route && blocker.state === 'blocked') blocker.proceed(); else request?.action?.();
  };
  const failed = message => { flush(); setSubmitError(message || '저장하지 못했습니다. 입력 내용은 유지됩니다. 다시 시도해주세요.'); };
  return { leaveRequest, stay, proceed, onReady, changed, flush, markSaved, leave, failed, restore, keepCurrent, candidate, status, savedAt, dirty, submitError, privateBoard, pending, serverChanged: !!(candidate?.serverVersion && serverVersion && candidate.serverVersion !== serverVersion) };
}
