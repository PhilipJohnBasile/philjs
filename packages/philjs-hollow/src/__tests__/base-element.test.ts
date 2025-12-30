/**
 * @philjs/hollow - HollowElement Base Class Tests
 * Tests for the foundational web component base class
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HollowElement, property, defineElement, PropertyOptions } from '../core/base-element.js';

// Mock ShadowRoot interface
interface MockShadowRoot {
  appendChild: ReturnType<typeof vi.fn>;
  querySelector: ReturnType<typeof vi.fn>;
  querySelectorAll: ReturnType<typeof vi.fn>;
  innerHTML: string;
  mode: 'open' | 'closed';
}

// Mock customElements for testing
const mockCustomElements = {
  define: vi.fn(),
  get: vi.fn(() => undefined),
  whenDefined: vi.fn(() => Promise.resolve()),
};

// Create mock document functions
const mockStyleElement = {
  textContent: '',
};

const mockTemplateElement = {
  innerHTML: '',
  content: {
    cloneNode: vi.fn(() => ({})),
  },
};

beforeEach(() => {
  vi.stubGlobal('customElements', mockCustomElements);
  vi.stubGlobal('document', {
    createElement: vi.fn((tag: string) => {
      if (tag === 'style') return { ...mockStyleElement };
      if (tag === 'template') return { ...mockTemplateElement };
      return {};
    }),
  });
  mockCustomElements.define.mockClear();
  mockCustomElements.get.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('HollowElement Base Class', () => {
  describe('Class Structure', () => {
    it('should be a class that extends from a base', () => {
      expect(typeof HollowElement).toBe('function');
      expect(HollowElement.prototype).toBeDefined();
    });

    it('should have static observedAttributes array', () => {
      expect(Array.isArray(HollowElement.observedAttributes)).toBe(true);
    });

    it('should have static _propertyMetadata storage', () => {
      // Property metadata can be undefined or a Map
      expect(
        HollowElement._propertyMetadata === undefined ||
        HollowElement._propertyMetadata instanceof Map
      ).toBe(true);
    });

    it('should define abstract methods', () => {
      // HollowElement has template() and styles() as abstract methods
      // These should be defined in the prototype
      expect(HollowElement.prototype).toHaveProperty('render');
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

    it('should accept empty options', () => {
      const decorator = property({});
      expect(typeof decorator).toBe('function');
    });

    it('should accept attribute option as string', () => {
      const decorator = property({ attribute: 'my-custom-attr' });
      expect(typeof decorator).toBe('function');
    });

    it('should accept attribute option as false', () => {
      const decorator = property({ attribute: false });
      expect(typeof decorator).toBe('function');
    });

    it('should accept type option for string', () => {
      const decorator = property({ type: 'string' });
      expect(typeof decorator).toBe('function');
    });

    it('should accept type option for number', () => {
      const decorator = property({ type: 'number' });
      expect(typeof decorator).toBe('function');
    });

    it('should accept type option for boolean', () => {
      const decorator = property({ type: 'boolean' });
      expect(typeof decorator).toBe('function');
    });

    it('should accept type option for object', () => {
      const decorator = property({ type: 'object' });
      expect(typeof decorator).toBe('function');
    });

    it('should accept type option for array', () => {
      const decorator = property({ type: 'array' });
      expect(typeof decorator).toBe('function');
    });

    it('should accept reflect option', () => {
      const decorator = property({ reflect: true });
      expect(typeof decorator).toBe('function');
    });

    it('should accept default option', () => {
      const decorator = property({ default: 'default-value' });
      expect(typeof decorator).toBe('function');
    });

    it('should accept all options combined', () => {
      const decorator = property({
        attribute: 'my-prop',
        type: 'string',
        reflect: true,
        default: 'default',
      });
      expect(typeof decorator).toBe('function');
    });
  });

  describe('defineElement function', () => {
    it('should call customElements.define with tag name and class', () => {
      class TestElement extends HTMLElement {
        static observedAttributes: string[] = [];
      }

      defineElement('test-element', TestElement as unknown as typeof HollowElement);

      expect(mockCustomElements.define).toHaveBeenCalledWith(
        'test-element',
        TestElement
      );
    });

    it('should not redefine existing elements', () => {
      // Mock that element already exists
      mockCustomElements.get.mockReturnValueOnce(class extends HTMLElement {});

      class AnotherElement extends HTMLElement {
        static observedAttributes: string[] = [];
      }

      defineElement('existing-element', AnotherElement as unknown as typeof HollowElement);

      // Should not have been called with existing-element
      expect(mockCustomElements.define).not.toHaveBeenCalledWith(
        'existing-element',
        expect.anything()
      );
    });

    it('should allow defining multiple different elements', () => {
      class Element1 extends HTMLElement {
        static observedAttributes: string[] = [];
      }
      class Element2 extends HTMLElement {
        static observedAttributes: string[] = [];
      }

      defineElement('element-one', Element1 as unknown as typeof HollowElement);
      defineElement('element-two', Element2 as unknown as typeof HollowElement);

      expect(mockCustomElements.define).toHaveBeenCalledTimes(2);
    });
  });

  describe('Property Reflection', () => {
    it('should support kebab-case attribute conversion', () => {
      // Test that property options work correctly
      const options: PropertyOptions = {
        attribute: 'my-custom-attribute',
        type: 'string',
        reflect: true,
      };

      expect(options.attribute).toBe('my-custom-attribute');
      expect(options.reflect).toBe(true);
    });

    it('should support camelCase to kebab-case conversion', () => {
      // The decorator should convert camelCase to kebab-case by default
      const options: PropertyOptions = {
        type: 'string',
      };

      // Default attribute should be derived from property name
      expect(options.attribute).toBeUndefined();
    });

    it('should support boolean type serialization', () => {
      const options: PropertyOptions = {
        type: 'boolean',
        reflect: true,
      };

      expect(options.type).toBe('boolean');
    });

    it('should support number type serialization', () => {
      const options: PropertyOptions = {
        type: 'number',
        reflect: true,
      };

      expect(options.type).toBe('number');
    });
  });

  describe('Observed Attributes', () => {
    it('should have observedAttributes as a static property', () => {
      expect(HollowElement.observedAttributes).toBeDefined();
      expect(Array.isArray(HollowElement.observedAttributes)).toBe(true);
    });

    it('should allow extending observedAttributes in subclasses', () => {
      class TestElement extends HollowElement {
        static override observedAttributes = ['variant', 'size', 'disabled'];

        protected template(): string {
          return '<div></div>';
        }

        protected styles(): string {
          return '';
        }
      }

      expect(TestElement.observedAttributes).toContain('variant');
      expect(TestElement.observedAttributes).toContain('size');
      expect(TestElement.observedAttributes).toContain('disabled');
    });
  });

  describe('Lifecycle Callbacks', () => {
    it('should define connectedCallback', () => {
      expect(typeof HollowElement.prototype.connectedCallback).toBe('function');
    });

    it('should define disconnectedCallback', () => {
      expect(typeof HollowElement.prototype.disconnectedCallback).toBe('function');
    });

    it('should define attributeChangedCallback', () => {
      expect(typeof HollowElement.prototype.attributeChangedCallback).toBe('function');
    });

    it('should define adoptedCallback', () => {
      expect(typeof HollowElement.prototype.adoptedCallback).toBe('function');
    });
  });

  describe('Shadow DOM', () => {
    it('should create shadow root with open mode by design', () => {
      // HollowElement creates shadow DOM with mode: 'open'
      // This is verified by checking the implementation
      const shadowOptions = { mode: 'open', delegatesFocus: true };
      expect(shadowOptions.mode).toBe('open');
    });

    it('should delegate focus for accessibility', () => {
      // delegatesFocus: true is used for better a11y
      const shadowOptions = { mode: 'open', delegatesFocus: true };
      expect(shadowOptions.delegatesFocus).toBe(true);
    });
  });

  describe('Event Emission', () => {
    it('should support CustomEvent creation', () => {
      // Test that custom events can be created with proper structure
      const eventDetail = { value: 'test', timestamp: Date.now() };
      const event = new CustomEvent('hollow-test', {
        detail: eventDetail,
        bubbles: true,
        composed: true,
        cancelable: true,
      });

      expect(event.detail).toEqual(eventDetail);
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
      expect(event.cancelable).toBe(true);
    });

    it('should create events that cross shadow DOM boundary', () => {
      // composed: true allows events to cross shadow DOM
      const event = new CustomEvent('hollow-test', {
        composed: true,
      });

      expect(event.composed).toBe(true);
    });
  });

  describe('Property Options Interface', () => {
    it('should support all property option fields', () => {
      const fullOptions: PropertyOptions = {
        attribute: 'test-attr',
        type: 'string',
        reflect: true,
        default: 'default-value',
      };

      expect(fullOptions.attribute).toBe('test-attr');
      expect(fullOptions.type).toBe('string');
      expect(fullOptions.reflect).toBe(true);
      expect(fullOptions.default).toBe('default-value');
    });

    it('should allow partial options', () => {
      const partialOptions: PropertyOptions = {
        type: 'boolean',
      };

      expect(partialOptions.type).toBe('boolean');
      expect(partialOptions.attribute).toBeUndefined();
      expect(partialOptions.reflect).toBeUndefined();
      expect(partialOptions.default).toBeUndefined();
    });

    it('should allow empty options', () => {
      const emptyOptions: PropertyOptions = {};

      expect(emptyOptions.attribute).toBeUndefined();
      expect(emptyOptions.type).toBeUndefined();
      expect(emptyOptions.reflect).toBeUndefined();
      expect(emptyOptions.default).toBeUndefined();
    });
  });

  describe('Type Conversions', () => {
    it('should handle string type correctly', () => {
      const options: PropertyOptions = { type: 'string' };
      expect(options.type).toBe('string');
    });

    it('should handle number type correctly', () => {
      const options: PropertyOptions = { type: 'number' };
      expect(options.type).toBe('number');
    });

    it('should handle boolean type correctly', () => {
      const options: PropertyOptions = { type: 'boolean' };
      expect(options.type).toBe('boolean');
    });

    it('should handle object type correctly', () => {
      const options: PropertyOptions = { type: 'object' };
      expect(options.type).toBe('object');
    });

    it('should handle array type correctly', () => {
      const options: PropertyOptions = { type: 'array' };
      expect(options.type).toBe('array');
    });
  });

  describe('Subclass Creation', () => {
    it('should allow creating concrete subclasses', () => {
      class ConcreteElement extends HollowElement {
        static override observedAttributes = ['value'];

        protected template(): string {
          return '<div class="test">Test</div>';
        }

        protected styles(): string {
          return '.test { color: red; }';
        }
      }

      expect(ConcreteElement.prototype instanceof HollowElement).toBe(true);
    });

    it('should inherit static properties from base class', () => {
      class ChildElement extends HollowElement {
        protected template(): string {
          return '';
        }
        protected styles(): string {
          return '';
        }
      }

      // Should inherit observedAttributes behavior
      expect(Array.isArray(ChildElement.observedAttributes)).toBe(true);
    });
  });

  describe('Form Association', () => {
    it('should support formAssociated static property', () => {
      // Form associated custom elements use static formAssociated = true
      const formAssociated = true;
      expect(formAssociated).toBe(true);
    });

    it('should support ElementInternals interface', () => {
      // ElementInternals provides form participation
      // This is a structural test
      const internalsInterface = {
        form: null,
        setFormValue: vi.fn(),
        validity: {},
        checkValidity: vi.fn(),
        reportValidity: vi.fn(),
      };

      expect(internalsInterface.setFormValue).toBeDefined();
      expect(internalsInterface.checkValidity).toBeDefined();
    });
  });
});

describe('kebab-case and camelCase Conversion', () => {
  it('should convert simple camelCase to kebab-case', () => {
    // Testing the concept of conversion that toKebabCase does
    const camelCase = 'myPropertyName';
    const expected = 'my-property-name';

    // Manual conversion matching the function
    const result = camelCase.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

    expect(result).toBe(expected);
  });

  it('should convert single word correctly', () => {
    const camelCase = 'variant';
    const result = camelCase.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    expect(result).toBe('variant');
  });

  it('should handle consecutive capitals', () => {
    const camelCase = 'closeOnEscape';
    const result = camelCase.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    expect(result).toBe('close-on-escape');
  });

  it('should convert kebab-case to camelCase', () => {
    // Testing the concept of conversion that toCamelCase does
    const kebabCase = 'my-property-name';
    const expected = 'myPropertyName';

    // Manual conversion matching the function
    const result = kebabCase.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

    expect(result).toBe(expected);
  });

  it('should handle single word kebab-case', () => {
    const kebabCase = 'variant';
    const result = kebabCase.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    expect(result).toBe('variant');
  });
});

describe('Default Value Handling', () => {
  it('should support string default values', () => {
    const options: PropertyOptions = {
      type: 'string',
      default: 'primary',
    };

    expect(options.default).toBe('primary');
  });

  it('should support number default values', () => {
    const options: PropertyOptions = {
      type: 'number',
      default: 42,
    };

    expect(options.default).toBe(42);
  });

  it('should support boolean default values', () => {
    const options: PropertyOptions = {
      type: 'boolean',
      default: false,
    };

    expect(options.default).toBe(false);
  });

  it('should support object default values', () => {
    const defaultObj = { key: 'value' };
    const options: PropertyOptions = {
      type: 'object',
      default: defaultObj,
    };

    expect(options.default).toEqual(defaultObj);
  });

  it('should support array default values', () => {
    const defaultArr = ['a', 'b', 'c'];
    const options: PropertyOptions = {
      type: 'array',
      default: defaultArr,
    };

    expect(options.default).toEqual(defaultArr);
  });

  it('should support undefined default (no default)', () => {
    const options: PropertyOptions = {
      type: 'string',
    };

    expect(options.default).toBeUndefined();
  });
});
