import { signal } from 'philjs-core';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatAssistantProps {
  title?: string;
  placeholder?: string;
  suggestedPrompts?: string[];
  onSendMessage?: (message: string) => Promise<string>;
}

// Mock AI responses for demonstration
const mockAIResponses: Record<string, string> = {
  default:
    "I'm a documentation AI assistant. I can help you understand PhilJS concepts, find code examples, and answer questions about the framework. Try asking me about signals, effects, or any other PhilJS feature!",
  signal:
    "Signals are the core of PhilJS's reactivity system. Create a signal with `const count = signal(0)`, read it with `count()`, and update it with `count.set(1)`. Signals automatically track dependencies and update the UI efficiently.",
  effect:
    "Effects run automatically when their dependencies change. Use `effect(() => { console.log(count()); })` to create an effect. The effect will re-run whenever `count` changes.",
  component:
    "PhilJS components are just functions that return JSX. They can use signals for reactive state. Example:\n```typescript\nfunction Counter() {\n  const count = signal(0);\n  return <button onClick={() => count.set(count() + 1)}>{count()}</button>;\n}\n```",
  performance:
    "PhilJS is extremely fast because it uses fine-grained reactivity. Only the specific DOM nodes that depend on changed signals are updated, not entire components. This means no virtual DOM diffing!",
  routing:
    "PhilJS Router provides file-based routing. Create files in `src/pages/` and they automatically become routes. Use `<Link to=\"/path\">` for navigation.",
};

export function AIChatAssistant({
  title = '💬 Ask the AI Assistant',
  placeholder = 'Ask a question about PhilJS...',
  suggestedPrompts = [
    'How do signals work?',
    'Explain effects in PhilJS',
    'Show me a component example',
    'What makes PhilJS fast?',
  ],
  onSendMessage,
}: AIChatAssistantProps) {
  const messages = signal<Message[]>([]);
  const inputValue = signal('');
  const isTyping = signal(false);
  const isExpanded = signal(false);

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('signal')) {
      return mockAIResponses.signal;
    } else if (lowerMessage.includes('effect')) {
      return mockAIResponses.effect;
    } else if (lowerMessage.includes('component')) {
      return mockAIResponses.component;
    } else if (lowerMessage.includes('fast') || lowerMessage.includes('performance')) {
      return mockAIResponses.performance;
    } else if (lowerMessage.includes('routing') || lowerMessage.includes('router')) {
      return mockAIResponses.routing;
    } else {
      return mockAIResponses.default;
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    messages.set([...messages(), userMessage]);
    inputValue.set('');
    isTyping.set(true);

    // Simulate AI thinking time
    await new Promise((resolve) => setTimeout(resolve, 800));

    let aiResponse: string;
    if (onSendMessage) {
      try {
        aiResponse = await onSendMessage(content);
      } catch (error) {
        aiResponse = "I'm having trouble connecting right now. Please try again later.";
      }
    } else {
      aiResponse = generateResponse(content);
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
    };

    messages.set([...messages(), assistantMessage]);
    isTyping.set(false);
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    sendMessage(inputValue());
  };

  const handleSuggestedPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const clearChat = () => {
    messages.set([]);
  };

  if (!isExpanded()) {
    return (
      <button
        onClick={() => isExpanded.set(true)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-brand) 0%, #8b5cf6 100%)',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.75rem',
          transition: 'all var(--transition-fast)',
          zIndex: 1000,
        }}
        aria-label="Open AI assistant"
      >
        💬
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        width: '420px',
        maxWidth: 'calc(100vw - 2rem)',
        height: '600px',
        maxHeight: 'calc(100vh - 4rem)',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--color-brand) 0%, #8b5cf6 100%)',
          color: 'white',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🤖</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{title}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
              {isTyping() ? 'Typing...' : 'Online'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {messages().length > 0 && (
            <button
              onClick={clearChat}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                transition: 'all var(--transition-fast)',
              }}
              aria-label="Clear chat"
              title="Clear chat"
            >
              🗑️
            </button>
          )}
          <button
            onClick={() => isExpanded.set(false)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '6px',
              padding: '0.5rem 0.75rem',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1.25rem',
              lineHeight: 1,
              transition: 'all var(--transition-fast)',
            }}
            aria-label="Minimize chat"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          background: 'var(--color-bg-alt)',
        }}
      >
        {messages().length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              gap: '1.5rem',
            }}
          >
            <div style={{ fontSize: '3rem' }}>👋</div>
            <div>
              <div
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  marginBottom: '0.5rem',
                }}
              >
                Hi! I'm your PhilJS assistant
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                Ask me anything about the framework
              </div>
            </div>

            {/* Suggested prompts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text)',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  💡 {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages().map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background:
                      message.role === 'user' ? 'var(--color-brand)' : 'var(--color-bg)',
                    border: message.role === 'assistant' ? '2px solid var(--color-brand)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    flexShrink: 0,
                  }}
                >
                  {message.role === 'user' ? '👤' : '🤖'}
                </div>

                {/* Message bubble */}
                <div
                  style={{
                    maxWidth: '75%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background:
                      message.role === 'user'
                        ? 'var(--color-brand)'
                        : 'var(--color-bg)',
                    border:
                      message.role === 'assistant' ? '1px solid var(--color-border)' : 'none',
                    color: message.role === 'user' ? 'white' : 'var(--color-text)',
                    fontSize: '0.9375rem',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping() && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--color-bg)',
                    border: '2px solid var(--color-brand)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    flexShrink: 0,
                  }}
                >
                  🤖
                </div>
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    gap: '0.25rem',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--color-brand)',
                      animation: 'bounce 1.4s infinite ease-in-out',
                      animationDelay: '0s',
                    }}
                  />
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--color-brand)',
                      animation: 'bounce 1.4s infinite ease-in-out',
                      animationDelay: '0.2s',
                    }}
                  />
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--color-brand)',
                      animation: 'bounce 1.4s infinite ease-in-out',
                      animationDelay: '0.4s',
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '1rem',
          background: 'var(--color-bg)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          gap: '0.75rem',
          flexShrink: 0,
        }}
      >
        <input
          type="text"
          value={inputValue()}
          onInput={(e) => inputValue.set((e.target as HTMLInputElement).value)}
          placeholder={placeholder}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            background: 'var(--color-bg-alt)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            color: 'var(--color-text)',
            fontSize: '0.9375rem',
            outline: 'none',
            transition: 'border-color var(--transition-fast)',
          }}
          disabled={isTyping()}
        />
        <button
          type="submit"
          disabled={!inputValue().trim() || isTyping()}
          style={{
            padding: '0.75rem 1.25rem',
            background: inputValue().trim() && !isTyping() ? 'var(--color-brand)' : 'var(--color-bg-alt)',
            border: 'none',
            borderRadius: '8px',
            color: inputValue().trim() && !isTyping() ? 'white' : 'var(--color-text-secondary)',
            fontSize: '0.9375rem',
            fontWeight: 500,
            cursor: inputValue().trim() && !isTyping() ? 'pointer' : 'not-allowed',
            transition: 'all var(--transition-fast)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
          aria-label="Send message"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            style={{
              transform: 'rotate(45deg)',
            }}
          >
            <line x1="22" y1="2" x2="11" y2="13" stroke-width="2" stroke-linecap="round" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Send
        </button>
      </form>

      {/* Inline CSS for typing animation */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          40% {
            transform: translateY(-6px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
