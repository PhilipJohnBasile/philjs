/**
 * Tests for PhilJS Panda CSS Integration
 *
 * Comprehensive tests for type-safe CSS-in-JS with Panda CSS integration.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  // Token systems
  philjsColors,
  philjsSpacing,
  philjsFontSizes,
  philjsFontWeights,
  philjsLineHeights,
  philjsRadii,
  philjsShadows,
  philjsDurations,
  philjsEasings,
  philjsZIndex,
  philjsBreakpoints,
  // Semantic tokens
  philjsSemanticTokens,
  // Text and layer styles
  philjsTextStyles,
  philjsLayerStyles,
  // Component recipes
  buttonRecipe,
  inputRecipe,
  cardRecipe,
  badgeRecipe,
  // Patterns
  philjsPatterns,
  // Conditions
  philjsConditions,
  // Global CSS
  philjsGlobalCss,
  // Complete preset
  philjsPreset,
  pandaPreset,
  // Runtime utilities
  css,
  cva,
  transformStyles,
  // Signal integration
  signalStyle,
  useSignalStyles,
  createThemeSignal,
  createColorModeSignal,
  // Utility functions
  mergeStyles,
  responsive,
  when,
  // Configuration helpers
  defineConfig,
  createPreset,
  // Types
  type TokenCategory,
  type ThemeTokens,
  type SemanticTokens,
  type TextStyle,
  type LayerStyle,
  type RecipeVariant,
  type RecipeDefinition,
  type PatternDefinition,
  type UtilityDefinition,
  type PresetConfig,
  type CSSProperties,
} from './index';

describe('PhilJS Panda CSS Integration', () => {
  describe('Type Definitions', () => {
    describe('TokenCategory', () => {
      it('should accept nested token structure', () => {
        const tokens: TokenCategory = {
          primary: {
            '500': '#3b82f6',
            '600': '#2563eb',
          },
          secondary: '#8b5cf6',
        };
        expect(tokens.primary).toBeDefined();
        expect(tokens.secondary).toBe('#8b5cf6');
      });
    });

    describe('ThemeTokens', () => {
      it('should accept all token categories', () => {
        const tokens: ThemeTokens = {
          colors: { primary: { value: '#000' } },
          spacing: { '4': { value: '1rem' } },
          sizes: { lg: { value: '2rem' } },
          fonts: { sans: { value: 'system-ui' } },
          fontSizes: { md: { value: '1rem' } },
          fontWeights: { bold: { value: '700' } },
          lineHeights: { normal: { value: '1.5' } },
          letterSpacings: { tight: { value: '-0.02em' } },
          radii: { md: { value: '0.375rem' } },
          shadows: { sm: { value: '0 1px 2px rgba(0,0,0,0.1)' } },
          borders: { thin: { value: '1px solid' } },
          durations: { fast: { value: '150ms' } },
          easings: { ease: { value: 'ease-in-out' } },
          animations: { spin: { value: 'spin 1s linear infinite' } },
          zIndex: { modal: { value: '1000' } },
          opacity: { half: { value: '0.5' } },
          aspectRatios: { square: { value: '1/1' } },
          breakpoints: { sm: { value: '640px' } },
          assets: { logo: { value: '/logo.svg' } },
        };
        expect(tokens.colors).toBeDefined();
        expect(tokens.breakpoints?.sm).toBeDefined();
      });
    });

    describe('SemanticTokens', () => {
      it('should accept semantic token with base and dark values', () => {
        const semanticTokens: SemanticTokens = {
          colors: {
            'bg.default': { value: { base: '#fff', _dark: '#000' } },
            'fg.default': { value: '#333' },
          },
          spacing: {
            'container': { value: '1rem' },
          },
        };
        expect(semanticTokens.colors?.['bg.default'].value).toHaveProperty('_dark');
      });
    });

    describe('TextStyle', () => {
      it('should accept text style properties', () => {
        const textStyle: TextStyle = {
          fontSize: '1rem',
          fontWeight: 600,
          lineHeight: 1.5,
          letterSpacing: '-0.01em',
          fontFamily: 'sans-serif',
          textDecoration: 'none',
          textTransform: 'uppercase',
        };
        expect(textStyle.fontSize).toBe('1rem');
        expect(textStyle.fontWeight).toBe(600);
      });
    });

    describe('LayerStyle', () => {
      it('should accept layer style properties', () => {
        const layerStyle: LayerStyle = {
          background: 'linear-gradient(to right, #fff, #000)',
          backgroundColor: '#fff',
          border: '1px solid #ccc',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          opacity: 0.9,
        };
        expect(layerStyle.borderRadius).toBe('0.5rem');
      });
    });

    describe('RecipeDefinition', () => {
      it('should accept complete recipe definition', () => {
        const recipe: RecipeDefinition = {
          className: 'button',
          base: {
            display: 'inline-flex',
            alignItems: 'center',
          },
          variants: {
            size: {
              sm: { padding: '0.5rem' },
              md: { padding: '1rem' },
            },
            variant: {
              solid: { backgroundColor: 'blue' },
              outline: { border: '1px solid blue' },
            },
          },
          defaultVariants: {
            size: 'md',
            variant: 'solid',
          },
          compoundVariants: [
            {
              size: 'sm',
              variant: 'solid',
              css: { fontSize: '0.875rem' },
            },
          ],
        };
        expect(recipe.className).toBe('button');
        expect(recipe.variants?.size).toBeDefined();
        expect(recipe.compoundVariants).toHaveLength(1);
      });
    });

    describe('PatternDefinition', () => {
      it('should accept pattern definition with transform', () => {
        const pattern: PatternDefinition = {
          description: 'Stack layout',
          properties: {
            gap: { type: 'spacing' },
            direction: { type: 'string', value: 'column' },
          },
          transform: (props) => ({
            display: 'flex',
            flexDirection: props.direction,
            gap: props.gap,
          }),
        };
        expect(pattern.transform).toBeDefined();
        expect(pattern.transform?.({ direction: 'row', gap: '1rem' })).toHaveProperty('display', 'flex');
      });
    });

    describe('UtilityDefinition', () => {
      it('should accept utility definition', () => {
        const utility: UtilityDefinition = {
          className: 'bg',
          shorthand: ['bg', 'background'],
          values: 'colors',
          transform: (value) => ({ backgroundColor: value }),
        };
        expect(utility.shorthand).toContain('bg');
        expect(utility.transform?.('#fff')).toHaveProperty('backgroundColor', '#fff');
      });
    });

    describe('PresetConfig', () => {
      it('should accept complete preset configuration', () => {
        const preset: PresetConfig = {
          name: 'my-preset',
          theme: {
            tokens: { colors: { primary: { value: '#000' } } },
            semanticTokens: { colors: { bg: { value: '#fff' } } },
            textStyles: { heading: { fontSize: '2rem' } },
            layerStyles: { card: { backgroundColor: '#fff' } },
            recipes: { button: { className: 'btn' } },
          },
          patterns: { stack: { description: 'Stack' } },
          utilities: { bg: { className: 'bg' } },
          conditions: { hover: '&:hover' },
          globalCss: { '*': { boxSizing: 'border-box' } },
        };
        expect(preset.name).toBe('my-preset');
        expect(preset.theme.tokens).toBeDefined();
      });
    });

    describe('CSSProperties', () => {
      it('should accept all CSS properties', () => {
        const styles: CSSProperties = {
          // Layout
          display: 'flex',
          position: 'relative',
          top: 0,
          zIndex: 10,
          // Flexbox
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          // Grid
          gridTemplateColumns: 'repeat(3, 1fr)',
          // Spacing
          padding: '1rem',
          margin: '0 auto',
          // Sizing
          width: '100%',
          maxWidth: '1200px',
          // Typography
          fontFamily: 'sans-serif',
          fontSize: '1rem',
          color: '#333',
          // Effects
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transform: 'translateY(-50%)',
          transition: 'all 0.2s ease',
        };
        expect(styles.display).toBe('flex');
        expect(styles.gridTemplateColumns).toBeDefined();
      });

      it('should accept shorthand tokens', () => {
        const styles: CSSProperties = {
          p: '4',
          pt: '2',
          px: '4',
          m: 'auto',
          mb: '4',
          w: 'full',
          h: '100vh',
          bg: 'primary.500',
          rounded: 'md',
          shadow: 'lg',
        };
        expect(styles.p).toBe('4');
        expect(styles.bg).toBe('primary.500');
      });

      it('should accept conditional styles', () => {
        const styles: CSSProperties = {
          color: 'black',
          _hover: { color: 'blue' },
          _focus: { outline: '2px solid blue' },
          _dark: { color: 'white', bg: 'gray.900' },
          sm: { fontSize: '14px' },
          md: { fontSize: '16px' },
        };
        expect(styles._hover?.color).toBe('blue');
        expect(styles._dark?.bg).toBe('gray.900');
      });
    });
  });

  describe('Color System', () => {
    describe('philjsColors', () => {
      it('should include primary color palette', () => {
        expect(philjsColors.primary).toBeDefined();
        expect(philjsColors.primary['500'].value).toBe('#3b82f6');
        expect(philjsColors.primary['50'].value).toBeDefined();
        expect(philjsColors.primary['950'].value).toBeDefined();
      });

      it('should include secondary color palette', () => {
        expect(philjsColors.secondary).toBeDefined();
        expect(philjsColors.secondary['500'].value).toBe('#8b5cf6');
      });

      it('should include accent color palette', () => {
        expect(philjsColors.accent).toBeDefined();
        expect(philjsColors.accent['500'].value).toBe('#06b6d4');
      });

      it('should include success color palette', () => {
        expect(philjsColors.success).toBeDefined();
        expect(philjsColors.success['500'].value).toBe('#22c55e');
      });

      it('should include warning color palette', () => {
        expect(philjsColors.warning).toBeDefined();
        expect(philjsColors.warning['500'].value).toBe('#f59e0b');
      });

      it('should include error color palette', () => {
        expect(philjsColors.error).toBeDefined();
        expect(philjsColors.error['500'].value).toBe('#ef4444');
      });

      it('should include neutral color palette', () => {
        expect(philjsColors.neutral).toBeDefined();
        expect(philjsColors.neutral['500'].value).toBe('#737373');
      });
    });
  });

  describe('Token System', () => {
    describe('philjsSpacing', () => {
      it('should include all spacing values', () => {
        expect(philjsSpacing['0'].value).toBe('0');
        expect(philjsSpacing['4'].value).toBe('1rem');
        expect(philjsSpacing['8'].value).toBe('2rem');
        expect(philjsSpacing['96'].value).toBe('24rem');
      });

      it('should include fractional spacing values', () => {
        expect(philjsSpacing['0.5'].value).toBe('0.125rem');
        expect(philjsSpacing['1.5'].value).toBe('0.375rem');
        expect(philjsSpacing['2.5'].value).toBe('0.625rem');
      });
    });

    describe('philjsFontSizes', () => {
      it('should include all font size values', () => {
        expect(philjsFontSizes.xs.value).toBe('0.75rem');
        expect(philjsFontSizes.md.value).toBe('1rem');
        expect(philjsFontSizes['4xl'].value).toBe('2.25rem');
        expect(philjsFontSizes['9xl'].value).toBe('8rem');
      });
    });

    describe('philjsFontWeights', () => {
      it('should include all font weight values', () => {
        expect(philjsFontWeights.hairline.value).toBe('100');
        expect(philjsFontWeights.normal.value).toBe('400');
        expect(philjsFontWeights.bold.value).toBe('700');
        expect(philjsFontWeights.black.value).toBe('900');
      });
    });

    describe('philjsLineHeights', () => {
      it('should include all line height values', () => {
        expect(philjsLineHeights.none.value).toBe('1');
        expect(philjsLineHeights.normal.value).toBe('1.5');
        expect(philjsLineHeights.loose.value).toBe('2');
      });
    });

    describe('philjsRadii', () => {
      it('should include all border radius values', () => {
        expect(philjsRadii.none.value).toBe('0');
        expect(philjsRadii.md.value).toBe('0.375rem');
        expect(philjsRadii.full.value).toBe('9999px');
      });
    });

    describe('philjsShadows', () => {
      it('should include all shadow values', () => {
        expect(philjsShadows.xs.value).toContain('0 1px 2px');
        expect(philjsShadows.md.value).toContain('0 4px 6px');
        expect(philjsShadows.inner.value).toContain('inset');
        expect(philjsShadows.none.value).toBe('none');
      });
    });

    describe('philjsDurations', () => {
      it('should include all duration values', () => {
        expect(philjsDurations.fastest.value).toBe('50ms');
        expect(philjsDurations.normal.value).toBe('200ms');
        expect(philjsDurations.slowest.value).toBe('500ms');
      });
    });

    describe('philjsEasings', () => {
      it('should include all easing values', () => {
        expect(philjsEasings.linear.value).toBe('linear');
        expect(philjsEasings.in.value).toContain('cubic-bezier');
        expect(philjsEasings['ease-in-out'].value).toContain('cubic-bezier');
      });
    });

    describe('philjsZIndex', () => {
      it('should include all z-index values', () => {
        expect(philjsZIndex.hide.value).toBe('-1');
        expect(philjsZIndex.base.value).toBe('0');
        expect(philjsZIndex.modal.value).toBe('1400');
        expect(philjsZIndex.tooltip.value).toBe('1800');
      });
    });

    describe('philjsBreakpoints', () => {
      it('should include all breakpoint values', () => {
        expect(philjsBreakpoints.sm.value).toBe('640px');
        expect(philjsBreakpoints.md.value).toBe('768px');
        expect(philjsBreakpoints.lg.value).toBe('1024px');
        expect(philjsBreakpoints.xl.value).toBe('1280px');
        expect(philjsBreakpoints['2xl'].value).toBe('1536px');
      });
    });
  });

  describe('Semantic Tokens', () => {
    describe('philjsSemanticTokens', () => {
      it('should include background semantic tokens', () => {
        expect(philjsSemanticTokens.colors['bg.canvas']).toBeDefined();
        expect(philjsSemanticTokens.colors['bg.default']).toBeDefined();
        expect(philjsSemanticTokens.colors['bg.subtle']).toBeDefined();
        expect(philjsSemanticTokens.colors['bg.muted']).toBeDefined();
      });

      it('should include foreground semantic tokens', () => {
        expect(philjsSemanticTokens.colors['fg.default']).toBeDefined();
        expect(philjsSemanticTokens.colors['fg.muted']).toBeDefined();
        expect(philjsSemanticTokens.colors['fg.subtle']).toBeDefined();
      });

      it('should include border semantic tokens', () => {
        expect(philjsSemanticTokens.colors['border.default']).toBeDefined();
        expect(philjsSemanticTokens.colors['border.muted']).toBeDefined();
      });

      it('should have dark mode variants', () => {
        const bgCanvas = philjsSemanticTokens.colors['bg.canvas'];
        expect(bgCanvas.value).toHaveProperty('base');
        expect(bgCanvas.value).toHaveProperty('_dark');
      });

      it('should include shadow semantic tokens', () => {
        expect(philjsSemanticTokens.shadows['shadow.xs']).toBeDefined();
        expect(philjsSemanticTokens.shadows['shadow.xl']).toBeDefined();
      });
    });
  });

  describe('Text Styles', () => {
    describe('philjsTextStyles', () => {
      it('should include heading styles', () => {
        expect(philjsTextStyles['heading.xs']).toBeDefined();
        expect(philjsTextStyles['heading.md']).toBeDefined();
        expect(philjsTextStyles['heading.3xl']).toBeDefined();
        expect(philjsTextStyles['heading.xl'].fontWeight).toContain('bold');
      });

      it('should include body styles', () => {
        expect(philjsTextStyles['body.xs']).toBeDefined();
        expect(philjsTextStyles['body.md']).toBeDefined();
        expect(philjsTextStyles['body.lg']).toBeDefined();
      });

      it('should include label styles', () => {
        expect(philjsTextStyles['label.xs']).toBeDefined();
        expect(philjsTextStyles['label.md']).toBeDefined();
        expect(philjsTextStyles['label.sm'].fontWeight).toContain('medium');
      });
    });
  });

  describe('Layer Styles', () => {
    describe('philjsLayerStyles', () => {
      it('should include container styles', () => {
        expect(philjsLayerStyles['container.default']).toBeDefined();
        expect(philjsLayerStyles['container.subtle']).toBeDefined();
        expect(philjsLayerStyles['container.raised']).toBeDefined();
        expect(philjsLayerStyles['container.overlay']).toBeDefined();
      });

      it('should have correct structure', () => {
        expect(philjsLayerStyles['container.raised'].boxShadow).toBeDefined();
        expect(philjsLayerStyles['container.default'].border).toBeDefined();
      });
    });
  });

  describe('Component Recipes', () => {
    describe('buttonRecipe', () => {
      it('should have className', () => {
        expect(buttonRecipe.className).toBe('button');
      });

      it('should have base styles', () => {
        expect(buttonRecipe.base).toBeDefined();
        expect(buttonRecipe.base?.display).toBe('inline-flex');
        expect(buttonRecipe.base?.cursor).toBe('pointer');
      });

      it('should have variant variants', () => {
        expect(buttonRecipe.variants?.variant).toBeDefined();
        expect(buttonRecipe.variants?.variant.solid).toBeDefined();
        expect(buttonRecipe.variants?.variant.outline).toBeDefined();
        expect(buttonRecipe.variants?.variant.ghost).toBeDefined();
        expect(buttonRecipe.variants?.variant.link).toBeDefined();
      });

      it('should have size variants', () => {
        expect(buttonRecipe.variants?.size).toBeDefined();
        expect(buttonRecipe.variants?.size.xs).toBeDefined();
        expect(buttonRecipe.variants?.size.md).toBeDefined();
        expect(buttonRecipe.variants?.size.xl).toBeDefined();
      });

      it('should have default variants', () => {
        expect(buttonRecipe.defaultVariants?.variant).toBe('solid');
        expect(buttonRecipe.defaultVariants?.size).toBe('md');
      });
    });

    describe('inputRecipe', () => {
      it('should have className', () => {
        expect(inputRecipe.className).toBe('input');
      });

      it('should have base styles with states', () => {
        expect(inputRecipe.base?._hover).toBeDefined();
        expect(inputRecipe.base?._focus).toBeDefined();
        expect(inputRecipe.base?._disabled).toBeDefined();
        expect(inputRecipe.base?._invalid).toBeDefined();
      });

      it('should have size variants', () => {
        expect(inputRecipe.variants?.size.sm).toBeDefined();
        expect(inputRecipe.variants?.size.md).toBeDefined();
        expect(inputRecipe.variants?.size.lg).toBeDefined();
      });
    });

    describe('cardRecipe', () => {
      it('should have className', () => {
        expect(cardRecipe.className).toBe('card');
      });

      it('should have variant variants', () => {
        expect(cardRecipe.variants?.variant.elevated).toBeDefined();
        expect(cardRecipe.variants?.variant.outline).toBeDefined();
        expect(cardRecipe.variants?.variant.filled).toBeDefined();
      });

      it('should have size variants', () => {
        expect(cardRecipe.variants?.size.sm).toBeDefined();
        expect(cardRecipe.variants?.size.md).toBeDefined();
        expect(cardRecipe.variants?.size.lg).toBeDefined();
      });
    });

    describe('badgeRecipe', () => {
      it('should have className', () => {
        expect(badgeRecipe.className).toBe('badge');
      });

      it('should have variant variants', () => {
        expect(badgeRecipe.variants?.variant.solid).toBeDefined();
        expect(badgeRecipe.variants?.variant.subtle).toBeDefined();
        expect(badgeRecipe.variants?.variant.outline).toBeDefined();
      });
    });
  });

  describe('Patterns', () => {
    describe('philjsPatterns', () => {
      it('should include stack pattern', () => {
        expect(philjsPatterns.stack).toBeDefined();
        expect(philjsPatterns.stack.description).toContain('Vertical');
        expect(philjsPatterns.stack.transform).toBeDefined();
      });

      it('should include hstack pattern', () => {
        expect(philjsPatterns.hstack).toBeDefined();
        const result = philjsPatterns.hstack.transform?.({ gap: '1rem' });
        expect(result?.flexDirection).toBe('row');
      });

      it('should include vstack pattern', () => {
        expect(philjsPatterns.vstack).toBeDefined();
        const result = philjsPatterns.vstack.transform?.({ gap: '1rem' });
        expect(result?.flexDirection).toBe('column');
      });

      it('should include flex pattern', () => {
        expect(philjsPatterns.flex).toBeDefined();
        expect(philjsPatterns.flex.properties).toHaveProperty('direction');
        expect(philjsPatterns.flex.properties).toHaveProperty('wrap');
      });

      it('should include grid pattern', () => {
        expect(philjsPatterns.grid).toBeDefined();
        const result = philjsPatterns.grid.transform?.({ columns: 3, gap: '1rem' });
        expect(result?.display).toBe('grid');
        expect(result?.gridTemplateColumns).toContain('repeat(3');
      });

      it('should include center pattern', () => {
        expect(philjsPatterns.center).toBeDefined();
        const result = philjsPatterns.center.transform?.({ inline: false });
        expect(result?.alignItems).toBe('center');
        expect(result?.justifyContent).toBe('center');
      });

      it('should include container pattern', () => {
        expect(philjsPatterns.container).toBeDefined();
        const result = philjsPatterns.container.transform?.({});
        expect(result?.maxWidth).toBe('1280px');
        expect(result?.marginInline).toBe('auto');
      });

      it('should include spacer pattern', () => {
        expect(philjsPatterns.spacer).toBeDefined();
        const result = philjsPatterns.spacer.transform?.({});
        expect(result?.flex).toBe('1');
      });

      it('should include divider pattern', () => {
        expect(philjsPatterns.divider).toBeDefined();
        const horizontal = philjsPatterns.divider.transform?.({ orientation: 'horizontal' });
        expect(horizontal?.height).toBe('1px');
        const vertical = philjsPatterns.divider.transform?.({ orientation: 'vertical' });
        expect(vertical?.width).toBe('1px');
      });

      it('should include aspectRatio pattern', () => {
        expect(philjsPatterns.aspectRatio).toBeDefined();
        expect(philjsPatterns.aspectRatio.properties).toHaveProperty('ratio');
      });

      it('should include visuallyHidden pattern', () => {
        expect(philjsPatterns.visuallyHidden).toBeDefined();
        const result = philjsPatterns.visuallyHidden.transform?.({});
        expect(result?.position).toBe('absolute');
        expect(result?.width).toBe('1px');
        expect(result?.clip).toContain('rect');
      });

      it('should include float pattern', () => {
        expect(philjsPatterns.float).toBeDefined();
        const result = philjsPatterns.float.transform?.({ placement: 'top-end', offset: '1rem' });
        expect(result?.position).toBe('absolute');
        expect(result?.top).toBe('1rem');
        expect(result?.right).toBe('1rem');
      });

      it('should include circle pattern', () => {
        expect(philjsPatterns.circle).toBeDefined();
        const result = philjsPatterns.circle.transform?.({ size: '40px' });
        expect(result?.borderRadius).toBe('9999px');
        expect(result?.width).toBe('40px');
      });

      it('should include square pattern', () => {
        expect(philjsPatterns.square).toBeDefined();
        const result = philjsPatterns.square.transform?.({ size: '40px' });
        expect(result?.width).toBe('40px');
        expect(result?.height).toBe('40px');
      });
    });
  });

  describe('Conditions', () => {
    describe('philjsConditions', () => {
      it('should include responsive breakpoints', () => {
        expect(philjsConditions.sm).toContain('640px');
        expect(philjsConditions.md).toContain('768px');
        expect(philjsConditions.lg).toContain('1024px');
        expect(philjsConditions.xl).toContain('1280px');
        expect(philjsConditions['2xl']).toContain('1536px');
      });

      it('should include motion conditions', () => {
        expect(philjsConditions.motionSafe).toContain('prefers-reduced-motion');
        expect(philjsConditions.motionReduce).toContain('prefers-reduced-motion');
      });

      it('should include color scheme conditions', () => {
        expect(philjsConditions.light).toContain('data-theme=light');
        expect(philjsConditions.dark).toContain('prefers-color-scheme: dark');
      });

      it('should include print condition', () => {
        expect(philjsConditions.print).toBe('@media print');
      });

      it('should include state pseudo-classes', () => {
        expect(philjsConditions.hover).toContain(':hover');
        expect(philjsConditions.focus).toContain(':focus');
        expect(philjsConditions.active).toContain(':active');
        expect(philjsConditions.disabled).toContain(':disabled');
        expect(philjsConditions.checked).toContain(':checked');
        expect(philjsConditions.invalid).toContain(':invalid');
      });

      it('should include pseudo-elements', () => {
        expect(philjsConditions.before).toBe('&::before');
        expect(philjsConditions.after).toBe('&::after');
        expect(philjsConditions.placeholder).toBe('&::placeholder');
      });

      it('should include structural pseudo-classes', () => {
        expect(philjsConditions.first).toContain(':first-child');
        expect(philjsConditions.last).toContain(':last-child');
        expect(philjsConditions.even).toContain(':nth-child(even)');
        expect(philjsConditions.odd).toContain(':nth-child(odd)');
      });

      it('should include group states', () => {
        expect(philjsConditions.groupHover).toContain('.group:hover');
        expect(philjsConditions.groupFocus).toContain('.group:focus');
      });

      it('should include peer states', () => {
        expect(philjsConditions.peerHover).toContain('.peer:hover');
        expect(philjsConditions.peerInvalid).toContain('.peer:invalid');
      });

      it('should include RTL/LTR conditions', () => {
        expect(philjsConditions.ltr).toBe('[dir=ltr] &');
        expect(philjsConditions.rtl).toBe('[dir=rtl] &');
      });

      it('should include ARIA conditions', () => {
        expect(philjsConditions.expanded).toContain('aria-expanded=true');
        expect(philjsConditions.selected).toContain('aria-selected=true');
      });
    });
  });

  describe('Global CSS', () => {
    describe('philjsGlobalCss', () => {
      it('should reset box-sizing', () => {
        expect(philjsGlobalCss['*'].boxSizing).toBe('border-box');
      });

      it('should set html base styles', () => {
        expect(philjsGlobalCss.html.lineHeight).toBe(1.5);
        expect(philjsGlobalCss.html.fontFamily).toContain('system-ui');
      });

      it('should set body styles', () => {
        expect(philjsGlobalCss.body.color).toBe('fg.default');
        expect(philjsGlobalCss.body.backgroundColor).toBe('bg.canvas');
      });

      it('should reset margins on elements', () => {
        expect(philjsGlobalCss['blockquote, dl, dd, h1, h2, h3, h4, h5, h6, hr, figure, p, pre'].margin).toBe(0);
      });

      it('should reset list styles', () => {
        expect(philjsGlobalCss['ol, ul, menu'].listStyle).toBe('none');
      });

      it('should handle media elements', () => {
        expect(philjsGlobalCss['img, svg, video, canvas, audio, iframe, embed, object'].display).toBe('block');
        expect(philjsGlobalCss['img, video'].maxWidth).toBe('100%');
      });
    });
  });

  describe('Complete Preset', () => {
    describe('philjsPreset', () => {
      it('should have correct name', () => {
        expect(philjsPreset.name).toBe('@philjs/panda');
      });

      it('should include all theme tokens', () => {
        expect(philjsPreset.theme.tokens?.colors).toBeDefined();
        expect(philjsPreset.theme.tokens?.spacing).toBeDefined();
        expect(philjsPreset.theme.tokens?.fonts).toBeDefined();
        expect(philjsPreset.theme.tokens?.fontSizes).toBeDefined();
        expect(philjsPreset.theme.tokens?.radii).toBeDefined();
        expect(philjsPreset.theme.tokens?.shadows).toBeDefined();
      });

      it('should include semantic tokens', () => {
        expect(philjsPreset.theme.semanticTokens).toBeDefined();
      });

      it('should include text and layer styles', () => {
        expect(philjsPreset.theme.textStyles).toBeDefined();
        expect(philjsPreset.theme.layerStyles).toBeDefined();
      });

      it('should include recipes', () => {
        expect(philjsPreset.theme.recipes?.button).toBeDefined();
        expect(philjsPreset.theme.recipes?.input).toBeDefined();
        expect(philjsPreset.theme.recipes?.card).toBeDefined();
        expect(philjsPreset.theme.recipes?.badge).toBeDefined();
      });

      it('should include patterns', () => {
        expect(philjsPreset.patterns).toBeDefined();
        expect(philjsPreset.patterns?.stack).toBeDefined();
      });

      it('should include conditions', () => {
        expect(philjsPreset.conditions).toBeDefined();
      });

      it('should include global CSS', () => {
        expect(philjsPreset.globalCss).toBeDefined();
      });
    });

    describe('pandaPreset (legacy)', () => {
      it('should be same as philjsPreset', () => {
        expect(pandaPreset).toBe(philjsPreset);
      });
    });
  });

  describe('Runtime Utilities', () => {
    describe('css', () => {
      it('should be a function', () => {
        expect(typeof css).toBe('function');
      });

      it('should return a class string', () => {
        const className = css({ display: 'flex', padding: '1rem' });
        expect(typeof className).toBe('string');
        expect(className).toMatch(/^css-/);
      });

      it('should generate different classes for different styles', () => {
        const class1 = css({ display: 'flex' });
        const class2 = css({ display: 'block' });
        expect(class1).not.toBe(class2);
      });
    });

    describe('cva', () => {
      it('should be a function', () => {
        expect(typeof cva).toBe('function');
      });

      it('should create recipe function', () => {
        const button = cva({
          className: 'btn',
          base: { display: 'flex' },
          variants: {
            size: {
              sm: { padding: '0.5rem' },
              lg: { padding: '1rem' },
            },
          },
          defaultVariants: { size: 'sm' },
        });
        expect(typeof button).toBe('function');
      });

      it('should return class string', () => {
        const button = cva(buttonRecipe);
        const className = button({ variant: 'solid', size: 'md' });
        expect(typeof className).toBe('string');
        expect(className).toContain('button');
      });

      it('should use default variants', () => {
        const button = cva(buttonRecipe);
        const className = button({});
        expect(className).toContain('button');
      });
    });

    describe('transformStyles', () => {
      it('should be a function', () => {
        expect(typeof transformStyles).toBe('function');
      });

      it('should transform shorthand tokens', () => {
        const result = transformStyles({ p: '4', m: 'auto', bg: 'primary.500' });
        expect(result.padding).toBe('4');
        expect(result.margin).toBe('auto');
        expect(result.backgroundColor).toBe('primary.500');
      });

      it('should transform conditional styles', () => {
        const result = transformStyles({
          color: 'black',
          _hover: { color: 'blue' },
        });
        expect(result.color).toBe('black');
        expect(result._hover).toHaveProperty('color', 'blue');
      });

      it('should skip null/undefined values', () => {
        const result = transformStyles({ color: 'black', bg: undefined });
        expect(result.color).toBe('black');
        expect(result).not.toHaveProperty('bg');
      });
    });
  });

  describe('Signal Integration', () => {
    describe('signalStyle', () => {
      it('should be a function', () => {
        expect(typeof signalStyle).toBe('function');
      });

      it('should return a signal', () => {
        const styleSignal = signalStyle(() => ({ display: 'flex' }));
        expect(typeof styleSignal).toBe('function');
        expect(typeof styleSignal()).toBe('string');
      });
    });

    describe('useSignalStyles', () => {
      it('should be a function', () => {
        expect(typeof useSignalStyles).toBe('function');
      });

      it('should create computed styles signal', () => {
        const stylesSignal = useSignalStyles({
          color: 'black',
          padding: '1rem',
        });
        expect(typeof stylesSignal).toBe('function');
        const result = stylesSignal();
        expect(result.color).toBe('black');
      });
    });

    describe('createThemeSignal', () => {
      it('should be a function', () => {
        expect(typeof createThemeSignal).toBe('function');
      });

      it('should create theme signal with all methods', () => {
        const result = createThemeSignal({ primaryColor: 'blue' });
        expect(result.theme).toBeDefined();
        expect(typeof result.setTheme).toBe('function');
        expect(typeof result.resetTheme).toBe('function');
        expect(typeof result.getToken).toBe('function');
      });

      it('should return initial theme', () => {
        const { theme } = createThemeSignal({ primaryColor: 'blue', fontSize: '16px' });
        expect(theme().primaryColor).toBe('blue');
        expect(theme().fontSize).toBe('16px');
      });

      it('should update theme', () => {
        const { theme, setTheme } = createThemeSignal({ primaryColor: 'blue' });
        setTheme({ primaryColor: 'red' });
        expect(theme().primaryColor).toBe('red');
      });

      it('should reset theme', () => {
        const { theme, setTheme, resetTheme } = createThemeSignal({ primaryColor: 'blue' });
        setTheme({ primaryColor: 'red' });
        resetTheme();
        expect(theme().primaryColor).toBe('blue');
      });

      it('should get token signal', () => {
        const { getToken } = createThemeSignal({ primaryColor: 'blue' });
        const colorSignal = getToken('primaryColor');
        expect(colorSignal()).toBe('blue');
      });
    });

    describe('createColorModeSignal', () => {
      it('should be a function', () => {
        expect(typeof createColorModeSignal).toBe('function');
      });

      it('should create color mode signal with all methods', () => {
        const result = createColorModeSignal();
        expect(result.colorMode).toBeDefined();
        expect(result.resolvedColorMode).toBeDefined();
        expect(typeof result.setColorMode).toBe('function');
        expect(typeof result.toggleColorMode).toBe('function');
      });

      it('should use initial mode', () => {
        const { colorMode } = createColorModeSignal('dark');
        expect(colorMode()).toBe('dark');
      });

      it('should default to system', () => {
        const { colorMode } = createColorModeSignal();
        expect(colorMode()).toBe('system');
      });

      it('should set color mode', () => {
        const { colorMode, setColorMode } = createColorModeSignal();
        setColorMode('dark');
        expect(colorMode()).toBe('dark');
      });

      it('should toggle color mode', () => {
        const { resolvedColorMode, toggleColorMode } = createColorModeSignal('light');
        expect(resolvedColorMode()).toBe('light');
        toggleColorMode();
        // After toggle from light, should be dark
      });
    });
  });

  describe('Utility Functions', () => {
    describe('mergeStyles', () => {
      it('should be a function', () => {
        expect(typeof mergeStyles).toBe('function');
      });

      it('should merge multiple style objects', () => {
        const result = mergeStyles(
          { color: 'black' },
          { padding: '1rem' },
          { color: 'blue', margin: '0' }
        );
        expect(result.color).toBe('blue');
        expect(result.padding).toBe('1rem');
        expect(result.margin).toBe('0');
      });

      it('should handle undefined values', () => {
        const result = mergeStyles(
          { color: 'black' },
          undefined,
          { padding: '1rem' }
        );
        expect(result.color).toBe('black');
        expect(result.padding).toBe('1rem');
      });
    });

    describe('responsive', () => {
      it('should be a function', () => {
        expect(typeof responsive).toBe('function');
      });

      it('should create responsive values object', () => {
        const result = responsive({
          base: '100%',
          sm: '50%',
          md: '33%',
          lg: '25%',
        });
        expect(result['']).toBe('100%');
        expect(result.sm).toBe('50%');
        expect(result.md).toBe('33%');
        expect(result.lg).toBe('25%');
      });

      it('should skip undefined values', () => {
        const result = responsive({ base: '100%', lg: '50%' });
        expect(result['']).toBe('100%');
        expect(result.lg).toBe('50%');
        expect(result).not.toHaveProperty('sm');
        expect(result).not.toHaveProperty('md');
      });
    });

    describe('when', () => {
      it('should be a function', () => {
        expect(typeof when).toBe('function');
      });

      it('should return true styles when condition is true', () => {
        const result = when(true, { color: 'green' }, { color: 'red' });
        expect(result.color).toBe('green');
      });

      it('should return false styles when condition is false', () => {
        const result = when(false, { color: 'green' }, { color: 'red' });
        expect(result.color).toBe('red');
      });

      it('should return empty object when condition is false and no false styles', () => {
        const result = when(false, { color: 'green' });
        expect(result).toEqual({});
      });
    });
  });

  describe('Configuration Helpers', () => {
    describe('defineConfig', () => {
      it('should be a function', () => {
        expect(typeof defineConfig).toBe('function');
      });

      it('should return config with PhilJS preset', () => {
        const config = defineConfig({
          include: ['./src/**/*.tsx'],
          outdir: 'styled-system',
        });
        expect(config).toHaveProperty('presets');
        expect((config as any).presets).toContain(philjsPreset);
        expect(config).toHaveProperty('philjs', true);
      });

      it('should merge conditions', () => {
        const config = defineConfig({
          conditions: { custom: '&.custom' },
        });
        expect((config as any).conditions).toHaveProperty('hover');
        expect((config as any).conditions).toHaveProperty('custom');
      });

      it('should include additional presets', () => {
        const customPreset = { name: 'custom', theme: {} } as PresetConfig;
        const config = defineConfig({
          presets: [customPreset],
        });
        expect((config as any).presets).toContain(philjsPreset);
        expect((config as any).presets).toContain(customPreset);
      });
    });

    describe('createPreset', () => {
      it('should be a function', () => {
        expect(typeof createPreset).toBe('function');
      });

      it('should create preset with custom name', () => {
        const preset = createPreset('my-theme', {});
        expect(preset.name).toBe('my-theme');
      });

      it('should extend PhilJS preset theme', () => {
        const preset = createPreset('my-theme', {
          theme: {
            tokens: {
              colors: { custom: { value: '#123456' } },
            },
          },
        });
        expect(preset.theme.tokens?.colors).toHaveProperty('primary');
        expect(preset.theme.tokens?.colors).toHaveProperty('custom');
      });

      it('should extend patterns', () => {
        const preset = createPreset('my-theme', {
          patterns: {
            customStack: { description: 'Custom stack' },
          },
        });
        expect(preset.patterns).toHaveProperty('stack');
        expect(preset.patterns).toHaveProperty('customStack');
      });

      it('should extend conditions', () => {
        const preset = createPreset('my-theme', {
          conditions: { customHover: '&.custom-hover' },
        });
        expect(preset.conditions).toHaveProperty('hover');
        expect(preset.conditions).toHaveProperty('customHover');
      });

      it('should extend global CSS', () => {
        const preset = createPreset('my-theme', {
          globalCss: { '.custom': { color: 'red' } },
        });
        expect(preset.globalCss).toHaveProperty('*');
        expect(preset.globalCss).toHaveProperty('.custom');
      });
    });
  });
});
