/**
 * SuperJSON integration for philjs-rpc
 * Enables automatic serialization/deserialization of complex types
 * including Date, Map, Set, RegExp, BigInt, undefined, and binary data.
 */

import {
  serialize,
  deserialize,
  type SuperJSONResult,
  type SerializeOptions,
  type DeserializeOptions,
  type CustomTypeHandler,
} from '@philjs/core/superjson';

import type {
  RPCRequest,
  RPCResponse,
  RPCBatchRequest,
  RPCBatchResponse,
  ProcedureDefinition,
  ProcedureType,
} from './types.js';

// ============================================================================
// Procedure Metadata for SuperJSON
// ============================================================================

/**
 * Symbol to mark procedures with SuperJSON serialization enabled.
 */
export const SUPERJSON_ENABLED = Symbol('superjson-enabled');

/**
 * Extended procedure definition with SuperJSON options.
 */
export interface SuperJSONProcedure<
  TType extends ProcedureType = ProcedureType,
  TInput = unknown,
  TOutput = unknown,
  TContext = unknown
> extends ProcedureDefinition<TType, TInput, TOutput, TContext> {
  [SUPERJSON_ENABLED]?: {
    serialize?: boolean;
    deserialize?: boolean;
    customTypes?: CustomTypeHandler[];
    serializeOptions?: Omit<SerializeOptions, 'customTypes'>;
    deserializeOptions?: Omit<DeserializeOptions, 'customTypes'>;
  };
}

// ============================================================================
// Request/Response Serialization
// ============================================================================

/**
 * Serialize RPC request with SuperJSON.
 */
export function serializeRequest(
  request: RPCRequest,
  options?: SerializeOptions
): RPCRequest {
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
export function deserializeRequest(
  request: RPCRequest,
  options?: DeserializeOptions
): RPCRequest {
  if (
    !request.input ||
    typeof request.input !== 'object' ||
    !('json' in request.input)
  ) {
    return request;
  }

  const deserialized = deserialize(
    request.input as SuperJSONResult,
    options
  );

  return {
    ...request,
    input: deserialized,
  };
}

/**
 * Serialize RPC response with SuperJSON.
 */
export function serializeResponse<T>(
  response: RPCResponse<T>,
  options?: SerializeOptions
): RPCResponse {
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
export function deserializeResponse<T>(
  response: RPCResponse,
  options?: DeserializeOptions
): RPCResponse<T> {
  if (
    !response.result ||
    typeof response.result.data !== 'object' ||
    !response.result.data ||
    !('json' in response.result.data)
  ) {
    return response as RPCResponse<T>;
  }

  const deserialized = deserialize<T>(
    response.result.data as SuperJSONResult,
    options
  );

  return {
    result: { data: deserialized },
  };
}

/**
 * Serialize batch RPC request.
 */
export function serializeBatchRequest(
  batch: RPCBatchRequest,
  options?: SerializeOptions
): RPCBatchRequest {
  return {
    requests: batch.requests.map(req => serializeRequest(req, options)),
  };
}

/**
 * Deserialize batch RPC request.
 */
export function deserializeBatchRequest(
  batch: RPCBatchRequest,
  options?: DeserializeOptions
): RPCBatchRequest {
  return {
    requests: batch.requests.map(req => deserializeRequest(req, options)),
  };
}

/**
 * Serialize batch RPC response.
 */
export function serializeBatchResponse(
  batch: RPCBatchResponse,
  options?: SerializeOptions
): RPCBatchResponse {
  return {
    responses: batch.responses.map(res => serializeResponse(res, options)),
  };
}

/**
 * Deserialize batch RPC response.
 */
export function deserializeBatchResponse<T>(
  batch: RPCBatchResponse,
  options?: DeserializeOptions
): RPCBatchResponse {
  return {
    responses: batch.responses.map(res => deserializeResponse<T>(res, options)),
  };
}

// ============================================================================
// Handler Options
// ============================================================================

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
export function createSuperJSONMiddleware(
  options: SuperJSONHandlerOptions = {}
) {
  const {
    enabled = true,
    customTypes = [],
    serializeOptions = {},
    deserializeOptions = {},
  } = options;

  return {
    /**
     * Transform request before processing (deserialize input).
     */
    transformRequest: (request: RPCRequest): RPCRequest => {
      if (!enabled) return request;

      return deserializeRequest(request, {
        ...deserializeOptions,
        customTypes,
      });
    },

    /**
     * Transform response before sending (serialize output).
     */
    transformResponse: <T>(response: RPCResponse<T>): RPCResponse => {
      if (!enabled) return response;

      return serializeResponse(response, {
        ...serializeOptions,
        customTypes,
      });
    },

    /**
     * Transform batch request.
     */
    transformBatchRequest: (batch: RPCBatchRequest): RPCBatchRequest => {
      if (!enabled) return batch;

      return deserializeBatchRequest(batch, {
        ...deserializeOptions,
        customTypes,
      });
    },

    /**
     * Transform batch response.
     */
    transformBatchResponse: (batch: RPCBatchResponse): RPCBatchResponse => {
      if (!enabled) return batch;

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
export function createClientRequestTransformer(
  options: SuperJSONHandlerOptions = {}
) {
  const {
    enabled = true,
    customTypes = [],
    serializeOptions = {},
  } = options;

  return (request: RPCRequest): RPCRequest => {
    if (!enabled) return request;

    return serializeRequest(request, {
      ...serializeOptions,
      customTypes,
    });
  };
}

/**
 * Create response transformer for client.
 */
export function createClientResponseTransformer<T = unknown>(
  options: SuperJSONHandlerOptions = {}
) {
  const {
    enabled = true,
    customTypes = [],
    deserializeOptions = {},
  } = options;

  return (response: RPCResponse): RPCResponse<T> => {
    if (!enabled) return response as RPCResponse<T>;

    return deserializeResponse<T>(response, {
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
export function withSuperJSON<T extends ProcedureDefinition>(
  procedure: T,
  options: Omit<SuperJSONHandlerOptions, 'enabled'> = {}
): SuperJSONProcedure {
  const enhanced = procedure as SuperJSONProcedure;

  const config: NonNullable<SuperJSONProcedure[typeof SUPERJSON_ENABLED]> = {
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
export function withoutSuperJSON<T extends ProcedureDefinition>(
  procedure: T
): T {
  const enhanced = procedure as SuperJSONProcedure;
  delete enhanced[SUPERJSON_ENABLED];
  return procedure;
}

/**
 * Check if a procedure has SuperJSON enabled.
 */
export function hasSuperJSON(
  procedure: ProcedureDefinition
): boolean {
  return SUPERJSON_ENABLED in procedure;
}

/**
 * Get SuperJSON options from a procedure.
 */
export function getSuperJSONOptions(
  procedure: ProcedureDefinition
): SuperJSONHandlerOptions | null {
  if (!hasSuperJSON(procedure)) {
    return null;
  }

  const options = (procedure as SuperJSONProcedure)[SUPERJSON_ENABLED];
  if (!options) return null;

  const result: SuperJSONHandlerOptions = {
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
export function createLazyDeserialized<T>(
  serialized: SuperJSONResult,
  options?: DeserializeOptions
): LazyDeserialized<T> {
  const lazy: LazyDeserialized<T> = {
    [LAZY_MARKER]: true,
    _serialized: serialized,
    get(): T {
      if (this._deserialized === undefined) {
        this._deserialized = deserialize<T>(this._serialized, this._options);
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
export function isLazyDeserialized<T>(
  value: unknown
): value is LazyDeserialized<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    LAZY_MARKER in value
  );
}

/**
 * Unwrap lazy-deserialized value.
 */
export function unwrapLazy<T>(value: T | LazyDeserialized<T>): T {
  if (isLazyDeserialized(value)) {
    return value.get();
  }
  return value;
}

// ============================================================================
// Streaming Support
// ============================================================================

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
export function createStreamingSerializer(
  options: SerializeOptions = {}
) {
  return function* serializeStream(
    data: unknown,
    chunkSize = 1000
  ): Generator<SuperJSONChunk> {
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
export function createStreamingDeserializer<T = unknown>(
  options: DeserializeOptions = {}
) {
  const chunks: unknown[] = [];
  let isArray = false;

  return {
    /**
     * Process a chunk.
     */
    processChunk(chunk: SuperJSONChunk): void {
      const deserialized = deserialize(chunk.data, options);

      if (chunk.index !== undefined) {
        isArray = true;
        if (Array.isArray(deserialized)) {
          chunks.push(...deserialized);
        } else {
          chunks.push(deserialized);
        }
      } else {
        chunks.push(deserialized);
      }
    },

    /**
     * Get the final deserialized result.
     */
    getResult(): T {
      if (isArray) {
        return chunks as T;
      }
      return (chunks.length === 1 ? chunks[0] : chunks) as T;
    },
  };
}
