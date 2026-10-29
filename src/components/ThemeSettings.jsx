import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Settings, Sun, Moon, Clock, Check, ArrowUp, X } from 'lucide-react';
import { getThemeSnapshot, subscribeTheme, setThemeMode } from '../util/themeStore.js';

const choices = [
  { value: 'auto', label: '자동', detail: '오전 6시 라이트 · 오후 6시 다크', icon: Clock },
  { value: 'light', label: '라이트', detail: '밝은 화면으로 유지', icon: Sun },
  { value: 'dark', label: '다크', detail: '어두운 화면으로 유지', icon: Moon },
];

export default function ThemeSettings({ placement = 'floating', onCloseSidebar }) {
  const { mode, theme } = useSyncExternalStore(subscribeTheme, getThemeSnapshot);
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  const options = useRef([]);

  useEffect(() => {
    if (!open) return;
    options.current[choices.findIndex(choice => choice.value === mode)]?.focus();
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
    };
    // Focus the current choice when opening, without moving focus on each selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleKeys(event) {
    if (event.key === 'Escape') {
      event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus();
    }
    if (open && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const buttons = options.current.filter(Boolean);
      const index = buttons.indexOf(document.activeElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 :
        (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next]?.focus();
    }
  }

  return (
    <div className={`theme-settings theme-settings--${placement}`} ref={root} onKeyDown={handleKeys}>
      {open && (
        <section id="theme-settings-panel" className="theme-settings-panel" aria-label="화면 설정">
          <div className="theme-settings-heading"><span>화면 테마</span><span className="theme-current">{theme === 'dark' ? '다크' : '라이트'}</span></div>
          <div className="theme-settings-choices" role="group" aria-label="테마 선택">
            {choices.map((choice, index) => {
              const { value, label, detail } = choice;
              const Icon = choice.icon;
              return (
              <button key={value} type="button" aria-pressed={mode === value}
                ref={node => { options.current[index] = node; }} onClick={() => setThemeMode(value)}>
                <Icon size={18} aria-hidden="true" />
                <span><strong>{label}</strong><small>{detail}</small></span>
                {mode === value && <Check size={18} className="theme-choice-check" aria-hidden="true" />}
              </button>
            ); })}
          </div>
          <div className="theme-settings-actions">
            <button type="button" ref={node => { options.current[3] = node; }} onClick={() => {
              window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
              document.querySelector('.main-home-container')?.scrollTo({ top: 0 });
              setOpen(false); if (onCloseSidebar) onCloseSidebar(); else trigger.current?.focus();
            }}><ArrowUp size={18} aria-hidden="true" />맨 위로</button>
            <button type="button" ref={node => { options.current[4] = node; }} onClick={() => {
              setOpen(false); if (onCloseSidebar) onCloseSidebar(); else trigger.current?.focus();
            }}><X size={18} aria-hidden="true" />{onCloseSidebar ? '메뉴 닫기' : '설정 닫기'}</button>
          </div>
          <p className="theme-settings-note">자동 전환은 한국 시간 기준입니다.</p>
        </section>
      )}
      <button ref={trigger} className="theme-settings-trigger" type="button" aria-label="화면 설정"
        aria-expanded={open} aria-controls={open ? 'theme-settings-panel' : undefined} onClick={() => setOpen(value => !value)}>
        <Settings size={23} aria-hidden="true" />
      </button>
    </div>
  );
}
