import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function headerOffset() {
  return Math.ceil(Math.max(0, ...Array.from(document.querySelectorAll('.main-header,.sub-nav'), node => {
    const rect = node.getBoundingClientRect();
    return rect.height && ['fixed', 'sticky'].includes(getComputedStyle(node).position) ? rect.bottom : 0;
  })) + 16);
}
export default function PostOutline({ headings, bodyRef }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 1200px)').matches);
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState(headings[0]?.id);
  const [offset, setOffset] = useState(headerOffset);
  const frameRef = useRef(0);
  const navRef = useRef(null);
  const levels = [...new Set(headings.map(heading => heading.level))].sort((a, b) => a - b);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1200px)');
    const change = () => { setDesktop(media.matches); setExpanded(false); };
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    const measure = () => {
      frameRef.current = 0;
      const top = headerOffset();
      setOffset(top);
      let current = headings[0]?.id;
      headings.forEach(heading => {
        const node = document.getElementById(heading.id);
        if (!node) return;
        node.style.scrollMarginTop = `${top}px`;
        if (node.getBoundingClientRect().top <= top + 8) current = heading.id;
      });
      setActive(current);
    };
    const schedule = () => { if (!frameRef.current) frameRef.current = requestAnimationFrame(measure); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const observer = new ResizeObserver(schedule);
    if (bodyRef.current) observer.observe(bodyRef.current);
    measure();
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer.disconnect();
    };
  }, [headings, bodyRef]);
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || (!desktop && !expanded)) return;
    const link = Array.from(nav.querySelectorAll('a')).find(node => node.getAttribute('aria-current') === 'location');
    if (!link) return;
    const rect = link.getBoundingClientRect(), bounds = nav.getBoundingClientRect();
    if (rect.top < bounds.top) nav.scrollTop += rect.top - bounds.top - 4;
    else if (rect.bottom > bounds.bottom) nav.scrollTop += rect.bottom - bounds.bottom + 4;
  }, [active, desktop, expanded]);
  const jump = id => {
    const node = document.getElementById(id);
    if (!node || !bodyRef.current?.contains(node)) return;
    node.style.scrollMarginTop = `${headerOffset()}px`;
    node.scrollIntoView({ block: 'start', behavior: 'instant' });
    node.focus({ preventScroll: true });
    setActive(id);
  };
  useEffect(() => {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    if (!headings.some(heading => heading.id === id)) return;
    let second;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => jump(id)); });
    // Late images can shift a deep link; stop following once the reader interacts.
    let follow = true;
    const stop = () => { follow = false; };
    const settle = () => { if (follow) jump(id); };
    const images = Array.from(bodyRef.current?.querySelectorAll('img') || []).filter(image => !image.complete);
    images.forEach(image => { image.addEventListener('load', settle); image.addEventListener('error', settle); });
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
    window.addEventListener('keydown', stop);
    return () => {
      cancelAnimationFrame(first); cancelAnimationFrame(second);
      images.forEach(image => { image.removeEventListener('load', settle); image.removeEventListener('error', settle); });
      window.removeEventListener('wheel', stop); window.removeEventListener('touchstart', stop); window.removeEventListener('keydown', stop);
    };
  }, [headings, location.hash]);
  return <aside className="post-outline" style={{ top: `${offset}px` }}>
    <details open={desktop || expanded} onToggle={event => { if (!desktop) setExpanded(event.currentTarget.open); }}>
      <summary>목차 <span>{headings.length}개 항목</span></summary>
      <div className="post-outline-desktop-title" aria-hidden="true">이 글의 목차 <span>{headings.length}</span></div>
      <nav ref={navRef} aria-label="글 목차">
        <ol>{headings.map(heading => <li key={heading.id} style={{ '--outline-depth': Math.min(2, levels.indexOf(heading.level)) }}>
          <a href={`#${encodeURIComponent(heading.id)}`} aria-current={active === heading.id ? 'location' : undefined}
            onClick={event => {
              if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
              event.preventDefault();
              setExpanded(false);
              const hash = `#${encodeURIComponent(heading.id)}`;
              if (location.hash !== hash) navigate(location.pathname + location.search + hash, { replace: true });
              else requestAnimationFrame(() => jump(heading.id));
            }}>{heading.text}</a>
        </li>)}</ol>
      </nav>
    </details>
  </aside>;
}
