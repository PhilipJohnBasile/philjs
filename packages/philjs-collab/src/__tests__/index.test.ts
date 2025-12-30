/**
 * @philjs/collab - Smoke Tests
 * Basic export verification and functionality tests
 */

import { describe, it, expect, vi } from 'vitest';
import * as exports from '../index.js';

describe('@philjs/collab', () => {
  describe('Export Verification', () => {
    it('should export transport layer', () => {
      expect(exports.WebSocketTransport).toBeDefined();
      expect(exports.BroadcastTransport).toBeDefined();
      expect(exports.createWebSocketTransport).toBeDefined();
      expect(exports.createBroadcastTransport).toBeDefined();
      expect(exports.generateClientId).toBeDefined();
    });

    it('should export presence manager', () => {
      expect(exports.PresenceManager).toBeDefined();
      expect(exports.createPresenceManager).toBeDefined();
      expect(exports.getPresenceColor).toBeDefined();
      expect(exports.PRESENCE_COLORS).toBeDefined();
    });

    it('should export CRDTs', () => {
      expect(exports.YDoc).toBeDefined();
      expect(exports.YText).toBeDefined();
      expect(exports.YArray).toBeDefined();
      expect(exports.YMap).toBeDefined();
      expect(exports.createYDoc).toBeDefined();
    });

    it('should export cursors', () => {
      expect(exports.CursorManager).toBeDefined();
      expect(exports.createCursorManager).toBeDefined();
      expect(exports.injectCursorStyles).toBeDefined();
      expect(exports.CURSOR_STYLES).toBeDefined();
    });

    it('should export awareness', () => {
      expect(exports.Awareness).toBeDefined();
      expect(exports.createAwareness).toBeDefined();
      expect(exports.createTypedAwareness).toBeDefined();
    });

    it('should export OT functions', () => {
      expect(exports.OTClient).toBeDefined();
      expect(exports.OTServer).toBeDefined();
      expect(exports.createOTClient).toBeDefined();
      expect(exports.createOTServer).toBeDefined();
      expect(exports.applyOperation).toBeDefined();
      expect(exports.transform).toBeDefined();
    });

    it('should export CollabRoom', () => {
      expect(exports.CollabRoom).toBeDefined();
      expect(exports.createCollabRoom).toBeDefined();
    });

    it('should export comments system', () => {
      expect(exports.CommentsManager).toBeDefined();
      expect(exports.createCommentsManager).toBeDefined();
      expect(exports.COMMENT_REACTIONS).toBeDefined();
    });
  });

  describe('generateClientId', () => {
    it('should generate unique client IDs', () => {
      const id1 = exports.generateClientId();
      const id2 = exports.generateClientId();
      expect(id1).not.toBe(id2);
    });

    it('should return a string', () => {
      const id = exports.generateClientId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('getPresenceColor', () => {
    it('should return a color for any index', () => {
      const color = exports.getPresenceColor(0);
      expect(typeof color).toBe('string');
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should cycle through colors', () => {
      const colors = new Set();
      for (let i = 0; i < 10; i++) {
        colors.add(exports.getPresenceColor(i));
      }
      // Should have some variety
      expect(colors.size).toBeGreaterThan(1);
    });
  });

  describe('PRESENCE_COLORS', () => {
    it('should be an array of colors', () => {
      expect(Array.isArray(exports.PRESENCE_COLORS)).toBe(true);
      expect(exports.PRESENCE_COLORS.length).toBeGreaterThan(0);
    });
  });

  describe('createYDoc', () => {
    it('should create a YDoc instance', () => {
      const doc = exports.createYDoc('test-client');
      expect(doc).toBeInstanceOf(exports.YDoc);
    });
  });

  describe('YDoc', () => {
    it('should provide text, array, and map types', () => {
      const doc = exports.createYDoc('test-client');
      expect(typeof doc.getText).toBe('function');
      expect(typeof doc.getArray).toBe('function');
      expect(typeof doc.getMap).toBe('function');
    });
  });

  describe('createPresenceManager', () => {
    it('should create presence manager', () => {
      const manager = exports.createPresenceManager({
        clientId: 'test-client',
        user: { name: 'Test User' }
      });
      expect(manager).toBeInstanceOf(exports.PresenceManager);
    });
  });

  describe('createAwareness', () => {
    it('should create awareness instance', () => {
      const awareness = exports.createAwareness({
        clientId: 'test-client'
      });
      expect(awareness).toBeInstanceOf(exports.Awareness);
    });
  });

  describe('OT Functions', () => {
    it('should apply operations', () => {
      const doc = 'Hello';
      const result = exports.applyOperation(doc, { type: 'insert', pos: 5, text: ' World' });
      expect(result).toBe('Hello World');
    });

    it('should transform operations', () => {
      const op1 = { type: 'insert', pos: 0, text: 'A' } as const;
      const op2 = { type: 'insert', pos: 0, text: 'B' } as const;
      const [transformed1, transformed2] = exports.transform(op1, op2);
      expect(transformed1).toBeDefined();
      expect(transformed2).toBeDefined();
    });
  });

  describe('Export Count', () => {
    it('should have expected number of exports', () => {
      const exportCount = Object.keys(exports).length;
      expect(exportCount).toBeGreaterThan(25);
    });
  });
});
