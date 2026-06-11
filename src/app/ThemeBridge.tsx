import { useEffect } from 'react';
import { useSettings } from '@/store/settingsStore';
import { useProfile } from '@/store/profileStore';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { getCosmetic } from '@/data/cosmetics';

/**
 * Applies settings + equipped cosmetics to the root <html> element via
 * data attributes and CSS variables. Mounted once at app root.
 */
export function ThemeBridge() {
  const colourblind = useSettings((s) => s.colourblind);
  const fontScale = useSettings((s) => s.fontScale);
  const reduce = useReducedMotion();
  const equippedTheme = useProfile((s) => s.equipped.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-colourblind', colourblind);
    root.setAttribute('data-reduced-motion', String(reduce));
    root.style.setProperty('--font-scale', String(fontScale));
  }, [colourblind, fontScale, reduce]);

  useEffect(() => {
    const root = document.documentElement;
    const theme = equippedTheme ? getCosmetic(equippedTheme) : null;
    if (theme?.themeTokens) {
      if (theme.themeTokens.accent) root.style.setProperty('--accent', theme.themeTokens.accent);
      if (theme.themeTokens.bgFrom) root.style.setProperty('--bg-stadium-from', theme.themeTokens.bgFrom);
      if (theme.themeTokens.bgTo) root.style.setProperty('--bg-stadium-to', theme.themeTokens.bgTo);
    } else {
      root.style.removeProperty('--accent');
      root.style.removeProperty('--bg-stadium-from');
      root.style.removeProperty('--bg-stadium-to');
    }
  }, [equippedTheme]);

  return null;
}
