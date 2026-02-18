/**
 * Tests for PhilJS Dependency Injection Container
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  Injector,
  createInjectionToken,
  InjectionToken_Class,
  getRootInjector,
  setRootInjector,
  resetRootInjector,
  defineModule,
  bootstrapModule,
  destroyModule,
  useService,
  useOptionalService,
  useInjector,
  useValue,
  useFactory,
  useClass,
  useExisting,
  multi,
  createTestBed,
  mockProvider,
} from './index';

describe('PhilJS Dependency Injection', () => {
  beforeEach(() => {
    resetRootInjector();
  });

  afterEach(() => {
    resetRootInjector();
  });

  describe('InjectionToken', () => {
    it('should create injection token with description', () => {
      const token = createInjectionToken<string>('API_URL');
      expect(token._desc).toBe('API_URL');
      expect(token.toString()).toBe('InjectionToken(API_URL)');
    });

    it('should create token with factory default', () => {
      const token = createInjectionToken<number>('COUNT', {
        factory: () => 42,
      });
      expect(token._default).toBeDefined();
      expect(typeof token._default).toBe('function');
    });

    it('should create multi token', () => {
      const token = createInjectionToken<string[]>('PLUGINS', { multi: true });
      expect(token._multi).toBe(true);
    });

    it('should work with class-based token', () => {
      const token = new InjectionToken_Class<string>('CONFIG');
      expect(token._desc).toBe('CONFIG');
    });
  });

  describe('Injector', () => {
    describe('Constructor', () => {
      it('should create injector with default options', () => {
        const injector = new Injector();
        expect(injector).toBeInstanceOf(Injector);
      });

      it('should create injector with custom name', () => {
        const injector = new Injector({ name: 'TestInjector' });
        expect(injector.get(Injector)).toBe(injector);
      });

      it('should register initial providers', () => {
        const injector = new Injector({
          providers: [{ provide: 'VALUE', useValue: 'test' }],
        });
        expect(injector.get('VALUE')).toBe('test');
      });
    });

    describe('Value Providers', () => {
      it('should resolve value provider', () => {
        const injector = new Injector();
        injector.register({ provide: 'API_URL', useValue: 'http://api.example.com' });
        expect(injector.get('API_URL')).toBe('http://api.example.com');
      });

      it('should resolve injection token with value', () => {
        const TOKEN = createInjectionToken<number>('NUMBER');
        const injector = new Injector();
        injector.register({ provide: TOKEN, useValue: 42 });
        expect(injector.get(TOKEN)).toBe(42);
      });
    });

    describe('Class Providers', () => {
      it('should instantiate class provider', () => {
        class TestService {
          getValue() {
            return 'test';
          }
        }

        const injector = new Injector({
          providers: [{ provide: TestService, useClass: TestService }],
        });

        const service = injector.get(TestService);
        expect(service).toBeInstanceOf(TestService);
        expect(service.getValue()).toBe('test');
      });

      it('should inject dependencies into class', () => {
        const CONFIG = createInjectionToken<string>('CONFIG');

        class ServiceA {
          getValue() {
            return 'A';
          }
        }

        class ServiceB {
          constructor(public a: ServiceA, public config: string) {}
        }

        const injector = new Injector({
          providers: [
            ServiceA,
            { provide: CONFIG, useValue: 'test-config' },
            { provide: ServiceB, useClass: ServiceB, deps: [ServiceA, CONFIG] },
          ],
        });

        const b = injector.get(ServiceB);
        expect(b.a).toBeInstanceOf(ServiceA);
        expect(b.config).toBe('test-config');
      });

      it('should provide singleton by default', () => {
        class Counter {
          count = 0;
          increment() {
            this.count++;
          }
        }

        const injector = new Injector({ providers: [Counter] });

        const c1 = injector.get(Counter);
        const c2 = injector.get(Counter);

        c1.increment();
        expect(c2.count).toBe(1);
        expect(c1).toBe(c2);
      });

      it('should create new instance for transient scope', () => {
        class Counter {
          count = 0;
        }

        const injector = new Injector({
          providers: [{ provide: Counter, useClass: Counter, scope: 'transient' }],
        });

        const c1 = injector.get(Counter);
        const c2 = injector.get(Counter);

        expect(c1).not.toBe(c2);
      });
    });

    describe('Factory Providers', () => {
      it('should resolve factory provider', () => {
        const injector = new Injector({
          providers: [
            {
              provide: 'GREETING',
              useFactory: () => 'Hello, World!',
            },
          ],
        });

        expect(injector.get('GREETING')).toBe('Hello, World!');
      });

      it('should inject dependencies into factory', () => {
        const NAME = createInjectionToken<string>('NAME');

        const injector = new Injector({
          providers: [
            { provide: NAME, useValue: 'Alice' },
            {
              provide: 'GREETING',
              useFactory: (name: string) => `Hello, ${name}!`,
              deps: [NAME],
            },
          ],
        });

        expect(injector.get('GREETING')).toBe('Hello, Alice!');
      });
    });

    describe('Existing Providers', () => {
      it('should alias to existing provider', () => {
        class RealService {
          getValue() {
            return 'real';
          }
        }

        const ALIAS = createInjectionToken<RealService>('ALIAS');

        const injector = new Injector({
          providers: [RealService, { provide: ALIAS, useExisting: RealService }],
        });

        const real = injector.get(RealService);
        const alias = injector.get(ALIAS);

        expect(real).toBe(alias);
      });
    });

    describe('Multi Providers', () => {
      it('should collect multi providers', () => {
        const PLUGINS = createInjectionToken<string[]>('PLUGINS');

        const injector = new Injector({
          providers: [
            { provide: PLUGINS, useValue: 'plugin-a', multi: true },
            { provide: PLUGINS, useValue: 'plugin-b', multi: true },
            { provide: PLUGINS, useValue: 'plugin-c', multi: true },
          ],
        });

        const plugins = injector.get(PLUGINS);
        expect(plugins).toEqual(['plugin-a', 'plugin-b', 'plugin-c']);
      });
    });

    describe('Hierarchical Injection', () => {
      it('should resolve from parent injector', () => {
        const parent = new Injector({
          providers: [{ provide: 'VALUE', useValue: 'parent' }],
        });

        const child = parent.createChild();
        expect(child.get('VALUE')).toBe('parent');
      });

      it('should override parent provider', () => {
        const parent = new Injector({
          providers: [{ provide: 'VALUE', useValue: 'parent' }],
        });

        const child = parent.createChild([{ provide: 'VALUE', useValue: 'child' }]);

        expect(child.get('VALUE')).toBe('child');
        expect(parent.get('VALUE')).toBe('parent');
      });

      it('should support skipSelf option', () => {
        const parent = new Injector({
          providers: [{ provide: 'VALUE', useValue: 'parent' }],
        });

        const child = parent.createChild([{ provide: 'VALUE', useValue: 'child' }]);

        expect(child.get('VALUE', { skipSelf: true })).toBe('parent');
      });

      it('should support self option', () => {
        const parent = new Injector({
          providers: [{ provide: 'VALUE', useValue: 'parent' }],
        });

        const child = parent.createChild();

        expect(() => child.get('VALUE', { self: true })).toThrow();
      });
    });

    describe('Optional Resolution', () => {
      it('should return undefined for optional missing provider', () => {
        const injector = new Injector();
        const result = injector.get('NON_EXISTENT', { optional: true });
        expect(result).toBeUndefined();
      });

      it('should throw for non-optional missing provider', () => {
        const injector = new Injector();
        expect(() => injector.get('NON_EXISTENT')).toThrow();
      });
    });

    describe('Circular Dependency Detection', () => {
      it('should detect circular dependency', () => {
        class ServiceA {
          constructor(public b: any) {}
        }

        class ServiceB {
          constructor(public a: ServiceA) {}
        }

        const injector = new Injector({
          providers: [
            { provide: ServiceA, useClass: ServiceA, deps: [ServiceB] },
            { provide: ServiceB, useClass: ServiceB, deps: [ServiceA] },
          ],
        });

        expect(() => injector.get(ServiceA)).toThrow(/Circular dependency/);
      });
    });

    describe('Async Resolution', () => {
      it('should resolve async provider', async () => {
        const injector = new Injector({
          providers: [
            {
              provide: 'ASYNC_VALUE',
              useAsync: async () => {
                await new Promise((r) => setTimeout(r, 10));
                return 'async-result';
              },
            },
          ],
        });

        const result = await injector.resolveAsync('ASYNC_VALUE');
        expect(result).toBe('async-result');
      });

      it('should inject dependencies into async factory', async () => {
        const injector = new Injector({
          providers: [
            { provide: 'PREFIX', useValue: 'Hello' },
            {
              provide: 'ASYNC_GREETING',
              useAsync: async (prefix: string) => {
                await new Promise((r) => setTimeout(r, 10));
                return `${prefix}, World!`;
              },
              deps: ['PREFIX'],
            },
          ],
        });

        const result = await injector.resolveAsync('ASYNC_GREETING');
        expect(result).toBe('Hello, World!');
      });
    });

    describe('Lifecycle Hooks', () => {
      it('should call onInit hook', () => {
        const onInit = vi.fn();

        const injector = new Injector({
          providers: [
            {
              provide: 'SERVICE',
              useValue: { name: 'test' },
              onInit,
            },
          ],
        });

        injector.get('SERVICE');
        expect(onInit).toHaveBeenCalledWith({ name: 'test' });
      });

      it('should call onDestroy during injector destruction', async () => {
        const onDestroy = vi.fn();

        const injector = new Injector({
          providers: [
            {
              provide: 'SERVICE',
              useValue: { name: 'test' },
              onDestroy,
            },
          ],
        });

        injector.get('SERVICE');
        await injector.destroy();

        expect(onDestroy).toHaveBeenCalledWith({ name: 'test' });
      });
    });

    describe('has()', () => {
      it('should check if provider exists', () => {
        const injector = new Injector({
          providers: [{ provide: 'EXISTS', useValue: true }],
        });

        expect(injector.has('EXISTS')).toBe(true);
        expect(injector.has('NOT_EXISTS')).toBe(false);
      });

      it('should check parent injector', () => {
        const parent = new Injector({
          providers: [{ provide: 'PARENT_VALUE', useValue: true }],
        });

        const child = parent.createChild();
        expect(child.has('PARENT_VALUE')).toBe(true);
      });
    });
  });

  describe('Root Injector', () => {
    it('should get root injector', () => {
      const root = getRootInjector();
      expect(root).toBeInstanceOf(Injector);
    });

    it('should return same instance', () => {
      const root1 = getRootInjector();
      const root2 = getRootInjector();
      expect(root1).toBe(root2);
    });

    it('should allow setting custom root', () => {
      const custom = new Injector({ name: 'custom-root' });
      setRootInjector(custom);
      expect(getRootInjector()).toBe(custom);
    });
  });

  describe('Module System', () => {
    it('should define module', () => {
      const module = defineModule({
        providers: [{ provide: 'VALUE', useValue: 'test' }],
      });

      expect(module.id).toBeDefined();
      expect(module.providers).toHaveLength(1);
    });

    it('should bootstrap module', () => {
      const module = defineModule({
        id: 'test-module',
        providers: [{ provide: 'MODULE_VALUE', useValue: 'from-module' }],
      });

      const injector = bootstrapModule(module);
      expect(injector.get('MODULE_VALUE')).toBe('from-module');
    });

    it('should handle module imports', () => {
      const sharedModule = defineModule({
        id: 'shared',
        providers: [{ provide: 'SHARED', useValue: 'shared-value' }],
        exports: ['SHARED'],
      });

      const appModule = defineModule({
        id: 'app',
        imports: [sharedModule],
        providers: [],
      });

      const injector = bootstrapModule(appModule);
      expect(injector.get('SHARED')).toBe('shared-value');
    });

    it('should destroy module', async () => {
      const module = defineModule({ id: 'destroyable' });
      bootstrapModule(module);
      await destroyModule('destroyable');
      // No throw means success
    });
  });

  describe('Hooks', () => {
    it('should use useService hook', () => {
      getRootInjector().register({ provide: 'VALUE', useValue: 42 });
      const value = useService('VALUE');
      expect(value).toBe(42);
    });

    it('should use useOptionalService hook', () => {
      const value = useOptionalService('NON_EXISTENT');
      expect(value).toBeUndefined();
    });

    it('should use useInjector hook', () => {
      const injector = useInjector();
      expect(injector).toBe(getRootInjector());
    });
  });

  describe('Provider Factories', () => {
    it('should create class provider', () => {
      class TestService {}
      const provider = useClass(TestService);
      expect(provider.provide).toBe(TestService);
      expect(provider.useClass).toBe(TestService);
    });

    it('should create value provider', () => {
      const TOKEN = createInjectionToken<string>('TOKEN');
      const provider = useValue(TOKEN, 'value');
      expect(provider.provide).toBe(TOKEN);
      expect(provider.useValue).toBe('value');
    });

    it('should create factory provider', () => {
      const TOKEN = createInjectionToken<number>('TOKEN');
      const provider = useFactory(TOKEN, () => 42);
      expect(provider.provide).toBe(TOKEN);
      expect(typeof provider.useFactory).toBe('function');
    });

    it('should create existing provider', () => {
      class Original {}
      const ALIAS = createInjectionToken<Original>('ALIAS');
      const provider = useExisting(ALIAS, Original);
      expect(provider.useExisting).toBe(Original);
    });

    it('should create multi providers', () => {
      class PluginA {}
      class PluginB {}
      const providers = multi([PluginA, PluginB]);
      expect(providers).toHaveLength(2);
      expect(providers[0].multi).toBe(true);
      expect(providers[1].multi).toBe(true);
    });
  });

  describe('TestBed', () => {
    it('should create test bed', () => {
      const testBed = createTestBed();
      expect(testBed).toBeDefined();
      expect(testBed.injector).toBeInstanceOf(Injector);
    });

    it('should configure testing module', () => {
      const testBed = createTestBed();
      testBed.configureTestingModule({
        providers: [{ provide: 'VALUE', useValue: 'test' }],
      });

      expect(testBed.inject('VALUE')).toBe('test');
    });

    it('should create component', () => {
      class TestComponent {}

      const testBed = createTestBed();
      testBed.configureTestingModule({
        providers: [TestComponent],
      });

      const component = testBed.createComponent(TestComponent);
      expect(component).toBeInstanceOf(TestComponent);
    });

    it('should override provider', () => {
      const testBed = createTestBed();
      testBed
        .configureTestingModule({
          providers: [{ provide: 'VALUE', useValue: 'original' }],
        })
        .overrideProvider({ provide: 'VALUE', useValue: 'overridden' });

      expect(testBed.inject('VALUE')).toBe('overridden');
    });

    it('should reset test bed', () => {
      const testBed = createTestBed();
      testBed.configureTestingModule({
        providers: [{ provide: 'VALUE', useValue: 'test' }],
      });

      testBed.reset();
      expect(() => testBed.inject('VALUE')).toThrow();
    });
  });

  describe('Mock Provider', () => {
    it('should create mock provider', () => {
      interface Service {
        getValue(): string;
        doSomething(): void;
      }

      const TOKEN = createInjectionToken<Service>('SERVICE');
      const mock = mockProvider(TOKEN, {
        getValue: () => 'mocked',
      });

      expect(mock.provide).toBe(TOKEN);
      expect((mock.useValue as Service).getValue()).toBe('mocked');
    });
  });
});
