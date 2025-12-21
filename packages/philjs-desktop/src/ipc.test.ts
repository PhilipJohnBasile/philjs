/**
 * Tests for IPC Bridge
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createIPCBridge,
  registerCommand,
  exposeToRust,
  createTypedIPC,
  createChannel,
  createRequestChannel,
} from './ipc';
import { initTauriContext, resetTauriContext } from './tauri/context';
import { mockTauri, mockEvents } from './test-setup';

describe('IPC Bridge', () => {
  beforeEach(async () => {
    resetTauriContext();
    await initTauriContext();
    vi.clearAllMocks();
  });

  describe('createIPCBridge', () => {
    it('should create IPC bridge with default options', () => {
      const bridge = createIPCBridge();

      expect(bridge.invoke).toBeDefined();
      expect(bridge.on).toBeDefined();
      expect(bridge.emit).toBeDefined();
      expect(bridge.registerHandler).toBeDefined();
      expect(bridge.getHandlers).toBeDefined();
      expect(bridge.destroy).toBeDefined();
    });

    it('should create bridge with command prefix', async () => {
      mockTauri.invoke.mockResolvedValue('result');
      const bridge = createIPCBridge({ commandPrefix: 'app:' });

      await bridge.invoke('test');

      expect(mockTauri.invoke).toHaveBeenCalledWith('app:test', undefined);
    });

    it('should create bridge with event prefix', async () => {
      const bridge = createIPCBridge({ eventPrefix: 'events:' });
      const callback = vi.fn();

      await bridge.on('test', callback);

      expect(mockEvents.listen).toHaveBeenCalledWith('events:test', expect.any(Function));
    });

    it('should register command handler', () => {
      const bridge = createIPCBridge();
      const handler = vi.fn().mockResolvedValue('result');

      bridge.registerHandler('compute', handler);

      expect(bridge.getHandlers()).toContain('compute');
    });

    it('should destroy bridge and clear handlers', () => {
      const bridge = createIPCBridge();
      bridge.registerHandler('test', vi.fn());

      bridge.destroy();

      expect(bridge.getHandlers()).toEqual([]);
    });

    it('should log in debug mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      mockTauri.invoke.mockResolvedValue('result');

      const bridge = createIPCBridge({ debug: true });
      await bridge.invoke('test');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('registerCommand', () => {
    it('should register a command handler', () => {
      const handler = vi.fn();

      const unregister = registerCommand('myCommand', handler);

      expect(typeof unregister).toBe('function');
    });

    it('should unregister on cleanup', () => {
      const handler = vi.fn();

      const unregister = registerCommand('myCommand', handler);
      unregister();

      // Handler should be removed
    });
  });

  describe('exposeToRust', () => {
    it('should expose API functions', () => {
      const api = {
        getData: vi.fn().mockResolvedValue({ value: 42 }),
        processItem: vi.fn().mockResolvedValue('processed'),
      };

      const cleanup = exposeToRust(api);

      expect(typeof cleanup).toBe('function');
    });

    it('should expose with prefix', () => {
      const api = {
        method1: vi.fn(),
        method2: vi.fn(),
      };

      const cleanup = exposeToRust(api, { prefix: 'api' });

      expect(typeof cleanup).toBe('function');
    });

    it('should cleanup exposed functions', () => {
      const api = {
        test: vi.fn(),
      };

      const cleanup = exposeToRust(api);
      cleanup();

      // Functions should be unregistered
    });
  });

  describe('createTypedIPC', () => {
    interface TestSchema {
      commands: {
        'get_user': { args: { id: number }; result: { name: string } };
        'save_data': { args: { data: string }; result: boolean };
      };
      events: {
        'user_updated': { id: number; name: string };
      };
    }

    it('should create typed invoke', async () => {
      mockTauri.invoke.mockResolvedValue({ name: 'John' });

      const ipc = createTypedIPC<TestSchema>();
      const result = await ipc.invoke('get_user', { id: 1 });

      expect(result).toEqual({ name: 'John' });
    });

    it('should create typed event listener', async () => {
      const ipc = createTypedIPC<TestSchema>();
      const callback = vi.fn();

      await ipc.on('user_updated', callback);

      expect(mockEvents.listen).toHaveBeenCalled();
    });

    it('should create typed event emitter', async () => {
      const ipc = createTypedIPC<TestSchema>();

      await ipc.emit('user_updated', { id: 1, name: 'Jane' });

      expect(mockEvents.emit).toHaveBeenCalledWith('user_updated', { id: 1, name: 'Jane' });
    });
  });

  describe('createChannel', () => {
    it('should create a channel', () => {
      const channel = createChannel<string>('messages');

      expect(channel.send).toBeDefined();
      expect(channel.receive).toBeDefined();
      expect(channel.close).toBeDefined();
    });

    it('should send data through channel', async () => {
      const channel = createChannel<{ message: string }>('chat');

      await channel.send({ message: 'Hello' });

      expect(mockEvents.emit).toHaveBeenCalledWith(
        '__philjs_channel_chat__',
        { message: 'Hello' }
      );
    });

    it('should receive data through channel', async () => {
      const channel = createChannel<number>('numbers');
      const callback = vi.fn();

      await channel.receive(callback);

      expect(mockEvents.listen).toHaveBeenCalled();
    });

    it('should throw after close', async () => {
      const channel = createChannel<string>('closable');

      channel.close();

      await expect(channel.send('data')).rejects.toThrow('Channel is closed');
    });
  });

  describe('createRequestChannel', () => {
    it('should create request/response channel', () => {
      const channel = createRequestChannel<{ id: number }, { name: string }>('users');

      expect(channel.request).toBeDefined();
      expect(channel.respond).toBeDefined();
    });

    it('should set up responder', async () => {
      const channel = createRequestChannel<string, string>('echo');
      const handler = vi.fn().mockResolvedValue('pong');

      await channel.respond(handler);

      expect(mockEvents.listen).toHaveBeenCalled();
    });
  });
});
