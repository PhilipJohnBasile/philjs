# A2UI Protocol

The **Agent-to-UI (A2UI)** protocol is the standard by which AI agents communicate with the PhilJS runtime to render dynamic interfaces. It is a JSON-based messaging format that defines component trees, updates, and user actions.

## Message Structure

Every A2UI message follows this root structure:

```typescript
interface A2UIMessage {
  version: '1.0';
  type: 'render' | 'update' | 'action' | 'query';
  payload: A2UIPayload;
  metadata?: {
    messageId: string;
    timestamp: number;
    sessionId?: string;
  };
}
```

![A2UI Protocol Sequence](../../assets/a2ui_protocol_sequence.png)
*Figure 12-1: Agent-to-UI Message Protocol*

## Message Types

### 1. Render (`type: 'render'`)
Sent by the agent to define a complete UI tree.

```json
{
  "type": "render",
  "payload": {
    "layout": { "type": "stack", "direction": "column", "gap": 4 },
    "components": [
      {
        "id": "header-1",
        "type": "Typography",
        "props": { "variant": "h1", "text": "Welcome" }
      },
      {
        "id": "btn-1",
        "type": "Button",
        "props": { "label": "Click Me" },
        "actions": [{ "trigger": "click", "handler": { "type": "emit", "event": "submit" } }]
      }
    ]
  }
}
```

### 2. Update (`type: 'update'`)
Sent by the agent to patch an existing component.

```json
{
  "type": "update",
  "payload": {
    "targetId": "header-1",
    "props": { "text": "Welcome Back!" },
    "animation": { "type": "fade", "duration": 300 }
  }
}
```

### 3. Action (`type: 'action'`)
Sent by the UI runtime *to* the agent when a user interacts.

```json
{
  "type": "action",
  "payload": {
    "actionId": "submit-action",
    "event": { "type": "click" },
    "state": { "inputValue": "user input" }
  }
}
```

## Features

### Component Registry
Agents can only render components that have been registered in the `ComponentRegistry`. This ensures security by preventing the execution of arbitrary code.

### Data Binding
Components can bind to signals or context values using the `A2UIBinding` interface.

```typescript
{
  "source": "signal",
  "path": "user.name",
  "targetProp": "text"
}
```

### Sandboxed Logic
Simple logic (conditionals, loops) is supported via a secure sandbox, allowing the UI to be interactive without round-tripping to the agent for every state change.

## Usage

```typescript
import { createRenderMessage } from '@philjs/genui/protocol';

const msg = createRenderMessage(
  { type: 'stack' },
  [
    { id: '1', type: 'Button', props: { label: 'Go' } }
  ]
);

socket.send(JSON.stringify(msg));
```
