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
// Event Store
// ============================================================================
export class EventStore {
    static DB_NAME = 'philjs-event-store';
    static EVENTS_STORE = 'events';
    static SNAPSHOTS_STORE = 'snapshots';
    db = null;
    subscribers = new Map();
    async initialize() {
        const { promise, resolve, reject } = Promise.withResolvers();
        const request = indexedDB.open(EventStore.DB_NAME, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            this.db = request.result;
            resolve();
        };
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
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
    async append(events) {
        if (!this.db)
            await this.initialize();
        const { promise, resolve, reject } = Promise.withResolvers();
        const transaction = this.db.transaction(EventStore.EVENTS_STORE, 'readwrite');
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
    async getEvents(aggregateId, fromVersion) {
        if (!this.db)
            await this.initialize();
        const { promise, resolve, reject } = Promise.withResolvers();
        const transaction = this.db.transaction(EventStore.EVENTS_STORE, 'readonly');
        const store = transaction.objectStore(EventStore.EVENTS_STORE);
        const index = store.index('aggregateId');
        const request = index.getAll(aggregateId);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            let events = request.result;
            if (fromVersion !== undefined) {
                events = events.filter(e => e.version > fromVersion);
            }
            events.sort((a, b) => a.version - b.version);
            resolve(events);
        };
        return promise;
    }
    async getAllEvents(fromTimestamp, toTimestamp) {
        if (!this.db)
            await this.initialize();
        const { promise, resolve, reject } = Promise.withResolvers();
        const transaction = this.db.transaction(EventStore.EVENTS_STORE, 'readonly');
        const store = transaction.objectStore(EventStore.EVENTS_STORE);
        const index = store.index('timestamp');
        let range;
        if (fromTimestamp && toTimestamp) {
            range = IDBKeyRange.bound(fromTimestamp, toTimestamp);
        }
        else if (fromTimestamp) {
            range = IDBKeyRange.lowerBound(fromTimestamp);
        }
        else if (toTimestamp) {
            range = IDBKeyRange.upperBound(toTimestamp);
        }
        const request = range ? index.getAll(range) : store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        return promise;
    }
    async getEventsByType(eventType) {
        if (!this.db)
            await this.initialize();
        const { promise, resolve, reject } = Promise.withResolvers();
        const transaction = this.db.transaction(EventStore.EVENTS_STORE, 'readonly');
        const store = transaction.objectStore(EventStore.EVENTS_STORE);
        const index = store.index('type');
        const request = index.getAll(eventType);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        return promise;
    }
    async saveSnapshot(snapshot) {
        if (!this.db)
            await this.initialize();
        const { promise, resolve, reject } = Promise.withResolvers();
        const transaction = this.db.transaction(EventStore.SNAPSHOTS_STORE, 'readwrite');
        const store = transaction.objectStore(EventStore.SNAPSHOTS_STORE);
        const request = store.put(snapshot);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
        return promise;
    }
    async getSnapshot(aggregateId) {
        if (!this.db)
            await this.initialize();
        const { promise, resolve, reject } = Promise.withResolvers();
        const transaction = this.db.transaction(EventStore.SNAPSHOTS_STORE, 'readonly');
        const store = transaction.objectStore(EventStore.SNAPSHOTS_STORE);
        const request = store.get(aggregateId);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result ?? null);
        return promise;
    }
    subscribe(eventType, handler) {
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, []);
        }
        this.subscribers.get(eventType).push(handler);
        return () => {
            const handlers = this.subscribers.get(eventType);
            if (handlers) {
                const index = handlers.indexOf(handler);
                if (index > -1)
                    handlers.splice(index, 1);
            }
        };
    }
    subscribeAll(handler) {
        return this.subscribe('*', handler);
    }
    notifySubscribers(event) {
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
export class AggregateRoot {
    id;
    state;
    version = 0;
    uncommittedEvents = [];
    eventHandlers = new Map();
    constructor(id, initialState) {
        this.id = id;
        this.state = initialState;
        this.registerEventHandlers();
    }
    registerHandler(eventType, handler) {
        this.eventHandlers.set(eventType, handler);
    }
    apply(eventType, data, metadata) {
        const event = {
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
    applyEvent(event) {
        const handler = this.eventHandlers.get(event.type);
        if (handler) {
            this.state = handler(this.state, event);
        }
        this.version = event.version;
    }
    loadFromHistory(events) {
        for (const event of events) {
            this.applyEvent(event);
        }
    }
    loadFromSnapshot(snapshot) {
        this.state = snapshot.state;
        this.version = snapshot.version;
    }
    getUncommittedEvents() {
        return [...this.uncommittedEvents];
    }
    clearUncommittedEvents() {
        this.uncommittedEvents = [];
    }
    getState() {
        return this.state;
    }
    getId() {
        return this.id;
    }
    getVersion() {
        return this.version;
    }
    createSnapshot() {
        return {
            aggregateId: this.id,
            aggregateType: this.constructor.name,
            version: this.version,
            state: this.state,
            timestamp: Date.now()
        };
    }
    generateEventId() {
        return `${this.id}-${this.version + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
// ============================================================================
// Repository
// ============================================================================
export class Repository {
    eventStore;
    aggregateFactory;
    snapshotFrequency;
    constructor(eventStore, aggregateFactory, snapshotFrequency = 100) {
        this.eventStore = eventStore;
        this.aggregateFactory = aggregateFactory;
        this.snapshotFrequency = snapshotFrequency;
    }
    async get(id) {
        const aggregate = this.aggregateFactory(id);
        // Try to load from snapshot first
        const snapshot = await this.eventStore.getSnapshot(id);
        let fromVersion = 0;
        if (snapshot) {
            aggregate.loadFromSnapshot(snapshot);
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
    async save(aggregate) {
        const events = aggregate.getUncommittedEvents();
        if (events.length === 0)
            return;
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
    handlers = new Map();
    register(commandType, handler) {
        this.handlers.set(commandType, handler);
    }
    async dispatch(command) {
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
export class ReadModel {
    eventStore;
    state;
    handlers = new Map();
    version = 0;
    lastEventId = '';
    name;
    constructor(eventStore, name, initialState) {
        this.eventStore = eventStore;
        this.name = name;
        this.state = initialState;
    }
    on(eventType, handler) {
        this.handlers.set(eventType, handler);
        return this;
    }
    async rebuild() {
        const events = await this.eventStore.getAllEvents();
        for (const event of events) {
            this.applyEvent(event);
        }
    }
    async subscribe() {
        // Subscribe to new events
        return this.eventStore.subscribeAll((event) => {
            this.applyEvent(event);
        });
    }
    applyEvent(event) {
        const handler = this.handlers.get(event.type);
        if (handler) {
            this.state = handler(this.state, event);
            this.version++;
            this.lastEventId = event.id;
        }
    }
    getState() {
        return this.state;
    }
    getProjection() {
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
    eventStore;
    sagas = new Map();
    activeSagas = new Map();
    constructor(eventStore) {
        this.eventStore = eventStore;
    }
    register(saga) {
        this.sagas.set(saga.name, saga);
        // Subscribe to trigger events
        for (const triggerEvent of saga.triggers) {
            this.eventStore.subscribe(triggerEvent, (event) => {
                this.startSaga(saga.name, event);
            });
        }
    }
    async startSaga(sagaName, triggerEvent) {
        const saga = this.sagas.get(sagaName);
        if (!saga)
            return;
        const sagaId = `${sagaName}-${triggerEvent.id}`;
        const state = {
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
        }
        catch (error) {
            state.status = 'failed';
            await this.compensate(saga, state);
        }
    }
    async executeSaga(saga, state) {
        for (let i = state.step; i < saga.steps.length; i++) {
            const step = saga.steps[i];
            state.step = i;
            await step.execute(state.data);
            state.data = { ...state.data };
        }
        state.status = 'completed';
        state.completedAt = Date.now();
    }
    async compensate(saga, state) {
        state.status = 'compensating';
        for (let i = state.step; i >= 0; i--) {
            const step = saga.steps[i];
            if (step.compensate) {
                await step.compensate(state.data);
            }
        }
    }
    getSagaState(sagaId) {
        return this.activeSagas.get(sagaId);
    }
}
// ============================================================================
// Time Travel Debugger
// ============================================================================
export class TimeTravelDebugger {
    eventStore;
    aggregateFactory;
    currentIndex = -1;
    events = [];
    aggregate = null;
    constructor(eventStore, aggregateFactory) {
        this.eventStore = eventStore;
        this.aggregateFactory = aggregateFactory;
    }
    async load(aggregateId) {
        this.events = await this.eventStore.getEvents(aggregateId);
        this.currentIndex = this.events.length - 1;
        this.aggregate = this.aggregateFactory(aggregateId);
        this.aggregate.loadFromHistory(this.events);
    }
    goTo(index) {
        if (index < 0 || index >= this.events.length)
            return null;
        this.currentIndex = index;
        this.aggregate = this.aggregateFactory(this.events[0].aggregateId);
        this.aggregate.loadFromHistory(this.events.slice(0, index + 1));
        return this.aggregate.getState();
    }
    stepForward() {
        if (this.currentIndex >= this.events.length - 1)
            return null;
        return this.goTo(this.currentIndex + 1);
    }
    stepBackward() {
        if (this.currentIndex <= 0)
            return null;
        return this.goTo(this.currentIndex - 1);
    }
    goToStart() {
        return this.goTo(0);
    }
    goToEnd() {
        return this.goTo(this.events.length - 1);
    }
    getCurrentState() {
        return this.aggregate?.getState() ?? null;
    }
    getCurrentEvent() {
        return this.events[this.currentIndex] ?? null;
    }
    getCurrentIndex() {
        return this.currentIndex;
    }
    getTotalEvents() {
        return this.events.length;
    }
    getEventAt(index) {
        return this.events[index] ?? null;
    }
    getAllEvents() {
        return [...this.events];
    }
}
// ============================================================================
// Event Utilities
// ============================================================================
export function createEvent(type, aggregateId, aggregateType, version, data, metadata) {
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
export function createCommand(type, data, aggregateId, metadata) {
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
const effectQueue = [];
function useEffect(effect, _deps) {
    effectQueue.push(effect);
}
function useState(initial) {
    let state = initial;
    const setState = (value) => {
        state = typeof value === 'function' ? value(state) : value;
    };
    return [state, setState];
}
function useRef(initial) {
    return { current: initial };
}
function useCallback(fn, _deps) {
    return fn;
}
export function useEventStore() {
    const storeRef = useRef(null);
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
export function useAggregate(store, factory, id) {
    const repoRef = useRef(null);
    const [aggregate, setAggregate] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        if (!store)
            return;
        const repo = new Repository(store, factory);
        repoRef.current = repo;
        repo.get(id).then((agg) => {
            setAggregate(agg);
            setIsLoading(false);
        });
    }, [store, id]);
    const save = useCallback(async () => {
        if (!aggregate || !repoRef.current)
            return;
        await repoRef.current.save(aggregate);
    }, [aggregate]);
    return { aggregate, isLoading, save };
}
export function useReadModel(store, name, initialState, configure) {
    const modelRef = useRef(null);
    const [state, setState] = useState(initialState);
    useEffect(() => {
        if (!store)
            return;
        const model = new ReadModel(store, name, initialState);
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
export function useTimeTravel(store, factory, aggregateId) {
    const debuggerRef = useRef(null);
    const [currentState, setCurrentState] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [totalEvents, setTotalEvents] = useState(0);
    useEffect(() => {
        if (!store)
            return;
        const debugger_ = new TimeTravelDebugger(store, factory);
        debuggerRef.current = debugger_;
        debugger_.load(aggregateId).then(() => {
            setCurrentState(debugger_.getCurrentState());
            setCurrentIndex(debugger_.getCurrentIndex());
            setTotalEvents(debugger_.getTotalEvents());
        });
    }, [store, aggregateId]);
    const goTo = useCallback((index) => {
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
            setCurrentIndex(debuggerRef.current.getCurrentIndex());
        }
    }, []);
    const stepBackward = useCallback(() => {
        const state = debuggerRef.current?.stepBackward();
        if (state) {
            setCurrentState(state);
            setCurrentIndex(debuggerRef.current.getCurrentIndex());
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
//# sourceMappingURL=index.js.map