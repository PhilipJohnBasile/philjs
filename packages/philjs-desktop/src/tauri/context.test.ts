/**
 * Tests for Tauri Context
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  initTauriContext,
  getTauriContext,
  useTauri,
  isTauri,
  resetTauriContext,
} from './context';

describe('Tauri Context', () => {
  beforeEach(() => {
    resetTauriContext();
  });

  describe('isTauri', () => {
    it('should return false in test environment without Tauri', () => {
      // Clear Tauri globals
      delete (globalThis as any).__TAURI__;
      delete (globalThis as any).__TAURI_INTERNALS__;

      expect(isTauri()).toBe(false);
    });

    it('should return true when __TAURI__ is present', () => {
      (globalThis as any).__TAURI__ = {};
      expect(isTauri()).toBe(true);
    });

    it('should return true when __TAURI_INTERNALS__ is present', () => {
      delete (globalThis as any).__TAURI__;
      (globalThis as any).__TAURI_INTERNALS__ = {};
      expect(isTauri()).toBe(true);
    });
  });

  describe('initTauriContext', () => {
    it('should initialize context successfully', async () => {
      const context = await initTauriContext();
      expect(context).toBeDefined();
      expect(context.isTauri).toBe(true); // Due to test setup
    });

    it('should return same context on multiple calls', async () => {
      const context1 = await initTauriContext();
      const context2 = await initTauriContext();
      expect(context1).toBe(context2);
    });

    it('should have invoke function', async () => {
      const context = await initTauriContext();
      expect(typeof context.invoke).toBe('function');
    });

    it('should have listen function', async () => {
      const context = await initTauriContext();
      expect(typeof context.listen).toBe('function');
    });

    it('should have emit function', async () => {
      const context = await initTauriContext();
      expect(typeof context.emit).toBe('function');
    });

    it('should have app info', async () => {
      const context = await initTauriContext();
      expect(context.app).toBeDefined();
      expect(typeof context.app.name).toBe('string');
      expect(typeof context.app.version).toBe('string');
    });
  });

  describe('getTauriContext', () => {
    it('should throw if not initialized', () => {
      expect(() => getTauriContext()).toThrow('Tauri context not initialized');
    });

    it('should return context after initialization', async () => {
      await initTauriContext();
      const context = getTauriContext();
      expect(context).toBeDefined();
    });
  });

  describe('useTauri', () => {
    it('should return context', async () => {
      await initTauriContext();
      const context = useTauri();
      expect(context).toBeDefined();
      expect(context.isTauri).toBeDefined();
    });
  });

  describe('resetTauriContext', () => {
    it('should reset context', async () => {
      await initTauriContext();
      resetTauriContext();
      expect(() => getTauriContext()).toThrow();
    });
  });
});
