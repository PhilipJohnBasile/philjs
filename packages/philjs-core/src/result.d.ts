/**
 * Rust-inspired Result type for ergonomic error handling.
 */
export type Result<T, E> = Ok<T> | Err<E>;
export type Ok<T> = {
    readonly ok: true;
    readonly value: T;
};
export type Err<E> = {
    readonly ok: false;
    readonly error: E;
};
export declare function Ok<T>(value: T): Result<T, never>;
export declare function Err<E>(error: E): Result<never, E>;
export declare function isResult<T, E>(value: unknown): value is Result<T, E>;
export declare function isOk<T, E>(result: Result<T, E>): result is Ok<T>;
export declare function isErr<T, E>(result: Result<T, E>): result is Err<E>;
export declare function map<T, E, U>(result: Result<T, E>, fn: (value: T) => U): Result<U, E>;
export declare function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F>;
export declare function andThen<T, E, U>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E>;
export declare function unwrap<T, E>(result: Result<T, E>): T;
export declare function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T;
export declare function matchResult<T, E, U>(result: Result<T, E>, handlers: {
    ok: (value: T) => U;
    err: (error: E) => U;
}): U;
//# sourceMappingURL=result.d.ts.map