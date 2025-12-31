/**
 * A2UI Protocol - Agent-to-UI Communication
 * Structured JSON schema for LLM-generated UI
 *
 * This protocol defines how AI agents communicate UI specifications
 * to the PhilJS runtime for dynamic rendering.
 */
/**
 * Root message structure for A2UI communication
 */
export interface A2UIMessage {
    /** Protocol version */
    version: '1.0';
    /** Message type */
    type: 'render' | 'update' | 'action' | 'query';
    /** Message payload */
    payload: A2UIPayload;
    /** Optional metadata */
    metadata?: A2UIMetadata;
}
/**
 * Payload types based on message type
 */
export type A2UIPayload = A2UIRenderPayload | A2UIUpdatePayload | A2UIActionPayload | A2UIQueryPayload;
/**
 * Render payload - defines a complete UI tree
 */
export interface A2UIRenderPayload {
    type: 'render';
    /** Root layout configuration */
    layout: A2UILayout;
    /** Component tree */
    components: A2UIComponent[];
    /** Data bindings */
    bindings?: A2UIBinding[];
    /** Available actions */
    actions?: A2UIAction[];
}
/**
 * Update payload - partial updates to existing UI
 */
export interface A2UIUpdatePayload {
    type: 'update';
    /** Target component ID */
    targetId: string;
    /** Properties to update */
    props?: Record<string, unknown>;
    /** Children to replace */
    children?: A2UIComponent[];
    /** Animation for the update */
    animation?: A2UIAnimation;
}
/**
 * Action payload - user interactions sent to agent
 */
export interface A2UIActionPayload {
    type: 'action';
    /** Action ID from the component */
    actionId: string;
    /** Event data */
    event: {
        type: string;
        data?: unknown;
    };
    /** Current component state */
    state?: Record<string, unknown>;
}
/**
 * Query payload - agent querying available capabilities
 */
export interface A2UIQueryPayload {
    type: 'query';
    /** What to query */
    query: 'components' | 'layouts' | 'capabilities' | 'state';
    /** Query filters */
    filters?: Record<string, unknown>;
}
/**
 * Component definition in the A2UI tree
 */
export interface A2UIComponent {
    /** Unique identifier for this component instance */
    id: string;
    /** Component type from registry (must be whitelisted) */
    type: string;
    /** Component props (validated against registry schema) */
    props: Record<string, unknown>;
    /** Child components */
    children?: A2UIComponent[];
    /** Named slot assignment */
    slot?: string;
    /** Conditional rendering expression */
    when?: A2UICondition;
    /** Iteration for lists */
    each?: A2UIIteration;
    /** CSS class names */
    className?: string;
    /** Inline styles */
    style?: Record<string, string | number>;
    /** Accessibility attributes */
    a11y?: A2UIAccessibility;
}
/**
 * Layout configuration
 */
export interface A2UILayout {
    /** Layout type */
    type: 'stack' | 'grid' | 'flex' | 'absolute' | 'flow';
    /** Direction for stack/flex layouts */
    direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
    /** Gap between items */
    gap?: number | string;
    /** Grid columns (for grid layout) */
    columns?: number | string;
    /** Grid rows (for grid layout) */
    rows?: number | string;
    /** Alignment */
    align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
    /** Justification */
    justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
    /** Wrap behavior */
    wrap?: boolean;
    /** Padding */
    padding?: number | string | [number, number] | [number, number, number, number];
}
/**
 * Data binding configuration
 */
export interface A2UIBinding {
    /** Unique binding ID */
    id: string;
    /** Data source type */
    source: 'signal' | 'prop' | 'context' | 'query';
    /** Path to the data */
    path: string;
    /** Target component ID */
    targetId: string;
    /** Target property on the component */
    targetProp: string;
    /** Transform expression (sandboxed) */
    transform?: string;
    /** Default value if source is undefined */
    defaultValue?: unknown;
}
/**
 * Action handler configuration
 */
export interface A2UIAction {
    /** Unique action ID */
    id: string;
    /** Event trigger */
    trigger: 'click' | 'submit' | 'change' | 'hover' | 'focus' | 'blur' | 'keydown' | 'custom';
    /** Custom event name (when trigger is 'custom') */
    customEvent?: string;
    /** Handler definition */
    handler: A2UIActionHandler;
    /** Debounce delay in ms */
    debounce?: number;
    /** Throttle delay in ms */
    throttle?: number;
    /** Prevent default browser behavior */
    preventDefault?: boolean;
    /** Stop event propagation */
    stopPropagation?: boolean;
}
/**
 * Action handler types
 */
export type A2UIActionHandler = A2UIEmitHandler | A2UINavigateHandler | A2UISignalHandler | A2UIAgentHandler;
export interface A2UIEmitHandler {
    type: 'emit';
    /** Event name to emit */
    event: string;
    /** Payload to include */
    payload?: unknown;
}
export interface A2UINavigateHandler {
    type: 'navigate';
    /** URL or route to navigate to */
    to: string;
    /** Replace current history entry */
    replace?: boolean;
}
export interface A2UISignalHandler {
    type: 'signal';
    /** Signal operation */
    action: 'set' | 'update' | 'reset';
    /** Signal path */
    path: string;
    /** Value or update function (sandboxed) */
    value: unknown;
}
export interface A2UIAgentHandler {
    type: 'agent';
    /** Intent to send to agent */
    intent: string;
    /** Additional context */
    context?: Record<string, unknown>;
    /** Wait for agent response before continuing */
    await?: boolean;
}
/**
 * Conditional rendering
 */
export interface A2UICondition {
    /** Expression to evaluate (sandboxed) */
    expression: string;
    /** Fallback component if condition is false */
    fallback?: A2UIComponent;
}
/**
 * List iteration
 */
export interface A2UIIteration {
    /** Data source path */
    source: string;
    /** Item variable name in template */
    item: string;
    /** Index variable name */
    index?: string;
    /** Key property for reconciliation */
    key: string;
    /** Empty state component */
    empty?: A2UIComponent;
}
/**
 * Animation configuration
 */
export interface A2UIAnimation {
    /** Animation type */
    type: 'fade' | 'slide' | 'scale' | 'custom';
    /** Duration in ms */
    duration?: number;
    /** Easing function */
    easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | string;
    /** Animation direction for slide */
    direction?: 'up' | 'down' | 'left' | 'right';
    /** Custom keyframes */
    keyframes?: Record<string, Record<string, string | number>>[];
}
/**
 * Accessibility attributes
 */
export interface A2UIAccessibility {
    /** ARIA role */
    role?: string;
    /** ARIA label */
    label?: string;
    /** ARIA labelledby */
    labelledBy?: string;
    /** ARIA describedby */
    describedBy?: string;
    /** ARIA live region */
    live?: 'off' | 'polite' | 'assertive';
    /** Tab index */
    tabIndex?: number;
    /** Hidden from accessibility tree */
    hidden?: boolean;
}
/**
 * Message metadata
 */
export interface A2UIMetadata {
    /** Unique message ID */
    messageId?: string;
    /** Timestamp */
    timestamp?: number;
    /** Session ID */
    sessionId?: string;
    /** Priority level */
    priority?: 'low' | 'normal' | 'high';
    /** TTL in seconds */
    ttl?: number;
    /** Source agent identifier */
    agentId?: string;
}
/**
 * Response from the UI runtime to the agent
 */
export interface A2UIResponse {
    /** Whether the operation succeeded */
    success: boolean;
    /** Message ID this responds to */
    messageId?: string;
    /** Error if not successful */
    error?: A2UIError;
    /** Result data */
    data?: unknown;
}
/**
 * Error structure
 */
export interface A2UIError {
    /** Error code */
    code: A2UIErrorCode;
    /** Human-readable message */
    message: string;
    /** Additional details */
    details?: Record<string, unknown>;
}
/**
 * Standard error codes
 */
export type A2UIErrorCode = 'INVALID_MESSAGE' | 'INVALID_COMPONENT' | 'COMPONENT_NOT_FOUND' | 'PROP_VALIDATION_FAILED' | 'SECURITY_VIOLATION' | 'SANDBOX_ERROR' | 'BINDING_ERROR' | 'ACTION_ERROR' | 'TIMEOUT' | 'UNKNOWN_ERROR';
/**
 * Create a render message
 */
export declare function createRenderMessage(layout: A2UILayout, components: A2UIComponent[], options?: {
    bindings?: A2UIBinding[];
    actions?: A2UIAction[];
    metadata?: A2UIMetadata;
}): A2UIMessage;
/**
 * Create an update message
 */
export declare function createUpdateMessage(targetId: string, updates: {
    props?: Record<string, unknown>;
    children?: A2UIComponent[];
    animation?: A2UIAnimation;
}, metadata?: A2UIMetadata): A2UIMessage;
/**
 * Create an action message (sent from UI to agent)
 */
export declare function createActionMessage(actionId: string, event: {
    type: string;
    data?: unknown;
}, state?: Record<string, unknown>, metadata?: A2UIMetadata): A2UIMessage;
//# sourceMappingURL=a2ui-schema.d.ts.map