/**
 * @file Bevy Game Engine Hooks
 * @description PhilJS hooks for Bevy WASM integration
 */
// ============================================================================
// State Management
// ============================================================================
/** Global Bevy instances map */
const bevyInstances = new Map();
/** Default instance key */
const DEFAULT_INSTANCE_KEY = '__default__';
/** Event listeners */
const eventListeners = new Map();
/** Current hook context for reactive updates */
let currentHookContext = null;
// ============================================================================
// Instance Creation
// ============================================================================
/**
 * Create and initialize a Bevy WASM application instance
 *
 * @param config - Bevy configuration
 * @returns Promise resolving to Bevy instance
 *
 * @example
 * ```ts
 * const instance = await createBevyInstance({
 *   wasmPath: '/game.wasm',
 *   canvas: '#game-canvas',
 *   width: 1280,
 *   height: 720,
 * });
 *
 * instance.app.run();
 * ```
 */
export async function createBevyInstance(config) {
    const instanceKey = config.canvas instanceof HTMLCanvasElement
        ? config.canvas.id || DEFAULT_INSTANCE_KEY
        : config.canvas;
    // Check for existing instance
    const existing = bevyInstances.get(instanceKey);
    if (existing && existing.state !== 'disposed') {
        return existing;
    }
    // Get canvas element
    const canvas = config.canvas instanceof HTMLCanvasElement
        ? config.canvas
        : document.querySelector(config.canvas);
    if (!canvas) {
        throw new Error(`Canvas not found: ${config.canvas}`);
    }
    // Create instance placeholder
    const instance = {
        app: null, // Will be set after initialization
        module: null,
        instance: null,
        memory: null,
        state: 'loading',
        config,
    };
    bevyInstances.set(instanceKey, instance);
    emitEvent('loading', { instanceKey });
    try {
        // Load the WASM module
        instance.state = 'loading';
        const wasmResponse = await fetch(config.wasmPath);
        if (!wasmResponse.ok) {
            throw new Error(`Failed to load WASM: ${wasmResponse.statusText}`);
        }
        const wasmBytes = await wasmResponse.arrayBuffer();
        // Compile the module
        instance.state = 'compiling';
        instance.module = await WebAssembly.compile(wasmBytes);
        // Create memory
        const memoryConfig = config.memory || { initial: 256, maximum: 16384 };
        instance.memory = new WebAssembly.Memory({
            initial: memoryConfig.initial ?? 256,
            maximum: memoryConfig.maximum ?? 16384,
            shared: true,
        });
        // Create import object
        const importObject = createBevyImports(instance, canvas, config);
        // Instantiate the module
        instance.state = 'instantiating';
        const wasmInstance = await WebAssembly.instantiate(instance.module, importObject);
        instance.instance = wasmInstance;
        // Initialize the app
        instance.state = 'initializing';
        instance.app = createBevyApp(instance, canvas, config);
        // Preload assets if specified
        if (config.preloadAssets && config.preloadAssets.length > 0) {
            await preloadBevyAssets(instance, config.preloadAssets);
        }
        // Mark as running
        instance.state = 'running';
        emitEvent('ready', { app: instance.app });
        return instance;
    }
    catch (error) {
        instance.state = 'error';
        instance.error = error instanceof Error ? error : new Error(String(error));
        emitEvent('error', { error: instance.error });
        throw instance.error;
    }
}
/**
 * Create import object for Bevy WASM module
 */
function createBevyImports(instance, canvas, config) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    return {
        env: {
            memory: instance.memory,
            // Console logging
            bevy_console_log: (ptr, len) => {
                const bytes = new Uint8Array(instance.memory.buffer, ptr, len);
            },
            bevy_console_warn: (ptr, len) => {
                const bytes = new Uint8Array(instance.memory.buffer, ptr, len);
                console.warn('[Bevy]', decoder.decode(bytes));
            },
            bevy_console_error: (ptr, len) => {
                const bytes = new Uint8Array(instance.memory.buffer, ptr, len);
                console.error('[Bevy]', decoder.decode(bytes));
            },
            // Canvas operations
            bevy_canvas_get_width: () => canvas.width,
            bevy_canvas_get_height: () => canvas.height,
            bevy_canvas_set_size: (width, height) => {
                canvas.width = width;
                canvas.height = height;
            },
            // WebGL context
            bevy_webgl_get_context: () => {
                const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
                return gl ? 1 : 0;
            },
            // Time
            bevy_get_time: () => performance.now(),
            bevy_get_random: () => Math.random(),
            // Input state (will be updated by input handlers)
            bevy_input_keyboard_pressed: () => 0,
            bevy_input_mouse_position_x: () => 0,
            bevy_input_mouse_position_y: () => 0,
            bevy_input_mouse_button: () => 0,
            // Event dispatch
            bevy_dispatch_event: (typePtr, typeLen, dataPtr, dataLen) => {
                const type = decoder.decode(new Uint8Array(instance.memory.buffer, typePtr, typeLen));
                const data = JSON.parse(decoder.decode(new Uint8Array(instance.memory.buffer, dataPtr, dataLen)));
                emitEvent(type, data);
            },
            // Panic handler
            bevy_panic: (ptr, len) => {
                const message = decoder.decode(new Uint8Array(instance.memory.buffer, ptr, len));
                const error = new Error(`Bevy panic: ${message}`);
                instance.state = 'error';
                instance.error = error;
                emitEvent('error', { error });
                throw error;
            },
        },
        wasi_snapshot_preview1: {
            // Minimal WASI implementation for compatibility
            proc_exit: (code) => {
                console.log('[Bevy] Process exit with code:', code);
            },
            fd_write: () => 0,
            fd_read: () => 0,
            fd_close: () => 0,
            fd_seek: () => 0,
            environ_get: () => 0,
            environ_sizes_get: () => 0,
            args_get: () => 0,
            args_sizes_get: () => 0,
            clock_time_get: (id, precision, outPtr) => {
                const view = new DataView(instance.memory.buffer);
                view.setBigInt64(outPtr, BigInt(Date.now()) * 1000000n, true);
                return 0;
            },
            random_get: (bufPtr, bufLen) => {
                const buf = new Uint8Array(instance.memory.buffer, bufPtr, bufLen);
                crypto.getRandomValues(buf);
                return 0;
            },
        },
    };
}
/**
 * Create Bevy app wrapper
 */
function createBevyApp(instance, canvas, config) {
    let running = false;
    let animationFrameId = null;
    let lastFrameTime = 0;
    let deltaTime = 0;
    let elapsedTime = 0;
    let frameCount = 0;
    let fps = 0;
    let fpsUpdateTime = 0;
    const targetFrameTime = config.targetFps ? 1000 / config.targetFps : 0;
    // Get exported functions from WASM
    const exports = instance.instance.exports;
    const bevyInit = exports['bevy_init'] || exports['_start'] || (() => { });
    const bevyUpdate = exports['bevy_update'] || (() => { });
    const bevyRender = exports['bevy_render'] || (() => { });
    const bevyShutdown = exports['bevy_shutdown'] || (() => { });
    // Create world interface
    const world = createBevyWorld(instance);
    const gameLoop = (currentTime) => {
        if (!running)
            return;
        deltaTime = (currentTime - lastFrameTime) / 1000;
        lastFrameTime = currentTime;
        elapsedTime += deltaTime;
        frameCount++;
        // Update FPS counter
        if (currentTime - fpsUpdateTime >= 1000) {
            fps = frameCount;
            frameCount = 0;
            fpsUpdateTime = currentTime;
        }
        // Frame rate limiting
        if (targetFrameTime > 0) {
            const frameTime = currentTime - lastFrameTime;
            if (frameTime < targetFrameTime) {
                animationFrameId = requestAnimationFrame(gameLoop);
                return;
            }
        }
        try {
            // Call Bevy update
            bevyUpdate(deltaTime);
            // Call Bevy render
            bevyRender();
            // Emit frame event
            emitEvent('frame', { delta: deltaTime, elapsed: elapsedTime, fps });
        }
        catch (error) {
            console.error('[Bevy] Error in game loop:', error);
            instance.state = 'error';
            instance.error = error instanceof Error ? error : new Error(String(error));
            running = false;
            emitEvent('error', { error: instance.error });
            return;
        }
        animationFrameId = requestAnimationFrame(gameLoop);
    };
    return {
        run: async () => {
            if (running)
                return;
            running = true;
            instance.state = 'running';
            // Initialize Bevy
            bevyInit();
            // Start game loop
            lastFrameTime = performance.now();
            fpsUpdateTime = lastFrameTime;
            animationFrameId = requestAnimationFrame(gameLoop);
        },
        pause: () => {
            if (!running)
                return;
            running = false;
            instance.state = 'paused';
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            emitEvent('pause', {});
        },
        resume: () => {
            if (running)
                return;
            running = true;
            instance.state = 'running';
            lastFrameTime = performance.now();
            animationFrameId = requestAnimationFrame(gameLoop);
            emitEvent('resume', {});
        },
        isRunning: () => running,
        getCanvas: () => canvas,
        resize: (width, height) => {
            const pixelRatio = config.pixelRatio || window.devicePixelRatio || 1;
            canvas.width = width * pixelRatio;
            canvas.height = height * pixelRatio;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            emitEvent('resize', { width, height });
        },
        setTargetFps: (newFps) => {
            config.targetFps = newFps;
        },
        getFps: () => fps,
        getDeltaTime: () => deltaTime,
        getElapsedTime: () => elapsedTime,
        dispatchEvent: (event) => {
            emitEvent(event.type, event.data);
        },
        addEventListener: (type, listener) => {
            const key = type;
            if (!eventListeners.has(key)) {
                eventListeners.set(key, new Set());
            }
            eventListeners.get(key).add(listener);
            return () => {
                eventListeners.get(key)?.delete(listener);
            };
        },
        getWorld: () => world,
        dispose: async () => {
            running = false;
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            bevyShutdown();
            instance.state = 'disposed';
            bevyInstances.delete(config.canvas instanceof HTMLCanvasElement
                ? config.canvas.id || DEFAULT_INSTANCE_KEY
                : config.canvas);
        },
    };
}
/**
 * Create Bevy world interface
 */
function createBevyWorld(instance) {
    const entities = new Map();
    let nextEntityId = 0;
    const createEntity = (id) => {
        const components = new Map();
        const entity = {
            id: id,
            generation: 0,
            isValid: () => entities.has(id),
            getComponents: () => Array.from(components.values()),
            hasComponent: (type) => components.has(type.componentName),
            getComponent: (type) => components.get(type.componentName),
            insertComponent: (component) => {
                components.set(component.componentName, component);
                emitEvent('component-added', { entity, component: component.componentName });
            },
            removeComponent: (type) => {
                if (components.has(type.componentName)) {
                    components.delete(type.componentName);
                    emitEvent('component-removed', { entity, component: type.componentName });
                }
            },
            despawn: () => {
                entities.delete(id);
                emitEvent('entity-despawned', { entityId: id });
            },
        };
        return entity;
    };
    const resources = new Map();
    return {
        spawn: () => {
            const id = nextEntityId++;
            const entity = createEntity(id);
            entities.set(id, entity);
            emitEvent('entity-spawned', { entity });
            return entity;
        },
        spawnBundle: (...components) => {
            const id = nextEntityId++;
            const entity = createEntity(id);
            for (const component of components) {
                entity.insertComponent(component);
            }
            entities.set(id, entity);
            emitEvent('entity-spawned', { entity });
            return entity;
        },
        getEntity: (id) => entities.get(id),
        despawn: (entity) => {
            entities.delete(entity.id);
            emitEvent('entity-despawned', { entityId: entity.id });
        },
        query: (query) => {
            const matchingEntities = [];
            for (const entity of entities.values()) {
                let matches = true;
                // Check required components
                for (const componentName of query.components) {
                    if (!entity.getComponents().some((c) => c.componentName === componentName)) {
                        matches = false;
                        break;
                    }
                }
                // Check filters
                if (matches && query.filters) {
                    for (const filter of query.filters) {
                        if (filter.type === 'with') {
                            if (!entity.getComponents().some((c) => c.componentName === filter.component)) {
                                matches = false;
                                break;
                            }
                        }
                        else if (filter.type === 'without') {
                            if (entity.getComponents().some((c) => c.componentName === filter.component)) {
                                matches = false;
                                break;
                            }
                        }
                    }
                }
                if (matches) {
                    matchingEntities.push(entity);
                }
            }
            return {
                entities: matchingEntities,
                iter: function* () {
                    for (const entity of matchingEntities) {
                        const components = query.components.map((name) => entity.getComponents().find((c) => c.componentName === name));
                        yield [entity, ...components];
                    }
                },
                single: () => {
                    if (matchingEntities.length === 0)
                        return undefined;
                    const entity = matchingEntities[0];
                    const components = query.components.map((name) => entity.getComponents().find((c) => c.componentName === name));
                    return [entity, ...components];
                },
                count: () => matchingEntities.length,
                isEmpty: () => matchingEntities.length === 0,
                map: (fn) => {
                    const results = [];
                    for (const entity of matchingEntities) {
                        const components = query.components.map((name) => entity.getComponents().find((c) => c.componentName === name));
                        results.push(fn(entity, ...components));
                    }
                    return results;
                },
                filter: function (fn) {
                    const filtered = matchingEntities.filter((entity) => {
                        const components = query.components.map((name) => entity.getComponents().find((c) => c.componentName === name));
                        return fn(entity, ...components);
                    });
                    return { ...this, entities: filtered };
                },
                forEach: (fn) => {
                    for (const entity of matchingEntities) {
                        const components = query.components.map((name) => entity.getComponents().find((c) => c.componentName === name));
                        fn(entity, ...components);
                    }
                },
            };
        },
        getResource: (type) => resources.get(type.resourceName),
        insertResource: (resource) => resources.set(resource.resourceName, resource),
        removeResource: (type) => resources.delete(type.resourceName),
        hasResource: (type) => resources.has(type.resourceName),
        clear: () => entities.clear(),
        entityCount: () => entities.size,
    };
}
/**
 * Preload assets for Bevy
 */
async function preloadBevyAssets(instance, paths) {
    const promises = paths.map(async (path) => {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to load asset: ${path}`);
            }
            const blob = await response.blob();
            emitEvent('asset-loaded', { path, type: blob.type });
        }
        catch (error) {
            emitEvent('asset-error', {
                path,
                error: error instanceof Error ? error : new Error(String(error)),
            });
        }
    });
    await Promise.all(promises);
}
/**
 * Emit event to listeners
 */
function emitEvent(type, data) {
    const event = {
        type,
        timestamp: performance.now(),
    };
    if (data !== undefined) {
        event.data = data;
    }
    const listeners = eventListeners.get(type);
    if (listeners) {
        for (const listener of listeners) {
            try {
                listener(event);
            }
            catch (error) {
                console.error('[Bevy] Error in event listener:', error);
            }
        }
    }
}
// ============================================================================
// Hooks
// ============================================================================
/**
 * Get Bevy instance for a canvas
 */
export function getBevy(canvasOrKey) {
    const key = canvasOrKey instanceof HTMLCanvasElement
        ? canvasOrKey.id || DEFAULT_INSTANCE_KEY
        : canvasOrKey || DEFAULT_INSTANCE_KEY;
    return bevyInstances.get(key) || null;
}
/**
 * Hook for accessing Bevy app
 *
 * @param canvasOrKey - Canvas element or instance key
 * @returns Bevy hook result
 *
 * @example
 * ```tsx
 * function GameUI() {
 *   const { instance, isReady, pause, resume } = useBevy();
 *
 *   if (!isReady) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       <button onClick={pause}>Pause</button>
 *       <button onClick={resume}>Resume</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useBevy(canvasOrKey) {
    const instance = getBevy(canvasOrKey);
    return {
        instance,
        state: instance?.state || 'idle',
        error: instance?.error || null,
        isReady: instance?.state === 'running' || instance?.state === 'paused',
        isLoading: instance?.state === 'loading' ||
            instance?.state === 'compiling' ||
            instance?.state === 'instantiating' ||
            instance?.state === 'initializing',
        pause: () => instance?.app?.pause(),
        resume: () => instance?.app?.resume(),
        restart: async () => {
            if (instance) {
                await instance.app?.dispose();
                await createBevyInstance(instance.config);
            }
        },
    };
}
/**
 * Hook for accessing a specific entity
 *
 * @param entityId - Entity ID to access
 * @param canvasOrKey - Canvas element or instance key
 * @returns Entity hook result
 *
 * @example
 * ```tsx
 * function PlayerStats({ playerId }: { playerId: EntityId }) {
 *   const { entity, getComponent } = useBevyEntity(playerId);
 *
 *   if (!entity) return null;
 *
 *   const health = getComponent(HealthComponent);
 *   return <div>Health: {health?.value || 0}</div>;
 * }
 * ```
 */
export function useBevyEntity(entityId, canvasOrKey) {
    const instance = getBevy(canvasOrKey);
    const entity = instance?.app?.getWorld().getEntity(entityId) || null;
    return {
        entity,
        isValid: entity?.isValid() || false,
        getComponent: (type) => entity?.getComponent(type),
        hasComponent: (type) => entity?.hasComponent(type) || false,
        insertComponent: (component) => entity?.insertComponent(component),
        removeComponent: (type) => entity?.removeComponent(type),
        despawn: () => entity?.despawn(),
    };
}
/**
 * Hook for accessing a resource
 *
 * @param resourceType - Resource type constructor
 * @param canvasOrKey - Canvas element or instance key
 * @returns Resource hook result
 *
 * @example
 * ```tsx
 * function TimeDisplay() {
 *   const { resource } = useBevyResource(TimeResource);
 *
 *   return <div>Elapsed: {resource?.elapsedSecs.toFixed(2)}s</div>;
 * }
 * ```
 */
export function useBevyResource(resourceType, canvasOrKey) {
    const instance = getBevy(canvasOrKey);
    const world = instance?.app?.getWorld();
    const resource = world?.getResource(resourceType) || null;
    return {
        resource,
        isAvailable: resource !== null,
        update: (updates) => {
            if (resource && world) {
                const updated = { ...resource, ...updates };
                world.insertResource(updated);
            }
        },
        remove: () => {
            if (world) {
                world.removeResource(resourceType);
            }
        },
    };
}
/**
 * Hook for querying entities
 *
 * @param query - Query descriptor
 * @param canvasOrKey - Canvas element or instance key
 * @returns Query hook result
 *
 * @example
 * ```tsx
 * function EnemyList() {
 *   const { results, count } = useBevyQuery({
 *     components: ['Transform', 'Enemy', 'Health'],
 *     filters: [{ type: 'with', component: 'Visible' }],
 *   });
 *
 *   return (
 *     <div>
 *       <h2>Enemies: {count}</h2>
 *       {results?.map((entity) => (
 *         <EnemyCard key={entity.id} entity={entity} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useBevyQuery(query, canvasOrKey) {
    const instance = getBevy(canvasOrKey);
    const world = instance?.app?.getWorld();
    const results = world?.query(query) || null;
    return {
        results,
        count: results?.count() || 0,
        isEmpty: results?.isEmpty() ?? true,
        refresh: () => {
            // In a reactive framework, this would trigger a re-render
        },
    };
}
// ============================================================================
// Event Handling
// ============================================================================
/**
 * Listen to Bevy events
 *
 * @param event - Event type to listen for
 * @param callback - Callback function
 * @param canvasOrKey - Canvas element or instance key
 * @returns Unsubscribe function
 *
 * @example
 * ```ts
 * const unsubscribe = onBevyEvent('entity-spawned', (event) => {
 *   console.log('Entity spawned:', event.data.entity.id);
 * });
 *
 * // Later...
 * unsubscribe();
 * ```
 */
export function onBevyEvent(event, callback, canvasOrKey) {
    const instance = getBevy(canvasOrKey);
    if (instance?.app) {
        return instance.app.addEventListener(event, callback);
    }
    // If instance not ready yet, add to global listeners
    if (!eventListeners.has(event)) {
        eventListeners.set(event, new Set());
    }
    eventListeners.get(event).add(callback);
    return () => {
        eventListeners.get(event)?.delete(callback);
    };
}
/**
 * Send a custom event to Bevy
 *
 * @param event - Event type (use 'custom' for custom events)
 * @param data - Event data
 * @param canvasOrKey - Canvas element or instance key
 *
 * @example
 * ```ts
 * sendBevyEvent('custom', {
 *   action: 'player-action',
 *   payload: { type: 'jump', force: 10 },
 * });
 * ```
 */
export function sendBevyEvent(event, data, canvasOrKey) {
    const instance = getBevy(canvasOrKey);
    if (instance?.app) {
        instance.app.dispatchEvent({
            type: event,
            timestamp: performance.now(),
            data,
        });
    }
}
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Dispose a Bevy instance
 *
 * @param canvasOrKey - Canvas element or instance key
 */
export async function disposeBevy(canvasOrKey) {
    const instance = getBevy(canvasOrKey);
    if (instance?.app) {
        await instance.app.dispose();
    }
}
/**
 * Dispose all Bevy instances
 */
export async function disposeAllBevy() {
    const disposals = Array.from(bevyInstances.values()).map((instance) => instance.app?.dispose());
    await Promise.all(disposals);
    bevyInstances.clear();
}
/**
 * Check if Bevy WASM is supported
 */
export function isBevySupported() {
    return (typeof WebAssembly !== 'undefined' &&
        typeof WebAssembly.instantiate === 'function' &&
        typeof SharedArrayBuffer !== 'undefined');
}
/**
 * Get all active Bevy instances
 */
export function getAllBevyInstances() {
    return Array.from(bevyInstances.values());
}
//# sourceMappingURL=hooks.js.map