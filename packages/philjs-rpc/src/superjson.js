/**
 * SuperJSON integration for philjs-rpc
 * Enables automatic serialization/deserialization of complex types
 * including Date, Map, Set, RegExp, BigInt, undefined, and binary data.
 */
import { serialize, deserialize, } from 'philjs-core/superjson';
// ============================================================================
// Procedure Metadata for SuperJSON
// ============================================================================
/**
 * Symbol to mark procedures with SuperJSON serialization enabled.
 */
export const SUPERJSON_ENABLED = Symbol('superjson-enabled');
// ============================================================================
// Request/Response Serialization
// ============================================================================
/**
 * Serialize RPC request with SuperJSON.
 */
export function serializeRequest(request, options) {
    if (request.input === undefined) {
        return request;
    }
    const serialized = serialize(request.input, options);
    return {
        ...request,
        input: serialized,
    };
}
/**
 * Deserialize RPC request with SuperJSON.
 */
export function deserializeRequest(request, options) {
    if (!request.input ||
        typeof request.input !== 'object' ||
        !('json' in request.input)) {
        return request;
    }
    const deserialized = deserialize(request.input, options);
    return {
        ...request,
        input: deserialized,
    };
}
/**
 * Serialize RPC response with SuperJSON.
 */
export function serializeResponse(response, options) {
    if (!response.result) {
        return response;
    }
    const serialized = serialize(response.result.data, options);
    return {
        result: { data: serialized },
    };
}
/**
 * Deserialize RPC response with SuperJSON.
 */
export function deserializeResponse(response, options) {
    if (!response.result ||
        typeof response.result.data !== 'object' ||
        !response.result.data ||
        !('json' in response.result.data)) {
        return response;
    }
    const deserialized = deserialize(response.result.data, options);
    return {
        result: { data: deserialized },
    };
}
/**
 * Serialize batch RPC request.
 */
export function serializeBatchRequest(batch, options) {
    return {
        requests: batch.requests.map(req => serializeRequest(req, options)),
    };
}
/**
 * Deserialize batch RPC request.
 */
export function deserializeBatchRequest(batch, options) {
    return {
        requests: batch.requests.map(req => deserializeRequest(req, options)),
    };
}
/**
 * Serialize batch RPC response.
 */
export function serializeBatchResponse(batch, options) {
    return {
        responses: batch.responses.map(res => serializeResponse(res, options)),
    };
}
/**
 * Deserialize batch RPC response.
 */
export function deserializeBatchResponse(batch, options) {
    return {
        responses: batch.responses.map(res => deserializeResponse(res, options)),
    };
}
/**
 * Create a middleware for automatic SuperJSON serialization/deserialization.
 */
export function createSuperJSONMiddleware(options = {}) {
    const { enabled = true, customTypes = [], serializeOptions = {}, deserializeOptions = {}, } = options;
    return {
        /**
         * Transform request before processing (deserialize input).
         */
        transformRequest: (request) => {
            if (!enabled)
                return request;
            return deserializeRequest(request, {
                ...deserializeOptions,
                customTypes,
            });
        },
        /**
         * Transform response before sending (serialize output).
         */
        transformResponse: (response) => {
            if (!enabled)
                return response;
            return serializeResponse(response, {
                ...serializeOptions,
                customTypes,
            });
        },
        /**
         * Transform batch request.
         */
        transformBatchRequest: (batch) => {
            if (!enabled)
                return batch;
            return deserializeBatchRequest(batch, {
                ...deserializeOptions,
                customTypes,
            });
        },
        /**
         * Transform batch response.
         */
        transformBatchResponse: (batch) => {
            if (!enabled)
                return batch;
            return serializeBatchResponse(batch, {
                ...serializeOptions,
                customTypes,
            });
        },
    };
}
// ============================================================================
// Client-Side Transformers
// ============================================================================
/**
 * Create request transformer for client.
 */
export function createClientRequestTransformer(options = {}) {
    const { enabled = true, customTypes = [], serializeOptions = {}, } = options;
    return (request) => {
        if (!enabled)
            return request;
        return serializeRequest(request, {
            ...serializeOptions,
            customTypes,
        });
    };
}
/**
 * Create response transformer for client.
 */
export function createClientResponseTransformer(options = {}) {
    const { enabled = true, customTypes = [], deserializeOptions = {}, } = options;
    return (response) => {
        if (!enabled)
            return response;
        return deserializeResponse(response, {
            ...deserializeOptions,
            customTypes,
        });
    };
}
// ============================================================================
// Procedure Builder Integration
// ============================================================================
/**
 * Enable SuperJSON for a procedure.
 */
export function withSuperJSON(procedure, options = {}) {
    const enhanced = procedure;
    const config = {
        serialize: true,
        deserialize: true,
    };
    if (options.customTypes !== undefined) {
        config.customTypes = options.customTypes;
    }
    if (options.serializeOptions !== undefined) {
        config.serializeOptions = options.serializeOptions;
    }
    if (options.deserializeOptions !== undefined) {
        config.deserializeOptions = options.deserializeOptions;
    }
    enhanced[SUPERJSON_ENABLED] = config;
    return enhanced;
}
/**
 * Disable SuperJSON for a procedure.
 */
export function withoutSuperJSON(procedure) {
    const enhanced = procedure;
    delete enhanced[SUPERJSON_ENABLED];
    return procedure;
}
/**
 * Check if a procedure has SuperJSON enabled.
 */
export function hasSuperJSON(procedure) {
    return SUPERJSON_ENABLED in procedure;
}
/**
 * Get SuperJSON options from a procedure.
 */
export function getSuperJSONOptions(procedure) {
    if (!hasSuperJSON(procedure)) {
        return null;
    }
    const options = procedure[SUPERJSON_ENABLED];
    if (!options)
        return null;
    const result = {
        enabled: true,
    };
    if (options.customTypes !== undefined) {
        result.customTypes = options.customTypes;
    }
    if (options.serializeOptions !== undefined) {
        result.serializeOptions = options.serializeOptions;
    }
    if (options.deserializeOptions !== undefined) {
        result.deserializeOptions = options.deserializeOptions;
    }
    return result;
}
// ============================================================================
// Lazy Deserialization Support
// ============================================================================
/**
 * Marker for lazy-deserialized data.
 */
export const LAZY_MARKER = Symbol('lazy-superjson');
/**
 * Create a lazy-deserialized wrapper.
 */
export function createLazyDeserialized(serialized, options) {
    const lazy = {
        [LAZY_MARKER]: true,
        _serialized: serialized,
        get() {
            if (this._deserialized === undefined) {
                this._deserialized = deserialize(this._serialized, this._options);
            }
            return this._deserialized;
        },
    };
    if (options !== undefined) {
        lazy._options = options;
    }
    return lazy;
}
/**
 * Check if a value is lazy-deserialized.
 */
export function isLazyDeserialized(value) {
    return (typeof value === 'object' &&
        value !== null &&
        LAZY_MARKER in value);
}
/**
 * Unwrap lazy-deserialized value.
 */
export function unwrapLazy(value) {
    if (isLazyDeserialized(value)) {
        return value.get();
    }
    return value;
}
/**
 * Create a streaming serializer for large payloads.
 */
export function createStreamingSerializer(options = {}) {
    return function* serializeStream(data, chunkSize = 1000) {
        // For arrays, we can stream individual items
        if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i += chunkSize) {
                const chunk = data.slice(i, i + chunkSize);
                const serialized = serialize(chunk, options);
                yield {
                    data: serialized,
                    index: i,
                    final: i + chunkSize >= data.length,
                };
            }
            return;
        }
        // For single items, serialize as-is
        const serialized = serialize(data, options);
        yield { data: serialized, final: true };
    };
}
/**
 * Create a streaming deserializer for large payloads.
 */
export function createStreamingDeserializer(options = {}) {
    const chunks = [];
    let isArray = false;
    return {
        /**
         * Process a chunk.
         */
        processChunk(chunk) {
            const deserialized = deserialize(chunk.data, options);
            if (chunk.index !== undefined) {
                isArray = true;
                if (Array.isArray(deserialized)) {
                    chunks.push(...deserialized);
                }
                else {
                    chunks.push(deserialized);
                }
            }
            else {
                chunks.push(deserialized);
            }
        },
        /**
         * Get the final deserialized result.
         */
        getResult() {
            if (isArray) {
                return chunks;
            }
            return (chunks.length === 1 ? chunks[0] : chunks);
        },
    };
}
//# sourceMappingURL=superjson.js.map