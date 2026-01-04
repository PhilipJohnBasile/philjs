/**
 * Rust-inspired Result type for ergonomic error handling.
 */
export function Ok(value) {
    return { ok: true, value };
}
export function Err(error) {
    return { ok: false, error };
}
export function isResult(value) {
    if (typeof value !== "object" || value === null)
        return false;
    const candidate = value;
    if (typeof candidate.ok !== "boolean")
        return false;
    return candidate.ok ? "value" in candidate : "error" in candidate;
}
export function isOk(result) {
    return result.ok;
}
export function isErr(result) {
    return !result.ok;
}
export function map(result, fn) {
    return result.ok ? Ok(fn(result.value)) : result;
}
export function mapErr(result, fn) {
    return result.ok ? result : Err(fn(result.error));
}
export function andThen(result, fn) {
    return result.ok ? fn(result.value) : result;
}
export function unwrap(result) {
    if (result.ok)
        return result.value;
    throw new Error(safeErrorMessage(result.error));
}
export function unwrapOr(result, fallback) {
    return result.ok ? result.value : fallback;
}
export function matchResult(result, handlers) {
    return result.ok ? handlers.ok(result.value) : handlers.err(result.error);
}
function safeErrorMessage(error) {
    if (error instanceof Error)
        return error.message;
    try {
        return JSON.stringify(error);
    }
    catch {
        return String(error);
    }
}
//# sourceMappingURL=result.js.map