/**
 * @philjs/voice - Voice UI Primitives
 *
 * Build voice-first interfaces with natural language understanding.
 * NO OTHER FRAMEWORK provides native voice UI components.
 *
 * Features:
 * - Web Speech API integration (recognition + synthesis)
 * - Voice commands with intent matching
 * - Natural language processing
 * - Multi-language support
 * - Wake word detection
 * - Voice-driven navigation
 * - Accessibility through voice
 * - Conversational UI components
 */
export interface VoiceConfig {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
    maxAlternatives?: number;
    wakeWord?: string;
    wakeWordSensitivity?: number;
    speechRate?: number;
    speechPitch?: number;
    speechVolume?: number;
    voice?: string;
}
export interface VoiceCommand {
    pattern: string | RegExp;
    handler: (match: VoiceMatch) => void | Promise<void>;
    priority?: number;
    description?: string;
}
export interface VoiceMatch {
    transcript: string;
    confidence: number;
    matches: string[];
    intent?: string;
    entities?: Record<string, string>;
}
export interface SpeechResult {
    transcript: string;
    confidence: number;
    isFinal: boolean;
    alternatives: Array<{
        transcript: string;
        confidence: number;
    }>;
}
export interface VoiceState {
    isListening: boolean;
    isProcessing: boolean;
    isSpeaking: boolean;
    transcript: string;
    error: string | null;
    wakeWordDetected: boolean;
}
export interface ConversationTurn {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    intent?: string;
    entities?: Record<string, string>;
}
export interface VoiceAssistantConfig extends VoiceConfig {
    name?: string;
    greeting?: string;
    fallbackResponse?: string;
    confirmationPhrases?: string[];
    cancelPhrases?: string[];
    aiProvider?: 'openai' | 'anthropic' | 'local';
    aiApiKey?: string;
}
export declare class SpeechRecognitionEngine {
    private recognition;
    private config;
    private listeners;
    private isListening;
    constructor(config?: VoiceConfig);
    private initRecognition;
    start(): void;
    stop(): void;
    abort(): void;
    on(event: string, callback: (...args: any[]) => void): () => void;
    private emit;
    setLanguage(language: string): void;
    static isSupported(): boolean;
}
export declare class SpeechSynthesisEngine {
    private synth;
    private config;
    private currentUtterance;
    private voicesLoaded;
    private voices;
    constructor(config?: VoiceConfig);
    private loadVoices;
    speak(text: string, options?: Partial<VoiceConfig>): Promise<void>;
    stop(): void;
    pause(): void;
    resume(): void;
    isSpeaking(): boolean;
    getVoices(): SpeechSynthesisVoice[];
    getVoicesForLanguage(language: string): SpeechSynthesisVoice[];
    static isSupported(): boolean;
}
export declare class VoiceCommandSystem {
    private recognition;
    private commands;
    private wakeWord;
    private isAwake;
    private awakeTimeout;
    private awakeTimeoutMs;
    constructor(config?: VoiceConfig);
    registerCommand(command: VoiceCommand): () => void;
    registerCommands(commands: VoiceCommand[]): () => void;
    private processCommand;
    private matchCommand;
    private resetAwakeTimeout;
    start(): void;
    stop(): void;
    setWakeWord(word: string | null): void;
    getCommands(): VoiceCommand[];
}
export declare class IntentParser {
    private intents;
    constructor();
    registerIntent(name: string, patterns: Array<{
        pattern: RegExp;
        entities: string[];
    }>): void;
    parse(transcript: string): VoiceMatch | null;
}
export declare class VoiceAssistant {
    private recognition;
    private synthesis;
    private commands;
    private intentParser;
    private config;
    private conversation;
    private listeners;
    private state;
    constructor(config?: VoiceAssistantConfig);
    private setupEventHandlers;
    private handleUserInput;
    private handleIntent;
    private callAI;
    private getHelpMessage;
    respond(text: string): Promise<void>;
    registerCommand(command: VoiceCommand): () => void;
    registerIntent(name: string, patterns: Array<{
        pattern: RegExp;
        entities: string[];
    }>): void;
    start(): Promise<void>;
    stop(): void;
    getState(): VoiceState;
    getConversation(): ConversationTurn[];
    clearConversation(): void;
    on(event: string, callback: (...args: any[]) => void): () => void;
    private emit;
    private updateState;
}
export declare class VoiceNavigation {
    private commands;
    private routeMap;
    private onNavigate;
    constructor(onNavigate: (path: string) => void, config?: VoiceConfig);
    private setupNavigationCommands;
    mapRoute(phrase: string, path: string): void;
    mapRoutes(routes: Record<string, string>): void;
    private navigateTo;
    start(): void;
    stop(): void;
}
/**
 * Hook for speech recognition
 */
export declare function useSpeechRecognition(config?: VoiceConfig): {
    transcript: string;
    isListening: boolean;
    start: () => void;
    stop: () => void;
    error: string | null;
    supported: boolean;
};
/**
 * Hook for speech synthesis
 */
export declare function useSpeechSynthesis(config?: VoiceConfig): {
    speak: (text: string) => Promise<void>;
    stop: () => void;
    pause: () => void;
    resume: () => void;
    isSpeaking: boolean;
    voices: SpeechSynthesisVoice[];
    supported: boolean;
};
/**
 * Hook for voice commands
 */
export declare function useVoiceCommands(commands: VoiceCommand[], config?: VoiceConfig): {
    isListening: boolean;
    start: () => void;
    stop: () => void;
    setWakeWord: (word: string | null) => void;
};
/**
 * Hook for voice assistant
 */
export declare function useVoiceAssistant(config?: VoiceAssistantConfig): {
    state: VoiceState;
    conversation: ConversationTurn[];
    start: () => Promise<void>;
    stop: () => void;
    respond: (text: string) => Promise<void>;
    registerCommand: (command: VoiceCommand) => () => void;
    clearConversation: () => void;
};
/**
 * Hook for voice navigation
 */
export declare function useVoiceNavigation(onNavigate: (path: string) => void, routes?: Record<string, string>, config?: VoiceConfig): {
    start: () => void;
    stop: () => void;
    mapRoute: (phrase: string, path: string) => void;
};
declare const _default: {
    SpeechRecognitionEngine: typeof SpeechRecognitionEngine;
    SpeechSynthesisEngine: typeof SpeechSynthesisEngine;
    VoiceCommandSystem: typeof VoiceCommandSystem;
    IntentParser: typeof IntentParser;
    VoiceAssistant: typeof VoiceAssistant;
    VoiceNavigation: typeof VoiceNavigation;
    useSpeechRecognition: typeof useSpeechRecognition;
    useSpeechSynthesis: typeof useSpeechSynthesis;
    useVoiceCommands: typeof useVoiceCommands;
    useVoiceAssistant: typeof useVoiceAssistant;
    useVoiceNavigation: typeof useVoiceNavigation;
};
export default _default;
//# sourceMappingURL=index.d.ts.map