/**
 * A2UI Protocol Validator
 * Uses Zod for runtime validation of A2UI messages
 */
import { z } from 'zod';
import type { A2UIMessage, A2UIComponent, A2UIError } from './a2ui-schema.js';
/**
 * Validation result
 */
export interface ValidationResult {
    valid: boolean;
    errors: A2UIError[];
    data?: A2UIMessage;
}
/**
 * Validate an A2UI message against the schema
 */
export declare function validateMessage(message: unknown): ValidationResult;
/**
 * Validate a single component
 */
export declare function validateComponent(component: unknown): ValidationResult;
/**
 * Validate a layout configuration
 */
export declare function validateLayout(layout: unknown): ValidationResult;
export declare const schemas: {
    message: z.ZodObject<{
        version: z.ZodLiteral<"1.0">;
        type: z.ZodEnum<{
            update: "update";
            render: "render";
            query: "query";
            action: "action";
        }>;
        payload: z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"render">;
            layout: z.ZodObject<{
                type: z.ZodEnum<{
                    absolute: "absolute";
                    flex: "flex";
                    grid: "grid";
                    flow: "flow";
                    stack: "stack";
                }>;
                direction: z.ZodOptional<z.ZodEnum<{
                    column: "column";
                    row: "row";
                    "row-reverse": "row-reverse";
                    "column-reverse": "column-reverse";
                }>>;
                gap: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
                columns: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
                rows: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
                align: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    end: "end";
                    start: "start";
                    baseline: "baseline";
                    stretch: "stretch";
                }>>;
                justify: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    end: "end";
                    start: "start";
                    between: "between";
                    around: "around";
                    evenly: "evenly";
                }>>;
                wrap: z.ZodOptional<z.ZodBoolean>;
                padding: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString, z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>]>>;
            }, z.core.$strip>;
            components: z.ZodArray<z.ZodType<A2UIComponent, unknown, z.core.$ZodTypeInternals<A2UIComponent, unknown>>>;
            bindings: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                source: z.ZodEnum<{
                    prop: "prop";
                    signal: "signal";
                    context: "context";
                    query: "query";
                }>;
                path: z.ZodString;
                targetId: z.ZodString;
                targetProp: z.ZodString;
                transform: z.ZodOptional<z.ZodString>;
                defaultValue: z.ZodOptional<z.ZodUnknown>;
            }, z.core.$strip>>>;
            actions: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                trigger: z.ZodEnum<{
                    blur: "blur";
                    change: "change";
                    click: "click";
                    focus: "focus";
                    keydown: "keydown";
                    submit: "submit";
                    custom: "custom";
                    hover: "hover";
                }>;
                customEvent: z.ZodOptional<z.ZodString>;
                handler: z.ZodDiscriminatedUnion<[z.ZodObject<{
                    type: z.ZodLiteral<"emit">;
                    event: z.ZodString;
                    payload: z.ZodOptional<z.ZodUnknown>;
                }, z.core.$strip>, z.ZodObject<{
                    type: z.ZodLiteral<"navigate">;
                    to: z.ZodString;
                    replace: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strip>, z.ZodObject<{
                    type: z.ZodLiteral<"signal">;
                    action: z.ZodEnum<{
                        update: "update";
                        reset: "reset";
                        set: "set";
                    }>;
                    path: z.ZodString;
                    value: z.ZodUnknown;
                }, z.core.$strip>, z.ZodObject<{
                    type: z.ZodLiteral<"agent">;
                    intent: z.ZodString;
                    context: z.ZodOptional<z.ZodRecord<z.core.$ZodRecordKey, z.core.SomeType>>;
                    await: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strip>], "type">;
                debounce: z.ZodOptional<z.ZodNumber>;
                throttle: z.ZodOptional<z.ZodNumber>;
                preventDefault: z.ZodOptional<z.ZodBoolean>;
                stopPropagation: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"update">;
            targetId: z.ZodString;
            props: z.ZodOptional<z.ZodRecord<z.core.$ZodRecordKey, z.core.SomeType>>;
            children: z.ZodOptional<z.ZodArray<z.ZodType<A2UIComponent, unknown, z.core.$ZodTypeInternals<A2UIComponent, unknown>>>>;
            animation: z.ZodOptional<z.ZodObject<{
                type: z.ZodEnum<{
                    custom: "custom";
                    scale: "scale";
                    fade: "fade";
                    slide: "slide";
                }>;
                duration: z.ZodOptional<z.ZodNumber>;
                easing: z.ZodOptional<z.ZodString>;
                direction: z.ZodOptional<z.ZodEnum<{
                    left: "left";
                    right: "right";
                    up: "up";
                    down: "down";
                }>>;
                keyframes: z.ZodOptional<z.ZodArray<z.ZodRecord<z.core.$ZodRecordKey, z.core.SomeType>>>;
            }, z.core.$strip>>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"action">;
            actionId: z.ZodString;
            event: z.ZodObject<{
                type: z.ZodString;
                data: z.ZodOptional<z.ZodUnknown>;
            }, z.core.$strip>;
            state: z.ZodOptional<z.ZodRecord<z.core.$ZodRecordKey, z.core.SomeType>>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"query">;
            query: z.ZodEnum<{
                state: "state";
                components: "components";
                capabilities: "capabilities";
                layouts: "layouts";
            }>;
            filters: z.ZodOptional<z.ZodRecord<z.core.$ZodRecordKey, z.core.SomeType>>;
        }, z.core.$strip>], "type">;
        metadata: z.ZodOptional<z.ZodObject<{
            messageId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            sessionId: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodEnum<{
                high: "high";
                low: "low";
                normal: "normal";
            }>>;
            ttl: z.ZodOptional<z.ZodNumber>;
            agentId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    component: z.ZodType<A2UIComponent, unknown, z.core.$ZodTypeInternals<A2UIComponent, unknown>>;
    layout: z.ZodObject<{
        type: z.ZodEnum<{
            absolute: "absolute";
            flex: "flex";
            grid: "grid";
            flow: "flow";
            stack: "stack";
        }>;
        direction: z.ZodOptional<z.ZodEnum<{
            column: "column";
            row: "row";
            "row-reverse": "row-reverse";
            "column-reverse": "column-reverse";
        }>>;
        gap: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
        columns: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
        rows: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
        align: z.ZodOptional<z.ZodEnum<{
            center: "center";
            end: "end";
            start: "start";
            baseline: "baseline";
            stretch: "stretch";
        }>>;
        justify: z.ZodOptional<z.ZodEnum<{
            center: "center";
            end: "end";
            start: "start";
            between: "between";
            around: "around";
            evenly: "evenly";
        }>>;
        wrap: z.ZodOptional<z.ZodBoolean>;
        padding: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString, z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>]>>;
    }, z.core.$strip>;
    binding: z.ZodObject<{
        id: z.ZodString;
        source: z.ZodEnum<{
            prop: "prop";
            signal: "signal";
            context: "context";
            query: "query";
        }>;
        path: z.ZodString;
        targetId: z.ZodString;
        targetProp: z.ZodString;
        transform: z.ZodOptional<z.ZodString>;
        defaultValue: z.ZodOptional<z.ZodUnknown>;
    }, z.core.$strip>;
    action: z.ZodObject<{
        id: z.ZodString;
        trigger: z.ZodEnum<{
            blur: "blur";
            change: "change";
            click: "click";
            focus: "focus";
            keydown: "keydown";
            submit: "submit";
            custom: "custom";
            hover: "hover";
        }>;
        customEvent: z.ZodOptional<z.ZodString>;
        handler: z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"emit">;
            event: z.ZodString;
            payload: z.ZodOptional<z.ZodUnknown>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"navigate">;
            to: z.ZodString;
            replace: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"signal">;
            action: z.ZodEnum<{
                update: "update";
                reset: "reset";
                set: "set";
            }>;
            path: z.ZodString;
            value: z.ZodUnknown;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"agent">;
            intent: z.ZodString;
            context: z.ZodOptional<z.ZodRecord<z.core.$ZodRecordKey, z.core.SomeType>>;
            await: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>], "type">;
        debounce: z.ZodOptional<z.ZodNumber>;
        throttle: z.ZodOptional<z.ZodNumber>;
        preventDefault: z.ZodOptional<z.ZodBoolean>;
        stopPropagation: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>;
    animation: z.ZodObject<{
        type: z.ZodEnum<{
            custom: "custom";
            scale: "scale";
            fade: "fade";
            slide: "slide";
        }>;
        duration: z.ZodOptional<z.ZodNumber>;
        easing: z.ZodOptional<z.ZodString>;
        direction: z.ZodOptional<z.ZodEnum<{
            left: "left";
            right: "right";
            up: "up";
            down: "down";
        }>>;
        keyframes: z.ZodOptional<z.ZodArray<z.ZodRecord<z.core.$ZodRecordKey, z.core.SomeType>>>;
    }, z.core.$strip>;
    metadata: z.ZodObject<{
        messageId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        sessionId: z.ZodOptional<z.ZodString>;
        priority: z.ZodOptional<z.ZodEnum<{
            high: "high";
            low: "low";
            normal: "normal";
        }>>;
        ttl: z.ZodOptional<z.ZodNumber>;
        agentId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    payload: z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"render">;
        layout: z.ZodObject<{
            type: z.ZodEnum<{
                absolute: "absolute";
                flex: "flex";
                grid: "grid";
                flow: "flow";
                stack: "stack";
            }>;
            direction: z.ZodOptional<z.ZodEnum<{
                column: "column";
                row: "row";
                "row-reverse": "row-reverse";
                "column-reverse": "column-reverse";
            }>>;
            gap: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
            columns: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
            rows: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
            align: z.ZodOptional<z.ZodEnum<{
                center: "center";
                end: "end";
                start: "start";
                baseline: "baseline";
                stretch: "stretch";
            }>>;
            justify: z.ZodOptional<z.ZodEnum<{
                center: "center";
                end: "end";
                start: "start";
                between: "between";
                around: "around";
                evenly: "evenly";
            }>>;
            wrap: z.ZodOptional<z.ZodBoolean>;
            padding: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString, z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>]>>;
        }, z.core.$strip>;
        components: z.ZodArray<z.ZodType<A2UIComponent, unknown, z.core.$ZodTypeInternals<A2UIComponent, unknown>>>;
        bindings: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            source: z.ZodEnum<{
                prop: "prop";
                signal: "signal";
                context: "context";
                query: "query";
            }>;
            path: z.ZodString;
            targetId: z.ZodString;
            targetProp: z.ZodString;
            transform: z.ZodOptional<z.ZodString>;
            defaultValue: z.ZodOptional<z.ZodUnknown>;
        }, z.core.$strip>>>;
        actions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            trigger: z.ZodEnum<{
                blur: "blur";
                change: "change";
                click: "click";
                focus: "focus";
                keydown: "keydown";
                submit: "submit";
                custom: "custom";
                hover: "hover";
            }>;
            customEvent: z.ZodOptional<z.ZodString>;
            handler: z.ZodDiscriminatedUnion<[z.ZodObject<{
                type: z.ZodLiteral<"emit">;
                event: z.ZodString;
                payload: z.ZodOptional<z.ZodUnknown>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"navigate">;
                to: z.ZodString;
                replace: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"signal">;
                action: z.ZodEnum<{
                    update: "update";
                    reset: "reset";
                    set: "set";
                }>;
                path: z.ZodString;
                value: z.ZodUnknown;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"agent">;
                intent: z.ZodString;
                context: z.ZodOptional<z.ZodRecord<z.core.$ZodRecordKey, z.core.SomeType>>;
                await: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>], "type">;
            debounce: z.ZodOptional<z.ZodNumber>;
            throttle: z.ZodOptional<z.ZodNumber>;
            preventDefault: z.ZodOptional<z.ZodBoolean>;
            stopPropagation: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"update">;
        targetId: z.ZodString;
        props: z.ZodOptional<z.ZodRecord<z.core.$ZodRecordKey, z.core.SomeType>>;
        children: z.ZodOptional<z.ZodArray<z.ZodType<A2UIComponent, unknown, z.core.$ZodTypeInternals<A2UIComponent, unknown>>>>;
        animation: z.ZodOptional<z.ZodObject<{
            type: z.ZodEnum<{
                custom: "custom";
                scale: "scale";
                fade: "fade";
                slide: "slide";
            }>;
            duration: z.ZodOptional<z.ZodNumber>;
            easing: z.ZodOptional<z.ZodString>;
            direction: z.ZodOptional<z.ZodEnum<{
                left: "left";
                right: "right";
                up: "up";
                down: "down";
            }>>;
            keyframes: z.ZodOptional<z.ZodArray<z.ZodRecord<z.core.$ZodRecordKey, z.core.SomeType>>>;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"action">;
        actionId: z.ZodString;
        event: z.ZodObject<{
            type: z.ZodString;
            data: z.ZodOptional<z.ZodUnknown>;
        }, z.core.$strip>;
        state: z.ZodOptional<z.ZodRecord<z.core.$ZodRecordKey, z.core.SomeType>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"query">;
        query: z.ZodEnum<{
            state: "state";
            components: "components";
            capabilities: "capabilities";
            layouts: "layouts";
        }>;
        filters: z.ZodOptional<z.ZodRecord<z.core.$ZodRecordKey, z.core.SomeType>>;
    }, z.core.$strip>], "type">;
};
//# sourceMappingURL=validator.d.ts.map