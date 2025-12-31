/**
 * @philjs/event-sourcing - Event History with CQRS
 *
 * Industry-first framework-native event sourcing:
 * - Event store with full audit trail
 * - CQRS pattern implementation
 * - Aggregate root management
 * - Event projections
 * - Saga/Process manager
 * - Time-travel debugging
 */
export interface Event<T = unknown> {
    id: string;
    type: string;
    aggregateId: string;
    aggregateType: string;
    version: number;
    timestamp: number;
    data: T;
    metadata?: EventMetadata;
}
export interface EventMetadata {
    userId?: string;
    correlationId?: string;
    causationId?: string;
    sessionId?: string;
    tags?: string[];
}
export interface Command<T = unknown> {
    id: string;
    type: string;
    aggregateId?: string;
    data: T;
    metadata?: CommandMetadata;
}
export interface CommandMetadata {
    userId?: string;
    correlationId?: string;
    timestamp?: number;
}
export interface Snapshot<T = unknown> {
    aggregateId: string;
    aggregateType: string;
    version: number;
    state: T;
    timestamp: number;
}
export interface Projection<T = unknown> {
    name: string;
    state: T;
    version: number;
    lastEventId: string;
}
export interface SagaState {
    sagaId: string;
    sagaType: string;
    step: number;
    data: Record<string, unknown>;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'compensating';
    startedAt: number;
    completedAt?: number;
}
export type EventHandler<T = unknown, S = unknown> = (state: S, event: Event<T>) => S;
export type CommandHandler<T = unknown> = (command: Command<T>) => Event[] | Promise<Event[]>;
export type ProjectionHandler<T = unknown, S = unknown> = (state: S, event: Event<T>) => S;
export declare class EventStore {
    private static DB_NAME;
    private static EVENTS_STORE;
    private static SNAPSHOTS_STORE;
    private db;
    private subscribers;
    initialize(): Promise<void>;
    append(events: Event[]): Promise<void>;
    getEvents(aggregateId: string, fromVersion?: number): Promise<Event[]>;
    getAllEvents(fromTimestamp?: number, toTimestamp?: number): Promise<Event[]>;
    getEventsByType(eventType: string): Promise<Event[]>;
    saveSnapshot(snapshot: Snapshot): Promise<void>;
    getSnapshot(aggregateId: string): Promise<Snapshot | null>;
    subscribe(eventType: string, handler: (event: Event) => void): () => void;
    subscribeAll(handler: (event: Event) => void): () => void;
    private notifySubscribers;
}
export declare abstract class AggregateRoot<TState = unknown> {
    protected id: string;
    protected state: TState;
    protected version: number;
    private uncommittedEvents;
    private eventHandlers;
    constructor(id: string, initialState: TState);
    protected abstract registerEventHandlers(): void;
    protected registerHandler<T>(eventType: string, handler: EventHandler<T, TState>): void;
    protected apply<T>(eventType: string, data: T, metadata?: EventMetadata): void;
    private applyEvent;
    loadFromHistory(events: Event[]): void;
    loadFromSnapshot(snapshot: Snapshot<TState>): void;
    getUncommittedEvents(): Event[];
    clearUncommittedEvents(): void;
    getState(): TState;
    getId(): string;
    getVersion(): number;
    createSnapshot(): Snapshot<TState>;
    private generateEventId;
}
export declare class Repository<T extends AggregateRoot<S>, S = unknown> {
    private eventStore;
    private aggregateFactory;
    private snapshotFrequency;
    constructor(eventStore: EventStore, aggregateFactory: (id: string) => T, snapshotFrequency?: number);
    get(id: string): Promise<T | null>;
    save(aggregate: T): Promise<void>;
}
export declare class CommandBus {
    private handlers;
    register<T>(commandType: string, handler: CommandHandler<T>): void;
    dispatch<T>(command: Command<T>): Promise<Event[]>;
}
export declare class ReadModel<T> {
    private eventStore;
    private state;
    private handlers;
    private version;
    private lastEventId;
    private name;
    constructor(eventStore: EventStore, name: string, initialState: T);
    on<E>(eventType: string, handler: ProjectionHandler<E, T>): this;
    rebuild(): Promise<void>;
    subscribe(): Promise<() => void>;
    private applyEvent;
    getState(): T;
    getProjection(): Projection<T>;
}
export declare class SagaManager {
    private eventStore;
    private sagas;
    private activeSagas;
    constructor(eventStore: EventStore);
    register(saga: SagaDefinition): void;
    private startSaga;
    private executeSaga;
    private compensate;
    getSagaState(sagaId: string): SagaState | undefined;
}
export interface SagaDefinition {
    name: string;
    triggers: string[];
    steps: SagaStep[];
}
export interface SagaStep {
    name: string;
    execute: (data: Record<string, unknown>) => Promise<void>;
    compensate?: (data: Record<string, unknown>) => Promise<void>;
}
export declare class TimeTravelDebugger<T extends AggregateRoot<S>, S = unknown> {
    private eventStore;
    private aggregateFactory;
    private currentIndex;
    private events;
    private aggregate;
    constructor(eventStore: EventStore, aggregateFactory: (id: string) => T);
    load(aggregateId: string): Promise<void>;
    goTo(index: number): S | null;
    stepForward(): S | null;
    stepBackward(): S | null;
    goToStart(): S | null;
    goToEnd(): S | null;
    getCurrentState(): S | null;
    getCurrentEvent(): Event | null;
    getCurrentIndex(): number;
    getTotalEvents(): number;
    getEventAt(index: number): Event | null;
    getAllEvents(): Event[];
}
export declare function createEvent<T>(type: string, aggregateId: string, aggregateType: string, version: number, data: T, metadata?: EventMetadata): Event<T>;
export declare function createCommand<T>(type: string, data: T, aggregateId?: string, metadata?: CommandMetadata): Command<T>;
export declare function useEventStore(): {
    store: EventStore | null;
    isReady: boolean;
};
export declare function useAggregate<T extends AggregateRoot<S>, S>(store: EventStore | null, factory: (id: string) => T, id: string): {
    aggregate: T | null;
    isLoading: boolean;
    save: () => Promise<void>;
};
export declare function useReadModel<T>(store: EventStore | null, name: string, initialState: T, configure: (model: ReadModel<T>) => void): T;
export declare function useTimeTravel<T extends AggregateRoot<S>, S>(store: EventStore | null, factory: (id: string) => T, aggregateId: string): {
    currentState: S | null;
    currentIndex: number;
    totalEvents: number;
    goTo: (index: number) => void;
    stepForward: () => void;
    stepBackward: () => void;
    goToStart: () => void;
    goToEnd: () => void;
    getCurrentEvent: () => Event<unknown> | null;
};
declare const _default: {
    EventStore: typeof EventStore;
    AggregateRoot: typeof AggregateRoot;
    Repository: typeof Repository;
    CommandBus: typeof CommandBus;
    ReadModel: typeof ReadModel;
    SagaManager: typeof SagaManager;
    TimeTravelDebugger: typeof TimeTravelDebugger;
    createEvent: typeof createEvent;
    createCommand: typeof createCommand;
    useEventStore: typeof useEventStore;
    useAggregate: typeof useAggregate;
    useReadModel: typeof useReadModel;
    useTimeTravel: typeof useTimeTravel;
};
export default _default;
//# sourceMappingURL=index.d.ts.map