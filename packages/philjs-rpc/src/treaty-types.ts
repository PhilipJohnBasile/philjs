/**
 * Advanced type utilities for treaty client type inference.
 * Provides sophisticated type extraction and manipulation for full type safety.
 */

import type { ProcedureDefinition, ProcedureType, Router } from './types.js';

// ============================================================================
// Path Parameter Extraction
// ============================================================================

/**
 * Extract path parameter names from a path string.
 *
 * @example
 * ExtractPathParamNames<"/users/:id/posts/:postId"> = "id" | "postId"
 */
export type ExtractPathParamNames<T extends string> =
  T extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? Param | ExtractPathParamNames<Rest>
    : T extends `${infer _Start}:${infer Param}`
    ? Param
    : never;

/**
 * Extract path parameters as an object type.
 *
 * @example
 * ExtractPathParams<"/users/:id/posts/:postId"> = { id: string; postId: string }
 */
export type ExtractPathParams<T extends string> = {
  [K in ExtractPathParamNames<T>]: string | number;
};

/**
 * Check if a path has parameters.
 */
export type HasPathParams<T extends string> = ExtractPathParamNames<T> extends never ? false : true;

// ============================================================================
// Schema Type Extraction
// ============================================================================

/**
 * Extract query parameters from input type.
 */
export type ExtractQueryParams<TInput> = TInput extends { query: infer Q }
  ? Q
  : TInput extends { params: infer P }
  ? P
  : never;

/**
 * Extract body/payload from input type.
 */
export type ExtractBody<TInput> = TInput extends { body: infer B }
  ? B
  : TInput extends { data: infer D }
  ? D
  : TInput extends { query: unknown }
  ? never
  : TInput extends { params: unknown }
  ? never
  : TInput extends void
  ? never
  : TInput;

/**
 * Extract headers from input type.
 */
export type ExtractHeaders<TInput> = TInput extends { headers: infer H }
  ? H
  : never;

/**
 * Extract cookies from input type.
 */
export type ExtractCookies<TInput> = TInput extends { cookies: infer C }
  ? C
  : never;

// ============================================================================
// Response Type Extraction
// ============================================================================

/**
 * Extract the output type from a procedure.
 */
export type InferOutput<TProcedure> = TProcedure extends ProcedureDefinition<
  ProcedureType,
  unknown,
  infer TOutput,
  unknown
>
  ? TOutput
  : never;

/**
 * Extract the input type from a procedure.
 */
export type InferInput<TProcedure> = TProcedure extends ProcedureDefinition<
  ProcedureType,
  infer TInput,
  unknown,
  unknown
>
  ? TInput
  : never;

/**
 * Extract the procedure type.
 */
export type InferProcedureType<TProcedure> = TProcedure extends ProcedureDefinition<
  infer TType,
  unknown,
  unknown,
  unknown
>
  ? TType
  : never;

// ============================================================================
// Error Type Extraction
// ============================================================================

/**
 * Extract possible error types from a procedure.
 */
export type InferErrors<TProcedure> = TProcedure extends ProcedureDefinition<
  ProcedureType,
  unknown,
  unknown,
  unknown
>
  ? TProcedure extends { _errors?: infer E }
    ? E
    : Error
  : never;

/**
 * Union of all possible error codes.
 */
export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'TIMEOUT'
  | 'CONFLICT'
  | 'PRECONDITION_FAILED'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNPROCESSABLE_ENTITY'
  | 'TOO_MANY_REQUESTS'
  | 'CLIENT_CLOSED_REQUEST'
  | 'INTERNAL_SERVER_ERROR'
  | 'NETWORK_ERROR';

/**
 * Typed error response.
 */
export interface TypedError<TCode extends ErrorCode = ErrorCode, TData = unknown> {
  code: TCode;
  message: string;
  data?: TData;
  stack?: string;
}

// ============================================================================
// WebSocket Type Extraction
// ============================================================================

/**
 * Extract WebSocket message type from procedure.
 */
export type InferWSMessage<TProcedure> = TProcedure extends {
  _ws?: { message: infer M };
}
  ? M
  : never;

/**
 * Extract WebSocket send type from procedure.
 */
export type InferWSSend<TProcedure> = TProcedure extends {
  _ws?: { send: infer S };
}
  ? S
  : never;

/**
 * Check if procedure is a WebSocket endpoint.
 */
export type IsWebSocket<TProcedure> = TProcedure extends {
  _ws?: unknown;
}
  ? true
  : false;

// ============================================================================
// Middleware Type Extraction
// ============================================================================

/**
 * Extract middleware context extensions.
 */
export type InferMiddlewareContext<TMiddleware> = TMiddleware extends {
  _context: infer C;
}
  ? C
  : {};

/**
 * Merge multiple context types.
 */
export type MergeContexts<T extends readonly unknown[]> = T extends readonly [
  infer First,
  ...infer Rest
]
  ? InferMiddlewareContext<First> & MergeContexts<Rest>
  : {};

// ============================================================================
// File Upload Type Extraction
// ============================================================================

/**
 * File upload type.
 */
export interface FileUpload {
  name: string;
  size: number;
  type: string;
  data: ArrayBuffer | Blob;
}

/**
 * Extract file upload fields from input.
 */
export type ExtractFiles<TInput> = TInput extends { files: infer F }
  ? F
  : TInput extends { file: infer F }
  ? F
  : never;

/**
 * Check if input accepts file uploads.
 */
export type AcceptsFiles<TInput> = ExtractFiles<TInput> extends never ? false : true;

// ============================================================================
// Request Method Mapping
// ============================================================================

/**
 * Map procedure type to HTTP method.
 */
export type ProcedureTypeToMethod<T extends ProcedureType> = T extends 'query'
  ? 'GET'
  : T extends 'mutation'
  ? 'POST'
  : never;

/**
 * All supported HTTP methods.
 */
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

// ============================================================================
// Route Path Construction
// ============================================================================

/**
 * Build full path from router segments.
 */
export type BuildPath<
  TSegments extends readonly string[],
  TSep extends string = '.'
> = TSegments extends readonly [infer First extends string, ...infer Rest extends readonly string[]]
  ? Rest extends readonly []
    ? First
    : `${First}${TSep}${BuildPath<Rest, TSep>}`
  : never;

/**
 * Extract all paths from a router.
 */
export type ExtractPaths<
  TRouter extends Router,
  TPrefix extends string = ''
> = {
  [K in keyof TRouter]: TRouter[K] extends ProcedureDefinition<
    ProcedureType,
    unknown,
    unknown,
    unknown
  >
    ? TPrefix extends ''
      ? K & string
      : `${TPrefix}.${K & string}`
    : TRouter[K] extends Router
    ? ExtractPaths<
        TRouter[K],
        TPrefix extends '' ? K & string : `${TPrefix}.${K & string}`
      >
    : never;
}[keyof TRouter];

/**
 * Get procedure at a specific path.
 */
export type GetProcedureAtPath<
  TRouter extends Router,
  TPath extends string
> = TPath extends `${infer First}.${infer Rest}`
  ? First extends keyof TRouter
    ? TRouter[First] extends Router
      ? GetProcedureAtPath<TRouter[First], Rest>
      : never
    : never
  : TPath extends keyof TRouter
  ? TRouter[TPath]
  : never;

// ============================================================================
// Utility Type Helpers
// ============================================================================

/**
 * Make specific properties optional.
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required.
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Deep partial type.
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/**
 * Deep readonly type.
 */
export type DeepReadonly<T> = T extends object
  ? {
      readonly [P in keyof T]: DeepReadonly<T[P]>;
    }
  : T;

/**
 * Unwrap Promise type.
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * Unwrap array type.
 */
export type UnwrapArray<T> = T extends (infer U)[] ? U : T;

/**
 * Check if type is never.
 */
export type IsNever<T> = [T] extends [never] ? true : false;

/**
 * Check if type is unknown.
 */
export type IsUnknown<T> = unknown extends T ? (T extends unknown ? true : false) : false;

/**
 * Check if two types are equal.
 */
export type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
  ? true
  : false;

/**
 * Pretty print type (for better IDE hints).
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

// ============================================================================
// Branded Types
// ============================================================================

/**
 * Create a branded type for nominal typing.
 */
export type Brand<T, TBrand extends string> = T & { __brand: TBrand };

/**
 * Extract the value from a branded type.
 */
export type Unbrand<T> = T extends Brand<infer V, string> ? V : T;

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Valid input type (non-void, non-undefined).
 */
export type ValidInput<T> = T extends void
  ? never
  : T extends undefined
  ? never
  : T;

/**
 * Check if input is required.
 */
export type IsInputRequired<T> = ValidInput<T> extends never ? false : true;

/**
 * Optional input wrapper.
 */
export type OptionalInput<T> = IsInputRequired<T> extends true ? T : T | undefined;

// ============================================================================
// Type Assertion Helpers
// ============================================================================

/**
 * Assert that a type extends another type.
 */
export type Assert<T, U extends T> = U;

/**
 * Assert that two types are equal.
 */
export type AssertEquals<T, U> = Equals<T, U> extends true ? T : never;

/**
 * Type-safe keys.
 */
export type Keys<T> = keyof T;

/**
 * Type-safe values.
 */
export type Values<T> = T[keyof T];

/**
 * Get required keys from an object.
 */
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

/**
 * Get optional keys from an object.
 */
export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];
