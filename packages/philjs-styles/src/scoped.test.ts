import { describe, it, expect, beforeEach, vi } from 'vitest';
import { css, styled, keyframes, createGlobalStyle, cva } from './scoped';
import { clearAllStyles, getInjectedStyles } from './utils';
import type { CSSProperties } from './types';

describe('css() - Scoped Styles', () => {
  beforeEach(() => {
    clearAllStyles();
  });

  it('creates a scoped class name from CSS template literal', () => {
    const className = css`
      color: red;
      padding: 10px;
    `;

    expect(className).toMatch(/^philjs-[a-z0-9]+$/);
  });

  it('returns consistent class name for same CSS', () => {
    const className1 = css`color: blue;`;
    const className2 = css`color: blue;`;

    expect(className1).toBe(className2);
  });

  it('returns different class names for different CSS', () => {
    const className1 = css`color: red;`;
    const className2 = css`color: blue;`;

    expect(className1).not.toBe(className2);
  });

  it('injects styles into the document', () => {
    const className = css`
      background-color: green;
    `;

    const injectedIds = getInjectedStyles();
    expect(injectedIds.length).toBeGreaterThan(0);
  });

  it('handles interpolated values', () => {
    const color = 'purple';
    const size = 20;
    const className = css`
      color: ${color};
      font-size: ${size}px;
    `;

    expect(className).toMatch(/^philjs-[a-z0-9]+$/);
  });

  it('handles complex nested selectors', () => {
    const className = css`
      padding: 10px;

      & > * {
        margin-bottom: 5px;
      }

      &:hover {
        background: lightgray;
      }

      &:last-child {
        margin-bottom: 0;
      }
    `;

    expect(className).toMatch(/^philjs-[a-z0-9]+$/);
  });

  it('handles :global() selector for unscoped styles', () => {
    const className = css`
      color: red;

      :global(.external-class) {
        color: blue;
      }
    `;

    expect(className).toMatch(/^philjs-[a-z0-9]+$/);
  });

  it('handles media queries', () => {
    const className = css`
      display: block;

      @media (min-width: 768px) {
        display: flex;
      }
    `;

    expect(className).toMatch(/^philjs-[a-z0-9]+$/);
  });

  it('caches styles to avoid duplicate injection', () => {
    clearAllStyles();

    css`color: cached;`;
    css`color: cached;`;
    css`color: cached;`;

    const injectedIds = getInjectedStyles();
    // Should only have one style injected for same CSS
    expect(injectedIds.length).toBe(1);
  });
});

describe('styled() - Styled Components', () => {
  beforeEach(() => {
    clearAllStyles();
  });

  it('creates a styled component with static styles', () => {
    const Button = styled('button', {
      padding: '10px 20px',
      backgroundColor: 'blue',
      color: 'white',
    });

    const result = Button({ children: 'Click me' });

    expect(result.type).toBe('button');
    expect(result.props.className).toMatch(/philjs-[a-z0-9]+/);
    expect(result.props.children).toBe('Click me');
  });

  it('passes through additional props', () => {
    const Button = styled('button', {
      padding: '10px',
    });

    const result = Button({
      children: 'Test',
      type: 'submit',
      disabled: true,
    } as any);

    expect(result.props.type).toBe('submit');
    expect(result.props.disabled).toBe(true);
  });

  it('combines className prop with generated class', () => {
    const Box = styled('div', {
      padding: '20px',
    });

    const result = Box({
      className: 'custom-class',
      children: null,
    });

    expect(result.props.className).toContain('philjs-');
    expect(result.props.className).toContain('custom-class');
  });

  it('supports dynamic styles via function', () => {
    interface ButtonProps {
      primary?: boolean;
    }

    const Button = styled<ButtonProps>('button', (props) => ({
      padding: '10px',
      backgroundColor: props.primary ? 'blue' : 'gray',
    }));

    const primaryResult = Button({ primary: true, children: 'Primary' });
    const defaultResult = Button({ primary: false, children: 'Default' });

    // Different styles should produce different class names
    expect(primaryResult.props.className).not.toBe(defaultResult.props.className);
  });

  it('works with function components', () => {
    const CustomComponent = (props: { className?: string; children?: any }) => ({
      type: 'custom',
      props,
    });

    const StyledCustom = styled(CustomComponent, {
      color: 'red',
    });

    const result = StyledCustom({ children: 'Custom' });
    expect(result.type).toBe('custom');
    expect(result.props.className).toMatch(/philjs-[a-z0-9]+/);
  });

  it('injects styles on first render only', () => {
    clearAllStyles();

    const Box = styled('div', {
      margin: '10px',
    });

    Box({ children: null });
    Box({ children: null });
    Box({ children: null });

    const injectedIds = getInjectedStyles();
    // Should only inject once per unique style
    expect(injectedIds.length).toBe(1);
  });
});

describe('keyframes() - CSS Animations', () => {
  beforeEach(() => {
    clearAllStyles();
  });

  it('creates a named keyframe animation', () => {
    const fadeIn = keyframes`
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    `;

    expect(fadeIn).toMatch(/^philjs-anim-[a-z0-9]+$/);
  });

  it('returns consistent name for same keyframes', () => {
    const anim1 = keyframes`from { opacity: 0; } to { opacity: 1; }`;
    const anim2 = keyframes`from { opacity: 0; } to { opacity: 1; }`;

    expect(anim1).toBe(anim2);
  });

  it('returns different names for different keyframes', () => {
    const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
    const slideIn = keyframes`from { transform: translateX(-100%); } to { transform: translateX(0); }`;

    expect(fadeIn).not.toBe(slideIn);
  });

  it('can be used in css() template', () => {
    const bounce = keyframes`
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    `;

    const className = css`
      animation: ${bounce} 1s ease infinite;
    `;

    expect(className).toMatch(/^philjs-[a-z0-9]+$/);
  });

  it('handles percentage-based keyframes', () => {
    const complex = keyframes`
      0% { opacity: 0; transform: scale(0.8); }
      50% { opacity: 0.5; transform: scale(1.1); }
      100% { opacity: 1; transform: scale(1); }
    `;

    expect(complex).toMatch(/^philjs-anim-[a-z0-9]+$/);
  });

  it('supports interpolated values', () => {
    const startColor = 'red';
    const endColor = 'blue';

    const colorChange = keyframes`
      from { background-color: ${startColor}; }
      to { background-color: ${endColor}; }
    `;

    expect(colorChange).toMatch(/^philjs-anim-[a-z0-9]+$/);
  });
});

describe('createGlobalStyle() - Global Styles', () => {
  beforeEach(() => {
    clearAllStyles();
  });

  it('creates a global style component', () => {
    const GlobalStyle = createGlobalStyle`
      body {
        margin: 0;
        padding: 0;
      }
    `;

    expect(typeof GlobalStyle).toBe('function');
  });

  it('returns null when called', () => {
    const GlobalStyle = createGlobalStyle`
      * { box-sizing: border-box; }
    `;

    const result = GlobalStyle();
    expect(result).toBe(null);
  });

  it('injects styles when called', () => {
    clearAllStyles();

    const GlobalStyle = createGlobalStyle`
      html { font-size: 16px; }
    `;

    GlobalStyle();

    const injectedIds = getInjectedStyles();
    expect(injectedIds.length).toBeGreaterThan(0);
    expect(injectedIds.some(id => id.startsWith('global-'))).toBe(true);
  });

  it('only injects once even when called multiple times', () => {
    clearAllStyles();

    const GlobalStyle = createGlobalStyle`
      body { font-family: sans-serif; }
    `;

    GlobalStyle();
    GlobalStyle();
    GlobalStyle();

    const injectedIds = getInjectedStyles();
    const globalIds = injectedIds.filter(id => id.startsWith('global-'));
    expect(globalIds.length).toBe(1);
  });

  it('handles interpolated values', () => {
    const primaryColor = '#3b82f6';

    const GlobalStyle = createGlobalStyle`
      :root {
        --primary: ${primaryColor};
      }
    `;

    expect(typeof GlobalStyle).toBe('function');
    expect(GlobalStyle()).toBe(null);
  });
});

describe('cva() - Class Variance Authority', () => {
  beforeEach(() => {
    clearAllStyles();
  });

  it('creates variant function with base styles', () => {
    const button = cva({
      base: {
        padding: '10px 20px',
        borderRadius: '4px',
      },
    });

    const className = button();
    expect(className).toMatch(/^philjs-var-[a-z0-9]+$/);
  });

  it('applies variant styles', () => {
    const button = cva({
      base: { padding: '10px' },
      variants: {
        size: {
          sm: { padding: '6px 12px' },
          md: { padding: '10px 20px' },
          lg: { padding: '14px 28px' },
        },
      },
    });

    const smClass = button({ size: 'sm' });
    const lgClass = button({ size: 'lg' });

    expect(smClass).toMatch(/^philjs-var-[a-z0-9]+$/);
    expect(lgClass).toMatch(/^philjs-var-[a-z0-9]+$/);
    expect(smClass).not.toBe(lgClass);
  });

  it('supports multiple variant dimensions', () => {
    const button = cva({
      base: { border: 'none' },
      variants: {
        size: {
          sm: { padding: '6px' },
          lg: { padding: '14px' },
        },
        color: {
          primary: { backgroundColor: 'blue' },
          danger: { backgroundColor: 'red' },
        },
      },
    });

    const primarySm = button({ size: 'sm', color: 'primary' });
    const dangerLg = button({ size: 'lg', color: 'danger' });

    expect(primarySm).not.toBe(dangerLg);
  });

  it('applies default variants', () => {
    const button = cva({
      base: { display: 'inline-flex' },
      variants: {
        size: {
          sm: { padding: '6px' },
          md: { padding: '10px' },
        },
      },
      defaultVariants: {
        size: 'md',
      },
    });

    const defaultClass = button();
    const mdClass = button({ size: 'md' });

    // Default should use md variant
    expect(defaultClass).toBe(mdClass);
  });

  it('applies compound variants', () => {
    const button = cva({
      base: { padding: '10px' },
      variants: {
        size: {
          sm: { fontSize: '12px' },
          lg: { fontSize: '18px' },
        },
        outline: {
          true: { border: '2px solid' },
          false: { border: 'none' },
        },
      },
      compoundVariants: [
        {
          size: 'sm',
          outline: true,
          css: { borderWidth: '1px' },
        },
      ],
    });

    const smOutline = button({ size: 'sm', outline: true });
    const lgOutline = button({ size: 'lg', outline: true });

    expect(smOutline).not.toBe(lgOutline);
  });

  it('overrides default variants with explicit values', () => {
    const button = cva({
      variants: {
        color: {
          primary: { backgroundColor: 'blue' },
          secondary: { backgroundColor: 'gray' },
        },
      },
      defaultVariants: {
        color: 'primary',
      },
    });

    const defaultClass = button();
    const secondaryClass = button({ color: 'secondary' });

    expect(defaultClass).not.toBe(secondaryClass);
  });

  it('handles empty config', () => {
    const minimal = cva({});
    const className = minimal();

    expect(className).toMatch(/^philjs-var-[a-z0-9]+$/);
  });

  it('returns consistent class for same variant combination', () => {
    const button = cva({
      variants: {
        size: {
          sm: { padding: '6px' },
        },
      },
    });

    const class1 = button({ size: 'sm' });
    const class2 = button({ size: 'sm' });

    expect(class1).toBe(class2);
  });

  it('injects styles only once per unique combination', () => {
    clearAllStyles();

    const button = cva({
      base: { display: 'flex' },
      variants: {
        size: {
          sm: { padding: '6px' },
          lg: { padding: '14px' },
        },
      },
    });

    // Call same variant multiple times
    button({ size: 'sm' });
    button({ size: 'sm' });
    button({ size: 'sm' });

    const injectedIds = getInjectedStyles();
    const varIds = injectedIds.filter(id => id.startsWith('var-'));
    expect(varIds.length).toBe(1);
  });
});

describe('Integration tests', () => {
  beforeEach(() => {
    clearAllStyles();
  });

  it('combines css, keyframes, and styled components', () => {
    const fadeIn = keyframes`
      from { opacity: 0; }
      to { opacity: 1; }
    `;

    const baseStyles = css`
      animation: ${fadeIn} 0.3s ease;
    `;

    const FadeBox = styled('div', {
      opacity: 1,
    });

    expect(fadeIn).toMatch(/^philjs-anim-/);
    expect(baseStyles).toMatch(/^philjs-/);
    expect(FadeBox({ children: null }).props.className).toMatch(/philjs-/);
  });

  it('works with theme-like values', () => {
    const theme = {
      colors: {
        primary: '#3b82f6',
        secondary: '#6366f1',
      },
      spacing: {
        sm: '8px',
        md: '16px',
      },
    };

    const className = css`
      background-color: ${theme.colors.primary};
      padding: ${theme.spacing.md};
    `;

    expect(className).toMatch(/^philjs-[a-z0-9]+$/);
  });

  it('handles complex responsive patterns', () => {
    const card = cva({
      base: {
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '8px',
      },
      variants: {
        size: {
          sm: { padding: '12px' },
          md: { padding: '16px' },
          lg: { padding: '24px' },
        },
        elevated: {
          true: { boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
          false: { boxShadow: 'none' },
        },
      },
      compoundVariants: [
        {
          size: 'lg',
          elevated: true,
          css: { boxShadow: '0 8px 16px rgba(0,0,0,0.15)' },
        },
      ],
      defaultVariants: {
        size: 'md',
        elevated: false,
      },
    });

    const defaultCard = card();
    const elevatedLgCard = card({ size: 'lg', elevated: true });

    expect(defaultCard).not.toBe(elevatedLgCard);
  });
});
