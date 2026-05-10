export const colors = {
  coral: {
    DEFAULT: 'var(--coral)',
    hover: 'var(--coral-hover)',
    glow: 'var(--coral-glow)',
    subtle: 'var(--coral-subtle)',
  },
  olive: {
    DEFAULT: 'var(--olive)',
    dark: 'var(--olive-dark)',
    subtle: 'var(--olive-subtle)',
  },
  bg: {
    primary: 'var(--bg-primary)',
    secondary: 'var(--bg-secondary)',
    card: 'var(--bg-card)',
    elevated: 'var(--bg-elevated)',
  },
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    muted: 'var(--text-muted)',
  },
  border: {
    DEFAULT: 'var(--border)',
    hover: 'var(--border-hover)',
  },
} as const;

export const radius = {
  sm: '8px',
  md: '14px',
  lg: '20px',
  xl: '28px',
} as const;

export const fonts = {
  sans: 'var(--font-outfit)',
  mono: 'var(--font-space-mono)',
} as const;

export const shadows = {
  card: 'var(--shadow-card)',
  elevated: 'var(--shadow-elevated)',
} as const;

export const transitions = {
  DEFAULT: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
} as const;
