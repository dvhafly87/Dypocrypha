import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function PostImageViewer({ image, onClose }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const stageRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [failed, setFailed] = useState(false);
  const [size, setSize] = useState({ width: image.width || 1, height: image.height || 1 });
  const [fitWidth, setFitWidth] = useState(1);
  const backgroundDown = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousBody = document.body.style.overflow;
    const previousHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const trapFocus = event => {
      if (event.key !== 'Tab') return;
      const controls = Array.from(dialog.querySelectorAll('button:not(:disabled)'));
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', trapFocus, true);
    dialog.showModal();
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', trapFocus, true);
      dialog.close();
      document.body.style.overflow = previousBody;
      document.documentElement.style.overflow = previousHtml;
      if (image.trigger?.isConnected) image.trigger.focus({ preventScroll: true });
    };
  }, [image]);
  useEffect(() => {
    const measure = () => {
      const stage = stageRef.current;
      if (stage) setFitWidth(Math.max(1, Math.min(size.width, stage.clientWidth - 24, (stage.clientHeight - 24) * size.width / size.height)));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(stageRef.current);
    measure();
    return () => observer.disconnect();
  }, [size]);
  const isBackground = target => target === dialogRef.current || target === stageRef.current;
  return createPortal(
    <dialog ref={dialogRef} className="post-image-viewer" aria-label="이미지 확대 보기"
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClose={onClose}
      onPointerDown={event => { backgroundDown.current = isBackground(event.target) ? { x: event.clientX, y: event.clientY } : null; }}
      onPointerUp={event => {
        const down = backgroundDown.current;
        backgroundDown.current = null;
        if (down && isBackground(event.target) && Math.hypot(event.clientX - down.x, event.clientY - down.y) < 6) onClose();
      }}>
      <div className="post-image-toolbar">
        <div className="post-image-zoom" role="group" aria-label="이미지 배율">
          <button type="button" aria-label="이미지 축소" disabled={failed || zoom === 1} onClick={() => setZoom(value => Math.max(1, value - 0.5))}>−</button>
          <output aria-live="polite">{Math.round(zoom * 100)}%</output>
          <button type="button" aria-label="이미지 확대" disabled={failed || zoom === 3} onClick={() => setZoom(value => Math.min(3, value + 0.5))}>＋</button>
          <button type="button" onClick={() => setZoom(1)}>화면 맞춤</button>
        </div>
        <button type="button" ref={closeRef} aria-label="이미지 보기 닫기" onClick={onClose}>닫기 ×</button>
      </div>
      <div className="post-image-stage" ref={stageRef}>
        {failed ? <p className="post-image-error" role="alert">이미지를 불러올 수 없습니다. 잠시 후 다시 확인해주세요.</p> : <img onError={() => setFailed(true)} src={image.src} alt={image.alt} style={{ width: `${fitWidth * zoom}px` }} onLoad={event => setSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} />}
      </div>
    </dialog>, document.body
  );
}
