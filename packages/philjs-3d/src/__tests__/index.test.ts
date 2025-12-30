/**
 * @philjs/3d - Smoke Tests
 * Basic export verification and functionality tests
 */

import { describe, it, expect } from 'vitest';
import * as exports from '../index.js';

describe('@philjs/3d', () => {
  describe('Export Verification', () => {
    it('should export WebGL functions', () => {
      expect(exports.createWebGLContext).toBeDefined();
      expect(exports.isWebGLSupported).toBeDefined();
      expect(exports.isWebGL2Supported).toBeDefined();
      expect(exports.compileShader).toBeDefined();
      expect(exports.createProgram).toBeDefined();
      expect(exports.createBuffer).toBeDefined();
      expect(exports.createCamera).toBeDefined();
    });

    it('should export WebGL primitives', () => {
      expect(exports.createCube).toBeDefined();
      expect(exports.createSphere).toBeDefined();
      expect(exports.createPlane).toBeDefined();
      expect(exports.createCylinder).toBeDefined();
      expect(exports.createCone).toBeDefined();
      expect(exports.createTorus).toBeDefined();
    });

    it('should export Three.js integration', () => {
      expect(exports.loadThree).toBeDefined();
      expect(exports.useThree).toBeDefined();
      expect(exports.useFrame).toBeDefined();
      expect(exports.ThreeCanvas).toBeDefined();
    });

    it('should export Godot integration', () => {
      expect(exports.createGodotInstance).toBeDefined();
      expect(exports.useGodot).toBeDefined();
      expect(exports.callGodot).toBeDefined();
      expect(exports.GodotEmbed).toBeDefined();
    });

    it('should export Unreal integration', () => {
      expect(exports.createPixelStreamingInstance).toBeDefined();
      expect(exports.useUnreal).toBeDefined();
      expect(exports.UnrealEmbed).toBeDefined();
    });

    it('should export Unity integration', () => {
      expect(exports.createUnityInstance).toBeDefined();
      expect(exports.useUnity).toBeDefined();
      expect(exports.sendMessage).toBeDefined();
      expect(exports.UnityEmbed).toBeDefined();
    });

    it('should export Bevy integration', () => {
      expect(exports.createBevyInstance).toBeDefined();
      expect(exports.useBevy).toBeDefined();
      expect(exports.spawnEntity).toBeDefined();
      expect(exports.BevyEmbed).toBeDefined();
    });

    it('should export shader constants', () => {
      expect(exports.BASIC_VERTEX_SHADER).toBeDefined();
      expect(exports.BASIC_FRAGMENT_SHADER).toBeDefined();
      expect(typeof exports.BASIC_VERTEX_SHADER).toBe('string');
      expect(typeof exports.BASIC_FRAGMENT_SHADER).toBe('string');
    });
  });

  describe('WebGL Utilities', () => {
    it('should have mat4 functions', () => {
      expect(exports.mat4Identity).toBeDefined();
      expect(exports.mat4Multiply).toBeDefined();
      expect(exports.mat4Perspective).toBeDefined();
      expect(exports.mat4LookAt).toBeDefined();
      expect(exports.mat4Translate).toBeDefined();
    });

    it('should have Easing functions', () => {
      expect(exports.Easing).toBeDefined();
      expect(exports.lerp).toBeDefined();
    });
  });

  describe('Export Count', () => {
    it('should have substantial exports', () => {
      const exportCount = Object.keys(exports).length;
      // Should have many exports for all integrations
      expect(exportCount).toBeGreaterThan(50);
    });
  });
});
