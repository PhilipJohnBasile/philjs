import { describe, it, expect } from 'vitest';
import {
  cssModules,
  useCSSModule,
  bindStyles,
  getCSSModuleConfig,
  importCSSModule,
  createClassNames,
} from './css-modules';

describe('cssModules()', () => {
  const mockStyles = {
    container: 'container_abc123',
    button: 'button_def456',
    active: 'active_ghi789',
    disabled: 'disabled_jkl012',
  };

  it('returns object with all original classes', () => {
    const styles = cssModules(mockStyles);

    expect(styles.container).toBe('container_abc123');
    expect(styles.button).toBe('button_def456');
    expect(styles.active).toBe('active_ghi789');
    expect(styles.disabled).toBe('disabled_jkl012');
  });

  it('adds compose method', () => {
    const styles = cssModules(mockStyles);

    expect(typeof styles.compose).toBe('function');
  });

  describe('compose()', () => {
    it('composes multiple class names from the module', () => {
      const styles = cssModules(mockStyles);

      const result = styles.compose('container', 'active');
      expect(result).toBe('container_abc123 active_ghi789');
    });

    it('handles string values not in module', () => {
      const styles = cssModules(mockStyles);

      const result = styles.compose('container', 'external-class');
      expect(result).toBe('container_abc123 external-class');
    });

    it('filters out falsy values', () => {
      const styles = cssModules(mockStyles);

      const result = styles.compose('button', false, null, undefined, 'active');
      expect(result).toBe('button_def456 active_ghi789');
    });

    it('handles empty arguments', () => {
      const styles = cssModules(mockStyles);

      const result = styles.compose();
      expect(result).toBe('');
    });

    it('handles conditional class names', () => {
      const styles = cssModules(mockStyles);
      const isActive = true;
      const isDisabled = false;

      const result = styles.compose(
        'button',
        isActive && 'active',
        isDisabled && 'disabled'
      );
      expect(result).toBe('button_def456 active_ghi789');
    });
  });
});

describe('useCSSModule()', () => {
  const mockStyles = {
    wrapper: 'wrapper_xyz',
    header: 'header_abc',
    content: 'content_def',
  };

  it('returns styles object', () => {
    const { styles } = useCSSModule(mockStyles);

    expect(styles).toBe(mockStyles);
    expect(styles.wrapper).toBe('wrapper_xyz');
  });

  it('returns cx function', () => {
    const { cx } = useCSSModule(mockStyles);

    expect(typeof cx).toBe('function');
  });

  it('returns getClass function', () => {
    const { getClass } = useCSSModule(mockStyles);

    expect(typeof getClass).toBe('function');
  });

  describe('cx()', () => {
    it('combines class names', () => {
      const { cx } = useCSSModule(mockStyles);

      const result = cx('wrapper', 'header');
      expect(result).toBe('wrapper_xyz header_abc');
    });

    it('handles external class names', () => {
      const { cx } = useCSSModule(mockStyles);

      const result = cx('wrapper', 'external');
      expect(result).toBe('wrapper_xyz external');
    });

    it('filters falsy values', () => {
      const { cx } = useCSSModule(mockStyles);

      const result = cx('wrapper', false, 'header', null);
      expect(result).toBe('wrapper_xyz header_abc');
    });
  });

  describe('getClass()', () => {
    it('returns class from module', () => {
      const { getClass } = useCSSModule(mockStyles);

      expect(getClass('wrapper')).toBe('wrapper_xyz');
      expect(getClass('header')).toBe('header_abc');
    });

    it('returns empty string for non-existent class', () => {
      const { getClass } = useCSSModule(mockStyles);

      expect(getClass('nonexistent' as any)).toBe('');
    });
  });
});

describe('bindStyles()', () => {
  const mockStyles = {
    card: 'card_111',
    title: 'title_222',
    body: 'body_333',
    footer: 'footer_444',
  };

  it('returns object with all class properties', () => {
    const bound = bindStyles(mockStyles);

    expect(bound.card).toBe('card_111');
    expect(bound.title).toBe('title_222');
    expect(bound.body).toBe('body_333');
    expect(bound.footer).toBe('footer_444');
  });

  it('adds cx method', () => {
    const bound = bindStyles(mockStyles);

    expect(typeof bound.cx).toBe('function');
  });

  describe('cx()', () => {
    it('combines class names from bound styles', () => {
      const bound = bindStyles(mockStyles);

      const result = bound.cx('card', 'title');
      expect(result).toBe('card_111 title_222');
    });

    it('handles external class names', () => {
      const bound = bindStyles(mockStyles);

      const result = bound.cx('card', 'my-custom-class');
      expect(result).toBe('card_111 my-custom-class');
    });

    it('filters falsy values', () => {
      const bound = bindStyles(mockStyles);

      const result = bound.cx('card', null, undefined, false, 'title');
      expect(result).toBe('card_111 title_222');
    });

    it('handles boolean type that resolves to falsy', () => {
      const bound = bindStyles(mockStyles);
      const showFooter = false;

      const result = bound.cx('card', showFooter && 'footer');
      expect(result).toBe('card_111');
    });

    it('filters empty strings from non-module classes', () => {
      const bound = bindStyles(mockStyles);

      const result = bound.cx('card', '', 'title');
      expect(result).toBe('card_111 title_222');
    });
  });
});

describe('getCSSModuleConfig()', () => {
  it('returns config with default values', () => {
    const config = getCSSModuleConfig();

    expect(config.vite.css.modules.scopeBehaviour).toBe('local');
    expect(config.vite.css.modules.localsConvention).toBe('camelCaseOnly');
    expect(config.postcss['postcss-modules'].scopeBehaviour).toBe('local');
    expect(config.webpack.modules.mode).toBe('local');
  });

  it('accepts custom scopeBehaviour', () => {
    const config = getCSSModuleConfig({ scopeBehaviour: 'global' });

    expect(config.vite.css.modules.scopeBehaviour).toBe('global');
    expect(config.postcss['postcss-modules'].scopeBehaviour).toBe('global');
    expect(config.webpack.modules.mode).toBe('global');
  });

  it('accepts custom localIdentName', () => {
    const customName = '[local]___[hash:base64:8]';
    const config = getCSSModuleConfig({ localIdentName: customName });

    expect(config.vite.css.modules.generateScopedName).toBe(customName);
    expect(config.postcss['postcss-modules'].generateScopedName).toBe(customName);
    expect(config.webpack.modules.localIdentName).toBe(customName);
  });

  it('accepts custom exportLocalsConvention', () => {
    const config = getCSSModuleConfig({ exportLocalsConvention: 'dashes' });

    expect(config.vite.css.modules.localsConvention).toBe('dashes');
    expect(config.postcss['postcss-modules'].localsConvention).toBe('dashes');
    expect(config.webpack.modules.exportLocalsConvention).toBe('dashes');
  });

  it('returns valid Vite config structure', () => {
    const config = getCSSModuleConfig();

    expect(config.vite).toHaveProperty('css');
    expect(config.vite.css).toHaveProperty('modules');
    expect(config.vite.css.modules).toHaveProperty('scopeBehaviour');
    expect(config.vite.css.modules).toHaveProperty('localsConvention');
    expect(config.vite.css.modules).toHaveProperty('generateScopedName');
  });

  it('returns valid PostCSS config structure', () => {
    const config = getCSSModuleConfig();

    expect(config.postcss).toHaveProperty('postcss-modules');
    expect(config.postcss['postcss-modules']).toHaveProperty('scopeBehaviour');
    expect(config.postcss['postcss-modules']).toHaveProperty('localsConvention');
    expect(config.postcss['postcss-modules']).toHaveProperty('generateScopedName');
  });

  it('returns valid Webpack config structure', () => {
    const config = getCSSModuleConfig();

    expect(config.webpack).toHaveProperty('modules');
    expect(config.webpack.modules).toHaveProperty('mode');
    expect(config.webpack.modules).toHaveProperty('localIdentName');
    expect(config.webpack.modules).toHaveProperty('exportLocalsConvention');
  });
});

describe('importCSSModule()', () => {
  it('extracts default export from module promise', async () => {
    const mockModule = {
      default: {
        container: 'container_hash',
        button: 'button_hash',
      },
    };

    const result = await importCSSModule(Promise.resolve(mockModule));

    expect(result).toEqual({
      container: 'container_hash',
      button: 'button_hash',
    });
  });

  it('works with async module loading', async () => {
    const mockStyles = {
      header: 'header_abc',
      nav: 'nav_def',
    };

    const modulePromise = new Promise<{ default: typeof mockStyles }>((resolve) => {
      setTimeout(() => resolve({ default: mockStyles }), 10);
    });

    const result = await importCSSModule(modulePromise);

    expect(result).toBe(mockStyles);
  });

  it('propagates errors from failed imports', async () => {
    const failedPromise = Promise.reject(new Error('Module not found'));

    await expect(importCSSModule(failedPromise)).rejects.toThrow('Module not found');
  });
});

describe('createClassNames()', () => {
  const mockStyles = {
    btn: 'btn_styled',
    primary: 'primary_styled',
    secondary: 'secondary_styled',
    large: 'large_styled',
    small: 'small_styled',
  };

  it('creates a classNames function', () => {
    const classNames = createClassNames(mockStyles);
    expect(typeof classNames).toBe('function');
  });

  describe('with array input', () => {
    it('combines classes from array', () => {
      const classNames = createClassNames(mockStyles);

      const result = classNames(['btn', 'primary']);
      expect(result).toBe('btn_styled primary_styled');
    });

    it('handles single class in array', () => {
      const classNames = createClassNames(mockStyles);

      const result = classNames(['btn']);
      expect(result).toBe('btn_styled');
    });

    it('handles empty array', () => {
      const classNames = createClassNames(mockStyles);

      const result = classNames([]);
      expect(result).toBe('');
    });
  });

  describe('with object input', () => {
    it('includes classes with truthy conditions', () => {
      const classNames = createClassNames(mockStyles);

      const result = classNames({
        btn: true,
        primary: true,
        secondary: false,
      });
      expect(result).toBe('btn_styled primary_styled');
    });

    it('excludes classes with falsy conditions', () => {
      const classNames = createClassNames(mockStyles);

      const result = classNames({
        btn: true,
        large: false,
        small: false,
      });
      expect(result).toBe('btn_styled');
    });

    it('handles all falsy conditions', () => {
      const classNames = createClassNames(mockStyles);

      const result = classNames({
        btn: false,
        primary: false,
      });
      expect(result).toBe('');
    });

    it('handles all truthy conditions', () => {
      const classNames = createClassNames(mockStyles);

      const result = classNames({
        btn: true,
        primary: true,
        large: true,
      });
      expect(result).toBe('btn_styled primary_styled large_styled');
    });
  });
});

describe('Type safety', () => {
  it('preserves type information for class keys', () => {
    const styles = {
      container: 'container_hash',
      button: 'button_hash',
    } as const;

    const bound = bindStyles(styles);

    // TypeScript should allow these
    expect(bound.container).toBe('container_hash');
    expect(bound.button).toBe('button_hash');
  });

  it('getClass returns string type', () => {
    const styles = {
      test: 'test_hash',
    };

    const { getClass } = useCSSModule(styles);
    const className: string = getClass('test');

    expect(typeof className).toBe('string');
  });
});

describe('Edge cases', () => {
  it('handles styles with special characters in values', () => {
    const styles = {
      'btn-primary': 'btn-primary_hash',
      'text--large': 'text--large_hash',
    };

    const bound = bindStyles(styles);

    expect(bound['btn-primary']).toBe('btn-primary_hash');
    expect(bound['text--large']).toBe('text--large_hash');
  });

  it('handles empty styles object', () => {
    const styles = {};
    const bound = bindStyles(styles);

    expect(bound.cx()).toBe('');
  });

  it('handles styles with numeric values', () => {
    const styles = {
      col1: 'col1_hash',
      col2: 'col2_hash',
      row1: 'row1_hash',
    };

    const { cx } = useCSSModule(styles);

    const result = cx('col1', 'row1');
    expect(result).toBe('col1_hash row1_hash');
  });

  it('compose handles mixed module and external classes', () => {
    const styles = cssModules({
      internal: 'internal_hash',
    });

    const result = styles.compose('internal', 'external-one', 'external-two');
    expect(result).toBe('internal_hash external-one external-two');
  });
});
