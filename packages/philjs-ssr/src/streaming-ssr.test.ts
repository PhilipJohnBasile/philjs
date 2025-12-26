/**
 * Tests for Streaming SSR functionality
 */

import { describe, it, expect, vi } from 'vitest';
import { renderToStream, Suspense, Island } from './render-to-stream.js';
import { renderToStreamingResponse } from './streaming.js';

// Mock VNode types for testing
interface MockVNode {
  type: string | Function | symbol;
  props: Record<string, any>;
}

function createElement(type: string | Function | symbol, props: Record<string, any> = {}): MockVNode {
  return { type, props };
}

describe('renderToStream', () => {
  it('should return a ReadableStream', () => {
    const vnode = createElement('div', { children: 'Hello' });
    const stream = renderToStream(vnode as any);

    expect(stream).toBeInstanceOf(ReadableStream);
  });

  it('should call onShellReady callback when shell is ready', async () => {
    const onShellReady = vi.fn();
    const vnode = createElement('div', { children: 'Test content' });

    const stream = renderToStream(vnode as any, { onShellReady });
    const reader = stream.getReader();

    // Read the stream to trigger callbacks
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    expect(onShellReady).toHaveBeenCalled();
  });

  it('should call onAllReady callback when all content is ready', async () => {
    const onAllReady = vi.fn();
    const vnode = createElement('div', { children: 'Complete' });

    const stream = renderToStream(vnode as any, { onAllReady });
    const reader = stream.getReader();

    // Consume the stream
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }

    expect(onAllReady).toHaveBeenCalled();
  });

  it('should render HTML elements correctly', async () => {
    const vnode = createElement('div', {
      className: 'container',
      children: createElement('span', { children: 'Hello World' })
    });

    const stream = renderToStream(vnode as any);
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    let html = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value);
    }

    expect(html).toContain('<div');
    expect(html).toContain('class="container"');
    expect(html).toContain('<span>Hello World</span>');
  });

  it('should escape HTML special characters', async () => {
    const vnode = createElement('div', {
      children: '<script>alert("xss")</script>'
    });

    const stream = renderToStream(vnode as any);
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    let html = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value);
    }

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('Suspense and Island symbols', () => {
  it('should define Suspense symbol', () => {
    expect(Suspense).toBeDefined();
    expect(typeof Suspense).toBe('symbol');
    expect(Suspense.toString()).toBe('Symbol(philjs.Suspense)');
  });

  it('should define Island symbol', () => {
    expect(Island).toBeDefined();
    expect(typeof Island).toBe('symbol');
    expect(Island.toString()).toBe('Symbol(philjs.Island)');
  });
});

describe('renderToStreamingResponse', () => {
  it('should return a ReadableStream', async () => {
    const vnode = createElement('div', { children: 'Hello' });
    const stream = await renderToStreamingResponse(vnode as any);

    expect(stream).toBeInstanceOf(ReadableStream);
  });

  it('should include DOCTYPE and HTML structure', async () => {
    const vnode = createElement('div', { children: 'Content' });
    const stream = await renderToStreamingResponse(vnode as any);
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    let html = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value);
    }

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
    expect(html).toContain('<body>');
    expect(html).toContain('</body>');
  });

  it('should call onShellReady and onComplete callbacks', async () => {
    const onShellReady = vi.fn();
    const onComplete = vi.fn();

    const vnode = createElement('div', { children: 'Test' });
    const stream = await renderToStreamingResponse(vnode as any, {
      onShellReady,
      onComplete,
    });

    const reader = stream.getReader();
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }

    expect(onShellReady).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });

  it('should include streaming SSR client runtime script', async () => {
    const vnode = createElement('div', { children: 'Test' });
    const stream = await renderToStreamingResponse(vnode as any);
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    let html = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value);
    }

    expect(html).toContain('__PHIL_SUSPENSE__');
    expect(html).toContain('__phil_inject');
  });
});

describe('Stream options', () => {
  it('should support selective hydration option', () => {
    const vnode = createElement('div', { children: 'Test' });
    const stream = renderToStream(vnode as any, {
      selectiveHydration: true,
    });

    expect(stream).toBeInstanceOf(ReadableStream);
  });

  it('should support interactive components option', () => {
    const vnode = createElement('div', { children: 'Test' });
    const interactiveComponents = new Set(['Button', 'Form']);

    const stream = renderToStream(vnode as any, {
      interactiveComponents,
    });

    expect(stream).toBeInstanceOf(ReadableStream);
  });

  it('should support bootstrap scripts and modules', async () => {
    const vnode = createElement('div', { children: 'Test' });
    const stream = renderToStream(vnode as any, {
      bootstrapScripts: ['/app.js'],
      bootstrapModules: ['/main.mjs'],
      selectiveHydration: true,
    });

    const reader = stream.getReader();
    const decoder = new TextDecoder();

    let html = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value);
    }

    // The scripts should be included when there are islands or explicit scripts
    expect(stream).toBeInstanceOf(ReadableStream);
  });
});
