/**
 * A2UI Schema Tests
 * Tests for A2UI message creation and validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createRenderMessage,
  createUpdateMessage,
  createActionMessage,
  validateMessage,
  validateComponent,
  validateLayout,
  schemas,
  type A2UIMessage,
  type A2UIComponent,
  type A2UILayout,
  type A2UIBinding,
  type A2UIAction,
} from '../index.js';

describe('A2UI Schema', () => {
  describe('createRenderMessage', () => {
    it('should create a valid render message with required fields', () => {
      const layout: A2UILayout = { type: 'stack' };
      const components: A2UIComponent[] = [
        {
          id: 'text-1',
          type: 'Text',
          props: { children: 'Hello World' },
        },
      ];

      const message = createRenderMessage(layout, components);

      expect(message.version).toBe('1.0');
      expect(message.type).toBe('render');
      expect(message.payload.type).toBe('render');
      expect(message.metadata?.messageId).toBeDefined();
      expect(message.metadata?.timestamp).toBeDefined();
    });

    it('should create a render message with bindings and actions', () => {
      const layout: A2UILayout = { type: 'flex', direction: 'row', gap: '16px' };
      const components: A2UIComponent[] = [
        {
          id: 'input-1',
          type: 'Input',
          props: { placeholder: 'Enter text' },
        },
      ];
      const bindings: A2UIBinding[] = [
        {
          id: 'binding-1',
          source: 'signal',
          path: 'formData.name',
          targetId: 'input-1',
          targetProp: 'value',
        },
      ];
      const actions: A2UIAction[] = [
        {
          id: 'action-1',
          trigger: 'click',
          handler: { type: 'emit', event: 'submit' },
        },
      ];

      const message = createRenderMessage(layout, components, { bindings, actions });

      expect(message.payload.type).toBe('render');
      if (message.payload.type === 'render') {
        expect(message.payload.bindings).toHaveLength(1);
        expect(message.payload.actions).toHaveLength(1);
      }
    });

    it('should create a render message with metadata', () => {
      const layout: A2UILayout = { type: 'grid', columns: '1fr 1fr', gap: '8px' };
      const components: A2UIComponent[] = [];
      const metadata = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        priority: 'high' as const,
      };

      const message = createRenderMessage(layout, components, { metadata });

      expect(message.metadata?.sessionId).toBe('session-123');
      expect(message.metadata?.agentId).toBe('agent-456');
      expect(message.metadata?.priority).toBe('high');
    });

    it('should support all layout types', () => {
      const layoutTypes: A2UILayout['type'][] = ['stack', 'grid', 'flex', 'absolute', 'flow'];

      for (const type of layoutTypes) {
        const message = createRenderMessage({ type }, []);
        if (message.payload.type === 'render') {
          expect(message.payload.layout.type).toBe(type);
        }
      }
    });
  });

  describe('createUpdateMessage', () => {
    it('should create a valid update message with props', () => {
      const message = createUpdateMessage('component-1', {
        props: { disabled: true, value: 'new value' },
      });

      expect(message.version).toBe('1.0');
      expect(message.type).toBe('update');
      expect(message.payload.type).toBe('update');
      if (message.payload.type === 'update') {
        expect(message.payload.targetId).toBe('component-1');
        expect(message.payload.props?.disabled).toBe(true);
      }
    });

    it('should create an update message with children', () => {
      const children: A2UIComponent[] = [
        { id: 'child-1', type: 'Text', props: { children: 'New child' } },
      ];

      const message = createUpdateMessage('container-1', { children });

      if (message.payload.type === 'update') {
        expect(message.payload.children).toHaveLength(1);
        expect(message.payload.children?.[0]?.id).toBe('child-1');
      }
    });

    it('should create an update message with animation', () => {
      const message = createUpdateMessage('panel-1', {
        props: { visible: true },
        animation: { type: 'fade', duration: 300, easing: 'ease-out' },
      });

      if (message.payload.type === 'update') {
        expect(message.payload.animation?.type).toBe('fade');
        expect(message.payload.animation?.duration).toBe(300);
      }
    });
  });

  describe('createActionMessage', () => {
    it('should create a valid action message', () => {
      const message = createActionMessage('btn-click', { type: 'click', data: { x: 100, y: 200 } });

      expect(message.version).toBe('1.0');
      expect(message.type).toBe('action');
      expect(message.payload.type).toBe('action');
      if (message.payload.type === 'action') {
        expect(message.payload.actionId).toBe('btn-click');
        expect(message.payload.event.type).toBe('click');
        expect(message.payload.event.data).toEqual({ x: 100, y: 200 });
      }
    });

    it('should create an action message with state', () => {
      const state = { formValues: { name: 'John', email: 'john@example.com' } };
      const message = createActionMessage('form-submit', { type: 'submit' }, state);

      if (message.payload.type === 'action') {
        expect(message.payload.state).toEqual(state);
      }
    });

    it('should include metadata', () => {
      const metadata = { sessionId: 'session-abc', priority: 'normal' as const };
      const message = createActionMessage('action-1', { type: 'custom' }, undefined, metadata);

      expect(message.metadata?.sessionId).toBe('session-abc');
    });
  });
});

describe('A2UI Validation', () => {
  describe('validateMessage', () => {
    it('should validate a correct render message', () => {
      const message: A2UIMessage = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [
            { id: 'comp-1', type: 'Text', props: { children: 'Hello' } },
          ],
        },
      };

      const result = validateMessage(message);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toBeDefined();
    });

    it('should reject message with invalid version', () => {
      const message = {
        version: '2.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [],
        },
      };

      const result = validateMessage(message);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject message with missing required fields', () => {
      const message = {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          // Missing layout and components
        },
      };

      const result = validateMessage(message);

      expect(result.valid).toBe(false);
    });

    it('should validate update message', () => {
      const message: A2UIMessage = {
        version: '1.0',
        type: 'update',
        payload: {
          type: 'update',
          targetId: 'comp-1',
          props: { value: 'new value' },
        },
      };

      const result = validateMessage(message);

      expect(result.valid).toBe(true);
    });

    it('should validate action message', () => {
      const message: A2UIMessage = {
        version: '1.0',
        type: 'action',
        payload: {
          type: 'action',
          actionId: 'btn-1',
          event: { type: 'click' },
        },
      };

      const result = validateMessage(message);

      expect(result.valid).toBe(true);
    });

    it('should validate query message', () => {
      const message: A2UIMessage = {
        version: '1.0',
        type: 'query',
        payload: {
          type: 'query',
          query: 'components',
        },
      };

      const result = validateMessage(message);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateComponent', () => {
    it('should validate a correct component', () => {
      const component: A2UIComponent = {
        id: 'btn-1',
        type: 'Button',
        props: { children: 'Click me', variant: 'primary' },
      };

      const result = validateComponent(component);

      expect(result.valid).toBe(true);
    });

    it('should reject component with empty id', () => {
      const component = {
        id: '',
        type: 'Text',
        props: {},
      };

      const result = validateComponent(component);

      expect(result.valid).toBe(false);
    });

    it('should reject component with empty type', () => {
      const component = {
        id: 'comp-1',
        type: '',
        props: {},
      };

      const result = validateComponent(component);

      expect(result.valid).toBe(false);
    });

    it('should validate component with children', () => {
      const component: A2UIComponent = {
        id: 'container-1',
        type: 'Box',
        props: {},
        children: [
          { id: 'child-1', type: 'Text', props: { children: 'Child text' } },
        ],
      };

      const result = validateComponent(component);

      expect(result.valid).toBe(true);
    });

    it('should validate component with conditional rendering', () => {
      const component: A2UIComponent = {
        id: 'conditional-1',
        type: 'Alert',
        props: { children: 'Error message' },
        when: {
          expression: 'hasError',
          fallback: { id: 'fallback-1', type: 'Text', props: { children: 'No errors' } },
        },
      };

      const result = validateComponent(component);

      expect(result.valid).toBe(true);
    });

    it('should validate component with iteration', () => {
      const component: A2UIComponent = {
        id: 'list-1',
        type: 'ListItem',
        props: {},
        each: {
          source: 'items',
          item: 'item',
          index: 'i',
          key: 'id',
        },
      };

      const result = validateComponent(component);

      expect(result.valid).toBe(true);
    });

    it('should validate component with accessibility attributes', () => {
      const component: A2UIComponent = {
        id: 'accessible-btn',
        type: 'Button',
        props: { children: 'Submit' },
        a11y: {
          role: 'button',
          label: 'Submit form',
          live: 'polite',
          tabIndex: 0,
        },
      };

      const result = validateComponent(component);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateLayout', () => {
    it('should validate stack layout', () => {
      const layout: A2UILayout = {
        type: 'stack',
        direction: 'column',
        gap: '16px',
        align: 'center',
      };

      const result = validateLayout(layout);

      expect(result.valid).toBe(true);
    });

    it('should validate grid layout', () => {
      const layout: A2UILayout = {
        type: 'grid',
        columns: 'repeat(3, 1fr)',
        rows: 'auto',
        gap: '8px',
      };

      const result = validateLayout(layout);

      expect(result.valid).toBe(true);
    });

    it('should validate flex layout with all options', () => {
      const layout: A2UILayout = {
        type: 'flex',
        direction: 'row',
        gap: 16,
        align: 'stretch',
        justify: 'between',
        wrap: true,
        padding: [16, 24],
      };

      const result = validateLayout(layout);

      expect(result.valid).toBe(true);
    });

    it('should reject invalid layout type', () => {
      const layout = {
        type: 'invalid',
      };

      const result = validateLayout(layout);

      expect(result.valid).toBe(false);
    });

    it('should reject invalid direction value', () => {
      const layout = {
        type: 'stack',
        direction: 'diagonal',
      };

      const result = validateLayout(layout);

      expect(result.valid).toBe(false);
    });

    it('should validate layout with 4-value padding', () => {
      const layout: A2UILayout = {
        type: 'flow',
        padding: [8, 16, 8, 16],
      };

      const result = validateLayout(layout);

      expect(result.valid).toBe(true);
    });
  });

  describe('schemas', () => {
    it('should export all schema objects', () => {
      expect(schemas.message).toBeDefined();
      expect(schemas.component).toBeDefined();
      expect(schemas.layout).toBeDefined();
      expect(schemas.binding).toBeDefined();
      expect(schemas.action).toBeDefined();
      expect(schemas.animation).toBeDefined();
      expect(schemas.metadata).toBeDefined();
      expect(schemas.payload).toBeDefined();
    });

    it('should validate binding with schema', () => {
      const binding = {
        id: 'bind-1',
        source: 'signal',
        path: 'user.name',
        targetId: 'display-1',
        targetProp: 'textContent',
        defaultValue: 'Anonymous',
      };

      const result = schemas.binding.safeParse(binding);

      expect(result.success).toBe(true);
    });

    it('should validate emit action handler', () => {
      const action = {
        id: 'action-1',
        trigger: 'click',
        handler: { type: 'emit', event: 'buttonClicked', payload: { button: 'submit' } },
        preventDefault: true,
      };

      const result = schemas.action.safeParse(action);

      expect(result.success).toBe(true);
    });

    it('should validate navigate action handler', () => {
      const action = {
        id: 'nav-1',
        trigger: 'click',
        handler: { type: 'navigate', to: '/dashboard', replace: true },
      };

      const result = schemas.action.safeParse(action);

      expect(result.success).toBe(true);
    });

    it('should validate signal action handler', () => {
      const action = {
        id: 'sig-1',
        trigger: 'change',
        handler: { type: 'signal', action: 'set', path: 'form.value', value: 'test' },
      };

      const result = schemas.action.safeParse(action);

      expect(result.success).toBe(true);
    });

    it('should validate agent action handler', () => {
      const action = {
        id: 'agent-1',
        trigger: 'submit',
        handler: { type: 'agent', intent: 'processForm', context: { formId: 'signup' }, await: true },
      };

      const result = schemas.action.safeParse(action);

      expect(result.success).toBe(true);
    });

    it('should validate animation schema', () => {
      const animation = {
        type: 'slide',
        duration: 200,
        easing: 'ease-in-out',
        direction: 'left',
      };

      const result = schemas.animation.safeParse(animation);

      expect(result.success).toBe(true);
    });
  });
});
