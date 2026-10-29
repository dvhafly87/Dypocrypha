import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import '../css/EditorDraft.css';
export default function EditorDraftNotice({ draft }) {
  const time = value => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(value);
  const messages = {
    idle: '변경한 내용은 자동으로 임시 저장됩니다.', saving: '임시 저장 대기 중…',
    saved: `임시 저장 완료${draft.savedAt ? ' · ' + time(draft.savedAt) : ''}`,
    error: '이 브라우저에 임시 저장하지 못했습니다. 페이지를 나가지 말고 내용을 별도로 보관해주세요.',
    conflict: '다른 탭의 임시 글이 변경되어 자동 저장을 멈췄습니다. 이 탭의 입력 내용은 유지됩니다.',
    uploading: '이미지 업로드 중입니다. 업로드가 끝나야 이미지까지 복구할 수 있습니다.'
  };
  return <section className="editor-draft-notice" aria-label="작성 내용 보호">
    {draft.candidate ? <>
      <p role="status">{time(draft.candidate.savedAt)}에 저장한 임시 글이 있습니다. 현재 글에 복구하시겠습니까?</p>
      {draft.serverChanged && <p>임시 저장 이후 원본 글이 변경되었습니다. 복구한 내용을 확인한 뒤 저장해주세요.</p>}
      <div className="editor-draft-actions">
        <button type="button" onClick={draft.restore}>임시 글 복구</button>
        <button type="button" onClick={draft.keepCurrent}>현재 내용으로 계속</button>
      </div>
    </> : <p role={['error', 'conflict'].includes(draft.status) ? 'alert' : 'status'}>{messages[draft.status] || messages.idle}</p>}
    <p className="editor-draft-scope">{draft.privateBoard ? '비공개 글은 현재 탭에만 임시 저장됩니다. 탭을 닫으면 사라집니다.' : '임시 글은 이 브라우저에 저장되며 다른 기기와 동기화되지 않습니다.'}</p>
    <EditorLeaveDialog draft={draft} />
    {draft.submitError && <p className="editor-draft-error" role="alert">{draft.submitError}</p>}
  </section>;
}

function EditorLeaveDialog({ draft }) {
  const ref = useRef(null);
  const stayRef = useRef(null);
  useEffect(() => {
    if (!draft.leaveRequest) return;
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    dialog.showModal(); stayRef.current?.focus();
    return () => { dialog.close(); if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }); };
  }, [draft.leaveRequest]);
  if (!draft.leaveRequest) return null;
  return createPortal(<dialog ref={ref} className="editor-leave-dialog" aria-labelledby="editor-leave-title"
    onCancel={event => { event.preventDefault(); draft.stay(); }}>
    <h2 id="editor-leave-title">저장하지 않은 변경사항이 있습니다</h2>
    <p>{draft.leaveRequest.saved ? '임시 저장본은 유지됩니다. 이 페이지를 나가시겠습니까?' : '최근 변경사항을 임시 저장하지 못했습니다. 나가면 입력 내용을 잃을 수 있습니다.'}</p>
    <div className="editor-leave-actions">
      <button type="button" ref={stayRef} onClick={draft.stay}>계속 작성</button>
      <button type="button" onClick={draft.proceed}>나가기</button>
    </div>
  </dialog>, document.body);
}
