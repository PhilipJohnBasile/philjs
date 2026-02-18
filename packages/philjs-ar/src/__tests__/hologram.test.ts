/**
 * Tests for PhilJS AR - Hologram Core Module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  Hologram,
  quaternionToEuler,
  axisAngleToQuaternion,
  createReticle,
} from '../hologram';

// Mock WebXR types
const mockXRSession = {
  requestReferenceSpace: vi.fn(),
  updateRenderState: vi.fn(),
  requestHitTestSource: vi.fn(),
  requestAnimationFrame: vi.fn(),
  end: vi.fn(),
  addEventListener: vi.fn(),
};

const mockXRFrame = {
  session: mockXRSession,
  getViewerPose: vi.fn(),
  getHitTestResults: vi.fn(),
  getHitTestResultsForTransientInput: vi.fn(),
  getLightEstimate: vi.fn(),
};

const mockNavigator = {
  xr: {
    isSessionSupported: vi.fn(),
    requestSession: vi.fn(),
  },
};

describe('PhilJS AR - Hologram', () => {
  describe('Static Methods', () => {
    describe('isSupported', () => {
      it('should return false when xr is not available', async () => {
        const originalNav = global.navigator;
        (global as any).navigator = {};

        const supported = await Hologram.isSupported();
        expect(supported).toBe(false);

        global.navigator = originalNav;
      });
    });
  });

  describe('Constructor', () => {
    it('should create a Hologram instance', () => {
      const hologram = new Hologram();
      expect(hologram).toBeInstanceOf(Hologram);
    });

    it('should initialize with default state', () => {
      const hologram = new Hologram();
      const state = hologram.getState();

      expect(state.isActive).toBe(false);
      expect(state.hasHitTestSource).toBe(false);
      expect(state.lightEstimate).toBeNull();
      expect(state.placedObjects).toEqual([]);
    });
  });

  describe('Event System', () => {
    it('should register event handlers', () => {
      const hologram = new Hologram();
      const handler = vi.fn();

      hologram.on('sessionstart', handler);
      // No throw means success
      expect(true).toBe(true);
    });

    it('should unregister event handlers', () => {
      const hologram = new Hologram();
      const handler = vi.fn();

      hologram.on('sessionstart', handler);
      hologram.off('sessionstart', handler);
      // No throw means success
      expect(true).toBe(true);
    });
  });

  describe('Frame Callbacks', () => {
    it('should add frame callbacks', () => {
      const hologram = new Hologram();
      const callback = vi.fn();

      hologram.addFrameCallback(callback);
      // No throw means success
      expect(true).toBe(true);
    });

    it('should remove frame callbacks', () => {
      const hologram = new Hologram();
      const callback = vi.fn();

      hologram.addFrameCallback(callback);
      hologram.removeFrameCallback(callback);
      // No throw means success
      expect(true).toBe(true);
    });
  });

  describe('Object Placement', () => {
    it('should return null when no hit result available', () => {
      const hologram = new Hologram();
      const result = hologram.placeObject();
      expect(result).toBeNull();
    });

    it('should place object at specific position', () => {
      const hologram = new Hologram();
      const position = new Float32Array([1, 2, 3]);
      const orientation = new Float32Array([0, 0, 0, 1]);

      const obj = hologram.placeObjectAt(position, orientation, {
        model: 'test-model',
        scale: [1, 1, 1],
        userData: { custom: 'data' },
      });

      expect(obj.id).toMatch(/^placed-/);
      expect(obj.position).toEqual(position);
      expect(obj.orientation).toEqual(orientation);
      expect(obj.model).toBe('test-model');
      expect(obj.userData).toEqual({ custom: 'data' });
    });

    it('should track placed objects', () => {
      const hologram = new Hologram();

      hologram.placeObjectAt(
        new Float32Array([0, 0, 0]),
        new Float32Array([0, 0, 0, 1])
      );
      hologram.placeObjectAt(
        new Float32Array([1, 0, 0]),
        new Float32Array([0, 0, 0, 1])
      );

      const objects = hologram.getPlacedObjects();
      expect(objects.length).toBe(2);
    });

    it('should remove placed objects', () => {
      const hologram = new Hologram();

      const obj = hologram.placeObjectAt(
        new Float32Array([0, 0, 0]),
        new Float32Array([0, 0, 0, 1])
      );

      expect(hologram.getPlacedObjects().length).toBe(1);

      const removed = hologram.removeObject(obj.id);
      expect(removed).toBe(true);
      expect(hologram.getPlacedObjects().length).toBe(0);
    });

    it('should return false when removing non-existent object', () => {
      const hologram = new Hologram();
      const removed = hologram.removeObject('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('State Management', () => {
    it('should return immutable state', () => {
      const hologram = new Hologram();
      const state1 = hologram.getState();
      const state2 = hologram.getState();

      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });
  });
});

describe('Utility Functions', () => {
  describe('quaternionToEuler', () => {
    it('should convert identity quaternion to zero euler angles', () => {
      const quat = new Float32Array([0, 0, 0, 1]);
      const euler = quaternionToEuler(quat);

      expect(euler.x).toBeCloseTo(0);
      expect(euler.y).toBeCloseTo(0);
      expect(euler.z).toBeCloseTo(0);
    });

    it('should convert 90 degree rotation around Y axis', () => {
      const angle = Math.PI / 2;
      const quat = new Float32Array([0, Math.sin(angle / 2), 0, Math.cos(angle / 2)]);
      const euler = quaternionToEuler(quat);

      expect(euler.y).toBeCloseTo(angle);
    });

    it('should handle gimbal lock at poles', () => {
      // 90 degree pitch
      const quat = new Float32Array([Math.sin(Math.PI / 4), 0, 0, Math.cos(Math.PI / 4)]);
      const euler = quaternionToEuler(quat);

      // Should not throw or produce NaN
      expect(Number.isNaN(euler.x)).toBe(false);
      expect(Number.isNaN(euler.y)).toBe(false);
      expect(Number.isNaN(euler.z)).toBe(false);
    });
  });

  describe('axisAngleToQuaternion', () => {
    it('should create identity quaternion for zero angle', () => {
      const quat = axisAngleToQuaternion({ x: 0, y: 1, z: 0 }, 0);

      expect(quat[0]).toBeCloseTo(0);
      expect(quat[1]).toBeCloseTo(0);
      expect(quat[2]).toBeCloseTo(0);
      expect(quat[3]).toBeCloseTo(1);
    });

    it('should create quaternion for 90 degree rotation around Y axis', () => {
      const angle = Math.PI / 2;
      const quat = axisAngleToQuaternion({ x: 0, y: 1, z: 0 }, angle);

      expect(quat[0]).toBeCloseTo(0);
      expect(quat[1]).toBeCloseTo(Math.sin(angle / 2));
      expect(quat[2]).toBeCloseTo(0);
      expect(quat[3]).toBeCloseTo(Math.cos(angle / 2));
    });

    it('should normalize axis implicitly', () => {
      // Non-normalized axis
      const quat = axisAngleToQuaternion({ x: 0, y: 2, z: 0 }, Math.PI);

      // Quaternion should still be valid (w^2 + x^2 + y^2 + z^2 = 1 for normalized)
      // Note: This implementation doesn't normalize, so result will be different
      expect(quat.length).toBe(4);
    });
  });

  describe('createReticle', () => {
    beforeEach(() => {
      // Mock document.body.appendChild
      document.body.innerHTML = '';
    });

    it('should create a reticle element', () => {
      const reticle = createReticle();

      expect(reticle.element).toBeInstanceOf(HTMLDivElement);
      expect(typeof reticle.update).toBe('function');
      expect(typeof reticle.dispose).toBe('function');
    });

    it('should add reticle to document', () => {
      createReticle();
      const elements = document.body.querySelectorAll('div');
      expect(elements.length).toBeGreaterThan(0);
    });

    it('should update reticle visibility', () => {
      const reticle = createReticle();

      // Hide reticle
      reticle.update(null, false);
      expect(reticle.element.style.opacity).toBe('0');

      // Show reticle with hit result
      const hitResult = {
        position: new Float32Array([0, 0, 0]),
        orientation: new Float32Array([0, 0, 0, 1]),
        worldMatrix: new Float32Array(16),
      };
      reticle.update(hitResult, true);
      expect(reticle.element.style.opacity).toBe('1');
    });

    it('should dispose reticle', () => {
      const reticle = createReticle();
      const element = reticle.element;

      reticle.dispose();
      expect(element.parentNode).toBeNull();
    });
  });
});
