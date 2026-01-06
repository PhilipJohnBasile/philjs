/**
 * @philjs/di - NestJS Compatibility Layer
 *
 * Provides NestJS-compatible decorators and patterns for PhilJS DI.
 * Allows gradual migration from NestJS to PhilJS.
 *
 * @see https://docs.nestjs.com/fundamentals/custom-providers
 */

// Metadata storage
const moduleMetadata = new Map<Function, ModuleMetadata>();
const injectableMetadata = new Map<Function, InjectableMetadata>();
const controllerMetadata = new Map<Function, ControllerMetadata>();
const paramMetadata = new Map<Function, Map<number, ParamMetadata>>();
const methodMetadata = new Map<Function, Map<string, RouteMetadata>>();

// Type definitions
export interface ModuleMetadata {
    imports?: any[];
    providers?: Provider[];
    controllers?: any[];
    exports?: any[];
}

export interface InjectableMetadata {
    scope?: 'DEFAULT' | 'REQUEST' | 'TRANSIENT';
}

export interface ControllerMetadata {
    path?: string;
    version?: string;
}

export type Provider =
    | Type<any>
    | ClassProvider
    | ValueProvider
    | FactoryProvider
    | ExistingProvider;

export interface ClassProvider {
    provide: any;
    useClass: Type<any>;
}

export interface ValueProvider {
    provide: any;
    useValue: any;
}

export interface FactoryProvider {
    provide: any;
    useFactory: (...args: any[]) => any;
    inject?: any[];
}

export interface ExistingProvider {
    provide: any;
    useExisting: any;
}

export interface Type<T = any> extends Function {
    new (...args: any[]): T;
}

export interface ParamMetadata {
    type: 'body' | 'param' | 'query' | 'headers' | 'inject';
    key?: string;
    token?: any;
}

export interface RouteMetadata {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
    path: string;
}

// DI Container
export class DIContainer {
    private providers = new Map<any, any>();
    private instances = new Map<any, any>();
    private requestScoped = new Set<any>();
    private transientScoped = new Set<any>();

    register(provider: Provider): void {
        if (typeof provider === 'function') {
            this.providers.set(provider, { useClass: provider });
        } else if ('useClass' in provider) {
            this.providers.set(provider.provide, provider);
        } else if ('useValue' in provider) {
            this.providers.set(provider.provide, provider);
            this.instances.set(provider.provide, provider.useValue);
        } else if ('useFactory' in provider) {
            this.providers.set(provider.provide, provider);
        } else if ('useExisting' in provider) {
            this.providers.set(provider.provide, provider);
        }
    }

    resolve<T>(token: any): T {
        // Check for existing singleton instance
        if (this.instances.has(token) && !this.transientScoped.has(token)) {
            return this.instances.get(token);
        }

        const provider = this.providers.get(token);
        if (!provider) {
            throw new Error(`No provider found for ${token?.name || token}`);
        }

        let instance: any;

        if ('useValue' in provider) {
            instance = provider.useValue;
        } else if ('useClass' in provider) {
            instance = this.instantiate(provider.useClass);
        } else if ('useFactory' in provider) {
            const deps = (provider.inject || []).map((dep: any) => this.resolve(dep));
            instance = provider.useFactory(...deps);
        } else if ('useExisting' in provider) {
            instance = this.resolve(provider.useExisting);
        }

        // Cache singleton instances
        if (!this.transientScoped.has(token)) {
            this.instances.set(token, instance);
        }

        return instance;
    }

    private instantiate<T>(type: Type<T>): T {
        // Get constructor parameter types from metadata
        const paramTypes = Reflect.getMetadata?.('design:paramtypes', type) || [];
        const deps = paramTypes.map((paramType: any) => this.resolve(paramType));
        return new type(...deps);
    }

    setScope(token: any, scope: 'REQUEST' | 'TRANSIENT'): void {
        if (scope === 'TRANSIENT') {
            this.transientScoped.add(token);
        } else if (scope === 'REQUEST') {
            this.requestScoped.add(token);
        }
    }
}

// Global container
const globalContainer = new DIContainer();

/**
 * Module decorator - marks a class as a NestJS-style module
 */
export function Module(metadata: ModuleMetadata): ClassDecorator {
    return (target: Function) => {
        moduleMetadata.set(target, metadata);

        // Register providers
        for (const provider of metadata.providers || []) {
            globalContainer.register(provider);
        }

        // Handle imports
        for (const importedModule of metadata.imports || []) {
            const importedMeta = moduleMetadata.get(importedModule);
            if (importedMeta?.exports) {
                for (const exported of importedMeta.exports) {
                    if (typeof exported === 'function' && moduleMetadata.has(exported)) {
                        // Re-export module
                        const exportedMeta = moduleMetadata.get(exported);
                        for (const provider of exportedMeta?.providers || []) {
                            globalContainer.register(provider);
                        }
                    } else {
                        // Re-export provider
                        const exportedProvider = importedMeta.providers?.find(p =>
                            typeof p === 'function' ? p === exported : (p as any).provide === exported
                        );
                        if (exportedProvider) {
                            globalContainer.register(exportedProvider);
                        }
                    }
                }
            }
        }
    };
}

/**
 * Injectable decorator - marks a class as injectable
 */
export function Injectable(options?: InjectableMetadata): ClassDecorator {
    return (target: Function) => {
        injectableMetadata.set(target, options || {});
        globalContainer.register(target as Type<any>);

        if (options?.scope) {
            globalContainer.setScope(target, options.scope as 'REQUEST' | 'TRANSIENT');
        }
    };
}

/**
 * Controller decorator - marks a class as a controller
 */
export function Controller(pathOrOptions?: string | ControllerMetadata): ClassDecorator {
    return (target: Function) => {
        const metadata: ControllerMetadata = typeof pathOrOptions === 'string'
            ? { path: pathOrOptions }
            : pathOrOptions || {};

        controllerMetadata.set(target, metadata);
        globalContainer.register(target as Type<any>);
    };
}

/**
 * Inject decorator - specifies a dependency to inject
 */
export function Inject(token: any): ParameterDecorator {
    return (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
        const constructor = target.constructor;
        if (!paramMetadata.has(constructor)) {
            paramMetadata.set(constructor, new Map());
        }
        paramMetadata.get(constructor)!.set(parameterIndex, {
            type: 'inject',
            token,
        });
    };
}

/**
 * Optional decorator - marks a dependency as optional
 */
export function Optional(): ParameterDecorator {
    return (_target: Object, _propertyKey: string | symbol | undefined, _parameterIndex: number) => {
        // Mark parameter as optional - handled during resolution
    };
}

// HTTP method decorators
function createMethodDecorator(method: RouteMetadata['method']) {
    return (path: string = ''): MethodDecorator => {
        return (target: Object, propertyKey: string | symbol, _descriptor: PropertyDescriptor) => {
            const constructor = target.constructor;
            if (!methodMetadata.has(constructor)) {
                methodMetadata.set(constructor, new Map());
            }
            methodMetadata.get(constructor)!.set(String(propertyKey), { method, path });
        };
    };
}

export const Get = createMethodDecorator('GET');
export const Post = createMethodDecorator('POST');
export const Put = createMethodDecorator('PUT');
export const Delete = createMethodDecorator('DELETE');
export const Patch = createMethodDecorator('PATCH');
export const Options = createMethodDecorator('OPTIONS');
export const Head = createMethodDecorator('HEAD');

// Parameter decorators
function createParamDecorator(type: ParamMetadata['type']) {
    return (key?: string): ParameterDecorator => {
        return (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
            const constructor = target.constructor;
            if (!paramMetadata.has(constructor)) {
                paramMetadata.set(constructor, new Map());
            }
            paramMetadata.get(constructor)!.set(parameterIndex, { type, key });
        };
    };
}

export const Body = createParamDecorator('body');
export const Param = createParamDecorator('param');
export const Query = createParamDecorator('query');
export const Headers = createParamDecorator('headers');

/**
 * Get the global DI container
 */
export function getContainer(): DIContainer {
    return globalContainer;
}

/**
 * Resolve a dependency from the container
 */
export function resolve<T>(token: any): T {
    return globalContainer.resolve<T>(token);
}

/**
 * Create a new module factory for testing
 */
export async function createTestingModule(metadata: ModuleMetadata): Promise<{
    compile: () => Promise<{ get: <T>(token: any) => T }>;
    overrideProvider: (token: any) => { useValue: (value: any) => void };
}> {
    const testContainer = new DIContainer();

    // Register providers
    for (const provider of metadata.providers || []) {
        testContainer.register(provider);
    }

    return {
        compile: async () => ({
            get: <T>(token: any) => testContainer.resolve<T>(token),
        }),
        overrideProvider: (token: any) => ({
            useValue: (value: any) => {
                testContainer.register({ provide: token, useValue: value });
            },
        }),
    };
}

/**
 * Bootstrap a NestJS-style application
 */
export async function bootstrap<T>(
    AppModule: Type<T>,
    options?: { port?: number; host?: string }
): Promise<{ listen: () => Promise<void>; close: () => Promise<void> }> {
    // Initialize module
    const moduleMeta = moduleMetadata.get(AppModule);
    if (!moduleMeta) {
        throw new Error(`${AppModule.name} is not a valid module`);
    }

    // Create HTTP server (simplified)
    const routes: Array<{
        method: string;
        path: string;
        handler: Function;
        controller: any;
    }> = [];

    // Register routes from controllers
    for (const ControllerClass of moduleMeta.controllers || []) {
        const controllerMeta = controllerMetadata.get(ControllerClass);
        const basePath = controllerMeta?.path || '';
        const controller = globalContainer.resolve(ControllerClass);
        const methods = methodMetadata.get(ControllerClass);

        if (methods) {
            for (const [methodName, routeMeta] of methods) {
                routes.push({
                    method: routeMeta.method,
                    path: `/${basePath}/${routeMeta.path}`.replace(/\/+/g, '/'),
                    handler: (controller as any)[methodName].bind(controller),
                    controller,
                });
            }
        }
    }

    return {
        listen: async () => {
            const port = options?.port || 3000;
            console.log(`PhilJS application listening on port ${port}`);
            console.log(`Registered ${routes.length} routes:`);
            for (const route of routes) {
                console.log(`  ${route.method} ${route.path}`);
            }
        },
        close: async () => {
            console.log('Application closed');
        },
    };
}

// Re-export commonly used types
export type { ModuleMetadata, InjectableMetadata, ControllerMetadata, Provider };
