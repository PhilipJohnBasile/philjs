/**
 * PhilJS Dependency Injection Container
 *
 * A comprehensive Angular-inspired dependency injection system for PhilJS applications
 * with signal integration, async providers, lifecycle hooks, and module federation.
 */

import { signal, computed, effect, batch, type Signal, type Computed } from '@philjs/core';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type Token<T = any> = string | symbol | Constructor<T> | InjectionToken<T> | AbstractType<T>;

export type Constructor<T = any> = new (...args: any[]) => T;
export type AbstractType<T = any> = abstract new (...args: any[]) => T;
export type Factory<T = any> = (...deps: any[]) => T;
export type AsyncFactory<T = any> = (...deps: any[]) => Promise<T>;

export interface InjectionToken<T = any> {
    readonly _desc: string;
    readonly _default?: T | (() => T);
    readonly _multi?: boolean;
    toString(): string;
}

export type Scope = 'singleton' | 'transient' | 'request' | 'resolution';

export interface Provider<T = any> {
    provide: Token<T>;
    useClass?: Constructor<T>;
    useValue?: T;
    useFactory?: Factory<T>;
    useExisting?: Token<T>;
    useAsync?: AsyncFactory<T>;
    deps?: Token[];
    scope?: Scope;
    multi?: boolean;
    when?: (injector: Injector) => boolean;
    onInit?: (instance: T) => void | Promise<void>;
    onDestroy?: (instance: T) => void | Promise<void>;
}

export interface TypeProvider<T = any> extends Constructor<T> {}

export interface ClassProvider<T = any> {
    provide: Token<T>;
    useClass: Constructor<T>;
    deps?: Token[];
    scope?: Scope;
    multi?: boolean;
}

export interface ValueProvider<T = any> {
    provide: Token<T>;
    useValue: T;
    multi?: boolean;
}

export interface FactoryProvider<T = any> {
    provide: Token<T>;
    useFactory: Factory<T>;
    deps?: Token[];
    scope?: Scope;
    multi?: boolean;
}

export interface ExistingProvider<T = any> {
    provide: Token<T>;
    useExisting: Token<T>;
    multi?: boolean;
}

export interface AsyncProvider<T = any> {
    provide: Token<T>;
    useAsync: AsyncFactory<T>;
    deps?: Token[];
    scope?: Scope;
}

export type ProviderLike<T = any> =
    | Provider<T>
    | TypeProvider<T>
    | ClassProvider<T>
    | ValueProvider<T>
    | FactoryProvider<T>
    | ExistingProvider<T>
    | AsyncProvider<T>;

export interface InjectorOptions {
    providers?: ProviderLike[];
    parent?: Injector;
    name?: string;
    defaultScope?: Scope;
    enableStrictMode?: boolean;
}

export interface ModuleConfig {
    id?: string;
    providers?: ProviderLike[];
    imports?: ModuleConfig[];
    exports?: Token[];
    bootstrap?: Constructor[];
    declarations?: Constructor[];
}

export interface ResolveOptions {
    optional?: boolean;
    self?: boolean;
    skipSelf?: boolean;
    host?: boolean;
}

export interface InjectableMetadata {
    providedIn?: 'root' | 'platform' | 'any' | null | ModuleConfig;
    scope?: Scope;
    deps?: Token[];
}

export interface InjectMetadata {
    token: Token;
    optional?: boolean;
    self?: boolean;
    skipSelf?: boolean;
    host?: boolean;
}

export interface LifecycleHooks {
    onInit?: () => void | Promise<void>;
    onDestroy?: () => void | Promise<void>;
}

// ============================================================================
// Injection Token Factory
// ============================================================================

export function createInjectionToken<T>(
    description: string,
    options?: { factory?: () => T; multi?: boolean }
): InjectionToken<T> {
    return {
        _desc: description,
        _default: options?.factory,
        _multi: options?.multi,
        toString() {
            return `InjectionToken(${description})`;
        }
    };
}

// Legacy compatibility
export class InjectionToken_Class<T = any> implements InjectionToken<T> {
    readonly _desc: string;
    readonly _default?: T | (() => T);
    readonly _multi?: boolean;

    constructor(desc: string, options?: { factory?: () => T; multi?: boolean }) {
        this._desc = desc;
        this._default = options?.factory;
        this._multi = options?.multi;
    }

    toString(): string {
        return `InjectionToken(${this._desc})`;
    }
}

// Alias for backwards compatibility
export { InjectionToken_Class as InjectionToken };

// ============================================================================
// Metadata Storage
// ============================================================================

const injectableMetadata = new WeakMap<Constructor, InjectableMetadata>();
const parameterMetadata = new WeakMap<Constructor, Map<number, InjectMetadata>>();
const propertyMetadata = new WeakMap<Constructor, Map<string | symbol, InjectMetadata>>();

function getInjectableMetadata(target: Constructor): InjectableMetadata | undefined {
    return injectableMetadata.get(target);
}

function setInjectableMetadata(target: Constructor, metadata: InjectableMetadata): void {
    injectableMetadata.set(target, metadata);
}

function getParameterMetadata(target: Constructor): Map<number, InjectMetadata> {
    return parameterMetadata.get(target) || new Map();
}

function setParameterMetadata(target: Constructor, index: number, metadata: InjectMetadata): void {
    const existing = parameterMetadata.get(target) || new Map();
    existing.set(index, metadata);
    parameterMetadata.set(target, existing);
}

function getPropertyMetadata(target: Constructor): Map<string | symbol, InjectMetadata> {
    return propertyMetadata.get(target) || new Map();
}

function setPropertyMetadata(target: Constructor, key: string | symbol, metadata: InjectMetadata): void {
    const existing = propertyMetadata.get(target) || new Map();
    existing.set(key, metadata);
    propertyMetadata.set(target, existing);
}

// ============================================================================
// Decorators
// ============================================================================

export function Injectable(options: InjectableMetadata = {}): ClassDecorator {
    return function <T extends Constructor>(target: T): T {
        setInjectableMetadata(target, {
            providedIn: options.providedIn ?? null,
            scope: options.scope ?? 'singleton',
            deps: options.deps
        });

        // Auto-register in root if providedIn is 'root'
        if (options.providedIn === 'root') {
            getRootInjector().register({ provide: target, useClass: target, scope: options.scope });
        }

        return target;
    };
}

export function Inject(token: Token, options: Omit<InjectMetadata, 'token'> = {}): ParameterDecorator & PropertyDecorator {
    return function (target: any, propertyKey: string | symbol | undefined, parameterIndex?: number) {
        const metadata: InjectMetadata = { token, ...options };

        if (typeof parameterIndex === 'number') {
            // Parameter decorator
            setParameterMetadata(target, parameterIndex, metadata);
        } else if (propertyKey !== undefined) {
            // Property decorator
            setPropertyMetadata(target.constructor, propertyKey, metadata);
        }
    };
}

export function Optional(): ParameterDecorator & PropertyDecorator {
    return function (target: any, propertyKey: string | symbol | undefined, parameterIndex?: number) {
        if (typeof parameterIndex === 'number') {
            const existing = getParameterMetadata(target).get(parameterIndex) || { token: null as any };
            setParameterMetadata(target, parameterIndex, { ...existing, optional: true });
        } else if (propertyKey !== undefined) {
            const existing = getPropertyMetadata(target.constructor).get(propertyKey) || { token: null as any };
            setPropertyMetadata(target.constructor, propertyKey, { ...existing, optional: true });
        }
    };
}

export function Self(): ParameterDecorator {
    return function (target: any, _propertyKey: string | symbol | undefined, parameterIndex: number) {
        const existing = getParameterMetadata(target).get(parameterIndex) || { token: null as any };
        setParameterMetadata(target, parameterIndex, { ...existing, self: true });
    };
}

export function SkipSelf(): ParameterDecorator {
    return function (target: any, _propertyKey: string | symbol | undefined, parameterIndex: number) {
        const existing = getParameterMetadata(target).get(parameterIndex) || { token: null as any };
        setParameterMetadata(target, parameterIndex, { ...existing, skipSelf: true });
    };
}

export function Host(): ParameterDecorator {
    return function (target: any, _propertyKey: string | symbol | undefined, parameterIndex: number) {
        const existing = getParameterMetadata(target).get(parameterIndex) || { token: null as any };
        setParameterMetadata(target, parameterIndex, { ...existing, host: true });
    };
}

// ============================================================================
// Injector
// ============================================================================

export class Injector {
    private readonly instances = new Map<Token, any>();
    private readonly providers = new Map<Token, Provider>();
    private readonly multiProviders = new Map<Token, Provider[]>();
    private readonly parent?: Injector;
    private readonly name: string;
    private readonly defaultScope: Scope;
    private readonly strictMode: boolean;
    private readonly destroyCallbacks: Array<() => void | Promise<void>> = [];
    private readonly resolutionStack: Token[] = [];
    private destroyed = false;

    constructor(options: InjectorOptions = {}) {
        this.parent = options.parent;
        this.name = options.name || 'Injector';
        this.defaultScope = options.defaultScope || 'singleton';
        this.strictMode = options.enableStrictMode ?? false;

        // Self-register
        this.instances.set(Injector, this);

        // Register providers
        if (options.providers) {
            for (const provider of options.providers) {
                this.register(provider);
            }
        }
    }

    /**
     * Register a provider
     */
    register<T>(providerLike: ProviderLike<T>): void {
        const provider = this.normalizeProvider(providerLike);

        if (provider.multi) {
            const existing = this.multiProviders.get(provider.provide) || [];
            existing.push(provider);
            this.multiProviders.set(provider.provide, existing);
        } else {
            this.providers.set(provider.provide, provider);
        }
    }

    /**
     * Register multiple providers
     */
    registerMany(providers: ProviderLike[]): void {
        for (const provider of providers) {
            this.register(provider);
        }
    }

    /**
     * Get an instance by token
     */
    get<T>(token: Token<T>, options: ResolveOptions = {}): T {
        return this.resolve(token, options);
    }

    /**
     * Resolve a dependency
     */
    resolve<T>(token: Token<T>, options: ResolveOptions = {}): T {
        if (this.destroyed) {
            throw new Error(`Injector "${this.name}" has been destroyed`);
        }

        // Check for circular dependency
        if (this.resolutionStack.includes(token)) {
            const cycle = [...this.resolutionStack, token].map(t => this.tokenName(t)).join(' -> ');
            throw new Error(`Circular dependency detected: ${cycle}`);
        }

        // Skip self means we should only look in parent
        if (options.skipSelf) {
            if (!this.parent) {
                if (options.optional) return undefined as T;
                throw new Error(`No parent injector for token: ${this.tokenName(token)}`);
            }
            return this.parent.resolve(token, { ...options, skipSelf: false });
        }

        // Check for multi-providers
        const multiProviders = this.multiProviders.get(token);
        if (multiProviders) {
            return multiProviders.map(p => this.createInstance(p)) as unknown as T;
        }

        // Check if already instantiated (singleton)
        if (this.instances.has(token)) {
            return this.instances.get(token);
        }

        // Check local providers
        const provider = this.providers.get(token);

        if (provider) {
            // Conditional provider
            if (provider.when && !provider.when(this)) {
                if (options.optional) return undefined as T;
                throw new Error(`Provider condition not met for: ${this.tokenName(token)}`);
            }

            this.resolutionStack.push(token);
            try {
                return this.createInstance(provider);
            } finally {
                this.resolutionStack.pop();
            }
        }

        // Self means don't check parent
        if (options.self) {
            if (options.optional) return undefined as T;
            throw new Error(`No provider for ${this.tokenName(token)} in this injector`);
        }

        // Check parent
        if (this.parent) {
            try {
                return this.parent.resolve(token, options);
            } catch (e) {
                if (!options.optional) throw e;
            }
        }

        // Try to instantiate class directly if it's a constructor
        if (typeof token === 'function' && !this.isAbstract(token)) {
            this.resolutionStack.push(token);
            try {
                const instance = this.instantiateClass(token as Constructor<T>);
                this.instances.set(token, instance);
                return instance;
            } finally {
                this.resolutionStack.pop();
            }
        }

        // Check for default value on InjectionToken
        if (this.isInjectionToken(token) && token._default !== undefined) {
            const defaultValue = typeof token._default === 'function'
                ? (token._default as () => T)()
                : token._default;
            return defaultValue;
        }

        if (options.optional) {
            return undefined as T;
        }

        throw new Error(`No provider for ${this.tokenName(token)}`);
    }

    /**
     * Resolve a dependency asynchronously
     */
    async resolveAsync<T>(token: Token<T>, options: ResolveOptions = {}): Promise<T> {
        const provider = this.providers.get(token);

        if (provider?.useAsync) {
            const deps = await Promise.all(
                (provider.deps || []).map(dep => this.resolveAsync(dep))
            );
            const instance = await provider.useAsync(...deps);

            if (provider.scope !== 'transient') {
                this.instances.set(token, instance);
            }

            if (provider.onInit) {
                await provider.onInit(instance);
            }

            if (provider.onDestroy) {
                this.destroyCallbacks.push(() => provider.onDestroy!(instance));
            }

            return instance;
        }

        return this.resolve(token, options);
    }

    /**
     * Check if a provider exists
     */
    has(token: Token): boolean {
        if (this.providers.has(token) || this.multiProviders.has(token) || this.instances.has(token)) {
            return true;
        }
        return this.parent?.has(token) ?? false;
    }

    /**
     * Create a child injector
     */
    createChild(providers: ProviderLike[] = [], name?: string): Injector {
        return new Injector({
            providers,
            parent: this,
            name: name || `${this.name}/child`,
            defaultScope: this.defaultScope,
            enableStrictMode: this.strictMode
        });
    }

    /**
     * Create a scoped injector for request handling
     */
    createScope(providers: ProviderLike[] = []): Injector {
        const scope = this.createChild(providers, `${this.name}/scope`);
        return scope;
    }

    /**
     * Destroy the injector and all its instances
     */
    async destroy(): Promise<void> {
        if (this.destroyed) return;

        this.destroyed = true;

        // Run destroy callbacks in reverse order
        for (const callback of this.destroyCallbacks.reverse()) {
            try {
                await callback();
            } catch (e) {
                console.error('Error during injector destroy:', e);
            }
        }

        // Call onDestroy on injectable instances
        for (const instance of this.instances.values()) {
            if (instance && typeof instance.onDestroy === 'function') {
                try {
                    await instance.onDestroy();
                } catch (e) {
                    console.error('Error calling onDestroy:', e);
                }
            }
        }

        this.instances.clear();
        this.providers.clear();
        this.multiProviders.clear();
        this.destroyCallbacks.length = 0;
    }

    /**
     * Create instance from provider
     */
    private createInstance<T>(provider: Provider<T>): T {
        let instance: T;

        if (provider.useValue !== undefined) {
            instance = provider.useValue;
        } else if (provider.useFactory) {
            const deps = (provider.deps || []).map(dep => this.resolve(dep));
            instance = provider.useFactory(...deps);
        } else if (provider.useExisting) {
            instance = this.resolve(provider.useExisting);
        } else if (provider.useClass) {
            instance = this.instantiateClass(provider.useClass);
        } else if (typeof provider.provide === 'function') {
            instance = this.instantiateClass(provider.provide as Constructor<T>);
        } else {
            throw new Error(`Invalid provider for ${this.tokenName(provider.provide)}`);
        }

        const scope = provider.scope || this.defaultScope;

        // Cache singleton instances
        if (scope === 'singleton' || scope === 'resolution') {
            this.instances.set(provider.provide, instance);
        }

        // Run init hook
        if (provider.onInit && instance !== null && instance !== undefined) {
            const initResult = provider.onInit(instance);
            if (initResult instanceof Promise) {
                initResult.catch(e => console.error('Error in onInit:', e));
            }
        }

        // Register destroy callback
        if (provider.onDestroy && instance !== null && instance !== undefined) {
            this.destroyCallbacks.push(() => provider.onDestroy!(instance));
        }

        return instance;
    }

    /**
     * Instantiate a class with constructor injection
     */
    private instantiateClass<T>(target: Constructor<T>): T {
        const paramMeta = getParameterMetadata(target);
        const propMeta = getPropertyMetadata(target);
        const injectableMeta = getInjectableMetadata(target);

        // Determine constructor dependencies
        const deps = injectableMeta?.deps || [];
        const args: any[] = [];

        for (let i = 0; i < Math.max(target.length, deps.length, paramMeta.size); i++) {
            const meta = paramMeta.get(i);
            const depToken = meta?.token || deps[i];

            if (depToken) {
                try {
                    args[i] = this.resolve(depToken, {
                        optional: meta?.optional,
                        self: meta?.self,
                        skipSelf: meta?.skipSelf,
                        host: meta?.host
                    });
                } catch (e) {
                    if (meta?.optional) {
                        args[i] = undefined;
                    } else {
                        throw e;
                    }
                }
            }
        }

        // Create instance
        const instance = new target(...args);

        // Property injection
        for (const [key, meta] of propMeta) {
            try {
                (instance as any)[key] = this.resolve(meta.token, {
                    optional: meta.optional,
                    self: meta.self,
                    skipSelf: meta.skipSelf,
                    host: meta.host
                });
            } catch (e) {
                if (!meta.optional) throw e;
            }
        }

        // Call onInit if exists
        if (typeof (instance as any).onInit === 'function') {
            const result = (instance as any).onInit();
            if (result instanceof Promise) {
                result.catch((e: Error) => console.error('Error in onInit:', e));
            }
        }

        // Register onDestroy callback
        if (typeof (instance as any).onDestroy === 'function') {
            this.destroyCallbacks.push(() => (instance as any).onDestroy());
        }

        return instance;
    }

    /**
     * Normalize provider to standard form
     */
    private normalizeProvider<T>(providerLike: ProviderLike<T>): Provider<T> {
        if (typeof providerLike === 'function') {
            return { provide: providerLike, useClass: providerLike };
        }
        return providerLike as Provider<T>;
    }

    /**
     * Get human-readable token name
     */
    private tokenName(token: Token): string {
        if (typeof token === 'string') return token;
        if (typeof token === 'symbol') return token.toString();
        if (typeof token === 'function') return token.name;
        if (this.isInjectionToken(token)) return token.toString();
        return String(token);
    }

    /**
     * Check if token is an InjectionToken
     */
    private isInjectionToken(token: Token): token is InjectionToken {
        return token !== null &&
               typeof token === 'object' &&
               '_desc' in token &&
               typeof (token as any).toString === 'function';
    }

    /**
     * Check if a constructor is abstract
     */
    private isAbstract(target: Constructor): boolean {
        return target.prototype === undefined || target.prototype.constructor !== target;
    }
}

// ============================================================================
// Root Injector
// ============================================================================

let rootInjector: Injector | null = null;

export function getRootInjector(): Injector {
    if (!rootInjector) {
        rootInjector = new Injector({ name: 'root' });
    }
    return rootInjector;
}

export function setRootInjector(injector: Injector): void {
    rootInjector = injector;
}

export function resetRootInjector(): void {
    if (rootInjector) {
        rootInjector.destroy().catch(console.error);
    }
    rootInjector = null;
}

// ============================================================================
// Module System
// ============================================================================

const moduleInstances = new Map<string, { injector: Injector; config: ModuleConfig }>();

export function defineModule(config: ModuleConfig): ModuleConfig {
    return {
        id: config.id || `module_${Math.random().toString(36).slice(2)}`,
        ...config
    };
}

export function bootstrapModule(config: ModuleConfig, parentInjector = getRootInjector()): Injector {
    const moduleId = config.id || `module_${Date.now()}`;

    // Check if already bootstrapped
    if (moduleInstances.has(moduleId)) {
        return moduleInstances.get(moduleId)!.injector;
    }

    // Create module injector
    const moduleInjector = parentInjector.createChild([], moduleId);

    // Process imports first
    for (const imported of config.imports || []) {
        const importedInjector = bootstrapModule(imported, moduleInjector);

        // Copy exported providers
        for (const exportedToken of imported.exports || []) {
            if (importedInjector.has(exportedToken)) {
                moduleInjector.register({
                    provide: exportedToken,
                    useFactory: () => importedInjector.get(exportedToken)
                });
            }
        }
    }

    // Register providers
    for (const provider of config.providers || []) {
        moduleInjector.register(provider);
    }

    // Register declarations
    for (const declaration of config.declarations || []) {
        moduleInjector.register(declaration);
    }

    // Bootstrap components
    for (const component of config.bootstrap || []) {
        moduleInjector.get(component);
    }

    moduleInstances.set(moduleId, { injector: moduleInjector, config });

    return moduleInjector;
}

export async function destroyModule(moduleId: string): Promise<void> {
    const module = moduleInstances.get(moduleId);
    if (module) {
        await module.injector.destroy();
        moduleInstances.delete(moduleId);
    }
}

// ============================================================================
// Hooks for PhilJS Components
// ============================================================================

export function useService<T>(token: Token<T>): T {
    return getRootInjector().get(token);
}

export function useServices<T extends Token[]>(...tokens: T): { [K in keyof T]: T[K] extends Token<infer U> ? U : never } {
    const injector = getRootInjector();
    return tokens.map(token => injector.get(token)) as any;
}

export function useOptionalService<T>(token: Token<T>): T | undefined {
    return getRootInjector().get(token, { optional: true });
}

export function useInjector(): Injector {
    return getRootInjector();
}

export function useScope<T>(
    providers: ProviderLike[],
    callback: (injector: Injector) => T
): T {
    const scope = getRootInjector().createScope(providers);
    try {
        return callback(scope);
    } finally {
        scope.destroy().catch(console.error);
    }
}

export function useAsyncService<T>(token: Token<T>): {
    service: Signal<T | null>;
    loading: Signal<boolean>;
    error: Signal<Error | null>;
    reload: () => Promise<void>;
} {
    const service = signal<T | null>(null);
    const loading = signal(true);
    const error = signal<Error | null>(null);

    const load = async () => {
        loading.value = true;
        error.value = null;
        try {
            const instance = await getRootInjector().resolveAsync(token);
            service.value = instance;
        } catch (e) {
            error.value = e instanceof Error ? e : new Error(String(e));
        } finally {
            loading.value = false;
        }
    };

    effect(() => {
        load();
    });

    return { service, loading, error, reload: load };
}

// ============================================================================
// Provider Factories
// ============================================================================

export function useClass<T>(cls: Constructor<T>, deps?: Token[]): Provider<T> {
    return { provide: cls, useClass: cls, deps };
}

export function useValue<T>(token: Token<T>, value: T): ValueProvider<T> {
    return { provide: token, useValue: value };
}

export function useFactory<T>(token: Token<T>, factory: Factory<T>, deps?: Token[]): FactoryProvider<T> {
    return { provide: token, useFactory: factory, deps };
}

export function useExisting<T>(token: Token<T>, existing: Token<T>): ExistingProvider<T> {
    return { provide: token, useExisting: existing };
}

export function multi<T>(providers: ProviderLike<T>[]): Provider<T>[] {
    return providers.map(p => ({
        ...(typeof p === 'function' ? { provide: p, useClass: p } : p),
        multi: true
    }));
}

// ============================================================================
// Common Tokens
// ============================================================================

export const PLATFORM_ID = createInjectionToken<string>('PLATFORM_ID');
export const APP_INITIALIZER = createInjectionToken<Array<() => void | Promise<void>>>('APP_INITIALIZER', { multi: true });
export const HTTP_INTERCEPTORS = createInjectionToken<any[]>('HTTP_INTERCEPTORS', { multi: true });
export const LOCALE_ID = createInjectionToken<string>('LOCALE_ID', { factory: () => 'en-US' });
export const DOCUMENT = createInjectionToken<Document>('DOCUMENT');
export const WINDOW = createInjectionToken<Window>('WINDOW');
export const ENVIRONMENT = createInjectionToken<Record<string, any>>('ENVIRONMENT');
export const CONFIG = createInjectionToken<Record<string, any>>('CONFIG');

// ============================================================================
// Testing Utilities
// ============================================================================

export interface TestBed {
    configureTestingModule(config: ModuleConfig): TestBed;
    createComponent<T>(component: Constructor<T>): T;
    inject<T>(token: Token<T>): T;
    overrideProvider<T>(provider: Provider<T>): TestBed;
    reset(): void;
    injector: Injector;
}

export function createTestBed(): TestBed {
    let testInjector = new Injector({ name: 'TestBed' });
    let moduleConfig: ModuleConfig = { providers: [] };

    const testBed: TestBed = {
        configureTestingModule(config: ModuleConfig) {
            moduleConfig = config;
            testInjector = bootstrapModule(config, new Injector({ name: 'TestRoot' }));
            return testBed;
        },

        createComponent<T>(component: Constructor<T>): T {
            return testInjector.get(component);
        },

        inject<T>(token: Token<T>): T {
            return testInjector.get(token);
        },

        overrideProvider<T>(provider: Provider<T>) {
            testInjector.register(provider);
            return testBed;
        },

        reset() {
            testInjector.destroy().catch(console.error);
            testInjector = new Injector({ name: 'TestBed' });
            moduleConfig = { providers: [] };
        },

        get injector() {
            return testInjector;
        }
    };

    return testBed;
}

export function mockProvider<T>(token: Token<T>, mock: Partial<T>): Provider<T> {
    return {
        provide: token,
        useValue: mock as T
    };
}

export function spyOnService<T>(token: Token<T>, methodNames: (keyof T)[]): { service: T; spies: Map<keyof T, jest.Mock> } {
    const service = getRootInjector().get(token);
    const spies = new Map<keyof T, jest.Mock>();

    for (const method of methodNames) {
        if (typeof (service as any)[method] === 'function') {
            const spy = jest.fn();
            spy.mockImplementation((service as any)[method].bind(service));
            (service as any)[method] = spy;
            spies.set(method, spy);
        }
    }

    return { service, spies };
}

// ============================================================================
// Signal Integration
// ============================================================================

export interface ServiceState<T> {
    instance: Signal<T | null>;
    loading: Signal<boolean>;
    error: Signal<Error | null>;
    ready: Computed<boolean>;
}

export function createServiceSignal<T>(token: Token<T>): ServiceState<T> {
    const instance = signal<T | null>(null);
    const loading = signal(true);
    const error = signal<Error | null>(null);

    const ready = computed(() => instance.value !== null && !loading.value && error.value === null);

    (async () => {
        try {
            instance.value = await getRootInjector().resolveAsync(token);
        } catch (e) {
            error.value = e instanceof Error ? e : new Error(String(e));
        } finally {
            loading.value = false;
        }
    })();

    return { instance, loading, error, ready };
}

export function useReactiveService<T>(token: Token<T>): ServiceState<T> {
    return createServiceSignal(token);
}

// ============================================================================
// Container Events
// ============================================================================

export type ContainerEvent =
    | { type: 'provider:registered'; token: Token; provider: Provider }
    | { type: 'instance:created'; token: Token; instance: any }
    | { type: 'instance:destroyed'; token: Token }
    | { type: 'injector:created'; injector: Injector }
    | { type: 'injector:destroyed'; injector: Injector };

const eventListeners = new Set<(event: ContainerEvent) => void>();

export function onContainerEvent(listener: (event: ContainerEvent) => void): () => void {
    eventListeners.add(listener);
    return () => eventListeners.delete(listener);
}

export function emitContainerEvent(event: ContainerEvent): void {
    eventListeners.forEach(listener => listener(event));
}

// ============================================================================
// Exports
// ============================================================================

export {
    Injector,
    Injectable,
    Inject,
    Optional,
    Self,
    SkipSelf,
    Host,
    useService,
    useServices,
    useOptionalService,
    useInjector,
    useScope,
    defineModule,
    bootstrapModule,
    getRootInjector,
    setRootInjector,
    resetRootInjector,
    createInjectionToken,
    createTestBed,
    mockProvider
};

export type {
    Token,
    Constructor,
    AbstractType,
    Factory,
    AsyncFactory,
    Scope,
    Provider,
    ProviderLike,
    InjectorOptions,
    ModuleConfig,
    ResolveOptions,
    InjectableMetadata,
    InjectMetadata,
    LifecycleHooks,
    ServiceState,
    ContainerEvent
};
