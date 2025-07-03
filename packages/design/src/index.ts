// Design tokens and utilities
export const designTokens = {
  colors: {
    primary: 'hsl(221.2 83.2% 53.3%)',
    secondary: 'hsl(210 40% 96%)',
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(222.2 84% 4.9%)',
    muted: 'hsl(210 40% 96%)',
    accent: 'hsl(210 40% 96%)',
    destructive: 'hsl(0 84.2% 60.2%)',
    success: 'hsl(142.1 76.2% 36.3%)',
    warning: 'hsl(47.9 95.8% 53.1%)',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  borderRadius: {
    sm: 'calc(var(--radius) - 4px)',
    md: 'calc(var(--radius) - 2px)',
    lg: 'var(--radius)',
  },
  shadows: {
    soft: '0 2px 8px 0 rgba(0, 0, 0, 0.12)',
    medium: '0 4px 12px 0 rgba(0, 0, 0, 0.15)',
    hard: '0 8px 24px 0 rgba(0, 0, 0, 0.15)',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
} as const;

// Theme types and definitions
export type Theme = 'light' | 'dark' | 'high-contrast';

export const themeMetadata = {
  light: {
    name: 'Light Mode',
    description: 'Warm off-white background with rich colors',
    icon: '☀️'
  },
  'dark': {
    name: 'Dark Mode',
    description: 'Modern dark theme optimized for Linux environments',
    icon: '🌙'
  },
  'high-contrast': {
    name: 'High Contrast',
    description: 'Maximum readability with green on black styling',
    icon: '💻'
  }
} as const;

// Theme utilities
export function setTheme(theme: Theme) {
  if (typeof document !== 'undefined') {
    // Remove all theme classes (including legacy ones)
    document.documentElement.classList.remove('light', 'dark', 'high-contrast', 'github-dark', 'terminal');
    // Add the new theme class
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }
}

export function getTheme(): Theme {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark' || stored === 'high-contrast') {
      return stored;
    }
    // Handle legacy theme names for backward compatibility
    if (stored === 'github-dark') {
      return 'dark';
    }
    if (stored === 'terminal') {
      return 'high-contrast';
    }
    // Default to light mode
    return 'light';
  }
  return 'light';
}

export function cycleTheme() {
  const themes: Theme[] = ['light', 'dark', 'high-contrast'];
  const current = getTheme();
  const currentIndex = themes.indexOf(current);
  const nextIndex = (currentIndex + 1) % themes.length;
  setTheme(themes[nextIndex]);
}

export function getAllThemes(): Array<{ key: Theme; meta: typeof themeMetadata[Theme] }> {
  return Object.entries(themeMetadata).map(([key, meta]) => ({ 
    key: key as Theme, 
    meta 
  }));
} 