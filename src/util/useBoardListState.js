import { useEffect, useRef, useState } from 'react';

function read(key) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(key));
    if (saved?.restore && Date.now() - saved.time < 2 * 60 * 60 * 1000) return saved;
  } catch { /* Storage may be disabled. */ }
  return { page: 1, query: '', y: 0, restore: false };
}
export function useBoardListState(boardId, kind) {
  const key = `board-list:${kind}:${boardId}`;
  const initial = useRef(read(key));
  const [currentPage, setCurrentPage] = useState(() => Math.max(1, Number(initial.current.page) || 1));
  const [postSearchQuery, setQuery] = useState(() => String(initial.current.query || ''));
  const [loaded, setLoaded] = useState(false);
  const pending = useRef(initial.current.restore);
  useEffect(() => {
    if (!loaded || !pending.current) return;
    pending.current = false;
    let second;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        window.scrollTo({ top: Math.max(0, Number(initial.current.y) || 0), behavior: 'instant' });
        try { sessionStorage.removeItem(key); } catch { /* Optional persistence. */ }
      });
    });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [loaded, key]);
  const rememberList = () => {
    try { sessionStorage.setItem(key, JSON.stringify({ page: currentPage, query: postSearchQuery, y: window.scrollY, time: Date.now(), restore: true })); } catch { /* Navigation must still work. */ }
  };
  const setPostSearchQuery = value => { setQuery(value); setCurrentPage(1); };
  return { currentPage, setCurrentPage, postSearchQuery, setPostSearchQuery, loaded, setLoaded, rememberList };
}
