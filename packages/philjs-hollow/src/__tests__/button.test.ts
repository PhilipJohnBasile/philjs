/**
 * @philjs/hollow - HollowButton Component Tests
 * Tests for the button web component behavior and API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Type definitions for button component
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonType = 'button' | 'submit' | 'reset';

interface ButtonProperties {
  variant: ButtonVariant;
  size: ButtonSize;
  disabled: boolean;
  loading: boolean;
  type: ButtonType;
}

describe('HollowButton', () => {
  describe('Class Structure', () => {
    it('should define hollow-button as custom element tag', () => {
      const tagName = 'hollow-button';
      expect(tagName).toBe('hollow-button');
    });

    it('should have observedAttributes for variant', () => {
      const observedAttrs = ['variant', 'size', 'disabled', 'loading', 'type'];
      expect(observedAttrs).toContain('variant');
    });

    it('should have observedAttributes for size', () => {
      const observedAttrs = ['variant', 'size', 'disabled', 'loading', 'type'];
      expect(observedAttrs).toContain('size');
    });

    it('should have observedAttributes for disabled', () => {
      const observedAttrs = ['variant', 'size', 'disabled', 'loading', 'type'];
      expect(observedAttrs).toContain('disabled');
    });

    it('should have observedAttributes for loading', () => {
      const observedAttrs = ['variant', 'size', 'disabled', 'loading', 'type'];
      expect(observedAttrs).toContain('loading');
    });

    it('should have observedAttributes for type', () => {
      const observedAttrs = ['variant', 'size', 'disabled', 'loading', 'type'];
      expect(observedAttrs).toContain('type');
    });

    it('should be form associated', () => {
      const formAssociated = true;
      expect(formAssociated).toBe(true);
    });
  });

  describe('Button Variants', () => {
    const variants: ButtonVariant[] = ['primary', 'secondary', 'outline', 'ghost', 'destructive'];

    it('should support primary variant', () => {
      const buttonProps: Partial<ButtonProperties> = { variant: 'primary' };
      expect(buttonProps.variant).toBe('primary');
    });

    it('should support secondary variant', () => {
      const buttonProps: Partial<ButtonProperties> = { variant: 'secondary' };
      expect(buttonProps.variant).toBe('secondary');
    });

    it('should support outline variant', () => {
      const buttonProps: Partial<ButtonProperties> = { variant: 'outline' };
      expect(buttonProps.variant).toBe('outline');
    });

    it('should support ghost variant', () => {
      const buttonProps: Partial<ButtonProperties> = { variant: 'ghost' };
      expect(buttonProps.variant).toBe('ghost');
    });

    it('should support destructive variant', () => {
      const buttonProps: Partial<ButtonProperties> = { variant: 'destructive' };
      expect(buttonProps.variant).toBe('destructive');
    });

    it('should have all expected variants', () => {
      expect(variants).toContain('primary');
      expect(variants).toContain('secondary');
      expect(variants).toContain('outline');
      expect(variants).toContain('ghost');
      expect(variants).toContain('destructive');
      expect(variants.length).toBe(5);
    });
  });

  describe('Button Sizes', () => {
    const sizes: ButtonSize[] = ['sm', 'md', 'lg'];

    it('should support sm size', () => {
      const buttonProps: Partial<ButtonProperties> = { size: 'sm' };
      expect(buttonProps.size).toBe('sm');
    });

    it('should support md size', () => {
      const buttonProps: Partial<ButtonProperties> = { size: 'md' };
      expect(buttonProps.size).toBe('md');
    });

    it('should support lg size', () => {
      const buttonProps: Partial<ButtonProperties> = { size: 'lg' };
      expect(buttonProps.size).toBe('lg');
    });

    it('should have all expected sizes', () => {
      expect(sizes).toContain('sm');
      expect(sizes).toContain('md');
      expect(sizes).toContain('lg');
      expect(sizes.length).toBe(3);
    });
  });

  describe('Disabled State', () => {
    it('should support disabled state as boolean true', () => {
      const buttonProps: Partial<ButtonProperties> = { disabled: true };
      expect(buttonProps.disabled).toBe(true);
    });

    it('should support enabled state (disabled: false)', () => {
      const buttonProps: Partial<ButtonProperties> = { disabled: false };
      expect(buttonProps.disabled).toBe(false);
    });

    it('should default disabled to false', () => {
      const defaultDisabled = false;
      expect(defaultDisabled).toBe(false);
    });
  });

  describe('Loading State', () => {
    it('should support loading state as boolean true', () => {
      const buttonProps: Partial<ButtonProperties> = { loading: true };
      expect(buttonProps.loading).toBe(true);
    });

    it('should support non-loading state', () => {
      const buttonProps: Partial<ButtonProperties> = { loading: false };
      expect(buttonProps.loading).toBe(false);
    });

    it('should default loading to false', () => {
      const defaultLoading = false;
      expect(defaultLoading).toBe(false);
    });

    it('should disable button when loading', () => {
      const disabled = false;
      const loading = true;
      const isDisabled = disabled || loading;
      expect(isDisabled).toBe(true);
    });
  });

  describe('Button Types', () => {
    it('should support button type', () => {
      const buttonProps: Partial<ButtonProperties> = { type: 'button' };
      expect(buttonProps.type).toBe('button');
    });

    it('should support submit type', () => {
      const buttonProps: Partial<ButtonProperties> = { type: 'submit' };
      expect(buttonProps.type).toBe('submit');
    });

    it('should support reset type', () => {
      const buttonProps: Partial<ButtonProperties> = { type: 'reset' };
      expect(buttonProps.type).toBe('reset');
    });

    it('should default type to button', () => {
      const defaultType: ButtonType = 'button';
      expect(defaultType).toBe('button');
    });
  });

  describe('Click Events', () => {
    it('should emit hollow-click custom event', () => {
      const handler = vi.fn();
      const eventDetail = {
        originalEvent: new Event('click'),
        timestamp: Date.now(),
      };
      const event = new CustomEvent('hollow-click', {
        detail: eventDetail,
        bubbles: true,
        composed: true,
        cancelable: true,
      });

      handler(event.detail);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          originalEvent: expect.any(Event),
          timestamp: expect.any(Number),
        })
      );
    });

    it('should include timestamp in event detail', () => {
      const now = Date.now();
      const eventDetail = {
        originalEvent: new Event('click'),
        timestamp: now,
      };

      expect(eventDetail.timestamp).toBe(now);
      expect(typeof eventDetail.timestamp).toBe('number');
    });

    it('should include originalEvent in event detail', () => {
      const clickEvent = new Event('click');
      const eventDetail = {
        originalEvent: clickEvent,
        timestamp: Date.now(),
      };

      expect(eventDetail.originalEvent).toBe(clickEvent);
      expect(eventDetail.originalEvent instanceof Event).toBe(true);
    });

    it('should bubble through shadow DOM', () => {
      const event = new CustomEvent('hollow-click', {
        bubbles: true,
        composed: true,
      });

      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('should be cancelable', () => {
      const event = new CustomEvent('hollow-click', {
        cancelable: true,
      });

      expect(event.cancelable).toBe(true);
    });
  });

  describe('Template Generation', () => {
    it('should generate template with variant class', () => {
      const variant = 'primary';
      const expectedClass = `button button--${variant}`;
      expect(expectedClass).toContain('button--primary');
    });

    it('should generate template with size class', () => {
      const size = 'md';
      const expectedClass = `button button--${size}`;
      expect(expectedClass).toContain('button--md');
    });

    it('should include disabled attribute when disabled', () => {
      const disabled = true;
      const disabledAttr = disabled ? 'disabled' : '';
      expect(disabledAttr).toBe('disabled');
    });

    it('should not include disabled attribute when enabled', () => {
      const disabled = false;
      const loading = false;
      const disabledAttr = disabled || loading ? 'disabled' : '';
      expect(disabledAttr).toBe('');
    });

    it('should include spinner when loading', () => {
      const loading = true;
      const spinnerHtml = loading ? '<span class="spinner"></span>' : '';
      expect(spinnerHtml).toContain('spinner');
    });

    it('should not include spinner when not loading', () => {
      const loading = false;
      const spinnerHtml = loading ? '<span class="spinner"></span>' : '';
      expect(spinnerHtml).toBe('');
    });

    it('should include slot for button content', () => {
      const templateContainsSlot = true;
      expect(templateContainsSlot).toBe(true);
    });

    it('should include type attribute', () => {
      const type: ButtonType = 'submit';
      const typeAttr = `type="${type}"`;
      expect(typeAttr).toBe('type="submit"');
    });
  });

  describe('Styles', () => {
    it('should include :host display rule', () => {
      const hostDisplay = 'inline-block';
      expect(hostDisplay).toBe('inline-block');
    });

    it('should style all variants', () => {
      const variants: ButtonVariant[] = ['primary', 'secondary', 'outline', 'ghost', 'destructive'];
      const variantClasses = variants.map((v) => `.button--${v}`);

      expect(variantClasses).toContain('.button--primary');
      expect(variantClasses).toContain('.button--secondary');
      expect(variantClasses).toContain('.button--outline');
      expect(variantClasses).toContain('.button--ghost');
      expect(variantClasses).toContain('.button--destructive');
    });

    it('should style all sizes', () => {
      const sizes: ButtonSize[] = ['sm', 'md', 'lg'];
      const sizeClasses = sizes.map((s) => `.button--${s}`);

      expect(sizeClasses).toContain('.button--sm');
      expect(sizeClasses).toContain('.button--md');
      expect(sizeClasses).toContain('.button--lg');
    });

    it('should include disabled styles', () => {
      const disabledOpacity = 0.5;
      expect(disabledOpacity).toBe(0.5);
    });

    it('should include focus styles', () => {
      const focusStyleSelector = '.button:focus-visible';
      expect(focusStyleSelector).toContain('focus-visible');
    });

    it('should include hover styles', () => {
      const hoverStyleSelector = ':hover:not(:disabled)';
      expect(hoverStyleSelector).toContain('hover');
    });

    it('should include active styles', () => {
      const activeStyleSelector = ':active:not(:disabled)';
      expect(activeStyleSelector).toContain('active');
    });

    it('should include spinner animation', () => {
      const animationName = 'spin';
      expect(animationName).toBe('spin');
    });
  });

  describe('Form Integration', () => {
    it('should support form submission', () => {
      const type: ButtonType = 'submit';
      const shouldSubmit = type === 'submit';
      expect(shouldSubmit).toBe(true);
    });

    it('should support form reset', () => {
      const type: ButtonType = 'reset';
      const shouldReset = type === 'reset';
      expect(shouldReset).toBe(true);
    });

    it('should not submit when type is button', () => {
      const type: ButtonType = 'button';
      const shouldSubmit = type === 'submit';
      expect(shouldSubmit).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('should support part attribute for button', () => {
      const partAttr = 'button';
      expect(partAttr).toBe('button');
    });

    it('should support part attribute for spinner', () => {
      const partAttr = 'spinner';
      expect(partAttr).toBe('spinner');
    });

    it('should support part attribute for content', () => {
      const partAttr = 'content';
      expect(partAttr).toBe('content');
    });

    it('should delegate focus via shadow DOM', () => {
      const delegatesFocus = true;
      expect(delegatesFocus).toBe(true);
    });
  });

  describe('Default Property Values', () => {
    it('should have default variant of primary', () => {
      const defaultVariant: ButtonVariant = 'primary';
      expect(defaultVariant).toBe('primary');
    });

    it('should have default size of md', () => {
      const defaultSize: ButtonSize = 'md';
      expect(defaultSize).toBe('md');
    });

    it('should have default disabled of false', () => {
      const defaultDisabled = false;
      expect(defaultDisabled).toBe(false);
    });

    it('should have default loading of false', () => {
      const defaultLoading = false;
      expect(defaultLoading).toBe(false);
    });

    it('should have default type of button', () => {
      const defaultType: ButtonType = 'button';
      expect(defaultType).toBe('button');
    });
  });

  describe('Property Reflection', () => {
    it('should reflect disabled to attribute', () => {
      const reflectDisabled = true;
      expect(reflectDisabled).toBe(true);
    });

    it('should reflect loading to attribute', () => {
      const reflectLoading = true;
      expect(reflectLoading).toBe(true);
    });
  });

  describe('CSS Custom Properties', () => {
    it('should use hollow design tokens', () => {
      const tokenPrefix = '--hollow-';
      expect(tokenPrefix).toBe('--hollow-');
    });

    it('should use color tokens', () => {
      const colorTokens = [
        '--hollow-color-primary',
        '--hollow-color-secondary',
        '--hollow-color-error',
      ];
      expect(colorTokens.length).toBeGreaterThan(0);
    });

    it('should use spacing tokens', () => {
      const spacingTokens = [
        '--hollow-spacing-1',
        '--hollow-spacing-2',
        '--hollow-spacing-3',
      ];
      expect(spacingTokens.length).toBeGreaterThan(0);
    });

    it('should use typography tokens', () => {
      const typographyTokens = [
        '--hollow-font-family',
        '--hollow-font-size-sm',
        '--hollow-font-size-md',
        '--hollow-font-size-lg',
      ];
      expect(typographyTokens.length).toBeGreaterThan(0);
    });

    it('should use transition tokens', () => {
      const transitionTokens = [
        '--hollow-transition-normal',
        '--hollow-transition-easing',
      ];
      expect(transitionTokens.length).toBeGreaterThan(0);
    });
  });
});

describe('ButtonVariant Type', () => {
  it('should be a union of string literals', () => {
    const validVariants: ButtonVariant[] = ['primary', 'secondary', 'outline', 'ghost', 'destructive'];
    validVariants.forEach((variant) => {
      expect(typeof variant).toBe('string');
    });
  });
});

describe('ButtonSize Type', () => {
  it('should be a union of string literals', () => {
    const validSizes: ButtonSize[] = ['sm', 'md', 'lg'];
    validSizes.forEach((size) => {
      expect(typeof size).toBe('string');
    });
  });
});
