import {
  css,
  compose,
  cx,
  createTheme,
  variants,
  createAtomicSystem,
  extractCSS,
  keyframes,
  slotVariants,
  resetStyles,
  resetAtomicRegistry
} from './index';

describe('PhilJS CSS', () => {
  beforeEach(() => {
    resetStyles();
    resetAtomicRegistry();
  });

  describe('css()', () => {
    it('should create a basic style', () => {
      const button = css({
        padding: '10px 20px',
        backgroundColor: 'blue',
        color: 'white'
      });

      expect(button.className).toMatch(/^css-\d+$/);
      expect(button.css).toContain('padding: 10px 20px');
      expect(button.css).toContain('background-color: blue');
      expect(button.toString()).toBe(button.className);
    });

    it('should handle pseudo selectors', () => {
      const button = css({
        padding: '10px',
        '&:hover': {
          backgroundColor: 'red'
        },
        '&:focus': {
          outline: '2px solid blue'
        }
      });

      expect(button.css).toContain(':hover');
      expect(button.css).toContain('background-color: red');
      expect(button.css).toContain(':focus');
    });

    it('should handle nested selectors', () => {
      const container = css({
        padding: '20px',
        '& > *': {
          marginBottom: '10px'
        }
      });

      expect(container.css).toContain('> *');
      expect(container.css).toContain('margin-bottom: 10px');
    });

    it('should convert camelCase to kebab-case', () => {
      const element = css({
        backgroundColor: 'blue',
        fontSize: '16px',
        marginTop: '10px'
      });

      expect(element.css).toContain('background-color');
      expect(element.css).toContain('font-size');
      expect(element.css).toContain('margin-top');
    });

    it('should handle numeric values', () => {
      const box = css({
        width: 100,
        height: 200,
        opacity: 0.5
      });

      expect(box.css).toContain('width: 100px');
      expect(box.css).toContain('height: 200px');
      expect(box.css).toContain('opacity: 0.5'); // No px for opacity
    });
  });

  describe('Theme', () => {
    it('should create a theme with tokens', () => {
      const theme = createTheme({
        colors: {
          primary: '#3b82f6',
          secondary: '#10b981'
        },
        spacing: {
          sm: '8px',
          md: '16px',
          lg: '24px'
        }
      });

      expect(theme.colors.primary).toBe('#3b82f6');
      expect(theme.spacing.md).toBe('16px');
      expect(theme.cssVars['--colors-primary']).toBe('#3b82f6');
    });

    it('should use theme tokens in styles', () => {
      const theme = createTheme({
        colors: { primary: '#3b82f6' },
        spacing: { md: '16px' }
      });

      const button = css({
        padding: theme.spacing.md,
        backgroundColor: theme.colors.primary
      });

      expect(button.css).toContain('padding: 16px');
      expect(button.css).toContain('background-color: #3b82f6');
    });
  });

  describe('Variants', () => {
    it('should create variants', () => {
      const button = variants({
        base: {
          padding: '10px',
          borderRadius: '4px'
        },
        variants: {
          size: {
            sm: { padding: '6px 12px' },
            lg: { padding: '14px 28px' }
          },
          color: {
            primary: { backgroundColor: 'blue' },
            danger: { backgroundColor: 'red' }
          }
        },
        defaultVariants: {
          size: 'sm',
          color: 'primary'
        }
      });

      const defaultClass = button();
      expect(defaultClass).toBeTruthy();

      const largeClass = button({ size: 'lg' });
      expect(largeClass).toBeTruthy();

      const dangerClass = button({ color: 'danger' });
      expect(dangerClass).toBeTruthy();
    });

    it('should apply compound variants', () => {
      const button = variants({
        variants: {
          size: { sm: { padding: '6px' } },
          outline: { true: { border: '2px solid' } }
        },
        compoundVariants: [
          {
            size: 'sm',
            outline: true,
            css: { border: '1px solid' }
          }
        ]
      });

      const className = button({ size: 'sm', outline: true });
      expect(className).toBeTruthy();
    });
  });

  describe('Atomic Utilities', () => {
    it('should create atomic system', () => {
      const atoms = createAtomicSystem({
        spacing: {
          0: '0',
          1: '4px',
          2: '8px',
          4: '16px'
        },
        colors: {
          blue: '#3b82f6',
          red: '#ef4444'
        },
        fontSize: {
          sm: '14px',
          base: '16px'
        }
      });

      expect(atoms.m4).toBeTruthy();
      expect(atoms.p2).toBeTruthy();
      expect(atoms.textBlue).toBeTruthy();
      expect(atoms.bgRed).toBeTruthy();
      expect(atoms.textSm).toBeTruthy();
      expect(atoms.flex).toBeTruthy();
      expect(atoms.itemsCenter).toBeTruthy();
    });

    it('should create spacing utilities', () => {
      const atoms = createAtomicSystem({
        spacing: { 0: '0', 4: '16px' }
      });

      expect(atoms.m4).toBeTruthy();
      expect(atoms.mt4).toBeTruthy();
      expect(atoms.mr4).toBeTruthy();
      expect(atoms.mb4).toBeTruthy();
      expect(atoms.ml4).toBeTruthy();
      expect(atoms.p4).toBeTruthy();
      expect(atoms.pt4).toBeTruthy();
    });
  });

  describe('Keyframes', () => {
    it('should create keyframe animation', () => {
      const fadeIn = keyframes({
        from: { opacity: 0 },
        to: { opacity: 1 }
      });

      expect(fadeIn).toMatch(/^animation-\d+$/);

      const animated = css({
        animation: `${fadeIn} 300ms ease-in`
      });

      expect(animated.css).toContain(fadeIn);
    });
  });

  describe('Slot Variants', () => {
    it('should create slot-based variants', () => {
      const card = slotVariants({
        slots: {
          root: { borderRadius: '8px' },
          header: { padding: '16px' },
          body: { padding: '16px' }
        },
        variants: {
          size: {
            sm: {
              header: { padding: '12px' },
              body: { padding: '12px' }
            }
          }
        }
      });

      const classes = card();
      expect(classes.root).toBeTruthy();
      expect(classes.header).toBeTruthy();
      expect(classes.body).toBeTruthy();

      const smallClasses = card({ size: 'sm' });
      expect(smallClasses.root).toBeTruthy();
    });
  });

  describe('Utilities', () => {
    it('should compose multiple styles', () => {
      const base = css({ padding: '10px' });
      const primary = css({ backgroundColor: 'blue' });

      const composed = compose(base, primary);
      expect(composed).toContain(base.className);
      expect(composed).toContain(primary.className);
    });

    it('should handle conditional classes with cx', () => {
      const className = cx(
        'base',
        true && 'active',
        false && 'inactive',
        null,
        undefined
      );

      expect(className).toBe('base active');
    });

    it('should filter falsy values in cx', () => {
      const className = cx('a', false, 'b', null, 'c', undefined);
      expect(className).toBe('a b c');
    });
  });

  describe('CSS Extraction', () => {
    it('should extract all CSS', () => {
      const button = css({
        padding: '10px',
        backgroundColor: 'blue'
      });

      const extracted = extractCSS();
      expect(extracted).toContain('padding: 10px');
      expect(extracted).toContain('background-color: blue');
    });

    it('should include theme variables in extraction', () => {
      createTheme({
        colors: { primary: '#3b82f6' }
      });

      const extracted = extractCSS();
      expect(extracted).toContain('--colors-primary');
      expect(extracted).toContain('#3b82f6');
    });

    it('should include atomic classes in extraction', () => {
      const atoms = createAtomicSystem({
        spacing: { 4: '16px' }
      });

      const extracted = extractCSS({ atomicClasses: true });
      expect(extracted).toBeTruthy();
    });
  });
});
