/**
 * Tests for PhilJS Storage Package
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryStorageClient } from './providers/memory.js';
import type { StorageFile, MemoryConfig, UploadProgress } from './index.js';

describe('MemoryStorageClient', () => {
  let storage: MemoryStorageClient;

  const defaultConfig: MemoryConfig = {
    bucket: 'test-bucket',
  };

  beforeEach(() => {
    storage = new MemoryStorageClient(defaultConfig);
  });

  describe('initialization', () => {
    it('should create storage client with bucket name', () => {
      expect(storage.bucket).toBe('test-bucket');
    });

    it('should start with empty storage', () => {
      expect(storage.count).toBe(0);
      expect(storage.size).toBe(0);
    });
  });

  describe('upload', () => {
    it('should upload string data', async () => {
      const result = await storage.upload('test.txt', 'Hello, World!');

      expect(result.key).toBe('test.txt');
      expect(result.size).toBe(13);
      expect(result.contentType).toBeDefined();
      expect(storage.count).toBe(1);
    });

    it('should upload Buffer data', async () => {
      const buffer = Buffer.from('Binary content');
      const result = await storage.upload('binary.bin', buffer);

      expect(result.key).toBe('binary.bin');
      expect(result.size).toBe(buffer.length);
    });

    it('should set custom content type', async () => {
      const result = await storage.upload('data.json', '{"key": "value"}', {
        contentType: 'application/json',
      });

      expect(result.contentType).toBe('application/json');
    });

    it('should store custom metadata', async () => {
      const result = await storage.upload('file.txt', 'content', {
        metadata: { author: 'test', version: '1.0' },
      });

      expect(result.metadata?.author).toBe('test');
      expect(result.metadata?.version).toBe('1.0');
    });

    it('should generate etag', async () => {
      const result = await storage.upload('file.txt', 'content');

      expect(result.etag).toBeDefined();
      expect(typeof result.etag).toBe('string');
    });

    it('should track upload progress', async () => {
      const progress: UploadProgress[] = [];

      await storage.upload('large.txt', 'A'.repeat(100000), {
        onProgress: (p) => progress.push({ ...p }),
      });

      expect(progress.length).toBeGreaterThan(0);
      expect(progress[progress.length - 1].percentage).toBe(100);
    });
  });

  describe('download', () => {
    it('should download uploaded file', async () => {
      await storage.upload('download.txt', 'Download me');
      const result = await storage.download('download.txt');

      expect(result.toString()).toBe('Download me');
    });

    it('should throw error for non-existent file', async () => {
      await expect(storage.download('nonexistent.txt')).rejects.toThrow('File not found');
    });

    it('should support range requests', async () => {
      await storage.upload('range.txt', 'Hello, World!');
      const result = await storage.download('range.txt', {
        rangeStart: 0,
        rangeEnd: 4,
      });

      expect(result.toString()).toBe('Hello');
    });
  });

  describe('downloadStream', () => {
    it('should return a ReadableStream', async () => {
      await storage.upload('stream.txt', 'Stream content');
      const stream = await storage.downloadStream('stream.txt');

      expect(stream).toBeInstanceOf(ReadableStream);

      // Read the stream
      const reader = stream.getReader();
      const { value } = await reader.read();
      expect(Buffer.from(value!).toString()).toBe('Stream content');
    });
  });

  describe('delete', () => {
    it('should delete a file', async () => {
      await storage.upload('delete-me.txt', 'content');
      expect(storage.count).toBe(1);

      await storage.delete('delete-me.txt');
      expect(storage.count).toBe(0);
    });

    it('should update size after deletion', async () => {
      await storage.upload('sized.txt', 'content');
      const sizeBefore = storage.size;

      await storage.delete('sized.txt');
      expect(storage.size).toBeLessThan(sizeBefore);
    });

    it('should handle deleting non-existent file gracefully', async () => {
      await expect(storage.delete('nonexistent.txt')).resolves.not.toThrow();
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple files', async () => {
      await storage.upload('file1.txt', 'content1');
      await storage.upload('file2.txt', 'content2');
      await storage.upload('file3.txt', 'content3');
      expect(storage.count).toBe(3);

      await storage.deleteMany(['file1.txt', 'file2.txt']);
      expect(storage.count).toBe(1);
      expect(await storage.exists('file3.txt')).toBe(true);
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      await storage.upload('docs/readme.md', 'readme');
      await storage.upload('docs/guide.md', 'guide');
      await storage.upload('images/logo.png', 'logo');
      await storage.upload('root.txt', 'root');
    });

    it('should list all files', async () => {
      const result = await storage.list();

      expect(result.files.length).toBe(4);
      expect(result.isTruncated).toBe(false);
    });

    it('should filter by prefix', async () => {
      const result = await storage.list({ prefix: 'docs/' });

      expect(result.files.length).toBe(2);
      expect(result.files.every(f => f.key.startsWith('docs/'))).toBe(true);
    });

    it('should support pagination with maxResults', async () => {
      const result = await storage.list({ maxResults: 2 });

      expect(result.files.length).toBe(2);
      expect(result.isTruncated).toBe(true);
      expect(result.nextToken).toBeDefined();
    });

    it('should continue from nextToken', async () => {
      const first = await storage.list({ maxResults: 2 });
      const second = await storage.list({
        maxResults: 2,
        continuationToken: first.nextToken,
      });

      expect(second.files.length).toBe(2);
      expect(first.files[0].key).not.toBe(second.files[0].key);
    });
  });

  describe('getMetadata', () => {
    it('should return file metadata', async () => {
      await storage.upload('meta.txt', 'content', {
        metadata: { custom: 'value' },
      });

      const meta = await storage.getMetadata('meta.txt');

      expect(meta).not.toBeNull();
      expect(meta?.key).toBe('meta.txt');
      expect(meta?.size).toBe(7);
      expect(meta?.metadata?.custom).toBe('value');
    });

    it('should return null for non-existent file', async () => {
      const meta = await storage.getMetadata('nonexistent.txt');
      expect(meta).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      await storage.upload('exists.txt', 'content');
      expect(await storage.exists('exists.txt')).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      expect(await storage.exists('nope.txt')).toBe(false);
    });
  });

  describe('copy', () => {
    it('should copy a file to new location', async () => {
      await storage.upload('original.txt', 'Original content');
      const copied = await storage.copy('original.txt', 'copied.txt');

      expect(copied.key).toBe('copied.txt');
      expect(await storage.exists('original.txt')).toBe(true);
      expect(await storage.exists('copied.txt')).toBe(true);

      const content = await storage.download('copied.txt');
      expect(content.toString()).toBe('Original content');
    });

    it('should throw error when copying non-existent file', async () => {
      await expect(storage.copy('nope.txt', 'dest.txt')).rejects.toThrow('Source file not found');
    });
  });

  describe('move', () => {
    it('should move a file to new location', async () => {
      await storage.upload('before.txt', 'Move me');
      const moved = await storage.move('before.txt', 'after.txt');

      expect(moved.key).toBe('after.txt');
      expect(await storage.exists('before.txt')).toBe(false);
      expect(await storage.exists('after.txt')).toBe(true);
    });
  });

  describe('getSignedUrl', () => {
    it('should generate signed URL', async () => {
      await storage.upload('signed.txt', 'content');
      const url = await storage.getSignedUrl('signed.txt');

      expect(url).toContain('memory://');
      expect(url).toContain('test-bucket');
      expect(url).toContain('expires=');
      expect(url).toContain('signature=');
    });

    it('should include method in signature for PUT', async () => {
      await storage.upload('put.txt', 'content');
      const url = await storage.getSignedUrl('put.txt', { method: 'PUT' });

      expect(url).toContain('method=PUT');
    });
  });

  describe('getPublicUrl', () => {
    it('should generate public URL', async () => {
      await storage.upload('public.txt', 'content');
      const url = storage.getPublicUrl('public.txt');

      expect(url).toBe('memory://test-bucket/public.txt');
    });
  });

  describe('clear', () => {
    it('should clear all files', async () => {
      await storage.upload('file1.txt', 'content');
      await storage.upload('file2.txt', 'content');
      expect(storage.count).toBe(2);

      storage.clear();

      expect(storage.count).toBe(0);
      expect(storage.size).toBe(0);
    });
  });

  describe('storage limits', () => {
    it('should enforce maxSize limit', async () => {
      const limitedStorage = new MemoryStorageClient({
        bucket: 'limited',
        maxSize: 100,
      });

      await expect(
        limitedStorage.upload('big.txt', 'A'.repeat(200))
      ).rejects.toThrow('Storage limit exceeded');
    });
  });

  describe('basePath', () => {
    it('should prefix keys with basePath', async () => {
      const prefixedStorage = new MemoryStorageClient({
        bucket: 'test',
        basePath: 'prefix',
      });

      await prefixedStorage.upload('file.txt', 'content');
      const url = prefixedStorage.getPublicUrl('file.txt');

      expect(url).toContain('prefix/file.txt');
    });
  });
});
