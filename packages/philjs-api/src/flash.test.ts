/**
 * Flash Messages Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  setFlash,
  setFlashSuccess,
  setFlashError,
  setFlashWarning,
  setFlashInfo,
  getFlashMessages,
  getFlashMessagesByCategory,
  peekFlashMessages,
  clearFlashMessages,
  hasFlashMessages,
  createFlashUtils,
  serializeFlashMessages,
  deserializeFlashMessages,
  type FlashMessage,
  type FlashSessionData,
} from './flash';
import type { Session } from './session';

// Mock session
function createMockSession(): Session<FlashSessionData> {
  const data: FlashSessionData = {};

  return {
    id: 'test-session',
    data,
    get(key) {
      return data[key];
    },
    set(key, value) {
      data[key] = value;
    },
    delete(key) {
      delete data[key];
    },
    has(key) {
      return key in data;
    },
    clear() {
      Object.keys(data).forEach(key => delete data[key as keyof FlashSessionData]);
    },
    flash(key, value) {
      data[key] = value;
    },
    getFlash(key) {
      const value = data[key];
      delete data[key];
      return value;
    },
  };
}

describe('Flash Messages', () => {
  let session: Session<FlashSessionData>;

  beforeEach(() => {
    session = createMockSession();
  });

  describe('setFlash', () => {
    it('should set a flash message', () => {
      setFlash(session, 'success', 'Operation successful');
      const messages = peekFlashMessages(session);

      expect(messages).toHaveLength(1);
      expect(messages[0]?.category).toBe('success');
      expect(messages[0]?.message).toBe('Operation successful');
    });

    it('should set multiple flash messages', () => {
      setFlash(session, 'success', 'First message');
      setFlash(session, 'error', 'Second message');
      const messages = peekFlashMessages(session);

      expect(messages).toHaveLength(2);
    });

    it('should include metadata', () => {
      setFlash(session, 'info', 'With metadata', { userId: 123 });
      const messages = peekFlashMessages(session);

      expect(messages[0]?.metadata).toEqual({ userId: 123 });
    });

    it('should include timestamp', () => {
      const before = Date.now();
      setFlash(session, 'success', 'Test');
      const after = Date.now();
      const messages = peekFlashMessages(session);

      expect(messages[0]?.timestamp).toBeGreaterThanOrEqual(before);
      expect(messages[0]?.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('Category helpers', () => {
    it('should set success message', () => {
      setFlashSuccess(session, 'Success!');
      const messages = peekFlashMessages(session);

      expect(messages[0]?.category).toBe('success');
    });

    it('should set error message', () => {
      setFlashError(session, 'Error!');
      const messages = peekFlashMessages(session);

      expect(messages[0]?.category).toBe('error');
    });

    it('should set warning message', () => {
      setFlashWarning(session, 'Warning!');
      const messages = peekFlashMessages(session);

      expect(messages[0]?.category).toBe('warning');
    });

    it('should set info message', () => {
      setFlashInfo(session, 'Info!');
      const messages = peekFlashMessages(session);

      expect(messages[0]?.category).toBe('info');
    });
  });

  describe('getFlashMessages', () => {
    it('should get and clear messages', () => {
      setFlash(session, 'success', 'Test');
      const messages = getFlashMessages(session);

      expect(messages).toHaveLength(1);

      // Messages should be cleared
      const messagesAfter = peekFlashMessages(session);
      expect(messagesAfter).toHaveLength(0);
    });

    it('should return empty array if no messages', () => {
      const messages = getFlashMessages(session);
      expect(messages).toEqual([]);
    });
  });

  describe('getFlashMessagesByCategory', () => {
    it('should filter messages by category', () => {
      setFlashSuccess(session, 'Success 1');
      setFlashError(session, 'Error 1');
      setFlashSuccess(session, 'Success 2');

      const successMessages = getFlashMessagesByCategory(session, 'success');
      expect(successMessages).toHaveLength(2);
      expect(successMessages.every(m => m.category === 'success')).toBe(true);
    });
  });

  describe('peekFlashMessages', () => {
    it('should get messages without clearing', () => {
      setFlash(session, 'success', 'Test');
      const messages = peekFlashMessages(session);

      expect(messages).toHaveLength(1);

      // Messages should still be there
      const messagesAfter = peekFlashMessages(session);
      expect(messagesAfter).toHaveLength(1);
    });
  });

  describe('clearFlashMessages', () => {
    it('should clear all messages', () => {
      setFlash(session, 'success', 'Test 1');
      setFlash(session, 'error', 'Test 2');

      clearFlashMessages(session);

      const messages = peekFlashMessages(session);
      expect(messages).toHaveLength(0);
    });
  });

  describe('hasFlashMessages', () => {
    it('should return true when messages exist', () => {
      setFlash(session, 'success', 'Test');
      expect(hasFlashMessages(session)).toBe(true);
    });

    it('should return false when no messages', () => {
      expect(hasFlashMessages(session)).toBe(false);
    });
  });

  describe('createFlashUtils', () => {
    it('should create utility object', () => {
      const flash = createFlashUtils(session);

      flash.success('Test success');
      flash.error('Test error');
      flash.warning('Test warning');
      flash.info('Test info');

      const messages = flash.get();
      expect(messages).toHaveLength(4);

      expect(flash.has()).toBe(false); // Should be cleared after get
    });

    it('should support peek', () => {
      const flash = createFlashUtils(session);

      flash.success('Test');
      const peeked = flash.peek();
      expect(peeked).toHaveLength(1);

      // Should still have messages
      expect(flash.has()).toBe(true);
    });

    it('should support getByCategory', () => {
      const flash = createFlashUtils(session);

      flash.success('Success 1');
      flash.error('Error 1');
      flash.success('Success 2');

      const successes = flash.getByCategory('success');
      expect(successes).toHaveLength(2);
    });

    it('should support clear', () => {
      const flash = createFlashUtils(session);

      flash.success('Test');
      flash.clear();

      expect(flash.has()).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should serialize messages', () => {
      const messages: FlashMessage[] = [
        { category: 'success', message: 'Test', timestamp: Date.now() },
      ];

      const serialized = serializeFlashMessages(messages);
      expect(typeof serialized).toBe('string');

      const deserialized = deserializeFlashMessages(serialized);
      expect(deserialized).toEqual(messages);
    });

    it('should handle invalid JSON', () => {
      const deserialized = deserializeFlashMessages('invalid json');
      expect(deserialized).toEqual([]);
    });
  });
});
