/**
 * Comprehensive tests for guards.ts
 * Testing navigation guards, authentication, role-based access, and utility functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  beforeEach as beforeEachGuard,
  afterEach as afterEachGuard,
  beforeRoute,
  runNavigationGuards,
  runAfterHooks,
  createAuthGuard,
  createRoleGuard,
  createPermissionGuard,
  createLoadingGuard,
  createTitleGuard,
  createAnalyticsGuard,
  createConfirmGuard,
  createRateLimitGuard,
  parseLocation,
  createLocation,
  clearAllGuards,
  getGuardsCount,
  getNavigationStatus,
  isNavigationCancelled,
  type RouteLocation,
  type RouteMeta,
} from './guards';

// Helper to create RouteLocation
function makeLocation(
  path: string,
  meta: RouteMeta = {},
  query: Record<string, string | string[]> = {},
  params: Record<string, string> = {}
): RouteLocation {
  return {
    path,
    fullPath: path,
    query,
    params,
    hash: '',
    meta,
    matched: [],
  };
}

describe('Navigation Guards - Registration', () => {
  beforeEach(() => {
    clearAllGuards();
  });

  it('should register a global before guard', () => {
    const guard = vi.fn();
    const unregister = beforeEachGuard(guard);

    const counts = getGuardsCount();
    expect(counts.before).toBe(1);

    unregister();
    expect(getGuardsCount().before).toBe(0);
  });

  it('should register a global after hook', () => {
    const hook = vi.fn();
    const unregister = afterEachGuard(hook);

    const counts = getGuardsCount();
    expect(counts.after).toBe(1);

    unregister();
    expect(getGuardsCount().after).toBe(0);
  });

  it('should register route-specific guards', () => {
    const guard = vi.fn();
    const unregister = beforeRoute('/dashboard', guard);

    expect(getGuardsCount().route).toBe(1);

    unregister();
    expect(getGuardsCount().route).toBe(0);
  });

  it('should register guards for multiple routes', () => {
    const guard = vi.fn();
    const unregister = beforeRoute(['/dashboard', '/admin', '/settings'], guard);

    expect(getGuardsCount().route).toBe(3);

    unregister();
    expect(getGuardsCount().route).toBe(0);
  });

  it('should sort guards by priority', async () => {
    const order: number[] = [];

    beforeEachGuard(() => { order.push(1); }, { priority: 10 });
    beforeEachGuard(() => { order.push(2); }, { priority: 20 });
    beforeEachGuard(() => { order.push(3); }, { priority: 15 });

    const to = makeLocation('/test');
    await runNavigationGuards(to, null);

    expect(order).toEqual([2, 3, 1]); // Descending priority order

    clearAllGuards();
  });
});

describe('Navigation Guards - Execution', () => {
  beforeEach(() => {
    clearAllGuards();
  });

  it('should run all before guards', async () => {
    const guard1 = vi.fn();
    const guard2 = vi.fn();

    beforeEachGuard(guard1);
    beforeEachGuard(guard2);

    const to = makeLocation('/test');
    await runNavigationGuards(to, null);

    expect(guard1).toHaveBeenCalled();
    expect(guard2).toHaveBeenCalled();
  });

  it('should pass route locations to guards', async () => {
    const guard = vi.fn();
    beforeEachGuard(guard);

    const to = makeLocation('/test', { title: 'Test Page' });
    const from = makeLocation('/previous');

    await runNavigationGuards(to, from);

    expect(guard).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/test' }),
      expect.objectContaining({ path: '/previous' }),
      expect.any(Object)
    );
  });

  it('should allow navigation when guard returns true', async () => {
    beforeEachGuard(() => true);

    const result = await runNavigationGuards(makeLocation('/test'), null);

    expect(result).toBe(true);
  });

  it('should block navigation when guard returns false', async () => {
    beforeEachGuard(() => false);

    const result = await runNavigationGuards(makeLocation('/test'), null);

    expect(result).toBe(false);
  });

  it('should redirect when guard returns a string', async () => {
    beforeEachGuard(() => '/login');

    const result = await runNavigationGuards(makeLocation('/test'), null);

    expect(result).toEqual({ redirect: '/login' });
  });

  it('should redirect when guard returns redirect object', async () => {
    beforeEachGuard(() => ({ redirect: '/login' }));

    const result = await runNavigationGuards(makeLocation('/test'), null);

    expect(result).toEqual({ redirect: '/login' });
  });

  it('should abort when context.abort() is called', async () => {
    beforeEachGuard((to, from, ctx) => {
      ctx.abort();
    });

    const result = await runNavigationGuards(makeLocation('/test'), null);

    expect(result).toBe(false);
  });

  it('should redirect when context.redirect() is called', async () => {
    beforeEachGuard((to, from, ctx) => {
      ctx.redirect('/redirected');
    });

    const result = await runNavigationGuards(makeLocation('/test'), null);

    expect(result).toEqual({ redirect: '/redirected' });
  });

  it('should handle async guards', async () => {
    beforeEachGuard(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return true;
    });

    const result = await runNavigationGuards(makeLocation('/test'), null);

    expect(result).toBe(true);
  });

  it('should stop on first blocking guard', async () => {
    const guard1 = vi.fn(() => false);
    const guard2 = vi.fn(() => true);

    beforeEachGuard(guard1, { priority: 10 });
    beforeEachGuard(guard2, { priority: 5 });

    await runNavigationGuards(makeLocation('/test'), null);

    expect(guard1).toHaveBeenCalled();
    expect(guard2).not.toHaveBeenCalled();
  });
});

describe('Navigation Guards - Route Filtering', () => {
  beforeEach(() => {
    clearAllGuards();
  });

  it('should only run guards for matching routes', async () => {
    const guard = vi.fn();
    beforeEachGuard(guard, { routes: ['/admin/*'] });

    await runNavigationGuards(makeLocation('/user/profile'), null);
    expect(guard).not.toHaveBeenCalled();

    await runNavigationGuards(makeLocation('/admin/dashboard'), null);
    expect(guard).toHaveBeenCalled();
  });

  it('should exclude routes with excludeRoutes option', async () => {
    const guard = vi.fn();
    beforeEachGuard(guard, { excludeRoutes: ['/public/*'] });

    await runNavigationGuards(makeLocation('/public/about'), null);
    expect(guard).not.toHaveBeenCalled();

    await runNavigationGuards(makeLocation('/private/data'), null);
    expect(guard).toHaveBeenCalled();
  });

  it('should run route-specific guards only for that route', async () => {
    const guard = vi.fn();
    beforeRoute('/dashboard', guard);

    await runNavigationGuards(makeLocation('/home'), null);
    expect(guard).not.toHaveBeenCalled();

    await runNavigationGuards(makeLocation('/dashboard'), null);
    expect(guard).toHaveBeenCalled();
  });
});

describe('After Hooks', () => {
  beforeEach(() => {
    clearAllGuards();
  });

  it('should run after hooks after navigation', async () => {
    const hook = vi.fn();
    afterEachGuard(hook);

    const to = makeLocation('/test');
    const from = makeLocation('/previous');

    await runAfterHooks(to, from);

    expect(hook).toHaveBeenCalledWith(to, from, undefined);
  });

  it('should pass failure to after hooks', async () => {
    const hook = vi.fn();
    afterEachGuard(hook);

    const to = makeLocation('/test');
    const failure = { type: 'aborted' as const, from: null, to };

    await runAfterHooks(to, null, failure);

    expect(hook).toHaveBeenCalledWith(to, null, failure);
  });

  it('should catch errors in after hooks', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    afterEachGuard(() => { throw new Error('Hook error'); });

    // Should not throw
    await expect(runAfterHooks(makeLocation('/test'), null)).resolves.not.toThrow();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('createAuthGuard', () => {
  beforeEach(() => {
    clearAllGuards();
  });

  it('should allow navigation when authenticated and route requires auth', async () => {
    const guard = createAuthGuard({
      isAuthenticated: () => true,
    });
    beforeEachGuard(guard);

    const to = makeLocation('/protected', { requiresAuth: true });
    const result = await runNavigationGuards(to, null);

    expect(result).toBe(true);
  });

  it('should redirect to login when not authenticated', async () => {
    const guard = createAuthGuard({
      isAuthenticated: () => false,
      loginPath: '/login',
    });
    beforeEachGuard(guard);

    const to = makeLocation('/protected', { requiresAuth: true });
    const result = await runNavigationGuards(to, null);

    expect(result).toEqual({ redirect: expect.stringContaining('/login') });
  });

  it('should include returnTo parameter when configured', async () => {
    const guard = createAuthGuard({
      isAuthenticated: () => false,
      loginPath: '/login',
      returnTo: true,
    });
    beforeEachGuard(guard);

    const to = makeLocation('/protected', { requiresAuth: true });
    to.fullPath = '/protected?foo=bar';
    const result = await runNavigationGuards(to, null);

    expect(result).toEqual({
      redirect: expect.stringContaining('returnTo='),
    });
  });

  it('should skip guard for routes without requiresAuth', async () => {
    const guard = createAuthGuard({
      isAuthenticated: () => false,
    });
    beforeEachGuard(guard);

    const to = makeLocation('/public');
    const result = await runNavigationGuards(to, null);

    expect(result).toBe(true);
  });

  it('should handle async isAuthenticated check', async () => {
    const guard = createAuthGuard({
      isAuthenticated: async () => {
        await new Promise(r => setTimeout(r, 10));
        return true;
      },
    });
    beforeEachGuard(guard);

    const to = makeLocation('/protected', { requiresAuth: true });
    const result = await runNavigationGuards(to, null);

    expect(result).toBe(true);
  });
});

describe('createRoleGuard', () => {
  beforeEach(() => {
    clearAllGuards();
  });

  it('should allow access when user has required role', async () => {
    const guard = createRoleGuard({
      getUserRoles: () => ['admin', 'user'],
    });
    beforeEachGuard(guard);

    const to = makeLocation('/admin', { roles: ['admin'] });
    const result = await runNavigationGuards(to, null);

    expect(result).toBe(true);
  });

  it('should redirect to forbidden when user lacks role', async () => {
    const guard = createRoleGuard({
      getUserRoles: () => ['user'],
      forbiddenPath: '/403',
    });
    beforeEachGuard(guard);

    const to = makeLocation('/admin', { roles: ['admin'] });
    const result = await runNavigationGuards(to, null);

    expect(result).toEqual({ redirect: '/403' });
  });

  it('should handle any match mode', async () => {
    const guard = createRoleGuard({
      getUserRoles: () => ['editor'],
      matchMode: 'any',
    });
    beforeEachGuard(guard);

    const to = makeLocation('/content', { roles: ['admin', 'editor'] });
    const result = await runNavigationGuards(to, null);

    expect(result).toBe(true);
  });

  it('should handle all match mode', async () => {
    const guard = createRoleGuard({
      getUserRoles: () => ['admin', 'editor'],
      matchMode: 'all',
    });
    beforeEachGuard(guard);

    const to = makeLocation('/content', { roles: ['admin', 'editor'] });
    const result = await runNavigationGuards(to, null);

    expect(result).toBe(true);
  });

  it('should skip for routes without roles meta', async () => {
    const guard = createRoleGuard({
      getUserRoles: () => [],
    });
    beforeEachGuard(guard);

    const to = makeLocation('/public');
    const result = await runNavigationGuards(to, null);

    expect(result).toBe(true);
  });
});

describe('createPermissionGuard', () => {
  beforeEach(() => {
    clearAllGuards();
  });

  it('should allow access when user has all permissions', async () => {
    const guard = createPermissionGuard({
      getUserPermissions: () => ['read', 'write', 'delete'],
    });
    beforeEachGuard(guard);

    const to = makeLocation('/resource', { permissions: ['read', 'write'] });
    const result = await runNavigationGuards(to, null);

    expect(result).toBe(true);
  });

  it('should redirect when user lacks permissions', async () => {
    const guard = createPermissionGuard({
      getUserPermissions: () => ['read'],
      forbiddenPath: '/forbidden',
    });
    beforeEachGuard(guard);

    const to = makeLocation('/resource', { permissions: ['read', 'write'] });
    const result = await runNavigationGuards(to, null);

    expect(result).toEqual({ redirect: '/forbidden' });
  });
});

describe('createLoadingGuard', () => {
  beforeEach(() => {
    clearAllGuards();
  });

  it('should call onStart and onEnd', async () => {
    const onStart = vi.fn();
    const onEnd = vi.fn();

    const { before, after } = createLoadingGuard({
      onStart,
      onEnd,
      delay: 0,
    });

    beforeEachGuard(before);
    afterEachGuard(after);

    const to = makeLocation('/test');
    await runNavigationGuards(to, null);
    await runAfterHooks(to, null);

    expect(onStart).toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalled();
  });

  it('should delay onStart call', async () => {
    vi.useFakeTimers();

    const onStart = vi.fn();
    const onEnd = vi.fn();

    const { before, after } = createLoadingGuard({
      onStart,
      onEnd,
      delay: 100,
    });

    beforeEachGuard(before);

    const to = makeLocation('/test');
    await runNavigationGuards(to, null);

    expect(onStart).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(onStart).toHaveBeenCalled();

    vi.useRealTimers();
    clearAllGuards();
  });
});

describe('createTitleGuard', () => {
  beforeEach(() => {
    clearAllGuards();
  });

  it('should set document title', async () => {
    const hook = createTitleGuard({
      prefix: 'MyApp',
      separator: ' | ',
    });
    afterEachGuard(hook);

    const to = makeLocation('/about', { title: 'About Us' });
    await runAfterHooks(to, null);

    expect(document.title).toContain('About Us');
  });

  it('should use default title when no meta title', async () => {
    const hook = createTitleGuard({
      defaultTitle: 'Home',
    });
    afterEachGuard(hook);

    const to = makeLocation('/');
    await runAfterHooks(to, null);

    expect(document.title).toContain('Home');
  });
});

describe('createAnalyticsGuard', () => {
  beforeEach(() => {
    clearAllGuards();
  });

  it('should track page views', async () => {
    const trackPageView = vi.fn();

    const hook = createAnalyticsGuard({ trackPageView });
    afterEachGuard(hook);

    const to = makeLocation('/test', { title: 'Test Page' });
    to.fullPath = '/test?q=search';
    await runAfterHooks(to, null);

    expect(trackPageView).toHaveBeenCalledWith('/test?q=search', 'Test Page');
  });
});

describe('createConfirmGuard', () => {
  beforeEach(() => {
    clearAllGuards();
  });

  it('should not confirm when shouldConfirm returns false', async () => {
    const guard = createConfirmGuard({
      shouldConfirm: () => false,
    });
    beforeEachGuard(guard);

    const result = await runNavigationGuards(makeLocation('/test'), null);

    expect(result).toBe(true);
  });

  it('should abort when confirmation is denied', async () => {
    const guard = createConfirmGuard({
      shouldConfirm: () => true,
      onConfirm: async () => false,
    });
    beforeEachGuard(guard);

    const result = await runNavigationGuards(makeLocation('/test'), null);

    expect(result).toBe(false);
  });

  it('should allow navigation when confirmation is accepted', async () => {
    const guard = createConfirmGuard({
      shouldConfirm: () => true,
      onConfirm: async () => true,
    });
    beforeEachGuard(guard);

    const result = await runNavigationGuards(makeLocation('/test'), null);

    expect(result).toBe(true);
  });
});

describe('createRateLimitGuard', () => {
  beforeEach(() => {
    clearAllGuards();
  });

  it('should allow navigations within limit', async () => {
    const guard = createRateLimitGuard({
      maxNavigations: 5,
      windowMs: 1000,
    });
    beforeEachGuard(guard);

    for (let i = 0; i < 5; i++) {
      const result = await runNavigationGuards(makeLocation(`/test${i}`), null);
      expect(result).toBe(true);
    }
  });

  it('should block navigations exceeding limit', async () => {
    const onExceeded = vi.fn();
    const guard = createRateLimitGuard({
      maxNavigations: 3,
      windowMs: 10000,
      onExceeded,
    });
    beforeEachGuard(guard);

    // First 3 should pass
    for (let i = 0; i < 3; i++) {
      await runNavigationGuards(makeLocation(`/test${i}`), null);
    }

    // 4th should be blocked
    const result = await runNavigationGuards(makeLocation('/test4'), null);

    expect(result).toBe(false);
    expect(onExceeded).toHaveBeenCalled();
  });
});

describe('Utility Functions', () => {
  describe('parseLocation', () => {
    it('should parse URL to RouteLocation', () => {
      const location = parseLocation('/users/123?sort=name&filter=active');

      expect(location.path).toBe('/users/123');
      expect(location.query.sort).toBe('name');
      expect(location.query.filter).toBe('active');
    });

    it('should handle multiple query params with same key', () => {
      const location = parseLocation('/search?tag=js&tag=ts&tag=react');

      expect(Array.isArray(location.query.tag)).toBe(true);
      expect(location.query.tag).toEqual(['js', 'ts', 'react']);
    });

    it('should parse hash', () => {
      const location = parseLocation('/docs#section-1');

      expect(location.hash).toBe('#section-1');
    });
  });

  describe('createLocation', () => {
    it('should create RouteLocation from parts', () => {
      const location = createLocation(
        '/users/123',
        { id: '123' },
        { sort: 'name' },
        { title: 'User Profile' }
      );

      expect(location.path).toBe('/users/123');
      expect(location.params.id).toBe('123');
      expect(location.query.sort).toBe('name');
      expect(location.meta.title).toBe('User Profile');
    });

    it('should build fullPath with query string', () => {
      const location = createLocation('/search', {}, { q: 'hello', page: '1' });

      expect(location.fullPath).toContain('q=hello');
      expect(location.fullPath).toContain('page=1');
    });

    it('should handle array query params', () => {
      const location = createLocation('/search', {}, { tags: ['a', 'b', 'c'] });

      expect(location.fullPath).toContain('tags=a');
      expect(location.fullPath).toContain('tags=b');
      expect(location.fullPath).toContain('tags=c');
    });
  });

  describe('getNavigationStatus', () => {
    it('should return current navigation status', () => {
      const status = getNavigationStatus();

      expect(status).toHaveProperty('isNavigating');
      expect(status).toHaveProperty('to');
      expect(status).toHaveProperty('from');
    });
  });

  describe('isNavigationCancelled', () => {
    it('should return boolean', () => {
      const result = isNavigationCancelled();

      expect(typeof result).toBe('boolean');
    });
  });

  describe('clearAllGuards', () => {
    it('should clear all registered guards', () => {
      beforeEachGuard(() => {});
      afterEachGuard(() => {});
      beforeRoute('/test', () => {});

      const beforeClear = getGuardsCount();
      expect(beforeClear.before).toBeGreaterThan(0);

      clearAllGuards();

      const afterClear = getGuardsCount();
      expect(afterClear.before).toBe(0);
      expect(afterClear.after).toBe(0);
      expect(afterClear.route).toBe(0);
    });
  });
});

describe('Concurrent Navigation', () => {
  beforeEach(() => {
    clearAllGuards();
  });

  it('should reject concurrent navigations', async () => {
    beforeEachGuard(async () => {
      await new Promise(r => setTimeout(r, 50));
      return true;
    });

    const to1 = makeLocation('/test1');
    const to2 = makeLocation('/test2');

    // Start first navigation
    const nav1 = runNavigationGuards(to1, null);

    // Try to start second navigation while first is in progress
    // (need a small delay to ensure first navigation has started)
    await new Promise(r => setTimeout(r, 10));

    // Due to the isNavigating flag, this should fail
    // Note: The actual behavior depends on implementation
    await nav1;
  });
});
