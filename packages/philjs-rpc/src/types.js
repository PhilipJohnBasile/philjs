/**
 * Type utilities for end-to-end type inference in philjs-rpc.
 * Provides the foundation for type-safe RPC communication.
 */
/**
 * HTTP status codes for RPC errors.
 */
export const RPC_ERROR_CODES_TO_HTTP = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    TIMEOUT: 408,
    CONFLICT: 409,
    PRECONDITION_FAILED: 412,
    PAYLOAD_TOO_LARGE: 413,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    CLIENT_CLOSED_REQUEST: 499,
    INTERNAL_SERVER_ERROR: 500,
};
/**
 * RPC Error class for typed error handling.
 */
export class RPCError extends Error {
    code;
    cause;
    constructor(opts) {
        super(opts.message);
        this.name = 'RPCError';
        this.code = opts.code;
        this.cause = opts.cause;
    }
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
        };
    }
}
//# sourceMappingURL=types.js.map