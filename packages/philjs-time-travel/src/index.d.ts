/**
 * @philjs/time-travel - Visual Time-Travel Debugging
 *
 * Go back and forth through your application's state history:
 * - Record all state changes with timestamps
 * - Visual timeline of component renders
 * - Step through state changes frame by frame
 * - Branch from any point in history
 * - Diff viewer for state changes
 * - Export/import state snapshots
 * - Persist debug sessions across reloads
 *
 * SUPERIOR TO ELM AND REDUX DEVTOOLS.
 */
export interface TimeTravelConfig {
    /** Maximum number of snapshots to keep */
    maxSnapshots?: number;
    /** Enable automatic recording */
    autoRecord?: boolean;
    /** Persist history to storage */
    persist?: boolean;
    /** Storage key for persistence */
    storageKey?: string;
    /** Capture component tree */
    captureComponents?: boolean;
    /** Capture network requests */
    captureNetwork?: boolean;
    /** Capture console logs */
    captureConsole?: boolean;
    /** Compression for large states */
    compress?: boolean;
}
export interface StateSnapshot {
    id: string;
    timestamp: number;
    state: Record<string, unknown>;
    action?: ActionInfo;
    componentTree?: ComponentSnapshot[];
    networkRequests?: NetworkRequest[];
    consoleLogs?: ConsoleLog[];
    metadata: SnapshotMetadata;
}
export interface ActionInfo {
    type: string;
    payload?: unknown;
    source: string;
    stackTrace?: string;
}
export interface ComponentSnapshot {
    id: string;
    name: string;
    props: Record<string, unknown>;
    state: Record<string, unknown>;
    renderTime: number;
    children: ComponentSnapshot[];
}
export interface NetworkRequest {
    id: string;
    url: string;
    method: string;
    status?: number;
    duration?: number;
    requestBody?: unknown;
    responseBody?: unknown;
    timestamp: number;
}
export interface ConsoleLog {
    level: 'log' | 'warn' | 'error' | 'info' | 'debug';
    message: string;
    timestamp: number;
    args?: unknown[];
}
export interface SnapshotMetadata {
    label?: string;
    tags?: string[];
    branch?: string;
    parentId?: string;
}
export interface TimeTravelState {
    snapshots: StateSnapshot[];
    currentIndex: number;
    branches: Map<string, StateSnapshot[]>;
    isRecording: boolean;
    isPaused: boolean;
}
export interface StateDiff {
    path: string;
    oldValue: unknown;
    newValue: unknown;
    type: 'add' | 'remove' | 'change';
}
export declare function diffStates(oldState: Record<string, unknown>, newState: Record<string, unknown>, path?: string): StateDiff[];
declare function deepEqual(a: unknown, b: unknown): boolean;
export declare class TimeTravelEngine {
    private config;
    private state;
    private stateGetters;
    private stateSetters;
    private subscribers;
    private componentRegistry;
    constructor(config?: TimeTravelConfig);
    registerState<T>(key: string, getter: () => T, setter: (value: T) => void): () => void;
    registerComponent(id: string, snapshot: ComponentSnapshot): void;
    unregisterComponent(id: string): void;
    record(action?: ActionInfo): StateSnapshot;
    private captureSnapshot;
    private captureComponentTree;
    goTo(index: number): boolean;
    goToSnapshot(snapshotId: string): boolean;
    stepBack(): boolean;
    stepForward(): boolean;
    goToStart(): boolean;
    goToEnd(): boolean;
    private restoreState;
    createBranch(name?: string): string;
    switchToBranch(name: string): boolean;
    getBranches(): string[];
    play(speed?: number, onFrame?: (snapshot: StateSnapshot) => void): Promise<void>;
    pause(): void;
    resume(): void;
    startRecording(): void;
    stopRecording(): void;
    clear(): void;
    labelSnapshot(snapshotId: string, label: string): void;
    tagSnapshot(snapshotId: string, tag: string): void;
    findByLabel(label: string): StateSnapshot | undefined;
    findByTag(tag: string): StateSnapshot[];
    getDiff(fromIndex: number, toIndex: number): StateDiff[];
    getDiffFromCurrent(snapshotId: string): StateDiff[];
    exportSession(): string;
    importSession(data: string): boolean;
    exportSnapshot(snapshotId: string): string | null;
    subscribe(callback: (state: TimeTravelState) => void): () => void;
    private notifySubscribers;
    getState(): TimeTravelState;
    getCurrentSnapshot(): StateSnapshot | null;
    getSnapshotCount(): number;
    private interceptNetwork;
    private interceptConsole;
    private persistIfEnabled;
    private loadFromStorage;
    private generateId;
    private sleep;
    private compress;
    private decompress;
}
export declare function initTimeTravel(config?: TimeTravelConfig): TimeTravelEngine;
export declare function getTimeTravelEngine(): TimeTravelEngine | null;
export declare function useTimeTravel(): {
    record: (action?: ActionInfo) => void;
    stepBack: () => boolean;
    stepForward: () => boolean;
    goTo: (index: number) => boolean;
    getCurrentSnapshot: () => StateSnapshot | null;
    getSnapshotCount: () => number;
    isRecording: boolean;
    currentIndex: number;
};
export declare function useTimeTravelState<T>(key: string, initialValue: T): [T, (value: T) => void];
export declare function useStateDiff(fromIndex: number, toIndex: number): StateDiff[];
export { deepEqual };
//# sourceMappingURL=index.d.ts.map