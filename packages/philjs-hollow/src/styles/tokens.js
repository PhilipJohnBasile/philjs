/**
 * Hollow Design Tokens
 * CSS custom properties for theming
 */
/**
 * Color tokens
 */
export const colors = {
    primary: '#3b82f6',
    primaryForeground: '#ffffff',
    secondary: '#f1f5f9',
    secondaryForeground: '#0f172a',
    success: '#22c55e',
    successForeground: '#ffffff',
    warning: '#f59e0b',
    warningForeground: '#ffffff',
    error: '#ef4444',
    errorForeground: '#ffffff',
    info: '#3b82f6',
    infoForeground: '#ffffff',
    text: '#0f172a',
    textMuted: '#64748b',
    textInverse: '#ffffff',
    background: '#ffffff',
    backgroundMuted: '#f8fafc',
    border: '#e2e8f0',
    borderFocus: '#3b82f6',
    ring: '#3b82f680',
    shadow: 'rgba(0, 0, 0, 0.1)',
};
/**
 * Typography tokens
 */
export const typography = {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontFamilyMono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
    fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        md: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
    },
    fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },
    lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75',
    },
};
/**
 * Spacing tokens
 */
export const spacing = {
    0: '0',
    px: '1px',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
};
/**
 * Border radius tokens
 */
export const borderRadius = {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
};
/**
 * Shadow tokens
 */
export const shadows = {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};
/**
 * Transition tokens
 */
export const transitions = {
    fast: '100ms',
    normal: '200ms',
    slow: '300ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
};
/**
 * Z-index tokens
 */
export const zIndex = {
    dropdown: '1000',
    sticky: '1020',
    fixed: '1030',
    overlay: '1040',
    modal: '1050',
    popover: '1060',
    tooltip: '1070',
};
/**
 * All tokens combined
 */
export const tokens = {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
    transitions,
    zIndex,
};
/**
 * CSS custom properties string for injection
 */
export const designTokensCSS = `
  :host {
    /* Colors */
    --hollow-color-primary: ${colors.primary};
    --hollow-color-primary-foreground: ${colors.primaryForeground};
    --hollow-color-secondary: ${colors.secondary};
    --hollow-color-secondary-foreground: ${colors.secondaryForeground};
    --hollow-color-success: ${colors.success};
    --hollow-color-success-foreground: ${colors.successForeground};
    --hollow-color-warning: ${colors.warning};
    --hollow-color-warning-foreground: ${colors.warningForeground};
    --hollow-color-error: ${colors.error};
    --hollow-color-error-foreground: ${colors.errorForeground};
    --hollow-color-info: ${colors.info};
    --hollow-color-info-foreground: ${colors.infoForeground};
    --hollow-color-text: ${colors.text};
    --hollow-color-text-muted: ${colors.textMuted};
    --hollow-color-text-inverse: ${colors.textInverse};
    --hollow-color-background: ${colors.background};
    --hollow-color-background-muted: ${colors.backgroundMuted};
    --hollow-color-border: ${colors.border};
    --hollow-color-border-focus: ${colors.borderFocus};
    --hollow-color-ring: ${colors.ring};
    --hollow-color-shadow: ${colors.shadow};

    /* Typography */
    --hollow-font-family: ${typography.fontFamily};
    --hollow-font-family-mono: ${typography.fontFamilyMono};
    --hollow-font-size-xs: ${typography.fontSize.xs};
    --hollow-font-size-sm: ${typography.fontSize.sm};
    --hollow-font-size-md: ${typography.fontSize.md};
    --hollow-font-size-lg: ${typography.fontSize.lg};
    --hollow-font-size-xl: ${typography.fontSize.xl};
    --hollow-font-size-2xl: ${typography.fontSize['2xl']};
    --hollow-font-size-3xl: ${typography.fontSize['3xl']};
    --hollow-font-size-4xl: ${typography.fontSize['4xl']};
    --hollow-font-weight-normal: ${typography.fontWeight.normal};
    --hollow-font-weight-medium: ${typography.fontWeight.medium};
    --hollow-font-weight-semibold: ${typography.fontWeight.semibold};
    --hollow-font-weight-bold: ${typography.fontWeight.bold};
    --hollow-line-height-tight: ${typography.lineHeight.tight};
    --hollow-line-height-normal: ${typography.lineHeight.normal};
    --hollow-line-height-relaxed: ${typography.lineHeight.relaxed};

    /* Spacing */
    --hollow-spacing-0: ${spacing[0]};
    --hollow-spacing-1: ${spacing[1]};
    --hollow-spacing-2: ${spacing[2]};
    --hollow-spacing-3: ${spacing[3]};
    --hollow-spacing-4: ${spacing[4]};
    --hollow-spacing-5: ${spacing[5]};
    --hollow-spacing-6: ${spacing[6]};
    --hollow-spacing-8: ${spacing[8]};
    --hollow-spacing-10: ${spacing[10]};
    --hollow-spacing-12: ${spacing[12]};
    --hollow-spacing-16: ${spacing[16]};

    /* Border Radius */
    --hollow-radius-none: ${borderRadius.none};
    --hollow-radius-sm: ${borderRadius.sm};
    --hollow-radius-md: ${borderRadius.md};
    --hollow-radius-lg: ${borderRadius.lg};
    --hollow-radius-xl: ${borderRadius.xl};
    --hollow-radius-2xl: ${borderRadius['2xl']};
    --hollow-radius-full: ${borderRadius.full};

    /* Shadows */
    --hollow-shadow-sm: ${shadows.sm};
    --hollow-shadow-md: ${shadows.md};
    --hollow-shadow-lg: ${shadows.lg};
    --hollow-shadow-xl: ${shadows.xl};

    /* Transitions */
    --hollow-transition-fast: ${transitions.fast};
    --hollow-transition-normal: ${transitions.normal};
    --hollow-transition-slow: ${transitions.slow};
    --hollow-transition-easing: ${transitions.easing};

    /* Z-Index */
    --hollow-z-dropdown: ${zIndex.dropdown};
    --hollow-z-sticky: ${zIndex.sticky};
    --hollow-z-fixed: ${zIndex.fixed};
    --hollow-z-overlay: ${zIndex.overlay};
    --hollow-z-modal: ${zIndex.modal};
    --hollow-z-popover: ${zIndex.popover};
    --hollow-z-tooltip: ${zIndex.tooltip};

    /* Base styles */
    font-family: var(--hollow-font-family);
    color: var(--hollow-color-text);
    line-height: var(--hollow-line-height-normal);
  }

  /* Reset for slotted content */
  ::slotted(*) {
    font-family: inherit;
  }
`;
/**
 * Create a theme with custom token overrides
 */
export function createTheme(overrides) {
    const merged = {
        colors: { ...colors, ...overrides.colors },
        typography: { ...typography, ...overrides.typography },
        spacing: { ...spacing, ...overrides.spacing },
        borderRadius: { ...borderRadius, ...overrides.borderRadius },
        shadows: { ...shadows, ...overrides.shadows },
        transitions: { ...transitions, ...overrides.transitions },
        zIndex: { ...zIndex, ...overrides.zIndex },
    };
    // Generate CSS custom properties
    let css = ':host {\n';
    for (const [key, value] of Object.entries(merged.colors)) {
        css += `  --hollow-color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};\n`;
    }
    css += '}\n';
    return css;
}
//# sourceMappingURL=tokens.js.map