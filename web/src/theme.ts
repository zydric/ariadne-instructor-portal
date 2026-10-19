export type Theme = 'light' | 'dark';
export type ColorPalette = 'strict' | 'semantic';

const THEME_STORAGE_KEY = 'ariadne-theme';
const PALETTE_STORAGE_KEY = 'ariadne-palette';

export function getPreferredTheme(): Theme {
  const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  // Default to light, or follow system preference if user hasn't chosen
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function getCurrentTheme(): Theme {
  return (document.documentElement.getAttribute('data-theme') as Theme) || 'light';
}

export function toggleTheme(): Theme {
  const current = getCurrentTheme();
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

export function getPreferredPalette(): ColorPalette {
  const saved = localStorage.getItem(PALETTE_STORAGE_KEY) as ColorPalette | null;
  if (saved === 'strict' || saved === 'semantic') {
    return saved;
  }
  return 'semantic';
}

export function applyPalette(palette: ColorPalette): void {
  document.documentElement.setAttribute('data-palette', palette);
  localStorage.setItem(PALETTE_STORAGE_KEY, palette);
}

export function getCurrentPalette(): ColorPalette {
  return (document.documentElement.getAttribute('data-palette') as ColorPalette) || 'semantic';
}

export function togglePalette(): ColorPalette {
  const current = getCurrentPalette();
  const next: ColorPalette = current === 'strict' ? 'semantic' : 'strict';
  applyPalette(next);
  return next;
}

export function initTheme(): void {
  const theme = getPreferredTheme();
  applyTheme(theme);
  const palette = getPreferredPalette();
  applyPalette(palette);
}
