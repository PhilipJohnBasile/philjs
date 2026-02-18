/**
 * Tests for PhilJS UnoCSS Integration
 *
 * Comprehensive UnoCSS integration with PhilJS signals, themes, and utilities.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  // Presets
  presetPhilJS,
  presetPhilJSIcons,
  presetPhilJSTypography,
  // Theme values
  philjsColors,
  philjsSpacing,
  philjsFontSizes,
  philjsFontWeights,
  philjsFontFamilies,
  philjsLineHeights,
  philjsLetterSpacing,
  philjsBorderRadius,
  philjsBoxShadows,
  philjsBreakpoints,
  philjsZIndex,
  philjsAnimations,
  philjsDurations,
  philjsEasings,
  philjsTheme,
  // Rules, shortcuts, variants, preflights
  philjsRules,
  philjsShortcuts,
  philjsVariants,
  philjsPreflights,
  // Signal integration
  useTheme,
  useConditionalClass,
  useClasses,
  useVariant,
  // Runtime utilities
  uno,
  cva,
  cssVar,
  cssVars,
  // Configuration helpers
  defineConfig,
  extendTheme,
  createColorPalette,
  // Re-exports
  colors,
  spacing,
  fontSizes,
  fontWeights,
  fontFamilies,
  lineHeights,
  letterSpacing,
  borderRadius,
  boxShadows,
  breakpoints,
  zIndex,
  animations,
  durations,
  easings,
  // Types
  type Preset,
  type Theme,
  type Rule,
  type RuleHandler,
  type RuleContext,
  type RuleMeta,
  type Shortcut,
  type ShortcutHandler,
  type ShortcutMeta,
  type Variant,
  type VariantMatchResult,
  type Preflight,
  type Extractor,
  type Preprocessor,
  type Postprocessor,
  type PhilJSPresetOptions,
  type IconsOptions,
  type TypographyOptions,
  type WebFontsOptions,
  type WebFontMeta,
  type AttributifyAttributes,
} from './index';

describe('PhilJS UnoCSS Integration', () => {
  describe('Type Definitions', () => {
    describe('Preset', () => {
      it('should define preset structure', () => {
        const preset: Preset = {
          name: 'test-preset',
          enforce: 'pre',
          theme: { colors: { primary: '#000' } },
          rules: [],
          shortcuts: [],
          variants: [],
          preflights: [],
          safelist: ['bg-primary'],
          blocklist: ['hidden'],
          layers: { base: 0, components: 10, utilities: 20 },
        };
        expect(preset.name).toBe('test-preset');
        expect(preset.enforce).toBe('pre');
      });
    });

    describe('Theme', () => {
      it('should define theme structure', () => {
        const theme: Theme = {
          colors: {
            primary: '#3b82f6',
            gray: { 100: '#f3f4f6', 900: '#111827' },
          },
          spacing: { '1': '0.25rem', '2': '0.5rem' },
          fontSize: { base: ['1rem', '1.5rem'] },
          fontFamily: { sans: 'Inter, sans-serif' },
          fontWeight: { bold: '700' },
          lineHeight: { normal: '1.5' },
          letterSpacing: { tight: '-0.025em' },
          borderRadius: { md: '0.375rem' },
          boxShadow: { sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)' },
          breakpoints: { sm: '640px', md: '768px' },
          zIndex: { modal: '1000' },
          animation: { spin: 'spin 1s linear infinite' },
          easing: { linear: 'linear' },
          duration: { fast: '150ms' },
        };
        expect(theme.colors?.primary).toBe('#3b82f6');
        expect(theme.breakpoints?.sm).toBe('640px');
      });
    });

    describe('RuleMeta', () => {
      it('should define rule metadata', () => {
        const meta: RuleMeta = {
          layer: 'utilities',
          sort: 10,
          prefix: 'un-',
          internal: false,
        };
        expect(meta.layer).toBe('utilities');
      });
    });

    describe('ShortcutMeta', () => {
      it('should define shortcut metadata', () => {
        const meta: ShortcutMeta = {
          layer: 'components',
        };
        expect(meta.layer).toBe('components');
      });
    });

    describe('Variant', () => {
      it('should define variant structure', () => {
        const variant: Variant = {
          name: 'hover',
          match: (input) => {
            if (input.startsWith('hover:')) {
              return { matcher: input.slice(6) };
            }
          },
          multiPass: false,
          autocomplete: 'hover:<utilities>',
        };
        expect(variant.name).toBe('hover');
        expect(typeof variant.match).toBe('function');
      });
    });

    describe('VariantMatchResult', () => {
      it('should define variant match result', () => {
        const result: VariantMatchResult = {
          matcher: 'bg-red-500',
          selector: (s) => `.dark ${s}`,
          parent: '@media (prefers-color-scheme: dark)',
          layer: 'dark',
          body: (body) => body,
        };
        expect(result.matcher).toBe('bg-red-500');
      });
    });

    describe('Preflight', () => {
      it('should define preflight structure', () => {
        const preflight: Preflight = {
          getCSS: ({ theme }) => '* { box-sizing: border-box; }',
          layer: 'base',
        };
        expect(typeof preflight.getCSS).toBe('function');
      });
    });

    describe('Extractor', () => {
      it('should define extractor structure', () => {
        const extractor: Extractor = {
          name: 'test-extractor',
          extract: (code) => new Set(['bg-red-500', 'text-white']),
          order: 0,
        };
        expect(extractor.name).toBe('test-extractor');
      });
    });

    describe('PhilJSPresetOptions', () => {
      it('should define preset options', () => {
        const options: PhilJSPresetOptions = {
          prefix: 'phil-',
          darkMode: 'class',
          colors: { brand: '#ff6b6b' },
          important: true,
          attributify: true,
          tagify: true,
          icons: { scale: 1.2 },
          typography: { selectorName: 'prose' },
          webFonts: { provider: 'google' },
          variantGroup: true,
          componentPrefix: 'phil-',
        };
        expect(options.darkMode).toBe('class');
        expect(options.attributify).toBe(true);
      });
    });

    describe('IconsOptions', () => {
      it('should define icons options', () => {
        const options: IconsOptions = {
          scale: 1.5,
          mode: 'mask',
          warn: true,
          collections: { custom: { home: '<svg>...</svg>' } },
          extraProperties: { 'vertical-align': 'middle' },
          cdn: 'https://icons.example.com',
        };
        expect(options.scale).toBe(1.5);
        expect(options.mode).toBe('mask');
      });
    });

    describe('TypographyOptions', () => {
      it('should define typography options', () => {
        const options: TypographyOptions = {
          cssExtend: { h1: { 'font-size': '2.5rem' } },
          selectorName: 'prose',
        };
        expect(options.selectorName).toBe('prose');
      });
    });

    describe('WebFontsOptions', () => {
      it('should define web fonts options', () => {
        const options: WebFontsOptions = {
          provider: 'google',
          fonts: {
            sans: 'Inter',
            mono: ['JetBrains Mono', { name: 'Fira Code', weights: [400, 700] }],
          },
        };
        expect(options.provider).toBe('google');
      });
    });

    describe('WebFontMeta', () => {
      it('should define web font metadata', () => {
        const meta: WebFontMeta = {
          name: 'Inter',
          weights: [400, 500, 600, 700],
          italic: true,
          provider: 'google',
        };
        expect(meta.name).toBe('Inter');
        expect(meta.weights).toContain(400);
      });
    });

    describe('AttributifyAttributes', () => {
      it('should define attributify attributes', () => {
        const attrs: AttributifyAttributes = {
          flex: true,
          p: '4',
          m: 2,
          w: 'full',
          text: 'lg',
          bg: 'primary-500',
          rounded: true,
          shadow: 'md',
          hover: 'bg-primary-600',
          dark: 'bg-gray-800',
          sm: 'text-sm',
        };
        expect(attrs.flex).toBe(true);
        expect(attrs.p).toBe('4');
      });
    });
  });

  describe('Color System', () => {
    describe('philjsColors', () => {
      it('should define primary colors', () => {
        expect(philjsColors.primary).toBeDefined();
        expect(philjsColors.primary[500]).toBe('#3b82f6');
        expect(philjsColors.primary[50]).toBe('#eff6ff');
        expect(philjsColors.primary[950]).toBe('#172554');
      });

      it('should define secondary colors', () => {
        expect(philjsColors.secondary).toBeDefined();
        expect(philjsColors.secondary[500]).toBe('#8b5cf6');
      });

      it('should define accent colors', () => {
        expect(philjsColors.accent).toBeDefined();
        expect(philjsColors.accent[500]).toBe('#06b6d4');
      });

      it('should define success colors', () => {
        expect(philjsColors.success).toBeDefined();
        expect(philjsColors.success[500]).toBe('#22c55e');
      });

      it('should define warning colors', () => {
        expect(philjsColors.warning).toBeDefined();
        expect(philjsColors.warning[500]).toBe('#f59e0b');
      });

      it('should define error colors', () => {
        expect(philjsColors.error).toBeDefined();
        expect(philjsColors.error[500]).toBe('#ef4444');
      });

      it('should define neutral colors', () => {
        expect(philjsColors.neutral).toBeDefined();
        expect(philjsColors.neutral[500]).toBe('#737373');
      });

      it('should define base colors', () => {
        expect(philjsColors.white).toBe('#ffffff');
        expect(philjsColors.black).toBe('#000000');
        expect(philjsColors.transparent).toBe('transparent');
        expect(philjsColors.current).toBe('currentColor');
      });
    });
  });

  describe('Spacing System', () => {
    describe('philjsSpacing', () => {
      it('should define spacing scale', () => {
        expect(philjsSpacing['0']).toBe('0');
        expect(philjsSpacing['px']).toBe('1px');
        expect(philjsSpacing['1']).toBe('0.25rem');
        expect(philjsSpacing['4']).toBe('1rem');
        expect(philjsSpacing['8']).toBe('2rem');
        expect(philjsSpacing['16']).toBe('4rem');
        expect(philjsSpacing['96']).toBe('24rem');
      });

      it('should include fractional values', () => {
        expect(philjsSpacing['0.5']).toBe('0.125rem');
        expect(philjsSpacing['1.5']).toBe('0.375rem');
        expect(philjsSpacing['2.5']).toBe('0.625rem');
      });
    });
  });

  describe('Typography System', () => {
    describe('philjsFontSizes', () => {
      it('should define font sizes with line heights', () => {
        expect(philjsFontSizes.xs).toEqual(['0.75rem', '1rem']);
        expect(philjsFontSizes.base).toEqual(['1rem', '1.5rem']);
        expect(philjsFontSizes['4xl']).toEqual(['2.25rem', '2.5rem']);
        expect(philjsFontSizes['9xl']).toEqual(['8rem', '1']);
      });
    });

    describe('philjsFontWeights', () => {
      it('should define font weights', () => {
        expect(philjsFontWeights.thin).toBe('100');
        expect(philjsFontWeights.normal).toBe('400');
        expect(philjsFontWeights.bold).toBe('700');
        expect(philjsFontWeights.black).toBe('900');
      });
    });

    describe('philjsFontFamilies', () => {
      it('should define font families', () => {
        expect(philjsFontFamilies.sans).toContain('sans-serif');
        expect(philjsFontFamilies.serif).toContain('serif');
        expect(philjsFontFamilies.mono).toContain('monospace');
      });
    });

    describe('philjsLineHeights', () => {
      it('should define line heights', () => {
        expect(philjsLineHeights.none).toBe('1');
        expect(philjsLineHeights.normal).toBe('1.5');
        expect(philjsLineHeights.loose).toBe('2');
      });
    });

    describe('philjsLetterSpacing', () => {
      it('should define letter spacing', () => {
        expect(philjsLetterSpacing.tighter).toBe('-0.05em');
        expect(philjsLetterSpacing.normal).toBe('0em');
        expect(philjsLetterSpacing.widest).toBe('0.1em');
      });
    });
  });

  describe('Border & Effects', () => {
    describe('philjsBorderRadius', () => {
      it('should define border radii', () => {
        expect(philjsBorderRadius.none).toBe('0');
        expect(philjsBorderRadius.sm).toBe('0.125rem');
        expect(philjsBorderRadius.DEFAULT).toBe('0.25rem');
        expect(philjsBorderRadius.lg).toBe('0.5rem');
        expect(philjsBorderRadius.full).toBe('9999px');
      });
    });

    describe('philjsBoxShadows', () => {
      it('should define box shadows', () => {
        expect(philjsBoxShadows.xs).toBeDefined();
        expect(philjsBoxShadows.sm).toBeDefined();
        expect(philjsBoxShadows.lg).toBeDefined();
        expect(philjsBoxShadows.inner).toContain('inset');
        expect(philjsBoxShadows.none).toBe('none');
      });
    });
  });

  describe('Layout System', () => {
    describe('philjsBreakpoints', () => {
      it('should define breakpoints', () => {
        expect(philjsBreakpoints.sm).toBe('640px');
        expect(philjsBreakpoints.md).toBe('768px');
        expect(philjsBreakpoints.lg).toBe('1024px');
        expect(philjsBreakpoints.xl).toBe('1280px');
        expect(philjsBreakpoints['2xl']).toBe('1536px');
      });
    });

    describe('philjsZIndex', () => {
      it('should define z-index scale', () => {
        expect(philjsZIndex.auto).toBe('auto');
        expect(philjsZIndex['0']).toBe('0');
        expect(philjsZIndex['50']).toBe('50');
        expect(philjsZIndex.modal).toBe('1400');
        expect(philjsZIndex.tooltip).toBe('1600');
        expect(philjsZIndex.toast).toBe('1700');
      });
    });
  });

  describe('Animation System', () => {
    describe('philjsAnimations', () => {
      it('should define animations', () => {
        expect(philjsAnimations.none).toBe('none');
        expect(philjsAnimations.spin).toContain('philjs-spin');
        expect(philjsAnimations.ping).toContain('philjs-ping');
        expect(philjsAnimations.pulse).toContain('philjs-pulse');
        expect(philjsAnimations.bounce).toContain('philjs-bounce');
        expect(philjsAnimations['fade-in']).toContain('philjs-fade-in');
        expect(philjsAnimations['slide-in-up']).toContain('philjs-slide-in-up');
      });
    });

    describe('philjsDurations', () => {
      it('should define durations', () => {
        expect(philjsDurations['0']).toBe('0ms');
        expect(philjsDurations['100']).toBe('100ms');
        expect(philjsDurations['300']).toBe('300ms');
        expect(philjsDurations['1000']).toBe('1000ms');
      });
    });

    describe('philjsEasings', () => {
      it('should define easing functions', () => {
        expect(philjsEasings.linear).toBe('linear');
        expect(philjsEasings.in).toContain('cubic-bezier');
        expect(philjsEasings.out).toContain('cubic-bezier');
        expect(philjsEasings['in-out']).toContain('cubic-bezier');
        expect(philjsEasings.bounce).toContain('cubic-bezier');
      });
    });
  });

  describe('Complete Theme', () => {
    describe('philjsTheme', () => {
      it('should include all theme values', () => {
        expect(philjsTheme.colors).toBeDefined();
        expect(philjsTheme.spacing).toBeDefined();
        expect(philjsTheme.fontSize).toBeDefined();
        expect(philjsTheme.fontFamily).toBeDefined();
        expect(philjsTheme.fontWeight).toBeDefined();
        expect(philjsTheme.lineHeight).toBeDefined();
        expect(philjsTheme.letterSpacing).toBeDefined();
        expect(philjsTheme.borderRadius).toBeDefined();
        expect(philjsTheme.boxShadow).toBeDefined();
        expect(philjsTheme.breakpoints).toBeDefined();
        expect(philjsTheme.zIndex).toBeDefined();
        expect(philjsTheme.animation).toBeDefined();
        expect(philjsTheme.duration).toBeDefined();
        expect(philjsTheme.easing).toBeDefined();
      });
    });
  });

  describe('Rules', () => {
    describe('philjsRules', () => {
      it('should be an array of rules', () => {
        expect(Array.isArray(philjsRules)).toBe(true);
        expect(philjsRules.length).toBeGreaterThan(0);
      });

      it('should include signal animation rules', () => {
        const signalRules = philjsRules.filter(rule =>
          Array.isArray(rule) && rule[0] instanceof RegExp && rule[0].source.includes('signal')
        );
        expect(signalRules.length).toBeGreaterThan(0);
      });

      it('should include loading state rules', () => {
        const loadingRule = philjsRules.find(rule =>
          Array.isArray(rule) && rule[0] instanceof RegExp && rule[0].source === '^loading$'
        );
        expect(loadingRule).toBeDefined();
      });

      it('should include glass morphism rules', () => {
        const glassRule = philjsRules.find(rule =>
          Array.isArray(rule) && rule[0] instanceof RegExp && rule[0].source === '^glass$'
        );
        expect(glassRule).toBeDefined();
      });

      it('should include safe area inset rules', () => {
        const safeTopRule = philjsRules.find(rule =>
          Array.isArray(rule) && rule[0] instanceof RegExp && rule[0].source === '^safe-top$'
        );
        expect(safeTopRule).toBeDefined();
      });
    });
  });

  describe('Shortcuts', () => {
    describe('philjsShortcuts', () => {
      it('should be an array of shortcuts', () => {
        expect(Array.isArray(philjsShortcuts)).toBe(true);
        expect(philjsShortcuts.length).toBeGreaterThan(0);
      });

      it('should include button shortcuts', () => {
        const btnShortcut = philjsShortcuts.find(s => s[0] === 'btn');
        expect(btnShortcut).toBeDefined();
        expect(btnShortcut![1]).toContain('flex');
      });

      it('should include button variants', () => {
        const variants = ['btn-primary', 'btn-secondary', 'btn-success', 'btn-error'];
        for (const variant of variants) {
          const shortcut = philjsShortcuts.find(s => s[0] === variant);
          expect(shortcut).toBeDefined();
        }
      });

      it('should include card shortcuts', () => {
        const cardShortcut = philjsShortcuts.find(s => s[0] === 'card');
        expect(cardShortcut).toBeDefined();
      });

      it('should include form element shortcuts', () => {
        const inputShortcut = philjsShortcuts.find(s => s[0] === 'input');
        const labelShortcut = philjsShortcuts.find(s => s[0] === 'label');
        expect(inputShortcut).toBeDefined();
        expect(labelShortcut).toBeDefined();
      });

      it('should include layout shortcuts', () => {
        const centerShortcut = philjsShortcuts.find(s => s[0] === 'center');
        const stackShortcut = philjsShortcuts.find(s => s[0] === 'stack');
        expect(centerShortcut).toBeDefined();
        expect(stackShortcut).toBeDefined();
      });

      it('should include badge shortcuts', () => {
        const badgeShortcut = philjsShortcuts.find(s => s[0] === 'badge');
        const badgePrimary = philjsShortcuts.find(s => s[0] === 'badge-primary');
        expect(badgeShortcut).toBeDefined();
        expect(badgePrimary).toBeDefined();
      });
    });
  });

  describe('Variants', () => {
    describe('philjsVariants', () => {
      it('should be an array of variants', () => {
        expect(Array.isArray(philjsVariants)).toBe(true);
        expect(philjsVariants.length).toBeGreaterThan(0);
      });

      it('should include signal variant', () => {
        const signalVariant = philjsVariants.find(v => v.name === 'signal');
        expect(signalVariant).toBeDefined();
        expect(signalVariant!.match('signal:bg-red-500', {})).toBeDefined();
      });

      it('should include island variant', () => {
        const islandVariant = philjsVariants.find(v => v.name === 'island');
        expect(islandVariant).toBeDefined();
      });

      it('should include hydrated variant', () => {
        const hydratedVariant = philjsVariants.find(v => v.name === 'hydrated');
        expect(hydratedVariant).toBeDefined();
      });

      it('should include light variant', () => {
        const lightVariant = philjsVariants.find(v => v.name === 'light');
        expect(lightVariant).toBeDefined();
      });

      it('should include media query variants', () => {
        const contrastVariant = philjsVariants.find(v => v.name === 'contrast');
        const printVariant = philjsVariants.find(v => v.name === 'print');
        expect(contrastVariant).toBeDefined();
        expect(printVariant).toBeDefined();
      });

      it('should include orientation variants', () => {
        const portraitVariant = philjsVariants.find(v => v.name === 'portrait');
        const landscapeVariant = philjsVariants.find(v => v.name === 'landscape');
        expect(portraitVariant).toBeDefined();
        expect(landscapeVariant).toBeDefined();
      });

      it('should include container query variants', () => {
        const smVariant = philjsVariants.find(v => v.name === '@sm');
        const mdVariant = philjsVariants.find(v => v.name === '@md');
        expect(smVariant).toBeDefined();
        expect(mdVariant).toBeDefined();
      });

      it('should include group state variants', () => {
        const groupLoadingVariant = philjsVariants.find(v => v.name === 'group-loading');
        expect(groupLoadingVariant).toBeDefined();
      });
    });
  });

  describe('Preflights', () => {
    describe('philjsPreflights', () => {
      it('should be an array of preflights', () => {
        expect(Array.isArray(philjsPreflights)).toBe(true);
        expect(philjsPreflights.length).toBeGreaterThan(0);
      });

      it('should generate CSS reset', () => {
        const preflight = philjsPreflights[0];
        const css = preflight.getCSS({ theme: philjsTheme });
        expect(css).toContain('box-sizing: border-box');
        expect(css).toContain('margin: 0');
      });

      it('should generate animation keyframes', () => {
        const preflight = philjsPreflights[0];
        const css = preflight.getCSS({ theme: philjsTheme });
        expect(css).toContain('@keyframes philjs-spin');
        expect(css).toContain('@keyframes philjs-pulse');
        expect(css).toContain('@keyframes philjs-bounce');
        expect(css).toContain('@keyframes philjs-fade-in');
      });

      it('should generate scrollbar styles', () => {
        const preflight = philjsPreflights[0];
        const css = preflight.getCSS({ theme: philjsTheme });
        expect(css).toContain('::-webkit-scrollbar');
      });
    });
  });

  describe('Preset Factory', () => {
    describe('presetPhilJS', () => {
      it('should create a preset with default options', () => {
        const preset = presetPhilJS();
        expect(preset.name).toBe('@philjs/unocss');
        expect(preset.theme).toBeDefined();
        expect(preset.rules).toBeDefined();
        expect(preset.shortcuts).toBeDefined();
        expect(preset.variants).toBeDefined();
        expect(preset.preflights).toBeDefined();
      });

      it('should accept custom options', () => {
        const preset = presetPhilJS({
          prefix: 'phil-',
          darkMode: 'class',
          colors: { brand: '#ff6b6b' },
          important: true,
        });
        expect(preset.theme?.colors).toHaveProperty('brand');
      });

      it('should include layers', () => {
        const preset = presetPhilJS();
        expect(preset.layers).toBeDefined();
        expect(preset.layers!['philjs-base']).toBe(0);
        expect(preset.layers!['philjs-components']).toBe(10);
        expect(preset.layers!['philjs-utilities']).toBe(20);
      });
    });

    describe('presetPhilJSIcons', () => {
      it('should create an icons preset', () => {
        const preset = presetPhilJSIcons();
        expect(preset.name).toBe('@philjs/unocss-icons');
        expect(preset.rules).toBeDefined();
      });

      it('should accept custom options', () => {
        const preset = presetPhilJSIcons({
          scale: 1.5,
          mode: 'background',
        });
        expect(preset).toBeDefined();
      });
    });

    describe('presetPhilJSTypography', () => {
      it('should create a typography preset', () => {
        const preset = presetPhilJSTypography();
        expect(preset.name).toBe('@philjs/unocss-typography');
        expect(preset.rules).toBeDefined();
        expect(preset.shortcuts).toBeDefined();
        expect(preset.preflights).toBeDefined();
      });

      it('should accept custom selector name', () => {
        const preset = presetPhilJSTypography({ selectorName: 'article' });
        expect(preset).toBeDefined();
      });
    });
  });

  describe('Signal Integration', () => {
    describe('useTheme', () => {
      it('should return theme utilities', () => {
        const theme = useTheme();
        expect(theme.mode).toBeDefined();
        expect(theme.resolvedMode).toBeDefined();
        expect(theme.isDark).toBeDefined();
        expect(theme.isLight).toBeDefined();
        expect(typeof theme.setMode).toBe('function');
        expect(typeof theme.toggle).toBe('function');
        expect(typeof theme.setColor).toBe('function');
        expect(typeof theme.setCSSVar).toBe('function');
        expect(typeof theme.getCSSVar).toBe('function');
      });
    });

    describe('useConditionalClass', () => {
      it('should be a function', () => {
        expect(typeof useConditionalClass).toBe('function');
      });

      it('should return computed signal', () => {
        const condition = () => true;
        const result = useConditionalClass(condition, 'active', 'inactive');
        expect(result()).toBe('active');
      });

      it('should return false class when condition is false', () => {
        const condition = () => false;
        const result = useConditionalClass(condition, 'active', 'inactive');
        expect(result()).toBe('inactive');
      });
    });

    describe('useClasses', () => {
      it('should be a function', () => {
        expect(typeof useClasses).toBe('function');
      });

      it('should combine classes based on conditions', () => {
        const result = useClasses({
          'bg-red-500': true,
          'text-white': true,
          'hidden': false,
        });
        expect(result()).toContain('bg-red-500');
        expect(result()).toContain('text-white');
        expect(result()).not.toContain('hidden');
      });
    });

    describe('useVariant', () => {
      it('should be a function', () => {
        expect(typeof useVariant).toBe('function');
      });

      it('should return variant class based on value', () => {
        const value = () => 'primary' as const;
        const variants = {
          primary: 'bg-primary-500',
          secondary: 'bg-secondary-500',
        };
        const result = useVariant(value, variants);
        expect(result()).toBe('bg-primary-500');
      });

      it('should include base class', () => {
        const value = () => 'primary' as const;
        const variants = {
          primary: 'bg-primary-500',
          secondary: 'bg-secondary-500',
        };
        const result = useVariant(value, variants, 'btn');
        expect(result()).toBe('btn bg-primary-500');
      });
    });
  });

  describe('Runtime Utilities', () => {
    describe('uno', () => {
      it('should merge class names', () => {
        const result = uno('px-4', 'py-2', 'bg-red-500');
        expect(result).toBe('px-4 py-2 bg-red-500');
      });

      it('should handle undefined and null', () => {
        const result = uno('px-4', undefined, null, 'py-2');
        expect(result).toBe('px-4 py-2');
      });

      it('should handle false values', () => {
        const result = uno('px-4', false, 'py-2');
        expect(result).toBe('px-4 py-2');
      });

      it('should handle object syntax', () => {
        const result = uno('px-4', { 'bg-red-500': true, 'hidden': false });
        expect(result).toBe('px-4 bg-red-500');
      });

      it('should handle mixed inputs', () => {
        const isActive = true;
        const result = uno(
          'btn',
          isActive && 'btn-active',
          { 'text-white': true, 'text-black': false }
        );
        expect(result).toBe('btn btn-active text-white');
      });
    });

    describe('cva', () => {
      it('should create variant class builder', () => {
        const button = cva({
          base: 'btn',
          variants: {
            intent: {
              primary: 'bg-primary-500',
              secondary: 'bg-secondary-500',
            },
            size: {
              sm: 'text-sm',
              lg: 'text-lg',
            },
          },
          defaultVariants: {
            intent: 'primary',
            size: 'sm',
          },
        });

        expect(typeof button).toBe('function');
        expect(button()).toBe('btn bg-primary-500 text-sm');
      });

      it('should apply custom variants', () => {
        const button = cva({
          base: 'btn',
          variants: {
            intent: {
              primary: 'bg-primary-500',
              secondary: 'bg-secondary-500',
            },
          },
        });

        const result = button({ intent: 'secondary' });
        expect(result).toBe('btn bg-secondary-500');
      });

      it('should support compound variants', () => {
        const button = cva({
          base: 'btn',
          variants: {
            intent: {
              primary: 'bg-primary-500',
              secondary: 'bg-secondary-500',
            },
            size: {
              sm: 'text-sm',
              lg: 'text-lg',
            },
          },
          compoundVariants: [
            { intent: 'primary', size: 'lg', class: 'uppercase' },
          ],
        });

        const result = button({ intent: 'primary', size: 'lg' });
        expect(result).toContain('uppercase');
      });

      it('should allow additional class', () => {
        const button = cva({ base: 'btn' });
        const result = button({ class: 'mt-4' });
        expect(result).toBe('btn mt-4');
      });
    });

    describe('cssVar', () => {
      it('should create CSS variable reference', () => {
        const result = cssVar('primary-color');
        expect(result).toBe('var(--primary-color)');
      });

      it('should include fallback value', () => {
        const result = cssVar('primary-color', '#3b82f6');
        expect(result).toBe('var(--primary-color, #3b82f6)');
      });
    });

    describe('cssVars', () => {
      it('should create CSS variable object', () => {
        const result = cssVars({
          'primary-color': '#3b82f6',
          'spacing': '1rem',
          'opacity': 0.5,
        });
        expect(result['--primary-color']).toBe('#3b82f6');
        expect(result['--spacing']).toBe('1rem');
        expect(result['--opacity']).toBe('0.5');
      });
    });
  });

  describe('Configuration Helpers', () => {
    describe('defineConfig', () => {
      it('should create config with PhilJS defaults', () => {
        const config = defineConfig({});
        expect(config).toHaveProperty('presets');
        expect(config).toHaveProperty('theme');
        expect(config).toHaveProperty('rules');
        expect(config).toHaveProperty('shortcuts');
        expect(config).toHaveProperty('variants');
      });

      it('should merge custom presets', () => {
        const customPreset: Preset = { name: 'custom' };
        const config = defineConfig({ presets: [customPreset] }) as any;
        expect(config.presets.length).toBe(2);
      });

      it('should merge custom rules', () => {
        const customRule: Rule = [/^custom-(.+)$/, { color: 'red' }];
        const config = defineConfig({ rules: [customRule] }) as any;
        expect(config.rules.length).toBeGreaterThan(philjsRules.length);
      });
    });

    describe('extendTheme', () => {
      it('should extend base theme', () => {
        const extended = extendTheme({
          colors: { brand: '#ff6b6b' },
        });
        expect(extended.colors?.brand).toBe('#ff6b6b');
        expect(extended.colors?.primary).toBeDefined(); // Inherited from base
      });

      it('should merge nested objects', () => {
        const extended = extendTheme({
          spacing: { custom: '5rem' },
        });
        expect(extended.spacing?.custom).toBe('5rem');
        expect(extended.spacing?.['4']).toBe('1rem'); // Inherited
      });
    });

    describe('createColorPalette', () => {
      it('should create color palette from base color', () => {
        const palette = createColorPalette('brand', '#ff6b6b');
        expect(palette).toBeDefined();
        expect(palette['500']).toBeDefined();
        expect(palette['50']).toBeDefined();
        expect(palette['900']).toBeDefined();
      });

      it('should accept custom shades', () => {
        const palette = createColorPalette('brand', '#ff6b6b', {
          shades: [100, 500, 900],
        });
        expect(palette['100']).toBeDefined();
        expect(palette['500']).toBeDefined();
        expect(palette['900']).toBeDefined();
      });
    });
  });

  describe('Re-exports', () => {
    it('should re-export colors', () => {
      expect(colors).toBe(philjsColors);
    });

    it('should re-export spacing', () => {
      expect(spacing).toBe(philjsSpacing);
    });

    it('should re-export fontSizes', () => {
      expect(fontSizes).toBe(philjsFontSizes);
    });

    it('should re-export fontWeights', () => {
      expect(fontWeights).toBe(philjsFontWeights);
    });

    it('should re-export fontFamilies', () => {
      expect(fontFamilies).toBe(philjsFontFamilies);
    });

    it('should re-export lineHeights', () => {
      expect(lineHeights).toBe(philjsLineHeights);
    });

    it('should re-export letterSpacing', () => {
      expect(letterSpacing).toBe(philjsLetterSpacing);
    });

    it('should re-export borderRadius', () => {
      expect(borderRadius).toBe(philjsBorderRadius);
    });

    it('should re-export boxShadows', () => {
      expect(boxShadows).toBe(philjsBoxShadows);
    });

    it('should re-export breakpoints', () => {
      expect(breakpoints).toBe(philjsBreakpoints);
    });

    it('should re-export zIndex', () => {
      expect(zIndex).toBe(philjsZIndex);
    });

    it('should re-export animations', () => {
      expect(animations).toBe(philjsAnimations);
    });

    it('should re-export durations', () => {
      expect(durations).toBe(philjsDurations);
    });

    it('should re-export easings', () => {
      expect(easings).toBe(philjsEasings);
    });
  });
});
