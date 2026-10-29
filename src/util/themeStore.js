import { THEME_KEY, normalizeThemeMode, resolveTheme, nextThemeBoundary } from './theme.js';
const listeners = new Set();
function readPreference() {
  try { return normalizeThemeMode(window.localStorage.getItem(THEME_KEY)); }
  catch { return 'auto'; }
}
let mode = readPreference();
let snapshot = { mode, theme: resolveTheme(mode) };
let boundaryTimer;
let clockTimer;

function applyTheme() {
  const theme = resolveTheme(mode);
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themeMode = mode;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#101814' : '#fafafa';
  if (snapshot.mode !== mode || snapshot.theme !== theme) {
    snapshot = { mode, theme };
    listeners.forEach(listener => listener());
  }
}
function schedule() {
  clearTimeout(boundaryTimer);
  if (mode === 'auto') {
    boundaryTimer = setTimeout(() => { applyTheme(); schedule(); }, Math.max(1, nextThemeBoundary() - Date.now()));
  }
}
function refresh() { applyTheme(); schedule(); }
function onStorage(event) {
  if (event.key === THEME_KEY || event.key === null) { mode = readPreference(); refresh(); }
}
export function setThemeMode(value) {
  mode = normalizeThemeMode(value);
  try { window.localStorage.setItem(THEME_KEY, mode); } catch { /* Keep the choice for this session. */ }
  refresh();
}
export function getThemeSnapshot() { return snapshot; }
export function subscribeTheme(listener) {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    clockTimer = setInterval(refresh, 60000);
    refresh();
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      clearTimeout(boundaryTimer); clearInterval(clockTimer);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    }
  };
}
applyTheme();
