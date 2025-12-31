/**
 * Operational Transformations for PhilJS Collab
 *
 * String-based OT for text editing with:
 * - Insert/Delete operations
 * - Transform functions for concurrent ops
 * - Operation composition
 * - History/Undo support
 */
export type Operation = InsertOp | DeleteOp | RetainOp;
export interface InsertOp {
    type: 'insert';
    position: number;
    text: string;
}
export interface DeleteOp {
    type: 'delete';
    position: number;
    length: number;
}
export interface RetainOp {
    type: 'retain';
    count: number;
}
export interface OperationWithMeta {
    id: string;
    clientId: string;
    revision: number;
    ops: Operation[];
    timestamp: number;
}
/**
 * Apply an operation to a string
 */
export declare function applyOperation(text: string, op: Operation): string;
/**
 * Apply multiple operations to a string
 */
export declare function applyOperations(text: string, ops: Operation[]): string;
/**
 * Transform operation A against operation B
 *
 * Returns the transformed version of A that can be applied
 * after B has already been applied.
 */
export declare function transform(opA: Operation, opB: Operation, priority?: 'left' | 'right'): Operation;
/**
 * Transform a list of operations against another list
 */
export declare function transformOperations(opsA: Operation[], opsB: Operation[], priority?: 'left' | 'right'): Operation[];
/**
 * Compose two operations into one
 */
export declare function compose(opA: Operation, opB: Operation): Operation[];
/**
 * Invert an operation (for undo)
 */
export declare function invert(op: Operation, originalText: string): Operation;
/**
 * OT Client for managing local operations
 */
export declare class OTClient {
    private document;
    private revision;
    private pendingOps;
    private sentOps;
    private clientId;
    private onSend?;
    private history;
    private listeners;
    constructor(clientId: string, initialText?: string);
    /**
     * Get current document text
     */
    getText(): string;
    /**
     * Get current revision
     */
    getRevision(): number;
    /**
     * Apply a local operation
     */
    applyLocal(ops: Operation[]): void;
    /**
     * Apply a remote operation
     */
    applyRemote(remote: OperationWithMeta): void;
    /**
     * Connect send handler
     */
    onOperation(handler: (ops: OperationWithMeta) => void): void;
    /**
     * Undo last local operation
     */
    undo(): boolean;
    /**
     * Subscribe to document changes
     */
    subscribe(listener: (text: string) => void): () => void;
    /**
     * Create insert operation
     */
    insert(position: number, text: string): void;
    /**
     * Create delete operation
     */
    delete(position: number, length: number): void;
    /**
     * Replace text range
     */
    replace(start: number, end: number, text: string): void;
    private flushPending;
    private notifyListeners;
}
/**
 * OT Server for coordinating operations
 */
export declare class OTServer {
    private document;
    private revision;
    private operations;
    constructor(initialText?: string);
    /**
     * Get current document text
     */
    getText(): string;
    /**
     * Get current revision
     */
    getRevision(): number;
    /**
     * Receive an operation from a client
     */
    receive(op: OperationWithMeta): OperationWithMeta;
    /**
     * Get operations since a revision
     */
    getOperationsSince(revision: number): OperationWithMeta[];
}
/**
 * Create an OT client
 */
export declare function createOTClient(clientId: string, initialText?: string): OTClient;
/**
 * Create an OT server
 */
export declare function createOTServer(initialText?: string): OTServer;
//# sourceMappingURL=ot.d.ts.map