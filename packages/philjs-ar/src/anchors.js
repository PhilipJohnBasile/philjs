/**
 * @philjs/ar - AR Anchors Module
 *
 * Persistent anchor management for AR object placement.
 * Anchors maintain position and orientation across session restarts.
 */
import { signal, effect } from '@philjs/core';
/**
 * Manages AR anchors for persistent object placement
 */
export class AnchorManager {
    anchors = new Map();
    xrAnchors = new Map();
    session = null;
    refSpace = null;
    config;
    eventHandlers = new Map();
    anchorIdCounter = 0;
    // Reactive state
    anchorCount = signal(0);
    anchorsSignal = signal([]);
    constructor(config = {}) {
        this.config = {
            maxAnchors: config.maxAnchors ?? 100,
            persistAnchors: config.persistAnchors ?? true,
            storageKey: config.storageKey ?? 'philjs-ar-anchors',
        };
        const eventTypes = ['create', 'update', 'delete', 'restore', 'error'];
        for (const type of eventTypes) {
            this.eventHandlers.set(type, new Set());
        }
    }
    /**
     * Initialize with an XR session
     */
    initialize(session, refSpace) {
        this.session = session;
        this.refSpace = refSpace;
        // Listen for anchor tracking updates
        session.addEventListener('end', () => {
            this.persistAnchorsToStorage();
        });
    }
    /**
     * Create an anchor at the given pose
     */
    async createAnchor(pose, userData) {
        if (!this.session || !this.refSpace) {
            this.emitEvent('error', undefined, new Error('No active XR session'));
            return null;
        }
        if (this.anchors.size >= (this.config.maxAnchors ?? 100)) {
            this.emitEvent('error', undefined, new Error(`Maximum anchor limit (${this.config.maxAnchors}) reached`));
            return null;
        }
        try {
            // Create XRRigidTransform from pose
            const transform = new XRRigidTransform({ x: pose.position[0], y: pose.position[1], z: pose.position[2], w: 1 }, { x: pose.orientation[0], y: pose.orientation[1], z: pose.orientation[2], w: pose.orientation[3] });
            // Create the XR anchor
            const xrAnchor = await this.session.createAnchor?.(transform, this.refSpace);
            if (!xrAnchor) {
                throw new Error('Failed to create XR anchor');
            }
            const anchorId = `anchor-${++this.anchorIdCounter}`;
            const anchor = {
                id: anchorId,
                pose: {
                    position: new Float32Array(pose.position),
                    orientation: new Float32Array(pose.orientation),
                    matrix: new Float32Array(pose.matrix),
                },
                createdAt: Date.now(),
                userData,
            };
            this.anchors.set(anchorId, anchor);
            this.xrAnchors.set(anchorId, xrAnchor);
            this.updateSignals();
            this.emitEvent('create', anchor);
            return anchor;
        }
        catch (error) {
            this.emitEvent('error', undefined, error);
            return null;
        }
    }
    /**
     * Create an anchor from a hit test result
     */
    async createAnchorFromHitTest(hitResult, userData) {
        if (!this.session || !this.refSpace) {
            return null;
        }
        try {
            const xrAnchor = await hitResult.createAnchor?.();
            if (!xrAnchor) {
                return null;
            }
            const anchorId = `anchor-${++this.anchorIdCounter}`;
            const pose = hitResult.getPose(this.refSpace);
            if (!pose) {
                return null;
            }
            const anchor = {
                id: anchorId,
                pose: {
                    position: new Float32Array([
                        pose.transform.position.x,
                        pose.transform.position.y,
                        pose.transform.position.z,
                    ]),
                    orientation: new Float32Array([
                        pose.transform.orientation.x,
                        pose.transform.orientation.y,
                        pose.transform.orientation.z,
                        pose.transform.orientation.w,
                    ]),
                    matrix: new Float32Array(pose.transform.matrix),
                },
                createdAt: Date.now(),
                userData,
            };
            this.anchors.set(anchorId, anchor);
            this.xrAnchors.set(anchorId, xrAnchor);
            this.updateSignals();
            this.emitEvent('create', anchor);
            return anchor;
        }
        catch (error) {
            this.emitEvent('error', undefined, error);
            return null;
        }
    }
    /**
     * Update anchor pose from XR frame
     */
    updateAnchors(frame) {
        if (!this.refSpace)
            return;
        for (const [id, xrAnchor] of this.xrAnchors) {
            const pose = frame.getPose(xrAnchor.anchorSpace, this.refSpace);
            if (!pose)
                continue;
            const anchor = this.anchors.get(id);
            if (!anchor)
                continue;
            // Update pose
            anchor.pose.position[0] = pose.transform.position.x;
            anchor.pose.position[1] = pose.transform.position.y;
            anchor.pose.position[2] = pose.transform.position.z;
            anchor.pose.orientation[0] = pose.transform.orientation.x;
            anchor.pose.orientation[1] = pose.transform.orientation.y;
            anchor.pose.orientation[2] = pose.transform.orientation.z;
            anchor.pose.orientation[3] = pose.transform.orientation.w;
            anchor.pose.matrix = new Float32Array(pose.transform.matrix);
            this.emitEvent('update', anchor);
        }
    }
    /**
     * Get an anchor by ID
     */
    getAnchor(id) {
        return this.anchors.get(id);
    }
    /**
     * Get all anchors
     */
    getAnchors() {
        return Array.from(this.anchors.values());
    }
    /**
     * Delete an anchor
     */
    deleteAnchor(id) {
        const anchor = this.anchors.get(id);
        if (!anchor)
            return false;
        const xrAnchor = this.xrAnchors.get(id);
        if (xrAnchor) {
            xrAnchor.delete();
            this.xrAnchors.delete(id);
        }
        this.anchors.delete(id);
        this.updateSignals();
        this.emitEvent('delete', anchor);
        return true;
    }
    /**
     * Clear all anchors
     */
    clearAnchors() {
        for (const [id] of this.anchors) {
            this.deleteAnchor(id);
        }
    }
    /**
     * Persist anchors to storage
     */
    persistAnchorsToStorage() {
        if (!this.config.persistAnchors)
            return;
        try {
            const serialized = Array.from(this.anchors.values()).map((anchor) => ({
                id: anchor.id,
                position: Array.from(anchor.pose.position),
                orientation: Array.from(anchor.pose.orientation),
                matrix: Array.from(anchor.pose.matrix),
                createdAt: anchor.createdAt,
                userData: anchor.userData,
            }));
            localStorage.setItem(this.config.storageKey, JSON.stringify(serialized));
        }
        catch (error) {
            console.warn('Failed to persist anchors:', error);
        }
    }
    /**
     * Restore anchors from storage
     */
    async restoreAnchors() {
        if (!this.config.persistAnchors || !this.session)
            return 0;
        try {
            const stored = localStorage.getItem(this.config.storageKey);
            if (!stored)
                return 0;
            const serialized = JSON.parse(stored);
            let restored = 0;
            for (const item of serialized) {
                const pose = {
                    position: new Float32Array(item.position),
                    orientation: new Float32Array(item.orientation),
                    matrix: new Float32Array(item.matrix),
                };
                const anchor = await this.createAnchor(pose, item.userData);
                if (anchor) {
                    this.emitEvent('restore', anchor);
                    restored++;
                }
            }
            return restored;
        }
        catch (error) {
            console.warn('Failed to restore anchors:', error);
            return 0;
        }
    }
    /**
     * Update reactive signals
     */
    updateSignals() {
        this.anchorCount.set(this.anchors.size);
        this.anchorsSignal.set(Array.from(this.anchors.values()));
    }
    /**
     * Add an event listener
     */
    on(type, handler) {
        this.eventHandlers.get(type)?.add(handler);
    }
    /**
     * Remove an event listener
     */
    off(type, handler) {
        this.eventHandlers.get(type)?.delete(handler);
    }
    /**
     * Emit an event
     */
    emitEvent(type, anchor, error) {
        const event = {
            type,
            anchor,
            error,
            timestamp: performance.now(),
        };
        const handlers = this.eventHandlers.get(type);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler(event);
                }
                catch (err) {
                    console.error(`Anchor event handler error for ${type}:`, err);
                }
            }
        }
    }
    /**
     * Dispose the anchor manager
     */
    dispose() {
        this.persistAnchorsToStorage();
        this.clearAnchors();
        this.session = null;
        this.refSpace = null;
    }
}
/**
 * Create an anchor manager with default configuration
 */
export function createAnchorManager(config) {
    return new AnchorManager(config);
}
//# sourceMappingURL=anchors.js.map