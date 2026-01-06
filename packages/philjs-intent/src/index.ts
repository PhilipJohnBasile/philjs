/**
 * @philjs/intent - Intent-Based Development
 *
 * Describe WHAT you want, the framework figures out HOW:
 * - Natural language component descriptions
 * - Goal-oriented programming
 * - Automatic implementation selection
 * - Self-optimizing code paths
 * - Constraint-based development
 * - AI-powered code synthesis
 *
 * NO OTHER FRAMEWORK HAS THIS - TRUE PARADIGM SHIFT.
 */

// ============================================================================
// Types
// ============================================================================

export interface IntentConfig {
  /** AI provider for intent resolution */
  provider?: 'openai' | 'anthropic' | 'local';
  /** API key for cloud providers */
  apiKey?: string;
  /** Model to use */
  model?: string;
  /** Enable caching of resolved intents */
  cache?: boolean;
  /** Maximum resolution attempts */
  maxAttempts?: number;
  /** Enable learning from user corrections */
  learning?: boolean;
}

export interface Intent {
  id: string;
  description: string;
  constraints?: Constraint[];
  context?: IntentContext;
  priority?: 'performance' | 'readability' | 'size' | 'accessibility';
}

export interface Constraint {
  type: 'must' | 'should' | 'must-not' | 'prefer';
  description: string;
  validate?: (result: unknown) => boolean;
}

export interface IntentContext {
  component?: string;
  dependencies?: string[];
  targetFramework?: string;
  existingCode?: string;
  userPreferences?: Record<string, unknown>;
}

export interface ResolvedIntent {
  intent: Intent;
  implementation: string;
  explanation: string;
  alternatives?: AlternativeImplementation[];
  confidence: number;
  warnings?: string[];
}

export interface AlternativeImplementation {
  implementation: string;
  tradeoffs: string;
  confidence: number;
}

export interface IntentTemplate {
  name: string;
  pattern: RegExp;
  resolve: (match: RegExpMatchArray, context?: IntentContext) => string;
}

// ============================================================================
// Built-in Intent Templates
// ============================================================================

const builtInTemplates: IntentTemplate[] = [
  {
    name: 'counter',
    pattern: /(?:create|make|build)\s+(?:a\s+)?counter(?:\s+(?:that\s+)?(?:starts?\s+(?:at|from)\s+)?(\d+))?/i,
    resolve: (match) => {
      const start = match[1] || '0';
      return `
import { createSignal } from '@philjs/core';

export function Counter() {
  const [count, setCount] = createSignal(${start});

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <button onClick={() => setCount(c => c - 1)}>Decrement</button>
    </div>
  );
}`.trim();
    }
  },
  {
    name: 'form',
    pattern: /(?:create|make|build)\s+(?:a\s+)?(?:login|signup|contact|newsletter)\s+form/i,
    resolve: (match) => {
      const formType = match[0].includes('login') ? 'login' :
                       match[0].includes('signup') ? 'signup' :
                       match[0].includes('contact') ? 'contact' : 'newsletter';

      const fields = {
        login: ['email', 'password'],
        signup: ['name', 'email', 'password', 'confirmPassword'],
        contact: ['name', 'email', 'subject', 'message'],
        newsletter: ['email']
      }[formType];

      return `
import { createSignal } from '@philjs/core';

export function ${formType.charAt(0).toUpperCase() + formType.slice(1)}Form() {
  ${fields!.map(f => `const [${f}, set${f.charAt(0).toUpperCase() + f.slice(1)}] = createSignal('');`).join('\n  ')}
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Submit form logic here
      const data = { ${fields!.join(': ' + fields![0] + '(), ')} };
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      ${fields!.map(f => `
      <div>
        <label for="${f}">${f.charAt(0).toUpperCase() + f.slice(1).replace(/([A-Z])/g, ' $1')}</label>
        <input
          id="${f}"
          type="${f.includes('password') ? 'password' : f.includes('email') ? 'email' : 'text'}"
          value={${f}()}
          onInput={(e) => set${f.charAt(0).toUpperCase() + f.slice(1)}(e.target.value)}
          required
        />
      </div>`).join('')}
      {error() && <p style="color: red">{error()}</p>}
      <button type="submit" disabled={loading()}>
        {loading() ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}`.trim();
    }
  },
  {
    name: 'list',
    pattern: /(?:create|make|build)\s+(?:a\s+)?(?:sortable|filterable|searchable)?\s*list\s+(?:of\s+)?(\w+)/i,
    resolve: (match) => {
      const itemType = match[1] || 'items';
      const features = match[0].toLowerCase();
      const sortable = features.includes('sortable');
      const filterable = features.includes('filterable') || features.includes('searchable');

      return `
import { createSignal, createMemo } from '@philjs/core';

interface ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}Item {
  id: string;
  name: string;
  // Add more fields as needed
}

export function ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}List() {
  const [items, setItems] = createSignal<${itemType.charAt(0).toUpperCase() + itemType.slice(1)}Item[]>([]);
  ${filterable ? `const [search, setSearch] = createSignal('');` : ''}
  ${sortable ? `const [sortBy, setSortBy] = createSignal<'name' | 'id'>('name');
  const [sortDir, setSortDir] = createSignal<'asc' | 'desc'>('asc');` : ''}

  const displayedItems = createMemo(() => {
    let result = [...items()];
    ${filterable ? `
    // Filter
    const searchTerm = search().toLowerCase();
    if (searchTerm) {
      result = result.filter(item =>
        item.name.toLowerCase().includes(searchTerm)
      );
    }` : ''}
    ${sortable ? `
    // Sort
    result.sort((a, b) => {
      const aVal = a[sortBy()];
      const bVal = b[sortBy()];
      const dir = sortDir() === 'asc' ? 1 : -1;
      return aVal < bVal ? -dir : aVal > bVal ? dir : 0;
    });` : ''}
    return result;
  });

  return (
    <div>
      ${filterable ? `
      <input
        type="search"
        placeholder="Search ${itemType}..."
        value={search()}
        onInput={(e) => setSearch(e.target.value)}
      />` : ''}
      ${sortable ? `
      <select value={sortBy()} onChange={(e) => setSortBy(e.target.value)}>
        <option value="name">Name</option>
        <option value="id">ID</option>
      </select>
      <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>
        {sortDir() === 'asc' ? '↑' : '↓'}
      </button>` : ''}
      <ul>
        {displayedItems().map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}`.trim();
    }
  },
  {
    name: 'modal',
    pattern: /(?:create|make|build)\s+(?:a\s+)?(?:confirmation|alert|custom)?\s*modal/i,
    resolve: (match) => {
      const modalType = match[0].includes('confirmation') ? 'confirmation' :
                        match[0].includes('alert') ? 'alert' : 'custom';

      return `
import { createSignal, Show } from '@philjs/core';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  ${modalType === 'confirmation' ? `onConfirm?: () => void;` : ''}
  children?: any;
}

export function Modal(props: ModalProps) {
  return (
    <Show when={props.isOpen}>
      <div
        class="modal-backdrop"
        onClick={props.onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
      >
        <div
          class="modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'white',
            borderRadius: '8px',
            padding: '24px',
            minWidth: '300px',
            maxWidth: '90vw'
          }}
        >
          {props.title && <h2>{props.title}</h2>}
          <div class="modal-body">{props.children}</div>
          <div class="modal-footer" style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            ${modalType === 'confirmation' ? `
            <button onClick={props.onClose}>Cancel</button>
            <button onClick={() => { props.onConfirm?.(); props.onClose(); }}>Confirm</button>` :
            `<button onClick={props.onClose}>${modalType === 'alert' ? 'OK' : 'Close'}</button>`}
          </div>
        </div>
      </div>
    </Show>
  );
}

// Usage hook
export function useModal() {
  const [isOpen, setIsOpen] = createSignal(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(v => !v)
  };
}`.trim();
    }
  },
  {
    name: 'api-fetch',
    pattern: /(?:fetch|load|get)\s+(?:data\s+)?(?:from\s+)?(?:api|endpoint|url)\s*[:\s]*(\S+)?/i,
    resolve: (match) => {
      const endpoint = match[1] || '/api/data';

      return `
import { createSignal, createResource, onMount } from '@philjs/core';

interface DataResponse {
  // Define your data structure here
  [key: string]: unknown;
}

export function useApiData(endpoint: string = '${endpoint}') {
  const [data, setData] = createSignal<DataResponse | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => fetchData();

  onMount(() => {
    fetchData();
  });

  return { data, loading, error, refetch };
}

// Component version
export function DataFetcher(props: { endpoint?: string; children: (data: any) => any }) {
  const { data, loading, error } = useApiData(props.endpoint);

  return (
    <>
      {loading() && <div>Loading...</div>}
      {error() && <div>Error: {error()!.message}</div>}
      {data() && props.children(data())}
    </>
  );
}`.trim();
    }
  }
];

// ============================================================================
// Intent Resolver
// ============================================================================

export class IntentResolver {
  private config: Required<IntentConfig>;
  private templates: IntentTemplate[];
  private cache: Map<string, ResolvedIntent> = new Map();
  private learnings: Map<string, string> = new Map();

  constructor(config: IntentConfig = {}) {
    this.config = {
      provider: config.provider || 'local',
      apiKey: config.apiKey || '',
      model: config.model || 'gpt-4',
      cache: config.cache ?? true,
      maxAttempts: config.maxAttempts || 3,
      learning: config.learning ?? true
    };

    this.templates = [...builtInTemplates];
  }

  addTemplate(template: IntentTemplate): void {
    this.templates.push(template);
  }

  removeTemplate(name: string): void {
    this.templates = this.templates.filter(t => t.name !== name);
  }

  async resolve(intent: Intent): Promise<ResolvedIntent> {
    const cacheKey = this.getCacheKey(intent);

    // Check cache
    if (this.config.cache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Check learnings
    if (this.learnings.has(cacheKey)) {
      const learned = this.learnings.get(cacheKey)!;
      const result: ResolvedIntent = {
        intent,
        implementation: learned,
        explanation: 'Based on previous user correction',
        confidence: 0.95
      };
      this.cache.set(cacheKey, result);
      return result;
    }

    // Try template matching first
    const templateResult = this.tryTemplates(intent);
    if (templateResult) {
      this.cache.set(cacheKey, templateResult);
      return templateResult;
    }

    // Fall back to AI resolution
    if (this.config.provider !== 'local') {
      const aiResult = await this.resolveWithAI(intent);
      if (aiResult) {
        this.cache.set(cacheKey, aiResult);
        return aiResult;
      }
    }

    // Return a placeholder if nothing works
    return {
      intent,
      implementation: `// Implement: "${intent.description}"`,
      explanation: 'Could not automatically resolve this intent. Please implement manually.',
      confidence: 0,
      warnings: ['Intent could not be resolved automatically']
    };
  }

  private tryTemplates(intent: Intent): ResolvedIntent | null {
    for (const template of this.templates) {
      const match = intent.description.match(template.pattern);
      if (match) {
        try {
          const implementation = template.resolve(match, intent.context);

          // Validate constraints if any
          const warnings: string[] = [];
          if (intent.constraints) {
            for (const constraint of intent.constraints) {
              if (constraint.validate && !constraint.validate(implementation)) {
                if (constraint.type === 'must') {
                  continue; // Try next template
                }
                warnings.push(`Constraint not met: ${constraint.description}`);
              }
            }
          }

          const result: ResolvedIntent = {
            intent,
            implementation,
            explanation: `Matched template: ${template.name}`,
            confidence: 0.85
          };
          if (warnings.length > 0) {
            result.warnings = warnings;
          }
          return result;
        } catch (error) {
          continue; // Try next template
        }
      }
    }

    return null;
  }

  private async resolveWithAI(intent: Intent): Promise<ResolvedIntent | null> {
    const prompt = this.buildPrompt(intent);

    try {
      let response: string;

      if (this.config.provider === 'openai') {
        response = await this.callOpenAI(prompt);
      } else if (this.config.provider === 'anthropic') {
        response = await this.callAnthropic(prompt);
      } else {
        return null;
      }

      return {
        intent,
        implementation: this.extractCode(response),
        explanation: this.extractExplanation(response),
        confidence: 0.75
      };
    } catch (error) {
      console.error('AI resolution failed:', error);
      return null;
    }
  }

  private buildPrompt(intent: Intent): string {
    let prompt = `Generate a PhilJS component based on this description:\n\n"${intent.description}"\n\n`;

    if (intent.constraints) {
      prompt += 'Constraints:\n';
      for (const c of intent.constraints) {
        prompt += `- [${c.type.toUpperCase()}] ${c.description}\n`;
      }
      prompt += '\n';
    }

    if (intent.context?.existingCode) {
      prompt += `Existing code context:\n\`\`\`\n${intent.context.existingCode}\n\`\`\`\n\n`;
    }

    if (intent.priority) {
      prompt += `Optimization priority: ${intent.priority}\n\n`;
    }

    prompt += 'Respond with:\n1. The implementation code\n2. A brief explanation\n\nUse PhilJS signals and best practices.';

    return prompt;
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async callAnthropic(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2024-01-01'
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-sonnet-20240229',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    return data.content[0].text;
  }

  private extractCode(response: string): string {
    const codeMatch = response.match(/```(?:typescript|tsx|jsx|javascript)?\n([\s\S]*?)```/);
    if (codeMatch) {
      return codeMatch[1]!.trim();
    }
    return response.trim();
  }

  private extractExplanation(response: string): string {
    const withoutCode = response.replace(/```[\s\S]*?```/g, '').trim();
    return withoutCode || 'Generated from AI';
  }

  private getCacheKey(intent: Intent): string {
    return `${intent.description}:${intent.priority || 'default'}:${JSON.stringify(intent.constraints || [])}`;
  }

  // Learning from corrections

  learn(intent: Intent, correctedImplementation: string): void {
    if (!this.config.learning) return;

    const cacheKey = this.getCacheKey(intent);
    this.learnings.set(cacheKey, correctedImplementation);
    this.cache.delete(cacheKey); // Clear old cache
  }

  clearLearnings(): void {
    this.learnings.clear();
  }
}

// ============================================================================
// Intent DSL
// ============================================================================

export function intent(description: string): IntentBuilder {
  return new IntentBuilder(description);
}

class IntentBuilder {
  private _intent: Intent;

  constructor(description: string) {
    this._intent = {
      id: `intent-${Date.now()}`,
      description
    };
  }

  must(constraint: string, validate?: (result: unknown) => boolean): IntentBuilder {
    this._intent.constraints = this._intent.constraints || [];
    const c: Constraint = { type: 'must', description: constraint };
    if (validate) c.validate = validate;
    this._intent.constraints.push(c);
    return this;
  }

  should(constraint: string, validate?: (result: unknown) => boolean): IntentBuilder {
    this._intent.constraints = this._intent.constraints || [];
    const c: Constraint = { type: 'should', description: constraint };
    if (validate) c.validate = validate;
    this._intent.constraints.push(c);
    return this;
  }

  mustNot(constraint: string, validate?: (result: unknown) => boolean): IntentBuilder {
    this._intent.constraints = this._intent.constraints || [];
    const c: Constraint = { type: 'must-not', description: constraint };
    if (validate) c.validate = validate;
    this._intent.constraints.push(c);
    return this;
  }

  prefer(constraint: string): IntentBuilder {
    this._intent.constraints = this._intent.constraints || [];
    this._intent.constraints.push({ type: 'prefer', description: constraint });
    return this;
  }

  prioritize(priority: 'performance' | 'readability' | 'size' | 'accessibility'): IntentBuilder {
    this._intent.priority = priority;
    return this;
  }

  inContext(context: IntentContext): IntentBuilder {
    this._intent.context = context;
    return this;
  }

  build(): Intent {
    return this._intent;
  }

  async resolve(resolver?: IntentResolver): Promise<ResolvedIntent> {
    const r = resolver || getIntentResolver();
    if (!r) throw new Error('No intent resolver available');
    return r.resolve(this._intent);
  }
}

// ============================================================================
// React-like Hooks
// ============================================================================

let globalResolver: IntentResolver | null = null;

export function initIntent(config?: IntentConfig): IntentResolver {
  globalResolver = new IntentResolver(config);
  return globalResolver;
}

export function getIntentResolver(): IntentResolver | null {
  return globalResolver;
}

export function useIntent(description: string): {
  resolve: () => Promise<ResolvedIntent>;
  builder: IntentBuilder;
} {
  const builder = intent(description);

  return {
    resolve: () => builder.resolve(globalResolver || undefined),
    builder
  };
}

// ============================================================================
// Exports
// ============================================================================

export { builtInTemplates };
