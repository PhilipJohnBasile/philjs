# @philjs/genui - AI-Driven UI Composition

**Runtime AI-driven UI composition with the A2UI (Agent-to-UI) protocol for PhilJS.**

@philjs/genui enables AI agents to dynamically generate, update, and manage user interfaces at runtime. It provides a secure, validated protocol for LLM-generated UI specifications, a component registry for safe rendering, and hooks for seamless integration with PhilJS applications.

## Installation

```bash
npm install @philjs/genui
# or
pnpm add @philjs/genui
# or
bun add @philjs/genui
```

**Peer Dependencies:**

```bash
npm install @philjs/core
```

## Why @philjs/genui?

Building AI-generated user interfaces traditionally requires:
- Custom protocols for AI-to-UI communication
- Manual validation of AI-generated specifications
- Security concerns with dynamic code execution
- Complex hydration of JSON to DOM elements
- Managing component registries and capabilities

@philjs/genui provides a complete, secure solution:
- **A2UI Protocol**: Standardized JSON schema for AI-generated UIs
- **Security Sandbox**: AST validation prevents code injection
- **Component Registry**: Whitelist-based component rendering
- **Hydration Engine**: Converts A2UI messages to live DOM
- **Reactive Hooks**: PhilJS integration with signals support

## Features

| Feature | Description |
|---------|-------------|
| **A2UI Protocol** | Standardized JSON schema for agent-to-UI communication |
| **Component Registry** | Register, query, and render UI components safely |
| **Security Sandbox** | AST-based validation prevents injection attacks |
| **Hydration Engine** | Convert A2UI messages to live DOM elements |
| **Data Bindings** | Reactive bindings with signal integration |
| **Action Handlers** | Emit, navigate, signal, and agent action types |
| **Built-in Components** | Box, Stack, Grid, Text, Button, Input, Alert, and more |
| **LLM Manifests** | Generate capability manifests for AI context |
| **Real-time Agents** | WebSocket support for live agent collaboration |
| **Animations** | Fade, slide, scale transitions for updates |

## Quick Start

```typescript
import {
  useGenUI,
  createRegistry,
  registerBuiltins,
  createMockAgent,
} from '@philjs/genui';

// Create and configure a component registry
const registry = createRegistry();
registerBuiltins(registry);

// Create a mock agent for testing
const agent = createMockAgent((prompt) => ({
  version: '1.0',
  type: 'render',
  payload: {
    type: 'render',
    layout: { type: 'stack', gap: '16px' },
    components: [
      {
        id: 'heading-1',
        type: 'Heading',
        props: { children: 'Welcome!', level: 1 },
      },
      {
        id: 'text-1',
        type: 'Text',
        props: { children: `You asked: ${prompt}` },
      },
      {
        id: 'button-1',
        type: 'Button',
        props: { children: 'Click Me', variant: 'primary' },
      },
    ],
  },
}));

// Use the GenUI hook
const genui = useGenUI({
  registry,
  agent,
  onAgentAction: (actionId, event) => {
    console.log('Action triggered:', actionId, event);
  },
});

// Generate UI from a prompt
await genui.generate('Create a welcome screen');

// Render to a container
const container = document.getElementById('app')!;
const cleanup = genui.render(container);

// Later: cleanup when done
cleanup();
```

## A2UI Protocol

The A2UI (Agent-to-UI) protocol defines a structured JSON schema for AI agents to communicate UI specifications to the PhilJS runtime.

### Message Structure

```typescript
interface A2UIMessage {
  version: '1.0';
  type: 'render' | 'update' | 'action' | 'query';
  payload: A2UIPayload;
  metadata?: A2UIMetadata;
}
```

### Creating Messages

```typescript
import {
  createRenderMessage,
  createUpdateMessage,
  createActionMessage,
} from '@philjs/genui';

// Create a render message (full UI tree)
const renderMessage = createRenderMessage(
  { type: 'stack', direction: 'column', gap: '16px' },
  [
    {
      id: 'card-1',
      type: 'Card',
      props: { title: 'User Profile' },
      children: [
        { id: 'avatar-1', type: 'Avatar', props: { src: '/user.jpg' } },
        { id: 'name-1', type: 'Text', props: { children: 'John Doe' } },
      ],
    },
  ],
  {
    bindings: [
      { id: 'b1', source: 'signal', path: 'user.name', targetId: 'name-1', targetProp: 'textContent' },
    ],
    actions: [
      { id: 'a1', trigger: 'click', handler: { type: 'emit', event: 'profile-click' } },
    ],
    metadata: { sessionId: 'session-123' },
  }
);

// Create an update message (partial update)
const updateMessage = createUpdateMessage(
  'name-1',
  { props: { children: 'Jane Doe' } },
  { messageId: 'update-456' }
);

// Create an action message (user interaction)
const actionMessage = createActionMessage(
  'button-1',
  { type: 'click', data: { timestamp: Date.now() } },
  { formData: { email: 'user@example.com' } }
);
```

### Render Payload

A render payload defines a complete UI tree:

```typescript
interface A2UIRenderPayload {
  type: 'render';
  layout: A2UILayout;           // Root layout configuration
  components: A2UIComponent[];  // Component tree
  bindings?: A2UIBinding[];     // Data bindings
  actions?: A2UIAction[];       // Action handlers
}
```

### Update Payload

An update payload modifies existing components:

```typescript
interface A2UIUpdatePayload {
  type: 'update';
  targetId: string;                  // Component to update
  props?: Record<string, unknown>;   // New properties
  children?: A2UIComponent[];        // Replace children
  animation?: A2UIAnimation;         // Transition animation
}
```

### Component Definition

```typescript
interface A2UIComponent {
  id: string;                        // Unique identifier
  type: string;                      // Component type (from registry)
  props: Record<string, unknown>;    // Component props
  children?: A2UIComponent[];        // Child components
  slot?: string;                     // Named slot assignment
  when?: A2UICondition;              // Conditional rendering
  each?: A2UIIteration;              // List iteration
  className?: string;                // CSS classes
  style?: Record<string, string | number>;  // Inline styles
  a11y?: A2UIAccessibility;          // Accessibility attributes
}
```

### Layout Configuration

```typescript
interface A2UILayout {
  type: 'stack' | 'grid' | 'flex' | 'absolute' | 'flow';
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  gap?: number | string;
  columns?: number | string;         // For grid
  rows?: number | string;            // For grid
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  padding?: number | string | [number, number] | [number, number, number, number];
}
```

### Validation

Validate A2UI messages before processing:

```typescript
import { validateMessage, validateComponent, validateLayout, schemas } from '@philjs/genui';

// Validate a complete message
const result = validateMessage(untrustedMessage);
if (result.valid) {
  console.log('Valid message:', result.data);
} else {
  console.error('Validation errors:', result.errors);
}

// Validate individual components
const componentResult = validateComponent({
  id: 'btn-1',
  type: 'Button',
  props: { children: 'Click' },
});

// Validate layout configuration
const layoutResult = validateLayout({
  type: 'grid',
  columns: '1fr 1fr 1fr',
  gap: '16px',
});

// Access Zod schemas directly
const { message, component, layout, binding, action } = schemas;
```

## Component Registry

The component registry manages available components for AI-driven composition.

### Creating a Registry

```typescript
import {
  ComponentRegistry,
  createRegistry,
  getDefaultRegistry,
  setDefaultRegistry,
  registerBuiltins,
} from '@philjs/genui';

// Create a new registry
const registry = createRegistry();

// Register built-in components
registerBuiltins(registry);

// Or use the default singleton
const defaultRegistry = getDefaultRegistry();

// Set a custom default registry
setDefaultRegistry(registry);
```

### Registering Components

```typescript
import type { ComponentCapability, ComponentRenderer } from '@philjs/genui';

// Define component capability (for LLM context)
const cardCapability: ComponentCapability = {
  type: 'Card',
  displayName: 'Card',
  description: 'A container with optional title, padding, and shadow',
  category: 'layout',
  props: [
    { name: 'title', type: 'string', description: 'Card title' },
    { name: 'padding', type: 'string', default: '16px' },
    { name: 'elevation', type: 'number', enum: [0, 1, 2, 3], default: 1 },
  ],
  slots: [
    { name: 'default', description: 'Card content', multiple: true },
    { name: 'footer', description: 'Card footer' },
  ],
  events: [
    { name: 'onClick', description: 'Card click event' },
  ],
  tags: ['container', 'card', 'panel'],
  a11yNotes: 'Use role="region" with aria-label for semantic cards',
};

// Define component renderer
const cardRenderer: ComponentRenderer = (component, context) => {
  const element = document.createElement('div');
  element.id = component.id;
  element.className = 'card';

  if (component.props.title) {
    const title = document.createElement('h3');
    title.textContent = component.props.title as string;
    element.appendChild(title);
  }

  // Render children
  if (component.children) {
    for (const child of component.children) {
      const childElement = context.renderChild(child);
      if (childElement) {
        element.appendChild(childElement);
      }
    }
  }

  // Handle click events
  element.addEventListener('click', () => {
    context.emitToAgent(component.id, { type: 'click' });
  });

  return element;
};

// Register the component
registry.register(cardCapability, cardRenderer);
```

### Querying Components

```typescript
// Check if a component type is allowed
registry.isAllowed('Button'); // true
registry.isAllowed('DangerousComponent'); // false

// Get capability for a component
const buttonCap = registry.getCapability('Button');
console.log(buttonCap?.description);

// Get renderer
const buttonRenderer = registry.getRenderer('Button');

// Get all capabilities
const allCapabilities = registry.getCapabilities();

// Get by category
const inputComponents = registry.getCapabilitiesByCategory('input');
const layoutComponents = registry.getCapabilitiesByCategory('layout');

// Search capabilities
const searchResults = registry.searchCapabilities('button');

// Get registered types
const types = registry.getRegisteredTypes(); // ['Box', 'Stack', 'Button', ...]
```

### Generating Manifests for LLMs

```typescript
// Full manifest (for detailed LLM context)
const manifest = registry.generateManifest();
console.log(manifest);
// {
//   version: '1.0',
//   componentCount: 12,
//   categories: { layout: 3, input: 4, display: 3, feedback: 2 },
//   components: [
//     { type: 'Button', displayName: 'Button', description: '...', props: [...] },
//     ...
//   ]
// }

// Compact manifest (for token-constrained contexts)
const compactManifest = registry.generateCompactManifest();
console.log(compactManifest);
// {
//   v: '1.0',
//   c: [
//     { t: 'Button', d: 'Interactive button...', cat: 'input', p: ['children'] },
//     ...
//   ]
// }
```

### Built-in Components

The following components are available via `registerBuiltins()`:

**Layout Components:**
- `Box` - Generic container element
- `Stack` - Flex container for vertical/horizontal stacking
- `Grid` - CSS grid container

**Display Components:**
- `Text` - Text content with styling options
- `Heading` - Headings (h1-h6)

**Input Components:**
- `Button` - Interactive button with variants
- `Input` - Text input field

**Feedback Components:**
- `Alert` - Alert/notification messages
- `Spinner` - Loading indicator

## Security Sandbox

The AST validator ensures AI-generated UIs are safe to render.

### Default Configuration

```typescript
import { ASTValidator, createValidator, DEFAULT_SANDBOX_CONFIG } from '@philjs/genui';

// View default configuration
console.log(DEFAULT_SANDBOX_CONFIG);
// {
//   allowedComponents: ['Box', 'Stack', 'Grid', 'Text', 'Button', ...],
//   allowUnknownComponents: false,
//   allowedProps: Map { 'Button' => ['children', 'variant', ...], ... },
//   allowedActions: ['emit', 'navigate', 'signal', 'agent'],
//   maxDepth: 10,
//   maxComponents: 100,
//   maxBindings: 50,
//   maxActions: 50,
//   forbiddenPatterns: [/javascript:/i, /eval\s*\(/i, ...],
//   allowInlineStyles: true,
//   allowCustomEvents: false,
//   blockedNavigationPatterns: [/javascript:/i, /data:/i, /file:/i],
// }
```

### Creating a Validator

```typescript
import { createValidator, ASTValidator } from '@philjs/genui';
import type { SandboxConfig } from '@philjs/genui';

// Create with default config
const validator = createValidator();

// Create with custom config
const customValidator = createValidator({
  allowedComponents: ['Box', 'Text', 'Button'], // Restrict components
  maxDepth: 5,                                   // Limit nesting
  maxComponents: 50,                             // Limit total components
  allowInlineStyles: false,                      // Disable inline styles
  allowCustomEvents: true,                       // Allow custom events
  allowedNavigationUrls: [/^\/app\/.*/],        // Whitelist navigation URLs
});

// Or use the class directly
const validator2 = new ASTValidator({
  allowUnknownComponents: true, // Allow non-registered components
});
```

### Validating Messages

```typescript
import type { SandboxValidationResult } from '@philjs/genui';

const result: SandboxValidationResult = validator.validate(message);

if (result.valid) {
  console.log('Message is safe to render');
  console.log('Sanitized:', result.sanitized);
} else {
  console.error('Validation failed:');
  for (const error of result.errors) {
    console.error(`- ${error.code}: ${error.message}`);
    if (error.source) console.error(`  Component: ${error.source}`);
    if (error.path) console.error(`  Path: ${error.path}`);
  }
}

// Check warnings (non-blocking issues)
if (result.warnings.length > 0) {
  console.warn('Warnings:', result.warnings);
}
```

### Security Features

The sandbox protects against:

```typescript
// Script injection (blocked)
{ type: 'Text', props: { children: '<script>alert("xss")</script>' } }

// JavaScript URLs (blocked)
{ handler: { type: 'navigate', to: 'javascript:alert(1)' } }

// Dangerous function calls (blocked)
{ when: { expression: 'eval("malicious code")' } }

// DOM manipulation attempts (blocked)
{ props: { onClick: 'document.body.innerHTML = ""' } }

// Prototype pollution (blocked)
{ props: { '__proto__': { polluted: true } } }

// Excessive nesting (blocked)
// Deep component trees exceeding maxDepth

// Too many components (blocked)
// Component counts exceeding maxComponents
```

### Updating Configuration

```typescript
// Update validator config at runtime
validator.updateConfig({
  maxComponents: 200,
  allowedComponents: [...DEFAULT_SANDBOX_CONFIG.allowedComponents, 'CustomCard'],
});

// Get current config
const config = validator.getConfig();
```

## Hydration Engine

The hydrator converts validated A2UI messages into live DOM elements.

### Creating a Hydrator

```typescript
import { GenUIHydrator, createHydrator } from '@philjs/genui';
import type { HydratorOptions } from '@philjs/genui';

const options: HydratorOptions = {
  sandbox: {
    allowUnknownComponents: true,
  },
  onAgentAction: (actionId, event) => {
    console.log('Agent action:', actionId, event);
    // Send to your AI agent
  },
  signals: new Map([
    ['user.name', { get: () => 'John', set: (v) => console.log('Set:', v) }],
  ]),
  animateTransitions: true,
};

const hydrator = createHydrator(registry, options);
```

### Hydrating Messages

```typescript
import type { HydrationResult } from '@philjs/genui';

// Hydrate a render message
const container = document.getElementById('app')!;
const result: HydrationResult = hydrator.hydrate(message, container);

if (result.success) {
  console.log('Rendered element:', result.element);
  console.log('Component map:', result.componentMap);

  // Access rendered components by ID
  const button = result.componentMap?.get('button-1');

  // Cleanup when done
  result.cleanup?.();
} else {
  console.error('Hydration failed:', result.errors);
}
```

### Handling Updates

```typescript
// Apply an update message
const updateResult = hydrator.hydrate(updateMessage, container);

// The hydrator tracks components and applies updates efficiently
// Animations are applied if animateTransitions is enabled
```

### Data Bindings

Bindings connect signals to component properties:

```typescript
const message = createRenderMessage(
  { type: 'stack' },
  [
    { id: 'name-display', type: 'Text', props: { children: '' } },
    { id: 'name-input', type: 'Input', props: { placeholder: 'Enter name' } },
  ],
  {
    bindings: [
      {
        id: 'binding-1',
        source: 'signal',
        path: 'user.name',
        targetId: 'name-display',
        targetProp: 'textContent',
        transform: 'toUpperCase',  // Built-in transforms
        defaultValue: 'Anonymous',
      },
    ],
  }
);

// Available transforms:
// - toString, toNumber, toBoolean
// - toUpperCase, toLowerCase, trim
// - length (for strings/arrays)
```

### Action Handlers

Actions define how user interactions are processed:

```typescript
const message = createRenderMessage(
  { type: 'stack' },
  [{ id: 'submit-btn', type: 'Button', props: { children: 'Submit' } }],
  {
    actions: [
      // Emit event to agent
      {
        id: 'action-1',
        trigger: 'click',
        handler: { type: 'emit', event: 'form-submit', payload: { formId: 'contact' } },
        debounce: 300,
      },
      // Navigate
      {
        id: 'action-2',
        trigger: 'click',
        handler: { type: 'navigate', to: '/dashboard', replace: false },
        preventDefault: true,
      },
      // Update signal
      {
        id: 'action-3',
        trigger: 'change',
        handler: { type: 'signal', action: 'set', path: 'form.email', value: null },
      },
      // Send to agent
      {
        id: 'action-4',
        trigger: 'click',
        handler: { type: 'agent', intent: 'submit-form', context: { step: 2 }, await: true },
      },
    ],
  }
);
```

### Animations

Apply animations to updates:

```typescript
const updateMessage = createUpdateMessage(
  'card-1',
  { props: { title: 'Updated Title' } },
  {
    animation: {
      type: 'fade',          // 'fade' | 'slide' | 'scale' | 'custom'
      duration: 300,
      easing: 'ease-out',
    },
  }
);

// Slide animation with direction
{
  animation: {
    type: 'slide',
    direction: 'up',  // 'up' | 'down' | 'left' | 'right'
    duration: 400,
  }
}
```

### Cleanup

```typescript
// Clean up all resources (event listeners, subscriptions)
hydrator.cleanup();
```

## Hooks

### useGenUI

The primary hook for AI-generated UI:

```typescript
import { useGenUI } from '@philjs/genui';
import type { GenUIState, GenUIOptions } from '@philjs/genui';

const options: GenUIOptions = {
  registry: myRegistry,
  sandbox: { maxComponents: 50 },
  agent: myAgent,
  onAgentAction: (actionId, event) => {
    console.log('Action:', actionId, event);
  },
  initialUI: existingMessage,
};

const genui: GenUIState = useGenUI(options);

// State properties (reactive)
genui.ui;       // Current A2UIMessage or null
genui.loading;  // Boolean loading state
genui.error;    // Error or null

// Methods
await genui.generate('Create a dashboard', { userId: '123' });
const cleanup = genui.render(document.getElementById('app')!);
genui.update({ metadata: { priority: 'high' } });
genui.clear();
const manifest = genui.getManifest();
```

### useAgentUI

Hook for real-time WebSocket agent collaboration:

```typescript
import { useAgentUI } from '@philjs/genui';
import type { AgentUIState, AgentUIOptions } from '@philjs/genui';

const options: AgentUIOptions = {
  endpoint: 'wss://api.example.com/agent',
  registry: myRegistry,
  sandbox: { maxDepth: 5 },
  onConnect: () => console.log('Connected'),
  onDisconnect: () => console.log('Disconnected'),
  onMessage: (message) => console.log('Received:', message),
  onError: (error) => console.error('Error:', error),
  autoReconnect: true,
  reconnectInterval: 5000,
};

const agent: AgentUIState = useAgentUI(options);

// State properties (reactive)
agent.connected;  // Boolean connection status
agent.sessionId;  // Current session ID or null
agent.ui;         // Current A2UIMessage or null

// Methods
await agent.connect();
agent.send('Show me the user dashboard', { userId: '123' });
agent.disconnect();
```

### createMockAgent

Create a mock agent for testing:

```typescript
import { createMockAgent } from '@philjs/genui';
import type { GenUIAgent } from '@philjs/genui';

// From a response function
const mockAgent: GenUIAgent = createMockAgent((prompt) => ({
  version: '1.0',
  type: 'render',
  payload: {
    type: 'render',
    layout: { type: 'stack' },
    components: [
      { id: 'response', type: 'Text', props: { children: `Echo: ${prompt}` } },
    ],
  },
}));

// From a Map of responses
const responseMap = new Map([
  ['hello', { version: '1.0', type: 'render', payload: { /* ... */ } }],
  ['dashboard', { version: '1.0', type: 'render', payload: { /* ... */ } }],
]);
const mapAgent = createMockAgent(responseMap);

// Use with useGenUI
const genui = useGenUI({ agent: mockAgent });
```

### createLayoutGenerator

Create a simple prompt-based layout generator:

```typescript
import { createLayoutGenerator } from '@philjs/genui';
import type { A2UILayout } from '@philjs/genui';

const generateLayout = createLayoutGenerator();

// Returns appropriate layout based on description
generateLayout('horizontal row');
// { type: 'flex', direction: 'row', gap: '16px', wrap: true }

generateLayout('3-column grid');
// { type: 'grid', columns: '3', gap: '16px' }

generateLayout('centered content');
// { type: 'flex', direction: 'column', align: 'center', justify: 'center' }

generateLayout('vertical stack');
// { type: 'stack', direction: 'column', gap: '16px' }
```

## Types Reference

### Protocol Types

```typescript
import type {
  // Core message types
  A2UIMessage,
  A2UIPayload,
  A2UIRenderPayload,
  A2UIUpdatePayload,
  A2UIActionPayload,
  A2UIQueryPayload,

  // Component types
  A2UIComponent,
  A2UILayout,
  A2UIBinding,
  A2UIAction,
  A2UICondition,
  A2UIIteration,
  A2UIAnimation,
  A2UIAccessibility,
  A2UIMetadata,

  // Action handlers
  A2UIActionHandler,
  A2UIEmitHandler,
  A2UINavigateHandler,
  A2UISignalHandler,
  A2UIAgentHandler,

  // Response types
  A2UIResponse,
  A2UIError,
  A2UIErrorCode,
} from '@philjs/genui';
```

### Registry Types

```typescript
import type {
  PropDefinition,
  SlotDefinition,
  EventDefinition,
  ComponentExample,
  ComponentCapability,
  ComponentRenderer,
  RenderContext,
  ComponentManifest,
  CompactManifest,
} from '@philjs/genui';
```

### Sandbox Types

```typescript
import type {
  SandboxConfig,
  ValidationError,
  SandboxValidationResult,
} from '@philjs/genui';
```

### Runtime Types

```typescript
import type {
  HydrationResult,
  HydratorOptions,
} from '@philjs/genui';
```

### Hook Types

```typescript
import type {
  GenUIState,
  GenUIOptions,
  GenUIAgent,
  AgentUIState,
  AgentUIOptions,
} from '@philjs/genui';
```

## API Reference

### Protocol Functions

| Function | Description |
|----------|-------------|
| `createRenderMessage(layout, components, options?)` | Create a render message |
| `createUpdateMessage(targetId, updates, metadata?)` | Create an update message |
| `createActionMessage(actionId, event, state?, metadata?)` | Create an action message |
| `validateMessage(message)` | Validate an A2UI message |
| `validateComponent(component)` | Validate a single component |
| `validateLayout(layout)` | Validate a layout configuration |

### Registry Functions

| Function | Description |
|----------|-------------|
| `createRegistry()` | Create a new component registry |
| `getDefaultRegistry()` | Get the default singleton registry |
| `setDefaultRegistry(registry)` | Set the default registry |
| `registerBuiltins(registry)` | Register built-in components |

### ComponentRegistry Methods

| Method | Description |
|--------|-------------|
| `register(capability, renderer)` | Register a component |
| `unregister(type)` | Unregister a component |
| `isAllowed(type)` | Check if a type is allowed |
| `getCapability(type)` | Get capability for a type |
| `getRenderer(type)` | Get renderer for a type |
| `getCapabilities()` | Get all capabilities |
| `getCapabilitiesByCategory(category)` | Get capabilities by category |
| `searchCapabilities(query)` | Search capabilities |
| `generateManifest()` | Generate full LLM manifest |
| `generateCompactManifest()` | Generate compact manifest |
| `getRegisteredTypes()` | Get all registered type names |
| `clear()` | Clear all registrations |

### Sandbox Functions

| Function | Description |
|----------|-------------|
| `createValidator(config?)` | Create an AST validator |
| `DEFAULT_SANDBOX_CONFIG` | Default sandbox configuration |

### ASTValidator Methods

| Method | Description |
|--------|-------------|
| `validate(message)` | Validate an A2UI message |
| `updateConfig(config)` | Update validator configuration |
| `getConfig()` | Get current configuration |

### Hydrator Functions

| Function | Description |
|----------|-------------|
| `createHydrator(registry, options?)` | Create a hydrator instance |

### GenUIHydrator Methods

| Method | Description |
|--------|-------------|
| `hydrate(message, container)` | Hydrate a message into a container |
| `cleanup()` | Clean up all resources |

### Hook Functions

| Function | Description |
|----------|-------------|
| `useGenUI(options?)` | Main hook for AI-generated UI |
| `useAgentUI(options)` | Hook for real-time agent collaboration |
| `createMockAgent(responses)` | Create a mock agent for testing |
| `createLayoutGenerator()` | Create a layout generator function |

## Best Practices

1. **Always validate AI-generated messages** - Use `validateMessage()` before hydration
2. **Register only needed components** - Minimize attack surface
3. **Use strict sandbox config in production** - Disable `allowUnknownComponents`
4. **Provide capability manifests to LLMs** - Use `generateManifest()` for context
5. **Handle action callbacks** - Don't ignore `onAgentAction` events
6. **Clean up properly** - Call cleanup functions when components unmount
7. **Use data bindings** - Prefer declarative bindings over imperative updates
8. **Limit tree depth and component count** - Set reasonable `maxDepth` and `maxComponents`
9. **Whitelist navigation URLs** - Use `allowedNavigationUrls` in production
10. **Test with mock agents** - Use `createMockAgent()` for development

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_MESSAGE` | Message structure is invalid |
| `INVALID_COMPONENT` | Component definition is invalid |
| `COMPONENT_NOT_FOUND` | Referenced component doesn't exist |
| `PROP_VALIDATION_FAILED` | Property validation failed |
| `SECURITY_VIOLATION` | Security check failed |
| `SANDBOX_ERROR` | Sandbox evaluation error |
| `BINDING_ERROR` | Data binding failed |
| `ACTION_ERROR` | Action execution failed |
| `TIMEOUT` | Operation timed out |
| `UNKNOWN_ERROR` | Unexpected error |

## Next Steps

- [A2UI Protocol Specification](./a2ui-protocol.md)
- [Custom Component Development](./custom-components.md)
- [Security Configuration](./security.md)
- [Integration with @philjs/ai](../ai/overview.md)
