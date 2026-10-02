import { useEffect } from 'react';
import { useAppSelector } from '@/redux/hooks';
import { applyTheme, getStoredTheme, type ThemeMode } from '@/lib/theme';

/**
 * Keeps the document in sync with the theme stored in Redux.
 * The initial mode is already applied by the anti-FOUC script in index.html;
 * this hook re-applies it on mount (without persisting) and, when the user has
 * not made an explicit choice, follows later system preference changes.
 */
export function useThemeInit() {
  const mode = useAppSelector((state) => state.theme.mode);

  useEffect(() => {
    applyTheme(mode, false);
  }, [mode]);

  useEffect(() => {
    if (!window.matchMedia) return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      // Only auto-follow the system while the user has no saved preference.
      if (getStoredTheme()) return;
      applyTheme(event.matches ? 'dark' : 'light', false);
    };

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  return mode as ThemeMode;
}

export default useThemeInit;
