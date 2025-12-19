/**
 * Theme System Examples for PhilJS CSS
 */

import { createTheme, createThemeVariant, createBreakpoints, css } from '../src';

// ===================================
// 1. Complete Theme Definition
// ===================================

export const theme = createTheme({
  colors: {
    // Brand colors
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    primaryLight: '#60a5fa',
    secondary: '#10b981',
    secondaryDark: '#059669',
    secondaryLight: '#34d399',

    // Semantic colors
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',

    // Neutral colors
    white: '#ffffff',
    black: '#000000',
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827',

    // Surface colors
    background: '#ffffff',
    surface: '#f9fafb',
    border: '#e5e7eb',
    text: '#111827',
    textSecondary: '#6b7280'
  },

  spacing: {
    0: '0',
    1: '0.25rem',    // 4px
    2: '0.5rem',     // 8px
    3: '0.75rem',    // 12px
    4: '1rem',       // 16px
    5: '1.25rem',    // 20px
    6: '1.5rem',     // 24px
    7: '1.75rem',    // 28px
    8: '2rem',       // 32px
    10: '2.5rem',    // 40px
    12: '3rem',      // 48px
    16: '4rem',      // 64px
    20: '5rem',      // 80px
    24: '6rem',      // 96px
    32: '8rem',      // 128px
    40: '10rem',     // 160px
    48: '12rem',     // 192px
    56: '14rem',     // 224px
    64: '16rem'      // 256px
  },

  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
    '7xl': '4.5rem',    // 72px
    '8xl': '6rem',      // 96px
    '9xl': '8rem'       // 128px
  },

  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
    mono: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
  },

  fontWeight: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900
  },

  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em'
  },

  borderRadius: {
    none: '0',
    sm: '0.125rem',     // 2px
    base: '0.25rem',    // 4px
    md: '0.375rem',     // 6px
    lg: '0.5rem',       // 8px
    xl: '0.75rem',      // 12px
    '2xl': '1rem',      // 16px
    '3xl': '1.5rem',    // 24px
    full: '9999px'
  },

  borderWidth: {
    0: '0',
    1: '1px',
    2: '2px',
    4: '4px',
    8: '8px'
  },

  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)'
  },

  zIndex: {
    0: 0,
    10: 10,
    20: 20,
    30: 30,
    40: 40,
    50: 50,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    overlay: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },

  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slower: '500ms cubic-bezier(0.4, 0, 0.2, 1)'
  }
});

// ===================================
// 2. Dark Theme Variant
// ===================================

export const darkTheme = createThemeVariant(theme, 'dark', {
  colors: {
    // Invert background/foreground
    background: '#111827',
    surface: '#1f2937',
    border: '#374151',
    text: '#f9fafb',
    textSecondary: '#9ca3af',

    // Adjust brand colors for dark mode
    primary: '#60a5fa',
    primaryDark: '#3b82f6',
    primaryLight: '#93c5fd',
    secondary: '#34d399',
    secondaryDark: '#10b981',
    secondaryLight: '#6ee7b7'
  }
});

// ===================================
// 3. Responsive Breakpoints
// ===================================

export const breakpoints = createBreakpoints(theme.breakpoints);

// ===================================
// 4. Using Theme in Styles
// ===================================

export const themedButton = css({
  padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
  backgroundColor: theme.colors.primary,
  color: theme.colors.white,
  fontSize: theme.fontSize.base,
  fontWeight: theme.fontWeight.medium,
  fontFamily: theme.fontFamily.sans,
  borderRadius: theme.borderRadius.md,
  border: 'none',
  cursor: 'pointer',
  transition: `all ${theme.transitions.base}`,
  boxShadow: theme.shadows.sm,

  '&:hover': {
    backgroundColor: theme.colors.primaryDark,
    boxShadow: theme.shadows.md,
    transform: 'translateY(-1px)'
  },

  '&:active': {
    transform: 'translateY(0)',
    boxShadow: theme.shadows.sm
  },

  '&:disabled': {
    backgroundColor: theme.colors.gray300,
    cursor: 'not-allowed',
    opacity: 0.6
  }
});

export const themedCard = css({
  backgroundColor: theme.colors.surface,
  borderRadius: theme.borderRadius.lg,
  padding: theme.spacing[6],
  boxShadow: theme.shadows.base,
  border: `${theme.borderWidth[1]} solid ${theme.colors.border}`,

  '&:hover': {
    boxShadow: theme.shadows.lg,
    transform: 'translateY(-2px)',
    transition: `all ${theme.transitions.base}`
  }
});

export const themedInput = css({
  width: '100%',
  padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
  fontSize: theme.fontSize.base,
  fontFamily: theme.fontFamily.sans,
  color: theme.colors.text,
  backgroundColor: theme.colors.white,
  border: `${theme.borderWidth[1]} solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.md,
  outline: 'none',
  transition: `all ${theme.transitions.fast}`,

  '&:focus': {
    borderColor: theme.colors.primary,
    boxShadow: `0 0 0 3px ${theme.colors.primary}20`
  },

  '&::placeholder': {
    color: theme.colors.gray400
  }
});

// ===================================
// 5. Responsive Components
// ===================================

export const responsiveContainer = css({
  width: '100%',
  padding: theme.spacing[4],

  [breakpoints.sm]: {
    padding: theme.spacing[6]
  },

  [breakpoints.md]: {
    maxWidth: theme.breakpoints.md,
    margin: '0 auto',
    padding: theme.spacing[8]
  },

  [breakpoints.lg]: {
    maxWidth: theme.breakpoints.lg,
    padding: theme.spacing[12]
  },

  [breakpoints.xl]: {
    maxWidth: theme.breakpoints.xl
  }
});

export const responsiveGrid = css({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: theme.spacing[4],

  [breakpoints.sm]: {
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: theme.spacing[6]
  },

  [breakpoints.md]: {
    gridTemplateColumns: 'repeat(3, 1fr)'
  },

  [breakpoints.lg]: {
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: theme.spacing[8]
  }
});

// ===================================
// 6. Typography Scale
// ===================================

export const typography = {
  h1: css({
    fontSize: theme.fontSize['4xl'],
    fontWeight: theme.fontWeight.bold,
    lineHeight: theme.lineHeight.tight,
    letterSpacing: theme.letterSpacing.tight,
    color: theme.colors.text,
    marginBottom: theme.spacing[6],

    [breakpoints.md]: {
      fontSize: theme.fontSize['5xl']
    },

    [breakpoints.lg]: {
      fontSize: theme.fontSize['6xl']
    }
  }),

  h2: css({
    fontSize: theme.fontSize['3xl'],
    fontWeight: theme.fontWeight.semibold,
    lineHeight: theme.lineHeight.tight,
    color: theme.colors.text,
    marginBottom: theme.spacing[5],

    [breakpoints.md]: {
      fontSize: theme.fontSize['4xl']
    }
  }),

  h3: css({
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.semibold,
    lineHeight: theme.lineHeight.snug,
    color: theme.colors.text,
    marginBottom: theme.spacing[4]
  }),

  body: css({
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.normal,
    lineHeight: theme.lineHeight.relaxed,
    color: theme.colors.text
  }),

  small: css({
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.normal,
    color: theme.colors.textSecondary
  }),

  code: css({
    fontFamily: theme.fontFamily.mono,
    fontSize: theme.fontSize.sm,
    backgroundColor: theme.colors.gray100,
    padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
    borderRadius: theme.borderRadius.sm,
    color: theme.colors.danger
  })
};

// ===================================
// 7. Semantic Components
// ===================================

export const alert = {
  success: css({
    padding: theme.spacing[4],
    backgroundColor: '#d1fae5',
    borderLeft: `${theme.borderWidth[4]} solid ${theme.colors.success}`,
    borderRadius: theme.borderRadius.md,
    color: '#065f46'
  }),

  warning: css({
    padding: theme.spacing[4],
    backgroundColor: '#fef3c7',
    borderLeft: `${theme.borderWidth[4]} solid ${theme.colors.warning}`,
    borderRadius: theme.borderRadius.md,
    color: '#92400e'
  }),

  danger: css({
    padding: theme.spacing[4],
    backgroundColor: '#fee2e2',
    borderLeft: `${theme.borderWidth[4]} solid ${theme.colors.danger}`,
    borderRadius: theme.borderRadius.md,
    color: '#991b1b'
  }),

  info: css({
    padding: theme.spacing[4],
    backgroundColor: '#dbeafe',
    borderLeft: `${theme.borderWidth[4]} solid ${theme.colors.info}`,
    borderRadius: theme.borderRadius.md,
    color: '#1e40af'
  })
};
