/**
 * A2UI Protocol Validator
 * Uses Zod for runtime validation of A2UI messages
 */
import { z } from 'zod';
/**
 * Zod schema for A2UI Layout
 */
const a2uiLayoutSchema = z.object({
    type: z.enum(['stack', 'grid', 'flex', 'absolute', 'flow']),
    direction: z.enum(['row', 'column', 'row-reverse', 'column-reverse']).optional(),
    gap: z.union([z.number(), z.string()]).optional(),
    columns: z.union([z.number(), z.string()]).optional(),
    rows: z.union([z.number(), z.string()]).optional(),
    align: z.enum(['start', 'center', 'end', 'stretch', 'baseline']).optional(),
    justify: z.enum(['start', 'center', 'end', 'between', 'around', 'evenly']).optional(),
    wrap: z.boolean().optional(),
    padding: z
        .union([
        z.number(),
        z.string(),
        z.tuple([z.number(), z.number()]),
        z.tuple([z.number(), z.number(), z.number(), z.number()]),
    ])
        .optional(),
});
/**
 * Zod schema for A2UI Accessibility
 */
const a2uiAccessibilitySchema = z.object({
    role: z.string().optional(),
    label: z.string().optional(),
    labelledBy: z.string().optional(),
    describedBy: z.string().optional(),
    live: z.enum(['off', 'polite', 'assertive']).optional(),
    tabIndex: z.number().optional(),
    hidden: z.boolean().optional(),
});
/**
 * Zod schema for A2UI Condition
 */
let a2uiComponentSchema;
const a2uiConditionSchema = z.object({
    expression: z.string(),
    fallback: z.lazy(() => a2uiComponentSchema).optional(),
});
/**
 * Zod schema for A2UI Iteration
 */
const a2uiIterationSchema = z.object({
    source: z.string(),
    item: z.string(),
    index: z.string().optional(),
    key: z.string(),
    empty: z.lazy(() => a2uiComponentSchema).optional(),
});
/**
 * Zod schema for A2UI Component
 */
a2uiComponentSchema = z.lazy(() => z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    props: z.record(z.string(), z.unknown()),
    children: z.array(a2uiComponentSchema).optional(),
    slot: z.string().optional(),
    when: a2uiConditionSchema.optional(),
    each: a2uiIterationSchema.optional(),
    className: z.string().optional(),
    style: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
    a11y: a2uiAccessibilitySchema.optional(),
}));
/**
 * Zod schema for A2UI Binding
 */
const a2uiBindingSchema = z.object({
    id: z.string().min(1),
    source: z.enum(['signal', 'prop', 'context', 'query']),
    path: z.string().min(1),
    targetId: z.string().min(1),
    targetProp: z.string().min(1),
    transform: z.string().optional(),
    defaultValue: z.unknown().optional(),
});
/**
 * Zod schema for A2UI Action Handler
 */
const a2uiActionHandlerSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('emit'),
        event: z.string().min(1),
        payload: z.unknown().optional(),
    }),
    z.object({
        type: z.literal('navigate'),
        to: z.string().min(1),
        replace: z.boolean().optional(),
    }),
    z.object({
        type: z.literal('signal'),
        action: z.enum(['set', 'update', 'reset']),
        path: z.string().min(1),
        value: z.unknown(),
    }),
    z.object({
        type: z.literal('agent'),
        intent: z.string().min(1),
        context: z.record(z.string(), z.unknown()).optional(),
        await: z.boolean().optional(),
    }),
]);
/**
 * Zod schema for A2UI Action
 */
const a2uiActionSchema = z.object({
    id: z.string().min(1),
    trigger: z.enum(['click', 'submit', 'change', 'hover', 'focus', 'blur', 'keydown', 'custom']),
    customEvent: z.string().optional(),
    handler: a2uiActionHandlerSchema,
    debounce: z.number().optional(),
    throttle: z.number().optional(),
    preventDefault: z.boolean().optional(),
    stopPropagation: z.boolean().optional(),
});
/**
 * Zod schema for A2UI Animation
 */
const a2uiAnimationSchema = z.object({
    type: z.enum(['fade', 'slide', 'scale', 'custom']),
    duration: z.number().optional(),
    easing: z.string().optional(),
    direction: z.enum(['up', 'down', 'left', 'right']).optional(),
    keyframes: z
        .array(z.record(z.string(), z.record(z.string(), z.union([z.string(), z.number()]))))
        .optional(),
});
/**
 * Zod schema for A2UI Metadata
 */
const a2uiMetadataSchema = z.object({
    messageId: z.string().optional(),
    timestamp: z.number().optional(),
    sessionId: z.string().optional(),
    priority: z.enum(['low', 'normal', 'high']).optional(),
    ttl: z.number().optional(),
    agentId: z.string().optional(),
});
/**
 * Zod schema for Render Payload
 */
const a2uiRenderPayloadSchema = z.object({
    type: z.literal('render'),
    layout: a2uiLayoutSchema,
    components: z.array(a2uiComponentSchema),
    bindings: z.array(a2uiBindingSchema).optional(),
    actions: z.array(a2uiActionSchema).optional(),
});
/**
 * Zod schema for Update Payload
 */
const a2uiUpdatePayloadSchema = z.object({
    type: z.literal('update'),
    targetId: z.string().min(1),
    props: z.record(z.string(), z.unknown()).optional(),
    children: z.array(a2uiComponentSchema).optional(),
    animation: a2uiAnimationSchema.optional(),
});
/**
 * Zod schema for Action Payload
 */
const a2uiActionPayloadSchema = z.object({
    type: z.literal('action'),
    actionId: z.string().min(1),
    event: z.object({
        type: z.string(),
        data: z.unknown().optional(),
    }),
    state: z.record(z.string(), z.unknown()).optional(),
});
/**
 * Zod schema for Query Payload
 */
const a2uiQueryPayloadSchema = z.object({
    type: z.literal('query'),
    query: z.enum(['components', 'layouts', 'capabilities', 'state']),
    filters: z.record(z.string(), z.unknown()).optional(),
});
/**
 * Combined Payload schema
 */
const a2uiPayloadSchema = z.discriminatedUnion('type', [
    a2uiRenderPayloadSchema,
    a2uiUpdatePayloadSchema,
    a2uiActionPayloadSchema,
    a2uiQueryPayloadSchema,
]);
/**
 * Complete A2UI Message schema
 */
const a2uiMessageSchema = z.object({
    version: z.literal('1.0'),
    type: z.enum(['render', 'update', 'action', 'query']),
    payload: a2uiPayloadSchema,
    metadata: a2uiMetadataSchema.optional(),
});
/**
 * Validate an A2UI message against the schema
 */
export function validateMessage(message) {
    const result = a2uiMessageSchema.safeParse(message);
    if (result.success) {
        return {
            valid: true,
            errors: [],
            data: result.data,
        };
    }
    const errors = result.error.issues.map((issue) => ({
        code: 'INVALID_MESSAGE',
        message: issue.message,
        details: {
            path: issue.path.join('.'),
            code: issue.code,
        },
    }));
    return {
        valid: false,
        errors,
    };
}
/**
 * Validate a single component
 */
export function validateComponent(component) {
    const result = a2uiComponentSchema.safeParse(component);
    if (result.success) {
        return {
            valid: true,
            errors: [],
            data: { version: '1.0', type: 'render', payload: { type: 'render', layout: { type: 'stack' }, components: [result.data] } },
        };
    }
    const errors = result.error.issues.map((issue) => ({
        code: 'INVALID_COMPONENT',
        message: issue.message,
        details: {
            path: issue.path.join('.'),
            code: issue.code,
        },
    }));
    return {
        valid: false,
        errors,
    };
}
/**
 * Validate a layout configuration
 */
export function validateLayout(layout) {
    const result = a2uiLayoutSchema.safeParse(layout);
    if (result.success) {
        return {
            valid: true,
            errors: [],
        };
    }
    const errors = result.error.issues.map((issue) => ({
        code: 'INVALID_MESSAGE',
        message: `Invalid layout: ${issue.message}`,
        details: {
            path: issue.path.join('.'),
            code: issue.code,
        },
    }));
    return {
        valid: false,
        errors,
    };
}
// Export schemas for external use
export const schemas = {
    message: a2uiMessageSchema,
    component: a2uiComponentSchema,
    layout: a2uiLayoutSchema,
    binding: a2uiBindingSchema,
    action: a2uiActionSchema,
    animation: a2uiAnimationSchema,
    metadata: a2uiMetadataSchema,
    payload: a2uiPayloadSchema,
};
//# sourceMappingURL=validator.js.map