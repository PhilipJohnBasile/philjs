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
    speed?: number;
    cursor?: boolean;
    cursorChar?: string;
}
declare class MarkdownRenderer {
    private codeBlockCounter;
    render(markdown: string): string;
    private escapeHtml;
}
declare class StreamingText {
    private element;
    private content;
    private displayedContent;
    private isStreaming;
    private animationFrame;
    private config;
    private listeners;
    constructor(config?: StreamingTextConfig);
    attach(element: HTMLElement): void;
    append(text: string): void;
    setContent(text: string): void;
    private startStreaming;
    private render;
    stop(): void;
    clear(): void;
    getContent(): string;
    getDisplayedContent(): string;
    isComplete(): boolean;
    on(event: string, callback: Function): () => void;
    private emit;
}
interface MessageComponentConfig {
    message: ChatMessage;
    config: ChatConfig;
    onCopy?: (content: string) => void;
    onRegenerate?: (messageId: string) => void;
    onEdit?: (messageId: string, newContent: string) => void;
    onReaction?: (messageId: string, reaction: 'like' | 'dislike') => void;
}
declare class MessageComponent {
    private element;
    private message;
    private config;
    private markdown;
    private streamingText;
    private callbacks;
    constructor(componentConfig: MessageComponentConfig);
    private render;
    private renderToolCall;
    private bindActions;
    private getDefaultAvatar;
    private formatTime;
    private escapeHtml;
    updateContent(content: string): void;
    finishStreaming(): void;
    getElement(): HTMLElement;
}
interface ChatInputConfig {
    placeholder?: string;
    maxLength?: number;
    enableAttachments?: boolean;
    enableVoice?: boolean;
    onSend?: (message: string) => void;
    onAttach?: (files: File[]) => void;
}
declare class ChatInput {
    private element;
    private textarea;
    private config;
    private isSubmitting;
    constructor(config?: ChatInputConfig);
    private render;
    private bindEvents;
    private submit;
    focus(): void;
    setValue(value: string): void;
    getValue(): string;
    disable(): void;
    enable(): void;
    getElement(): HTMLElement;
}
declare class ThinkingIndicator {
    private element;
    constructor();
    show(text?: string): void;
    hide(): void;
    getElement(): HTMLElement;
}
declare class ChatContainer {
    private element;
    private messagesContainer;
    private inputComponent;
    private thinkingIndicator;
    private messages;
    private config;
    private listeners;
    constructor(container: HTMLElement, config?: ChatConfig);
    private render;
    addMessage(message: ChatMessage): void;
    updateMessage(messageId: string, content: string): void;
    finishMessage(messageId: string): void;
    removeMessage(messageId: string): void;
    clearMessages(): void;
    showThinking(text?: string): void;
    hideThinking(): void;
    scrollToBottom(): void;
    focus(): void;
    disable(): void;
    enable(): void;
    on(event: string, callback: Function): () => void;
    private emit;
    private injectStyles;
}
interface UseChatResult {
    messages: ChatMessage[];
    isLoading: boolean;
    error: Error | null;
    streamingContent: string;
    send: (content: string) => Promise<void>;
    regenerate: (messageId: string) => Promise<void>;
    clear: () => void;
}
declare function useChat(sendFn: (messages: ChatMessage[]) => AsyncGenerator<string>, options?: {
    initialMessages?: ChatMessage[];
}): UseChatResult;
declare function useStreamingText(config?: StreamingTextConfig): {
    content: string;
    displayedContent: string;
    isComplete: boolean;
    append: (text: string) => void;
    setContent: (text: string) => void;
    stop: () => void;
    clear: () => void;
    attach: (element: HTMLElement) => void;
};
export { ChatContainer, MessageComponent, ChatInput, ThinkingIndicator, StreamingText, MarkdownRenderer, useChat, useStreamingText, type ChatMessage, type ToolCallDisplay, type ChatConfig, type StreamingTextConfig, type ChatInputConfig, type MessageComponentConfig, type UseChatResult };
//# sourceMappingURL=index.d.ts.map