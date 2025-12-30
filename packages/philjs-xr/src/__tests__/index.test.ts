/**
 * @philjs/xr - Smoke Tests
 * Basic export verification and functionality tests
 */

import { describe, it, expect } from 'vitest';
import * as exports from '../index.js';

describe('@philjs/xr', () => {
  describe('Export Verification', () => {
    it('should export XR session manager', () => {
      expect(exports.XRSessionManager).toBeDefined();
      expect(exports.initXR).toBeDefined();
      expect(exports.getXRManager).toBeDefined();
    });

    it('should export XR hooks', () => {
      expect(exports.useXR).toBeDefined();
      expect(exports.useXRControllers).toBeDefined();
      expect(exports.useXRController).toBeDefined();
      expect(exports.useXRHands).toBeDefined();
      expect(exports.useXRHand).toBeDefined();
      expect(exports.useXRFrame).toBeDefined();
    });

    it('should export vector math utilities', () => {
      expect(exports.Vec3).toBeDefined();
      expect(exports.Quat).toBeDefined();
    });

    it('should export gesture recognition', () => {
      expect(exports.GestureRecognizer).toBeDefined();
      expect(exports.useGesture).toBeDefined();
    });

    it('should export spatial UI components', () => {
      expect(exports.createXRPanel).toBeDefined();
      expect(exports.createXRButton).toBeDefined();
      expect(exports.createXRSlider).toBeDefined();
      expect(exports.createXRText).toBeDefined();
      expect(exports.createXRModel).toBeDefined();
    });

    it('should export hit test and anchors', () => {
      expect(exports.useHitTest).toBeDefined();
      expect(exports.useAnchors).toBeDefined();
    });
  });

  describe('Vec3 Utilities', () => {
    it('should create vectors', () => {
      const v = exports.Vec3.create(1, 2, 3);
      expect(v.x).toBe(1);
      expect(v.y).toBe(2);
      expect(v.z).toBe(3);
    });

    it('should add vectors', () => {
      const a = exports.Vec3.create(1, 2, 3);
      const b = exports.Vec3.create(4, 5, 6);
      const result = exports.Vec3.add(a, b);
      expect(result.x).toBe(5);
      expect(result.y).toBe(7);
      expect(result.z).toBe(9);
    });

    it('should subtract vectors', () => {
      const a = exports.Vec3.create(5, 7, 9);
      const b = exports.Vec3.create(1, 2, 3);
      const result = exports.Vec3.sub(a, b);
      expect(result.x).toBe(4);
      expect(result.y).toBe(5);
      expect(result.z).toBe(6);
    });

    it('should scale vectors', () => {
      const v = exports.Vec3.create(2, 3, 4);
      const result = exports.Vec3.scale(v, 2);
      expect(result.x).toBe(4);
      expect(result.y).toBe(6);
      expect(result.z).toBe(8);
    });

    it('should calculate vector length', () => {
      const v = exports.Vec3.create(3, 4, 0);
      const length = exports.Vec3.length(v);
      expect(length).toBe(5);
    });

    it('should normalize vectors', () => {
      const v = exports.Vec3.create(3, 0, 0);
      const result = exports.Vec3.normalize(v);
      expect(result.x).toBe(1);
      expect(result.y).toBe(0);
      expect(result.z).toBe(0);
    });
  });

  describe('Quat Utilities', () => {
    it('should create identity quaternion', () => {
      const q = exports.Quat.identity();
      expect(q.x).toBe(0);
      expect(q.y).toBe(0);
      expect(q.z).toBe(0);
      expect(q.w).toBe(1);
    });

    it('should create quaternion from euler angles', () => {
      const q = exports.Quat.fromEuler(0, 0, 0);
      expect(q.w).toBeCloseTo(1, 5);
    });
  });

  describe('XR Session Manager', () => {
    it('should create session manager with config', () => {
      const manager = new exports.XRSessionManager({
        mode: 'immersive-vr',
        referenceSpace: 'local-floor',
        handTracking: true
      });
      expect(manager).toBeInstanceOf(exports.XRSessionManager);
    });

    it('should have session methods', () => {
      const manager = new exports.XRSessionManager();
      expect(typeof manager.isSupported).toBe('function');
      expect(typeof manager.startSession).toBe('function');
      expect(typeof manager.endSession).toBe('function');
      expect(typeof manager.getSession).toBe('function');
      expect(typeof manager.getControllers).toBe('function');
      expect(typeof manager.getHands).toBe('function');
    });
  });

  describe('GestureRecognizer', () => {
    it('should create gesture recognizer', () => {
      const recognizer = new exports.GestureRecognizer();
      expect(recognizer).toBeInstanceOf(exports.GestureRecognizer);
    });

    it('should have gesture detection methods', () => {
      const recognizer = new exports.GestureRecognizer();
      expect(typeof recognizer.recognize).toBe('function');
      expect(typeof recognizer.onGesture).toBe('function');
    });
  });

  describe('Export Count', () => {
    it('should have expected number of exports', () => {
      const exportCount = Object.keys(exports).length;
      expect(exportCount).toBeGreaterThan(15);
    });
  });
});
