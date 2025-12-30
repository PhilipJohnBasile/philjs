/**
 * Sandbox/AST Validator Tests
 * Tests for security validation of AI-generated UI specifications
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ASTValidator,
  createValidator,
  DEFAULT_SANDBOX_CONFIG,
  type SandboxConfig,
  type A2UIMessage,
  type A2UIComponent,
} from '../index.js';

describe('ASTValidator', () => {
  let validator: ASTValidator;

  beforeEach(() => {
    validator = createValidator();
  });

  describe('DEFAULT_SANDBOX_CONFIG', () => {
    it('should have sensible default values', () => {
      expect(DEFAULT_SANDBOX_CONFIG.maxDepth).toBeGreaterThan(0);
      expect(DEFAULT_SANDBOX_CONFIG.maxComponents).toBeGreaterThan(0);
      expect(DEFAULT_SANDBOX_CONFIG.maxBindings).toBeGreaterThan(0);
      expect(DEFAULT_SANDBOX_CONFIG.maxActions).toBeGreaterThan(0);
    });

    it('should include common allowed components', () => {
      const config = DEFAULT_SANDBOX_CONFIG;

      expect(config.allowedComponents).toContain('Button');
      expect(config.allowedComponents).toContain('Input');
      expect(config.allowedComponents).toContain('Text');
      expect(config.allowedComponents).toContain('Box');
      expect(config.allowedComponents).toContain('Stack');
    });

    it('should have forbidden patterns for security', () => {
      const config = DEFAULT_SANDBOX_CONFIG;

      expect(config.forbiddenPatterns.length).toBeGreaterThan(0);
    });

    it('should allow all action types by default', () => {
      const config = DEFAULT_SANDBOX_CONFIG;

      expect(config.allowedActions).toContain('emit');
      expect(config.allowedActions).toContain('navigate');
      expect(config.allowedActions).toContain('signal');
      expect(config.allowedActions).toContain('agent');
    });
  });

  describe('validate message', () => {
    it('should validate a correct message', () => {
      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [
            { id: 'btn-1', type: 'Button', props: { children: 'Click me' } },
          ],
        },
      };

      const result = validator.validate(message);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid version', () => {
      const message = {
        version: '2.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [],
        },
      } as A2UIMessage;

      const result = validator.validate(message);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_MESSAGE')).toBe(true);
    });
  });

  describe('component type validation', () => {
    it('should allow registered component types', () => {
      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [
            { id: 'text-1', type: 'Text', props: { children: 'Hello' } },
            { id: 'btn-1', type: 'Button', props: { children: 'Click' } },
          ],
        },
      };

      const result = validator.validate(message);

      expect(result.valid).toBe(true);
    });

    it('should reject disallowed component types', () => {
      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [
            { id: 'evil-1', type: 'EvilComponent', props: {} },
          ],
        },
      };

      const result = validator.validate(message);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_COMPONENT')).toBe(true);
    });
  });

  describe('component depth validation', () => {
    it('should allow components within depth limit', () => {
      // Create nested structure at depth 3
      const nested: A2UIComponent = {
        id: 'level-3',
        type: 'Box',
        props: {},
      };
      const level2: A2UIComponent = {
        id: 'level-2',
        type: 'Box',
        props: {},
        children: [nested],
      };
      const level1: A2UIComponent = {
        id: 'level-1',
        type: 'Box',
        props: {},
        children: [level2],
      };

      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [level1],
        },
      };

      const result = validator.validate(message);

      expect(result.valid).toBe(true);
    });

    it('should reject components exceeding depth limit', () => {
      const customValidator = createValidator({ maxDepth: 2 });

      // Create deeply nested structure
      let deepest: A2UIComponent = { id: 'deep-5', type: 'Box', props: {} };
      for (let i = 4; i >= 1; i--) {
        deepest = { id: `deep-${i}`, type: 'Box', props: {}, children: [deepest] };
      }

      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [deepest],
        },
      };

      const result = customValidator.validate(message);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('too deep'))).toBe(true);
    });
  });

  describe('component count validation', () => {
    it('should reject when exceeding max components', () => {
      const customValidator = createValidator({ maxComponents: 3 });

      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [
            { id: 'c1', type: 'Text', props: {} },
            { id: 'c2', type: 'Text', props: {} },
            { id: 'c3', type: 'Text', props: {} },
            { id: 'c4', type: 'Text', props: {} },
          ],
        },
      };

      const result = customValidator.validate(message);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Too many components'))).toBe(true);
    });
  });

  describe('prop validation', () => {
    it('should allow valid props for component', () => {
      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [
            {
              id: 'btn-1',
              type: 'Button',
              props: { children: 'Click', variant: 'primary', disabled: false },
            },
          ],
        },
      };

      const result = validator.validate(message);

      expect(result.valid).toBe(true);
    });

    it('should reject invalid props for component', () => {
      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [
            {
              id: 'btn-1',
              type: 'Button',
              props: { children: 'Click', dangerouslySetInnerHTML: '<script>' },
            },
          ],
        },
      };

      const result = validator.validate(message);

      expect(result.valid).toBe(false);
    });
  });

  describe('script injection prevention', () => {
    it('should reject javascript: URLs', () => {
      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [
            {
              id: 'link-1',
              type: 'Link',
              props: { href: 'javascript:alert(1)', children: 'Evil link' },
            },
          ],
        },
      };

      const result = validator.validate(message);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'SECURITY_VIOLATION')).toBe(true);
    });

    it('should reject data: URLs', () => {
      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [
            {
              id: 'img-1',
              type: 'Image',
              props: { src: 'data:text/html,<script>alert(1)</script>', alt: 'evil' },
            },
          ],
        },
      };

      const result = validator.validate(message);

      expect(result.valid).toBe(false);
    });

    it('should reject script tags in strings', () => {
      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [
            {
              id: 'text-1',
              type: 'Text',
              props: { children: 'Hello <script>alert(1)</script> World' },
            },
          ],
        },
      };

      const result = validator.validate(message);

      expect(result.valid).toBe(false);
    });

    it('should reject event handlers in strings', () => {
      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [
            {
              id: 'text-1',
              type: 'Text',
              props: { children: 'Hello onclick=alert(1) World' },
            },
          ],
        },
      };

      const result = validator.validate(message);

      expect(result.valid).toBe(false);
    });

    it('should reject eval in expressions', () => {
      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [
            {
              id: 'cond-1',
              type: 'Box',
              props: {},
              when: { expression: 'eval("malicious code")' },
            },
          ],
        },
      };

      const result = validator.validate(message);

      expect(result.valid).toBe(false);
    });

    it('should reject Function constructor', () => {
      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [
            {
              id: 'cond-1',
              type: 'Box',
              props: {},
              when: { expression: 'new Function("return this")()' },
            },
          ],
        },
      };

      const result = validator.validate(message);

      expect(result.valid).toBe(false);
    });

    it('should reject document access', () => {
      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [
            {
              id: 'cond-1',
              type: 'Box',
              props: {},
              when: { expression: 'document.cookie' },
            },
          ],
        },
      };

      const result = validator.validate(message);

      expect(result.valid).toBe(false);
    });

    it('should reject window access', () => {
      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [
            {
              id: 'cond-1',
              type: 'Box',
              props: {},
              when: { expression: 'window.location.href' },
            },
          ],
        },
      };

      const result = validator.validate(message);

      expect(result.valid).toBe(false);
    });

    it('should reject prototype pollution attempts', () => {
      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [
            {
              id: 'evil-1',
              type: 'Text',
              props: { children: '__proto__.polluted = true' },
            },
          ],
        },
      };

      const result = validator.validate(message);

      expect(result.valid).toBe(false);
    });
  });

  describe('action validation', () => {
    it('should allow valid action types', () => {
      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [],
          actions: [
            { id: 'action-1', trigger: 'click', handler: { type: 'emit', event: 'clicked' } },
          ],
        },
      };

      const result = validator.validate(message);

      expect(result.valid).toBe(true);
    });

    it('should reject disallowed action types', () => {
      const customValidator = createValidator({
        allowedActions: ['emit'], // Only allow emit
      });

      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [],
          actions: [
            { id: 'nav-1', trigger: 'click', handler: { type: 'navigate', to: '/page' } },
          ],
        },
      };

      const result = customValidator.validate(message);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Action type not allowed'))).toBe(true);
    });

    it('should reject custom events when disabled', () => {
      const customValidator = createValidator({
        allowCustomEvents: false,
      });

      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [],
          actions: [
            {
              id: 'custom-1',
              trigger: 'custom',
              customEvent: 'myEvent',
              handler: { type: 'emit', event: 'custom' },
            },
          ],
        },
      };

      const result = customValidator.validate(message);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Custom events'))).toBe(true);
    });
  });

  describe('navigation URL validation', () => {
    it('should block javascript: URLs in navigation', () => {
      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [],
          actions: [
            {
              id: 'nav-1',
              trigger: 'click',
              handler: { type: 'navigate', to: 'javascript:alert(1)' },
            },
          ],
        },
      };

      const result = validator.validate(message);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Navigation URL blocked'))).toBe(true);
    });

    it('should block file: URLs in navigation', () => {
      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [],
          actions: [
            {
              id: 'nav-1',
              trigger: 'click',
              handler: { type: 'navigate', to: 'file:///etc/passwd' },
            },
          ],
        },
      };

      const result = validator.validate(message);

      expect(result.valid).toBe(false);
    });

    it('should allow valid URLs', () => {
      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [],
          actions: [
            {
              id: 'nav-1',
              trigger: 'click',
              handler: { type: 'navigate', to: '/dashboard' },
            },
            {
              id: 'nav-2',
              trigger: 'click',
              handler: { type: 'navigate', to: 'https://example.com' },
            },
          ],
        },
      };

      const result = validator.validate(message);

      expect(result.valid).toBe(true);
    });

    it('should enforce URL whitelist when configured', () => {
      const customValidator = createValidator({
        allowedNavigationUrls: [/^\/app\//, /^https:\/\/trusted\.com/],
      });

      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [],
          actions: [
            {
              id: 'nav-1',
              trigger: 'click',
              handler: { type: 'navigate', to: 'https://untrusted.com' },
            },
          ],
        },
      };

      const result = customValidator.validate(message);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('not in whitelist'))).toBe(true);
    });
  });

  describe('binding validation', () => {
    it('should validate bindings', () => {
      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [
            { id: 'input-1', type: 'Input', props: {} },
          ],
          bindings: [
            {
              id: 'bind-1',
              source: 'signal',
              path: 'form.name',
              targetId: 'input-1',
              targetProp: 'value',
            },
          ],
        },
      };

      const result = validator.validate(message);

      expect(result.valid).toBe(true);
    });

    it('should reject bindings exceeding limit', () => {
      const customValidator = createValidator({ maxBindings: 2 });

      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [],
          bindings: [
            { id: 'b1', source: 'signal', path: 'a', targetId: 't1', targetProp: 'p1' },
            { id: 'b2', source: 'signal', path: 'b', targetId: 't2', targetProp: 'p2' },
            { id: 'b3', source: 'signal', path: 'c', targetId: 't3', targetProp: 'p3' },
          ],
        },
      };

      const result = customValidator.validate(message);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Too many bindings'))).toBe(true);
    });

    it('should reject malicious transform expressions', () => {
      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [],
          bindings: [
            {
              id: 'bind-1',
              source: 'signal',
              path: 'data',
              targetId: 'target-1',
              targetProp: 'value',
              transform: 'eval(this)',
            },
          ],
        },
      };

      const result = validator.validate(message);

      expect(result.valid).toBe(false);
    });
  });

  describe('config management', () => {
    it('should allow updating config', () => {
      validator.updateConfig({ maxDepth: 5 });

      const config = validator.getConfig();

      expect(config.maxDepth).toBe(5);
    });

    it('should preserve other config values when updating', () => {
      const originalComponents = validator.getConfig().maxComponents;

      validator.updateConfig({ maxDepth: 5 });

      expect(validator.getConfig().maxComponents).toBe(originalComponents);
    });
  });

  describe('inline styles', () => {
    it('should generate warning when inline styles are disabled', () => {
      const customValidator = createValidator({ allowInlineStyles: false });

      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [
            {
              id: 'styled-1',
              type: 'Box',
              props: {},
              style: { color: 'red' },
            },
          ],
        },
      };

      const result = customValidator.validate(message);

      // Should still be valid but with warnings
      expect(result.warnings.some((w) => w.includes('Inline styles'))).toBe(true);
    });
  });
});

describe('createValidator', () => {
  it('should create validator with default config', () => {
    const validator = createValidator();

    expect(validator).toBeInstanceOf(ASTValidator);
    expect(validator.getConfig().maxDepth).toBe(DEFAULT_SANDBOX_CONFIG.maxDepth);
  });

  it('should create validator with custom config', () => {
    const validator = createValidator({
      maxDepth: 3,
      maxComponents: 50,
    });

    expect(validator.getConfig().maxDepth).toBe(3);
    expect(validator.getConfig().maxComponents).toBe(50);
  });
});
