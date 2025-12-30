/**
 * @philjs/genui - Test Suite
 * Tests for AI-driven UI composition with A2UI protocol
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  // Protocol
  createRenderMessage,
  createUpdateMessage,
  createActionMessage,
  // Validator
  validateMessage,
  validateComponent,
  validateLayout,
  schemas,
  // Registry
  ComponentRegistry,
  createRegistry,
  getDefaultRegistry,
  setDefaultRegistry,
  // Sandbox
  ASTValidator,
  createValidator,
  DEFAULT_SANDBOX_CONFIG,
} from '../index.js';

// Mock crypto.randomUUID for consistent testing
vi.stubGlobal('crypto', {
  randomUUID: () => 'test-uuid-1234',
});

describe('@philjs/genui', () => {
  describe('Export Verification', () => {
    it('should export all protocol functions', () => {
      expect(createRenderMessage).toBeDefined();
      expect(typeof createRenderMessage).toBe('function');
      expect(createUpdateMessage).toBeDefined();
      expect(typeof createUpdateMessage).toBe('function');
      expect(createActionMessage).toBeDefined();
      expect(typeof createActionMessage).toBe('function');
    });

    it('should export all validator functions', () => {
      expect(validateMessage).toBeDefined();
      expect(typeof validateMessage).toBe('function');
      expect(validateComponent).toBeDefined();
      expect(typeof validateComponent).toBe('function');
      expect(validateLayout).toBeDefined();
      expect(typeof validateLayout).toBe('function');
      expect(schemas).toBeDefined();
    });

    it('should export registry components', () => {
      expect(ComponentRegistry).toBeDefined();
      expect(createRegistry).toBeDefined();
      expect(getDefaultRegistry).toBeDefined();
      expect(setDefaultRegistry).toBeDefined();
    });

    it('should export sandbox components', () => {
      expect(ASTValidator).toBeDefined();
      expect(createValidator).toBeDefined();
      expect(DEFAULT_SANDBOX_CONFIG).toBeDefined();
    });
  });

  describe('A2UI Protocol - createRenderMessage', () => {
    it('should create a valid render message with minimal config', () => {
      const message = createRenderMessage(
        { type: 'stack' },
        [{ id: 'test-1', type: 'text', props: { content: 'Hello' } }]
      );

      expect(message.version).toBe('1.0');
      expect(message.type).toBe('render');
      expect(message.payload.type).toBe('render');
      expect(message.metadata?.messageId).toBeDefined();
      expect(message.metadata?.timestamp).toBeDefined();
    });

    it('should create render message with layout options', () => {
      const message = createRenderMessage(
        {
          type: 'grid',
          columns: 3,
          gap: '16px',
          align: 'center',
          justify: 'between'
        },
        [{ id: 'btn-1', type: 'button', props: { label: 'Click' } }]
      );

      const payload = message.payload as { layout: { type: string; columns: number } };
      expect(payload.layout.type).toBe('grid');
      expect(payload.layout.columns).toBe(3);
    });

    it('should include bindings and actions when provided', () => {
      const message = createRenderMessage(
        { type: 'flex', direction: 'row' },
        [{ id: 'input-1', type: 'input', props: {} }],
        {
          bindings: [
            { id: 'b1', source: 'signal', path: 'user.name', targetId: 'input-1', targetProp: 'value' }
          ],
          actions: [
            { id: 'a1', trigger: 'click', handler: { type: 'emit', event: 'submit' } }
          ]
        }
      );

      const payload = message.payload as { bindings?: unknown[]; actions?: unknown[] };
      expect(payload.bindings).toHaveLength(1);
      expect(payload.actions).toHaveLength(1);
    });

    it('should merge custom metadata', () => {
      const message = createRenderMessage(
        { type: 'stack' },
        [],
        {
          metadata: {
            sessionId: 'session-123',
            priority: 'high',
            agentId: 'agent-1'
          }
        }
      );

      expect(message.metadata?.sessionId).toBe('session-123');
      expect(message.metadata?.priority).toBe('high');
      expect(message.metadata?.agentId).toBe('agent-1');
    });
  });

  describe('A2UI Protocol - createUpdateMessage', () => {
    it('should create update message with props', () => {
      const message = createUpdateMessage(
        'component-1',
        { props: { visible: true, label: 'Updated' } }
      );

      expect(message.type).toBe('update');
      const payload = message.payload as { targetId: string; props?: Record<string, unknown> };
      expect(payload.targetId).toBe('component-1');
      expect(payload.props?.visible).toBe(true);
    });

    it('should create update message with children', () => {
      const message = createUpdateMessage(
        'container-1',
        { children: [{ id: 'child-1', type: 'text', props: {} }] }
      );

      const payload = message.payload as { children?: unknown[] };
      expect(payload.children).toHaveLength(1);
    });

    it('should create update message with animation', () => {
      const message = createUpdateMessage(
        'panel-1',
        {
          props: { expanded: true },
          animation: { type: 'slide', duration: 300, direction: 'down' }
        }
      );

      const payload = message.payload as { animation?: { type: string } };
      expect(payload.animation?.type).toBe('slide');
    });
  });

  describe('A2UI Protocol - createActionMessage', () => {
    it('should create action message with event data', () => {
      const message = createActionMessage(
        'submit-action',
        { type: 'click', data: { x: 100, y: 200 } }
      );

      expect(message.type).toBe('action');
      const payload = message.payload as { actionId: string; event: { type: string } };
      expect(payload.actionId).toBe('submit-action');
      expect(payload.event.type).toBe('click');
    });

    it('should include component state when provided', () => {
      const message = createActionMessage(
        'change-action',
        { type: 'change', data: 'new value' },
        { formData: { name: 'John', email: 'john@test.com' } }
      );

      const payload = message.payload as { state?: Record<string, unknown> };
      expect(payload.state?.formData).toBeDefined();
    });
  });

  describe('Validator - validateMessage', () => {
    it('should validate a correct render message', () => {
      const message = createRenderMessage(
        { type: 'stack' },
        [{ id: 'test', type: 'text', props: {} }]
      );

      const result = validateMessage(message);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject message with invalid version', () => {
      const result = validateMessage({
        version: '2.0',
        type: 'render',
        payload: { type: 'render', layout: { type: 'stack' }, components: [] }
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject message with missing required fields', () => {
      const result = validateMessage({
        version: '1.0',
        type: 'render'
        // Missing payload
      });

      expect(result.valid).toBe(false);
    });

    it('should reject message with invalid layout type', () => {
      const result = validateMessage({
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'invalid-type' },
          components: []
        }
      });

      expect(result.valid).toBe(false);
    });
  });

  describe('Validator - validateComponent', () => {
    it('should validate a correct component', () => {
      const result = validateComponent({
        id: 'btn-1',
        type: 'button',
        props: { label: 'Click me' }
      });

      expect(result.valid).toBe(true);
    });

    it('should reject component without id', () => {
      const result = validateComponent({
        type: 'button',
        props: {}
      });

      expect(result.valid).toBe(false);
    });

    it('should reject component without type', () => {
      const result = validateComponent({
        id: 'btn-1',
        props: {}
      });

      expect(result.valid).toBe(false);
    });

    it('should validate component with children', () => {
      const result = validateComponent({
        id: 'container-1',
        type: 'div',
        props: {},
        children: [
          { id: 'child-1', type: 'text', props: { content: 'Hello' } }
        ]
      });

      expect(result.valid).toBe(true);
    });

    it('should validate component with accessibility attributes', () => {
      const result = validateComponent({
        id: 'nav-1',
        type: 'nav',
        props: {},
        a11y: {
          role: 'navigation',
          label: 'Main navigation',
          live: 'polite'
        }
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('Validator - validateLayout', () => {
    it('should validate stack layout', () => {
      const result = validateLayout({ type: 'stack', direction: 'column', gap: 16 });
      expect(result.valid).toBe(true);
    });

    it('should validate grid layout', () => {
      const result = validateLayout({ type: 'grid', columns: 3, rows: 2, gap: '1rem' });
      expect(result.valid).toBe(true);
    });

    it('should validate flex layout with all options', () => {
      const result = validateLayout({
        type: 'flex',
        direction: 'row',
        wrap: true,
        align: 'center',
        justify: 'between',
        padding: [16, 24]
      });

      expect(result.valid).toBe(true);
    });

    it('should reject invalid layout type', () => {
      const result = validateLayout({ type: 'invalid' });
      expect(result.valid).toBe(false);
    });
  });

  describe('ComponentRegistry', () => {
    let registry: ComponentRegistry;

    beforeEach(() => {
      registry = createRegistry();
    });

    it('should create a new registry', () => {
      expect(registry).toBeInstanceOf(ComponentRegistry);
    });

    it('should register and retrieve components', () => {
      const capability = {
        type: 'custom-button',
        displayName: 'Custom Button',
        description: 'A custom button component',
        category: 'input' as const,
        props: [
          { name: 'label', type: 'string' as const, required: true },
          { name: 'disabled', type: 'boolean' as const, default: false }
        ]
      };

      const renderer = vi.fn();
      registry.register(capability, renderer);

      expect(registry.isAllowed('custom-button')).toBe(true);
      expect(registry.getCapability('custom-button')).toEqual(capability);
      expect(registry.getRenderer('custom-button')).toBe(renderer);
    });

    it('should unregister components', () => {
      registry.register(
        { type: 'temp', displayName: 'Temp', description: 'Temp', category: 'display', props: [] },
        vi.fn()
      );

      expect(registry.isAllowed('temp')).toBe(true);
      registry.unregister('temp');
      expect(registry.isAllowed('temp')).toBe(false);
    });

    it('should get capabilities by category', () => {
      registry.register(
        { type: 'btn1', displayName: 'Btn1', description: 'Button 1', category: 'input', props: [] },
        vi.fn()
      );
      registry.register(
        { type: 'text1', displayName: 'Text1', description: 'Text 1', category: 'display', props: [] },
        vi.fn()
      );
      registry.register(
        { type: 'btn2', displayName: 'Btn2', description: 'Button 2', category: 'input', props: [] },
        vi.fn()
      );

      const inputComponents = registry.getCapabilitiesByCategory('input');
      expect(inputComponents).toHaveLength(2);
    });

    it('should search capabilities by query', () => {
      registry.register(
        { type: 'search-box', displayName: 'Search Box', description: 'Search input', category: 'input', props: [], tags: ['search', 'input'] },
        vi.fn()
      );
      registry.register(
        { type: 'text-field', displayName: 'Text Field', description: 'Text input', category: 'input', props: [] },
        vi.fn()
      );

      const results = registry.searchCapabilities('search');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].type).toBe('search-box');
    });

    it('should generate manifest for LLM', () => {
      registry.register(
        { type: 'button', displayName: 'Button', description: 'A button', category: 'input', props: [{ name: 'label', type: 'string' as const }] },
        vi.fn()
      );

      const manifest = registry.generateManifest();
      expect(manifest.version).toBe('1.0');
      expect(manifest.componentCount).toBe(1);
      expect(manifest.components).toHaveLength(1);
    });

    it('should generate compact manifest', () => {
      registry.register(
        { type: 'button', displayName: 'Button', description: 'A button component for user interactions', category: 'input', props: [{ name: 'label', type: 'string' as const, required: true }] },
        vi.fn()
      );

      const compact = registry.generateCompactManifest();
      expect(compact.v).toBe('1.0');
      expect(compact.c[0].t).toBe('button');
      expect(compact.c[0].p).toContain('label');
    });

    it('should clear all registrations', () => {
      registry.register(
        { type: 'test', displayName: 'Test', description: 'Test', category: 'display', props: [] },
        vi.fn()
      );

      registry.clear();
      expect(registry.getRegisteredTypes()).toHaveLength(0);
    });
  });

  describe('Default Registry', () => {
    it('should return the same default registry', () => {
      const reg1 = getDefaultRegistry();
      const reg2 = getDefaultRegistry();
      expect(reg1).toBe(reg2);
    });

    it('should allow setting a custom default registry', () => {
      const customRegistry = createRegistry();
      setDefaultRegistry(customRegistry);
      expect(getDefaultRegistry()).toBe(customRegistry);
    });
  });

  describe('Schemas', () => {
    it('should export all schema definitions', () => {
      expect(schemas.message).toBeDefined();
      expect(schemas.component).toBeDefined();
      expect(schemas.layout).toBeDefined();
      expect(schemas.binding).toBeDefined();
      expect(schemas.action).toBeDefined();
      expect(schemas.animation).toBeDefined();
      expect(schemas.metadata).toBeDefined();
      expect(schemas.payload).toBeDefined();
    });
  });
});
