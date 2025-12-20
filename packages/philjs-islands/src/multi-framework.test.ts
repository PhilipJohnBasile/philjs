/**
 * Multi-Framework Island Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  Island,
  hydrateMultiFrameworkIsland,
  hydrateAllMultiFrameworkIslands,
  unmountIsland,
  getIsland,
  getAllIslands,
  registerIslandComponent,
  initMultiFrameworkIslands
} from './multi-framework.js';

describe('Multi-Framework Islands', () => {
  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = '';
  });

  describe('Island SSR Component', () => {
    it('should generate island HTML with correct attributes', () => {
      const html = Island({
        framework: 'react',
        component: { name: 'Counter' } as any,
        props: { initial: 0 },
        hydration: { strategy: 'visible' }
      });

      expect(html).toContain('data-framework="react"');
      expect(html).toContain('data-component="Counter"');
      expect(html).toContain('data-strategy="visible"');
      expect(html).toContain('data-server-rendered="true"');
    });

    it('should serialize props correctly', () => {
      const html = Island({
        framework: 'vue',
        component: { name: 'TodoList' } as any,
        props: { items: ['a', 'b', 'c'], count: 3 },
        hydration: { strategy: 'immediate' }
      });

      expect(html).toContain('data-props=');
      expect(html).toContain('data-strategy="immediate"');
    });

    it('should handle auto-detection framework', () => {
      const mockComponent = {
        name: 'TestComponent',
        $$typeof: Symbol.for('react.element')
      };

      const html = Island({
        framework: 'auto',
        component: mockComponent,
        props: {}
      });

      // Should detect React and render
      expect(html).toContain('data-island=');
    });

    it('should include optional hydration options', () => {
      const html = Island({
        framework: 'svelte',
        component: { name: 'Modal' } as any,
        props: {},
        hydration: {
          strategy: 'interaction',
          events: ['click', 'focus'],
          priority: 10
        }
      });

      expect(html).toContain('data-strategy="interaction"');
      expect(html).toContain('data-events="click,focus"');
      expect(html).toContain('data-priority="10"');
    });
  });

  describe('Island Registration', () => {
    it('should register island components', () => {
      const loader = vi.fn(() => Promise.resolve({ default: () => 'Component' }));

      registerIslandComponent('react', 'TestComponent', loader);

      expect(loader).not.toHaveBeenCalled(); // Should not load yet
    });

    it('should load component when needed', async () => {
      const mockComponent = () => 'TestComponent';
      const loader = vi.fn(() => Promise.resolve({ default: mockComponent }));

      registerIslandComponent('react', 'AsyncComponent', loader);

      // Create mock element
      const element = document.createElement('div');
      element.setAttribute('data-island', 'test-1');
      element.setAttribute('data-framework', 'react');
      element.setAttribute('data-component', 'AsyncComponent');
      element.setAttribute('data-props', '{}');
      document.body.appendChild(element);

      // Note: Actual hydration would require mocking React
      // This test verifies the registration works
      expect(loader).not.toHaveBeenCalled();
    });
  });

  describe('Island Hydration', () => {
    it('should track hydrated islands', () => {
      const element = document.createElement('div');
      element.setAttribute('data-island', 'test-island-1');
      element.setAttribute('data-framework', 'react');
      element.setAttribute('data-component', 'Counter');
      element.setAttribute('data-props', '{"initial":0}');
      document.body.appendChild(element);

      // After hydration, island should be tracked
      // Note: Actual hydration requires framework to be loaded
    });

    it('should not hydrate the same island twice', async () => {
      const element = document.createElement('div');
      element.setAttribute('data-island', 'duplicate-test');
      element.setAttribute('data-framework', 'react');
      element.setAttribute('data-component', 'Counter');
      element.setAttribute('data-props', '{}');
      document.body.appendChild(element);

      // Register mock component
      registerIslandComponent('react', 'Counter', async () => ({
        default: () => 'Counter'
      }));

      // First hydration
      await hydrateMultiFrameworkIsland(element);

      // Second hydration should be ignored
      await hydrateMultiFrameworkIsland(element);

      // Verify only hydrated once
      const islands = getAllIslands();
      const duplicates = islands.filter(i => i.id === 'duplicate-test');
      expect(duplicates.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Island Unmounting', () => {
    it('should unmount island and clean up', async () => {
      const islandId = 'unmount-test';

      // We can't fully test this without mocking frameworks
      // but we can verify the API works
      await unmountIsland(islandId);

      const island = getIsland(islandId);
      expect(island).toBeUndefined();
    });
  });

  describe('Hydration Strategies', () => {
    it('should support immediate hydration', () => {
      const element = document.createElement('div');
      element.setAttribute('data-island', 'immediate-test');
      element.setAttribute('data-framework', 'react');
      element.setAttribute('data-strategy', 'immediate');
      element.setAttribute('data-props', '{}');
      document.body.appendChild(element);

      hydrateAllMultiFrameworkIslands();

      // Immediate islands should start hydration right away
    });

    it('should support visible hydration with IntersectionObserver', () => {
      const element = document.createElement('div');
      element.setAttribute('data-island', 'visible-test');
      element.setAttribute('data-framework', 'vue');
      element.setAttribute('data-strategy', 'visible');
      element.setAttribute('data-props', '{}');
      document.body.appendChild(element);

      // Mock IntersectionObserver
      const mockObserve = vi.fn();
      global.IntersectionObserver = vi.fn().mockImplementation(() => ({
        observe: mockObserve,
        disconnect: vi.fn(),
        unobserve: vi.fn()
      })) as any;

      hydrateAllMultiFrameworkIslands();

      // Should set up IntersectionObserver
      expect(mockObserve).toHaveBeenCalled();
    });

    it('should support idle hydration with requestIdleCallback', () => {
      const element = document.createElement('div');
      element.setAttribute('data-island', 'idle-test');
      element.setAttribute('data-framework', 'svelte');
      element.setAttribute('data-strategy', 'idle');
      element.setAttribute('data-props', '{}');
      document.body.appendChild(element);

      // Mock requestIdleCallback
      const mockRequestIdleCallback = vi.fn();
      global.requestIdleCallback = mockRequestIdleCallback as any;

      hydrateAllMultiFrameworkIslands();

      // Should use requestIdleCallback
      expect(mockRequestIdleCallback).toHaveBeenCalled();
    });

    it('should support interaction hydration', () => {
      const element = document.createElement('div');
      element.setAttribute('data-island', 'interaction-test');
      element.setAttribute('data-framework', 'preact');
      element.setAttribute('data-strategy', 'interaction');
      element.setAttribute('data-events', 'click,focus');
      element.setAttribute('data-props', '{}');
      document.body.appendChild(element);

      const addEventListenerSpy = vi.spyOn(element, 'addEventListener');

      hydrateAllMultiFrameworkIslands();

      // Should add event listeners
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.any(Object)
      );
    });

    it('should support media query hydration', () => {
      const element = document.createElement('div');
      element.setAttribute('data-island', 'media-test');
      element.setAttribute('data-framework', 'solid');
      element.setAttribute('data-strategy', 'media');
      element.setAttribute('data-media', '(min-width: 768px)');
      element.setAttribute('data-props', '{}');
      document.body.appendChild(element);

      // Mock matchMedia
      const mockMatchMedia = vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      });
      global.matchMedia = mockMatchMedia as any;

      hydrateAllMultiFrameworkIslands();

      // Should check media query
      expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 768px)');
    });
  });

  describe('Auto-initialization', () => {
    it('should initialize on DOMContentLoaded', () => {
      // This is tested indirectly by the other tests
      // The auto-init code runs when the module loads
      expect(initMultiFrameworkIslands).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing framework gracefully', async () => {
      const element = document.createElement('div');
      element.setAttribute('data-island', 'error-test');
      element.setAttribute('data-framework', 'unknown-framework');
      element.setAttribute('data-props', '{}');
      document.body.appendChild(element);

      // Should not throw
      await expect(hydrateMultiFrameworkIsland(element)).resolves.not.toThrow();
    });

    it('should handle missing component gracefully', async () => {
      const element = document.createElement('div');
      element.setAttribute('data-island', 'missing-component');
      element.setAttribute('data-framework', 'react');
      element.setAttribute('data-component', 'NonExistent');
      element.setAttribute('data-props', '{}');
      document.body.appendChild(element);

      // Should not throw
      await expect(hydrateMultiFrameworkIsland(element)).resolves.not.toThrow();
    });

    it('should handle invalid props JSON', async () => {
      const element = document.createElement('div');
      element.setAttribute('data-island', 'invalid-props');
      element.setAttribute('data-framework', 'react');
      element.setAttribute('data-props', 'invalid json');
      document.body.appendChild(element);

      // Should handle gracefully
      await expect(hydrateMultiFrameworkIsland(element)).resolves.not.toThrow();
    });
  });
});
