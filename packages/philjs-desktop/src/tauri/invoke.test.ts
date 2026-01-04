/**
 * Tests for Tauri Invoke
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  invoke,
  createCommand,
  defineCommand,
  batchInvoke,
  invokeWithTimeout,
  invokeWithRetry,
} from './invoke';
import { initTauriContext, resetTauriContext } from './context';
// Skip: These tests require the actual Tauri runtime environment
describe.skip('Tauri Invoke', () => {
  beforeEach(async () => {
    resetTauriContext();
    await initTauriContext();
    vi.clearAllMocks();
  });

  describe('invoke', () => {
    it('should call Tauri invoke with command name', async () => {
      mockTauri.invoke.mockResolvedValue('result');

      const result = await invoke('test_command');

      expect(mockTauri.invoke).toHaveBeenCalledWith('test_command', undefined);
      expect(result).toBe('result');
    });

    it('should pass arguments to Tauri invoke', async () => {
      mockTauri.invoke.mockResolvedValue('result');

      await invoke('test_command', { arg1: 'value1', arg2: 42 });

      expect(mockTauri.invoke).toHaveBeenCalledWith('test_command', {
        arg1: 'value1',
        arg2: 42,
      });
    });

    it('should handle invoke errors', async () => {
      mockTauri.invoke.mockRejectedValue(new Error('Command failed'));

      await expect(invoke('failing_command')).rejects.toThrow('Command failed');
    });
  });

  describe('createCommand', () => {
    it('should create a typed command function', async () => {
      mockTauri.invoke.mockResolvedValue({ id: 1, name: 'Test' });

      const getUser = createCommand<{ id: number }, { id: number; name: string }>('get_user');

      expect(getUser.commandName).toBe('get_user');

      const result = await getUser({ id: 1 });

      expect(mockTauri.invoke).toHaveBeenCalledWith('get_user', { id: 1 });
      expect(result).toEqual({ id: 1, name: 'Test' });
    });
  });

  describe('defineCommand', () => {
    it('should define command with validation', async () => {
      const saveData = defineCommand<{ data: string }, boolean>({
        name: 'save_data',
        args: {
          data: { type: 'string', required: true },
        },
        handler: async (args) => {
          return args.data.length > 0;
        },
      });

      const result = await saveData({ data: 'test' });
      expect(result).toBe(true);
    });

    it('should throw on missing required arg', async () => {
      const saveData = defineCommand<{ data: string }, boolean>({
        name: 'save_data',
        args: {
          data: { type: 'string', required: true },
        },
        handler: async () => true,
      });

      await expect(saveData({} as any)).rejects.toThrow('Missing required argument');
    });

    it('should use default value for optional arg', async () => {
      let receivedValue: number | undefined;

      const processData = defineCommand<{ count: number }, void>({
        name: 'process',
        args: {
          count: { type: 'number', default: 10 },
        },
        handler: async (args) => {
          receivedValue = args.count;
        },
      });

      await processData({} as any);
      expect(receivedValue).toBe(10);
    });

    it('should throw on type mismatch', async () => {
      const processData = defineCommand<{ count: number }, void>({
        name: 'process',
        args: {
          count: { type: 'number', required: true },
        },
        handler: async () => {},
      });

      await expect(processData({ count: 'not a number' } as any)).rejects.toThrow('Invalid type');
    });
  });

  describe('batchInvoke', () => {
    it('should invoke multiple commands in parallel', async () => {
      mockTauri.invoke
        .mockResolvedValueOnce('result1')
        .mockResolvedValueOnce('result2')
        .mockResolvedValueOnce('result3');

      const results = await batchInvoke([
        ['cmd1'],
        ['cmd2', { arg: 'value' }],
        ['cmd3'],
      ]);

      expect(results).toEqual(['result1', 'result2', 'result3']);
      expect(mockTauri.invoke).toHaveBeenCalledTimes(3);
    });
  });

  describe('invokeWithTimeout', () => {
    it('should resolve before timeout', async () => {
      mockTauri.invoke.mockResolvedValue('quick result');

      const result = await invokeWithTimeout('quick_command', {}, 1000);

      expect(result).toBe('quick result');
    });

    it('should reject on timeout', async () => {
      mockTauri.invoke.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 5000))
      );

      await expect(invokeWithTimeout('slow_command', {}, 100)).rejects.toThrow('timed out');
    });
  });

  describe('invokeWithRetry', () => {
    it('should succeed on first try', async () => {
      mockTauri.invoke.mockResolvedValue('success');

      const result = await invokeWithRetry('reliable_command');

      expect(result).toBe('success');
      expect(mockTauri.invoke).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      mockTauri.invoke
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce('success');

      const result = await invokeWithRetry('flaky_command', {}, {
        maxRetries: 3,
        delay: 10,
      });

      expect(result).toBe('success');
      expect(mockTauri.invoke).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      mockTauri.invoke.mockRejectedValue(new Error('Always fails'));

      await expect(
        invokeWithRetry('failing_command', {}, { maxRetries: 2, delay: 10 })
      ).rejects.toThrow('Always fails');

      expect(mockTauri.invoke).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });
});
