/**
 * Tests for Resumable Components
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  resumable$,
  useSignal,
  useComputed,
  handler$,
  renderToResumableString,
  createStreamingRenderer,
  resume,
  isServer,
  isResumable,
  getCurrentComponentId,
  static$,
  client$,
  server$component,
  getResumableContext,
  withResumableContext,
  type ResumableComponent,
  type ResumableSignal,
  type ResumableContext,
} from '../resumable.js';
import { createSerializationContext } from '../serializer.js';

describe('Resumable Component Factory', () => {
  it('should create a resumable component', () => {
    const Component = resumable$(() => 'Hello');

    expect(Component).toBeTruthy();
    expect(typeof Component).toBe('function');
    expect(Component.$qrl$).toBeTruthy();
  });

  it('should create component with display name', () => {
    const MyComponent = resumable$(() => 'content');

    expect(MyComponent.displayName).toBe('ResumableComponent');
  });

  it('should create component with custom options', () => {
    const Component = resumable$(
      () => 'content',
      { module: 'components.js', symbol: 'CustomComponent' }
    );

    expect(Component.$qrl$.$chunk$).toBe('components.js');
    expect(Component.$qrl$.$symbol$).toBe('CustomComponent');
  });

  it('should accept props', () => {
    const Component = resumable$<{ name: string }>((props) => props.name);

    expect(typeof Component).toBe('function');
  });
});

describe('Resumable Signals', () => {
  beforeEach(() => {
    // Clear any global state
    if (typeof document !== 'undefined') {
      const stateEl = document.getElementById('__PHIL_STATE__');
      if (stateEl) stateEl.remove();
    }
  });

  it('should create a resumable signal', () => {
    const signal = useSignal(42);

    expect(signal).toBeTruthy();
    expect(typeof signal).toBe('function');
    expect(signal.$id$).toBeTruthy();
    expect(typeof signal.peek).toBe('function');
    expect(typeof signal.set).toBe('function');
    expect(typeof signal.subscribe).toBe('function');
  });

  it('should get initial value', () => {
    const signal = useSignal('hello');

    expect(signal.peek()).toBe('hello');
  });

  it('should update value', () => {
    const signal = useSignal(0);

    signal.set(10);

    expect(signal.peek()).toBe(10);
  });

  it('should update with function', () => {
    const signal = useSignal(5);

    signal.set((prev) => prev + 1);

    expect(signal.peek()).toBe(6);
  });

  it('should not update if value is the same', () => {
    const signal = useSignal(42);
    const subscriber = vi.fn();

    signal.subscribe(subscriber);
    signal.set(42);

    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should notify subscribers on change', () => {
    const signal = useSignal(0);
    const subscriber = vi.fn();

    signal.subscribe(subscriber);
    signal.set(1);

    expect(subscriber).toHaveBeenCalledWith(1);
  });

  it('should allow multiple subscribers', () => {
    const signal = useSignal('initial');
    const sub1 = vi.fn();
    const sub2 = vi.fn();

    signal.subscribe(sub1);
    signal.subscribe(sub2);

    signal.set('updated');

    expect(sub1).toHaveBeenCalledWith('updated');
    expect(sub2).toHaveBeenCalledWith('updated');
  });

  it('should unsubscribe', () => {
    const signal = useSignal(0);
    const subscriber = vi.fn();

    const unsubscribe = signal.subscribe(subscriber);
    unsubscribe();

    signal.set(1);

    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should have unique ID', () => {
    const signal1 = useSignal(1);
    const signal2 = useSignal(2);

    expect(signal1.$id$).not.toBe(signal2.$id$);
  });
});

describe('Computed Signals', () => {
  it('should create computed signal', () => {
    const computed = useComputed(() => 10 + 20);

    expect(computed).toBeTruthy();
    expect(computed.peek()).toBe(30);
  });

  it('should compute from other signals', () => {
    const count = useSignal(5);
    const doubled = useComputed(() => count.peek() * 2);

    expect(doubled.peek()).toBe(10);
  });
});

describe('Event Handlers', () => {
  it('should create handler with $', () => {
    const handleClick = handler$(() => console.log('clicked'));

    expect(handleClick).toBeTruthy();
    expect(handleClick.$chunk$).toBe('__inline__');
  });

  it('should create handler with captures', () => {
    const count = 5;
    const handleClick = handler$(
      () => {},
      [count],
      ['count']
    );

    expect(handleClick.$capture$).toEqual([count]);
    expect(handleClick.$captureNames$).toEqual(['count']);
  });
});

describe('Server-Side Rendering', () => {
  it('should render to resumable string', async () => {
    const App = () => 'Hello World';
    const html = await renderToResumableString(App());

    expect(html).toContain('Hello World');
    expect(html).toContain('__PHIL_STATE__');
  });

  it('should include state script', async () => {
    const App = () => 'content';
    const html = await renderToResumableString(App());

    expect(html).toContain('<script');
    expect(html).toContain('__PHIL_STATE__');
  });

  it('should include bootstrap script', async () => {
    const App = () => 'content';
    const html = await renderToResumableString(App());

    expect(html).toContain('__PHIL_Q__');
  });

  it('should use custom base path', async () => {
    const App = () => 'content';
    const html = await renderToResumableString(App(), { basePath: '/dist' });

    expect(html).toContain('/dist');
  });

  it('should render in dev mode', async () => {
    const App = () => 'content';
    const html = await renderToResumableString(App(), { isDev: true });

    expect(html).toBeTruthy();
  });
});

describe('Streaming SSR', () => {
  it('should create streaming renderer', () => {
    const renderer = createStreamingRenderer();

    expect(renderer).toBeTruthy();
    expect(typeof renderer.write).toBe('function');
    expect(typeof renderer.flush).toBe('function');
    expect(typeof renderer.end).toBe('function');
  });

  it('should write chunks', () => {
    const renderer = createStreamingRenderer();

    const chunk1 = renderer.write('Hello ');
    const chunk2 = renderer.write('World');

    expect(chunk1).toContain('Hello');
    expect(chunk2).toContain('World');
  });

  it('should end with state scripts', () => {
    const renderer = createStreamingRenderer();

    renderer.write('content');
    const final = renderer.end();

    expect(final).toContain('__PHIL_STATE__');
    expect(final).toContain('__PHIL_Q__');
  });

  it('should flush buffered content', () => {
    const renderer = createStreamingRenderer();

    renderer.write('chunk');
    const flushed = renderer.flush();

    expect(typeof flushed).toBe('string');
  });
});

describe('Client-Side Resume', () => {
  beforeEach(() => {
    // Mock DOM
    if (typeof document !== 'undefined') {
      document.body.innerHTML = '';
    }
  });

  it('should resume application', () => {
    expect(() => resume()).not.toThrow();
  });

  it('should resume with config', () => {
    expect(() => resume({ basePath: '/dist' })).not.toThrow();
  });

  it('should dispatch resumed event', async () => {
    if (typeof window !== 'undefined') {
      const eventPromise = new Promise<void>((resolve) => {
        window.addEventListener('phil:resumed', () => resolve(), { once: true });
      });

      resume();
      await eventPromise;
    }
  });
});

describe('Context Management', () => {
  it('should get resumable context', () => {
    const ctx = getResumableContext();

    // Will be null outside of resumable context
    expect(ctx).toBeNull();
  });

  it('should run with resumable context', () => {
    const serialization = createSerializationContext();
    const ctx: ResumableContext = {
      serialization,
      componentStack: [],
      signals: new Map(),
      isServer: true,
      isHydrating: false,
    };

    withResumableContext(ctx, () => {
      const current = getResumableContext();
      expect(current).toBe(ctx);
    });
  });

  it('should restore previous context', () => {
    const ctx1: ResumableContext = {
      serialization: createSerializationContext(),
      componentStack: [],
      signals: new Map(),
      isServer: true,
      isHydrating: false,
    };

    const ctx2: ResumableContext = {
      serialization: createSerializationContext(),
      componentStack: [],
      signals: new Map(),
      isServer: true,
      isHydrating: false,
    };

    withResumableContext(ctx1, () => {
      expect(getResumableContext()).toBe(ctx1);

      withResumableContext(ctx2, () => {
        expect(getResumableContext()).toBe(ctx2);
      });

      expect(getResumableContext()).toBe(ctx1);
    });
  });

  it('should get current component ID', () => {
    const ctx: ResumableContext = {
      serialization: createSerializationContext(),
      componentStack: ['c1', 'c2'],
      signals: new Map(),
      isServer: true,
      isHydrating: false,
    };

    withResumableContext(ctx, () => {
      const id = getCurrentComponentId();
      expect(id).toBe('c2');
    });
  });

  it('should return undefined if no components', () => {
    const id = getCurrentComponentId();
    expect(id).toBeUndefined();
  });
});

describe('Environment Checks', () => {
  it('should detect server environment', () => {
    const server = isServer();
    expect(typeof server).toBe('boolean');
  });

  it('should detect resumable context', () => {
    expect(isResumable()).toBe(false);

    const ctx: ResumableContext = {
      serialization: createSerializationContext(),
      componentStack: [],
      signals: new Map(),
      isServer: true,
      isHydrating: false,
    };

    withResumableContext(ctx, () => {
      expect(isResumable()).toBe(true);
    });
  });
});

describe('Component Modifiers', () => {
  it('should create static component', () => {
    const Component = static$((props: { text: string }) => props.text);

    const result = Component({ text: 'static content' });

    expect(result).toBeTruthy();
    expect(typeof result).toBe('object');
  });

  it('should create client-only component', () => {
    const Component = client$((props: { text: string }) => props.text);

    // On server, should return fallback
    const result = Component({ text: 'client content' });

    expect(result).toBeTruthy();
  });

  it('should create client component with fallback', () => {
    const Component = client$(
      (props: { text: string }) => props.text,
      'Loading...'
    );

    const result = Component({ text: 'content' });

    expect(result).toBeTruthy();
  });

  it('should create server-only component', () => {
    const Component = server$component((props: { data: string }) => props.data);

    const result = Component({ data: 'server data' });

    // Behavior depends on environment
    expect(result !== undefined || result === null).toBe(true);
  });
});

describe('Signal Hydration', () => {
  beforeEach(() => {
    if (typeof document !== 'undefined') {
      document.body.innerHTML = '';
    }
  });

  it('should restore signal from hydrated state', () => {
    if (typeof document !== 'undefined') {
      // Create state element
      const stateEl = document.createElement('script');
      stateEl.id = '__PHIL_STATE__';
      stateEl.type = 'application/json';
      stateEl.textContent = JSON.stringify({
        signals: {
          s0: {
            id: 's0',
            value: { type: 'primitive', data: 100 },
            subscribers: [],
          },
        },
      });
      document.body.appendChild(stateEl);

      // Signal should restore value
      const signal = useSignal(0);

      // In actual implementation, would restore from state
      expect(signal).toBeTruthy();
    }
  });
});

describe('HTML Rendering', () => {
  it('should render simple text', async () => {
    const html = await renderToResumableString('Hello');

    expect(html).toContain('Hello');
  });

  it('should render number', async () => {
    const html = await renderToResumableString(42);

    expect(html).toContain('42');
  });

  it('should skip null and undefined', async () => {
    const html1 = await renderToResumableString(null);
    const html2 = await renderToResumableString(undefined);

    expect(html1).not.toContain('null');
    expect(html2).not.toContain('undefined');
  });

  it('should render array', async () => {
    const html = await renderToResumableString(['a', 'b', 'c']);

    expect(html).toContain('a');
    expect(html).toContain('b');
    expect(html).toContain('c');
  });

  it('should escape HTML', async () => {
    const html = await renderToResumableString('<script>alert("xss")</script>');

    // The script tags should be escaped so they don't execute
    // The opening <script> becomes &lt;script&gt;
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;/script&gt;');
    // Make sure the malicious script tag is not present as executable
    expect(html).not.toContain('<script>alert');
  });

  it('should render JSX-like elements', async () => {
    const vnode = {
      type: 'div',
      props: {
        className: 'container',
        children: 'content',
      },
    };

    const html = await renderToResumableString(vnode);

    expect(html).toContain('<div');
    expect(html).toContain('class="container"');
    expect(html).toContain('content');
    expect(html).toContain('</div>');
  });

  it('should render nested elements', async () => {
    const vnode = {
      type: 'div',
      props: {
        children: {
          type: 'span',
          props: {
            children: 'nested',
          },
        },
      },
    };

    const html = await renderToResumableString(vnode);

    expect(html).toContain('<div');
    expect(html).toContain('<span');
    expect(html).toContain('nested');
  });

  it('should render void elements', async () => {
    const vnode = {
      type: 'input',
      props: {
        type: 'text',
        value: 'test',
      },
    };

    const html = await renderToResumableString(vnode);

    expect(html).toContain('<input');
    expect(html).toContain('/>');
    expect(html).not.toContain('</input>');
  });

  it('should handle className attribute', async () => {
    const vnode = {
      type: 'div',
      props: {
        className: 'my-class',
        children: '',
      },
    };

    const html = await renderToResumableString(vnode);

    expect(html).toContain('class="my-class"');
  });

  it('should handle style object', async () => {
    const vnode = {
      type: 'div',
      props: {
        style: { color: 'red', fontSize: '16px' },
        children: '',
      },
    };

    const html = await renderToResumableString(vnode);

    expect(html).toContain('style=');
    expect(html).toContain('color:red');
    expect(html).toContain('font-size:16px');
  });

  it('should handle boolean attributes', async () => {
    const vnode = {
      type: 'input',
      props: {
        type: 'checkbox',
        checked: true,
        disabled: false,
      },
    };

    const html = await renderToResumableString(vnode);

    expect(html).toContain('checked');
    expect(html).not.toContain('disabled');
  });

  it('should skip function props', async () => {
    const vnode = {
      type: 'button',
      props: {
        onClick: () => {},
        children: 'Click',
      },
    };

    const html = await renderToResumableString(vnode);

    expect(html).not.toContain('onClick');
  });
});

describe('Resumable Signal Rendering', () => {
  it('should render signal value', async () => {
    const ctx: ResumableContext = {
      serialization: createSerializationContext(),
      componentStack: [],
      signals: new Map(),
      isServer: true,
      isHydrating: false,
    };

    await withResumableContext(ctx, async () => {
      const signal = useSignal(42);
      const html = await renderToResumableString(signal);

      expect(html).toContain('42');
      expect(html).toContain('data-qsignal');
    });
  });
});

describe('Event Handler Registration', () => {
  it('should register event handlers', async () => {
    const ctx: ResumableContext = {
      serialization: createSerializationContext(),
      componentStack: [],
      signals: new Map(),
      isServer: true,
      isHydrating: false,
    };

    await withResumableContext(ctx, async () => {
      const handleClick = handler$(() => {});

      const vnode = {
        type: 'button',
        props: {
          'onClick$': handleClick,
          children: 'Click me',
        },
      };

      const html = await renderToResumableString(vnode);

      expect(html).toContain('data-qid');
      expect(html).toContain('data-qevents');
    });
  });
});

describe('Resumable Component Rendering', () => {
  it('should render resumable component', async () => {
    const ctx: ResumableContext = {
      serialization: createSerializationContext(),
      componentStack: [],
      signals: new Map(),
      isServer: true,
      isHydrating: false,
    };

    await withResumableContext(ctx, async () => {
      const Component = resumable$(() => 'Component content');

      const html = await renderToResumableString(Component({}));

      expect(html).toContain('Component content');
    });
  });

  it('should register component boundary', async () => {
    const ctx: ResumableContext = {
      serialization: createSerializationContext(),
      componentStack: [],
      signals: new Map(),
      isServer: true,
      isHydrating: false,
    };

    await withResumableContext(ctx, async () => {
      const Component = resumable$((props: { name: string }) => props.name);

      await renderToResumableString(Component({ name: 'Test' }));

      expect(ctx.serialization.components.size).toBeGreaterThan(0);
    });
  });
});
