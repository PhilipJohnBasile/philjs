/**
 * A2UI Protocol - Agent-to-UI Communication
 * Structured JSON schema for LLM-generated UI
 *
 * This protocol defines how AI agents communicate UI specifications
 * to the PhilJS runtime for dynamic rendering.
 */
/**
 * Create a render message
 */
export function createRenderMessage(layout, components, options) {
    return {
        version: '1.0',
        type: 'render',
        payload: {
            type: 'render',
            layout,
            components,
            bindings: options?.bindings,
            actions: options?.actions,
        },
        metadata: {
            messageId: crypto.randomUUID(),
            timestamp: Date.now(),
            ...options?.metadata,
        },
    };
}
/**
 * Create an update message
 */
export function createUpdateMessage(targetId, updates, metadata) {
    return {
        version: '1.0',
        type: 'update',
        payload: {
            type: 'update',
            targetId,
            ...updates,
        },
        metadata: {
            messageId: crypto.randomUUID(),
            timestamp: Date.now(),
            ...metadata,
        },
    };
}
/**
 * Create an action message (sent from UI to agent)
 */
export function createActionMessage(actionId, event, state, metadata) {
    return {
        version: '1.0',
        type: 'action',
        payload: {
            type: 'action',
            actionId,
            event,
            state,
        },
        metadata: {
            messageId: crypto.randomUUID(),
            timestamp: Date.now(),
            ...metadata,
        },
    };
}
//# sourceMappingURL=a2ui-schema.js.map