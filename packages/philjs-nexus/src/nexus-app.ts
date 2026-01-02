/**
 * @philjs/nexus - NexusApp
 *
 * The unified entry point for local-first, AI-native, collaborative applications
 */

import type {
  NexusConfig,
  NexusDocument,
  NexusCollection,
  SyncStatus,
  PresenceState,
  CursorPosition,
  AIGenerateOptions,
  AIGenerateResult,
  NexusEvent,
  NexusEventListener,
} from './types.js';
import { SyncEngine, createSyncEngine } from './sync/index.js';

// ============================================================================
// NexusApp Class
// ============================================================================

/**
 * NexusApp - The unified Nexus application container
 *
 * @example
 * ```typescript
 * const app = createNexusApp({
 *   local: { adapter: 'indexeddb' },
 *   remote: { adapter: 'supabase', url: 'https://...' },
 *   ai: { provider: 'anthropic', apiKey: '...' },
 *   collab: { presence: true, cursors: true },
 * });
 *
 * await app.connect();
 *
 * // Use documents
 * const doc = app.useDocument('my-doc');
 * doc.set({ title: 'Hello', content: 'World' });
 *
 * // Use AI
 * const result = await app.generate('Summarize this document');
 *
 * // Use collaboration
 * const users = app.getPresence();
 * ```
 */
export class NexusApp {
  private config: NexusConfig;
  private syncEngine: SyncEngine;
  private connected: boolean = false;
  private listeners: Set<NexusEventListener> = new Set();

  // Collaboration state
  private presence: Map<string, PresenceState> = new Map();
  private collabWs: WebSocket | null = null;
  private localUser: PresenceState | null = null;

  // AI state
  private aiCache: Map<string, { result: AIGenerateResult; timestamp: number }> = new Map();
  private tokenUsage: { total: number; cost: number } = { total: 0, cost: 0 };

  constructor(config: NexusConfig) {
    this.config = config;

    // Initialize sync engine
    this.syncEngine = createSyncEngine({
      local: config.local,
      remote: config.remote,
    });

    // Set up sync event forwarding
    this.syncEngine.subscribe((event) => {
      this.emit(event);
    });

    // Initialize local user for collaboration
    if (config.collab?.user) {
      this.localUser = {
        ...config.collab.user,
        color: config.collab.user.color || this.generateColor(),
        lastActive: Date.now(),
        online: true,
      };
    }
  }

  // ============================================================================
  // Connection Management
  // ============================================================================

  /**
   * Connect to all configured services
   */
  async connect(): Promise<void> {
    // Initialize sync engine
    await this.syncEngine.init();

    // Connect to collaboration if configured
    if (this.config.collab?.websocketUrl) {
      await this.connectCollab();
    }

    this.connected = true;
    this.emit({ type: 'connected' });
  }

  /**
   * Disconnect from all services
   */
  async disconnect(): Promise<void> {
    // Disconnect collaboration
    if (this.collabWs) {
      this.collabWs.close();
      this.collabWs = null;
    }

    // Close sync engine
    await this.syncEngine.close();

    this.connected = false;
    this.emit({ type: 'disconnected' });
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  // ============================================================================
  // Document API
  // ============================================================================

  /**
   * Get or create a document
   */
  useDocument<T = unknown>(id: string): NexusDocument<T> {
    const self = this;
    const subscribers = new Set<(value: T) => void>();
    let cachedValue: T | undefined;

    return {
      get id() {
        return id;
      },

      get lastModified() {
        return Date.now(); // TODO: Track actual modification time
      },

      get(): T {
        // Return cached value synchronously if available
        if (cachedValue !== undefined) {
          return cachedValue;
        }
        // For synchronous access, we need to have loaded the value
        throw new Error('Document not loaded. Call get() after await.');
      },

      async set(value: T): Promise<void> {
        await self.syncEngine.set('documents', id, value);
        cachedValue = value;
        for (const subscriber of subscribers) {
          subscriber(value);
        }
        self.emit({ type: 'document-change', documentId: id });
      },

      async update(path: string, value: unknown): Promise<void> {
        const current = await self.syncEngine.get<T>('documents', id);
        if (!current) return;

        const updated = self.setPath(current, path, value);
        await this.set(updated as T);
      },

      subscribe(listener: (value: T) => void): () => void {
        subscribers.add(listener);

        // Load initial value
        self.syncEngine.get<T>('documents', id).then((value) => {
          if (value !== undefined) {
            cachedValue = value;
            listener(value);
          }
        });

        return () => subscribers.delete(listener);
      },
    };
  }

  /**
   * Get or create a collection
   */
  useCollection<T extends { id?: string } = { id?: string }>(name: string): NexusCollection<T> {
    const self = this;
    const subscribers = new Set<(docs: T[]) => void>();

    return {
      get size(): number {
        // Synchronous size requires cached data
        return 0;
      },

      async getAll(): Promise<T[]> {
        return self.syncEngine.getAll<T>(`collections/${name}`);
      },

      async get(id: string): Promise<T | undefined> {
        return self.syncEngine.get<T>(`collections/${name}`, id);
      },

      async add(doc: T): Promise<string> {
        const id = doc.id || self.generateId();
        const docWithId = { ...doc, id } as T;
        await self.syncEngine.set(`collections/${name}`, id, docWithId);
        self.notifyCollectionSubscribers(name, subscribers);
        return id;
      },

      async update(id: string, updates: Partial<T>): Promise<void> {
        const existing = await self.syncEngine.get<T>(`collections/${name}`, id);
        if (!existing) return;

        const updated = { ...existing, ...updates } as T;
        await self.syncEngine.set(`collections/${name}`, id, updated);
        self.notifyCollectionSubscribers(name, subscribers);
      },

      async delete(id: string): Promise<void> {
        await self.syncEngine.delete(`collections/${name}`, id);
        self.notifyCollectionSubscribers(name, subscribers);
      },

      async query(filter: (doc: T) => boolean): Promise<T[]> {
        const all = await this.getAll();
        return all.filter(filter);
      },

      subscribe(listener: (docs: T[]) => void): () => void {
        subscribers.add(listener);

        // Load initial data
        this.getAll().then(listener);

        return () => subscribers.delete(listener);
      },
    };
  }

  // ============================================================================
  // AI API
  // ============================================================================

  /**
   * Generate content using AI
   */
  async generate(prompt: string, options?: AIGenerateOptions): Promise<AIGenerateResult> {
    if (!this.config.ai) {
      throw new Error('AI not configured. Add ai config to createNexusApp()');
    }

    // Check cache
    if (this.config.ai.cache) {
      const cacheKey = this.getCacheKey(prompt, options);
      const cached = this.aiCache.get(cacheKey);
      const ttl = this.config.ai.cacheTTL || 300000; // 5 minutes default

      if (cached && Date.now() - cached.timestamp < ttl) {
        return { ...cached.result, cached: true };
      }
    }

    this.emit({ type: 'ai-request', prompt });

    try {
      const result = await this.callAI(prompt, options);

      // Update usage tracking
      this.tokenUsage.total += result.usage.totalTokens;
      this.tokenUsage.cost += result.cost;

      // Check budget
      if (this.config.ai.dailyBudget && this.tokenUsage.cost > this.config.ai.dailyBudget) {
        throw new Error(`Daily AI budget exceeded: $${this.tokenUsage.cost.toFixed(2)} / $${this.config.ai.dailyBudget}`);
      }

      // Cache result
      if (this.config.ai.cache) {
        const cacheKey = this.getCacheKey(prompt, options);
        this.aiCache.set(cacheKey, { result, timestamp: Date.now() });
      }

      this.emit({ type: 'ai-response', tokens: result.usage.totalTokens, cost: result.cost });

      return result;
    } catch (error) {
      this.emit({ type: 'ai-error', error: error as Error });
      throw error;
    }
  }

  /**
   * Stream AI response
   */
  async *generateStream(
    prompt: string,
    options?: AIGenerateOptions
  ): AsyncGenerator<string, AIGenerateResult> {
    if (!this.config.ai) {
      throw new Error('AI not configured');
    }

    const response = await this.callAIStream(prompt, options);
    let accumulated = '';
    let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    for await (const chunk of response) {
      accumulated += chunk;
      yield chunk;
    }

    // Estimate tokens (rough approximation)
    usage.completionTokens = Math.ceil(accumulated.length / 4);
    usage.promptTokens = Math.ceil(prompt.length / 4);
    usage.totalTokens = usage.promptTokens + usage.completionTokens;

    const cost = this.estimateCost(usage.totalTokens);

    return {
      content: accumulated,
      usage,
      cost,
      cached: false,
      model: this.config.ai.model || 'default',
    };
  }

  /**
   * Get AI usage statistics
   */
  getAIUsage(): { totalTokens: number; totalCost: number } {
    return {
      totalTokens: this.tokenUsage.total,
      totalCost: this.tokenUsage.cost,
    };
  }

  // ============================================================================
  // Collaboration API
  // ============================================================================

  /**
   * Get all online users
   */
  getPresence(): PresenceState[] {
    return Array.from(this.presence.values());
  }

  /**
   * Update local cursor position
   */
  updateCursor(position: CursorPosition): void {
    if (!this.localUser || !this.collabWs) return;

    this.localUser.cursor = position;
    this.localUser.lastActive = Date.now();

    this.collabWs.send(JSON.stringify({
      type: 'cursor',
      userId: this.localUser.id,
      position,
    }));

    this.emit({ type: 'cursor-update', userId: this.localUser.id, position });
  }

  /**
   * Set typing indicator
   */
  setTyping(typing: boolean): void {
    if (!this.localUser || !this.collabWs) return;

    this.localUser.typing = typing;

    this.collabWs.send(JSON.stringify({
      type: 'typing',
      userId: this.localUser.id,
      typing,
    }));
  }

  // ============================================================================
  // Sync API
  // ============================================================================

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    return this.syncEngine.getStatus();
  }

  /**
   * Manually trigger a sync
   */
  async sync(): Promise<void> {
    await this.syncEngine.sync();
  }

  // ============================================================================
  // Event API
  // ============================================================================

  /**
   * Subscribe to Nexus events
   */
  subscribe(listener: NexusEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async connectCollab(): Promise<void> {
    if (!this.config.collab?.websocketUrl) return;

    return new Promise((resolve, reject) => {
      this.collabWs = new WebSocket(this.config.collab!.websocketUrl!);

      this.collabWs.onopen = () => {
        // Send join message
        if (this.localUser) {
          this.collabWs!.send(JSON.stringify({
            type: 'join',
            user: this.localUser,
          }));
        }
        resolve();
      };

      this.collabWs.onerror = () => {
        reject(new Error('Collaboration connection failed'));
      };

      this.collabWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleCollabMessage(data);
        } catch {
          // Ignore parse errors
        }
      };

      this.collabWs.onclose = () => {
        this.presence.clear();
      };
    });
  }

  private handleCollabMessage(data: unknown): void {
    const msg = data as { type: string; user?: PresenceState; userId?: string; position?: CursorPosition; users?: PresenceState[] };

    switch (msg.type) {
      case 'presence':
        if (msg.users) {
          this.presence.clear();
          for (const user of msg.users) {
            this.presence.set(user.id, user);
          }
          this.emit({ type: 'presence-update', users: this.getPresence() });
        }
        break;

      case 'join':
        if (msg.user) {
          this.presence.set(msg.user.id, msg.user);
          this.emit({ type: 'presence-update', users: this.getPresence() });
        }
        break;

      case 'leave':
        if (msg.userId) {
          this.presence.delete(msg.userId);
          this.emit({ type: 'presence-update', users: this.getPresence() });
        }
        break;

      case 'cursor':
        if (msg.userId && msg.position) {
          const user = this.presence.get(msg.userId);
          if (user) {
            user.cursor = msg.position;
            this.emit({ type: 'cursor-update', userId: msg.userId, position: msg.position });
          }
        }
        break;
    }
  }

  private async callAI(prompt: string, options?: AIGenerateOptions): Promise<AIGenerateResult> {
    const { provider, apiKey, model, maxTokens } = this.config.ai!;

    let response: Response;
    let result: unknown;

    switch (provider) {
      case 'anthropic':
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey!,
            'anthropic-version': '2024-01-01',
          },
          body: JSON.stringify({
            model: model || 'claude-3-5-sonnet-20241022',
            max_tokens: maxTokens || options?.maxTokens || 4096,
            system: options?.systemPrompt,
            messages: [{ role: 'user', content: prompt }],
            ...(options?.temperature && { temperature: options.temperature }),
          }),
        });
        result = await response.json();
        return this.parseAnthropicResponse(result);

      case 'openai':
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model || 'gpt-4-turbo-preview',
            max_tokens: maxTokens || options?.maxTokens || 4096,
            messages: [
              ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
              { role: 'user', content: prompt },
            ],
            ...(options?.temperature && { temperature: options.temperature }),
          }),
        });
        result = await response.json();
        return this.parseOpenAIResponse(result);

      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  private async *callAIStream(
    prompt: string,
    options?: AIGenerateOptions
  ): AsyncGenerator<string> {
    const { provider, apiKey, model, maxTokens } = this.config.ai!;

    let response: Response;

    switch (provider) {
      case 'anthropic':
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey!,
            'anthropic-version': '2024-01-01',
          },
          body: JSON.stringify({
            model: model || 'claude-3-5-sonnet-20241022',
            max_tokens: maxTokens || options?.maxTokens || 4096,
            stream: true,
            messages: [{ role: 'user', content: prompt }],
          }),
        });
        break;

      case 'openai':
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model || 'gpt-4-turbo-preview',
            max_tokens: maxTokens || 4096,
            stream: true,
            messages: [{ role: 'user', content: prompt }],
          }),
        });
        break;

      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter((line) => line.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = provider === 'anthropic'
            ? parsed.delta?.text
            : parsed.choices?.[0]?.delta?.content;

          if (content) {
            yield content;
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
  }

  private parseAnthropicResponse(result: unknown): AIGenerateResult {
    const r = result as {
      content: Array<{ text: string }>;
      usage: { input_tokens: number; output_tokens: number };
      model: string;
    };

    const usage = {
      promptTokens: r.usage.input_tokens,
      completionTokens: r.usage.output_tokens,
      totalTokens: r.usage.input_tokens + r.usage.output_tokens,
    };

    return {
      content: r.content[0]?.text || '',
      usage,
      cost: this.estimateCost(usage.totalTokens, 'anthropic'),
      cached: false,
      model: r.model,
    };
  }

  private parseOpenAIResponse(result: unknown): AIGenerateResult {
    const r = result as {
      choices: Array<{ message: { content: string } }>;
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      model: string;
    };

    const usage = {
      promptTokens: r.usage.prompt_tokens,
      completionTokens: r.usage.completion_tokens,
      totalTokens: r.usage.total_tokens,
    };

    return {
      content: r.choices[0]?.message?.content || '',
      usage,
      cost: this.estimateCost(usage.totalTokens, 'openai'),
      cached: false,
      model: r.model,
    };
  }

  private estimateCost(tokens: number, provider?: string): number {
    // Rough cost estimates per 1M tokens
    const costs: Record<string, number> = {
      anthropic: 15, // Claude 3.5 Sonnet average
      openai: 10, // GPT-4 Turbo average
      default: 10,
    };

    const costPer1M = costs[provider || 'default'];
    return (tokens / 1_000_000) * costPer1M;
  }

  private getCacheKey(prompt: string, options?: AIGenerateOptions): string {
    return JSON.stringify({ prompt, options });
  }

  private setPath(obj: unknown, path: string, value: unknown): unknown {
    const parts = path.split('.');
    const result = JSON.parse(JSON.stringify(obj));
    let current: Record<string, unknown> = result;

    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current)) {
        current[parts[i]] = {};
      }
      current = current[parts[i]] as Record<string, unknown>;
    }

    current[parts[parts.length - 1]] = value;
    return result;
  }

  private async notifyCollectionSubscribers<T>(
    name: string,
    subscribers: Set<(docs: T[]) => void>
  ): Promise<void> {
    const docs = await this.syncEngine.getAll<T>(`collections/${name}`);
    for (const subscriber of subscribers) {
      subscriber(docs);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private emit(event: NexusEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

/**
 * Create a new Nexus application
 */
export function createNexusApp(config: NexusConfig): NexusApp {
  return new NexusApp(config);
}
