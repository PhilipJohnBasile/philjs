/**
 * @file Unity Hooks
 * @description PhilJS hooks for Unity WebGL build integration
 */
/**
 * Global Unity states
 */
const unityStates = new WeakMap();
/**
 * Message queue for Unity calls before ready
 */
const messageQueues = new WeakMap();
/**
 * Get or create Unity state
 */
function getUnityState(canvas) {
    let state = unityStates.get(canvas);
    if (!state) {
        state = {
            instance: null,
            isLoading: false,
            loadProgress: { progress: 0, phase: 'downloading' },
            error: null,
            isReady: false,
            eventHandlers: new Map(),
        };
        unityStates.set(canvas, state);
    }
    return state;
}
/**
 * Emit event to handlers
 */
function emitEvent(state, event, data) {
    const handlers = state.eventHandlers.get(event);
    handlers?.forEach((handler) => handler(data));
}
/**
 * Load Unity loader script
 */
async function loadUnityLoader(loaderUrl) {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.createUnityInstance) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = loaderUrl;
        script.async = true;
        script.onload = () => {
            if (window.createUnityInstance) {
                resolve();
            }
            else {
                reject(new Error('Unity createUnityInstance not found after script load'));
            }
        };
        script.onerror = () => {
            reject(new Error(`Failed to load Unity loader: ${loaderUrl}`));
        };
        document.head.appendChild(script);
    });
}
/**
 * Create a Unity instance
 */
export async function createUnityInstance(canvas, props) {
    const state = getUnityState(canvas);
    state.isLoading = true;
    state.loadProgress = { progress: 0, phase: 'downloading' };
    state.error = null;
    const buildUrl = props.buildUrl.replace(/\/$/, '');
    const loaderUrl = props.loaderUrl || `${buildUrl}/Build.loader.js`;
    try {
        // Load the Unity loader script
        await loadUnityLoader(loaderUrl);
        if (!window.createUnityInstance) {
            throw new Error('Unity loader not available');
        }
        // Derive file names from build URL
        const buildName = buildUrl.split('/').pop() || 'Build';
        const config = {
            dataUrl: `${buildUrl}/${buildName}.data`,
            frameworkUrl: `${buildUrl}/${buildName}.framework.js`,
            codeUrl: `${buildUrl}/${buildName}.wasm`,
            streamingAssetsUrl: props.streamingAssetsUrl || `${buildUrl}/StreamingAssets`,
            companyName: props.companyName || 'DefaultCompany',
            productName: props.productName || 'DefaultProduct',
            productVersion: props.productVersion || '1.0',
            matchWebGLToCanvasSize: true,
            devicePixelRatio: props.pixelRatio || window.devicePixelRatio || 1,
        };
        // Create Unity instance
        const unityInstance = await window.createUnityInstance(canvas, config, (progress) => {
            const loadProgress = {
                progress,
                phase: progress < 0.5 ? 'downloading' : progress < 0.9 ? 'decompressing' : 'loading',
            };
            state.loadProgress = loadProgress;
            props.onProgress?.(loadProgress);
            emitEvent(state, 'progress', loadProgress);
        });
        // Store instance globally for message receiving
        window.unityInstance = unityInstance;
        // Create wrapper
        const wrapper = {
            instance: unityInstance,
            canvas,
            isReady: true,
            sendMessage: (gameObject, method, param) => {
                if (wrapper.isReady) {
                    unityInstance.SendMessage(gameObject, method, param);
                }
                else {
                    // Queue message
                    let queue = messageQueues.get(canvas);
                    if (!queue) {
                        queue = [];
                        messageQueues.set(canvas, queue);
                    }
                    queue.push({ gameObject, method, ...(param !== undefined ? { param } : {}) });
                }
            },
            requestFullscreen: () => {
                unityInstance.SetFullscreen(1);
            },
            exitFullscreen: () => {
                unityInstance.SetFullscreen(0);
            },
            quit: async () => {
                await unityInstance.Quit();
                emitEvent(state, 'quit', null);
                props.onQuit?.();
            },
            on: (event, handler) => {
                let handlers = state.eventHandlers.get(event);
                if (!handlers) {
                    handlers = new Set();
                    state.eventHandlers.set(event, handlers);
                }
                handlers.add(handler);
                return () => {
                    handlers?.delete(handler);
                };
            },
            takeScreenshot: () => {
                try {
                    return canvas.toDataURL('image/png');
                }
                catch {
                    return null;
                }
            },
            getMemoryUsage: () => {
                const info = unityInstance.GetMemoryInfo?.();
                if (info) {
                    return {
                        total: info.totalJSHeapSize,
                        used: info.usedJSHeapSize,
                    };
                }
                return null;
            },
        };
        // Process queued messages
        const queue = messageQueues.get(canvas);
        if (queue) {
            for (const msg of queue) {
                wrapper.sendMessage(msg.gameObject, msg.method, msg.param);
            }
            messageQueues.delete(canvas);
        }
        state.instance = wrapper;
        state.isLoading = false;
        state.isReady = true;
        state.loadProgress = { progress: 1, phase: 'complete' };
        emitEvent(state, 'ready', wrapper);
        props.onReady?.(wrapper);
        return wrapper;
    }
    catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        state.error = err;
        state.isLoading = false;
        emitEvent(state, 'error', err);
        props.onError?.(err);
        throw err;
    }
}
/**
 * Hook to use Unity instance
 */
export function useUnity(canvas) {
    if (!canvas) {
        return {
            unity: null,
            isLoading: false,
            progress: { progress: 0, phase: 'downloading' },
            error: null,
            isReady: false,
            sendMessage: () => { },
            onUnityEvent: () => () => { },
            requestFullscreen: () => { },
            reload: async () => { },
        };
    }
    const state = getUnityState(canvas);
    return {
        unity: state.instance,
        isLoading: state.isLoading,
        progress: state.loadProgress,
        error: state.error,
        isReady: state.isReady,
        sendMessage: (gameObject, method, param) => {
            state.instance?.sendMessage(gameObject, method, param);
        },
        onUnityEvent: (event, handler) => {
            if (!state.instance) {
                // Register for later
                let handlers = state.eventHandlers.get(event);
                if (!handlers) {
                    handlers = new Set();
                    state.eventHandlers.set(event, handlers);
                }
                handlers.add(handler);
                return () => handlers?.delete(handler);
            }
            return state.instance.on(event, handler);
        },
        requestFullscreen: () => {
            state.instance?.requestFullscreen();
        },
        reload: async () => {
            // Note: Unity doesn't support hot reload, would need to reload the page
            console.warn('Unity hot reload is not supported');
        },
    };
}
/**
 * Send message to Unity
 */
export function sendMessage(canvas, gameObject, method, param) {
    const state = unityStates.get(canvas);
    state?.instance?.sendMessage(gameObject, method, param);
}
/**
 * Register Unity event callback
 * This is called from Unity to send messages to JavaScript
 */
export function onUnityEvent(canvas, event, handler) {
    const state = getUnityState(canvas);
    let handlers = state.eventHandlers.get(event);
    if (!handlers) {
        handlers = new Set();
        state.eventHandlers.set(event, handlers);
    }
    handlers.add(handler);
    return () => {
        handlers?.delete(handler);
    };
}
/**
 * Register a global callback that Unity can call
 */
export function registerUnityCallback(name, handler) {
    window[name] = handler;
    return () => {
        delete window[name];
    };
}
/**
 * Unity-to-PhilJS signal bridge
 * Creates a callback that Unity can call to update a PhilJS signal
 */
export function createUnitySignalBridge(callbackName, setValue) {
    return registerUnityCallback(callbackName, (value) => {
        setValue(value);
    });
}
/**
 * PhilJS-to-Unity signal bridge
 * Watches a PhilJS signal and sends updates to Unity
 */
export function createPhilJSSignalBridge(canvas, gameObject, method, getValue) {
    // In a real implementation, this would use PhilJS effects
    const state = unityStates.get(canvas);
    const sync = () => {
        const value = getValue();
        const param = typeof value === 'object' ? JSON.stringify(value) : String(value);
        state?.instance?.sendMessage(gameObject, method, param);
    };
    // Initial sync
    sync();
    // Return cleanup
    return () => { };
}
/**
 * Cleanup Unity instance
 */
export async function disposeUnity(canvas) {
    const state = unityStates.get(canvas);
    if (state?.instance) {
        await state.instance.quit();
        state.eventHandlers.clear();
    }
    unityStates.delete(canvas);
    messageQueues.delete(canvas);
}
/**
 * Get loading progress component props
 */
export function getLoadingProgress(canvas) {
    const state = unityStates.get(canvas);
    return state?.loadProgress || { progress: 0, phase: 'downloading' };
}
//# sourceMappingURL=hooks.js.map