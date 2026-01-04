/**
 * Island - Core island implementation using Web Components
 */
import { getRegistry } from './registry.js';
/**
 * PhilJS Island Web Component
 * Custom element that provides selective hydration
 */
export class Island extends HTMLElement {
    _instance = null;
    _observer = null;
    _idleCallback = null;
    _mediaQuery = null;
    _boundInteractionHandler = null;
    static get observedAttributes() {
        return ['name', 'strategy', 'props'];
    }
    get name() {
        return this.getAttribute('name') || '';
    }
    get strategy() {
        return this.getAttribute('strategy') || 'visible';
    }
    get props() {
        const propsAttr = this.getAttribute('props');
        if (!propsAttr)
            return {};
        try {
            return JSON.parse(propsAttr);
        }
        catch {
            return {};
        }
    }
    connectedCallback() {
        if (!this.name) {
            console.warn('[PhilJS Islands] Island element missing "name" attribute');
            return;
        }
        this._instance = this._createInstance();
        this._setupHydrationTrigger();
    }
    disconnectedCallback() {
        this._cleanup();
        if (this._instance) {
            this._instance.unmount();
            this._instance = null;
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue)
            return;
        if (name === 'props' && this._instance?.state === 'active') {
            this._instance.update(this.props);
        }
    }
    _createInstance() {
        const self = this;
        let state = 'pending';
        let component;
        const props = { ...this.props };
        const instance = {
            name: this.name,
            element: this,
            get state() { return state; },
            props,
            async hydrate() {
                if (state !== 'pending')
                    return;
                state = 'loading';
                self.setAttribute('data-state', 'loading');
                try {
                    const registry = getRegistry();
                    const entry = registry.get(self.name);
                    if (!entry) {
                        throw new Error(`Island "${self.name}" not registered`);
                    }
                    const { config } = entry;
                    // Create component instance
                    if (typeof config.component === 'function') {
                        const result = config.component.prototype?.mount
                            ? new config.component()
                            : await config.component();
                        component = result;
                    }
                    if (!component) {
                        throw new Error(`Failed to create component for island "${self.name}"`);
                    }
                    state = 'hydrating';
                    self.setAttribute('data-state', 'hydrating');
                    // Mount the component
                    component.mount(self, props);
                    state = 'active';
                    self.setAttribute('data-state', 'active');
                    self.setAttribute('data-hydrated', 'true');
                    self.dispatchEvent(new CustomEvent('phil:island-hydrated', {
                        bubbles: true,
                        detail: { name: self.name, instance }
                    }));
                }
                catch (error) {
                    state = 'error';
                    self.setAttribute('data-state', 'error');
                    console.error(`[PhilJS Islands] Failed to hydrate "${self.name}":`, error);
                    self.dispatchEvent(new CustomEvent('phil:island-error', {
                        bubbles: true,
                        detail: { name: self.name, error }
                    }));
                }
            },
            unmount() {
                if (component?.unmount) {
                    component.unmount();
                }
                state = 'unmounted';
                self.setAttribute('data-state', 'unmounted');
                self.removeAttribute('data-hydrated');
            },
            update(newProps) {
                Object.assign(props, newProps);
                if (component?.update) {
                    component.update(props);
                }
            }
        };
        return instance;
    }
    _setupHydrationTrigger() {
        if (!this._instance)
            return;
        switch (this.strategy) {
            case 'load':
                this._instance.hydrate();
                break;
            case 'visible':
                this._setupVisibleTrigger();
                break;
            case 'idle':
                this._setupIdleTrigger();
                break;
            case 'interaction':
                this._setupInteractionTrigger();
                break;
            case 'media':
                this._setupMediaTrigger();
                break;
            case 'never':
                // Server-only, do nothing
                break;
        }
    }
    _setupVisibleTrigger() {
        const rootMargin = this.getAttribute('root-margin') || '0px';
        const threshold = parseFloat(this.getAttribute('threshold') || '0');
        this._observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) {
                this._instance?.hydrate();
                this._observer?.disconnect();
            }
        }, { rootMargin, threshold });
        this._observer.observe(this);
    }
    _setupIdleTrigger() {
        const timeout = parseInt(this.getAttribute('timeout') || '2000', 10);
        if (typeof requestIdleCallback === 'function') {
            this._idleCallback = requestIdleCallback(() => this._instance?.hydrate(), { timeout });
        }
        else {
            // Fallback to setTimeout
            this._idleCallback = setTimeout(() => this._instance?.hydrate(), timeout);
        }
    }
    _setupInteractionTrigger() {
        const triggers = (this.getAttribute('triggers') || 'click,focus')
            .split(',')
            .map(t => t.trim());
        this._boundInteractionHandler = () => {
            this._instance?.hydrate();
            this._removeInteractionListeners(triggers);
        };
        for (const trigger of triggers) {
            this.addEventListener(trigger, this._boundInteractionHandler, { once: true });
        }
    }
    _setupMediaTrigger() {
        const query = this.getAttribute('media');
        if (!query) {
            console.warn('[PhilJS Islands] Media strategy requires "media" attribute');
            return;
        }
        this._mediaQuery = window.matchMedia(query);
        const handler = (e) => {
            if (e.matches) {
                this._instance?.hydrate();
                this._mediaQuery?.removeEventListener('change', handler);
            }
        };
        if (this._mediaQuery.matches) {
            this._instance?.hydrate();
        }
        else {
            this._mediaQuery.addEventListener('change', handler);
        }
    }
    _removeInteractionListeners(triggers) {
        if (!this._boundInteractionHandler)
            return;
        for (const trigger of triggers) {
            this.removeEventListener(trigger, this._boundInteractionHandler);
        }
    }
    _cleanup() {
        this._observer?.disconnect();
        if (this._idleCallback !== null) {
            if ('cancelIdleCallback' in window) {
                cancelIdleCallback(this._idleCallback);
            }
            else {
                clearTimeout(this._idleCallback);
            }
        }
        if (this._mediaQuery) {
            // Cleanup handled by GC
            this._mediaQuery = null;
        }
    }
}
// Register the custom element
if (typeof customElements !== 'undefined' && !customElements.get('phil-island')) {
    customElements.define('phil-island', Island);
}
/**
 * Define an island component
 */
export function defineIsland(config) {
    const registry = getRegistry();
    registry.register(config);
}
/**
 * Create an island element programmatically
 */
export function createIsland(name, props, strategy) {
    const island = document.createElement('phil-island');
    island.setAttribute('name', name);
    if (props) {
        island.setAttribute('props', JSON.stringify(props));
    }
    if (strategy) {
        island.setAttribute('strategy', strategy);
    }
    return island;
}
//# sourceMappingURL=island.js.map