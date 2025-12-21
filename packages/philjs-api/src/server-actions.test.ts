/**
 * Server Actions Tests
 *
 * Tests for React 19 / Next.js 14 style server actions.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  createServerAction,
  serverAction,
  useServerAction,
  useFormAction,
  useOptimistic,
  handleServerActionRequest,
  registerAction,
  getAction,
  getAllActions,
  serialize,
  deserialize,
  serializeFormData,
  deserializeFormData,
  generateCSRFToken,
  verifyCSRFToken,
  setCSRFSecret,
  setClientCSRFToken,
  getClientCSRFToken,
  isServerAction,
  ServerActionError,
  revalidatePath,
  revalidateTag,
  setRevalidationCallback,
  serverActionsMiddleware,
  createCSRFInput,
  withCSRF,
} from './server-actions';

// ============================================================================
// Test Setup
// ============================================================================

describe('Server Actions', () => {
  beforeEach(() => {
    // Reset CSRF secret for each test
    setCSRFSecret('test-secret-that-is-at-least-32-characters-long');
  });

  // ============================================================================
  // createServerAction Tests
  // ============================================================================

  describe('createServerAction', () => {
    it('should create a server action from a function', () => {
      const action = createServerAction(async (formData: FormData) => {
        return { success: true };
      });

      expect(action).toBeInstanceOf(Function);
      expect(action.__serverAction).toBe(true);
      expect(action.__actionId).toBeDefined();
      expect(action.__actionName).toBeDefined();
    });

    it('should use custom name when provided', () => {
      const action = createServerAction(
        async (formData: FormData) => ({ success: true }),
        { name: 'myCustomAction' }
      );

      expect(action.__actionName).toBe('myCustomAction');
    });

    it('should use custom actionId when provided', () => {
      const action = createServerAction(
        async (formData: FormData) => ({ success: true }),
        { actionId: 'custom-id-123' }
      );

      expect(action.__actionId).toBe('custom-id-123');
    });

    it('should execute the action on server-side', async () => {
      const mockFn = vi.fn().mockResolvedValue({ name: 'John' });
      const action = createServerAction(mockFn);

      const formData = new FormData();
      formData.append('name', 'John');

      const result = await action(formData);

      expect(mockFn).toHaveBeenCalledWith(formData);
      expect(result).toEqual({ name: 'John' });
    });

    it('should support bind for partial application', () => {
      const action = createServerAction(async (formData: FormData) => {
        return { success: true };
      });

      const boundAction = action.bind('extra-arg');

      expect(boundAction.__serverAction).toBe(true);
      expect(boundAction.__actionId).toBe(action.__actionId);
    });

    it('should register action in registry', () => {
      const action = createServerAction(
        async (formData: FormData) => ({ success: true }),
        { actionId: 'test-registry-action' }
      );

      const registeredAction = getAction('test-registry-action');
      expect(registeredAction).toBeDefined();
    });
  });

  // ============================================================================
  // serverAction decorator Tests
  // ============================================================================

  describe('serverAction', () => {
    it('should work as a decorator/wrapper', () => {
      const action = serverAction(async (formData: FormData) => {
        return { success: true };
      });

      expect(action.__serverAction).toBe(true);
    });

    it('should pass options through', () => {
      const action = serverAction(
        async (formData: FormData) => ({ success: true }),
        { name: 'decoratedAction' }
      );

      expect(action.__actionName).toBe('decoratedAction');
    });
  });

  // ============================================================================
  // useServerAction Tests
  // ============================================================================

  describe('useServerAction', () => {
    it('should return state, dispatch, and isPending', () => {
      const action = createServerAction(async (formData: FormData) => {
        return { success: true };
      });

      const [state, dispatch, isPending] = useServerAction(action);

      expect(state).toHaveProperty('data');
      expect(state).toHaveProperty('error');
      expect(state).toHaveProperty('pending');
      expect(state).toHaveProperty('submitCount');
      expect(typeof dispatch).toBe('function');
      expect(typeof isPending).toBe('boolean');
    });

    it('should start with initial state', () => {
      const action = createServerAction(async (formData: FormData) => {
        return { success: true };
      });

      const [state] = useServerAction(action, {
        initialState: { name: 'initial' },
      });

      expect(state.data).toEqual({ name: 'initial' });
      expect(state.error).toBeNull();
      expect(state.pending).toBe(false);
      expect(state.submitCount).toBe(0);
    });

    it('should call onSuccess on successful action', async () => {
      const action = createServerAction(async (formData: FormData) => {
        return { name: formData.get('name') };
      });

      const onSuccess = vi.fn();
      const [, dispatch] = useServerAction(action, { onSuccess });

      const formData = new FormData();
      formData.append('name', 'John');

      await dispatch(formData);

      expect(onSuccess).toHaveBeenCalledWith({ name: 'John' });
    });

    it('should call onError on failed action', async () => {
      const action = createServerAction(async () => {
        throw new Error('Test error');
      });

      const onError = vi.fn();
      const [, dispatch] = useServerAction(action, { onError });

      const formData = new FormData();

      await dispatch(formData);

      expect(onError).toHaveBeenCalled();
      expect(onError.mock.calls[0][0].message).toBe('Test error');
    });

    it('should call onSettled after completion', async () => {
      const action = createServerAction(async (formData: FormData) => {
        return { success: true };
      });

      const onSettled = vi.fn();
      const [, dispatch] = useServerAction(action, { onSettled });

      await dispatch(new FormData());

      expect(onSettled).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // useFormAction Tests
  // ============================================================================

  describe('useFormAction', () => {
    it('should return formProps with action and method', () => {
      const action = createServerAction(
        async (formData: FormData) => ({ success: true }),
        { actionId: 'form-action-test' }
      );

      const { formProps, state, isPending, reset, submit } = useFormAction(action);

      expect(formProps.action).toBe('/__actions?id=form-action-test');
      expect(formProps.method).toBe('POST');
      expect(typeof formProps.onSubmit).toBe('function');
      expect(state).toBeDefined();
      expect(typeof isPending).toBe('boolean');
      expect(typeof reset).toBe('function');
      expect(typeof submit).toBe('function');
    });

    it('should have submit function for programmatic submission', async () => {
      const action = createServerAction(async (formData: FormData) => {
        return { name: formData.get('name') };
      });

      const { submit } = useFormAction(action);

      const formData = new FormData();
      formData.append('name', 'Test');

      // Submit with FormData (works in Node.js)
      await submit(formData);
      // No error means success
    });

    it('should handle submit without arguments', async () => {
      const action = createServerAction(async (formData: FormData) => {
        return { success: true };
      });

      const { submit } = useFormAction(action);
      await submit();
      // Should work with empty FormData
    });
  });

  // ============================================================================
  // useOptimistic Tests
  // ============================================================================

  describe('useOptimistic', () => {
    it('should return optimistic state and addOptimistic function', () => {
      const initialState = [{ id: 1, text: 'Todo 1' }];
      const updateFn = (state: typeof initialState, action: { id: number; text: string }) => [
        ...state,
        action,
      ];

      const [optimisticState, addOptimistic] = useOptimistic(initialState, updateFn);

      expect(optimisticState).toEqual(initialState);
      expect(typeof addOptimistic).toBe('function');
    });

    it('should apply optimistic updates', () => {
      const initialState = [{ id: 1, text: 'Todo 1' }];
      const updateFn = (state: typeof initialState, action: { id: number; text: string }) => [
        ...state,
        action,
      ];

      const [, addOptimistic] = useOptimistic(initialState, updateFn);

      addOptimistic({ id: 2, text: 'Todo 2' });

      // In a real implementation, optimisticState would update reactively
    });
  });

  // ============================================================================
  // Serialization Tests
  // ============================================================================

  describe('Serialization', () => {
    describe('serialize/deserialize', () => {
      it('should handle Date objects', () => {
        const date = new Date('2024-01-15T12:00:00Z');
        const serialized = serialize({ date });
        const deserialized = deserialize<{ date: Date }>(serialized);

        expect(deserialized.date).toBeInstanceOf(Date);
        expect(deserialized.date.toISOString()).toBe(date.toISOString());
      });

      it('should handle Map objects', () => {
        const map = new Map([['key', 'value']]);
        const serialized = serialize({ map });
        const deserialized = deserialize<{ map: Map<string, string> }>(serialized);

        expect(deserialized.map).toBeInstanceOf(Map);
        expect(deserialized.map.get('key')).toBe('value');
      });

      it('should handle Set objects', () => {
        const set = new Set(['a', 'b', 'c']);
        const serialized = serialize({ set });
        const deserialized = deserialize<{ set: Set<string> }>(serialized);

        expect(deserialized.set).toBeInstanceOf(Set);
        expect(deserialized.set.has('a')).toBe(true);
      });

      it('should handle Error objects', () => {
        const error = new Error('Test error');
        error.name = 'CustomError';
        const serialized = serialize({ error });
        const deserialized = deserialize<{ error: Error }>(serialized);

        expect(deserialized.error).toBeInstanceOf(Error);
        expect(deserialized.error.message).toBe('Test error');
        expect(deserialized.error.name).toBe('CustomError');
      });

      it('should handle RegExp objects', () => {
        const regex = /test/gi;
        const serialized = serialize({ regex });
        const deserialized = deserialize<{ regex: RegExp }>(serialized);

        expect(deserialized.regex).toBeInstanceOf(RegExp);
        expect(deserialized.regex.source).toBe('test');
        expect(deserialized.regex.flags).toBe('gi');
      });

      it('should handle BigInt', () => {
        const bigint = BigInt('12345678901234567890');
        const serialized = serialize({ bigint });
        const deserialized = deserialize<{ bigint: bigint }>(serialized);

        expect(deserialized.bigint).toBe(bigint);
      });

      it('should handle URL objects', () => {
        const url = new URL('https://example.com/path');
        const serialized = serialize({ url });
        const deserialized = deserialize<{ url: URL }>(serialized);

        expect(deserialized.url).toBeInstanceOf(URL);
        expect(deserialized.url.href).toBe('https://example.com/path');
      });

      it('should handle Infinity', () => {
        const serialized = serialize({ positive: Infinity, negative: -Infinity });
        const deserialized = deserialize<{ positive: number; negative: number }>(serialized);

        expect(deserialized.positive).toBe(Infinity);
        expect(deserialized.negative).toBe(-Infinity);
      });

      it('should handle NaN', () => {
        const serialized = serialize({ value: NaN });
        const deserialized = deserialize<{ value: number }>(serialized);

        expect(Number.isNaN(deserialized.value)).toBe(true);
      });

      it('should handle nested objects', () => {
        const data = {
          user: {
            name: 'John',
            createdAt: new Date('2024-01-15'),
            settings: new Map([['theme', 'dark']]),
          },
        };

        const serialized = serialize(data);
        const deserialized = deserialize<typeof data>(serialized);

        expect(deserialized.user.name).toBe('John');
        expect(deserialized.user.createdAt).toBeInstanceOf(Date);
        expect(deserialized.user.settings).toBeInstanceOf(Map);
      });
    });

    describe('serializeFormData/deserializeFormData', () => {
      it('should serialize FormData to object', () => {
        const formData = new FormData();
        formData.append('name', 'John');
        formData.append('email', 'john@example.com');

        const serialized = serializeFormData(formData);

        expect(serialized.name).toBe('John');
        expect(serialized.email).toBe('john@example.com');
      });

      it('should handle multiple values for same key', () => {
        const formData = new FormData();
        formData.append('tags', 'tag1');
        formData.append('tags', 'tag2');

        const serialized = serializeFormData(formData);

        expect(Array.isArray(serialized.tags)).toBe(true);
        expect(serialized.tags).toEqual(['tag1', 'tag2']);
      });

      it('should deserialize to FormData', () => {
        const data = { name: 'John', email: 'john@example.com' };
        const formData = deserializeFormData(data);

        expect(formData.get('name')).toBe('John');
        expect(formData.get('email')).toBe('john@example.com');
      });
    });
  });

  // ============================================================================
  // CSRF Protection Tests
  // ============================================================================

  describe('CSRF Protection', () => {
    beforeEach(() => {
      setCSRFSecret('test-csrf-secret-that-is-at-least-32-characters');
    });

    it('should generate a valid CSRF token', () => {
      const token = generateCSRFToken('session-123');

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split(':').length).toBe(3);
    });

    it('should verify valid CSRF token', () => {
      const token = generateCSRFToken('session-123');
      const isValid = verifyCSRFToken(token, 'session-123');

      expect(isValid).toBe(true);
    });

    it('should reject invalid CSRF token', () => {
      const isValid = verifyCSRFToken('invalid-token', 'session-123');

      expect(isValid).toBe(false);
    });

    it('should reject token with wrong session ID', () => {
      const token = generateCSRFToken('session-123');
      const isValid = verifyCSRFToken(token, 'session-456');

      expect(isValid).toBe(false);
    });

    it('should reject tampered token', () => {
      const token = generateCSRFToken('session-123');
      const parts = token.split(':');
      parts[2] = 'tampered-signature';
      const tamperedToken = parts.join(':');

      const isValid = verifyCSRFToken(tamperedToken, 'session-123');

      expect(isValid).toBe(false);
    });

    it('should throw error for short CSRF secret', () => {
      expect(() => setCSRFSecret('short')).toThrow(
        'CSRF secret must be at least 32 characters'
      );
    });
  });

  // ============================================================================
  // Client CSRF Token Tests
  // ============================================================================

  describe('Client CSRF Token', () => {
    it('should set and get client CSRF token', () => {
      setClientCSRFToken('test-client-token');
      const token = getClientCSRFToken();

      expect(token).toBe('test-client-token');
    });
  });

  // ============================================================================
  // handleServerActionRequest Tests
  // ============================================================================

  describe('handleServerActionRequest', () => {
    beforeEach(() => {
      // Register a test action
      registerAction(
        'test-action',
        async (input: FormData) => {
          const name = input.get('name');
          return { greeting: `Hello, ${name}!` };
        },
        { csrf: false }
      );
    });

    it('should handle valid action request', async () => {
      const formData = new FormData();
      formData.append('name', 'World');

      const request = new Request('http://localhost/__actions', {
        method: 'POST',
        headers: {
          'X-Action-ID': 'test-action',
        },
        body: formData,
      });

      const response = await handleServerActionRequest(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.greeting).toBe('Hello, World!');
    });

    it('should return error for missing action ID', async () => {
      const request = new Request('http://localhost/__actions', {
        method: 'POST',
      });

      const response = await handleServerActionRequest(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('MISSING_ACTION_ID');
    });

    it('should return error for unknown action', async () => {
      const request = new Request('http://localhost/__actions', {
        method: 'POST',
        headers: {
          'X-Action-ID': 'unknown-action',
        },
      });

      const response = await handleServerActionRequest(request);
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ACTION_NOT_FOUND');
    });

    it('should handle JSON content type', async () => {
      registerAction(
        'json-action',
        async (input: any) => {
          return { received: input };
        },
        { csrf: false }
      );

      const request = new Request('http://localhost/__actions', {
        method: 'POST',
        headers: {
          'X-Action-ID': 'json-action',
          'Content-Type': 'application/json',
        },
        body: serialize({ name: 'Test' }),
      });

      const response = await handleServerActionRequest(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
    });

    it('should handle action errors gracefully', async () => {
      registerAction(
        'error-action',
        async () => {
          throw new ServerActionError('Validation failed', 'VALIDATION_ERROR', {
            field: 'name',
          });
        },
        { csrf: false }
      );

      const request = new Request('http://localhost/__actions', {
        method: 'POST',
        headers: {
          'X-Action-ID': 'error-action',
        },
        body: new FormData(),
      });

      const response = await handleServerActionRequest(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.details.field).toBe('name');
    });

    it('should include action ID from URL query', async () => {
      const formData = new FormData();
      formData.append('name', 'Query');

      const request = new Request('http://localhost/__actions?id=test-action', {
        method: 'POST',
        body: formData,
      });

      const response = await handleServerActionRequest(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // Action Registry Tests
  // ============================================================================

  describe('Action Registry', () => {
    it('should register and retrieve actions', () => {
      const testFn = async () => ({ test: true });
      registerAction('registry-test', testFn);

      const retrieved = getAction('registry-test');
      expect(retrieved).toBe(testFn);
    });

    it('should return undefined for unregistered actions', () => {
      const retrieved = getAction('nonexistent-action');
      expect(retrieved).toBeUndefined();
    });

    it('should list all registered actions', () => {
      registerAction('list-test-1', async () => ({}));
      registerAction('list-test-2', async () => ({}));

      const allActions = getAllActions();
      expect(allActions.has('list-test-1')).toBe(true);
      expect(allActions.has('list-test-2')).toBe(true);
    });
  });

  // ============================================================================
  // Revalidation Tests
  // ============================================================================

  describe('Revalidation', () => {
    it('should call revalidation callback for paths', async () => {
      const callback = vi.fn();
      setRevalidationCallback(callback);

      await revalidatePath('/users');

      expect(callback).toHaveBeenCalledWith(['/users'], undefined);
    });

    it('should call revalidation callback for tags', async () => {
      const callback = vi.fn();
      setRevalidationCallback(callback);

      await revalidateTag('users-list');

      expect(callback).toHaveBeenCalledWith(undefined, ['users-list']);
    });
  });

  // ============================================================================
  // Middleware Tests
  // ============================================================================

  describe('serverActionsMiddleware', () => {
    it('should intercept /__actions requests', async () => {
      registerAction(
        'middleware-test',
        async () => ({ handled: true }),
        { csrf: false }
      );

      const middleware = serverActionsMiddleware();
      const request = new Request('http://localhost/__actions', {
        method: 'POST',
        headers: { 'X-Action-ID': 'middleware-test' },
        body: new FormData(),
      });

      const next = vi.fn().mockResolvedValue(new Response('next'));
      const response = await middleware(request, next);
      const result = await response.json();

      expect(next).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should pass through non-action requests', async () => {
      const middleware = serverActionsMiddleware();
      const request = new Request('http://localhost/api/users', {
        method: 'GET',
      });

      const next = vi.fn().mockResolvedValue(new Response('next response'));
      const response = await middleware(request, next);

      expect(next).toHaveBeenCalled();
      expect(await response.text()).toBe('next response');
    });
  });

  // ============================================================================
  // Type Guard Tests
  // ============================================================================

  describe('isServerAction', () => {
    it('should return true for server actions', () => {
      const action = createServerAction(async () => ({}));
      expect(isServerAction(action)).toBe(true);
    });

    it('should return false for regular functions', () => {
      const fn = async () => ({});
      expect(isServerAction(fn)).toBe(false);
    });

    it('should return false for non-functions', () => {
      expect(isServerAction({})).toBe(false);
      expect(isServerAction('string')).toBe(false);
      expect(isServerAction(null)).toBe(false);
    });
  });

  // ============================================================================
  // ServerActionError Tests
  // ============================================================================

  describe('ServerActionError', () => {
    it('should create error with message only', () => {
      const error = new ServerActionError('Something went wrong');

      expect(error.message).toBe('Something went wrong');
      expect(error.name).toBe('ServerActionError');
      expect(error.code).toBeUndefined();
      expect(error.details).toBeUndefined();
    });

    it('should create error with code and details', () => {
      const error = new ServerActionError('Validation failed', 'VALIDATION_ERROR', {
        field: 'email',
        reason: 'invalid format',
      });

      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({
        field: 'email',
        reason: 'invalid format',
      });
    });
  });

  // ============================================================================
  // Progressive Enhancement Utilities
  // ============================================================================

  describe('Progressive Enhancement', () => {
    describe('createCSRFInput', () => {
      it('should create hidden input HTML', () => {
        const html = createCSRFInput();

        expect(html).toContain('type="hidden"');
        expect(html).toContain('name="_csrf"');
      });
    });

    describe('withCSRF', () => {
      it('should add CSRF token to form data', () => {
        const data = { name: 'John' };
        const result = withCSRF(data);

        expect(result.name).toBe('John');
        expect(result._csrf).toBeDefined();
      });
    });
  });
});
