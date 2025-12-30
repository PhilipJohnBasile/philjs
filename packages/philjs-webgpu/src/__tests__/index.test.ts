/**
 * @philjs/webgpu - Smoke Tests
 * Basic export verification and functionality tests
 */

import { describe, it, expect } from 'vitest';
import * as exports from '../index.js';

describe('@philjs/webgpu', () => {
  describe('Export Verification', () => {
    it('should export WebGPU availability functions', () => {
      expect(exports.isWebGPUSupported).toBeDefined();
      expect(typeof exports.isWebGPUSupported).toBe('function');
      expect(exports.isWebGPUSupportedSync).toBeDefined();
      expect(typeof exports.isWebGPUSupportedSync).toBe('function');
    });

    it('should export WebGPUContext class', () => {
      expect(exports.WebGPUContext).toBeDefined();
    });

    it('should export built-in shaders', () => {
      expect(exports.BuiltInShaders).toBeDefined();
      expect(exports.BuiltInShaders.basic2D).toBeDefined();
      expect(exports.BuiltInShaders.texturedQuad).toBeDefined();
      expect(exports.BuiltInShaders.blur).toBeDefined();
    });

    it('should export GPU components', () => {
      expect(exports.GPUCanvas).toBeDefined();
      expect(exports.GPUEffects).toBeDefined();
      expect(exports.GPUAnimator).toBeDefined();
      expect(exports.GPUDiffer).toBeDefined();
    });

    it('should export hooks', () => {
      expect(exports.initWebGPU).toBeDefined();
      expect(exports.getWebGPUContext).toBeDefined();
      expect(exports.useWebGPU).toBeDefined();
      expect(exports.useGPUCanvas).toBeDefined();
      expect(exports.useGPUAnimator).toBeDefined();
    });
  });

  describe('WebGPU Support Check', () => {
    it('should return boolean for sync check', () => {
      const result = exports.isWebGPUSupportedSync();
      expect(typeof result).toBe('boolean');
    });

    it('should return promise for async check', async () => {
      const result = exports.isWebGPUSupported();
      expect(result).toBeInstanceOf(Promise);
      const supported = await result;
      expect(typeof supported).toBe('boolean');
    });
  });

  describe('BuiltInShaders', () => {
    it('should have valid shader code strings', () => {
      expect(typeof exports.BuiltInShaders.basic2D).toBe('string');
      expect(exports.BuiltInShaders.basic2D.length).toBeGreaterThan(0);

      expect(typeof exports.BuiltInShaders.texturedQuad).toBe('string');
      expect(exports.BuiltInShaders.texturedQuad.length).toBeGreaterThan(0);

      expect(typeof exports.BuiltInShaders.blur).toBe('string');
      expect(exports.BuiltInShaders.blur.length).toBeGreaterThan(0);
    });

    it('should have animation shader', () => {
      expect(exports.BuiltInShaders.animate).toBeDefined();
      expect(typeof exports.BuiltInShaders.animate).toBe('string');
    });

    it('should have parallel sum shader for DOM diffing', () => {
      expect(exports.BuiltInShaders.parallelSum).toBeDefined();
      expect(typeof exports.BuiltInShaders.parallelSum).toBe('string');
    });
  });

  describe('useWebGPU hook', () => {
    it('should return WebGPU state object', () => {
      const state = exports.useWebGPU();
      expect(state).toHaveProperty('supported');
      expect(state).toHaveProperty('context');
      expect(state).toHaveProperty('device');
    });
  });

  describe('Export Count', () => {
    it('should have expected number of exports', () => {
      const exportCount = Object.keys(exports).length;
      expect(exportCount).toBeGreaterThan(10);
    });
  });
});
