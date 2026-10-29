export const THEME_KEY = 'dypocrypha-theme';
export const THEME_MODES = ['auto', 'light', 'dark'];
const HOUR = 60 * 60 * 1000;
const KST_OFFSET = 9 * HOUR;

export function normalizeThemeMode(value) {
  return THEME_MODES.includes(value) ? value : 'auto';
}

export function resolveTheme(mode, now = Date.now()) {
  if (mode === 'light' || mode === 'dark') return mode;
  const hour = new Date(now + KST_OFFSET).getUTCHours();
  return hour >= 6 && hour < 18 ? 'light' : 'dark';
}

export function nextThemeBoundary(now = Date.now()) {
  const local = new Date(now + KST_OFFSET);
  const day = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  const hour = local.getUTCHours();
  return day + (hour < 6 ? 6 : hour < 18 ? 18 : 30) * HOUR - KST_OFFSET;
}
