/**
 * Theme utilities.
 * ---------------------------------------------------------------------------
 * The theme is stored as a class on <html> (`.dark`) and persisted in
 * localStorage under THEME_STORAGE_KEY. The same key is read by the inline
 * anti-FOUC script in index.html, so keep them in sync.
 */

export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

const THEME_COLORS: Record<ThemeMode, string> = {
  light: '#f1f1f1',
  dark: '#1f202a',
};

/** Read the persisted theme, if any. */
export function getStoredTheme(): ThemeMode | null {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(THEME_STORAGE_KEY);
  return value === 'light' || value === 'dark' ? value : null;
}

/** Determine the preferred theme: stored choice, else the system preference. */
export function getPreferredTheme(): ThemeMode {
  const stored = getStoredTheme();
  if (stored) return stored;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
}

/** Apply a theme to the document and persist it. */
export function applyTheme(mode: ThemeMode, persist = true): void {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', mode === 'dark');
  root.style.colorScheme = mode;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLORS[mode]);
  if (persist) localStorage.setItem(THEME_STORAGE_KEY, mode);
}
