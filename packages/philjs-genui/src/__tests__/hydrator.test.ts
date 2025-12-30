/**
 * GenUI Hydrator Tests
 * Tests for runtime hydration of A2UI messages
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import {
  GenUIHydrator,
  createHydrator,
  ComponentRegistry,
  createRegistry,
  registerBuiltins,
  createRenderMessage,
  type A2UIMessage,
  type A2UIComponent,
  type A2UILayout,
  type HydratorOptions,
} from '../index.js';

// Setup JSDOM for DOM tests
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>');
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;

describe('GenUIHydrator', () => {
  let registry: ComponentRegistry;
  let hydrator: GenUIHydrator;
  let container: HTMLElement;

  beforeEach(() => {
    registry = createRegistry();
    registerBuiltins(registry);
    hydrator = createHydrator(registry);
    container = document.createElement('div');
  });

  describe('hydrate render message', () => {
    it('should hydrate a simple render message', () => {
      const message = createRenderMessage(
        { type: 'stack' },
        [
          { id: 'text-1', type: 'Text', props: { children: 'Hello World' } },
        ]
      );

      const result = hydrator.hydrate(message, container);

      expect(result.success).toBe(true);
      expect(result.element).toBeDefined();
      expect(container.children.length).toBe(1);
    });

    it('should create layout wrapper with correct styles', () => {
      const message = createRenderMessage(
        { type: 'flex', direction: 'row', gap: '16px', align: 'center' },
        []
      );

      const result = hydrator.hydrate(message, container);

      expect(result.success).toBe(true);
      expect(result.element?.style.display).toBe('flex');
      expect(result.element?.style.flexDirection).toBe('row');
      expect(result.element?.style.gap).toBe('16px');
      expect(result.element?.style.alignItems).toBe('center');
    });

    it('should handle grid layout', () => {
      const message = createRenderMessage(
        { type: 'grid', columns: 'repeat(3, 1fr)', gap: '8px' },
        []
      );

      const result = hydrator.hydrate(message, container);

      expect(result.success).toBe(true);
      expect(result.element?.style.display).toBe('grid');
      expect(result.element?.style.gridTemplateColumns).toBe('repeat(3, 1fr)');
    });

    it('should render multiple components', () => {
      const message = createRenderMessage(
        { type: 'stack' },
        [
          { id: 'heading-1', type: 'Heading', props: { children: 'Title', level: 1 } },
          { id: 'text-1', type: 'Text', props: { children: 'Description' } },
          { id: 'btn-1', type: 'Button', props: { children: 'Click me' } },
        ]
      );

      const result = hydrator.hydrate(message, container);

      expect(result.success).toBe(true);
      expect(result.componentMap?.size).toBe(3);
    });

    it('should render nested components', () => {
      const message = createRenderMessage(
        { type: 'stack' },
        [
          {
            id: 'box-1',
            type: 'Box',
            props: {},
            children: [
              { id: 'text-1', type: 'Text', props: { children: 'Inside box' } },
            ],
          },
        ]
      );

      const result = hydrator.hydrate(message, container);

      expect(result.success).toBe(true);
      expect(result.componentMap?.get('box-1')).toBeDefined();
      expect(result.componentMap?.get('text-1')).toBeDefined();
    });

    it('should apply className to components', () => {
      const message = createRenderMessage(
        { type: 'stack' },
        [
          { id: 'styled-1', type: 'Box', props: {}, className: 'my-class another-class' },
        ]
      );

      const result = hydrator.hydrate(message, container);
      const element = result.componentMap?.get('styled-1');

      expect(element?.className).toBe('my-class another-class');
    });

    it('should apply inline styles to components', () => {
      const message = createRenderMessage(
        { type: 'stack' },
        [
          {
            id: 'styled-1',
            type: 'Box',
            props: {},
            style: { backgroundColor: 'red', padding: '16px' },
          },
        ]
      );

      const result = hydrator.hydrate(message, container);
      const element = result.componentMap?.get('styled-1');

      expect(element?.style.backgroundColor).toBe('red');
      expect(element?.style.padding).toBe('16px');
    });

    it('should apply accessibility attributes', () => {
      const message = createRenderMessage(
        { type: 'stack' },
        [
          {
            id: 'accessible-1',
            type: 'Button',
            props: { children: 'Submit' },
            a11y: {
              role: 'button',
              label: 'Submit form',
              live: 'polite',
              tabIndex: 0,
            },
          },
        ]
      );

      const result = hydrator.hydrate(message, container);
      const element = result.componentMap?.get('accessible-1');

      expect(element?.getAttribute('role')).toBe('button');
      expect(element?.getAttribute('aria-label')).toBe('Submit form');
      expect(element?.getAttribute('aria-live')).toBe('polite');
      expect(element?.tabIndex).toBe(0);
    });
  });

  describe('hydrate update message', () => {
    it('should update existing component props', () => {
      // First render
      const renderMessage = createRenderMessage(
        { type: 'stack' },
        [{ id: 'btn-1', type: 'Button', props: { children: 'Original' } }]
      );
      hydrator.hydrate(renderMessage, container);

      // Then update
      const updateMessage: A2UIMessage = {
        version: '1.0',
        type: 'update',
        payload: {
          type: 'update',
          targetId: 'btn-1',
          props: { disabled: true },
        },
      };

      const result = hydrator.hydrate(updateMessage, container);

      expect(result.success).toBe(true);
      expect(result.element?.hasAttribute('disabled')).toBe(true);
    });

    it('should fail to update non-existent component', () => {
      const updateMessage: A2UIMessage = {
        version: '1.0',
        type: 'update',
        payload: {
          type: 'update',
          targetId: 'non-existent',
          props: { value: 'test' },
        },
      };

      const result = hydrator.hydrate(updateMessage, container);

      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.code).toBe('COMPONENT_NOT_FOUND');
    });
  });

  describe('conditional rendering', () => {
    it('should render component when condition is true', () => {
      const options: HydratorOptions = {
        signals: new Map([
          ['showAlert', { get: () => true, set: () => {} }],
        ]),
      };
      const hydratorWithSignals = createHydrator(registry, options);

      const message = createRenderMessage(
        { type: 'stack' },
        [
          {
            id: 'alert-1',
            type: 'Alert',
            props: { children: 'Error!' },
            when: { expression: 'showAlert' },
          },
        ]
      );

      const result = hydratorWithSignals.hydrate(message, container);

      expect(result.success).toBe(true);
      expect(result.componentMap?.get('alert-1')).toBeDefined();
    });

    it('should not render component when condition is false', () => {
      const options: HydratorOptions = {
        signals: new Map([
          ['showAlert', { get: () => false, set: () => {} }],
        ]),
      };
      const hydratorWithSignals = createHydrator(registry, options);

      const message = createRenderMessage(
        { type: 'stack' },
        [
          {
            id: 'alert-1',
            type: 'Alert',
            props: { children: 'Error!' },
            when: { expression: 'showAlert' },
          },
        ]
      );

      const result = hydratorWithSignals.hydrate(message, container);

      expect(result.success).toBe(true);
      expect(result.componentMap?.get('alert-1')).toBeUndefined();
    });

    it('should render fallback when condition is false', () => {
      const message = createRenderMessage(
        { type: 'stack' },
        [
          {
            id: 'conditional-1',
            type: 'Alert',
            props: { children: 'Error!' },
            when: {
              expression: 'false',
              fallback: {
                id: 'fallback-1',
                type: 'Text',
                props: { children: 'No errors' },
              },
            },
          },
        ]
      );

      const result = hydrator.hydrate(message, container);

      expect(result.success).toBe(true);
      expect(result.componentMap?.get('conditional-1')).toBeUndefined();
      expect(result.componentMap?.get('fallback-1')).toBeDefined();
    });
  });

  describe('unknown components', () => {
    it('should create fallback element for unknown component types', () => {
      const message = createRenderMessage(
        { type: 'stack' },
        [{ id: 'unknown-1', type: 'NonExistentComponent', props: {} }]
      );

      const result = hydrator.hydrate(message, container);

      expect(result.success).toBe(true);
      const element = result.componentMap?.get('unknown-1');
      expect(element).toBeDefined();
      expect(element?.dataset.unknownComponent).toBe('NonExistentComponent');
    });
  });

  describe('agent action callbacks', () => {
    it('should call onAgentAction when component emits event', () => {
      const onAgentAction = vi.fn();
      const hydratorWithCallback = createHydrator(registry, { onAgentAction });

      const message = createRenderMessage(
        { type: 'stack' },
        [{ id: 'btn-1', type: 'Button', props: { children: 'Click' } }]
      );

      const result = hydratorWithCallback.hydrate(message, container);
      const button = result.componentMap?.get('btn-1') as HTMLButtonElement;

      // Simulate click
      button.click();

      expect(onAgentAction).toHaveBeenCalledWith('btn-1', expect.objectContaining({
        type: 'click',
      }));
    });
  });

  describe('cleanup', () => {
    it('should clear container on re-hydrate', () => {
      const message1 = createRenderMessage(
        { type: 'stack' },
        [{ id: 'first', type: 'Text', props: { children: 'First' } }]
      );
      const message2 = createRenderMessage(
        { type: 'stack' },
        [{ id: 'second', type: 'Text', props: { children: 'Second' } }]
      );

      hydrator.hydrate(message1, container);
      expect(container.textContent).toContain('First');

      hydrator.hydrate(message2, container);
      expect(container.textContent).not.toContain('First');
      expect(container.textContent).toContain('Second');
    });

    it('should provide cleanup function', () => {
      const message = createRenderMessage(
        { type: 'stack' },
        [{ id: 'text-1', type: 'Text', props: { children: 'Hello' } }]
      );

      const result = hydrator.hydrate(message, container);

      expect(result.cleanup).toBeDefined();
      expect(typeof result.cleanup).toBe('function');
    });
  });

  describe('validation errors', () => {
    it('should return errors for invalid message version', () => {
      const message = {
        version: '2.0' as const,
        type: 'render' as const,
        payload: {
          type: 'render' as const,
          layout: { type: 'stack' as const },
          components: [],
        },
      };

      const result = hydrator.hydrate(message as A2UIMessage, container);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });

  describe('layout padding', () => {
    it('should handle numeric padding', () => {
      const message = createRenderMessage(
        { type: 'stack', padding: 16 },
        []
      );

      const result = hydrator.hydrate(message, container);

      expect(result.element?.style.padding).toBe('16px');
    });

    it('should handle string padding', () => {
      const message = createRenderMessage(
        { type: 'stack', padding: '1rem' },
        []
      );

      const result = hydrator.hydrate(message, container);

      expect(result.element?.style.padding).toBe('1rem');
    });

    it('should handle array padding', () => {
      const message = createRenderMessage(
        { type: 'stack', padding: [8, 16] },
        []
      );

      const result = hydrator.hydrate(message, container);

      expect(result.element?.style.padding).toBe('8px 16px');
    });
  });

  describe('layout justify values', () => {
    it('should convert between justify value to space-between', () => {
      const message = createRenderMessage(
        { type: 'flex', justify: 'between' },
        []
      );

      const result = hydrator.hydrate(message, container);

      expect(result.element?.style.justifyContent).toBe('space-between');
    });

    it('should convert around justify value to space-around', () => {
      const message = createRenderMessage(
        { type: 'flex', justify: 'around' },
        []
      );

      const result = hydrator.hydrate(message, container);

      expect(result.element?.style.justifyContent).toBe('space-around');
    });

    it('should convert evenly justify value to space-evenly', () => {
      const message = createRenderMessage(
        { type: 'flex', justify: 'evenly' },
        []
      );

      const result = hydrator.hydrate(message, container);

      expect(result.element?.style.justifyContent).toBe('space-evenly');
    });
  });
});

describe('createHydrator', () => {
  it('should create a hydrator instance', () => {
    const registry = createRegistry();
    const hydrator = createHydrator(registry);

    expect(hydrator).toBeInstanceOf(GenUIHydrator);
  });

  it('should accept options', () => {
    const registry = createRegistry();
    const options: HydratorOptions = {
      onAgentAction: vi.fn(),
      animateTransitions: true,
    };

    const hydrator = createHydrator(registry, options);

    expect(hydrator).toBeInstanceOf(GenUIHydrator);
  });
});
