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

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Event Store
// ============================================================================

export class EventStore {
  private static DB_NAME = 'philjs-event-store';
  private static EVENTS_STORE = 'events';
  private static SNAPSHOTS_STORE = 'snapshots';
  private db: IDBDatabase | null = null;
  private subscribers: Map<string, Array<(event: Event) => void>> = new Map();

  async initialize(): Promise<void> {
    const { promise, resolve, reject } = Promise.withResolvers<void>();
    const request = indexedDB.open(EventStore.DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      this.db = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(EventStore.EVENTS_STORE)) {
        const eventsStore = db.createObjectStore(EventStore.EVENTS_STORE, { keyPath: 'id' });
        eventsStore.createIndex('aggregateId', 'aggregateId');
        eventsStore.createIndex('aggregateId_version', ['aggregateId', 'version'], { unique: true });
        eventsStore.createIndex('type', 'type');
        eventsStore.createIndex('timestamp', 'timestamp');
      }

      if (!db.objectStoreNames.contains(EventStore.SNAPSHOTS_STORE)) {
        const snapshotsStore = db.createObjectStore(EventStore.SNAPSHOTS_STORE, { keyPath: 'aggregateId' });
        snapshotsStore.createIndex('aggregateType', 'aggregateType');
      }
    };

    return promise;
  }

  async append(events: Event[]): Promise<void> {
    if (!this.db) await this.initialize();

    const { promise, resolve, reject } = Promise.withResolvers<void>();
    const transaction = this.db!.transaction(EventStore.EVENTS_STORE, 'readwrite');
    const store = transaction.objectStore(EventStore.EVENTS_STORE);

    transaction.oncomplete = () => {
      // Notify subscribers
      for (const event of events) {
        this.notifySubscribers(event);
      }
      resolve();
    };

    transaction.onerror = () => reject(transaction.error);

    for (const event of events) {
      store.add(event);
    }

    return promise;
  }

  async getEvents(aggregateId: string, fromVersion?: number): Promise<Event[]> {
    if (!this.db) await this.initialize();

    const { promise, resolve, reject } = Promise.withResolvers<Event[]>();
    const transaction = this.db!.transaction(EventStore.EVENTS_STORE, 'readonly');
    const store = transaction.objectStore(EventStore.EVENTS_STORE);
    const index = store.index('aggregateId');

    const request = index.getAll(aggregateId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      let events = request.result as Event[];

      if (fromVersion !== undefined) {
        events = events.filter(e => e.version > fromVersion);
      }

      events.sort((a, b) => a.version - b.version);
      resolve(events);
    };

    return promise;
  }

  async getAllEvents(fromTimestamp?: number, toTimestamp?: number): Promise<Event[]> {
    if (!this.db) await this.initialize();

    const { promise, resolve, reject } = Promise.withResolvers<Event[]>();
    const transaction = this.db!.transaction(EventStore.EVENTS_STORE, 'readonly');
    const store = transaction.objectStore(EventStore.EVENTS_STORE);
    const index = store.index('timestamp');

    let range: IDBKeyRange | undefined;
    if (fromTimestamp && toTimestamp) {
      range = IDBKeyRange.bound(fromTimestamp, toTimestamp);
    } else if (fromTimestamp) {
      range = IDBKeyRange.lowerBound(fromTimestamp);
    } else if (toTimestamp) {
      range = IDBKeyRange.upperBound(toTimestamp);
    }

    const request = range ? index.getAll(range) : store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as Event[]);

    return promise;
  }

  async getEventsByType(eventType: string): Promise<Event[]> {
    if (!this.db) await this.initialize();

    const { promise, resolve, reject } = Promise.withResolvers<Event[]>();
    const transaction = this.db!.transaction(EventStore.EVENTS_STORE, 'readonly');
    const store = transaction.objectStore(EventStore.EVENTS_STORE);
    const index = store.index('type');

    const request = index.getAll(eventType);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as Event[]);

    return promise;
  }

  async saveSnapshot(snapshot: Snapshot): Promise<void> {
    if (!this.db) await this.initialize();

    const { promise, resolve, reject } = Promise.withResolvers<void>();
    const transaction = this.db!.transaction(EventStore.SNAPSHOTS_STORE, 'readwrite');
    const store = transaction.objectStore(EventStore.SNAPSHOTS_STORE);
    const request = store.put(snapshot);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();

    return promise;
  }

  async getSnapshot(aggregateId: string): Promise<Snapshot | null> {
    if (!this.db) await this.initialize();

    const { promise, resolve, reject } = Promise.withResolvers<Snapshot | null>();
    const transaction = this.db!.transaction(EventStore.SNAPSHOTS_STORE, 'readonly');
    const store = transaction.objectStore(EventStore.SNAPSHOTS_STORE);
    const request = store.get(aggregateId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result ?? null);

    return promise;
  }

  subscribe(eventType: string, handler: (event: Event) => void): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType)!.push(handler);

    return () => {
      const handlers = this.subscribers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) handlers.splice(index, 1);
      }
    };
  }

  subscribeAll(handler: (event: Event) => void): () => void {
    return this.subscribe('*', handler);
  }

  private notifySubscribers(event: Event): void {
    // Type-specific subscribers
    const typeHandlers = this.subscribers.get(event.type);
    if (typeHandlers) {
      typeHandlers.forEach(h => h(event));
    }

    // Wildcard subscribers
    const allHandlers = this.subscribers.get('*');
    if (allHandlers) {
      allHandlers.forEach(h => h(event));
    }
  }
}

// ============================================================================
// Aggregate Root
// ============================================================================

export abstract class AggregateRoot<TState = unknown> {
  protected id: string;
  protected state: TState;
  protected version: number = 0;
  private uncommittedEvents: Event[] = [];
  private eventHandlers: Map<string, EventHandler<unknown, TState>> = new Map();

  constructor(id: string, initialState: TState) {
    this.id = id;
    this.state = initialState;
    this.registerEventHandlers();
  }

  protected abstract registerEventHandlers(): void;

  protected registerHandler<T>(eventType: string, handler: EventHandler<T, TState>): void {
    this.eventHandlers.set(eventType, handler as EventHandler<unknown, TState>);
  }

  protected apply<T>(eventType: string, data: T, metadata?: EventMetadata): void {
    const event: Event<T> = {
      id: this.generateEventId(),
      type: eventType,
      aggregateId: this.id,
      aggregateType: this.constructor.name,
      version: this.version + 1,
      timestamp: Date.now(),
      data,
      ...(metadata !== undefined && { metadata })
    };

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  private applyEvent(event: Event): void {
    const handler = this.eventHandlers.get(event.type);
    if (handler) {
      this.state = handler(this.state, event);
    }
    this.version = event.version;
  }

  loadFromHistory(events: Event[]): void {
    for (const event of events) {
      this.applyEvent(event);
    }
  }

  loadFromSnapshot(snapshot: Snapshot<TState>): void {
    this.state = snapshot.state;
    this.version = snapshot.version;
  }

  getUncommittedEvents(): Event[] {
    return [...this.uncommittedEvents];
  }

  clearUncommittedEvents(): void {
    this.uncommittedEvents = [];
  }

  getState(): TState {
    return this.state;
  }

  getId(): string {
    return this.id;
  }

  getVersion(): number {
    return this.version;
  }

  createSnapshot(): Snapshot<TState> {
    return {
      aggregateId: this.id,
      aggregateType: this.constructor.name,
      version: this.version,
      state: this.state,
      timestamp: Date.now()
    };
  }

  private generateEventId(): string {
    return `${this.id}-${this.version + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// Repository
// ============================================================================

export class Repository<T extends AggregateRoot<S>, S = unknown> {
  private eventStore: EventStore;
  private aggregateFactory: (id: string) => T;
  private snapshotFrequency: number;

  constructor(
    eventStore: EventStore,
    aggregateFactory: (id: string) => T,
    snapshotFrequency: number = 100
  ) {
    this.eventStore = eventStore;
    this.aggregateFactory = aggregateFactory;
    this.snapshotFrequency = snapshotFrequency;
  }

  async get(id: string): Promise<T | null> {
    const aggregate = this.aggregateFactory(id);

    // Try to load from snapshot first
    const snapshot = await this.eventStore.getSnapshot(id);
    let fromVersion = 0;

    if (snapshot) {
      aggregate.loadFromSnapshot(snapshot as Snapshot<S>);
      fromVersion = snapshot.version;
    }

    // Load events after snapshot
    const events = await this.eventStore.getEvents(id, fromVersion);

    if (events.length === 0 && !snapshot) {
      return null;
    }

    aggregate.loadFromHistory(events);
    return aggregate;
  }

  async save(aggregate: T): Promise<void> {
    const events = aggregate.getUncommittedEvents();

    if (events.length === 0) return;

    await this.eventStore.append(events);
    aggregate.clearUncommittedEvents();

    // Save snapshot if needed
    if (aggregate.getVersion() % this.snapshotFrequency === 0) {
      await this.eventStore.saveSnapshot(aggregate.createSnapshot());
    }
  }
}

// ============================================================================
// Command Bus
// ============================================================================

export class CommandBus {
  private handlers: Map<string, CommandHandler<unknown>> = new Map();

  register<T>(commandType: string, handler: CommandHandler<T>): void {
    this.handlers.set(commandType, handler as CommandHandler<unknown>);
  }

  async dispatch<T>(command: Command<T>): Promise<Event[]> {
    const handler = this.handlers.get(command.type);

    if (!handler) {
      throw new Error(`No handler registered for command: ${command.type}`);
    }

    const events = await handler(command);
    return events;
  }
}

// ============================================================================
// Query/Read Model
// ============================================================================

export class ReadModel<T> {
  private eventStore: EventStore;
  private state: T;
  private handlers: Map<string, ProjectionHandler<unknown, T>> = new Map();
  private version: number = 0;
  private lastEventId: string = '';
  private name: string;

  constructor(eventStore: EventStore, name: string, initialState: T) {
    this.eventStore = eventStore;
    this.name = name;
    this.state = initialState;
  }

  on<E>(eventType: string, handler: ProjectionHandler<E, T>): this {
    this.handlers.set(eventType, handler as ProjectionHandler<unknown, T>);
    return this;
  }

  async rebuild(): Promise<void> {
    const events = await this.eventStore.getAllEvents();

    for (const event of events) {
      this.applyEvent(event);
    }
  }

  async subscribe(): Promise<() => void> {
    // Subscribe to new events
    return this.eventStore.subscribeAll((event) => {
      this.applyEvent(event);
    });
  }

  private applyEvent(event: Event): void {
    const handler = this.handlers.get(event.type);
    if (handler) {
      this.state = handler(this.state, event);
      this.version++;
      this.lastEventId = event.id;
    }
  }

  getState(): T {
    return this.state;
  }

  getProjection(): Projection<T> {
    return {
      name: this.name,
      state: this.state,
      version: this.version,
      lastEventId: this.lastEventId
    };
  }
}

// ============================================================================
// Saga Manager
// ============================================================================

export class SagaManager {
  private eventStore: EventStore;
  private sagas: Map<string, SagaDefinition> = new Map();
  private activeSagas: Map<string, SagaState> = new Map();

  constructor(eventStore: EventStore) {
    this.eventStore = eventStore;
  }

  register(saga: SagaDefinition): void {
    this.sagas.set(saga.name, saga);

    // Subscribe to trigger events
    for (const triggerEvent of saga.triggers) {
      this.eventStore.subscribe(triggerEvent, (event) => {
        this.startSaga(saga.name, event);
      });
    }
  }

  private async startSaga(sagaName: string, triggerEvent: Event): Promise<void> {
    const saga = this.sagas.get(sagaName);
    if (!saga) return;

    const sagaId = `${sagaName}-${triggerEvent.id}`;

    const state: SagaState = {
      sagaId,
      sagaType: sagaName,
      step: 0,
      data: { triggerEvent },
      status: 'running',
      startedAt: Date.now()
    };

    this.activeSagas.set(sagaId, state);

    try {
      await this.executeSaga(saga, state);
    } catch (error) {
      state.status = 'failed';
      await this.compensate(saga, state);
    }
  }

  private async executeSaga(saga: SagaDefinition, state: SagaState): Promise<void> {
    for (let i = state.step; i < saga.steps.length; i++) {
      const step = saga.steps[i]!;
      state.step = i;

      await step.execute(state.data);
      state.data = { ...state.data };
    }

    state.status = 'completed';
    state.completedAt = Date.now();
  }

  private async compensate(saga: SagaDefinition, state: SagaState): Promise<void> {
    state.status = 'compensating';

    for (let i = state.step; i >= 0; i--) {
      const step = saga.steps[i]!;
      if (step.compensate) {
        await step.compensate(state.data);
      }
    }
  }

  getSagaState(sagaId: string): SagaState | undefined {
    return this.activeSagas.get(sagaId);
  }
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

// ============================================================================
// Time Travel Debugger
// ============================================================================

export class TimeTravelDebugger<T extends AggregateRoot<S>, S = unknown> {
  private eventStore: EventStore;
  private aggregateFactory: (id: string) => T;
  private currentIndex: number = -1;
  private events: Event[] = [];
  private aggregate: T | null = null;

  constructor(eventStore: EventStore, aggregateFactory: (id: string) => T) {
    this.eventStore = eventStore;
    this.aggregateFactory = aggregateFactory;
  }

  async load(aggregateId: string): Promise<void> {
    this.events = await this.eventStore.getEvents(aggregateId);
    this.currentIndex = this.events.length - 1;
    this.aggregate = this.aggregateFactory(aggregateId);
    this.aggregate.loadFromHistory(this.events);
  }

  goTo(index: number): S | null {
    if (index < 0 || index >= this.events.length) return null;

    this.currentIndex = index;
    this.aggregate = this.aggregateFactory(this.events[0]!.aggregateId);
    this.aggregate.loadFromHistory(this.events.slice(0, index + 1));

    return this.aggregate.getState();
  }

  stepForward(): S | null {
    if (this.currentIndex >= this.events.length - 1) return null;
    return this.goTo(this.currentIndex + 1);
  }

  stepBackward(): S | null {
    if (this.currentIndex <= 0) return null;
    return this.goTo(this.currentIndex - 1);
  }

  goToStart(): S | null {
    return this.goTo(0);
  }

  goToEnd(): S | null {
    return this.goTo(this.events.length - 1);
  }

  getCurrentState(): S | null {
    return this.aggregate?.getState() ?? null;
  }

  getCurrentEvent(): Event | null {
    return this.events[this.currentIndex] ?? null;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  getTotalEvents(): number {
    return this.events.length;
  }

  getEventAt(index: number): Event | null {
    return this.events[index] ?? null;
  }

  getAllEvents(): Event[] {
    return [...this.events];
  }
}

// ============================================================================
// Event Utilities
// ============================================================================

export function createEvent<T>(
  type: string,
  aggregateId: string,
  aggregateType: string,
  version: number,
  data: T,
  metadata?: EventMetadata
): Event<T> {
  return {
    id: `${aggregateId}-${version}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    aggregateId,
    aggregateType,
    version,
    timestamp: Date.now(),
    data,
    ...(metadata !== undefined && { metadata })
  };
}

export function createCommand<T>(
  type: string,
  data: T,
  aggregateId?: string,
  metadata?: CommandMetadata
): Command<T> {
  return {
    id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    ...(aggregateId !== undefined && { aggregateId }),
    data,
    metadata: {
      timestamp: Date.now(),
      ...metadata
    }
  };
}

// ============================================================================
// Hooks
// ============================================================================

type CleanupFn = () => void;
type EffectFn = () => void | CleanupFn;

const effectQueue: EffectFn[] = [];

function useEffect(effect: EffectFn, _deps?: unknown[]): void {
  effectQueue.push(effect);
}

function useState<T>(initial: T): [T, (value: T | ((prev: T) => T)) => void] {
  let state = initial;
  const setState = (value: T | ((prev: T) => T)) => {
    state = typeof value === 'function' ? (value as (prev: T) => T)(state) : value;
  };
  return [state, setState];
}

function useRef<T>(initial: T): { current: T } {
  return { current: initial };
}

function useCallback<T extends (...args: never[]) => unknown>(fn: T, _deps: unknown[]): T {
  return fn;
}

export function useEventStore() {
  const storeRef = useRef<EventStore | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const store = new EventStore();
    store.initialize().then(() => {
      storeRef.current = store;
      setIsReady(true);
    });
  }, []);

  return { store: storeRef.current, isReady };
}

export function useAggregate<T extends AggregateRoot<S>, S>(
  store: EventStore | null,
  factory: (id: string) => T,
  id: string
) {
  const repoRef = useRef<Repository<T, S> | null>(null);
  const [aggregate, setAggregate] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!store) return;

    const repo = new Repository<T, S>(store, factory);
    repoRef.current = repo;

    repo.get(id).then((agg) => {
      setAggregate(agg);
      setIsLoading(false);
    });
  }, [store, id]);

  const save = useCallback(async () => {
    if (!aggregate || !repoRef.current) return;
    await repoRef.current.save(aggregate);
  }, [aggregate]);

  return { aggregate, isLoading, save };
}

export function useReadModel<T>(
  store: EventStore | null,
  name: string,
  initialState: T,
  configure: (model: ReadModel<T>) => void
) {
  const modelRef = useRef<ReadModel<T> | null>(null);
  const [state, setState] = useState(initialState);

  useEffect(() => {
    if (!store) return;

    const model = new ReadModel<T>(store, name, initialState);
    configure(model);
    modelRef.current = model;

    model.rebuild().then(() => {
      setState(model.getState());
      model.subscribe().then((unsubscribe) => {
        // Update state on new events
        store.subscribeAll(() => {
          setState(model.getState());
        });
        return unsubscribe;
      });
    });
  }, [store, name]);

  return state;
}

export function useTimeTravel<T extends AggregateRoot<S>, S>(
  store: EventStore | null,
  factory: (id: string) => T,
  aggregateId: string
) {
  const debuggerRef = useRef<TimeTravelDebugger<T, S> | null>(null);
  const [currentState, setCurrentState] = useState<S | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [totalEvents, setTotalEvents] = useState(0);

  useEffect(() => {
    if (!store) return;

    const debugger_ = new TimeTravelDebugger<T, S>(store, factory);
    debuggerRef.current = debugger_;

    debugger_.load(aggregateId).then(() => {
      setCurrentState(debugger_.getCurrentState());
      setCurrentIndex(debugger_.getCurrentIndex());
      setTotalEvents(debugger_.getTotalEvents());
    });
  }, [store, aggregateId]);

  const goTo = useCallback((index: number) => {
    const state = debuggerRef.current?.goTo(index);
    if (state) {
      setCurrentState(state);
      setCurrentIndex(index);
    }
  }, []);

  const stepForward = useCallback(() => {
    const state = debuggerRef.current?.stepForward();
    if (state) {
      setCurrentState(state);
      setCurrentIndex(debuggerRef.current!.getCurrentIndex());
    }
  }, []);

  const stepBackward = useCallback(() => {
    const state = debuggerRef.current?.stepBackward();
    if (state) {
      setCurrentState(state);
      setCurrentIndex(debuggerRef.current!.getCurrentIndex());
    }
  }, []);

  return {
    currentState,
    currentIndex,
    totalEvents,
    goTo,
    stepForward,
    stepBackward,
    goToStart: () => goTo(0),
    goToEnd: () => goTo(totalEvents - 1),
    getCurrentEvent: () => debuggerRef.current?.getCurrentEvent() ?? null
  };
}

// Export everything
export default {
  EventStore,
  AggregateRoot,
  Repository,
  CommandBus,
  ReadModel,
  SagaManager,
  TimeTravelDebugger,
  createEvent,
  createCommand,
  useEventStore,
  useAggregate,
  useReadModel,
  useTimeTravel
};
