# @philjs/llm-ui

Streaming chat UI components for LLM applications with markdown rendering, code highlighting, and tool call visualization.

## Installation

```bash
npm install @philjs/llm-ui
```

## Features

- **Streaming Text** - Typewriter effect with cursor
- **Markdown Rendering** - Full markdown with syntax highlighting
- **Code Blocks** - Copy button and language detection
- **Message Bubbles** - User and assistant styling
- **Tool Calls** - Visualize function calls and results
- **Thinking Indicator** - Loading animation
- **Message Actions** - Copy, regenerate, like/dislike
- **Auto-scroll** - Scroll to bottom on new messages

## Quick Start

```typescript
import { ChatContainer, useChat } from '@philjs/llm-ui';

function ChatApp() {
  const container = document.getElementById('chat');

  const chat = new ChatContainer(container, {
    placeholder: 'Ask me anything...',
    enableMarkdown: true,
    enableCodeHighlight: true,
  });

  chat.on('send', async (message) => {
    // Add user message
    chat.addMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    // Show thinking indicator
    chat.showThinking();

    // Stream response
    const assistantId = crypto.randomUUID();
    chat.addMessage({
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    });

    for await (const chunk of streamFromLLM(message)) {
      chat.updateMessage(assistantId, chunk);
    }

    chat.finishMessage(assistantId);
    chat.hideThinking();
  });
}
```

## ChatContainer

### Configuration

```typescript
import { ChatContainer } from '@philjs/llm-ui';

const chat = new ChatContainer(containerElement, {
  placeholder: 'Type a message...',  // Input placeholder
  maxLength: 4000,                   // Max message length
  showTimestamps: true,              // Show message times
  showAvatars: true,                 // Show user/assistant avatars
  enableMarkdown: true,              // Render markdown
  enableCodeHighlight: true,         // Syntax highlighting
  enableCopy: true,                  // Copy button on messages
  enableRegenerate: true,            // Regenerate button
  enableEdit: false,                 // Edit messages
  userAvatar: '/avatars/user.png',   // Custom user avatar
  assistantAvatar: '/avatars/ai.png', // Custom assistant avatar
  theme: 'dark',                     // 'light' | 'dark' | 'system'
});
```

### Adding Messages

```typescript
// User message
chat.addMessage({
  id: 'msg-1',
  role: 'user',
  content: 'Hello!',
  timestamp: new Date(),
});

// Assistant message
chat.addMessage({
  id: 'msg-2',
  role: 'assistant',
  content: 'Hi! How can I help you today?',
  timestamp: new Date(),
});

// System message
chat.addMessage({
  id: 'msg-3',
  role: 'system',
  content: 'You are a helpful assistant.',
  timestamp: new Date(),
});
```

### Streaming Messages

```typescript
// Add streaming message
chat.addMessage({
  id: 'stream-1',
  role: 'assistant',
  content: '',
  timestamp: new Date(),
  isStreaming: true,
});

// Update content as it streams
for await (const chunk of stream) {
  chat.updateMessage('stream-1', currentContent + chunk);
}

// Mark streaming as complete
chat.finishMessage('stream-1');
```

### Tool Calls

```typescript
chat.addMessage({
  id: 'msg-tools',
  role: 'assistant',
  content: 'Let me search for that...',
  timestamp: new Date(),
  toolCalls: [
    {
      id: 'call-1',
      name: 'web_search',
      arguments: { query: 'latest news' },
      status: 'running',
    },
  ],
});

// Update tool call status
chat.addMessage({
  id: 'msg-tools',
  role: 'assistant',
  content: 'Here are the results...',
  timestamp: new Date(),
  toolCalls: [
    {
      id: 'call-1',
      name: 'web_search',
      arguments: { query: 'latest news' },
      status: 'success',
      result: { articles: [...] },
      duration: 1250,
    },
  ],
});
```

### Thinking Indicator

```typescript
// Show thinking
chat.showThinking('Analyzing your question...');

// Hide thinking
chat.hideThinking();
```

### Events

```typescript
// Message sent
chat.on('send', (message) => {
  handleUserMessage(message);
});

// Copy clicked
chat.on('copy', ({ messageId, content }) => {
  console.log('Copied:', content);
});

// Regenerate clicked
chat.on('regenerate', (messageId) => {
  regenerateResponse(messageId);
});

// Edit submitted
chat.on('edit', ({ messageId, content }) => {
  updateMessage(messageId, content);
});

// Reaction (like/dislike)
chat.on('reaction', ({ messageId, reaction }) => {
  trackFeedback(messageId, reaction);
});
```

### Other Methods

```typescript
// Remove a message
chat.removeMessage('msg-1');

// Clear all messages
chat.clearMessages();

// Scroll to bottom
chat.scrollToBottom();

// Focus input
chat.focus();

// Disable/enable input
chat.disable();
chat.enable();
```

## StreamingText

### Basic Usage

```typescript
import { StreamingText } from '@philjs/llm-ui';

const streamer = new StreamingText({
  speed: 50,          // Characters per second
  cursor: true,       // Show blinking cursor
  cursorChar: '▊',    // Cursor character
});

streamer.attach(document.getElementById('output'));

// Stream text
streamer.setContent('Hello, how can I help you today?');

// Or append incrementally
streamer.append('Hello, ');
streamer.append('how can I ');
streamer.append('help you today?');
```

### Events

```typescript
streamer.on('update', (displayedContent) => {
  console.log('Currently showing:', displayedContent);
});

streamer.on('complete', (fullContent) => {
  console.log('Finished streaming:', fullContent);
});
```

### Controls

```typescript
// Stop streaming immediately
streamer.stop();

// Clear content
streamer.clear();

// Check state
const content = streamer.getContent();
const displayed = streamer.getDisplayedContent();
const isComplete = streamer.isComplete();
```

## MarkdownRenderer

```typescript
import { MarkdownRenderer } from '@philjs/llm-ui';

const renderer = new MarkdownRenderer();

const html = renderer.render(`
# Hello World

This is **bold** and *italic* text.

\`\`\`javascript
const x = 42;
console.log(x);
\`\`\`

- List item 1
- List item 2
`);

// Renders with:
// - Headings
// - Bold/italic
// - Code blocks with copy button
// - Inline code
// - Lists
// - Links
// - Blockquotes
// - Horizontal rules
```

## useChat Hook

```typescript
import { useChat } from '@philjs/llm-ui';

function ChatComponent() {
  const {
    messages,           // All messages
    isLoading,          // Currently generating
    error,              // Error state
    streamingContent,   // Current streaming content
    send,               // Send message
    regenerate,         // Regenerate response
    clear,              // Clear messages
  } = useChat(
    // Stream function
    async function*(messages) {
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages }),
      });

      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield new TextDecoder().decode(value);
      }
    },
    {
      initialMessages: [
        { id: '1', role: 'system', content: 'You are helpful.', timestamp: new Date() },
      ],
    }
  );

  return (
    <div>
      {messages.map(msg => (
        <Message key={msg.id} message={msg} />
      ))}

      {isLoading && <ThinkingIndicator />}
      {error && <ErrorMessage error={error} />}

      <input
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            send(e.target.value);
            e.target.value = '';
          }
        }}
      />
    </div>
  );
}
```

## useStreamingText Hook

```typescript
import { useStreamingText } from '@philjs/llm-ui';

function StreamingOutput() {
  const {
    content,           // Full content
    displayedContent,  // Currently displayed
    isComplete,        // Streaming finished
    append,            // Append text
    setContent,        // Set full content
    stop,              // Stop streaming
    clear,             // Clear content
    attach,            // Attach to element
  } = useStreamingText({ speed: 100, cursor: true });

  const outputRef = useRef(null);

  useEffect(() => {
    attach(outputRef.current);
  }, []);

  const handleStream = async () => {
    clear();
    for await (const chunk of fetchStream()) {
      append(chunk);
    }
  };

  return (
    <div>
      <div ref={outputRef} />
      <button onClick={handleStream}>Start</button>
      <button onClick={stop}>Stop</button>
    </div>
  );
}
```

## Types Reference

```typescript
// Chat message
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolCalls?: ToolCallDisplay[];
  metadata?: Record<string, any>;
  status?: 'sending' | 'sent' | 'error';
  error?: string;
}

// Tool call display
interface ToolCallDisplay {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
  status: 'pending' | 'running' | 'success' | 'error';
  error?: string;
  duration?: number;
}

// Chat configuration
interface ChatConfig {
  placeholder?: string;
  maxLength?: number;
  showTimestamps?: boolean;
  showAvatars?: boolean;
  enableMarkdown?: boolean;
  enableCodeHighlight?: boolean;
  enableCopy?: boolean;
  enableRegenerate?: boolean;
  enableEdit?: boolean;
  userAvatar?: string;
  assistantAvatar?: string;
  theme?: 'light' | 'dark' | 'system';
}

// Streaming configuration
interface StreamingTextConfig {
  speed?: number;
  cursor?: boolean;
  cursorChar?: string;
}
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `ChatContainer` | Full chat UI component |
| `MessageComponent` | Individual message |
| `ChatInput` | Message input component |
| `ThinkingIndicator` | Loading indicator |
| `StreamingText` | Typewriter text effect |
| `MarkdownRenderer` | Markdown to HTML |

### Hooks

| Hook | Description |
|------|-------------|
| `useChat(streamFn, options?)` | Chat state management |
| `useStreamingText(config?)` | Streaming text control |

## Example: Complete Chat App

```typescript
import { ChatContainer, useChat } from '@philjs/llm-ui';

async function* streamFromAPI(messages) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value);
  }
}

function ChatApp() {
  const containerRef = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => {
    const chat = new ChatContainer(containerRef.current, {
      enableMarkdown: true,
      theme: 'dark',
    });

    chatRef.current = chat;

    chat.on('send', async (message) => {
      const userMsgId = crypto.randomUUID();
      chat.addMessage({
        id: userMsgId,
        role: 'user',
        content: message,
        timestamp: new Date(),
      });

      chat.showThinking();

      const assistantId = crypto.randomUUID();
      chat.addMessage({
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      });

      let fullContent = '';
      for await (const chunk of streamFromAPI([{ role: 'user', content: message }])) {
        fullContent += chunk;
        chat.updateMessage(assistantId, fullContent);
      }

      chat.finishMessage(assistantId);
      chat.hideThinking();
    });

    chat.on('regenerate', async (messageId) => {
      // Find previous user message and regenerate
    });

    return () => chat.clearMessages();
  }, []);

  return <div ref={containerRef} style={{ height: '100vh' }} />;
}
```
