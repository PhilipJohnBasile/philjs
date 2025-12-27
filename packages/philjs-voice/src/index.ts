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

// ============================================================================
// Types
// ============================================================================

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
  alternatives: Array<{ transcript: string; confidence: number }>;
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

// ============================================================================
// Speech Recognition Engine
// ============================================================================

export class SpeechRecognitionEngine {
  private recognition: any;
  private config: VoiceConfig;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private isListening = false;

  constructor(config: VoiceConfig = {}) {
    this.config = {
      language: config.language ?? 'en-US',
      continuous: config.continuous ?? true,
      interimResults: config.interimResults ?? true,
      maxAlternatives: config.maxAlternatives ?? 3,
      ...config
    };

    this.initRecognition();
  }

  private initRecognition(): void {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = this.config.language;
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;

    this.recognition.onresult = (event: any) => {
      const results: SpeechResult[] = [];

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alternatives = Array.from(result).map((alt: any) => ({
          transcript: alt.transcript,
          confidence: alt.confidence
        }));

        results.push({
          transcript: result[0].transcript,
          confidence: result[0].confidence,
          isFinal: result.isFinal,
          alternatives
        });
      }

      this.emit('result', results);

      const finalResult = results.find(r => r.isFinal);
      if (finalResult) {
        this.emit('final', finalResult);
      }
    };

    this.recognition.onerror = (event: any) => {
      this.emit('error', event.error);
    };

    this.recognition.onstart = () => {
      this.isListening = true;
      this.emit('start');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.emit('end');

      // Restart if continuous mode
      if (this.config.continuous && this.isListening) {
        this.recognition.start();
      }
    };
  }

  start(): void {
    if (!this.recognition) return;
    try {
      this.recognition.start();
    } catch (e) {
      // Already started
    }
  }

  stop(): void {
    if (!this.recognition) return;
    this.isListening = false;
    this.recognition.stop();
  }

  abort(): void {
    if (!this.recognition) return;
    this.isListening = false;
    this.recognition.abort();
  }

  on(event: string, callback: (...args: any[]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach(cb => cb(...args));
  }

  setLanguage(language: string): void {
    this.config.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }
}

// ============================================================================
// Speech Synthesis Engine
// ============================================================================

export class SpeechSynthesisEngine {
  private synth: SpeechSynthesis | null = null;
  private config: VoiceConfig;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voicesLoaded = false;
  private voices: SpeechSynthesisVoice[] = [];

  constructor(config: VoiceConfig = {}) {
    this.config = {
      speechRate: config.speechRate ?? 1,
      speechPitch: config.speechPitch ?? 1,
      speechVolume: config.speechVolume ?? 1,
      language: config.language ?? 'en-US',
      ...config
    };

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
    }
  }

  private loadVoices(): void {
    if (!this.synth) return;

    const loadVoicesList = () => {
      this.voices = this.synth!.getVoices();
      this.voicesLoaded = true;
    };

    loadVoicesList();
    this.synth.onvoiceschanged = loadVoicesList;
  }

  async speak(text: string, options?: Partial<VoiceConfig>): Promise<void> {
    if (!this.synth) {
      console.warn('Speech Synthesis not supported');
      return;
    }

    // Wait for voices to load
    if (!this.voicesLoaded) {
      await new Promise<void>(resolve => {
        const check = () => {
          if (this.voicesLoaded) {
            resolve();
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);

      const config = { ...this.config, ...options };
      utterance.rate = config.speechRate!;
      utterance.pitch = config.speechPitch!;
      utterance.volume = config.speechVolume!;
      utterance.lang = config.language!;

      // Select voice
      if (config.voice) {
        const voice = this.voices.find(v =>
          v.name.toLowerCase().includes(config.voice!.toLowerCase())
        );
        if (voice) utterance.voice = voice;
      } else {
        // Default to first voice matching language
        const voice = this.voices.find(v => v.lang.startsWith(config.language!.split('-')[0]));
        if (voice) utterance.voice = voice;
      }

      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        reject(new Error(event.error));
      };

      this.currentUtterance = utterance;
      this.synth!.speak(utterance);
    });
  }

  stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  pause(): void {
    if (this.synth) {
      this.synth.pause();
    }
  }

  resume(): void {
    if (this.synth) {
      this.synth.resume();
    }
  }

  isSpeaking(): boolean {
    return this.synth?.speaking ?? false;
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  getVoicesForLanguage(language: string): SpeechSynthesisVoice[] {
    const langPrefix = language.split('-')[0];
    return this.voices.filter(v => v.lang.startsWith(langPrefix));
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }
}

// ============================================================================
// Voice Command System
// ============================================================================

export class VoiceCommandSystem {
  private recognition: SpeechRecognitionEngine;
  private commands: VoiceCommand[] = [];
  private wakeWord: string | null;
  private isAwake = false;
  private awakeTimeout: ReturnType<typeof setTimeout> | null = null;
  private awakeTimeoutMs = 10000; // 10 seconds after wake word

  constructor(config: VoiceConfig = {}) {
    this.recognition = new SpeechRecognitionEngine(config);
    this.wakeWord = config.wakeWord?.toLowerCase() ?? null;

    this.recognition.on('final', (result: SpeechResult) => {
      this.processCommand(result.transcript);
    });
  }

  registerCommand(command: VoiceCommand): () => void {
    this.commands.push(command);
    // Sort by priority (higher first)
    this.commands.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    return () => {
      const index = this.commands.indexOf(command);
      if (index > -1) {
        this.commands.splice(index, 1);
      }
    };
  }

  registerCommands(commands: VoiceCommand[]): () => void {
    const unsubscribes = commands.map(cmd => this.registerCommand(cmd));
    return () => unsubscribes.forEach(fn => fn());
  }

  private processCommand(transcript: string): void {
    const lowerTranscript = transcript.toLowerCase().trim();

    // Check for wake word
    if (this.wakeWord) {
      if (lowerTranscript.includes(this.wakeWord)) {
        this.isAwake = true;
        this.resetAwakeTimeout();

        // Remove wake word from transcript
        const afterWakeWord = lowerTranscript
          .substring(lowerTranscript.indexOf(this.wakeWord) + this.wakeWord.length)
          .trim();

        if (afterWakeWord) {
          this.matchCommand(afterWakeWord, transcript);
        }
        return;
      }

      if (!this.isAwake) {
        return; // Ignore if not awake and wake word required
      }
    }

    this.matchCommand(lowerTranscript, transcript);
    this.resetAwakeTimeout();
  }

  private matchCommand(normalized: string, original: string): void {
    for (const command of this.commands) {
      let matches: string[] | null = null;

      if (typeof command.pattern === 'string') {
        if (normalized.includes(command.pattern.toLowerCase())) {
          matches = [command.pattern];
        }
      } else {
        const match = normalized.match(command.pattern);
        if (match) {
          matches = Array.from(match);
        }
      }

      if (matches) {
        const voiceMatch: VoiceMatch = {
          transcript: original,
          confidence: 1,
          matches,
          intent: command.description
        };

        command.handler(voiceMatch);
        return;
      }
    }
  }

  private resetAwakeTimeout(): void {
    if (this.awakeTimeout) {
      clearTimeout(this.awakeTimeout);
    }

    this.awakeTimeout = setTimeout(() => {
      this.isAwake = false;
    }, this.awakeTimeoutMs);
  }

  start(): void {
    this.recognition.start();
  }

  stop(): void {
    this.recognition.stop();
    this.isAwake = false;
    if (this.awakeTimeout) {
      clearTimeout(this.awakeTimeout);
    }
  }

  setWakeWord(word: string | null): void {
    this.wakeWord = word?.toLowerCase() ?? null;
    this.isAwake = false;
  }

  getCommands(): VoiceCommand[] {
    return [...this.commands];
  }
}

// ============================================================================
// Natural Language Intent Parser
// ============================================================================

export class IntentParser {
  private intents: Map<string, Array<{ pattern: RegExp; entities: string[] }>> = new Map();

  constructor() {
    // Built-in intents
    this.registerIntent('navigation', [
      { pattern: /(?:go to|navigate to|open|show)\s+(.+)/i, entities: ['destination'] },
      { pattern: /(?:take me to)\s+(.+)/i, entities: ['destination'] }
    ]);

    this.registerIntent('search', [
      { pattern: /(?:search for|find|look up|look for)\s+(.+)/i, entities: ['query'] },
      { pattern: /(?:what is|who is|where is)\s+(.+)/i, entities: ['query'] }
    ]);

    this.registerIntent('action', [
      { pattern: /(?:click|tap|press|select)\s+(?:the\s+)?(.+)/i, entities: ['target'] },
      { pattern: /(?:scroll)\s+(up|down|left|right)/i, entities: ['direction'] },
      { pattern: /(?:go)\s+(back|forward)/i, entities: ['direction'] }
    ]);

    this.registerIntent('form', [
      { pattern: /(?:type|enter|input|fill in)\s+(.+)\s+(?:in|into)\s+(.+)/i, entities: ['value', 'field'] },
      { pattern: /(?:set|change)\s+(.+)\s+to\s+(.+)/i, entities: ['field', 'value'] }
    ]);

    this.registerIntent('control', [
      { pattern: /(?:stop|cancel|abort|quit|exit)/i, entities: [] },
      { pattern: /(?:pause|wait|hold on)/i, entities: [] },
      { pattern: /(?:continue|resume|go ahead)/i, entities: [] },
      { pattern: /(?:yes|yeah|yep|sure|okay|ok|confirm)/i, entities: [] },
      { pattern: /(?:no|nope|nah|cancel|never mind)/i, entities: [] }
    ]);

    this.registerIntent('help', [
      { pattern: /(?:help|what can you do|what can I say)/i, entities: [] },
      { pattern: /(?:how do I|how can I)\s+(.+)/i, entities: ['topic'] }
    ]);
  }

  registerIntent(name: string, patterns: Array<{ pattern: RegExp; entities: string[] }>): void {
    this.intents.set(name, patterns);
  }

  parse(transcript: string): VoiceMatch | null {
    const normalized = transcript.toLowerCase().trim();

    for (const [intent, patterns] of this.intents) {
      for (const { pattern, entities } of patterns) {
        const match = normalized.match(pattern);

        if (match) {
          const extractedEntities: Record<string, string> = {};

          entities.forEach((entity, index) => {
            if (match[index + 1]) {
              extractedEntities[entity] = match[index + 1].trim();
            }
          });

          return {
            transcript,
            confidence: 1,
            matches: Array.from(match),
            intent,
            entities: extractedEntities
          };
        }
      }
    }

    return null;
  }
}

// ============================================================================
// Voice Assistant
// ============================================================================

export class VoiceAssistant {
  private recognition: SpeechRecognitionEngine;
  private synthesis: SpeechSynthesisEngine;
  private commands: VoiceCommandSystem;
  private intentParser: IntentParser;
  private config: VoiceAssistantConfig;
  private conversation: ConversationTurn[] = [];
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private state: VoiceState = {
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    transcript: '',
    error: null,
    wakeWordDetected: false
  };

  constructor(config: VoiceAssistantConfig = {}) {
    this.config = {
      name: config.name ?? 'Assistant',
      greeting: config.greeting ?? 'Hello! How can I help you?',
      fallbackResponse: config.fallbackResponse ?? "I'm sorry, I didn't understand that.",
      confirmationPhrases: config.confirmationPhrases ?? ['Got it', 'Done', 'Okay'],
      cancelPhrases: config.cancelPhrases ?? ['Cancelled', 'Never mind'],
      ...config
    };

    this.recognition = new SpeechRecognitionEngine(config);
    this.synthesis = new SpeechSynthesisEngine(config);
    this.commands = new VoiceCommandSystem(config);
    this.intentParser = new IntentParser();

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.recognition.on('start', () => {
      this.updateState({ isListening: true, error: null });
    });

    this.recognition.on('end', () => {
      this.updateState({ isListening: false });
    });

    this.recognition.on('error', (error: string) => {
      this.updateState({ error });
    });

    this.recognition.on('result', (results: SpeechResult[]) => {
      const latest = results[results.length - 1];
      this.updateState({ transcript: latest.transcript });
    });

    this.recognition.on('final', async (result: SpeechResult) => {
      await this.handleUserInput(result.transcript);
    });
  }

  private async handleUserInput(transcript: string): Promise<void> {
    // Add to conversation history
    this.conversation.push({
      role: 'user',
      content: transcript,
      timestamp: Date.now()
    });

    this.updateState({ isProcessing: true });

    // Parse intent
    const parsed = this.intentParser.parse(transcript);

    if (parsed) {
      this.emit('intent', parsed);

      // Handle built-in intents
      const response = await this.handleIntent(parsed);
      if (response) {
        await this.respond(response);
      }
    } else {
      // No recognized intent - could call AI
      if (this.config.aiProvider && this.config.aiApiKey) {
        const aiResponse = await this.callAI(transcript);
        await this.respond(aiResponse);
      } else {
        await this.respond(this.config.fallbackResponse!);
      }
    }

    this.updateState({ isProcessing: false });
  }

  private async handleIntent(parsed: VoiceMatch): Promise<string | null> {
    switch (parsed.intent) {
      case 'navigation':
        this.emit('navigate', parsed.entities?.destination);
        return `Navigating to ${parsed.entities?.destination}`;

      case 'search':
        this.emit('search', parsed.entities?.query);
        return `Searching for ${parsed.entities?.query}`;

      case 'control':
        if (parsed.transcript.match(/stop|cancel|quit/i)) {
          this.stop();
          return 'Goodbye!';
        }
        return null;

      case 'help':
        return this.getHelpMessage();

      default:
        return null;
    }
  }

  private async callAI(transcript: string): Promise<string> {
    // Placeholder for AI integration
    // In production, this would call OpenAI, Anthropic, etc.
    return this.config.fallbackResponse!;
  }

  private getHelpMessage(): string {
    const commands = this.commands.getCommands();
    const commandList = commands
      .filter(c => c.description)
      .map(c => `"${c.description}"`)
      .slice(0, 5)
      .join(', ');

    return `You can say things like: ${commandList}. Or ask me to navigate, search, or perform actions.`;
  }

  async respond(text: string): Promise<void> {
    this.conversation.push({
      role: 'assistant',
      content: text,
      timestamp: Date.now()
    });

    this.updateState({ isSpeaking: true });
    await this.synthesis.speak(text);
    this.updateState({ isSpeaking: false });
  }

  registerCommand(command: VoiceCommand): () => void {
    return this.commands.registerCommand(command);
  }

  registerIntent(name: string, patterns: Array<{ pattern: RegExp; entities: string[] }>): void {
    this.intentParser.registerIntent(name, patterns);
  }

  async start(): Promise<void> {
    this.recognition.start();
    await this.respond(this.config.greeting!);
  }

  stop(): void {
    this.recognition.stop();
    this.synthesis.stop();
    this.updateState({
      isListening: false,
      isProcessing: false,
      isSpeaking: false
    });
  }

  getState(): VoiceState {
    return { ...this.state };
  }

  getConversation(): ConversationTurn[] {
    return [...this.conversation];
  }

  clearConversation(): void {
    this.conversation = [];
  }

  on(event: string, callback: (...args: any[]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach(cb => cb(...args));
  }

  private updateState(partial: Partial<VoiceState>): void {
    this.state = { ...this.state, ...partial };
    this.emit('statechange', this.state);
  }
}

// ============================================================================
// Voice Navigation
// ============================================================================

export class VoiceNavigation {
  private commands: VoiceCommandSystem;
  private routeMap: Map<string, string> = new Map();
  private onNavigate: (path: string) => void;

  constructor(
    onNavigate: (path: string) => void,
    config: VoiceConfig = {}
  ) {
    this.onNavigate = onNavigate;
    this.commands = new VoiceCommandSystem(config);

    this.setupNavigationCommands();
  }

  private setupNavigationCommands(): void {
    // Generic navigation
    this.commands.registerCommand({
      pattern: /(?:go to|navigate to|open|show)\s+(.+)/i,
      handler: (match) => {
        const destination = match.matches[1]?.toLowerCase();
        this.navigateTo(destination);
      },
      description: 'Navigate to a page'
    });

    // Back/forward
    this.commands.registerCommand({
      pattern: /go\s+back/i,
      handler: () => {
        if (typeof window !== 'undefined') {
          window.history.back();
        }
      },
      description: 'Go back'
    });

    this.commands.registerCommand({
      pattern: /go\s+forward/i,
      handler: () => {
        if (typeof window !== 'undefined') {
          window.history.forward();
        }
      },
      description: 'Go forward'
    });

    // Home
    this.commands.registerCommand({
      pattern: /(?:go\s+)?home/i,
      handler: () => this.onNavigate('/'),
      description: 'Go home'
    });
  }

  mapRoute(phrase: string, path: string): void {
    this.routeMap.set(phrase.toLowerCase(), path);
  }

  mapRoutes(routes: Record<string, string>): void {
    Object.entries(routes).forEach(([phrase, path]) => {
      this.mapRoute(phrase, path);
    });
  }

  private navigateTo(destination: string): void {
    // Check exact match
    const exactPath = this.routeMap.get(destination);
    if (exactPath) {
      this.onNavigate(exactPath);
      return;
    }

    // Check partial match
    for (const [phrase, path] of this.routeMap) {
      if (destination.includes(phrase) || phrase.includes(destination)) {
        this.onNavigate(path);
        return;
      }
    }

    // Convert to slug as fallback
    const slug = destination.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    this.onNavigate(`/${slug}`);
  }

  start(): void {
    this.commands.start();
  }

  stop(): void {
    this.commands.stop();
  }
}

// ============================================================================
// React-style Hooks
// ============================================================================

// Simple state helper
function createState<T>(initial: T): [() => T, (value: T | ((prev: T) => T)) => void] {
  let value = initial;
  return [
    () => value,
    (newValue) => {
      value = typeof newValue === 'function'
        ? (newValue as (prev: T) => T)(value)
        : newValue;
    }
  ];
}

/**
 * Hook for speech recognition
 */
export function useSpeechRecognition(config?: VoiceConfig): {
  transcript: string;
  isListening: boolean;
  start: () => void;
  stop: () => void;
  error: string | null;
  supported: boolean;
} {
  const [getTranscript, setTranscript] = createState('');
  const [getListening, setListening] = createState(false);
  const [getError, setError] = createState<string | null>(null);

  const engine = new SpeechRecognitionEngine(config);

  engine.on('result', (results: SpeechResult[]) => {
    const latest = results[results.length - 1];
    setTranscript(latest.transcript);
  });

  engine.on('start', () => setListening(true));
  engine.on('end', () => setListening(false));
  engine.on('error', (err: string) => setError(err));

  return {
    transcript: getTranscript(),
    isListening: getListening(),
    start: () => engine.start(),
    stop: () => engine.stop(),
    error: getError(),
    supported: SpeechRecognitionEngine.isSupported()
  };
}

/**
 * Hook for speech synthesis
 */
export function useSpeechSynthesis(config?: VoiceConfig): {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  voices: SpeechSynthesisVoice[];
  supported: boolean;
} {
  const engine = new SpeechSynthesisEngine(config);
  const [getSpeaking, setSpeaking] = createState(false);

  return {
    speak: async (text: string) => {
      setSpeaking(true);
      await engine.speak(text);
      setSpeaking(false);
    },
    stop: () => {
      engine.stop();
      setSpeaking(false);
    },
    pause: () => engine.pause(),
    resume: () => engine.resume(),
    isSpeaking: getSpeaking(),
    voices: engine.getVoices(),
    supported: SpeechSynthesisEngine.isSupported()
  };
}

/**
 * Hook for voice commands
 */
export function useVoiceCommands(
  commands: VoiceCommand[],
  config?: VoiceConfig
): {
  isListening: boolean;
  start: () => void;
  stop: () => void;
  setWakeWord: (word: string | null) => void;
} {
  const system = new VoiceCommandSystem(config);
  const [getListening, setListening] = createState(false);

  system.registerCommands(commands);

  return {
    isListening: getListening(),
    start: () => {
      system.start();
      setListening(true);
    },
    stop: () => {
      system.stop();
      setListening(false);
    },
    setWakeWord: (word) => system.setWakeWord(word)
  };
}

/**
 * Hook for voice assistant
 */
export function useVoiceAssistant(config?: VoiceAssistantConfig): {
  state: VoiceState;
  conversation: ConversationTurn[];
  start: () => Promise<void>;
  stop: () => void;
  respond: (text: string) => Promise<void>;
  registerCommand: (command: VoiceCommand) => () => void;
  clearConversation: () => void;
} {
  const assistant = new VoiceAssistant(config);
  const [getState, setState] = createState<VoiceState>(assistant.getState());
  const [getConversation, setConversation] = createState<ConversationTurn[]>([]);

  assistant.on('statechange', (state: VoiceState) => setState(state));

  return {
    state: getState(),
    conversation: getConversation(),
    start: () => assistant.start(),
    stop: () => assistant.stop(),
    respond: (text) => assistant.respond(text),
    registerCommand: (cmd) => assistant.registerCommand(cmd),
    clearConversation: () => {
      assistant.clearConversation();
      setConversation([]);
    }
  };
}

/**
 * Hook for voice navigation
 */
export function useVoiceNavigation(
  onNavigate: (path: string) => void,
  routes?: Record<string, string>,
  config?: VoiceConfig
): {
  start: () => void;
  stop: () => void;
  mapRoute: (phrase: string, path: string) => void;
} {
  const nav = new VoiceNavigation(onNavigate, config);

  if (routes) {
    nav.mapRoutes(routes);
  }

  return {
    start: () => nav.start(),
    stop: () => nav.stop(),
    mapRoute: (phrase, path) => nav.mapRoute(phrase, path)
  };
}

// ============================================================================
// Exports
// ============================================================================

export {
  SpeechRecognitionEngine,
  SpeechSynthesisEngine,
  VoiceCommandSystem,
  IntentParser,
  VoiceAssistant,
  VoiceNavigation
};

export default {
  SpeechRecognitionEngine,
  SpeechSynthesisEngine,
  VoiceCommandSystem,
  IntentParser,
  VoiceAssistant,
  VoiceNavigation,
  useSpeechRecognition,
  useSpeechSynthesis,
  useVoiceCommands,
  useVoiceAssistant,
  useVoiceNavigation
};
