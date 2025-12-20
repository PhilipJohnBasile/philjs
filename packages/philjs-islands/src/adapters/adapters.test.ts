/**
 * Framework Adapters Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAdapter,
  detectFramework,
  registerAdapter,
  isFrameworkSupported,
  getSupportedFrameworks,
  FRAMEWORK_ADAPTERS
} from './index.js';
import { reactAdapter } from './react.js';
import { vueAdapter } from './vue.js';
import { svelteAdapter } from './svelte.js';
import { preactAdapter } from './preact.js';
import { solidAdapter } from './solid.js';

describe('Framework Adapters', () => {
  describe('Adapter Registry', () => {
    it('should include all framework adapters', () => {
      expect(FRAMEWORK_ADAPTERS.react).toBe(reactAdapter);
      expect(FRAMEWORK_ADAPTERS.vue).toBe(vueAdapter);
      expect(FRAMEWORK_ADAPTERS.svelte).toBe(svelteAdapter);
      expect(FRAMEWORK_ADAPTERS.preact).toBe(preactAdapter);
      expect(FRAMEWORK_ADAPTERS.solid).toBe(solidAdapter);
    });

    it('should get adapter by name', () => {
      expect(getAdapter('react')).toBe(reactAdapter);
      expect(getAdapter('vue')).toBe(vueAdapter);
      expect(getAdapter('svelte')).toBe(svelteAdapter);
      expect(getAdapter('preact')).toBe(preactAdapter);
      expect(getAdapter('solid')).toBe(solidAdapter);
    });

    it('should handle case-insensitive framework names', () => {
      expect(getAdapter('React')).toBe(reactAdapter);
      expect(getAdapter('REACT')).toBe(reactAdapter);
      expect(getAdapter('Vue')).toBe(vueAdapter);
    });

    it('should return undefined for unknown frameworks', () => {
      expect(getAdapter('angular')).toBeUndefined();
      expect(getAdapter('unknown')).toBeUndefined();
    });

    it('should check if framework is supported', () => {
      expect(isFrameworkSupported('react')).toBe(true);
      expect(isFrameworkSupported('vue')).toBe(true);
      expect(isFrameworkSupported('angular')).toBe(false);
    });

    it('should get list of supported frameworks', () => {
      const frameworks = getSupportedFrameworks();

      expect(frameworks).toContain('react');
      expect(frameworks).toContain('vue');
      expect(frameworks).toContain('svelte');
      expect(frameworks).toContain('preact');
      expect(frameworks).toContain('solid');
    });

    it('should register custom adapter', () => {
      const customAdapter = {
        name: 'custom',
        detect: () => false,
        hydrate: async () => {},
        unmount: async () => {},
        serializeProps: (props: any) => JSON.stringify(props),
        deserializeProps: (str: string) => JSON.parse(str),
        getPeerDependencies: () => []
      };

      registerAdapter(customAdapter);

      expect(getAdapter('custom')).toBe(customAdapter);
      expect(isFrameworkSupported('custom')).toBe(true);
    });
  });

  describe('Framework Detection', () => {
    it('should detect React components', () => {
      const reactComponent = {
        $$typeof: Symbol.for('react.element')
      };

      const adapter = detectFramework(reactComponent);
      expect(adapter).toBe(reactAdapter);
    });

    it('should detect function components', () => {
      const functionComponent = function Component(props: any) {
        return null;
      };

      // This should be detected as React by default
      const adapter = detectFramework(functionComponent);
      expect(adapter).toBeDefined();
    });

    it('should return undefined for unknown components', () => {
      const plainObject = { data: 'test' };

      const adapter = detectFramework(plainObject);
      expect(adapter).toBeUndefined();
    });

    it('should handle null/undefined', () => {
      expect(detectFramework(null)).toBeUndefined();
      expect(detectFramework(undefined)).toBeUndefined();
    });
  });

  describe('React Adapter', () => {
    it('should have correct name', () => {
      expect(reactAdapter.name).toBe('react');
    });

    it('should detect React components', () => {
      const component = () => null;
      expect(reactAdapter.detect(component)).toBe(true);
    });

    it('should serialize props', () => {
      const props = {
        name: 'John',
        age: 30,
        date: new Date('2024-01-01')
      };

      const serialized = reactAdapter.serializeProps(props);
      expect(typeof serialized).toBe('string');
      expect(serialized).toContain('John');
    });

    it('should deserialize props', () => {
      const serialized = '{"name":"John","age":30}';
      const deserialized = reactAdapter.deserializeProps(serialized);

      expect(deserialized.name).toBe('John');
      expect(deserialized.age).toBe(30);
    });

    it('should handle special types in serialization', () => {
      const props = {
        date: new Date('2024-01-01'),
        regex: /test/gi
      };

      const serialized = reactAdapter.serializeProps(props);
      const deserialized = reactAdapter.deserializeProps(serialized);

      expect(deserialized.date).toBeInstanceOf(Date);
      expect(deserialized.regex).toBeInstanceOf(RegExp);
    });

    it('should list peer dependencies', () => {
      const deps = reactAdapter.getPeerDependencies();
      expect(deps).toContain('react');
      expect(deps).toContain('react-dom');
    });
  });

  describe('Vue Adapter', () => {
    it('should have correct name', () => {
      expect(vueAdapter.name).toBe('vue');
    });

    it('should detect Vue components', () => {
      const component = {
        setup: () => {},
        template: '<div>Test</div>'
      };

      expect(vueAdapter.detect(component)).toBe(true);
    });

    it('should serialize and deserialize props', () => {
      const props = { message: 'Hello Vue', count: 42 };
      const serialized = vueAdapter.serializeProps(props);
      const deserialized = vueAdapter.deserializeProps(serialized);

      expect(deserialized.message).toBe('Hello Vue');
      expect(deserialized.count).toBe(42);
    });

    it('should list peer dependencies', () => {
      const deps = vueAdapter.getPeerDependencies();
      expect(deps).toContain('vue');
    });
  });

  describe('Svelte Adapter', () => {
    it('should have correct name', () => {
      expect(svelteAdapter.name).toBe('svelte');
    });

    it('should detect Svelte components', () => {
      class SvelteComponent {
        $set() {}
        $destroy() {}
      }

      expect(svelteAdapter.detect(SvelteComponent)).toBe(true);
    });

    it('should serialize and deserialize props', () => {
      const props = { title: 'Svelte App', visible: true };
      const serialized = svelteAdapter.serializeProps(props);
      const deserialized = svelteAdapter.deserializeProps(serialized);

      expect(deserialized.title).toBe('Svelte App');
      expect(deserialized.visible).toBe(true);
    });

    it('should list peer dependencies', () => {
      const deps = svelteAdapter.getPeerDependencies();
      expect(deps).toContain('svelte');
    });
  });

  describe('Preact Adapter', () => {
    it('should have correct name', () => {
      expect(preactAdapter.name).toBe('preact');
    });

    it('should detect Preact components', () => {
      const component = () => null;
      expect(preactAdapter.detect(component)).toBe(true);
    });

    it('should serialize and deserialize props', () => {
      const props = { text: 'Preact is fast', items: [1, 2, 3] };
      const serialized = preactAdapter.serializeProps(props);
      const deserialized = preactAdapter.deserializeProps(serialized);

      expect(deserialized.text).toBe('Preact is fast');
      expect(deserialized.items).toEqual([1, 2, 3]);
    });

    it('should list peer dependencies', () => {
      const deps = preactAdapter.getPeerDependencies();
      expect(deps).toContain('preact');
    });
  });

  describe('Solid Adapter', () => {
    it('should have correct name', () => {
      expect(solidAdapter.name).toBe('solid');
    });

    it('should serialize and deserialize props', () => {
      const props = { counter: 0, active: false };
      const serialized = solidAdapter.serializeProps(props);
      const deserialized = solidAdapter.deserializeProps(serialized);

      expect(deserialized.counter).toBe(0);
      expect(deserialized.active).toBe(false);
    });

    it('should list peer dependencies', () => {
      const deps = solidAdapter.getPeerDependencies();
      expect(deps).toContain('solid-js');
    });
  });
});
