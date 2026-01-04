# Build an AI Chat App with PhilJS

Create a ChatGPT-like interface with streaming responses and conversation history.

**Time to complete**: ~20 minutes

---

## 1. Setup

```bash
pnpm add @philjs/ai
```

## 2. Chat Store

```typescript
// src/stores/chat.ts
import { signal } from '@philjs/core';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export const messages = signal<Message[]>([]);
export const isStreaming = signal(false);
export const currentStreamContent = signal('');

export function addMessage(role: Message['role'], content: string) {
  messages.update((m) => [...m, {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: Date.now(),
  }]);
}
```

## 3. Chat Component

```typescript
// src/components/Chat.tsx
import { signal, effect } from '@philjs/core';
import { useAI } from '@philjs/ai';
import { messages, isStreaming, currentStreamContent, addMessage } from '../stores/chat';
import { Button, Input } from '@philjs/shadcn';

export function Chat() {
  const ai = useAI({ provider: 'openai', model: 'gpt-4' });
  const input = signal('');
  let messagesEndRef: HTMLDivElement;

  // Auto-scroll to bottom
  effect(() => {
    messages();
    messagesEndRef?.scrollIntoView({ behavior: 'smooth' });
  });

  const sendMessage = async () => {
    const content = input().trim();
    if (!content || isStreaming()) return;

    // Add user message
    addMessage('user', content);
    input.set('');
    isStreaming.set(true);
    currentStreamContent.set('');

    try {
      // Stream the response
      const stream = await ai.chat({
        messages: messages().map(m => ({ role: m.role, content: m.content })),
        stream: true,
      });

      for await (const chunk of stream) {
        currentStreamContent.update(c => c + chunk.content);
      }

      // Add complete assistant message
      addMessage('assistant', currentStreamContent());
    } catch (error) {
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    } finally {
      isStreaming.set(false);
      currentStreamContent.set('');
    }
  };

  return (
    <div class="chat-container h-screen flex flex-col">
      {/* Messages */}
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        {messages().map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        
        {/* Streaming indicator */}
        {isStreaming() && (
          <div class="flex gap-2">
            <div class="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white">
              AI
            </div>
            <div class="bg-gray-100 rounded-lg p-3 max-w-[80%]">
              {currentStreamContent() || <TypingIndicator />}
            </div>
          </div>
        )}
        
        <div ref={(el) => messagesEndRef = el} />
      </div>

      {/* Input */}
      <div class="border-t p-4">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} class="flex gap-2">
          <Input
            value={input}
            onInput={(v) => input.set(v)}
            placeholder="Type a message..."
            disabled={isStreaming}
            class="flex-1"
          />
          <Button type="submit" disabled={isStreaming}>
            {isStreaming() ? '...' : 'Send'}
          </Button>
        </form>
      </div>
    </div>
  );
}

function MessageBubble(props: { message: Message }) {
  const isUser = props.message.role === 'user';
  
  return (
    <div class={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div class={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
        isUser ? 'bg-blue-500' : 'bg-purple-500'
      }`}>
        {isUser ? 'U' : 'AI'}
      </div>
      <div class={`rounded-lg p-3 max-w-[80%] ${
        isUser ? 'bg-blue-500 text-white' : 'bg-gray-100'
      }`}>
        {props.message.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div class="flex gap-1">
      <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms" />
      <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms" />
      <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms" />
    </div>
  );
}
```

## Key Concepts

| Feature | Implementation |
|:--------|:---------------|
| Streaming responses | `for await...of` with AI stream |
| Real-time updates | Signals update during stream |
| Message history | Context passed to each request |
| Loading states | `isStreaming` signal |
