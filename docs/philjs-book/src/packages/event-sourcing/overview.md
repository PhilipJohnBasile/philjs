# @philjs/event-sourcing

Event sourcing framework with CQRS, aggregates, projections, sagas, and time-travel debugging.

## Installation

```bash
npm install @philjs/event-sourcing
```

## Features

- **Event Store** - Append-only event storage with IndexedDB
- **Aggregates** - Domain-driven aggregate roots
- **CQRS** - Command Query Responsibility Segregation
- **Projections** - Build read models from events
- **Sagas** - Orchestrate complex workflows
- **Snapshots** - Optimize aggregate loading
- **Time Travel** - Debug by replaying events

## Quick Start

```typescript
import {
  EventStore,
  AggregateRoot,
  Repository,
  CommandBus,
} from '@philjs/event-sourcing';

// Define events
type AccountEvent =
  | { type: 'AccountCreated'; data: { name: string; balance: number } }
  | { type: 'MoneyDeposited'; data: { amount: number } }
  | { type: 'MoneyWithdrawn'; data: { amount: number } };

// Define aggregate
class Account extends AggregateRoot<AccountEvent> {
  name = '';
  balance = 0;

  static create(id: string, name: string): Account {
    const account = new Account(id);
    account.apply({ type: 'AccountCreated', data: { name, balance: 0 } });
    return account;
  }

  deposit(amount: number) {
    this.apply({ type: 'MoneyDeposited', data: { amount } });
  }

  withdraw(amount: number) {
    if (amount > this.balance) throw new Error('Insufficient funds');
    this.apply({ type: 'MoneyWithdrawn', data: { amount } });
  }

  protected applyEvent(event: AccountEvent) {
    switch (event.type) {
      case 'AccountCreated':
        this.name = event.data.name;
        this.balance = event.data.balance;
        break;
      case 'MoneyDeposited':
        this.balance += event.data.amount;
        break;
      case 'MoneyWithdrawn':
        this.balance -= event.data.amount;
        break;
    }
  }
}

// Use the aggregate
const store = new EventStore();
await store.initialize();

const repo = new Repository(store, Account);

const account = Account.create('acc-1', 'Savings');
account.deposit(1000);
account.withdraw(250);

await repo.save(account);

// Later: load and continue
const loaded = await repo.load('acc-1');
console.log(loaded.balance); // 750
```

## EventStore

### Configuration

```typescript
import { EventStore } from '@philjs/event-sourcing';

const store = new EventStore({
  storageKey: 'events',           // IndexedDB database name
  snapshotInterval: 100,          // Snapshot every N events
  retentionDays: 365,             // Event retention period
  enableCompression: true,        // Compress event data
  enableEncryption: false,        // Encrypt sensitive data
});

await store.initialize();
```

### Appending Events

```typescript
// Append single event
await store.append({
  streamId: 'order-123',
  type: 'OrderCreated',
  data: { customerId: 'cust-1', items: [...] },
  metadata: { userId: 'user-1', correlationId: 'req-1' },
});

// Append multiple events
await store.appendMany('order-123', [
  { type: 'OrderCreated', data: {...} },
  { type: 'ItemAdded', data: {...} },
  { type: 'PaymentReceived', data: {...} },
]);

// Optimistic concurrency
await store.append({
  streamId: 'order-123',
  type: 'OrderShipped',
  data: { trackingNumber: 'ABC123' },
  expectedVersion: 3,  // Fails if current version != 3
});
```

### Reading Events

```typescript
// Read all events for a stream
const events = await store.read('order-123');

// Read from specific version
const events = await store.read('order-123', { fromVersion: 5 });

// Read with limit
const events = await store.read('order-123', { limit: 10 });

// Read backwards
const events = await store.read('order-123', { direction: 'backward' });

// Read all events (global)
const allEvents = await store.readAll({ limit: 100 });

// Read by event type
const orderEvents = await store.readByType('OrderCreated');
```

### Subscriptions

```typescript
// Subscribe to stream
const unsubscribe = store.subscribe('order-123', (event) => {
  console.log('New event:', event);
});

// Subscribe to all events
store.subscribeAll((event) => {
  console.log('Global event:', event);
});

// Subscribe to event type
store.subscribeToType('OrderCreated', (event) => {
  notifyCustomer(event.data.customerId);
});

// Unsubscribe
unsubscribe();
```

### Stream Management

```typescript
// Get stream info
const info = await store.getStreamInfo('order-123');
console.log({
  version: info.version,
  eventCount: info.eventCount,
  createdAt: info.createdAt,
  lastEventAt: info.lastEventAt,
});

// List all streams
const streams = await store.listStreams();

// Delete stream (soft delete)
await store.deleteStream('order-123');

// Truncate stream (keep last N events)
await store.truncateStream('order-123', { keepLast: 100 });
```

## AggregateRoot

### Defining Aggregates

```typescript
import { AggregateRoot } from '@philjs/event-sourcing';

interface OrderEvent {
  type: string;
  data: any;
}

class Order extends AggregateRoot<OrderEvent> {
  customerId = '';
  items: OrderItem[] = [];
  status: 'pending' | 'paid' | 'shipped' | 'delivered' = 'pending';
  total = 0;

  // Factory method
  static create(id: string, customerId: string): Order {
    const order = new Order(id);
    order.apply({
      type: 'OrderCreated',
      data: { customerId, createdAt: new Date() },
    });
    return order;
  }

  // Commands
  addItem(item: OrderItem) {
    this.apply({
      type: 'ItemAdded',
      data: { item },
    });
  }

  removeItem(itemId: string) {
    if (!this.items.find(i => i.id === itemId)) {
      throw new Error('Item not found');
    }
    this.apply({
      type: 'ItemRemoved',
      data: { itemId },
    });
  }

  pay(paymentId: string) {
    if (this.status !== 'pending') {
      throw new Error('Order already paid');
    }
    this.apply({
      type: 'OrderPaid',
      data: { paymentId, paidAt: new Date() },
    });
  }

  ship(trackingNumber: string) {
    if (this.status !== 'paid') {
      throw new Error('Order not paid');
    }
    this.apply({
      type: 'OrderShipped',
      data: { trackingNumber, shippedAt: new Date() },
    });
  }

  // Event handlers
  protected applyEvent(event: OrderEvent) {
    switch (event.type) {
      case 'OrderCreated':
        this.customerId = event.data.customerId;
        break;
      case 'ItemAdded':
        this.items.push(event.data.item);
        this.total = this.calculateTotal();
        break;
      case 'ItemRemoved':
        this.items = this.items.filter(i => i.id !== event.data.itemId);
        this.total = this.calculateTotal();
        break;
      case 'OrderPaid':
        this.status = 'paid';
        break;
      case 'OrderShipped':
        this.status = 'shipped';
        break;
    }
  }

  private calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}
```

### Aggregate Properties

```typescript
const order = await repo.load('order-123');

// Aggregate properties
console.log(order.id);              // Aggregate ID
console.log(order.version);         // Current version
console.log(order.uncommittedEvents); // Pending events
console.log(order.isNew);           // No committed events
```

## Repository

### Basic Usage

```typescript
import { Repository } from '@philjs/event-sourcing';

const repo = new Repository(eventStore, Order);

// Save aggregate
const order = Order.create('order-1', 'customer-1');
order.addItem({ id: 'item-1', name: 'Widget', price: 29.99, quantity: 2 });
await repo.save(order);

// Load aggregate
const loaded = await repo.load('order-1');

// Load or create
const orderOrNew = await repo.loadOrCreate('order-2', () => {
  return Order.create('order-2', 'customer-2');
});
```

### Snapshots

```typescript
const repo = new Repository(eventStore, Order, {
  snapshotInterval: 50,    // Snapshot every 50 events
  snapshotStore: snapshotStore,
});

// Manual snapshot
await repo.saveSnapshot(order);

// Load with snapshot (automatic)
const loaded = await repo.load('order-1');
// Loads from snapshot + applies newer events
```

### Concurrency

```typescript
// Optimistic concurrency (default)
try {
  await repo.save(order);
} catch (error) {
  if (error.code === 'CONCURRENCY_ERROR') {
    // Another process modified the aggregate
    const fresh = await repo.load(order.id);
    // Retry operation on fresh aggregate
  }
}

// Get specific version
const orderV5 = await repo.loadAtVersion('order-1', 5);
```

## CommandBus

### Defining Commands

```typescript
import { CommandBus, CommandHandler } from '@philjs/event-sourcing';

// Define commands
interface CreateOrderCommand {
  type: 'CreateOrder';
  orderId: string;
  customerId: string;
}

interface AddItemCommand {
  type: 'AddItem';
  orderId: string;
  item: OrderItem;
}

// Create bus
const commandBus = new CommandBus();

// Register handlers
commandBus.register<CreateOrderCommand>('CreateOrder', async (cmd) => {
  const order = Order.create(cmd.orderId, cmd.customerId);
  await orderRepo.save(order);
  return order;
});

commandBus.register<AddItemCommand>('AddItem', async (cmd) => {
  const order = await orderRepo.load(cmd.orderId);
  order.addItem(cmd.item);
  await orderRepo.save(order);
  return order;
});

// Dispatch commands
await commandBus.dispatch({
  type: 'CreateOrder',
  orderId: 'order-1',
  customerId: 'cust-1',
});

await commandBus.dispatch({
  type: 'AddItem',
  orderId: 'order-1',
  item: { id: 'item-1', name: 'Widget', price: 29.99, quantity: 1 },
});
```

### Middleware

```typescript
// Logging middleware
commandBus.use(async (cmd, next) => {
  console.log('Executing command:', cmd.type);
  const startTime = Date.now();
  const result = await next();
  console.log(`Command ${cmd.type} took ${Date.now() - startTime}ms`);
  return result;
});

// Validation middleware
commandBus.use(async (cmd, next) => {
  const errors = validateCommand(cmd);
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
  return next();
});

// Auth middleware
commandBus.use(async (cmd, next) => {
  if (!currentUser.can(cmd.type)) {
    throw new UnauthorizedError();
  }
  return next();
});
```

## ReadModel (Projections)

### Defining Projections

```typescript
import { ReadModel } from '@philjs/event-sourcing';

// Order summary projection
const orderSummaryModel = new ReadModel('order-summaries');

orderSummaryModel.on('OrderCreated', async (event, state) => {
  return {
    ...state,
    [event.streamId]: {
      id: event.streamId,
      customerId: event.data.customerId,
      itemCount: 0,
      total: 0,
      status: 'pending',
      createdAt: event.data.createdAt,
    },
  };
});

orderSummaryModel.on('ItemAdded', async (event, state) => {
  const order = state[event.streamId];
  return {
    ...state,
    [event.streamId]: {
      ...order,
      itemCount: order.itemCount + 1,
      total: order.total + event.data.item.price * event.data.item.quantity,
    },
  };
});

orderSummaryModel.on('OrderPaid', async (event, state) => {
  return {
    ...state,
    [event.streamId]: {
      ...state[event.streamId],
      status: 'paid',
    },
  };
});

// Start projection
await orderSummaryModel.start(eventStore);

// Query projection
const summary = await orderSummaryModel.get('order-123');
const allOrders = await orderSummaryModel.getAll();
const pendingOrders = await orderSummaryModel.query(
  order => order.status === 'pending'
);
```

### Rebuilding Projections

```typescript
// Rebuild from beginning
await orderSummaryModel.rebuild(eventStore);

// Rebuild from checkpoint
await orderSummaryModel.rebuildFrom(eventStore, { fromPosition: 1000 });
```

## SagaManager

### Defining Sagas

```typescript
import { SagaManager, Saga } from '@philjs/event-sourcing';

// Order fulfillment saga
class OrderFulfillmentSaga extends Saga {
  state: 'created' | 'paid' | 'shipped' | 'completed' = 'created';

  constructor(id: string) {
    super(id);

    // React to events
    this.on('OrderPaid', async (event) => {
      this.state = 'paid';
      // Trigger shipping
      await this.dispatch({
        type: 'RequestShipping',
        orderId: event.streamId,
      });
    });

    this.on('ShippingConfirmed', async (event) => {
      this.state = 'shipped';
      // Notify customer
      await this.dispatch({
        type: 'SendShippingNotification',
        orderId: event.streamId,
        trackingNumber: event.data.trackingNumber,
      });
    });

    this.on('DeliveryConfirmed', async (event) => {
      this.state = 'completed';
      this.complete();
    });

    // Handle timeout
    this.onTimeout(async () => {
      if (this.state === 'paid') {
        await this.dispatch({
          type: 'EscalateShippingDelay',
          orderId: this.id,
        });
      }
    }, { after: '24h' });
  }
}

// Create manager
const sagaManager = new SagaManager({
  eventStore,
  sagaStore,
});

// Register saga
sagaManager.register('OrderFulfillment', OrderFulfillmentSaga, {
  startOn: 'OrderCreated',
  correlationKey: (event) => event.streamId,
});

// Start processing
await sagaManager.start();
```

### Saga Compensation

```typescript
class PaymentSaga extends Saga {
  constructor(id: string) {
    super(id);

    this.on('PaymentRequested', async (event) => {
      try {
        await this.dispatch({
          type: 'ChargeCard',
          amount: event.data.amount,
          cardId: event.data.cardId,
        });
      } catch (error) {
        // Compensate
        await this.compensate([
          { type: 'ReleaseInventory', orderId: event.data.orderId },
          { type: 'NotifyPaymentFailed', customerId: event.data.customerId },
        ]);
      }
    });
  }
}
```

## TimeTravelDebugger

### Basic Usage

```typescript
import { TimeTravelDebugger } from '@philjs/event-sourcing';

const debugger = new TimeTravelDebugger(eventStore);

// Get aggregate state at specific point
const orderAtV3 = await debugger.getStateAt('order-123', 3);

// Get state at timestamp
const orderYesterday = await debugger.getStateAtTime(
  'order-123',
  new Date('2024-01-15')
);

// Replay events step by step
const replay = debugger.createReplay('order-123');
for await (const state of replay) {
  console.log('Event:', state.event);
  console.log('State after:', state.aggregate);
}
```

### Diff and Compare

```typescript
// Compare two versions
const diff = await debugger.diff('order-123', 1, 5);
console.log(diff);
// { added: [...], removed: [...], changed: [...] }

// Find event that caused a change
const event = await debugger.findEventCausingChange(
  'order-123',
  (state) => state.status === 'shipped'
);
```

## React-style Hooks

### useEventStore

```typescript
import { useEventStore } from '@philjs/event-sourcing';

function EventViewer() {
  const {
    events,
    isLoading,
    append,
    subscribe,
  } = useEventStore('orders');

  useEffect(() => {
    return subscribe((event) => {
      console.log('New event:', event);
    });
  }, []);

  return (
    <div>
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
```

### useAggregate

```typescript
import { useAggregate } from '@philjs/event-sourcing';

function OrderView({ orderId }: { orderId: string }) {
  const {
    aggregate: order,
    isLoading,
    error,
    dispatch,
    reload,
  } = useAggregate(Order, orderId);

  const handleAddItem = async (item: OrderItem) => {
    await dispatch((order) => {
      order.addItem(item);
    });
  };

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      <h1>Order {order.id}</h1>
      <p>Status: {order.status}</p>
      <p>Total: ${order.total}</p>
      <ItemList items={order.items} />
      <AddItemForm onAdd={handleAddItem} />
    </div>
  );
}
```

### useReadModel

```typescript
import { useReadModel } from '@philjs/event-sourcing';

function OrderDashboard() {
  const {
    data,
    isLoading,
    query,
  } = useReadModel(orderSummaryModel);

  const pendingOrders = query(order => order.status === 'pending');

  return (
    <div>
      <h2>Pending Orders ({pendingOrders.length})</h2>
      {pendingOrders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
```

### useTimeTravel

```typescript
import { useTimeTravel } from '@philjs/event-sourcing';

function AggregateDebugger({ aggregateId }: { aggregateId: string }) {
  const {
    currentVersion,
    maxVersion,
    state,
    events,
    goTo,
    stepForward,
    stepBackward,
    isPlaying,
    play,
    pause,
  } = useTimeTravel(Order, aggregateId);

  return (
    <div>
      <StateViewer state={state} />

      <div className="controls">
        <button onClick={stepBackward} disabled={currentVersion === 0}>
          ⏪ Back
        </button>
        <button onClick={isPlaying ? pause : play}>
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <button onClick={stepForward} disabled={currentVersion === maxVersion}>
          ⏩ Forward
        </button>
      </div>

      <input
        type="range"
        min={0}
        max={maxVersion}
        value={currentVersion}
        onChange={(e) => goTo(Number(e.target.value))}
      />

      <EventTimeline events={events} currentVersion={currentVersion} />
    </div>
  );
}
```

## Types Reference

```typescript
// Event
interface Event<T = any> {
  id: string;
  streamId: string;
  type: string;
  data: T;
  metadata?: Record<string, any>;
  version: number;
  timestamp: Date;
}

// Aggregate root
abstract class AggregateRoot<E> {
  readonly id: string;
  readonly version: number;
  readonly uncommittedEvents: E[];
  readonly isNew: boolean;

  apply(event: E): void;
  protected abstract applyEvent(event: E): void;
}

// Command
interface Command {
  type: string;
  [key: string]: any;
}

// Saga state
interface SagaState {
  id: string;
  status: 'running' | 'completed' | 'failed';
  currentStep: string;
  data: Record<string, any>;
}

// Read model state
interface ReadModelState<T> {
  [key: string]: T;
}
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `EventStore` | Append-only event storage |
| `AggregateRoot` | Base class for aggregates |
| `Repository` | Load/save aggregates |
| `CommandBus` | Command dispatch and handling |
| `ReadModel` | Event projections |
| `SagaManager` | Saga orchestration |
| `TimeTravelDebugger` | Event replay debugging |

### Hooks

| Hook | Description |
|------|-------------|
| `useEventStore(stream)` | Event store operations |
| `useAggregate(type, id)` | Aggregate management |
| `useReadModel(model)` | Read model queries |
| `useTimeTravel(type, id)` | Time-travel debugging |
