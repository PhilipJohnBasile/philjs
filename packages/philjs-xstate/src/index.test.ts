import { describe, it, expect, vi } from 'vitest';
import { createMachine, useMachine, visualize, toMermaid, assign, guard } from './index';

describe('philjs-xstate', () => {
  describe('createMachine', () => {
    it('should create a machine with initial state', () => {
      const machine = createMachine({
        initial: 'idle',
        states: {
          idle: {},
          loading: {},
        },
      });

      const initialState = machine.getInitialState();
      expect(initialState.value).toBe('idle');
      expect(initialState.done).toBe(false);
    });

    it('should transition between states', () => {
      const machine = createMachine({
        initial: 'idle',
        states: {
          idle: {
            on: { FETCH: 'loading' },
          },
          loading: {
            on: { SUCCESS: 'success', ERROR: 'error' },
          },
          success: {},
          error: {},
        },
      });

      const initialState = machine.getInitialState();
      expect(initialState.value).toBe('idle');

      const loadingState = machine.transition(initialState, { type: 'FETCH' });
      expect(loadingState.value).toBe('loading');
      expect(loadingState.changed).toBe(true);

      const successState = machine.transition(loadingState, { type: 'SUCCESS' });
      expect(successState.value).toBe('success');
    });

    it('should support guards', () => {
      const machine = createMachine({
        initial: 'idle',
        context: { count: 0 },
        states: {
          idle: {
            on: {
              INCREMENT: {
                target: 'idle',
                cond: (ctx) => ctx.count < 5,
                actions: assign((ctx) => ({ count: ctx.count + 1 })),
              },
            },
          },
        },
      });

      let state = machine.getInitialState();

      // Should increment when count < 5
      state = machine.transition(state, { type: 'INCREMENT' });
      expect(state.context.count).toBe(1);

      // Continue incrementing
      for (let i = 0; i < 4; i++) {
        state = machine.transition(state, { type: 'INCREMENT' });
      }
      expect(state.context.count).toBe(5);

      // Should not increment when count >= 5
      const prevCount = state.context.count;
      state = machine.transition(state, { type: 'INCREMENT' });
      expect(state.context.count).toBe(prevCount);
    });

    it('should execute entry actions', () => {
      const entrySpy = vi.fn();

      const machine = createMachine({
        initial: 'idle',
        states: {
          idle: {
            on: { START: 'active' },
          },
          active: {
            entry: entrySpy,
          },
        },
      });

      const state = machine.getInitialState();
      machine.transition(state, { type: 'START' });

      expect(entrySpy).toHaveBeenCalled();
    });

    it('should execute exit actions', () => {
      const exitSpy = vi.fn();

      const machine = createMachine({
        initial: 'idle',
        states: {
          idle: {
            on: { START: 'active' },
            exit: exitSpy,
          },
          active: {},
        },
      });

      const state = machine.getInitialState();
      machine.transition(state, { type: 'START' });

      expect(exitSpy).toHaveBeenCalled();
    });

    it('should update context with actions', () => {
      const machine = createMachine({
        initial: 'idle',
        context: { count: 0 },
        states: {
          idle: {
            on: {
              INCREMENT: {
                actions: assign((ctx) => ({ count: ctx.count + 1 })),
              },
            },
          },
        },
      });

      let state = machine.getInitialState();
      expect(state.context.count).toBe(0);

      state = machine.transition(state, { type: 'INCREMENT' });
      expect(state.context.count).toBe(1);

      state = machine.transition(state, { type: 'INCREMENT' });
      expect(state.context.count).toBe(2);
    });

    it('should mark final states as done', () => {
      const machine = createMachine({
        initial: 'active',
        states: {
          active: {
            on: { FINISH: 'done' },
          },
          done: {
            type: 'final',
          },
        },
      });

      const initialState = machine.getInitialState();
      expect(initialState.done).toBe(false);

      const finalState = machine.transition(initialState, { type: 'FINISH' });
      expect(finalState.done).toBe(true);
      expect(finalState.value).toBe('done');
    });
  });

  describe('useMachine', () => {
    it('should create a signal-based actor', () => {
      const machine = createMachine({
        initial: 'idle',
        states: {
          idle: {
            on: { START: 'active' },
          },
          active: {
            on: { STOP: 'idle' },
          },
        },
      });

      const [state, send] = useMachine(machine);

      expect(state().value).toBe('idle');

      send('START');
      expect(state().value).toBe('active');

      send('STOP');
      expect(state().value).toBe('idle');
    });

    it('should support event objects', () => {
      const machine = createMachine({
        initial: 'idle',
        context: { message: '' },
        states: {
          idle: {
            on: {
              SET_MESSAGE: {
                actions: assign((ctx, evt: any) => ({ message: evt.data })),
              },
            },
          },
        },
      });

      const [state, send] = useMachine(machine);

      send({ type: 'SET_MESSAGE', data: 'Hello' });
      expect(state().context.message).toBe('Hello');
    });
  });

  describe('createActor', () => {
    it('should notify subscribers on state changes', () => {
      const machine = createMachine({
        initial: 'idle',
        states: {
          idle: {
            on: { START: 'active' },
          },
          active: {},
        },
      });

      const actor = machine.createActor();
      const listener = vi.fn();

      actor.subscribe(listener);
      actor.send('START');

      expect(listener).toHaveBeenCalled();
      expect(actor.getSnapshot().value).toBe('active');
    });

    it('should support unsubscribe', () => {
      const machine = createMachine({
        initial: 'idle',
        states: {
          idle: {
            on: { START: 'active' },
          },
          active: {},
        },
      });

      const actor = machine.createActor();
      const listener = vi.fn();

      const unsubscribe = actor.subscribe(listener);
      actor.send('START');
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      actor.send('idle'); // Won't trigger
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should stop actor and clean up', () => {
      const machine = createMachine({
        initial: 'idle',
        states: {
          idle: {},
        },
      });

      const actor = machine.createActor();
      const listener = vi.fn();

      actor.subscribe(listener);
      actor.stop();

      // Should not crash
      actor.send('ANYTHING');
    });
  });

  describe('visualization', () => {
    it('should generate visualization graph', () => {
      const machine = createMachine({
        initial: 'idle',
        states: {
          idle: {
            on: { START: 'active' },
          },
          active: {
            on: { STOP: 'idle' },
          },
        },
      });

      const graph = visualize(machine);

      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges).toHaveLength(2);

      const idleNode = graph.nodes.find((n) => n.id === 'idle');
      expect(idleNode).toBeDefined();
      expect(idleNode!.transitions).toHaveLength(1);
    });

    it('should generate Mermaid diagram', () => {
      const machine = createMachine({
        initial: 'idle',
        states: {
          idle: {
            on: { START: 'active' },
          },
          active: {
            on: { STOP: 'idle' },
            type: 'final',
          },
        },
      });

      const diagram = toMermaid(machine);

      expect(diagram).toContain('stateDiagram-v2');
      expect(diagram).toContain('[*] --> idle');
      expect(diagram).toContain('idle --> active: START');
      expect(diagram).toContain('active --> [*]');
    });
  });

  describe('utilities', () => {
    it('should create assign action', () => {
      const action = assign<{ count: number }>((ctx) => ({ count: ctx.count + 1 }));

      const result = action({ count: 5 }, { type: 'INCREMENT' });
      expect(result).toEqual({ count: 6 });
    });

    it('should create guard function', () => {
      const guardFn = guard<{ age: number }>((ctx) => ctx.age >= 18);

      expect(guardFn({ age: 20 }, { type: 'CHECK' })).toBe(true);
      expect(guardFn({ age: 15 }, { type: 'CHECK' })).toBe(false);
    });
  });
});
