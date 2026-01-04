/**
 * PhilJS Dependency Injection Container
 * 
 * Angular-style DI for PhilJS applications.
 */

import { signal, type Signal } from '@philjs/core';

// ============ TYPES ============

export type Token<T = any> = string | symbol | { new(...args: any[]): T } | InjectionToken<T>;

export class InjectionToken<T = any> {
    readonly _desc: string;
    constructor(desc: string) {
        this._desc = desc;
    }
    toString(): string {
        return `InjectionToken ${this._desc}`;
    }
}

export interface Provider<T = any> {
    provide: Token<T>;
    useClass?: new (...args: any[]) => T;
    useValue?: T;
    useFactory?: (...deps: any[]) => T;
    deps?: Token[];
    scope?: 'singleton' | 'transient' | 'request';
}

export interface InjectorOptions {
    providers?: Provider[];
    parent?: Injector;
}

// ============ DECORATORS (Simulated) ============

const metadata = new WeakMap<any, any>();

export function Injectable(options: { providedIn?: 'root' | 'platform' | null } = {}) {
    return function <T extends new (...args: any[]) => any>(target: T) {
        metadata.set(target, { injectable: true, ...options });
        return target;
    };
}

export function Inject(token: Token) {
    return function (target: any, key: string | undefined, index: number) {
        const existing = metadata.get(target) || {};
        existing.params = existing.params || [];
        existing.params[index] = { token, options: {} };
        metadata.set(target, existing);
    };
}

export function Optional() {
    return function (target: any, key: string | undefined, index: number) {
        const existing = metadata.get(target) || {};
        existing.params = existing.params || [];
        // Ensure param object exists
        if (!existing.params[index]) existing.params[index] = { options: {} };
        existing.params[index].options.optional = true;
        metadata.set(target, existing);
    };
}

// ============ INJECTOR ============

export class Injector {
    private instances = new Map<Token, any>();
    private providers = new Map<Token, Provider>();
    private parent?: Injector;

    constructor(options: InjectorOptions = {}) {
        this.parent = options.parent;

        // Register self
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
    register<T>(provider: Provider<T>): void {
        this.providers.set(provider.provide, provider);
    }

    /**
     * Get an instance of a token
     */
    get<T>(token: Token<T>): T {
        // Check if already instantiated (singleton)
        if (this.instances.has(token)) {
            return this.instances.get(token);
        }

        // Check providers
        const provider = this.providers.get(token);

        if (provider) {
            const instance = this.createInstance(provider);

            if (provider.scope !== 'transient') {
                this.instances.set(token, instance);
            }

            return instance;
        }

        // Check parent
        if (this.parent) {
            return this.parent.get(token);
        }

        // Try to instantiate class directly
        if (typeof token === 'function') {
            const instance = this.instantiateClass(token as new (...args: any[]) => T);
            this.instances.set(token, instance);
            return instance;
        }

        throw new Error(`No provider for ${String(token)}`);
    }

    /**
     * Create an instance from a provider
     */
    private createInstance<T>(provider: Provider<T>): T {
        if (provider.useValue !== undefined) {
            return provider.useValue;
        }

        if (provider.useFactory) {
            const deps = provider.deps?.map(dep => this.get(dep)) || [];
            return provider.useFactory(...deps);
        }

        if (provider.useClass) {
            return this.instantiateClass(provider.useClass);
        }

        if (typeof provider.provide === 'function') {
            return this.instantiateClass(provider.provide as new (...args: any[]) => T);
        }

        throw new Error(`Invalid provider for ${String(provider.provide)}`);
    }

    /**
     * Instantiate a class with dependency injection
     */
    private instantiateClass<T>(target: new (...args: any[]) => T): T {
        const meta = metadata.get(target) || {};
        const params = meta.params || [];

        // Get constructor parameter types (would need reflect-metadata in real impl)
        const args = params.map((param: any) => {
            // Handle { token, options } struct vs legacy Token
            const token = param.token || param;
            const options = param.options || {};

            try {
                return this.get(token);
            } catch (e) {
                if (options.optional) return null;
                throw e;
            }
        });

        return new target(...args);
    }

    /**
     * Create a child injector
     */
    createChild(providers: Provider[] = []): Injector {
        return new Injector({ providers, parent: this });
    }
}

// ============ ROOT INJECTOR ============

let rootInjector: Injector | null = null;

export function getRootInjector(): Injector {
    if (!rootInjector) {
        rootInjector = new Injector();
    }
    return rootInjector;
}

export function resetRootInjector(): void {
    rootInjector = null;
}

// ============ HOOKS ============

/**
 * Use a service from the DI container
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const userService = useService(UserService);
 *   return <div>{userService.getCurrentUser()}</div>;
 * }
 * ```
 */
export function useService<T>(token: Token<T>): T {
    return getRootInjector().get(token);
}

/**
 * Use multiple services
 */
export function useServices<T extends Token[]>(...tokens: T): { [K in keyof T]: T[K] extends Token<infer U> ? U : never } {
    return tokens.map(token => getRootInjector().get(token)) as any;
}

// ============ MODULE SYSTEM ============

export interface ModuleConfig {
    providers?: Provider[];
    imports?: ModuleConfig[];
    exports?: Token[];
}

export function defineModule(config: ModuleConfig): ModuleConfig {
    return config;
}

export function bootstrapModule(config: ModuleConfig, injector = getRootInjector()): Injector {
    // Process imports first
    for (const imported of config.imports || []) {
        bootstrapModule(imported, injector);
    }

    // Register providers
    for (const provider of config.providers || []) {
        injector.register(provider);
    }

    return injector;
}

// ============ COMMON TOKENS ============

export const PLATFORM_ID = Symbol('PLATFORM_ID');
export const APP_INITIALIZER = Symbol('APP_INITIALIZER');
export const HTTP_INTERCEPTORS = Symbol('HTTP_INTERCEPTORS');
export const LOCALE_ID = Symbol('LOCALE_ID');

export {
    Injector,
    Injectable,
    Inject,
    useService,
    useServices,
    defineModule,
    bootstrapModule,
    getRootInjector,
};
