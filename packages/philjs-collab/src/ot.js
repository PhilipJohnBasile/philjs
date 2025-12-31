/**
 * Operational Transformations for PhilJS Collab
 *
 * String-based OT for text editing with:
 * - Insert/Delete operations
 * - Transform functions for concurrent ops
 * - Operation composition
 * - History/Undo support
 */
/**
 * Apply an operation to a string
 */
export function applyOperation(text, op) {
    switch (op.type) {
        case 'insert':
            return text.slice(0, op.position) + op.text + text.slice(op.position);
        case 'delete':
            return text.slice(0, op.position) + text.slice(op.position + op.length);
        case 'retain':
            return text;
    }
}
/**
 * Apply multiple operations to a string
 */
export function applyOperations(text, ops) {
    let result = text;
    for (const op of ops) {
        result = applyOperation(result, op);
    }
    return result;
}
/**
 * Transform operation A against operation B
 *
 * Returns the transformed version of A that can be applied
 * after B has already been applied.
 */
export function transform(opA, opB, priority = 'left') {
    if (opA.type === 'insert' && opB.type === 'insert') {
        return transformInsertInsert(opA, opB, priority);
    }
    if (opA.type === 'insert' && opB.type === 'delete') {
        return transformInsertDelete(opA, opB);
    }
    if (opA.type === 'delete' && opB.type === 'insert') {
        return transformDeleteInsert(opA, opB);
    }
    if (opA.type === 'delete' && opB.type === 'delete') {
        return transformDeleteDelete(opA, opB);
    }
    // Retain operations don't need transformation
    return opA;
}
function transformInsertInsert(opA, opB, priority) {
    if (opA.position < opB.position || (opA.position === opB.position && priority === 'left')) {
        // A is before or at same position with priority
        return opA;
    }
    else {
        // A is after B's insertion
        return {
            ...opA,
            position: opA.position + opB.text.length,
        };
    }
}
function transformInsertDelete(opA, opB) {
    if (opA.position <= opB.position) {
        // Insert before delete
        return opA;
    }
    else if (opA.position >= opB.position + opB.length) {
        // Insert after delete
        return {
            ...opA,
            position: opA.position - opB.length,
        };
    }
    else {
        // Insert inside deleted region - move to start of deletion
        return {
            ...opA,
            position: opB.position,
        };
    }
}
function transformDeleteInsert(opA, opB) {
    if (opA.position + opA.length <= opB.position) {
        // Delete before insert
        return opA;
    }
    else if (opA.position >= opB.position) {
        // Delete after insert
        return {
            ...opA,
            position: opA.position + opB.text.length,
        };
    }
    else {
        // Delete spans insert - split into two parts conceptually
        // For simplicity, move delete after insert
        return {
            ...opA,
            position: opA.position,
            length: opA.length, // Length stays same, content shifted
        };
    }
}
function transformDeleteDelete(opA, opB) {
    if (opA.position + opA.length <= opB.position) {
        // A completely before B
        return opA;
    }
    else if (opA.position >= opB.position + opB.length) {
        // A completely after B
        return {
            ...opA,
            position: opA.position - opB.length,
        };
    }
    else if (opA.position >= opB.position && opA.position + opA.length <= opB.position + opB.length) {
        // A completely inside B - becomes no-op
        return {
            type: 'delete',
            position: opB.position,
            length: 0,
        };
    }
    else if (opA.position <= opB.position && opA.position + opA.length >= opB.position + opB.length) {
        // B completely inside A
        return {
            ...opA,
            length: opA.length - opB.length,
        };
    }
    else if (opA.position < opB.position) {
        // Overlap at end of A
        const overlap = opA.position + opA.length - opB.position;
        return {
            ...opA,
            length: opA.length - overlap,
        };
    }
    else {
        // Overlap at start of A
        const overlap = opB.position + opB.length - opA.position;
        return {
            ...opA,
            position: opB.position,
            length: opA.length - overlap,
        };
    }
}
/**
 * Transform a list of operations against another list
 */
export function transformOperations(opsA, opsB, priority = 'left') {
    let result = [...opsA];
    for (const opB of opsB) {
        result = result.map(opA => transform(opA, opB, priority));
    }
    return result;
}
/**
 * Compose two operations into one
 */
export function compose(opA, opB) {
    // Composing is complex - return both for now
    return [opA, opB];
}
/**
 * Invert an operation (for undo)
 */
export function invert(op, originalText) {
    switch (op.type) {
        case 'insert':
            return {
                type: 'delete',
                position: op.position,
                length: op.text.length,
            };
        case 'delete':
            return {
                type: 'insert',
                position: op.position,
                text: originalText.slice(op.position, op.position + op.length),
            };
        case 'retain':
            return op;
    }
}
/**
 * OT Client for managing local operations
 */
export class OTClient {
    document;
    revision = 0;
    pendingOps = [];
    sentOps = [];
    clientId;
    onSend;
    history = [];
    listeners = new Set();
    constructor(clientId, initialText = '') {
        this.clientId = clientId;
        this.document = initialText;
    }
    /**
     * Get current document text
     */
    getText() {
        return this.document;
    }
    /**
     * Get current revision
     */
    getRevision() {
        return this.revision;
    }
    /**
     * Apply a local operation
     */
    applyLocal(ops) {
        // Save for undo
        this.history.push({
            ops: ops.map(op => invert(op, this.document)),
            text: this.document,
        });
        // Apply to local document
        this.document = applyOperations(this.document, ops);
        // Queue for sending
        this.pendingOps.push(...ops);
        // Try to send
        this.flushPending();
        this.notifyListeners();
    }
    /**
     * Apply a remote operation
     */
    applyRemote(remote) {
        if (remote.clientId === this.clientId) {
            // Acknowledge our own operation
            this.sentOps = [];
            this.revision = remote.revision;
            return;
        }
        // Transform pending operations against remote
        this.pendingOps = transformOperations(this.pendingOps, remote.ops, 'right');
        // Transform sent operations against remote
        this.sentOps = transformOperations(this.sentOps, remote.ops, 'right');
        // Apply remote to document
        this.document = applyOperations(this.document, remote.ops);
        this.revision = remote.revision;
        this.notifyListeners();
    }
    /**
     * Connect send handler
     */
    onOperation(handler) {
        this.onSend = handler;
    }
    /**
     * Undo last local operation
     */
    undo() {
        const last = this.history.pop();
        if (!last)
            return false;
        this.applyLocal(last.ops);
        // Remove the undo from history (it creates its own entry)
        this.history.pop();
        return true;
    }
    /**
     * Subscribe to document changes
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    /**
     * Create insert operation
     */
    insert(position, text) {
        this.applyLocal([{ type: 'insert', position, text }]);
    }
    /**
     * Create delete operation
     */
    delete(position, length) {
        this.applyLocal([{ type: 'delete', position, length }]);
    }
    /**
     * Replace text range
     */
    replace(start, end, text) {
        const ops = [];
        if (end > start) {
            ops.push({ type: 'delete', position: start, length: end - start });
        }
        if (text.length > 0) {
            ops.push({ type: 'insert', position: start, text });
        }
        if (ops.length > 0) {
            this.applyLocal(ops);
        }
    }
    flushPending() {
        if (this.sentOps.length > 0 || this.pendingOps.length === 0) {
            return; // Wait for acknowledgment or no pending ops
        }
        this.sentOps = [...this.pendingOps];
        this.pendingOps = [];
        if (this.onSend) {
            this.onSend({
                id: `${this.clientId}-${Date.now()}`,
                clientId: this.clientId,
                revision: this.revision,
                ops: this.sentOps,
                timestamp: Date.now(),
            });
        }
    }
    notifyListeners() {
        for (const listener of this.listeners) {
            listener(this.document);
        }
    }
}
/**
 * OT Server for coordinating operations
 */
export class OTServer {
    document;
    revision = 0;
    operations = [];
    constructor(initialText = '') {
        this.document = initialText;
    }
    /**
     * Get current document text
     */
    getText() {
        return this.document;
    }
    /**
     * Get current revision
     */
    getRevision() {
        return this.revision;
    }
    /**
     * Receive an operation from a client
     */
    receive(op) {
        // Transform against all operations since client's revision
        let transformedOps = op.ops;
        for (let i = op.revision; i < this.operations.length; i++) {
            const serverOp = this.operations[i];
            if (serverOp) {
                transformedOps = transformOperations(transformedOps, serverOp.ops, 'right');
            }
        }
        // Apply to server document
        this.document = applyOperations(this.document, transformedOps);
        this.revision++;
        // Create acknowledged operation
        const acknowledged = {
            ...op,
            ops: transformedOps,
            revision: this.revision,
        };
        this.operations.push(acknowledged);
        return acknowledged;
    }
    /**
     * Get operations since a revision
     */
    getOperationsSince(revision) {
        return this.operations.slice(revision);
    }
}
/**
 * Create an OT client
 */
export function createOTClient(clientId, initialText) {
    return new OTClient(clientId, initialText);
}
/**
 * Create an OT server
 */
export function createOTServer(initialText) {
    return new OTServer(initialText);
}
//# sourceMappingURL=ot.js.map