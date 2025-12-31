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
/**
 * Server action function signature
 */
export type ServerActionFn<TInput = FormData, TOutput = unknown> = (input: TInput) => Promise<TOutput>;
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
export type SerializableValue = string | number | boolean | null | undefined | Date | Map<string, SerializableValue> | Set<SerializableValue> | SerializableValue[] | {
    [key: string]: SerializableValue;
};
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
/**
 * Register a server action in the registry
 */
export declare function registerAction(actionId: string, fn: ServerActionFn, options?: CreateServerActionOptions): void;
/**
 * Get a server action by ID
 */
export declare function getAction(actionId: string): ServerActionFn | undefined;
/**
 * Get all registered actions
 */
export declare function getAllActions(): Map<string, ServerActionFn>;
/**
 * Set the CSRF secret (should be called during server initialization)
 */
export declare function setCSRFSecret(secret: string): void;
/**
 * Generate a CSRF token
 */
export declare function generateCSRFToken(sessionId?: string): string;
/**
 * Verify a CSRF token
 */
export declare function verifyCSRFToken(token: string, sessionId?: string): boolean;
/**
 * Serialize data for transmission
 * Handles Date, Map, Set, and other complex types
 */
export declare function serialize(data: unknown): string;
/**
 * Deserialize data from transmission
 */
export declare function deserialize<T = unknown>(json: string): T;
/**
 * Serialize FormData for transmission
 */
export declare function serializeFormData(formData: FormData): Record<string, unknown>;
/**
 * Deserialize to FormData
 */
export declare function deserializeFormData(data: Record<string, unknown>): FormData;
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
export declare function createServerAction<TInput = FormData, TOutput = unknown>(fn: ServerActionFn<TInput, TOutput>, options?: CreateServerActionOptions): ServerAction<TInput, TOutput>;
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
export declare function serverAction<TInput = FormData, TOutput = unknown>(fn: ServerActionFn<TInput, TOutput>, options?: CreateServerActionOptions): ServerAction<TInput, TOutput>;
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
export declare function useServerAction<TOutput = unknown>(action: ServerAction<FormData, TOutput>, options?: UseServerActionOptions<TOutput>): UseServerActionReturn<TOutput>;
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
export declare function useFormAction<TOutput = unknown>(action: ServerAction<FormData, TOutput>, options?: UseServerActionOptions<TOutput>): UseFormActionReturn<TOutput>;
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
export declare function useOptimistic<TState, TAction>(state: TState, updateFn: (currentState: TState, action: TAction) => TState): UseOptimisticReturn<TState, TAction>;
/**
 * Server action error class
 */
export declare class ServerActionError extends Error {
    code?: string | undefined;
    details?: Record<string, unknown> | undefined;
    constructor(message: string, code?: string, details?: Record<string, unknown>);
}
/**
 * Handle incoming server action requests
 */
export declare function handleServerActionRequest(request: Request): Promise<Response>;
type RevalidationCallback = (paths?: string[], tags?: string[]) => Promise<void>;
/**
 * Set the revalidation callback (called by framework integration)
 */
export declare function setRevalidationCallback(callback: RevalidationCallback): void;
/**
 * Programmatically revalidate paths
 */
export declare function revalidatePath(path: string): Promise<void>;
/**
 * Programmatically revalidate tags
 */
export declare function revalidateTag(tag: string): Promise<void>;
/**
 * Set the CSRF token on the client
 */
export declare function setClientCSRFToken(token: string): void;
/**
 * Get the CSRF token on the client
 */
export declare function getClientCSRFToken(): string | null;
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
export declare function serverActionsMiddleware(): (request: Request, next: () => Promise<Response>) => Promise<Response>;
/**
 * Express-style middleware adapter
 */
export declare function serverActionsExpressMiddleware(): (req: any, res: any, next: () => void) => Promise<void>;
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
export declare function isServerAction(value: unknown): value is ServerAction;
/**
 * Create a hidden CSRF input for forms
 */
export declare function createCSRFInput(): string;
/**
 * HOC to add CSRF to forms
 */
export declare function withCSRF<T extends Record<string, unknown>>(formData: T): T & {
    _csrf: string;
};
export {};
//# sourceMappingURL=server-actions.d.ts.map