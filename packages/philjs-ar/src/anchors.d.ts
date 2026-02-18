/**
 * @philjs/ar - AR Anchors Module
 *
 * Persistent anchor management for AR object placement.
 * Anchors maintain position and orientation across session restarts.
 */
import { type Signal } from '@philjs/core';
export interface AnchorPose {
    position: Float32Array;
    orientation: Float32Array;
    matrix: Float32Array;
}
export interface ARAnchorp {
    id: string;
    pose: AnchorPose;
    persistenceId?: string;
    createdAt: number;
    userData?: Record<string, unknown>;
}
export interface AnchorManagerConfig {
    maxAnchors?: number;
    persistAnchors?: boolean;
    storageKey?: string;
}
type AnchorEventType = 'create' | 'update' | 'delete' | 'restore' | 'error';
type AnchorEventHandler = (event: AnchorEvent) => void;
export interface AnchorEvent {
    type: AnchorEventType;
    anchor?: ARAnchorp;
    error?: Error;
    timestamp: number;
}
/**
 * Manages AR anchors for persistent object placement
 */
export declare class AnchorManager {
    private anchors;
    private xrAnchors;
    private session;
    private refSpace;
    private config;
    private eventHandlers;
    private anchorIdCounter;
    readonly anchorCount: Signal<number>;
    readonly anchorsSignal: Signal<ARAnchorp[]>;
    constructor(config?: AnchorManagerConfig);
    /**
     * Initialize with an XR session
     */
    initialize(session: XRSession, refSpace: XRReferenceSpace): void;
    /**
     * Create an anchor at the given pose
     */
    createAnchor(pose: AnchorPose, userData?: Record<string, unknown>): Promise<ARAnchorp | null>;
    /**
     * Create an anchor from a hit test result
     */
    createAnchorFromHitTest(hitResult: XRHitTestResult, userData?: Record<string, unknown>): Promise<ARAnchorp | null>;
    /**
     * Update anchor pose from XR frame
     */
    updateAnchors(frame: XRFrame): void;
    /**
     * Get an anchor by ID
     */
    getAnchor(id: string): ARAnchorp | undefined;
    /**
     * Get all anchors
     */
    getAnchors(): ARAnchorp[];
    /**
     * Delete an anchor
     */
    deleteAnchor(id: string): boolean;
    /**
     * Clear all anchors
     */
    clearAnchors(): void;
    /**
     * Persist anchors to storage
     */
    private persistAnchorsToStorage;
    /**
     * Restore anchors from storage
     */
    restoreAnchors(): Promise<number>;
    /**
     * Update reactive signals
     */
    private updateSignals;
    /**
     * Add an event listener
     */
    on(type: AnchorEventType, handler: AnchorEventHandler): void;
    /**
     * Remove an event listener
     */
    off(type: AnchorEventType, handler: AnchorEventHandler): void;
    /**
     * Emit an event
     */
    private emitEvent;
    /**
     * Dispose the anchor manager
     */
    dispose(): void;
}
/**
 * Create an anchor manager with default configuration
 */
export declare function createAnchorManager(config?: AnchorManagerConfig): AnchorManager;
export {};
