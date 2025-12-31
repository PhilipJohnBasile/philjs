/**
 * SuperJSON integration for philjs-rpc
 * Enables automatic serialization/deserialization of complex types
 * including Date, Map, Set, RegExp, BigInt, undefined, and binary data.
 */
import { type SuperJSONResult, type SerializeOptions, type DeserializeOptions, type CustomTypeHandler } from 'philjs-core/superjson';
import type { RPCRequest, RPCResponse, RPCBatchRequest, RPCBatchResponse, ProcedureDefinition, ProcedureType } from './types.js';
/**
 * Symbol to mark procedures with SuperJSON serialization enabled.
 */
export declare const SUPERJSON_ENABLED: unique symbol;
/**
 * Extended procedure definition with SuperJSON options.
 */
export interface SuperJSONProcedure<TType extends ProcedureType = ProcedureType, TInput = unknown, TOutput = unknown, TContext = unknown> extends ProcedureDefinition<TType, TInput, TOutput, TContext> {
    [SUPERJSON_ENABLED]?: {
        serialize?: boolean;
        deserialize?: boolean;
        customTypes?: CustomTypeHandler[];
        serializeOptions?: Omit<SerializeOptions, 'customTypes'>;
        deserializeOptions?: Omit<DeserializeOptions, 'customTypes'>;
    };
}
/**
 * Serialize RPC request with SuperJSON.
 */
export declare function serializeRequest(request: RPCRequest, options?: SerializeOptions): RPCRequest;
/**
 * Deserialize RPC request with SuperJSON.
 */
export declare function deserializeRequest(request: RPCRequest, options?: DeserializeOptions): RPCRequest;
/**
 * Serialize RPC response with SuperJSON.
 */
export declare function serializeResponse<T>(response: RPCResponse<T>, options?: SerializeOptions): RPCResponse;
/**
 * Deserialize RPC response with SuperJSON.
 */
export declare function deserializeResponse<T>(response: RPCResponse, options?: DeserializeOptions): RPCResponse<T>;
/**
 * Serialize batch RPC request.
 */
export declare function serializeBatchRequest(batch: RPCBatchRequest, options?: SerializeOptions): RPCBatchRequest;
/**
 * Deserialize batch RPC request.
 */
export declare function deserializeBatchRequest(batch: RPCBatchRequest, options?: DeserializeOptions): RPCBatchRequest;
/**
 * Serialize batch RPC response.
 */
export declare function serializeBatchResponse(batch: RPCBatchResponse, options?: SerializeOptions): RPCBatchResponse;
/**
 * Deserialize batch RPC response.
 */
export declare function deserializeBatchResponse<T>(batch: RPCBatchResponse, options?: DeserializeOptions): RPCBatchResponse;
/**
 * Options for SuperJSON in RPC handlers.
 */
export interface SuperJSONHandlerOptions {
    /** Enable SuperJSON serialization (default: true) */
    enabled?: boolean;
    /** Custom type handlers */
    customTypes?: CustomTypeHandler[];
    /** Serialization options */
    serializeOptions?: Omit<SerializeOptions, 'customTypes'>;
    /** Deserialization options */
    deserializeOptions?: Omit<DeserializeOptions, 'customTypes'>;
}
/**
 * Create a middleware for automatic SuperJSON serialization/deserialization.
 */
export declare function createSuperJSONMiddleware(options?: SuperJSONHandlerOptions): {
    /**
     * Transform request before processing (deserialize input).
     */
    transformRequest: (request: RPCRequest) => RPCRequest;
    /**
     * Transform response before sending (serialize output).
     */
    transformResponse: <T>(response: RPCResponse<T>) => RPCResponse;
    /**
     * Transform batch request.
     */
    transformBatchRequest: (batch: RPCBatchRequest) => RPCBatchRequest;
    /**
     * Transform batch response.
     */
    transformBatchResponse: (batch: RPCBatchResponse) => RPCBatchResponse;
};
/**
 * Create request transformer for client.
 */
export declare function createClientRequestTransformer(options?: SuperJSONHandlerOptions): (request: RPCRequest) => RPCRequest;
/**
 * Create response transformer for client.
 */
export declare function createClientResponseTransformer<T = unknown>(options?: SuperJSONHandlerOptions): (response: RPCResponse) => RPCResponse<T>;
/**
 * Enable SuperJSON for a procedure.
 */
export declare function withSuperJSON<T extends ProcedureDefinition>(procedure: T, options?: Omit<SuperJSONHandlerOptions, 'enabled'>): SuperJSONProcedure;
/**
 * Disable SuperJSON for a procedure.
 */
export declare function withoutSuperJSON<T extends ProcedureDefinition>(procedure: T): T;
/**
 * Check if a procedure has SuperJSON enabled.
 */
export declare function hasSuperJSON(procedure: ProcedureDefinition): boolean;
/**
 * Get SuperJSON options from a procedure.
 */
export declare function getSuperJSONOptions(procedure: ProcedureDefinition): SuperJSONHandlerOptions | null;
/**
 * Marker for lazy-deserialized data.
 */
export declare const LAZY_MARKER: unique symbol;
/**
 * Lazy-deserialized wrapper.
 */
export interface LazyDeserialized<T> {
    [LAZY_MARKER]: true;
    _serialized: SuperJSONResult;
    _options?: DeserializeOptions;
    _deserialized?: T;
    get(): T;
}
/**
 * Create a lazy-deserialized wrapper.
 */
export declare function createLazyDeserialized<T>(serialized: SuperJSONResult, options?: DeserializeOptions): LazyDeserialized<T>;
/**
 * Check if a value is lazy-deserialized.
 */
export declare function isLazyDeserialized<T>(value: unknown): value is LazyDeserialized<T>;
/**
 * Unwrap lazy-deserialized value.
 */
export declare function unwrapLazy<T>(value: T | LazyDeserialized<T>): T;
/**
 * Stream chunk with SuperJSON metadata.
 */
export interface SuperJSONChunk {
    data: SuperJSONResult;
    index?: number;
    final?: boolean;
}
/**
 * Create a streaming serializer for large payloads.
 */
export declare function createStreamingSerializer(options?: SerializeOptions): (data: unknown, chunkSize?: number) => Generator<SuperJSONChunk>;
/**
 * Create a streaming deserializer for large payloads.
 */
export declare function createStreamingDeserializer<T = unknown>(options?: DeserializeOptions): {
    /**
     * Process a chunk.
     */
    processChunk(chunk: SuperJSONChunk): void;
    /**
     * Get the final deserialized result.
     */
    getResult(): T;
};
//# sourceMappingURL=superjson.d.ts.map