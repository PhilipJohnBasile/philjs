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
// Speech Recognition Engine
// ============================================================================
export class SpeechRecognitionEngine {
    recognition;
    config;
    listeners = new Map();
    isListening = false;
    constructor(config = {}) {
        this.config = {
            language: config.language ?? 'en-US',
            continuous: config.continuous ?? true,
            interimResults: config.interimResults ?? true,
            maxAlternatives: config.maxAlternatives ?? 3,
            ...config
        };
        this.initRecognition();
    }
    initRecognition() {
        if (typeof window === 'undefined')
            return;
        const SpeechRecognition = window.SpeechRecognition ||
            window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('Speech Recognition not supported in this browser');
            return;
        }
        this.recognition = new SpeechRecognition();
        this.recognition.lang = this.config.language;
        this.recognition.continuous = this.config.continuous;
        this.recognition.interimResults = this.config.interimResults;
        this.recognition.maxAlternatives = this.config.maxAlternatives;
        this.recognition.onresult = (event) => {
            const results = [];
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const alternatives = Array.from(result).map((alt) => ({
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
        this.recognition.onerror = (event) => {
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
    start() {
        if (!this.recognition)
            return;
        try {
            this.recognition.start();
        }
        catch (e) {
            // Already started
        }
    }
    stop() {
        if (!this.recognition)
            return;
        this.isListening = false;
        this.recognition.stop();
    }
    abort() {
        if (!this.recognition)
            return;
        this.isListening = false;
        this.recognition.abort();
    }
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        return () => {
            this.listeners.get(event)?.delete(callback);
        };
    }
    emit(event, ...args) {
        this.listeners.get(event)?.forEach(cb => cb(...args));
    }
    setLanguage(language) {
        this.config.language = language;
        if (this.recognition) {
            this.recognition.lang = language;
        }
    }
    static isSupported() {
        if (typeof window === 'undefined')
            return false;
        return !!(window.SpeechRecognition ||
            window.webkitSpeechRecognition);
    }
}
// ============================================================================
// Speech Synthesis Engine
// ============================================================================
export class SpeechSynthesisEngine {
    synth = null;
    config;
    currentUtterance = null;
    voicesLoaded = false;
    voices = [];
    constructor(config = {}) {
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
    loadVoices() {
        if (!this.synth)
            return;
        const loadVoicesList = () => {
            this.voices = this.synth.getVoices();
            this.voicesLoaded = true;
        };
        loadVoicesList();
        this.synth.onvoiceschanged = loadVoicesList;
    }
    async speak(text, options) {
        if (!this.synth) {
            console.warn('Speech Synthesis not supported');
            return;
        }
        // Wait for voices to load
        if (!this.voicesLoaded) {
            await new Promise(resolve => {
                const check = () => {
                    if (this.voicesLoaded) {
                        resolve();
                    }
                    else {
                        setTimeout(check, 100);
                    }
                };
                check();
            });
        }
        return new Promise((resolve, reject) => {
            const utterance = new SpeechSynthesisUtterance(text);
            const config = { ...this.config, ...options };
            utterance.rate = config.speechRate;
            utterance.pitch = config.speechPitch;
            utterance.volume = config.speechVolume;
            utterance.lang = config.language;
            // Select voice
            if (config.voice) {
                const voice = this.voices.find(v => v.name.toLowerCase().includes(config.voice.toLowerCase()));
                if (voice)
                    utterance.voice = voice;
            }
            else {
                // Default to first voice matching language
                const langPrefix = config.language.split('-')[0];
                const voice = this.voices.find(v => v.lang.startsWith(langPrefix));
                if (voice)
                    utterance.voice = voice;
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
            this.synth.speak(utterance);
        });
    }
    stop() {
        if (this.synth) {
            this.synth.cancel();
            this.currentUtterance = null;
        }
    }
    pause() {
        if (this.synth) {
            this.synth.pause();
        }
    }
    resume() {
        if (this.synth) {
            this.synth.resume();
        }
    }
    isSpeaking() {
        return this.synth?.speaking ?? false;
    }
    getVoices() {
        return this.voices;
    }
    getVoicesForLanguage(language) {
        const langPrefix = language.split('-')[0];
        return this.voices.filter(v => v.lang.startsWith(langPrefix));
    }
    static isSupported() {
        return typeof window !== 'undefined' && 'speechSynthesis' in window;
    }
}
// ============================================================================
// Voice Command System
// ============================================================================
export class VoiceCommandSystem {
    recognition;
    commands = [];
    wakeWord;
    isAwake = false;
    awakeTimeout = null;
    awakeTimeoutMs = 10000; // 10 seconds after wake word
    constructor(config = {}) {
        this.recognition = new SpeechRecognitionEngine(config);
        this.wakeWord = config.wakeWord?.toLowerCase() ?? null;
        this.recognition.on('final', (result) => {
            this.processCommand(result.transcript);
        });
    }
    registerCommand(command) {
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
    registerCommands(commands) {
        const unsubscribes = commands.map(cmd => this.registerCommand(cmd));
        return () => unsubscribes.forEach(fn => fn());
    }
    processCommand(transcript) {
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
    matchCommand(normalized, original) {
        for (const command of this.commands) {
            let matches = null;
            if (typeof command.pattern === 'string') {
                if (normalized.includes(command.pattern.toLowerCase())) {
                    matches = [command.pattern];
                }
            }
            else {
                const match = normalized.match(command.pattern);
                if (match) {
                    matches = Array.from(match);
                }
            }
            if (matches) {
                const voiceMatch = {
                    transcript: original,
                    confidence: 1,
                    matches
                };
                if (command.description !== undefined) {
                    voiceMatch.intent = command.description;
                }
                command.handler(voiceMatch);
                return;
            }
        }
    }
    resetAwakeTimeout() {
        if (this.awakeTimeout) {
            clearTimeout(this.awakeTimeout);
        }
        this.awakeTimeout = setTimeout(() => {
            this.isAwake = false;
        }, this.awakeTimeoutMs);
    }
    start() {
        this.recognition.start();
    }
    stop() {
        this.recognition.stop();
        this.isAwake = false;
        if (this.awakeTimeout) {
            clearTimeout(this.awakeTimeout);
        }
    }
    setWakeWord(word) {
        this.wakeWord = word?.toLowerCase() ?? null;
        this.isAwake = false;
    }
    getCommands() {
        return [...this.commands];
    }
}
// ============================================================================
// Natural Language Intent Parser
// ============================================================================
export class IntentParser {
    intents = new Map();
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
    registerIntent(name, patterns) {
        this.intents.set(name, patterns);
    }
    parse(transcript) {
        const normalized = transcript.toLowerCase().trim();
        for (const [intent, patterns] of this.intents) {
            for (const { pattern, entities } of patterns) {
                const match = normalized.match(pattern);
                if (match) {
                    const extractedEntities = {};
                    entities.forEach((entity, index) => {
                        const matchValue = match[index + 1];
                        if (matchValue) {
                            extractedEntities[entity] = matchValue.trim();
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
    recognition;
    synthesis;
    commands;
    intentParser;
    config;
    conversation = [];
    listeners = new Map();
    state = {
        isListening: false,
        isProcessing: false,
        isSpeaking: false,
        transcript: '',
        error: null,
        wakeWordDetected: false
    };
    constructor(config = {}) {
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
    setupEventHandlers() {
        this.recognition.on('start', () => {
            this.updateState({ isListening: true, error: null });
        });
        this.recognition.on('end', () => {
            this.updateState({ isListening: false });
        });
        this.recognition.on('error', (error) => {
            this.updateState({ error });
        });
        this.recognition.on('result', (results) => {
            const latest = results[results.length - 1];
            this.updateState({ transcript: latest.transcript });
        });
        this.recognition.on('final', async (result) => {
            await this.handleUserInput(result.transcript);
        });
    }
    async handleUserInput(transcript) {
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
        }
        else {
            // No recognized intent - could call AI
            if (this.config.aiProvider && this.config.aiApiKey) {
                const aiResponse = await this.callAI(transcript);
                await this.respond(aiResponse);
            }
            else {
                await this.respond(this.config.fallbackResponse);
            }
        }
        this.updateState({ isProcessing: false });
    }
    async handleIntent(parsed) {
        switch (parsed.intent) {
            case 'navigation':
                this.emit('navigate', parsed.entities?.['destination']);
                return `Navigating to ${parsed.entities?.['destination']}`;
            case 'search':
                this.emit('search', parsed.entities?.['query']);
                return `Searching for ${parsed.entities?.['query']}`;
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
    async callAI(transcript) {
        // Placeholder for AI integration
        // In production, this would call OpenAI, Anthropic, etc.
        return this.config.fallbackResponse;
    }
    getHelpMessage() {
        const commands = this.commands.getCommands();
        const commandList = commands
            .filter(c => c.description)
            .map(c => `"${c.description}"`)
            .slice(0, 5)
            .join(', ');
        return `You can say things like: ${commandList}. Or ask me to navigate, search, or perform actions.`;
    }
    async respond(text) {
        this.conversation.push({
            role: 'assistant',
            content: text,
            timestamp: Date.now()
        });
        this.updateState({ isSpeaking: true });
        await this.synthesis.speak(text);
        this.updateState({ isSpeaking: false });
    }
    registerCommand(command) {
        return this.commands.registerCommand(command);
    }
    registerIntent(name, patterns) {
        this.intentParser.registerIntent(name, patterns);
    }
    async start() {
        this.recognition.start();
        await this.respond(this.config.greeting);
    }
    stop() {
        this.recognition.stop();
        this.synthesis.stop();
        this.updateState({
            isListening: false,
            isProcessing: false,
            isSpeaking: false
        });
    }
    getState() {
        return { ...this.state };
    }
    getConversation() {
        return [...this.conversation];
    }
    clearConversation() {
        this.conversation = [];
    }
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        return () => {
            this.listeners.get(event)?.delete(callback);
        };
    }
    emit(event, ...args) {
        this.listeners.get(event)?.forEach(cb => cb(...args));
    }
    updateState(partial) {
        this.state = { ...this.state, ...partial };
        this.emit('statechange', this.state);
    }
}
// ============================================================================
// Voice Navigation
// ============================================================================
export class VoiceNavigation {
    commands;
    routeMap = new Map();
    onNavigate;
    constructor(onNavigate, config = {}) {
        this.onNavigate = onNavigate;
        this.commands = new VoiceCommandSystem(config);
        this.setupNavigationCommands();
    }
    setupNavigationCommands() {
        // Generic navigation
        this.commands.registerCommand({
            pattern: /(?:go to|navigate to|open|show)\s+(.+)/i,
            handler: (match) => {
                const destination = match.matches[1]?.toLowerCase() ?? '';
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
    mapRoute(phrase, path) {
        this.routeMap.set(phrase.toLowerCase(), path);
    }
    mapRoutes(routes) {
        Object.entries(routes).forEach(([phrase, path]) => {
            this.mapRoute(phrase, path);
        });
    }
    navigateTo(destination) {
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
    start() {
        this.commands.start();
    }
    stop() {
        this.commands.stop();
    }
}
// ============================================================================
// React-style Hooks
// ============================================================================
// Simple state helper
function createState(initial) {
    let value = initial;
    return [
        () => value,
        (newValue) => {
            value = typeof newValue === 'function'
                ? newValue(value)
                : newValue;
        }
    ];
}
/**
 * Hook for speech recognition
 */
export function useSpeechRecognition(config) {
    const [getTranscript, setTranscript] = createState('');
    const [getListening, setListening] = createState(false);
    const [getError, setError] = createState(null);
    const engine = new SpeechRecognitionEngine(config);
    engine.on('result', (results) => {
        const latest = results[results.length - 1];
        setTranscript(latest.transcript);
    });
    engine.on('start', () => setListening(true));
    engine.on('end', () => setListening(false));
    engine.on('error', (err) => setError(err));
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
export function useSpeechSynthesis(config) {
    const engine = new SpeechSynthesisEngine(config);
    const [getSpeaking, setSpeaking] = createState(false);
    return {
        speak: async (text) => {
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
export function useVoiceCommands(commands, config) {
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
export function useVoiceAssistant(config) {
    const assistant = new VoiceAssistant(config);
    const [getState, setState] = createState(assistant.getState());
    const [getConversation, setConversation] = createState([]);
    assistant.on('statechange', (state) => setState(state));
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
export function useVoiceNavigation(onNavigate, routes, config) {
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
// Default Export
// ============================================================================
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
//# sourceMappingURL=index.js.map