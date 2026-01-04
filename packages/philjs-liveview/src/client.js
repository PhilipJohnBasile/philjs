/**
 * PhilJS LiveView - Client
 *
 * Client-side runtime for LiveView. Handles:
 * - WebSocket connection to server
 * - DOM patching with morphdom
 * - Event binding (phx-click, phx-change, etc.)
 * - Hooks lifecycle
 * - Form handling
 * - Navigation
 */
import { SocketConnection, serializeEvent, serializeKeyEvent } from './live-socket.js';
import { registerHooks, mountHook, updateHook, destroyHook, disconnectHooks, reconnectHooks } from './hooks.js';
import { initNavigation, livePatch, liveRedirect, onNavigate, setLoading, scrollToTarget, setPageTitle } from './navigation.js';
import { applyPatches } from './differ.js';
import { serializeForm } from './forms.js';
// ============================================================================
// LiveView Client
// ============================================================================
export class LiveViewClient {
    socket;
    container = null;
    topic = '';
    sessionToken = '';
    staticToken = '';
    cleanupNav;
    options;
    eventHandlers = new Map();
    constructor(options) {
        this.options = options;
        this.socket = new SocketConnection({
            url: options.url,
            params: {
                _csrf_token: options.csrfToken,
                ...options.params,
            },
            reconnectAfterMs: options.reconnect
                ? (tries) => {
                    const delays = [1000, 2000, 5000, 10000, 30000];
                    return delays[Math.min(tries, delays.length - 1)];
                }
                : undefined,
            onOpen: () => this.handleOpen(),
            onClose: () => this.handleClose(),
            onError: (error) => this.handleError(error),
        });
    }
    /**
     * Connect to the LiveView server
     */
    connect(container) {
        // Get container element
        if (typeof container === 'string') {
            this.container = document.querySelector(container);
        }
        else {
            this.container = container;
        }
        if (!this.container) {
            throw new Error('LiveView container not found');
        }
        // Extract session and static tokens from container
        this.sessionToken = this.container.getAttribute('data-phx-session') || '';
        this.staticToken = this.container.getAttribute('data-phx-static') || '';
        this.topic = this.container.getAttribute('data-phx-view') || 'lv:page';
        // Initialize navigation
        this.cleanupNav = initNavigation();
        // Subscribe to navigation events
        onNavigate((event) => {
            if (event.type === 'patch') {
                this.handleNavPatch(event.to);
            }
        });
        // Connect socket
        this.socket.connect();
    }
    /**
     * Disconnect from the LiveView server
     */
    disconnect() {
        this.cleanupNav?.();
        this.socket.disconnect();
    }
    /**
     * Push an event to the server
     */
    pushEvent(event, payload, target) {
        const eventPayload = {
            type: 'event',
            event,
            value: payload,
        };
        if (target) {
            eventPayload.target = target;
        }
        this.socket.push(this.topic, 'event', eventPayload);
    }
    /**
     * Push an event to a specific component
     */
    pushEventTo(selector, event, payload) {
        const target = this.container?.querySelector(selector);
        const componentId = target?.getAttribute('data-phx-component');
        this.pushEvent(event, { ...payload, _target: componentId });
    }
    /**
     * Register a handler for server events
     */
    handleEvent(event, callback) {
        this.eventHandlers.set(event, callback);
    }
    /**
     * Register custom hooks
     */
    registerHooks(hooks) {
        registerHooks(hooks);
    }
    // ============================================================================
    // Private Methods
    // ============================================================================
    async handleOpen() {
        if (this.options.debug) {
            console.log('[LiveView] Connected');
        }
        // Join the view channel
        try {
            const response = await this.socket.join(this.topic, {
                url: window.location.href,
                params: this.options.params || {},
                session: this.sessionToken,
                static: this.staticToken,
            });
            // Handle initial render
            if (response.rendered) {
                this.applyRender(response.rendered);
            }
            // Bind events
            this.bindEvents();
            // Mount hooks
            this.mountHooks();
            // Notify reconnection
            reconnectHooks();
        }
        catch (error) {
            console.error('[LiveView] Failed to join:', error);
        }
        // Set up message handler
        const channel = this.socket.channel(this.topic);
        channel.onMessage = (message) => this.handleMessage(message);
    }
    handleClose() {
        if (this.options.debug) {
            console.log('[LiveView] Disconnected');
        }
        disconnectHooks();
        setLoading(false);
    }
    handleError(error) {
        if (this.options.debug) {
            console.error('[LiveView] Error:', error);
        }
    }
    handleMessage(message) {
        const { event, payload } = message;
        switch (event) {
            case 'diff':
                this.applyDiff(payload);
                break;
            case 'redirect':
                liveRedirect(payload.to, { replace: payload.replace });
                break;
            case 'patch':
                this.handleNavPatch(payload.to);
                break;
            case 'push_event':
                const handler = this.eventHandlers.get(payload.event);
                if (handler) {
                    handler(payload.data);
                }
                break;
            case 'title':
                setPageTitle(payload.title);
                break;
            case 'scroll':
                scrollToTarget(payload.to);
                break;
            default:
                if (this.options.debug) {
                    console.log('[LiveView] Unknown event:', event, payload);
                }
        }
    }
    handleNavPatch(to) {
        setLoading(true);
        this.socket.push(this.topic, 'live_patch', {
            url: to,
        });
    }
    applyRender(html) {
        if (!this.container)
            return;
        this.container.innerHTML = html;
        this.bindEvents();
        this.mountHooks();
    }
    applyDiff(diff) {
        if (!this.container)
            return;
        setLoading(false);
        // Apply DOM patches
        applyPatches(this.container, diff.patches);
        // Update hooks
        this.updateHooks();
        // Rebind events for new elements
        this.bindEvents();
        // Mount new hooks
        this.mountHooks();
        // Handle pushed events
        if (diff.events) {
            for (const { event, payload } of diff.events) {
                const handler = this.eventHandlers.get(event);
                if (handler) {
                    handler(payload);
                }
            }
        }
        // Update title
        if (diff.title) {
            setPageTitle(diff.title);
        }
    }
    bindEvents() {
        if (!this.container)
            return;
        // Click events
        this.bindPhxEvent('click', 'phx-click');
        // Change events (forms)
        this.bindPhxEvent('change', 'phx-change', { debounce: true });
        this.bindPhxEvent('input', 'phx-change', { debounce: true });
        // Submit events
        this.bindPhxEvent('submit', 'phx-submit', { preventDefault: true });
        // Blur events
        this.bindPhxEvent('blur', 'phx-blur');
        // Focus events
        this.bindPhxEvent('focus', 'phx-focus');
        // Key events
        this.bindPhxKeyEvent('keydown', 'phx-keydown');
        this.bindPhxKeyEvent('keyup', 'phx-keyup');
        // Window events
        this.bindPhxEvent('scroll', 'phx-window-scroll', { target: window });
    }
    bindPhxEvent(eventType, attrName, options) {
        const target = options?.target || this.container;
        const debounceTimers = new WeakMap();
        target.addEventListener(eventType, (e) => {
            const eventTarget = e.target;
            const phxTarget = eventTarget.closest(`[${attrName}]`);
            if (!phxTarget)
                return;
            const eventName = phxTarget.getAttribute(attrName);
            if (!eventName)
                return;
            if (options?.preventDefault) {
                e.preventDefault();
            }
            // Check for phx-disable-with
            const disableWith = phxTarget.getAttribute('phx-disable-with');
            if (disableWith) {
                const btn = phxTarget;
                btn.disabled = true;
                btn.dataset['originalText'] = btn.textContent || '';
                btn.textContent = disableWith;
            }
            const handler = () => {
                const serialized = eventType === 'submit' && phxTarget instanceof HTMLFormElement
                    ? serializeEvent(eventName, phxTarget, serializeForm(phxTarget))
                    : serializeEvent(eventName, phxTarget);
                this.pushEvent(eventName, serialized.value, phxTarget.getAttribute('phx-target') || undefined);
            };
            // Handle debounce
            const debounce = phxTarget.getAttribute('phx-debounce');
            if (debounce && options?.debounce) {
                const delay = parseInt(debounce, 10) || 300;
                clearTimeout(debounceTimers.get(phxTarget));
                debounceTimers.set(phxTarget, setTimeout(handler, delay));
            }
            else {
                handler();
            }
        });
    }
    bindPhxKeyEvent(eventType, attrName) {
        this.container.addEventListener(eventType, (e) => {
            const keyEvent = e;
            const target = e.target;
            const phxTarget = target.closest(`[${attrName}]`);
            if (!phxTarget)
                return;
            const eventName = phxTarget.getAttribute(attrName);
            if (!eventName)
                return;
            // Check for specific key filtering
            const keyFilter = phxTarget.getAttribute(`${attrName}-key`);
            if (keyFilter && keyEvent.key.toLowerCase() !== keyFilter.toLowerCase()) {
                return;
            }
            const serialized = serializeKeyEvent(eventName, keyEvent, phxTarget);
            this.pushEvent(eventName, serialized, phxTarget.getAttribute('phx-target') || undefined);
        });
    }
    mountHooks() {
        if (!this.container)
            return;
        const hookElements = this.container.querySelectorAll('[phx-hook]');
        hookElements.forEach((el) => {
            const hookName = el.getAttribute('phx-hook');
            if (!hookName)
                return;
            // Skip if already mounted
            if (el.hasAttribute('data-phx-hook-mounted'))
                return;
            el.setAttribute('data-phx-hook-mounted', 'true');
            mountHook(el, hookName, {
                pushEvent: (event, payload, target) => this.pushEvent(event, payload, target),
                pushEventTo: (selector, event, payload) => this.pushEventTo(selector, event, payload),
                handleEvent: (event, callback) => this.handleEvent(event, callback),
                upload: (name, files) => this.handleUpload(name, files),
            });
        });
    }
    updateHooks() {
        if (!this.container)
            return;
        const hookElements = this.container.querySelectorAll('[phx-hook][data-phx-hook-mounted]');
        hookElements.forEach((el) => {
            updateHook(el);
        });
    }
    handleUpload(name, files) {
        // File upload handling
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append(`${name}[]`, files[i]);
        }
        // Push upload event
        this.pushEvent('phx:upload', {
            name,
            files: Array.from(files).map(f => ({
                name: f.name,
                size: f.size,
                type: f.type,
            })),
        });
    }
}
// ============================================================================
// Factory Function
// ============================================================================
/**
 * Create and connect a LiveView client
 */
export function createLiveViewClient(options) {
    return new LiveViewClient(options);
}
/**
 * Quick initialization for standard setup
 */
export function initLiveView(options) {
    if (typeof window === 'undefined')
        return null;
    // Find LiveView container
    const container = document.querySelector('[data-phx-main]');
    if (!container) {
        console.warn('[LiveView] No container found with data-phx-main attribute');
        return null;
    }
    // Get CSRF token from meta tag
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta?.getAttribute('content') || '';
    // Build WebSocket URL
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/live/websocket`;
    const client = new LiveViewClient({
        url: options?.url ?? wsUrl,
        csrfToken: options?.csrfToken ?? csrfToken,
        debug: options?.debug ?? false,
        params: options?.params ?? {},
        reconnect: options?.reconnect,
    });
    client.connect(container);
    return client;
}
// ============================================================================
// Exports
// ============================================================================
export { registerHooks } from './hooks.js';
export { livePatch, liveRedirect } from './navigation.js';
//# sourceMappingURL=client.js.map