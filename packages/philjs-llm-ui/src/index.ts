/**
 * @philjs/llm-ui - Streaming chat UI components for PhilJS
 *
 * Features:
 * - Streaming text with typewriter effect
 * - Markdown rendering with syntax highlighting
 * - Code blocks with copy button
 * - Message bubbles with avatars
 * - Thinking/loading indicators
 * - Tool call visualization
 * - Regenerate and edit support
 * - Message actions (copy, like, dislike)
 * - Auto-scroll and scroll-to-bottom
 * - Mobile-responsive chat interface
 */

// ============================================================================
// TYPES
// ============================================================================

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

interface ToolCallDisplay {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
  status: 'pending' | 'running' | 'success' | 'error';
  error?: string;
  duration?: number;
}

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

interface StreamingTextConfig {
  speed?: number; // chars per second
  cursor?: boolean;
  cursorChar?: string;
}

// ============================================================================
// MARKDOWN PARSER
// ============================================================================

class MarkdownRenderer {
  private codeBlockCounter = 0;

  render(markdown: string): string {
    let html = markdown;

    // Code blocks with syntax highlighting
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
      const id = `code-block-${this.codeBlockCounter++}`;
      const langClass = lang ? `language-${lang}` : '';
      return `
        <div class="code-block" data-id="${id}">
          <div class="code-header">
            <span class="code-lang">${lang || 'text'}</span>
            <button class="copy-btn" data-code-id="${id}" onclick="copyCode('${id}')">Copy</button>
          </div>
          <pre><code class="${langClass}" id="${id}">${this.escapeHtml(code.trim())}</code></pre>
        </div>
      `;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // Lists
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Numbered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Blockquotes
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr>');

    // Paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = `<p>${html}</p>`;

    // Line breaks
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// ============================================================================
// STREAMING TEXT
// ============================================================================

class StreamingText {
  private element: HTMLElement | null = null;
  private content = '';
  private displayedContent = '';
  private isStreaming = false;
  private animationFrame: number | null = null;
  private config: Required<StreamingTextConfig>;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(config: StreamingTextConfig = {}) {
    this.config = {
      speed: config.speed ?? 50,
      cursor: config.cursor ?? true,
      cursorChar: config.cursorChar ?? '▊'
    };
  }

  attach(element: HTMLElement): void {
    this.element = element;
  }

  append(text: string): void {
    this.content += text;
    if (!this.isStreaming) {
      this.startStreaming();
    }
  }

  setContent(text: string): void {
    this.content = text;
    this.displayedContent = '';
    if (!this.isStreaming) {
      this.startStreaming();
    }
  }

  private startStreaming(): void {
    this.isStreaming = true;
    const startTime = performance.now();
    const startLength = this.displayedContent.length;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const charsToShow = Math.floor((elapsed / 1000) * this.config.speed);
      const targetLength = Math.min(startLength + charsToShow, this.content.length);

      if (this.displayedContent.length < targetLength) {
        this.displayedContent = this.content.slice(0, targetLength);
        this.render();
      }

      if (this.displayedContent.length < this.content.length) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.isStreaming = false;
        this.render();
        this.emit('complete', this.content);
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  private render(): void {
    if (!this.element) return;

    let html = this.displayedContent;

    if (this.isStreaming && this.config.cursor) {
      html += `<span class="cursor">${this.config.cursorChar}</span>`;
    }

    this.element.innerHTML = html;
    this.emit('update', this.displayedContent);
  }

  stop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.displayedContent = this.content;
    this.isStreaming = false;
    this.render();
  }

  clear(): void {
    this.stop();
    this.content = '';
    this.displayedContent = '';
    if (this.element) {
      this.element.innerHTML = '';
    }
  }

  getContent(): string {
    return this.content;
  }

  getDisplayedContent(): string {
    return this.displayedContent;
  }

  isComplete(): boolean {
    return !this.isStreaming && this.displayedContent === this.content;
  }

  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }
}

// ============================================================================
// CHAT MESSAGE COMPONENT
// ============================================================================

interface MessageComponentConfig {
  message: ChatMessage;
  config: ChatConfig;
  onCopy?: (content: string) => void;
  onRegenerate?: (messageId: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onReaction?: (messageId: string, reaction: 'like' | 'dislike') => void;
}

class MessageComponent {
  private element: HTMLElement;
  private message: ChatMessage;
  private config: ChatConfig;
  private markdown: MarkdownRenderer;
  private streamingText: StreamingText | null = null;
  private callbacks: Omit<MessageComponentConfig, 'message' | 'config'>;

  constructor(componentConfig: MessageComponentConfig) {
    this.message = componentConfig.message;
    this.config = componentConfig.config;
    this.markdown = new MarkdownRenderer();
    this.callbacks = componentConfig;

    this.element = document.createElement('div');
    this.element.className = `chat-message ${this.message.role}`;
    this.element.dataset.messageId = this.message.id;

    this.render();
  }

  private render(): void {
    const { message, config } = this;

    // Avatar
    let avatarHtml = '';
    if (config.showAvatars) {
      const avatarSrc = message.role === 'user'
        ? config.userAvatar || this.getDefaultAvatar('user')
        : config.assistantAvatar || this.getDefaultAvatar('assistant');
      avatarHtml = `<img class="message-avatar" src="${avatarSrc}" alt="${message.role}">`;
    }

    // Content
    let contentHtml = '';
    if (message.isStreaming) {
      contentHtml = `<div class="message-content streaming" id="content-${message.id}"></div>`;
    } else if (config.enableMarkdown) {
      contentHtml = `<div class="message-content">${this.markdown.render(message.content)}</div>`;
    } else {
      contentHtml = `<div class="message-content">${this.escapeHtml(message.content)}</div>`;
    }

    // Tool calls
    let toolCallsHtml = '';
    if (message.toolCalls && message.toolCalls.length > 0) {
      toolCallsHtml = `
        <div class="tool-calls">
          ${message.toolCalls.map(tc => this.renderToolCall(tc)).join('')}
        </div>
      `;
    }

    // Timestamp
    let timestampHtml = '';
    if (config.showTimestamps) {
      timestampHtml = `<span class="message-timestamp">${this.formatTime(message.timestamp)}</span>`;
    }

    // Actions
    let actionsHtml = '';
    if (message.role === 'assistant' && !message.isStreaming) {
      actionsHtml = `
        <div class="message-actions">
          ${config.enableCopy ? `<button class="action-btn copy" title="Copy">📋</button>` : ''}
          ${config.enableRegenerate ? `<button class="action-btn regenerate" title="Regenerate">🔄</button>` : ''}
          <button class="action-btn like" title="Helpful">👍</button>
          <button class="action-btn dislike" title="Not helpful">👎</button>
        </div>
      `;
    }

    // Status/Error
    let statusHtml = '';
    if (message.status === 'error' && message.error) {
      statusHtml = `<div class="message-error">${message.error}</div>`;
    }

    this.element.innerHTML = `
      ${avatarHtml}
      <div class="message-body">
        ${contentHtml}
        ${toolCallsHtml}
        ${statusHtml}
        <div class="message-footer">
          ${timestampHtml}
          ${actionsHtml}
        </div>
      </div>
    `;

    // Set up streaming if needed
    if (message.isStreaming) {
      const contentEl = this.element.querySelector(`#content-${message.id}`) as HTMLElement;
      if (contentEl) {
        this.streamingText = new StreamingText({ speed: 100, cursor: true });
        this.streamingText.attach(contentEl);
        this.streamingText.setContent(message.content);
      }
    }

    // Bind action handlers
    this.bindActions();
  }

  private renderToolCall(toolCall: ToolCallDisplay): string {
    const statusIcon = {
      pending: '⏳',
      running: '🔄',
      success: '✅',
      error: '❌'
    }[toolCall.status];

    const argsPreview = JSON.stringify(toolCall.arguments).slice(0, 50);
    const resultPreview = toolCall.result
      ? JSON.stringify(toolCall.result).slice(0, 100)
      : '';

    return `
      <div class="tool-call ${toolCall.status}">
        <div class="tool-call-header">
          <span class="tool-status">${statusIcon}</span>
          <span class="tool-name">${toolCall.name}</span>
          ${toolCall.duration ? `<span class="tool-duration">${toolCall.duration}ms</span>` : ''}
        </div>
        <div class="tool-call-args">
          <details>
            <summary>Arguments</summary>
            <pre><code>${JSON.stringify(toolCall.arguments, null, 2)}</code></pre>
          </details>
        </div>
        ${resultPreview ? `
          <div class="tool-call-result">
            <details>
              <summary>Result</summary>
              <pre><code>${JSON.stringify(toolCall.result, null, 2)}</code></pre>
            </details>
          </div>
        ` : ''}
        ${toolCall.error ? `<div class="tool-call-error">${toolCall.error}</div>` : ''}
      </div>
    `;
  }

  private bindActions(): void {
    const copyBtn = this.element.querySelector('.action-btn.copy');
    const regenerateBtn = this.element.querySelector('.action-btn.regenerate');
    const likeBtn = this.element.querySelector('.action-btn.like');
    const dislikeBtn = this.element.querySelector('.action-btn.dislike');

    copyBtn?.addEventListener('click', () => {
      navigator.clipboard.writeText(this.message.content);
      this.callbacks.onCopy?.(this.message.content);
    });

    regenerateBtn?.addEventListener('click', () => {
      this.callbacks.onRegenerate?.(this.message.id);
    });

    likeBtn?.addEventListener('click', () => {
      this.callbacks.onReaction?.(this.message.id, 'like');
    });

    dislikeBtn?.addEventListener('click', () => {
      this.callbacks.onReaction?.(this.message.id, 'dislike');
    });
  }

  private getDefaultAvatar(role: string): string {
    // SVG data URLs for default avatars
    if (role === 'user') {
      return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%234a5568"><circle cx="12" cy="8" r="4"/><path d="M12 14c-6 0-8 3-8 6v2h16v-2c0-3-2-6-8-6z"/></svg>';
    }
    return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236366f1"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="10" r="2" fill="white"/><circle cx="15" cy="10" r="2" fill="white"/><path d="M8 15h8" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>';
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  updateContent(content: string): void {
    this.message.content = content;
    if (this.streamingText) {
      this.streamingText.append(content.slice(this.streamingText.getContent().length));
    }
  }

  finishStreaming(): void {
    this.message.isStreaming = false;
    if (this.streamingText) {
      this.streamingText.stop();
    }
    this.render();
  }

  getElement(): HTMLElement {
    return this.element;
  }
}

// ============================================================================
// CHAT INPUT COMPONENT
// ============================================================================

interface ChatInputConfig {
  placeholder?: string;
  maxLength?: number;
  enableAttachments?: boolean;
  enableVoice?: boolean;
  onSend?: (message: string) => void;
  onAttach?: (files: File[]) => void;
}

class ChatInput {
  private element: HTMLElement;
  private textarea: HTMLTextAreaElement;
  private config: ChatInputConfig;
  private isSubmitting = false;

  constructor(config: ChatInputConfig = {}) {
    this.config = config;

    this.element = document.createElement('div');
    this.element.className = 'chat-input-container';

    this.textarea = document.createElement('textarea');
    this.textarea.className = 'chat-input';
    this.textarea.placeholder = config.placeholder || 'Type a message...';
    if (config.maxLength) {
      this.textarea.maxLength = config.maxLength;
    }

    this.render();
    this.bindEvents();
  }

  private render(): void {
    let attachBtnHtml = '';
    if (this.config.enableAttachments) {
      attachBtnHtml = `<button class="input-action attach" title="Attach file">📎</button>`;
    }

    let voiceBtnHtml = '';
    if (this.config.enableVoice) {
      voiceBtnHtml = `<button class="input-action voice" title="Voice input">🎤</button>`;
    }

    this.element.innerHTML = `
      <div class="input-wrapper">
        ${attachBtnHtml}
        <div class="textarea-container"></div>
        ${voiceBtnHtml}
        <button class="input-action send" title="Send">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
          </svg>
        </button>
      </div>
    `;

    const textareaContainer = this.element.querySelector('.textarea-container')!;
    textareaContainer.appendChild(this.textarea);
  }

  private bindEvents(): void {
    // Auto-resize textarea
    this.textarea.addEventListener('input', () => {
      this.textarea.style.height = 'auto';
      this.textarea.style.height = Math.min(this.textarea.scrollHeight, 200) + 'px';
    });

    // Handle enter key
    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.submit();
      }
    });

    // Send button
    const sendBtn = this.element.querySelector('.input-action.send');
    sendBtn?.addEventListener('click', () => this.submit());

    // Attach button
    const attachBtn = this.element.querySelector('.input-action.attach');
    if (attachBtn) {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.multiple = true;
      fileInput.style.display = 'none';

      attachBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', () => {
        if (fileInput.files) {
          this.config.onAttach?.(Array.from(fileInput.files));
        }
      });
    }
  }

  private submit(): void {
    if (this.isSubmitting) return;

    const message = this.textarea.value.trim();
    if (!message) return;

    this.isSubmitting = true;
    this.config.onSend?.(message);
    this.textarea.value = '';
    this.textarea.style.height = 'auto';
    this.isSubmitting = false;
  }

  focus(): void {
    this.textarea.focus();
  }

  setValue(value: string): void {
    this.textarea.value = value;
  }

  getValue(): string {
    return this.textarea.value;
  }

  disable(): void {
    this.textarea.disabled = true;
  }

  enable(): void {
    this.textarea.disabled = false;
  }

  getElement(): HTMLElement {
    return this.element;
  }
}

// ============================================================================
// THINKING INDICATOR
// ============================================================================

class ThinkingIndicator {
  private element: HTMLElement;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'thinking-indicator';
    this.element.innerHTML = `
      <div class="thinking-dots">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
      <span class="thinking-text">Thinking...</span>
    `;
    this.element.style.display = 'none';
  }

  show(text = 'Thinking...'): void {
    const textEl = this.element.querySelector('.thinking-text');
    if (textEl) textEl.textContent = text;
    this.element.style.display = 'flex';
  }

  hide(): void {
    this.element.style.display = 'none';
  }

  getElement(): HTMLElement {
    return this.element;
  }
}

// ============================================================================
// CHAT CONTAINER
// ============================================================================

class ChatContainer {
  private element: HTMLElement;
  private messagesContainer: HTMLElement;
  private inputComponent: ChatInput;
  private thinkingIndicator: ThinkingIndicator;
  private messages: Map<string, MessageComponent> = new Map();
  private config: ChatConfig;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(container: HTMLElement, config: ChatConfig = {}) {
    this.config = {
      placeholder: 'Type a message...',
      showTimestamps: true,
      showAvatars: true,
      enableMarkdown: true,
      enableCodeHighlight: true,
      enableCopy: true,
      enableRegenerate: true,
      enableEdit: false,
      theme: 'system',
      ...config
    };

    this.element = container;
    this.element.className = `chat-container theme-${this.config.theme}`;

    // Create messages container
    this.messagesContainer = document.createElement('div');
    this.messagesContainer.className = 'chat-messages';

    // Create thinking indicator
    this.thinkingIndicator = new ThinkingIndicator();

    // Create input
    this.inputComponent = new ChatInput({
      placeholder: this.config.placeholder,
      maxLength: this.config.maxLength,
      onSend: (message) => this.emit('send', message)
    });

    this.render();
    this.injectStyles();
  }

  private render(): void {
    this.element.innerHTML = '';
    this.element.appendChild(this.messagesContainer);
    this.messagesContainer.appendChild(this.thinkingIndicator.getElement());
    this.element.appendChild(this.inputComponent.getElement());
  }

  addMessage(message: ChatMessage): void {
    const component = new MessageComponent({
      message,
      config: this.config,
      onCopy: (content) => this.emit('copy', { messageId: message.id, content }),
      onRegenerate: (id) => this.emit('regenerate', id),
      onEdit: (id, content) => this.emit('edit', { messageId: id, content }),
      onReaction: (id, reaction) => this.emit('reaction', { messageId: id, reaction })
    });

    this.messages.set(message.id, component);
    this.messagesContainer.insertBefore(
      component.getElement(),
      this.thinkingIndicator.getElement()
    );

    this.scrollToBottom();
  }

  updateMessage(messageId: string, content: string): void {
    const component = this.messages.get(messageId);
    if (component) {
      component.updateContent(content);
      this.scrollToBottom();
    }
  }

  finishMessage(messageId: string): void {
    const component = this.messages.get(messageId);
    if (component) {
      component.finishStreaming();
    }
  }

  removeMessage(messageId: string): void {
    const component = this.messages.get(messageId);
    if (component) {
      component.getElement().remove();
      this.messages.delete(messageId);
    }
  }

  clearMessages(): void {
    this.messages.forEach(component => component.getElement().remove());
    this.messages.clear();
  }

  showThinking(text?: string): void {
    this.thinkingIndicator.show(text);
    this.scrollToBottom();
  }

  hideThinking(): void {
    this.thinkingIndicator.hide();
  }

  scrollToBottom(): void {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  focus(): void {
    this.inputComponent.focus();
  }

  disable(): void {
    this.inputComponent.disable();
  }

  enable(): void {
    this.inputComponent.enable();
  }

  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  private injectStyles(): void {
    if (document.getElementById('philjs-llm-ui-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'philjs-llm-ui-styles';
    styles.textContent = `
      .chat-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .chat-container.theme-dark {
        --bg-primary: #1a1a1a;
        --bg-secondary: #2d2d2d;
        --text-primary: #ffffff;
        --text-secondary: #a0a0a0;
        --border-color: #404040;
        --user-bg: #3b82f6;
        --assistant-bg: #2d2d2d;
      }

      .chat-container.theme-light {
        --bg-primary: #ffffff;
        --bg-secondary: #f3f4f6;
        --text-primary: #1f2937;
        --text-secondary: #6b7280;
        --border-color: #e5e7eb;
        --user-bg: #3b82f6;
        --assistant-bg: #f3f4f6;
      }

      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: var(--bg-primary);
      }

      .chat-message {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        max-width: 80%;
      }

      .chat-message.user {
        margin-left: auto;
        flex-direction: row-reverse;
      }

      .message-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .message-body {
        background: var(--assistant-bg);
        padding: 12px 16px;
        border-radius: 12px;
        color: var(--text-primary);
      }

      .chat-message.user .message-body {
        background: var(--user-bg);
        color: white;
      }

      .message-content {
        line-height: 1.5;
      }

      .message-content.streaming .cursor {
        animation: blink 1s step-end infinite;
      }

      @keyframes blink {
        50% { opacity: 0; }
      }

      .message-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 8px;
        font-size: 12px;
        color: var(--text-secondary);
      }

      .message-actions {
        display: flex;
        gap: 4px;
      }

      .action-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        opacity: 0.6;
        transition: opacity 0.2s;
      }

      .action-btn:hover {
        opacity: 1;
      }

      .code-block {
        margin: 8px 0;
        border-radius: 8px;
        overflow: hidden;
        background: #1e1e1e;
      }

      .code-header {
        display: flex;
        justify-content: space-between;
        padding: 8px 12px;
        background: #2d2d2d;
        font-size: 12px;
        color: #a0a0a0;
      }

      .copy-btn {
        background: none;
        border: none;
        color: #a0a0a0;
        cursor: pointer;
        font-size: 12px;
      }

      .copy-btn:hover {
        color: white;
      }

      .code-block pre {
        margin: 0;
        padding: 12px;
        overflow-x: auto;
      }

      .code-block code {
        font-family: 'Fira Code', 'Consolas', monospace;
        font-size: 13px;
        color: #d4d4d4;
      }

      .inline-code {
        background: var(--bg-secondary);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 0.9em;
      }

      .tool-calls {
        margin-top: 12px;
        border-top: 1px solid var(--border-color);
        padding-top: 8px;
      }

      .tool-call {
        padding: 8px;
        margin: 4px 0;
        border-radius: 6px;
        background: var(--bg-secondary);
        font-size: 13px;
      }

      .tool-call-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
      }

      .tool-duration {
        font-size: 11px;
        color: var(--text-secondary);
        margin-left: auto;
      }

      .thinking-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        color: var(--text-secondary);
      }

      .thinking-dots {
        display: flex;
        gap: 4px;
      }

      .thinking-dots .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--text-secondary);
        animation: bounce 1.4s ease-in-out infinite;
      }

      .thinking-dots .dot:nth-child(2) { animation-delay: 0.2s; }
      .thinking-dots .dot:nth-child(3) { animation-delay: 0.4s; }

      @keyframes bounce {
        0%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-6px); }
      }

      .chat-input-container {
        padding: 16px;
        border-top: 1px solid var(--border-color);
        background: var(--bg-primary);
      }

      .input-wrapper {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        background: var(--bg-secondary);
        border-radius: 12px;
        padding: 8px 12px;
      }

      .textarea-container {
        flex: 1;
      }

      .chat-input {
        width: 100%;
        border: none;
        background: transparent;
        resize: none;
        font-size: 14px;
        line-height: 1.5;
        color: var(--text-primary);
        max-height: 200px;
      }

      .chat-input:focus {
        outline: none;
      }

      .chat-input::placeholder {
        color: var(--text-secondary);
      }

      .input-action {
        background: none;
        border: none;
        cursor: pointer;
        padding: 8px;
        color: var(--text-secondary);
        transition: color 0.2s;
      }

      .input-action:hover {
        color: var(--text-primary);
      }

      .input-action.send {
        color: var(--user-bg);
      }
    `;

    document.head.appendChild(styles);
  }
}

// ============================================================================
// REACT HOOKS
// ============================================================================

interface UseChatResult {
  messages: ChatMessage[];
  isLoading: boolean;
  error: Error | null;
  streamingContent: string;
  send: (content: string) => Promise<void>;
  regenerate: (messageId: string) => Promise<void>;
  clear: () => void;
}

function useChat(
  sendFn: (messages: ChatMessage[]) => AsyncGenerator<string>,
  options?: { initialMessages?: ChatMessage[] }
): UseChatResult {
  let messages: ChatMessage[] = options?.initialMessages || [];
  let isLoading = false;
  let error: Error | null = null;
  let streamingContent = '';

  const send = async (content: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    messages = [...messages, userMessage];
    isLoading = true;
    error = null;
    streamingContent = '';

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    messages = [...messages, assistantMessage];

    try {
      for await (const chunk of sendFn(messages)) {
        streamingContent += chunk;
        assistantMessage.content = streamingContent;
      }

      assistantMessage.isStreaming = false;
    } catch (e) {
      error = e instanceof Error ? e : new Error('Send failed');
      assistantMessage.status = 'error';
      assistantMessage.error = error.message;
    } finally {
      isLoading = false;
    }
  };

  const regenerate = async (messageId: string) => {
    const index = messages.findIndex(m => m.id === messageId);
    if (index === -1 || messages[index].role !== 'assistant') return;

    // Remove assistant message and get last user message
    messages = messages.slice(0, index);
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');

    if (lastUserMessage) {
      await send(lastUserMessage.content);
    }
  };

  const clear = () => {
    messages = [];
    streamingContent = '';
    error = null;
  };

  return {
    messages,
    isLoading,
    error,
    streamingContent,
    send,
    regenerate,
    clear
  };
}

function useStreamingText(config?: StreamingTextConfig): {
  content: string;
  displayedContent: string;
  isComplete: boolean;
  append: (text: string) => void;
  setContent: (text: string) => void;
  stop: () => void;
  clear: () => void;
  attach: (element: HTMLElement) => void;
} {
  const streamer = new StreamingText(config);

  return {
    content: streamer.getContent(),
    displayedContent: streamer.getDisplayedContent(),
    isComplete: streamer.isComplete(),
    append: (text) => streamer.append(text),
    setContent: (text) => streamer.setContent(text),
    stop: () => streamer.stop(),
    clear: () => streamer.clear(),
    attach: (el) => streamer.attach(el)
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Core classes
  ChatContainer,
  MessageComponent,
  ChatInput,
  ThinkingIndicator,
  StreamingText,
  MarkdownRenderer,

  // Hooks
  useChat,
  useStreamingText,

  // Types
  type ChatMessage,
  type ToolCallDisplay,
  type ChatConfig,
  type StreamingTextConfig,
  type ChatInputConfig,
  type MessageComponentConfig,
  type UseChatResult
};
