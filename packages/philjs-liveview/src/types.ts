/**
 * PhilJS LiveView - Type Definitions
 */

// ============================================================================
// Core Types
// ============================================================================

export interface LiveViewState {
  [key: string]: any;
}

export interface LiveViewEvent {
  type: string;
  value?: any;
  target?: string;
  key?: string;
  keyCode?: number;
  meta?: Record<string, any>;
}

export interface LiveViewParams {
  [key: string]: string | string[] | undefined;
}

export interface LiveViewSession {
  [key: string]: any;
}

// ============================================================================
// Socket Types
// ============================================================================

export interface LiveSocket {
  /** Unique socket ID */
  id: string;

  /** Current view state */
  state: LiveViewState;

  /** Session data */
  session: LiveViewSession;

  /** URL parameters */
  params: LiveViewParams;

  /** Connected client ID */
  clientId: string;

  /** Push an event to the client */
  pushEvent(event: string, payload: any): void;

  /** Push a redirect to the client */
  pushRedirect(to: string, options?: RedirectOptions): void;

  /** Push a patch (partial navigation) */
  pushPatch(to: string, options?: PatchOptions): void;

  /** Assign new state values */
  assign(state: Partial<LiveViewState>): void;

  /** Put a flash message */
  putFlash(type: FlashType, message: string): void;

  /** Get temporary assigns */
  getTemporaryAssigns(): string[];

  /** Mark assigns as temporary (cleared after render) */
  setTemporaryAssigns(keys: string[]): void;
}

export interface RedirectOptions {
  replace?: boolean;
  flash?: { type: FlashType; message: string };
}

export interface PatchOptions {
  replace?: boolean;
}

export type FlashType = 'info' | 'success' | 'warning' | 'error';

// ============================================================================
// LiveView Definition
// ============================================================================

export interface LiveViewDefinition<S extends LiveViewState = LiveViewState> {
  /**
   * Called when the view is mounted.
   * Return initial state.
   */
  mount: (socket: LiveSocket) => S | Promise<S>;

  /**
   * Called when the socket params change (e.g., URL params).
   */
  handleParams?: (params: LiveViewParams, uri: string, socket: LiveSocket) => S | Promise<S>;

  /**
   * Handle client events (phx-click, phx-change, etc.)
   */
  handleEvent?: (event: LiveViewEvent, state: S, socket: LiveSocket) => S | Promise<S>;

  /**
   * Handle info messages (internal pub/sub)
   */
  handleInfo?: (info: any, state: S, socket: LiveSocket) => S | Promise<S>;

  /**
   * Render the view to HTML string
   */
  render: (state: S, assigns?: Record<string, any>) => string;

  /**
   * Called when the view is unmounted
   */
  terminate?: (reason: string, state: S) => void;
}

// ============================================================================
// LiveComponent Definition
// ============================================================================

export interface LiveComponentDefinition<S extends LiveViewState = LiveViewState, P = any> {
  /** Component ID (must be unique within the view) */
  id?: string | ((props: P) => string);

  /**
   * Called when the component is mounted
   */
  mount?: (socket: LiveSocket, props: P) => S | Promise<S>;

  /**
   * Called when props are updated
   */
  update?: (props: P, state: S, socket: LiveSocket) => S | Promise<S>;

  /**
   * Handle component events
   */
  handleEvent?: (event: LiveViewEvent, state: S, socket: LiveSocket) => S | Promise<S>;

  /**
   * Render the component
   */
  render: (state: S, props: P) => string;

  /**
   * Preload data for multiple components at once
   */
  preload?: (listOfAssigns: P[]) => Promise<P[]>;
}

// ============================================================================
// Patch/Diff Types
// ============================================================================

export interface DOMPatch {
  type: 'morph' | 'append' | 'prepend' | 'replace' | 'remove' | 'update_attr' | 'remove_attr';
  target: string; // CSS selector
  html?: string;
  attr?: string;
  value?: string;
}

export interface ViewPatch {
  patches: DOMPatch[];
  title?: string;
  events?: PushEvent[];
}

export interface PushEvent {
  event: string;
  payload: any;
}

// ============================================================================
// Client Types
// ============================================================================

export interface LiveViewClientOptions {
  /** WebSocket URL */
  url: string;

  /** CSRF token */
  csrfToken?: string;

  /** Enable debug logging */
  debug?: boolean;

  /** Custom params to send on connect */
  params?: Record<string, any>;

  /** Reconnection options */
  reconnect?: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
  };
}

export interface ClientHook {
  /** Called when the element is added to the DOM */
  mounted?: () => void;

  /** Called before the element is updated */
  beforeUpdate?: () => void;

  /** Called after the element is updated */
  updated?: () => void;

  /** Called before the element is removed */
  beforeDestroy?: () => void;

  /** Called when the element is removed */
  destroyed?: () => void;

  /** Called when the element is disconnected from LiveView */
  disconnected?: () => void;

  /** Called when the element is reconnected to LiveView */
  reconnected?: () => void;

  /** Reference to the DOM element */
  el?: HTMLElement;

  /** Push an event to the server */
  pushEvent?: (event: string, payload: any, target?: string) => void;

  /** Push an event to another hook */
  pushEventTo?: (selector: string, event: string, payload: any) => void;

  /** Handle events from the server */
  handleEvent?: (event: string, callback: (payload: any) => void) => void;

  /** Upload files */
  upload?: (name: string, files: FileList) => void;
}

export type HookDefinition = Partial<ClientHook>;
export type Hooks = Record<string, HookDefinition>;

// ============================================================================
// Form Types
// ============================================================================

export interface LiveViewForm {
  /** Form ID */
  id: string;

  /** Form data */
  data: FormData;

  /** Validation errors */
  errors: Record<string, string[]>;

  /** Whether the form is being submitted */
  submitting: boolean;
}

export interface FormValidation {
  field: string;
  rule: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom';
  message: string;
  params?: any;
}

export interface UploadConfig {
  /** Upload name */
  name: string;

  /** Max file size in bytes */
  maxFileSize?: number;

  /** Max number of files */
  maxEntries?: number;

  /** Accepted file types */
  accept?: string[];

  /** Auto upload on change */
  autoUpload?: boolean;

  /** Progress callback */
  onProgress?: (percent: number) => void;
}

export interface UploadEntry {
  /** Unique upload ID */
  id: string;

  /** File name */
  name: string;

  /** File size */
  size: number;

  /** MIME type */
  type: string;

  /** Upload progress (0-100) */
  progress: number;

  /** Upload status */
  status: 'pending' | 'uploading' | 'done' | 'error';

  /** Error message if failed */
  error?: string;

  /** Preview URL (for images) */
  previewUrl?: string;
}

// ============================================================================
// Navigation Types
// ============================================================================

export interface LiveNavigation {
  /** Current path */
  path: string;

  /** URL search params */
  params: URLSearchParams;

  /** Navigation mode */
  mode: 'push' | 'replace' | 'patch';
}

export interface NavigationEvent {
  type: 'link_click' | 'popstate' | 'patch' | 'redirect';
  to: string;
  replace?: boolean;
}

// ============================================================================
// Server Types
// ============================================================================

export interface LiveViewServerOptions {
  /** Session signing secret */
  secret: string;

  /** Enable server-side rendering */
  ssr?: boolean;

  /** Custom serializer */
  serializer?: {
    encode: (data: any) => string;
    decode: (str: string) => any;
  };

  /** Rate limiting */
  rateLimit?: {
    maxEventsPerSecond: number;
    maxConnectionsPerIP: number;
  };

  /** PubSub configuration */
  pubSub?: {
    adapter: 'memory' | 'redis' | 'postgres';
    options?: Record<string, any>;
  };
}

export interface ILiveViewServer {
  /** Handle HTTP request for initial render */
  handleRequest: (req: Request) => Promise<Response>;

  /** Handle WebSocket connection */
  handleSocket: (socket: WebSocket, request: Request) => void;

  /** Register a LiveView */
  register: (path: string, view: LiveViewDefinition) => void;

  /** Register a LiveComponent */
  registerComponent: (name: string, component: LiveComponentDefinition) => void;

  /** Broadcast to topic */
  broadcast: (topic: string, event: string, payload: any) => void;

  /** Subscribe to topic */
  subscribe: (socketId: string, topic: string) => void;

  /** Unsubscribe from topic */
  unsubscribe: (socketId: string, topic: string) => void;
}

// ============================================================================
// Message Protocol
// ============================================================================

export type LiveMessage =
  | { type: 'phx_join'; topic: string; payload: JoinPayload }
  | { type: 'phx_leave'; topic: string }
  | { type: 'event'; topic: string; event: string; payload: any }
  | { type: 'heartbeat' }
  | { type: 'phx_reply'; ref: string; status: 'ok' | 'error'; response: any }
  | { type: 'diff'; topic: string; diff: ViewPatch };

export interface JoinPayload {
  url: string;
  params: Record<string, any>;
  session: string;
  static: string;
}
