/**
 * Router Mocks Tests
 */

import { describe, it, expect } from 'vitest';
import { createMockRouter, createMockParams, createMockSearchParams } from './router-mocks.js';

describe('createMockRouter', () => {
  it('should create a mock router with initial path', () => {
    const router = createMockRouter('/home');

    expect(router.pathname()).toBe('/home');
  });

  it('should track navigation calls', () => {
    const router = createMockRouter('/');

    router.navigate('/about');
    router.navigate('/contact');

    const calls = router.getCalls();
    expect(calls).toHaveLength(2);
    expect(calls[0].method).toBe('navigate');
    expect(calls[0].args).toEqual(['/about']);
    expect(calls[1].method).toBe('navigate');
    expect(calls[1].args).toEqual(['/contact']);
  });

  it('should update pathname on navigate', () => {
    const router = createMockRouter('/');

    router.navigate('/about');

    expect(router.pathname()).toBe('/about');
  });

  it('should track back/forward calls', () => {
    const router = createMockRouter('/');

    router.back();
    router.forward();

    const calls = router.getCalls();
    expect(calls).toHaveLength(2);
    expect(calls[0].method).toBe('back');
    expect(calls[1].method).toBe('forward');
  });

  it('should track push calls', () => {
    const router = createMockRouter('/');

    router.push('/new-page');

    const calls = router.getCalls();
    expect(calls[0].method).toBe('push');
    expect(calls[0].args).toEqual(['/new-page']);
    expect(router.pathname()).toBe('/new-page');
  });

  it('should track replace calls', () => {
    const router = createMockRouter('/old-page');

    router.replace('/new-page');

    const calls = router.getCalls();
    expect(calls[0].method).toBe('replace');
    expect(calls[0].args).toEqual(['/new-page']);
    expect(router.pathname()).toBe('/new-page');
  });
});

describe('createMockParams', () => {
  it('should create mock params', () => {
    const params = createMockParams({ id: '123', slug: 'test' });

    expect(params()).toEqual({ id: '123', slug: 'test' });
  });
});

describe('createMockSearchParams', () => {
  it('should create mock search params', () => {
    const searchParams = createMockSearchParams({ page: '1', sort: 'name' });

    expect(searchParams().get('page')).toBe('1');
    expect(searchParams().get('sort')).toBe('name');
  });

  it('should create empty search params', () => {
    const searchParams = createMockSearchParams();

    expect(searchParams().toString()).toBe('');
  });
});
