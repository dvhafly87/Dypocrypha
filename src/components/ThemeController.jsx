import { useSyncExternalStore } from 'react';
import { getThemeSnapshot, subscribeTheme } from '../util/themeStore.js';

// Keep automatic transitions active even when the mobile settings menu is closed.
export default function ThemeController() {
  useSyncExternalStore(subscribeTheme, getThemeSnapshot);
  return null;
}
