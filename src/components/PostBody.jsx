import React, { useLayoutEffect, useRef, useState } from 'react';

import PostImageViewer from './PostImageViewer.jsx';
import PostOutline from './PostOutline.jsx';
import API from '../config/apiConfig.js';

// Wrap stored editor tables without changing their markup or saved contents.
export default function PostBody({ html }) {
  const bodyRef = useRef(null);
  const [image, setImage] = useState(null);
  const [headings, setHeadings] = useState([]);
  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    body.querySelectorAll('table').forEach((table, index) => {
      if (table.closest('.post-table-scroll')) return;
      const columns = Math.max(1, ...Array.from(table.rows, row =>
        Array.from(row.cells).reduce((sum, cell) => sum + cell.colSpan, 0)));
      const region = document.createElement('div');
      region.className = 'post-table-scroll';
      region.tabIndex = 0;
      region.setAttribute('role', 'region');
      region.setAttribute('aria-label', `본문 표 ${index + 1}`);
      table.style.setProperty('--post-table-min', columns > 2 ? `${columns * 104}px` : '100%');
      table.classList.toggle('post-table-wide', columns > 2);
      table.before(region);
      region.append(table);
    });
    const used = new Set(Array.from(document.querySelectorAll('[id]'), node => node.id));
    const seen = new Set();
    const outline = [];
    body.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((heading, index) => {
      const text = heading.textContent.replace(/\s+/g, ' ').trim();
      if (!text || heading.closest('pre,code,table')) return;
      let id = heading.id;
      if (!id || /\s/.test(id) || seen.has(id) || document.getElementById(id) !== heading) {
        const base = `post-section-${index + 1}`;
        id = base;
        let suffix = 2;
        while (used.has(id)) id = `${base}-${suffix++}`;
        heading.id = id;
      }
      used.add(id); seen.add(id);
      heading.tabIndex = -1;
      heading.dataset.postSection = '';
      outline.push({ id, text, level: Number(heading.tagName.slice(1)) });
    });
    setHeadings(outline);
    const buttons = [];
    body.querySelectorAll('img').forEach((img, index) => {
      // Legacy upload URLs belong to the same blog before its domain migration.
      try {
        const source = new URL(img.getAttribute('src'), window.location.href);
        if (source.hostname === 'dvhafly87.kmgproj.p-e.kr' && source.pathname.startsWith('/uploads/')) {
          img.src = API.API_BASE_URL.replace(/\/$/, '') + source.pathname + source.search;
        }
      } catch { /* Keep unrecognized image URLs unchanged. */ }
      if (img.closest('a')) return;
      let trigger = img.closest('.post-image-trigger');
      if (!trigger) {
        trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'post-image-trigger';
        trigger.setAttribute('aria-label', `${img.alt || `본문 이미지 ${index + 1}`} 확대 보기`);
        img.before(trigger);
        trigger.append(img);
      }
      const open = () => setImage({ src: img.currentSrc || img.src, alt: img.alt || '', width: img.naturalWidth, height: img.naturalHeight, trigger });
      trigger.addEventListener('click', open);
      buttons.push([trigger, open]);
    });
    return () => buttons.forEach(([trigger, open]) => trigger.removeEventListener('click', open));
  }, [html]);
  return <>
    <div className={`post-article-layout${headings.length >= 2 ? ' has-outline' : ''}`}>
      {headings.length >= 2 && <PostOutline headings={headings} bodyRef={bodyRef} />}
      <div ref={bodyRef} className="post-body" dangerouslySetInnerHTML={{ __html: html || '' }} />
    </div>
    {image && <PostImageViewer image={image} onClose={() => setImage(null)} />}
  </>;
}
