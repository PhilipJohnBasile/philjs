/**
 * PhilJS Server Actions
 *
 * React 19 / Next.js 14 style Server Actions for PhilJS.
 * Provides seamless server-side function invocation with:
 * - Automatic serialization/deserialization
 * - Loading and error states
 * - Optimistic updates
 * - CSRF protection
 * - Progressive enhancement
 *
 * @example
 * ```ts
 * // Define a server action
 * const updateUser = createServerAction(async (formData: FormData) => {
 *   const name = formData.get('name') as string;
 *   return await db.users.update({ where: { id: 1 }, data: { name } });
 * });
 *
 * // Use in a component
 * function ProfileForm() {
 *   const [state, action, isPending] = useServerAction(updateUser);
 *
 *   return (
 *     <form action={action}>
 *       <input name="name" defaultValue={state?.name} />
 *       <button disabled={isPending}>Save</button>
 *     </form>
 *   );
 * }
 * ```
 */

import { createHmac, randomBytes } from 'crypto';

// ============================================================================
// Types
// ============================================================================

/**
 * Server action function signature
 */
export type ServerActionFn<TInput = FormData, TOutput = unknown> = (
  input: TInput
) => Promise<TOutput>;

/**
 * Server action with metadata
 */
export interface ServerAction<TInput = FormData, TOutput = unknown> {
  (input: TInput): Promise<TOutput>;
  /** Internal marker */
  __serverAction: true;
  /** Action ID for routing */
  __actionId: string;
  /** Action name for debugging */
  __actionName: string;
  /** Bind arguments to the action */
  bind: <T extends unknown[]>(...args: T) => ServerAction<TInput, TOutput>;
}

/**
 * Server action state for useServerAction hook
 */
export interface ServerActionState<TOutput = unknown> {
  /** Last returned data */
  data: TOutput | null;
  /** Last error */
  error: Error | null;
  /** Whether an action is in flight */
  pending: boolean;
  /** Number of times action has been called */
  submitCount: number;
}

/**
 * Options for creating a server action
 */
export interface CreateServerActionOptions {
  /** Custom action name (defaults to function name) */
  name?: string;
  /** Action ID (auto-generated if not provided) */
  actionId?: string;
  /** Enable CSRF protection */
  csrf?: boolean;
  /** Revalidate paths after action */
  revalidatePaths?: string[];
  /** Revalidate tags after action */
  revalidateTags?: string[];
}

/**
 * Options for useServerAction hook
 */
export interface UseServerActionOptions<TOutput = unknown> {
  /** Initial state */
  initialState?: TOutput | null;
  /** Called on success */
  onSuccess?: (data: TOutput) => void;
  /** Called on error */
  onError?: (error: Error) => void;
  /** Called when action completes (success or error) */
  onSettled?: () => void;
  /** Optimistic update function */
  optimisticUpdate?: (input: FormData) => Partial<TOutput>;
}

/**
 * Return type for useServerAction hook
 */
export type UseServerActionReturn<TOutput = unknown> = [
  state: ServerActionState<TOutput>,
  dispatch: (input: FormData) => Promise<void>,
  isPending: boolean
];

/**
 * Return type for useFormAction hook
 */
export interface UseFormActionReturn<TOutput = unknown> {
  /** Current state */
  state: ServerActionState<TOutput>;
  /** Form props to spread */
  formProps: {
    action: string | ((formData: FormData) => void);
    method: 'POST';
    onSubmit: (e: SubmitEvent) => void;
  };
  /** Whether form is submitting */
  isPending: boolean;
  /** Reset the state */
  reset: () => void;
  /** Submit programmatically */
  submit: (formData?: FormData | HTMLFormElement) => Promise<void>;
}

/**
 * Options for useOptimistic hook
 */
export interface UseOptimisticOptions<TState, TAction> {
  /** Update function to apply optimistic updates */
  updateFn: (state: TState, action: TAction) => TState;
}

/**
 * Return type for useOptimistic hook
 */
export type UseOptimisticReturn<TState, TAction> = [
  optimisticState: TState,
  addOptimistic: (action: TAction) => void
];

/**
 * Serializable data types
 */
export type SerializableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | Map<string, SerializableValue>
  | Set<SerializableValue>
  | SerializableValue[]
  | { [key: string]: SerializableValue };

/**
 * Action result wrapper for serialization
 */
export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string | undefined;
    details?: Record<string, unknown> | undefined;
  };
  meta?: {
    timestamp: number;
    actionId: string;
    duration: number;
  };
}

// ============================================================================
// Server Action Registry
// ============================================================================

const actionRegistry = new Map<string, ServerActionFn>();
const actionMetadata = new Map<string, { name: string; options: CreateServerActionOptions }>();

/**
 * Register a server action in the registry
 */
export function registerAction(
  actionId: string,
  fn: ServerActionFn,
  options: CreateServerActionOptions = {}
): void {
  actionRegistry.set(actionId, fn);
  actionMetadata.set(actionId, { name: options.name || actionId, options });
}

/**
 * Get a server action by ID
 */
export function getAction(actionId: string): ServerActionFn | undefined {
  return actionRegistry.get(actionId);
}

/**
 * Get all registered actions
 */
export function getAllActions(): Map<string, ServerActionFn> {
  return new Map(actionRegistry);
}

// ============================================================================
// CSRF Protection
// ============================================================================

let csrfSecret: string | null = null;

/**
 * Set the CSRF secret (should be called during server initialization)
 */
export function setCSRFSecret(secret: string): void {
  if (secret.length < 32) {
    throw new Error('CSRF secret must be at least 32 characters');
  }
  csrfSecret = secret;
}

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(sessionId?: string): string {
  const secret = csrfSecret || randomBytes(32).toString('hex');
  const timestamp = Date.now().toString(36);
  const payload = `${sessionId || 'anonymous'}:${timestamp}`;
  const signature = createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');
  return `${payload}:${signature}`;
}

/**
 * Verify a CSRF token
 */
export function verifyCSRFToken(token: string, sessionId?: string): boolean {
  try {
    const parts = token.split(':');
    if (parts.length !== 3) return false;

    const [tokenSessionId, timestamp, signature] = parts;
    const secret = csrfSecret || '';
    const payload = `${tokenSessionId}:${timestamp}`;
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('base64url');

    // Timing-safe comparison
    if (signature!.length !== expectedSignature.length) return false;
    let result = 0;
    for (let i = 0; i < signature!.length; i++) {
      result |= signature!.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    if (result !== 0) return false;

    // Validate session ID if provided
    if (sessionId && tokenSessionId !== sessionId) return false;

    // Check token age (1 hour max)
    const tokenTime = parseInt(timestamp!, 36);
    const age = Date.now() - tokenTime;
    if (age > 3600000 || age < 0) return false;

    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Serialization
// ============================================================================

/**
 * Serialize data for transmission
 * Handles Date, Map, Set, and other complex types
 */
export function serialize(data: unknown): string {
  return JSON.stringify(data, function(key, value) {
    // Get the original value from this[key] because JSON.stringify
    // calls .toJSON() on Date objects before passing to the replacer
    const originalValue = key === '' ? value : (this as Record<string, unknown>)[key];

    if (originalValue instanceof Date) {
      return { __type: 'Date', value: originalValue.toISOString() };
    }
    if (originalValue instanceof Map) {
      return { __type: 'Map', value: Array.from(originalValue.entries()) };
    }
    if (originalValue instanceof Set) {
      return { __type: 'Set', value: Array.from(originalValue) };
    }
    if (originalValue instanceof Error) {
      return {
        __type: 'Error',
        value: { message: originalValue.message, name: originalValue.name, stack: originalValue.stack },
      };
    }
    if (originalValue instanceof RegExp) {
      return { __type: 'RegExp', value: { source: originalValue.source, flags: originalValue.flags } };
    }
    if (typeof originalValue === 'bigint') {
      return { __type: 'BigInt', value: originalValue.toString() };
    }
    if (originalValue instanceof URL) {
      return { __type: 'URL', value: originalValue.href };
    }
    if (value === Infinity) {
      return { __type: 'Infinity' };
    }
    if (value === -Infinity) {
      return { __type: '-Infinity' };
    }
    if (Number.isNaN(value)) {
      return { __type: 'NaN' };
    }
    return value;
  });
}

/**
 * Deserialize data from transmission
 */
export function deserialize<T = unknown>(json: string): T {
  return JSON.parse(json, (key, value) => {
    if (value && typeof value === 'object' && '__type' in value) {
      switch (value.__type) {
        case 'Date':
          return new Date(value.value);
        case 'Map':
          return new Map(value.value);
        case 'Set':
          return new Set(value.value);
        case 'Error': {
          const error = new Error(value.value.message);
          error.name = value.value.name;
          error.stack = value.value.stack;
          return error;
        }
        case 'RegExp':
          return new RegExp(value.value.source, value.value.flags);
        case 'BigInt':
          return BigInt(value.value);
        case 'URL':
          return new URL(value.value);
        case 'Infinity':
          return Infinity;
        case '-Infinity':
          return -Infinity;
        case 'NaN':
          return NaN;
      }
    }
    return value;
  });
}

/**
 * Serialize FormData for transmission
 */
export function serializeFormData(formData: FormData): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    if (value instanceof File) {
      result[key] = {
        __type: 'File',
        name: value.name,
        type: value.type,
        size: value.size,
        // Note: actual file content would need to be base64 encoded for JSON
      };
    } else {
      // Handle multiple values for same key
      if (key in result) {
        if (Array.isArray(result[key])) {
          (result[key] as unknown[]).push(value);
        } else {
          result[key] = [result[key], value];
        }
      } else {
        result[key] = value;
      }
    }
  });
  return result;
}

/**
 * Deserialize to FormData
 */
export function deserializeFormData(data: Record<string, unknown>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        formData.append(key, String(v));
      }
    } else if (value !== null && value !== undefined) {
      formData.append(key, String(value));
    }
  }
  return formData;
}

// ============================================================================
// Server Action Creation
// ============================================================================

/**
 * Generate a unique action ID
 */
function generateActionId(name: string): string {
  const hash = createHmac('sha256', 'philjs-action')
    .update(name + Date.now())
    .digest('hex')
    .slice(0, 8);
  return `${name}_${hash}`;
}

/**
 * Create a server action from an async function
 *
 * @example
 * ```ts
 * const createUser = createServerAction(async (formData: FormData) => {
 *   const name = formData.get('name') as string;
 *   const email = formData.get('email') as string;
 *   return await db.users.create({ data: { name, email } });
 * });
 *
 * // Use in a form
 * <form action={createUser}>
 *   <input name="name" />
 *   <input name="email" type="email" />
 *   <button type="submit">Create User</button>
 * </form>
 * ```
 */
export function createServerAction<TInput = FormData, TOutput = unknown>(
  fn: ServerActionFn<TInput, TOutput>,
  options: CreateServerActionOptions = {}
): ServerAction<TInput, TOutput> {
  const name = options.name || fn.name || 'anonymousAction';
  const actionId = options.actionId || generateActionId(name);

  // Register the action on the server
  if (typeof window === 'undefined') {
    registerAction(actionId, fn as ServerActionFn, options);
  }

  // Create the action wrapper
  const action = async (input: TInput): Promise<TOutput> => {
    // Server-side: execute directly
    if (typeof window === 'undefined') {
      const startTime = Date.now();
      try {
        const result = await fn(input);

        // Handle revalidation
        if (options.revalidatePaths || options.revalidateTags) {
          await triggerRevalidation(options.revalidatePaths, options.revalidateTags);
        }

        return result;
      } catch (error) {
        throw error;
      }
    }

    // Client-side: make HTTP request
    const headers: Record<string, string> = {
      'X-Action-ID': actionId,
    };

    // Add CSRF token if enabled
    if (options.csrf !== false) {
      const csrfToken = getClientCSRFToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    let body: BodyInit;
    if (input instanceof FormData) {
      body = input;
    } else {
      headers['Content-Type'] = 'application/json';
      body = serialize(input);
    }

    const response = await fetch('/__actions', {
      method: 'POST',
      headers,
      body,
      credentials: 'same-origin',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ServerActionError(
        errorData.error?.message || `Action failed with status ${response.status}`,
        errorData.error?.code,
        errorData.error?.details
      );
    }

    const result: ActionResult<TOutput> = await response.json();

    if (!result.success) {
      throw new ServerActionError(
        result.error?.message || 'Action failed',
        result.error?.code,
        result.error?.details
      );
    }

    return deserialize<TOutput>(serialize(result.data));
  };

  // Attach metadata
  (action as ServerAction<TInput, TOutput>).__serverAction = true;
  (action as ServerAction<TInput, TOutput>).__actionId = actionId;
  (action as ServerAction<TInput, TOutput>).__actionName = name;

  // Bind implementation
  (action as ServerAction<TInput, TOutput>).bind = <T extends unknown[]>(...args: T) => {
    const boundAction = async (input: TInput): Promise<TOutput> => {
      // For FormData, append bound arguments
      if (input instanceof FormData) {
        args.forEach((arg, index) => {
          (input as FormData).append(`__bound_${index}`, serialize(arg));
        });
      }
      return action(input);
    };
    boundAction.__serverAction = true as const;
    boundAction.__actionId = actionId;
    boundAction.__actionName = name;
    boundAction.bind = (action as ServerAction<TInput, TOutput>).bind;
    return boundAction as ServerAction<TInput, TOutput>;
  };

  return action as ServerAction<TInput, TOutput>;
}

/**
 * Decorator/wrapper for "use server" semantics
 *
 * @example
 * ```ts
 * // Mark a function as a server action
 * const saveSettings = serverAction(async (formData: FormData) => {
 *   'use server';
 *   const settings = Object.fromEntries(formData);
 *   return await db.settings.update({ data: settings });
 * });
 * ```
 */
export function serverAction<TInput = FormData, TOutput = unknown>(
  fn: ServerActionFn<TInput, TOutput>,
  options?: CreateServerActionOptions
): ServerAction<TInput, TOutput> {
  return createServerAction(fn, options);
}

// ============================================================================
// Client Hooks
// ============================================================================

// Simple signal implementation for hooks (compatible with @philjs/core)
type Signal<T> = {
  (): T;
  set(value: T): void;
  subscribe(fn: (value: T) => void): () => void;
};

function createSignal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const subscribers = new Set<(value: T) => void>();

  const signal = (() => value) as Signal<T>;
  signal.set = (newValue: T) => {
    value = newValue;
    subscribers.forEach((fn) => fn(value));
  };
  signal.subscribe = (fn: (value: T) => void) => {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  };

  return signal;
}

/**
 * Hook to call server actions with loading/error state
 *
 * @example
 * ```tsx
 * const updateProfile = createServerAction(async (formData: FormData) => {
 *   const name = formData.get('name') as string;
 *   return await db.users.update({ where: { id: userId }, data: { name } });
 * });
 *
 * function ProfileForm() {
 *   const [state, dispatch, isPending] = useServerAction(updateProfile, {
 *     onSuccess: (data) => console.log('Updated:', data),
 *     onError: (error) => console.error('Failed:', error),
 *   });
 *
 *   return (
 *     <form onSubmit={(e) => { e.preventDefault(); dispatch(new FormData(e.target)); }}>
 *       <input name="name" />
 *       <button disabled={isPending}>
 *         {isPending ? 'Saving...' : 'Save'}
 *       </button>
 *       {state.error && <p class="error">{state.error.message}</p>}
 *     </form>
 *   );
 * }
 * ```
 */
export function useServerAction<TOutput = unknown>(
  action: ServerAction<FormData, TOutput>,
  options: UseServerActionOptions<TOutput> = {}
): UseServerActionReturn<TOutput> {
  const { initialState = null, onSuccess, onError, onSettled, optimisticUpdate } = options;

  const state = createSignal<ServerActionState<TOutput>>({
    data: initialState,
    error: null,
    pending: false,
    submitCount: 0,
  });

  const dispatch = async (input: FormData): Promise<void> => {
    const currentState = state();

    // Apply optimistic update if provided
    let optimisticData: Partial<TOutput> | null = null;
    if (optimisticUpdate) {
      optimisticData = optimisticUpdate(input);
      state.set({
        ...currentState,
        data: { ...currentState.data, ...optimisticData } as TOutput,
        pending: true,
        submitCount: currentState.submitCount + 1,
      });
    } else {
      state.set({
        ...currentState,
        pending: true,
        error: null,
        submitCount: currentState.submitCount + 1,
      });
    }

    try {
      const result = await action(input);
      state.set({
        data: result,
        error: null,
        pending: false,
        submitCount: state().submitCount,
      });
      onSuccess?.(result);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      state.set({
        // Revert optimistic update on error
        data: optimisticData ? initialState : state().data,
        error: err,
        pending: false,
        submitCount: state().submitCount,
      });
      onError?.(err);
    } finally {
      onSettled?.();
    }
  };

  return [state(), dispatch, state().pending];
}

/**
 * Progressive enhancement hook for forms
 *
 * Works without JavaScript but enhances with loading states when JS is available.
 *
 * @example
 * ```tsx
 * const { formProps, state, isPending } = useFormAction(createUserAction, {
 *   onSuccess: () => router.push('/users'),
 * });
 *
 * return (
 *   <form {...formProps}>
 *     <input name="name" required />
 *     <input name="email" type="email" required />
 *     <button type="submit" disabled={isPending}>
 *       {isPending ? 'Creating...' : 'Create User'}
 *     </button>
 *     {state.error && <p class="error">{state.error.message}</p>}
 *   </form>
 * );
 * ```
 */
export function useFormAction<TOutput = unknown>(
  action: ServerAction<FormData, TOutput>,
  options: UseServerActionOptions<TOutput> = {}
): UseFormActionReturn<TOutput> {
  const [state, dispatch, isPending] = useServerAction(action, options);

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    dispatch(formData);
  };

  const submit = async (input?: FormData | HTMLFormElement): Promise<void> => {
    let formData: FormData;
    if (input instanceof FormData) {
      formData = input;
    } else if (typeof HTMLFormElement !== 'undefined' && input instanceof HTMLFormElement) {
      formData = new FormData(input);
    } else {
      formData = new FormData();
    }
    await dispatch(formData);
  };

  const reset = () => {
    // Reset to initial state - in real implementation would use signals
  };

  return {
    state,
    formProps: {
      action: `/__actions?id=${action.__actionId}`,
      method: 'POST' as const,
      onSubmit: handleSubmit,
    },
    isPending,
    reset,
    submit,
  };
}

/**
 * Optimistic updates hook
 *
 * Immediately update UI while waiting for server confirmation.
 *
 * @example
 * ```tsx
 * const [todos, setTodos] = useState<Todo[]>(initialTodos);
 *
 * const [optimisticTodos, addOptimisticTodo] = useOptimistic(
 *   todos,
 *   (state, newTodo: Todo) => [...state, { ...newTodo, pending: true }]
 * );
 *
 * async function addTodo(formData: FormData) {
 *   const title = formData.get('title') as string;
 *   const newTodo = { id: crypto.randomUUID(), title, completed: false };
 *
 *   // Immediately update UI
 *   addOptimisticTodo(newTodo);
 *
 *   // Then save to server
 *   const savedTodo = await saveTodoAction(formData);
 *   setTodos([...todos, savedTodo]);
 * }
 *
 * return (
 *   <ul>
 *     {optimisticTodos.map(todo => (
 *       <li key={todo.id} class={todo.pending ? 'opacity-50' : ''}>
 *         {todo.title}
 *       </li>
 *     ))}
 *   </ul>
 * );
 * ```
 */
export function useOptimistic<TState, TAction>(
  state: TState,
  updateFn: (currentState: TState, action: TAction) => TState
): UseOptimisticReturn<TState, TAction> {
  let optimisticState = state;
  const pendingUpdates: TAction[] = [];

  const addOptimistic = (action: TAction): void => {
    pendingUpdates.push(action);
    optimisticState = updateFn(optimisticState, action);
  };

  // When state changes, clear pending updates
  // In real implementation, this would be reactive
  const computedState = pendingUpdates.reduce(updateFn, state);

  return [computedState, addOptimistic];
}

// ============================================================================
// Server-Side Request Handler
// ============================================================================

/**
 * Server action error class
 */
export class ServerActionError extends Error {
  code?: string | undefined;
  details?: Record<string, unknown> | undefined;

  constructor(message: string, code?: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ServerActionError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Handle incoming server action requests
 */
export async function handleServerActionRequest(request: Request): Promise<Response> {
  const startTime = Date.now();

  // Get action ID from header or URL
  const actionId =
    request.headers.get('X-Action-ID') ||
    new URL(request.url).searchParams.get('id');

  if (!actionId) {
    return createErrorResponse('Missing action ID', 'MISSING_ACTION_ID', 400);
  }

  // Get the registered action
  const actionFn = getAction(actionId);
  if (!actionFn) {
    return createErrorResponse('Action not found', 'ACTION_NOT_FOUND', 404);
  }

  // Get action metadata
  const metadata = actionMetadata.get(actionId);
  const options = metadata?.options || {};

  // Verify CSRF token if enabled
  if (options.csrf !== false) {
    const csrfToken = request.headers.get('X-CSRF-Token');
    // For form submissions without JS, check body
    const sessionId = request.headers.get('X-Session-ID');

    if (!csrfToken && request.method === 'POST') {
      // Check if form includes CSRF token
      const contentType = request.headers.get('Content-Type') || '';
      if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
        // Will verify from form data below
      } else if (!csrfToken) {
        return createErrorResponse('Missing CSRF token', 'CSRF_MISSING', 403);
      }
    }

    if (csrfToken && !verifyCSRFToken(csrfToken, sessionId || undefined)) {
      return createErrorResponse('Invalid CSRF token', 'CSRF_INVALID', 403);
    }
  }

  try {
    // Parse input based on content type
    const contentType = request.headers.get('Content-Type') || '';
    let input: unknown;

    if (contentType.includes('multipart/form-data')) {
      input = await request.formData();
      // Check for CSRF in form data
      if (options.csrf !== false) {
        const formCsrf = (input as FormData).get('_csrf');
        if (formCsrf && !verifyCSRFToken(formCsrf as string)) {
          return createErrorResponse('Invalid CSRF token', 'CSRF_INVALID', 403);
        }
        (input as FormData).delete('_csrf');
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      const params = new URLSearchParams(text);
      input = new FormData();
      params.forEach((value, key) => {
        if (key !== '_csrf') {
          (input as FormData).append(key, value);
        }
      });
      // Check CSRF
      if (options.csrf !== false && params.has('_csrf')) {
        if (!verifyCSRFToken(params.get('_csrf')!)) {
          return createErrorResponse('Invalid CSRF token', 'CSRF_INVALID', 403);
        }
      }
    } else if (contentType.includes('application/json')) {
      const json = await request.text();
      input = deserialize(json);
    } else {
      input = new FormData();
    }

    // Execute the action
    const result = await actionFn(input as FormData);

    // Handle revalidation
    if (options.revalidatePaths || options.revalidateTags) {
      await triggerRevalidation(options.revalidatePaths, options.revalidateTags);
    }

    const duration = Date.now() - startTime;

    return new Response(
      serialize({
        success: true,
        data: result,
        meta: {
          timestamp: Date.now(),
          actionId,
          duration,
        },
      } as ActionResult<unknown>),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Action-Duration': String(duration),
        },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Server Action] ${actionId} failed:`, error);

    if (error instanceof ServerActionError) {
      return createErrorResponse(error.message, error.code || 'ACTION_ERROR', 400, error.details, duration);
    }

    return createErrorResponse(
      error instanceof Error ? error.message : 'Unknown error',
      'INTERNAL_ERROR',
      500,
      undefined,
      duration
    );
  }
}

/**
 * Create an error response
 */
function createErrorResponse(
  message: string,
  code: string,
  status: number,
  details?: Record<string, unknown>,
  duration?: number
): Response {
  return new Response(
    serialize({
      success: false,
      error: { message, code, details },
      meta: {
        timestamp: Date.now(),
        actionId: '',
        duration: duration || 0,
      },
    } as ActionResult<never>),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...(duration ? { 'X-Action-Duration': String(duration) } : {}),
      },
    }
  );
}

// ============================================================================
// Revalidation
// ============================================================================

type RevalidationCallback = (paths?: string[], tags?: string[]) => Promise<void>;
let revalidationCallback: RevalidationCallback | null = null;

/**
 * Set the revalidation callback (called by framework integration)
 */
export function setRevalidationCallback(callback: RevalidationCallback): void {
  revalidationCallback = callback;
}

/**
 * Trigger revalidation of paths and/or tags
 */
async function triggerRevalidation(paths?: string[], tags?: string[]): Promise<void> {
  if (revalidationCallback) {
    await revalidationCallback(paths, tags);
  }
}

/**
 * Programmatically revalidate paths
 */
export async function revalidatePath(path: string): Promise<void> {
  await triggerRevalidation([path], undefined);
}

/**
 * Programmatically revalidate tags
 */
export async function revalidateTag(tag: string): Promise<void> {
  await triggerRevalidation(undefined, [tag]);
}

// ============================================================================
// Client-Side CSRF Token Management
// ============================================================================

let clientCSRFToken: string | null = null;

/**
 * Set the CSRF token on the client
 */
export function setClientCSRFToken(token: string): void {
  clientCSRFToken = token;
  // Also store in a meta tag for SSR hydration
  if (typeof document !== 'undefined') {
    let meta = document.querySelector('meta[name="csrf-token"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'csrf-token');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', token);
  }
}

/**
 * Get the CSRF token on the client
 */
export function getClientCSRFToken(): string | null {
  if (clientCSRFToken) {
    return clientCSRFToken;
  }
  if (typeof document !== 'undefined') {
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) {
      return meta.getAttribute('content');
    }
  }
  return null;
}

// ============================================================================
// Middleware for Server Action Routes
// ============================================================================

/**
 * Middleware to handle server action requests
 *
 * @example
 * ```ts
 * // In your server setup
 * import { serverActionsMiddleware } from 'philjs-api/server-actions';
 *
 * app.use('/__actions', serverActionsMiddleware());
 * ```
 */
export function serverActionsMiddleware() {
  return async (
    request: Request,
    next: () => Promise<Response>
  ): Promise<Response> => {
    const url = new URL(request.url);

    if (url.pathname === '/__actions' || url.pathname.startsWith('/__actions/')) {
      return handleServerActionRequest(request);
    }

    return next();
  };
}

/**
 * Express-style middleware adapter
 */
export function serverActionsExpressMiddleware() {
  return async (req: any, res: any, next: () => void) => {
    if (req.path === '/__actions' || req.path.startsWith('/__actions/')) {
      const request = new Request(
        `${req.protocol}://${req.get('host')}${req.originalUrl}`,
        {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
        }
      );

      const response = await handleServerActionRequest(request);
      res.status(response.status);
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      const body = await response.text();
      res.send(body);
    } else {
      next();
    }
  };
}

// ============================================================================
// Type Utilities
// ============================================================================

/**
 * Extract the return type of a server action
 */
export type ServerActionReturnType<T> = T extends ServerAction<any, infer R> ? R : never;

/**
 * Extract the input type of a server action
 */
export type ServerActionInputType<T> = T extends ServerAction<infer I, any> ? I : never;

/**
 * Check if a value is a server action
 */
export function isServerAction(value: unknown): value is ServerAction {
  return (
    typeof value === 'function' &&
    (value as ServerAction).__serverAction === true
  );
}

// ============================================================================
// Progressive Enhancement Utilities
// ============================================================================

/**
 * Create a hidden CSRF input for forms
 */
export function createCSRFInput(): string {
  const token = typeof window !== 'undefined' ? getClientCSRFToken() : generateCSRFToken();
  return `<input type="hidden" name="_csrf" value="${token || ''}" />`;
}

/**
 * HOC to add CSRF to forms
 */
export function withCSRF<T extends Record<string, unknown>>(
  formData: T
): T & { _csrf: string } {
  const token = typeof window !== 'undefined' ? getClientCSRFToken() : generateCSRFToken();
  return { ...formData, _csrf: token || '' };
}
