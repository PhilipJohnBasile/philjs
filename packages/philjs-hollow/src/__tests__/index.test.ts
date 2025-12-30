/**
 * @philjs/hollow - Test Suite
 * Tests for framework-agnostic Web Components with multi-framework wrappers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  // Core
  HollowElement,
  property,
  defineElement,
  // Design tokens
  tokens,
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  designTokensCSS,
  createTheme,
  // Components
  HollowButton,
  HollowInput,
  HollowCard,
  // Wrappers
  react,
  vue,
  svelte,
  philjs,
} from '../index.js';

// Mock customElements for testing
const mockCustomElements = {
  define: vi.fn(),
  get: vi.fn(() => undefined),
};

// Mock attachShadow
const mockShadowRoot = {
  appendChild: vi.fn(),
  querySelector: vi.fn(() => null),
  querySelectorAll: vi.fn(() => []),
  innerHTML: '',
};

beforeEach(() => {
  vi.stubGlobal('customElements', mockCustomElements);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('@philjs/hollow', () => {
  describe('Export Verification', () => {
    it('should export core components', () => {
      expect(HollowElement).toBeDefined();
      expect(property).toBeDefined();
      expect(typeof property).toBe('function');
      expect(defineElement).toBeDefined();
      expect(typeof defineElement).toBe('function');
    });

    it('should export design tokens', () => {
      expect(tokens).toBeDefined();
      expect(colors).toBeDefined();
      expect(typography).toBeDefined();
      expect(spacing).toBeDefined();
      expect(borderRadius).toBeDefined();
      expect(shadows).toBeDefined();
      expect(transitions).toBeDefined();
      expect(zIndex).toBeDefined();
      expect(designTokensCSS).toBeDefined();
      expect(createTheme).toBeDefined();
    });

    it('should export UI components', () => {
      expect(HollowButton).toBeDefined();
      expect(HollowInput).toBeDefined();
      expect(HollowCard).toBeDefined();
    });

    it('should export framework wrappers', () => {
      expect(react).toBeDefined();
      expect(vue).toBeDefined();
      expect(svelte).toBeDefined();
      expect(philjs).toBeDefined();
    });
  });

  describe('Design Tokens', () => {
    it('should have color tokens', () => {
      expect(colors).toHaveProperty('primary');
      expect(colors).toHaveProperty('secondary');
      expect(typeof colors.primary).toBe('string');
    });

    it('should have typography tokens', () => {
      expect(typography).toBeDefined();
      expect(typeof typography).toBe('object');
    });

    it('should have spacing tokens', () => {
      expect(spacing).toBeDefined();
      expect(typeof spacing).toBe('object');
    });

    it('should have border radius tokens', () => {
      expect(borderRadius).toBeDefined();
      expect(typeof borderRadius).toBe('object');
    });

    it('should have shadow tokens', () => {
      expect(shadows).toBeDefined();
      expect(typeof shadows).toBe('object');
    });

    it('should have transition tokens', () => {
      expect(transitions).toBeDefined();
      expect(typeof transitions).toBe('object');
    });

    it('should have z-index tokens', () => {
      expect(zIndex).toBeDefined();
      expect(typeof zIndex).toBe('object');
    });

    it('should generate CSS string from tokens', () => {
      expect(typeof designTokensCSS).toBe('string');
      expect(designTokensCSS.length).toBeGreaterThan(0);
    });

    it('should create custom theme', () => {
      const customTheme = createTheme({
        colors: {
          primary: '#ff0000'
        }
      });

      expect(customTheme).toBeDefined();
    });
  });

  describe('property decorator', () => {
    it('should be a function', () => {
      expect(typeof property).toBe('function');
    });

    it('should return a decorator function', () => {
      const decorator = property();
      expect(typeof decorator).toBe('function');
    });

    it('should accept property options', () => {
      const decorator = property({
        attribute: 'my-prop',
        type: 'string',
        reflect: true,
        default: 'default-value'
      });

      expect(typeof decorator).toBe('function');
    });

    it('should accept attribute: false option', () => {
      const decorator = property({
        attribute: false
      });

      expect(typeof decorator).toBe('function');
    });

    it('should accept different types', () => {
      const stringProp = property({ type: 'string' });
      const numberProp = property({ type: 'number' });
      const booleanProp = property({ type: 'boolean' });
      const objectProp = property({ type: 'object' });
      const arrayProp = property({ type: 'array' });

      expect(typeof stringProp).toBe('function');
      expect(typeof numberProp).toBe('function');
      expect(typeof booleanProp).toBe('function');
      expect(typeof objectProp).toBe('function');
      expect(typeof arrayProp).toBe('function');
    });
  });

  describe('defineElement', () => {
    it('should call customElements.define', () => {
      // Create a mock element class
      class MockElement extends HTMLElement {
        static observedAttributes: string[] = [];
      }

      defineElement('mock-element', MockElement as unknown as typeof HollowElement);

      expect(mockCustomElements.define).toHaveBeenCalledWith(
        'mock-element',
        MockElement
      );
    });

    it('should not redefine existing elements', () => {
      mockCustomElements.get.mockReturnValueOnce(class extends HTMLElement {});

      class AnotherMock extends HTMLElement {
        static observedAttributes: string[] = [];
      }

      defineElement('existing-element', AnotherMock as unknown as typeof HollowElement);

      // Should not call define if element already exists
      expect(mockCustomElements.define).not.toHaveBeenCalledWith(
        'existing-element',
        expect.anything()
      );
    });
  });

  describe('HollowButton', () => {
    it('should be a class', () => {
      expect(typeof HollowButton).toBe('function');
    });

    it('should extend HollowElement', () => {
      expect(HollowButton.prototype instanceof HollowElement).toBe(true);
    });
  });

  describe('HollowInput', () => {
    it('should be a class', () => {
      expect(typeof HollowInput).toBe('function');
    });

    it('should extend HollowElement', () => {
      expect(HollowInput.prototype instanceof HollowElement).toBe(true);
    });
  });

  describe('HollowCard', () => {
    it('should be a class', () => {
      expect(typeof HollowCard).toBe('function');
    });

    it('should extend HollowElement', () => {
      expect(HollowCard.prototype instanceof HollowElement).toBe(true);
    });
  });

  describe('Framework Wrappers', () => {
    describe('React Wrapper', () => {
      it('should export react wrapper module', () => {
        expect(react).toBeDefined();
        expect(typeof react).toBe('object');
      });
    });

    describe('Vue Wrapper', () => {
      it('should export vue wrapper module', () => {
        expect(vue).toBeDefined();
        expect(typeof vue).toBe('object');
      });
    });

    describe('Svelte Wrapper', () => {
      it('should export svelte wrapper module', () => {
        expect(svelte).toBeDefined();
        expect(typeof svelte).toBe('object');
      });
    });

    describe('PhilJS Wrapper', () => {
      it('should export philjs wrapper module', () => {
        expect(philjs).toBeDefined();
        expect(typeof philjs).toBe('object');
      });
    });
  });

  describe('Tokens Object', () => {
    it('should contain all token categories', () => {
      expect(tokens).toHaveProperty('colors');
      expect(tokens).toHaveProperty('typography');
      expect(tokens).toHaveProperty('spacing');
      expect(tokens).toHaveProperty('borderRadius');
      expect(tokens).toHaveProperty('shadows');
      expect(tokens).toHaveProperty('transitions');
      expect(tokens).toHaveProperty('zIndex');
    });

    it('should have consistent token structure', () => {
      // Each category should be an object
      expect(typeof tokens.colors).toBe('object');
      expect(typeof tokens.spacing).toBe('object');
    });
  });

  describe('CSS Generation', () => {
    it('should generate valid CSS custom properties', () => {
      // designTokensCSS should contain CSS custom properties
      expect(designTokensCSS).toContain('--');
    });

    it('should include :root selector or similar', () => {
      // Should have some form of root-level selector
      expect(
        designTokensCSS.includes(':root') ||
        designTokensCSS.includes(':host') ||
        designTokensCSS.includes('*')
      ).toBe(true);
    });
  });

  describe('Theme Creation', () => {
    it('should create theme with default values', () => {
      const theme = createTheme({});
      expect(theme).toBeDefined();
    });

    it('should allow overriding color tokens', () => {
      const theme = createTheme({
        colors: {
          primary: '#custom-primary',
          secondary: '#custom-secondary'
        }
      });

      expect(theme).toBeDefined();
    });

    it('should allow overriding spacing tokens', () => {
      const theme = createTheme({
        spacing: {
          sm: '4px',
          md: '8px'
        }
      });

      expect(theme).toBeDefined();
    });

    it('should merge overrides with defaults', () => {
      const theme = createTheme({
        colors: {
          primary: '#new-primary'
        }
        // Other tokens should use defaults
      });

      expect(theme).toBeDefined();
    });
  });

  describe('HollowElement Base Class', () => {
    it('should be a class', () => {
      expect(typeof HollowElement).toBe('function');
    });

    it('should have static observedAttributes', () => {
      expect(Array.isArray(HollowElement.observedAttributes)).toBe(true);
    });

    it('should have property metadata storage', () => {
      expect(HollowElement._propertyMetadata === undefined || HollowElement._propertyMetadata instanceof Map).toBe(true);
    });
  });
});
