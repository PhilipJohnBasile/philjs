/**
 * @philjs/tokio - Async Runtime Bindings
 *
 * TypeScript bindings for Tokio async runtime primitives.
 * Provides tasks, channels, timers, and synchronization primitives.
 */

// ============================================================================
// Task Types
// ============================================================================

/**
 * Task handle for spawned async operations
 */
export interface TaskHandle<T> {
  /** Wait for task completion */
  await(): Promise<T>;
  /** Cancel the task */
  cancel(): void;
  /** Check if task is finished */
  isFinished(): boolean;
  /** Check if task was cancelled */
  isCancelled(): boolean;
}

/**
 * Task spawn options
 */
export interface SpawnOptions {
  /** Task name for debugging */
  name?: string;
  /** Stack size in bytes */
  stackSize?: number;
}

/**
 * Join handle for multiple tasks
 */
export interface JoinHandle<T> {
  /** Wait for all tasks */
  join(): Promise<T[]>;
  /** Wait for any task to complete */
  race(): Promise<T>;
  /** Cancel all tasks */
  cancelAll(): void;
}

/**
 * Spawn a new task
 */
export function spawn<T>(fn: () => Promise<T>, options?: SpawnOptions): TaskHandle<T> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Spawn a blocking task
 */
export function spawnBlocking<T>(fn: () => T, options?: SpawnOptions): TaskHandle<T> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Join multiple task handles
 */
export function joinAll<T>(handles: TaskHandle<T>[]): JoinHandle<T> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Yield execution to other tasks
 */
export function yieldNow(): Promise<void> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

// ============================================================================
// Channel Types
// ============================================================================

/**
 * MPSC (multi-producer single-consumer) channel sender
 */
export interface Sender<T> {
  /** Send a value */
  send(value: T): Promise<void>;
  /** Try to send without blocking */
  trySend(value: T): boolean;
  /** Check if receiver is closed */
  isClosed(): boolean;
  /** Get channel capacity */
  capacity(): number | undefined;
  /** Close the sender */
  close(): void;
}

/**
 * MPSC channel receiver
 */
export interface Receiver<T> {
  /** Receive a value */
  recv(): Promise<T | undefined>;
  /** Try to receive without blocking */
  tryRecv(): T | undefined;
  /** Check if channel is empty */
  isEmpty(): boolean;
  /** Check if senders are closed */
  isClosed(): boolean;
  /** Close the receiver */
  close(): void;
  /** Async iterator */
  [Symbol.asyncIterator](): AsyncIterator<T>;
}

/**
 * MPSC channel
 */
export interface MpscChannel<T> {
  sender: Sender<T>;
  receiver: Receiver<T>;
}

/**
 * Create a bounded MPSC channel
 */
export function channel<T>(capacity: number): MpscChannel<T> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Create an unbounded MPSC channel
 */
export function unboundedChannel<T>(): MpscChannel<T> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Oneshot channel sender
 */
export interface OneshotSender<T> {
  /** Send the value (consumes sender) */
  send(value: T): boolean;
  /** Check if receiver is closed */
  isClosed(): boolean;
}

/**
 * Oneshot channel receiver
 */
export interface OneshotReceiver<T> {
  /** Receive the value */
  await(): Promise<T>;
  /** Try to receive without blocking */
  tryRecv(): T | undefined;
  /** Close the receiver */
  close(): void;
}

/**
 * Oneshot channel
 */
export interface OneshotChannel<T> {
  sender: OneshotSender<T>;
  receiver: OneshotReceiver<T>;
}

/**
 * Create a oneshot channel
 */
export function oneshot<T>(): OneshotChannel<T> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Broadcast channel sender
 */
export interface BroadcastSender<T> {
  /** Send to all receivers */
  send(value: T): number;
  /** Create a new receiver */
  subscribe(): BroadcastReceiver<T>;
  /** Get number of receivers */
  receiverCount(): number;
}

/**
 * Broadcast channel receiver
 */
export interface BroadcastReceiver<T> {
  /** Receive next value */
  recv(): Promise<T>;
  /** Try to receive without blocking */
  tryRecv(): T | undefined;
}

/**
 * Create a broadcast channel
 */
export function broadcast<T>(capacity: number): {
  sender: BroadcastSender<T>;
  receiver: BroadcastReceiver<T>;
} {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Watch channel (single value, multiple observers)
 */
export interface WatchSender<T> {
  /** Send new value */
  send(value: T): void;
  /** Modify value */
  modify(fn: (value: T) => T): void;
  /** Get current value */
  borrow(): T;
  /** Create a receiver */
  subscribe(): WatchReceiver<T>;
}

/**
 * Watch channel receiver
 */
export interface WatchReceiver<T> {
  /** Get current value */
  borrow(): T;
  /** Wait for change */
  changed(): Promise<void>;
  /** Check if sender is closed */
  isClosed(): boolean;
}

/**
 * Create a watch channel
 */
export function watch<T>(initial: T): {
  sender: WatchSender<T>;
  receiver: WatchReceiver<T>;
} {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

// ============================================================================
// Timer Types
// ============================================================================

/**
 * Sleep for specified duration
 */
export function sleep(ms: number): Promise<void> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Sleep until a specific instant
 */
export function sleepUntil(instant: number): Promise<void> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Timeout handle
 */
export interface Timeout<T> {
  /** Wait for result or timeout */
  await(): Promise<T | undefined>;
  /** Check if timed out */
  isTimedOut(): boolean;
}

/**
 * Apply timeout to a promise
 */
export function timeout<T>(promise: Promise<T>, ms: number): Timeout<T> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Apply timeout, throw on expiry
 */
export function timeoutError<T>(promise: Promise<T>, ms: number): Promise<T> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Interval handle
 */
export interface Interval {
  /** Wait for next tick */
  tick(): Promise<void>;
  /** Reset the interval */
  reset(): void;
  /** Get period in milliseconds */
  period(): number;
  /** Stop the interval */
  stop(): void;
}

/**
 * Create an interval
 */
export function interval(ms: number): Interval {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Create an interval starting immediately
 */
export function intervalAt(startMs: number, periodMs: number): Interval {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Instant (point in time)
 */
export interface Instant {
  /** Elapsed time since instant in milliseconds */
  elapsed(): number;
  /** Duration until another instant */
  durationSince(earlier: Instant): number;
  /** Check if instant is in the past */
  isPast(): boolean;
}

/**
 * Get current instant
 */
export function now(): Instant {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

// ============================================================================
// Synchronization Types
// ============================================================================

/**
 * Mutex guard
 */
export interface MutexGuard<T> {
  /** Get the value */
  get(): T;
  /** Set the value */
  set(value: T): void;
  /** Release the lock */
  release(): void;
}

/**
 * Async mutex
 */
export interface Mutex<T> {
  /** Acquire the lock */
  lock(): Promise<MutexGuard<T>>;
  /** Try to acquire without blocking */
  tryLock(): MutexGuard<T> | undefined;
  /** Check if locked */
  isLocked(): boolean;
}

/**
 * Create a mutex
 */
export function mutex<T>(value: T): Mutex<T> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * RwLock read guard
 */
export interface RwLockReadGuard<T> {
  /** Get the value */
  get(): T;
  /** Release the lock */
  release(): void;
}

/**
 * RwLock write guard
 */
export interface RwLockWriteGuard<T> {
  /** Get the value */
  get(): T;
  /** Set the value */
  set(value: T): void;
  /** Release the lock */
  release(): void;
}

/**
 * Read-write lock
 */
export interface RwLock<T> {
  /** Acquire read lock */
  read(): Promise<RwLockReadGuard<T>>;
  /** Try to acquire read lock */
  tryRead(): RwLockReadGuard<T> | undefined;
  /** Acquire write lock */
  write(): Promise<RwLockWriteGuard<T>>;
  /** Try to acquire write lock */
  tryWrite(): RwLockWriteGuard<T> | undefined;
}

/**
 * Create a read-write lock
 */
export function rwLock<T>(value: T): RwLock<T> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Semaphore permit
 */
export interface SemaphorePermit {
  /** Release the permit */
  release(): void;
}

/**
 * Semaphore
 */
export interface Semaphore {
  /** Acquire a permit */
  acquire(): Promise<SemaphorePermit>;
  /** Acquire multiple permits */
  acquireMany(n: number): Promise<SemaphorePermit>;
  /** Try to acquire without blocking */
  tryAcquire(): SemaphorePermit | undefined;
  /** Get available permits */
  availablePermits(): number;
  /** Add permits */
  addPermits(n: number): void;
  /** Close the semaphore */
  close(): void;
}

/**
 * Create a semaphore
 */
export function semaphore(permits: number): Semaphore {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Barrier
 */
export interface Barrier {
  /** Wait for all parties */
  wait(): Promise<BarrierWaitResult>;
  /** Get number of parties */
  parties(): number;
}

/**
 * Barrier wait result
 */
export interface BarrierWaitResult {
  /** Whether this was the leader */
  isLeader: boolean;
}

/**
 * Create a barrier
 */
export function barrier(parties: number): Barrier {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Notify (condition variable)
 */
export interface Notify {
  /** Wait for notification */
  notified(): Promise<void>;
  /** Notify one waiter */
  notifyOne(): void;
  /** Notify all waiters */
  notifyAll(): void;
}

/**
 * Create a notify
 */
export function notify(): Notify {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * OnceCell (lazy initialization)
 */
export interface OnceCell<T> {
  /** Get value or initialize */
  getOrInit(fn: () => Promise<T>): Promise<T>;
  /** Get value if initialized */
  get(): T | undefined;
  /** Check if initialized */
  isInitialized(): boolean;
}

/**
 * Create a once cell
 */
export function onceCell<T>(): OnceCell<T> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

// ============================================================================
// Runtime Types
// ============================================================================

/**
 * Runtime configuration
 */
export interface RuntimeConfig {
  /** Number of worker threads */
  workerThreads?: number;
  /** Thread stack size */
  threadStackSize?: number;
  /** Enable IO driver */
  enableIo?: boolean;
  /** Enable time driver */
  enableTime?: boolean;
  /** Thread name prefix */
  threadNamePrefix?: string;
}

/**
 * Runtime handle
 */
export interface Runtime {
  /** Spawn a task on this runtime */
  spawn<T>(fn: () => Promise<T>): TaskHandle<T>;
  /** Block on a future */
  blockOn<T>(fn: () => Promise<T>): T;
  /** Shutdown the runtime */
  shutdown(): void;
  /** Get runtime metrics */
  metrics(): RuntimeMetrics;
}

/**
 * Runtime metrics
 */
export interface RuntimeMetrics {
  /** Number of worker threads */
  numWorkers: number;
  /** Number of active tasks */
  numBlockingThreads: number;
  /** Number of idle workers */
  numIdleBlockingThreads: number;
  /** Total polls */
  totalPollCount: number;
}

/**
 * Create a multi-threaded runtime
 */
export function createRuntime(config?: RuntimeConfig): Runtime {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Create a current-thread runtime
 */
export function createCurrentThreadRuntime(config?: RuntimeConfig): Runtime {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

// ============================================================================
// Select Types
// ============================================================================

/**
 * Select branch
 */
export interface SelectBranch<T> {
  /** Channel to select from */
  channel: Receiver<T>;
  /** Handler for received value */
  handler: (value: T) => void;
}

/**
 * Select from multiple channels
 */
export function select<T>(...branches: SelectBranch<T>[]): Promise<void> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Select with timeout
 */
export function selectTimeout<T>(
  timeoutMs: number,
  ...branches: SelectBranch<T>[]
): Promise<boolean> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

// ============================================================================
// IO Types (if enabled)
// ============================================================================

/**
 * Async reader
 */
export interface AsyncReader {
  /** Read into buffer */
  read(buf: Uint8Array): Promise<number>;
  /** Read exact bytes */
  readExact(buf: Uint8Array): Promise<void>;
  /** Read to end */
  readToEnd(): Promise<Uint8Array>;
  /** Read line */
  readLine(): Promise<string | undefined>;
}

/**
 * Async writer
 */
export interface AsyncWriter {
  /** Write buffer */
  write(buf: Uint8Array): Promise<number>;
  /** Write all bytes */
  writeAll(buf: Uint8Array): Promise<void>;
  /** Flush */
  flush(): Promise<void>;
  /** Shutdown */
  shutdown(): Promise<void>;
}

/**
 * Buffered reader
 */
export interface BufReader extends AsyncReader {
  /** Get buffer contents */
  buffer(): Uint8Array;
  /** Fill buffer */
  fillBuf(): Promise<Uint8Array>;
  /** Consume bytes from buffer */
  consume(n: number): void;
}

/**
 * Buffered writer
 */
export interface BufWriter extends AsyncWriter {
  /** Get buffer contents */
  buffer(): Uint8Array;
}

/**
 * Create buffered reader
 */
export function bufReader(reader: AsyncReader, capacity?: number): BufReader {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Create buffered writer
 */
export function bufWriter(writer: AsyncWriter, capacity?: number): BufWriter {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

// All types are exported at their declaration points above
