/**
 * Remix-style route actions for PhilJS Router.
 * Handles form submissions and mutations with automatic revalidation.
 *
 * @example
 * ```tsx
 * // routes/users.tsx
 * export async function action({ request }) {
 *   const formData = await request.formData();
 *   await createUser(Object.fromEntries(formData));
 *   return redirect('/users');
 * }
 *
 * export default function UsersPage() {
 *   const actionData = useActionData();
 *   const navigation = useNavigation();
 *
 *   return (
 *     <Form method="post">
 *       <input name="name" />
 *       <button type="submit" disabled={navigation.state === 'submitting'}>
 *         Create User
 *       </button>
 *       {actionData?.error && <p>{actionData.error}</p>}
 *     </Form>
 *   );
 * }
 * ```
 */
import type { JSXElement, VNode } from "@philjs/core";
import { redirect } from "./loader.js";
export { redirect };
/**
 * Context passed to action functions.
 */
export type ActionFunctionContext = {
    /** Route parameters extracted from the URL */
    params: Record<string, string>;
    /** The incoming request object */
    request: Request;
    /** The URL of the action */
    url: URL;
};
/**
 * An action function that handles form submissions.
 */
export type ActionFunction<T = unknown> = (context: ActionFunctionContext) => Promise<T | Response> | T | Response;
/**
 * Result of an action execution.
 */
export type ActionResult<T = unknown> = {
    /** The action's return data */
    data?: T;
    /** Error if the action failed */
    error?: Error;
    /** Status of the action */
    status: "idle" | "submitting" | "success" | "error";
};
/**
 * Navigation state for tracking form submissions.
 */
export type NavigationState = {
    /** Current navigation state */
    state: "idle" | "submitting" | "loading";
    /** Form data being submitted */
    formData?: FormData;
    /** HTTP method being used */
    formMethod?: string;
    /** Action URL */
    formAction?: string;
    /** Form encoding type */
    formEncType?: string;
    /** Location being navigated to */
    location?: URL;
};
/**
 * Props for the Form component.
 */
export type FormProps = {
    /** HTTP method (default: "post") */
    method?: "get" | "post" | "put" | "patch" | "delete";
    /** Action URL (default: current route) */
    action?: string;
    /** Encoding type */
    encType?: "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
    /** Whether to replace history entry */
    replace?: boolean;
    /** Whether to prevent scroll reset */
    preventScrollReset?: boolean;
    /** Custom onSubmit handler */
    onSubmit?: (event: SubmitEvent) => void;
    /** Form children */
    children?: VNode | JSXElement | string | Array<VNode | JSXElement | string>;
    /** Additional HTML attributes */
    [key: string]: unknown;
};
/**
 * Options for useSubmit hook.
 */
export type SubmitOptions = {
    /** HTTP method */
    method?: "get" | "post" | "put" | "patch" | "delete";
    /** Action URL */
    action?: string;
    /** Encoding type */
    encType?: "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
    /** Whether to replace history entry */
    replace?: boolean;
    /** Whether to prevent scroll reset */
    preventScrollReset?: boolean;
};
/**
 * Fetcher state for useFetcher hook.
 */
export type FetcherState<T = unknown> = {
    /** Current fetcher state */
    state: "idle" | "submitting" | "loading";
    /** Form data being submitted */
    formData?: FormData;
    /** HTTP method being used */
    formMethod?: string;
    /** Action URL */
    formAction?: string;
    /** Returned data */
    data?: T;
    /** Error if action failed */
    error?: Error;
    /** Submit function */
    submit: (target: FormData | HTMLFormElement | Record<string, string>, options?: SubmitOptions) => Promise<void>;
    /** Load function for GET requests */
    load: (href: string) => Promise<void>;
    /** Form component bound to this fetcher */
    Form: (props: Omit<FormProps, "method">) => VNode;
};
/**
 * Execute an action function.
 */
export declare function executeAction<T>(action: ActionFunction<T>, context: ActionFunctionContext): Promise<ActionResult<T>>;
/**
 * Create a Request object for action context.
 */
export declare function createActionRequest(url: string | URL, formData: FormData, method?: string): Promise<Request>;
/**
 * Hook to access the result of the most recent action.
 *
 * @example
 * ```tsx
 * const actionData = useActionData<{ error?: string; success?: boolean }>();
 * ```
 */
export declare function useActionData<T = unknown>(): T | undefined;
/**
 * Hook to access the current navigation state.
 *
 * @example
 * ```tsx
 * const navigation = useNavigation();
 * const isSubmitting = navigation.state === 'submitting';
 * ```
 */
export declare function useNavigation(): NavigationState;
/**
 * Hook to programmatically submit a form.
 *
 * @example
 * ```tsx
 * const submit = useSubmit();
 *
 * const handleClick = () => {
 *   submit({ name: 'John' }, { method: 'post', action: '/users' });
 * };
 * ```
 */
export declare function useSubmit(): (target: FormData | HTMLFormElement | Record<string, string>, options?: SubmitOptions) => Promise<void>;
/**
 * Hook for data mutations that don't navigate.
 * Useful for inline forms and optimistic UI.
 *
 * @example
 * ```tsx
 * const fetcher = useFetcher<{ success: boolean }>();
 *
 * return (
 *   <fetcher.Form method="post" action="/api/like">
 *     <input type="hidden" name="postId" value={postId} />
 *     <button type="submit" disabled={fetcher.state === 'submitting'}>
 *       {fetcher.data?.success ? 'Liked!' : 'Like'}
 *     </button>
 *   </fetcher.Form>
 * );
 * ```
 */
export declare function useFetcher<T = unknown>(): FetcherState<T>;
/**
 * Hook to access all active fetchers.
 */
export declare function useFetchers(): FetcherState[];
/**
 * Enhanced form component that handles submissions via the router.
 *
 * @example
 * ```tsx
 * <Form method="post" action="/users">
 *   <input name="email" type="email" required />
 *   <button type="submit">Submit</button>
 * </Form>
 * ```
 */
export declare function Form(props: FormProps): VNode;
/**
 * Set action data for a route.
 */
export declare function setActionData(routeId: string, result: ActionResult<unknown>): void;
/**
 * Clear action data for a route.
 */
export declare function clearActionData(routeId?: string): void;
/**
 * Set navigation state.
 */
export declare function setNavigationState(state: NavigationState): void;
/**
 * Parse form data into an object.
 */
export declare function formDataToObject(formData: FormData): Record<string, string | string[]>;
/**
 * Create form data from an object.
 */
export declare function objectToFormData(obj: Record<string, unknown>): FormData;
/**
 * Validate form data against a schema.
 */
export type ValidationError = {
    field: string;
    message: string;
};
export type ValidationResult<T> = {
    success: boolean;
    data?: T;
    errors?: ValidationError[];
};
export declare function validateFormData<T>(formData: FormData, validator: (data: Record<string, unknown>) => ValidationResult<T>): ValidationResult<T>;
/**
 * Track optimistic update state.
 */
export type OptimisticUpdate<T> = {
    /** Unique ID for this update */
    id: string;
    /** The optimistic data */
    data: T;
    /** Whether the update is pending */
    pending: boolean;
    /** Whether the update was confirmed */
    confirmed: boolean;
    /** Error if the update failed */
    error?: Error;
};
/**
 * Apply an optimistic update.
 */
export declare function applyOptimisticUpdate<T>(id: string, data: T, submit: () => Promise<void>): OptimisticUpdate<T>;
/**
 * Get all optimistic updates.
 */
export declare function useOptimisticUpdates<T>(): OptimisticUpdate<T>[];
/**
 * Clear completed optimistic updates.
 */
export declare function clearOptimisticUpdates(): void;
//# sourceMappingURL=action.d.ts.map