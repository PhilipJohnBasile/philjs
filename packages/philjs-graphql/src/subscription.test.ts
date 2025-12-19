/**
 * GraphQL Subscription Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSubscriptionClient, useSubscription } from './subscription';
import { gql } from './index';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  sent: string[] = [];

  constructor(public url: string, public protocol?: string) {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { wasClean: true }));
    }
  }

  simulateMessage(data: any): void {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  simulateError(): void {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

describe('SubscriptionClient', () => {
  let originalWebSocket: any;

  beforeEach(() => {
    originalWebSocket = global.WebSocket;
    (global as any).WebSocket = MockWebSocket;
  });

  afterEach(() => {
    global.WebSocket = originalWebSocket;
  });

  it('should create a subscription client', () => {
    const client = createSubscriptionClient({
      url: 'wss://api.example.com/graphql',
    });

    expect(client).toBeDefined();
    expect(client.getConnectionState()()).toBe('connecting');
  });

  it('should connect lazily when lazy option is enabled', () => {
    const client = createSubscriptionClient({
      url: 'wss://api.example.com/graphql',
      lazy: true,
    });

    expect(client.getConnectionState()()).toBe('disconnected');
  });

  it('should subscribe to a GraphQL subscription', async () => {
    const client = createSubscriptionClient({
      url: 'wss://api.example.com/graphql',
    });

    const subscription = gql`
      subscription OnMessage {
        newMessage {
          id
          text
        }
      }
    `;

    const onData = vi.fn();
    const handle = client.subscribe({
      query: subscription,
      onData,
    });

    expect(handle).toBeDefined();
    expect(handle.state().active).toBe(false);

    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 50));

    handle.unsubscribe();
    client.close();
  });

  it('should handle subscription data', async () => {
    const client = createSubscriptionClient({
      url: 'wss://api.example.com/graphql',
    });

    const subscription = gql`
      subscription OnMessage {
        newMessage {
          id
          text
        }
      }
    `;

    const onData = vi.fn();
    const handle = client.subscribe({
      query: subscription,
      onData,
    });

    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 50));

    // Simulate connection ack
    const ws = (client as any).ws as MockWebSocket;
    ws.simulateMessage({
      type: 'connection_ack',
    });

    // Simulate subscription data
    ws.simulateMessage({
      type: 'next',
      id: (handle as any).id,
      payload: {
        data: {
          newMessage: {
            id: '1',
            text: 'Hello',
          },
        },
      },
    });

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(onData).toHaveBeenCalledWith({
      newMessage: {
        id: '1',
        text: 'Hello',
      },
    });

    handle.unsubscribe();
    client.close();
  });

  it('should handle subscription errors', async () => {
    const client = createSubscriptionClient({
      url: 'wss://api.example.com/graphql',
    });

    const subscription = gql`
      subscription OnMessage {
        newMessage {
          id
          text
        }
      }
    `;

    const onError = vi.fn();
    const handle = client.subscribe({
      query: subscription,
      onError,
    });

    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 50));

    // Simulate error
    const ws = (client as any).ws as MockWebSocket;
    ws.simulateMessage({
      type: 'error',
      id: (handle as any).id,
      payload: {
        message: 'Subscription error',
      },
    });

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(onError).toHaveBeenCalled();

    handle.unsubscribe();
    client.close();
  });

  it('should handle subscription completion', async () => {
    const client = createSubscriptionClient({
      url: 'wss://api.example.com/graphql',
    });

    const subscription = gql`
      subscription OnMessage {
        newMessage {
          id
          text
        }
      }
    `;

    const onComplete = vi.fn();
    const handle = client.subscribe({
      query: subscription,
      onComplete,
    });

    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 50));

    // Simulate completion
    const ws = (client as any).ws as MockWebSocket;
    ws.simulateMessage({
      type: 'complete',
      id: (handle as any).id,
    });

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(onComplete).toHaveBeenCalled();

    client.close();
  });

  it('should unsubscribe correctly', async () => {
    const client = createSubscriptionClient({
      url: 'wss://api.example.com/graphql',
    });

    const subscription = gql`
      subscription OnMessage {
        newMessage {
          id
          text
        }
      }
    `;

    const handle = client.subscribe({
      query: subscription,
    });

    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(handle.state().active).toBe(false);

    handle.unsubscribe();

    expect((client as any).subscriptions.size).toBe(0);

    client.close();
  });
});

describe('useSubscription', () => {
  let originalWebSocket: any;

  beforeEach(() => {
    originalWebSocket = global.WebSocket;
    (global as any).WebSocket = MockWebSocket;
  });

  afterEach(() => {
    global.WebSocket = originalWebSocket;
  });

  it('should create a subscription with reactive state', async () => {
    const client = createSubscriptionClient({
      url: 'wss://api.example.com/graphql',
    });

    const subscription = gql`
      subscription OnMessage {
        newMessage {
          id
          text
        }
      }
    `;

    const result = useSubscription(client, {
      query: subscription,
    });

    // data, error, active, and connectionState are signals that return functions
    expect(typeof result.data).toBe('function');
    expect(result.data()).toBeNull();
    expect(typeof result.error).toBe('function');
    expect(result.error()).toBeNull();
    expect(typeof result.active).toBe('function');
    expect(result.active()).toBe(false);

    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 50));

    result.unsubscribe();
    client.close();
  });
});
