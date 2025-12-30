/**
 * @philjs/neural - Smoke Tests
 * Basic export verification and functionality tests
 */

import { describe, it, expect } from 'vitest';
import * as exports from '../index.js';

describe('@philjs/neural', () => {
  describe('Export Verification', () => {
    it('should export NeuralRenderer', () => {
      expect(exports.NeuralRenderer).toBeDefined();
    });

    it('should export initialization functions', () => {
      expect(exports.initNeuralRenderer).toBeDefined();
      expect(exports.getNeuralRenderer).toBeDefined();
    });

    it('should export hooks', () => {
      expect(exports.useNeuralRendering).toBeDefined();
      expect(exports.useAdaptiveQuality).toBeDefined();
      expect(exports.usePredictiveRendering).toBeDefined();
      expect(exports.useLayoutOptimization).toBeDefined();
    });

    it('should export internal classes', () => {
      expect(exports.RenderPredictor).toBeDefined();
      expect(exports.AdaptiveQualityManager).toBeDefined();
      expect(exports.ComponentPrioritizer).toBeDefined();
      expect(exports.NeuralLayoutOptimizer).toBeDefined();
      expect(exports.Tensor).toBeDefined();
      expect(exports.NeuralNetwork).toBeDefined();
    });
  });

  describe('NeuralRenderer', () => {
    it('should create NeuralRenderer instance', () => {
      const renderer = new exports.NeuralRenderer();
      expect(renderer).toBeInstanceOf(exports.NeuralRenderer);
    });

    it('should accept config options', () => {
      const renderer = new exports.NeuralRenderer({
        predictiveRendering: true,
        targetFPS: 60,
        adaptiveQuality: true,
        modelSize: 'small'
      });
      expect(renderer).toBeInstanceOf(exports.NeuralRenderer);
    });

    it('should have required methods', () => {
      const renderer = new exports.NeuralRenderer();
      expect(typeof renderer.start).toBe('function');
      expect(typeof renderer.stop).toBe('function');
      expect(typeof renderer.recordRender).toBe('function');
      expect(typeof renderer.predictNextRenders).toBe('function');
      expect(typeof renderer.getQualitySettings).toBe('function');
      expect(typeof renderer.destroy).toBe('function');
    });
  });

  describe('Tensor', () => {
    it('should create zeros tensor', () => {
      const tensor = exports.Tensor.zeros([2, 3]);
      expect(tensor.shape).toEqual([2, 3]);
      expect(tensor.data.length).toBe(6);
    });

    it('should create random tensor', () => {
      const tensor = exports.Tensor.random([2, 2]);
      expect(tensor.shape).toEqual([2, 2]);
      expect(tensor.data.length).toBe(4);
    });

    it('should perform basic operations', () => {
      const a = exports.Tensor.zeros([2, 2]);
      const b = exports.Tensor.zeros([2, 2]);

      const sum = a.add(b);
      expect(sum.shape).toEqual([2, 2]);

      const product = a.multiply(b);
      expect(product.shape).toEqual([2, 2]);
    });

    it('should perform relu activation', () => {
      const tensor = new exports.Tensor(
        new Float32Array([-1, 0, 1, 2]),
        [2, 2]
      );
      const result = tensor.relu();
      expect(result.data[0]).toBe(0);
      expect(result.data[1]).toBe(0);
      expect(result.data[2]).toBe(1);
      expect(result.data[3]).toBe(2);
    });
  });

  describe('NeuralNetwork', () => {
    it('should create neural network', () => {
      const network = new exports.NeuralNetwork();
      expect(network).toBeInstanceOf(exports.NeuralNetwork);
    });

    it('should add layers', () => {
      const network = new exports.NeuralNetwork();
      network.addLayer(4, 8);
      network.addLayer(8, 2);
      expect(network.layers.length).toBe(2);
    });
  });

  describe('useNeuralRendering hook', () => {
    it('should return quality and priority info', () => {
      const result = exports.useNeuralRendering('test-component');
      expect(result).toHaveProperty('quality');
      expect(result).toHaveProperty('priority');
      expect(result).toHaveProperty('recordRender');
      expect(result).toHaveProperty('recordInteraction');
    });
  });

  describe('useAdaptiveQuality hook', () => {
    it('should return level and settings', () => {
      const result = exports.useAdaptiveQuality();
      expect(result).toHaveProperty('level');
      expect(result).toHaveProperty('settings');
    });
  });

  describe('Export Count', () => {
    it('should have expected number of exports', () => {
      const exportCount = Object.keys(exports).length;
      expect(exportCount).toBeGreaterThan(10);
    });
  });
});
