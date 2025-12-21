import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  createTheme,
  useTheme,
  setTheme,
  subscribeToTheme,
  ThemeProvider,
  createStyled,
} from './css-in-js';
import { clearAllStyles, getInjectedStyles } from './utils';
import type { Theme, ThemeConfig } from './types';

describe('createTheme()', () => {
  it('creates a theme from config', () => {
    const theme = createTheme({
      themes: {
        light: {
          colors: {
            primary: '#3b82f6',
            secondary: '#6366f1',
          },
        },
      },
      defaultTheme: 'light',
    });

    expect(theme.colors.primary).toBe('#3b82f6');
    expect(theme.colors.secondary).toBe('#6366f1');
  });

  it('merges with default theme values', () => {
    const theme = createTheme({
      themes: {
        light: {
          colors: {
            primary: '#custom',
          },
        },
      },
    });

    // Should have custom value
    expect(theme.colors.primary).toBe('#custom');
    // Should still have default values for others
    expect(theme.colors.background).toBeTruthy();
    expect(theme.spacing).toBeTruthy();
  });

  it('includes all theme sections', () => {
    const theme = createTheme({});

    expect(theme.colors).toBeDefined();
    expect(theme.spacing).toBeDefined();
    expect(theme.fontSize).toBeDefined();
    expect(theme.fontWeight).toBeDefined();
    expect(theme.borderRadius).toBeDefined();
    expect(theme.shadows).toBeDefined();
    expect(theme.breakpoints).toBeDefined();
    expect(theme.transitions).toBeDefined();
    expect(theme.zIndex).toBeDefined();
  });

  it('preserves custom theme values', () => {
    const theme = createTheme({
      themes: {
        light: {
          colors: {
            primary: '#ff0000',
            secondary: '#00ff00',
            accent: '#0000ff',
          },
          spacing: {
            xs: '4px',
            sm: '8px',
          },
        },
      },
      defaultTheme: 'light',
    });

    expect(theme.colors.primary).toBe('#ff0000');
    expect(theme.colors.secondary).toBe('#00ff00');
    expect(theme.colors.accent).toBe('#0000ff');
    expect(theme.spacing.xs).toBe('4px');
    expect(theme.spacing.sm).toBe('8px');
  });

  it('handles empty themes config', () => {
    const theme = createTheme({
      themes: {},
    });

    // Should fall back to defaults
    expect(theme.colors.primary).toBeTruthy();
    expect(theme.spacing.md).toBeTruthy();
  });

  it('uses light theme as fallback when specified theme not found', () => {
    const theme = createTheme({
      themes: {
        light: {
          colors: {
            primary: '#light-primary',
          },
        },
      },
      defaultTheme: 'nonexistent' as any,
    });

    expect(theme.colors.primary).toBe('#light-primary');
  });
});

describe('useTheme()', () => {
  it('returns the current theme', () => {
    const theme = useTheme();

    expect(theme).toBeDefined();
    expect(theme.colors).toBeDefined();
    expect(theme.spacing).toBeDefined();
  });

  it('returns theme with all required properties', () => {
    const theme = useTheme();

    expect(typeof theme.colors.primary).toBe('string');
    expect(typeof theme.spacing.md).toBe('string');
    expect(typeof theme.fontSize.base).toBe('string');
    expect(typeof theme.fontWeight.normal).toBe('number');
    expect(typeof theme.borderRadius.md).toBe('string');
    expect(typeof theme.shadows.md).toBe('string');
    expect(typeof theme.breakpoints.md).toBe('string');
    expect(typeof theme.transitions.normal).toBe('string');
    expect(typeof theme.zIndex.modal).toBe('number');
  });
});

describe('setTheme()', () => {
  let originalDocumentElement: HTMLElement;

  beforeEach(() => {
    originalDocumentElement = document.documentElement;
  });

  afterEach(() => {
    // Reset to default theme
    setTheme({
      colors: {
        primary: '#3b82f6',
      },
    });
  });

  it('updates the current theme', () => {
    setTheme({
      colors: {
        primary: '#ff0000',
      },
    });

    const theme = useTheme();
    expect(theme.colors.primary).toBe('#ff0000');
  });

  it('merges partial theme with current theme', () => {
    const originalSecondary = useTheme().colors.secondary;

    setTheme({
      colors: {
        primary: '#custom-primary',
      },
    });

    const theme = useTheme();
    expect(theme.colors.primary).toBe('#custom-primary');
    expect(theme.colors.secondary).toBe(originalSecondary);
  });

  it('updates CSS variables on document root', () => {
    setTheme({
      colors: {
        primary: '#123456',
      },
    });

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--color-primary')).toBe('#123456');
  });
});

describe('subscribeToTheme()', () => {
  afterEach(() => {
    // Reset theme
    setTheme({
      colors: {
        primary: '#3b82f6',
      },
    });
  });

  it('calls callback when theme changes', () => {
    const callback = vi.fn();
    const unsubscribe = subscribeToTheme(callback);

    setTheme({
      colors: {
        primary: '#newcolor',
      },
    });

    expect(callback).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      colors: expect.objectContaining({
        primary: '#newcolor',
      }),
    }));

    unsubscribe();
  });

  it('returns unsubscribe function', () => {
    const callback = vi.fn();
    const unsubscribe = subscribeToTheme(callback);

    expect(typeof unsubscribe).toBe('function');

    unsubscribe();

    setTheme({
      colors: {
        primary: '#afterunsubscribe',
      },
    });

    // Should not have been called after unsubscribe
    expect(callback).not.toHaveBeenCalled();
  });

  it('supports multiple subscribers', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const unsub1 = subscribeToTheme(callback1);
    const unsub2 = subscribeToTheme(callback2);

    setTheme({
      colors: {
        primary: '#multi',
      },
    });

    expect(callback1).toHaveBeenCalled();
    expect(callback2).toHaveBeenCalled();

    unsub1();
    unsub2();
  });
});

describe('ThemeProvider()', () => {
  afterEach(() => {
    setTheme({
      colors: {
        primary: '#3b82f6',
      },
    });
  });

  it('returns children', () => {
    const children = { type: 'div', children: 'test' };
    const result = ThemeProvider({ children });

    expect(result).toBe(children);
  });

  it('sets theme from Theme object', () => {
    const customTheme: Partial<Theme> = {
      colors: {
        primary: '#provider-primary',
        secondary: '#provider-secondary',
        accent: '#provider-accent',
        background: '#ffffff',
        foreground: '#000000',
        muted: '#gray',
        mutedForeground: '#darkgray',
        border: '#border',
        error: '#red',
        warning: '#yellow',
        success: '#green',
        info: '#blue',
      },
    };

    ThemeProvider({
      theme: customTheme as Theme,
      children: null,
    });

    const theme = useTheme();
    expect(theme.colors.primary).toBe('#provider-primary');
  });

  it('creates theme from ThemeConfig', () => {
    const config: ThemeConfig = {
      themes: {
        light: {
          colors: {
            primary: '#config-primary',
          },
        },
      },
      defaultTheme: 'light',
    };

    ThemeProvider({
      theme: config,
      children: null,
    });

    const theme = useTheme();
    expect(theme.colors.primary).toBe('#config-primary');
  });

  it('uses current theme when no theme prop provided', () => {
    const originalPrimary = useTheme().colors.primary;

    ThemeProvider({ children: null });

    const theme = useTheme();
    expect(theme.colors.primary).toBe(originalPrimary);
  });
});

describe('createStyled()', () => {
  beforeEach(() => {
    clearAllStyles();
  });

  it('creates a styled component factory', () => {
    const styledDiv = createStyled('div');

    expect(typeof styledDiv).toBe('function');
  });

  it('creates styled component with static styles', () => {
    const styledButton = createStyled('button');
    const Button = styledButton({
      padding: '10px 20px',
      backgroundColor: 'blue',
      color: 'white',
    });

    const result = Button({ children: 'Click' });

    expect(result.type).toBe('button');
    expect(result.props.className).toMatch(/philjs-styled-[a-z0-9]+/);
    expect(result.props.children).toBe('Click');
  });

  it('creates styled component with dynamic styles', () => {
    interface ButtonProps {
      variant?: 'primary' | 'secondary';
    }

    const styledButton = createStyled<ButtonProps>('button');
    const Button = styledButton((props) => ({
      padding: '10px',
      backgroundColor: props.variant === 'primary' ? 'blue' : 'gray',
    }));

    const primaryResult = Button({ variant: 'primary', children: 'Primary' });
    const secondaryResult = Button({ variant: 'secondary', children: 'Secondary' });

    expect(primaryResult.props.className).not.toBe(secondaryResult.props.className);
  });

  it('provides theme in dynamic style function', () => {
    const styledBox = createStyled('div');
    const Box = styledBox(({ theme }) => ({
      color: theme.colors.primary,
      padding: theme.spacing.md,
    }));

    const result = Box({ children: null });

    expect(result.props.className).toMatch(/philjs-styled-/);
  });

  it('combines with className prop', () => {
    const styledDiv = createStyled('div');
    const Div = styledDiv({ padding: '10px' });

    const result = Div({ className: 'custom-class', children: null });

    expect(result.props.className).toContain('philjs-styled-');
    expect(result.props.className).toContain('custom-class');
  });

  it('passes through additional props', () => {
    const styledInput = createStyled('input');
    const Input = styledInput({ border: '1px solid gray' });

    const result = Input({
      type: 'text',
      placeholder: 'Enter text',
      children: null,
    } as any);

    expect(result.props.type).toBe('text');
    expect(result.props.placeholder).toBe('Enter text');
  });

  it('works with function components', () => {
    const CustomComponent = (props: { className?: string; children?: any }) => ({
      type: 'custom',
      props,
    });

    const styledCustom = createStyled(CustomComponent);
    const Styled = styledCustom({ color: 'red' });

    const result = Styled({ children: 'Content' });

    expect(result.type).toBe('custom');
    expect(result.props.className).toMatch(/philjs-styled-/);
  });

  it('injects styles only once per unique style object', () => {
    clearAllStyles();

    const styledDiv = createStyled('div');
    const Box = styledDiv({ margin: '10px' });

    Box({ children: null });
    Box({ children: null });
    Box({ children: null });

    const injectedIds = getInjectedStyles();
    const styledIds = injectedIds.filter(id => id.startsWith('styled-'));
    expect(styledIds.length).toBe(1);
  });

  it('handles nested selectors in styles', () => {
    const styledDiv = createStyled('div');
    const Card = styledDiv({
      padding: '20px',
      '&:hover': {
        backgroundColor: 'lightgray',
      },
      '& > p': {
        margin: '0',
      },
    });

    const result = Card({ children: null });

    expect(result.props.className).toMatch(/philjs-styled-/);
  });

  it('handles media queries in styles', () => {
    const styledDiv = createStyled('div');
    const ResponsiveBox = styledDiv({
      padding: '10px',
      '@media (min-width: 768px)': {
        padding: '20px',
      },
    });

    const result = ResponsiveBox({ children: null });

    expect(result.props.className).toMatch(/philjs-styled-/);
  });
});

describe('Theme CSS Variables', () => {
  it('sets color variables on theme change', () => {
    setTheme({
      colors: {
        primary: '#var-primary',
        secondary: '#var-secondary',
      },
    });

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--color-primary')).toBe('#var-primary');
    expect(root.style.getPropertyValue('--color-secondary')).toBe('#var-secondary');
  });

  it('sets spacing variables on theme change', () => {
    setTheme({
      spacing: {
        md: '20px',
        lg: '30px',
      },
    });

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--spacing-md')).toBe('20px');
    expect(root.style.getPropertyValue('--spacing-lg')).toBe('30px');
  });
});

describe('Default theme values', () => {
  it('has sensible default colors', () => {
    const theme = useTheme();

    expect(theme.colors.primary).toBeTruthy();
    expect(theme.colors.secondary).toBeTruthy();
    expect(theme.colors.background).toBeTruthy();
    expect(theme.colors.foreground).toBeTruthy();
    expect(theme.colors.error).toBeTruthy();
    expect(theme.colors.success).toBeTruthy();
  });

  it('has sensible default spacing', () => {
    const theme = useTheme();

    expect(theme.spacing.xs).toBeTruthy();
    expect(theme.spacing.sm).toBeTruthy();
    expect(theme.spacing.md).toBeTruthy();
    expect(theme.spacing.lg).toBeTruthy();
    expect(theme.spacing.xl).toBeTruthy();
  });

  it('has sensible default font sizes', () => {
    const theme = useTheme();

    expect(theme.fontSize.xs).toBeTruthy();
    expect(theme.fontSize.sm).toBeTruthy();
    expect(theme.fontSize.base).toBeTruthy();
    expect(theme.fontSize.lg).toBeTruthy();
    expect(theme.fontSize.xl).toBeTruthy();
  });

  it('has sensible default font weights', () => {
    const theme = useTheme();

    expect(theme.fontWeight.thin).toBe(100);
    expect(theme.fontWeight.normal).toBe(400);
    expect(theme.fontWeight.bold).toBe(700);
  });

  it('has sensible default border radius values', () => {
    const theme = useTheme();

    expect(theme.borderRadius.none).toBe('0');
    expect(theme.borderRadius.sm).toBeTruthy();
    expect(theme.borderRadius.md).toBeTruthy();
    expect(theme.borderRadius.full).toBe('9999px');
  });

  it('has sensible default shadow values', () => {
    const theme = useTheme();

    expect(theme.shadows.none).toBe('none');
    expect(theme.shadows.sm).toBeTruthy();
    expect(theme.shadows.md).toBeTruthy();
    expect(theme.shadows.lg).toBeTruthy();
  });

  it('has sensible default breakpoints', () => {
    const theme = useTheme();

    expect(theme.breakpoints.sm).toBe('640px');
    expect(theme.breakpoints.md).toBe('768px');
    expect(theme.breakpoints.lg).toBe('1024px');
    expect(theme.breakpoints.xl).toBe('1280px');
  });

  it('has sensible default transitions', () => {
    const theme = useTheme();

    expect(theme.transitions.fast).toBeTruthy();
    expect(theme.transitions.normal).toBeTruthy();
    expect(theme.transitions.slow).toBeTruthy();
  });

  it('has sensible default z-index values', () => {
    const theme = useTheme();

    expect(theme.zIndex.dropdown).toBe(1000);
    expect(theme.zIndex.modal).toBe(1040);
    expect(theme.zIndex.tooltip).toBe(1060);
  });
});

describe('Edge cases', () => {
  it('handles undefined theme sections gracefully', () => {
    expect(() => {
      setTheme({} as any);
    }).not.toThrow();
  });

  it('handles nested theme updates', () => {
    setTheme({
      colors: {
        primary: '#first',
      },
    });

    setTheme({
      colors: {
        primary: '#second',
      },
    });

    const theme = useTheme();
    expect(theme.colors.primary).toBe('#second');
  });

  it('styled component handles empty children', () => {
    const styledDiv = createStyled('div');
    const Box = styledDiv({ padding: '10px' });

    const result = Box({ children: undefined });

    expect(result.props.children).toBeUndefined();
  });

  it('styled component handles array children', () => {
    const styledDiv = createStyled('div');
    const List = styledDiv({ display: 'flex' });

    const result = List({
      children: ['Item 1', 'Item 2', 'Item 3'],
    });

    expect(result.props.children).toEqual(['Item 1', 'Item 2', 'Item 3']);
  });
});
