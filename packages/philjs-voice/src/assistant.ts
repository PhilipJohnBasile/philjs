/**
 * Voice Assistant - Combines speech recognition and synthesis
 *
 * Provides a conversational voice interface
 */

import { signal, onCleanup } from '@philjs/core';
import { SpeechSynthesizer, type SynthesisConfig } from './synthesis.js';
import type { VoiceControlConfig, SpeechResult } from './voice-control.js';

export interface AssistantConfig {
  name?: string;
  wakeWord?: string;
  language?: string;
  voice?: string;
  pitch?: number;
  rate?: number;
  onCommand?: (command: string, args: string[]) => Promise<string | void>;
  greetingMessage?: string;
  errorMessage?: string;
  debug?: boolean;
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export class VoiceAssistant {
  private recognition: any;
  private synthesizer: SpeechSynthesizer;
  private config: Required<AssistantConfig>;

  // State
  readonly isListening = signal(false);
  readonly isSpeaking = signal(false);
  readonly isAwake = signal(false);
  readonly conversation = signal<ConversationTurn[]>([]);
  readonly lastUserInput = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  constructor(config: AssistantConfig = {}) {
    this.config = {
      name: config.name ?? 'Assistant',
      wakeWord: config.wakeWord ?? '',
      language: config.language ?? 'en-US',
      voice: config.voice ?? '',
      pitch: config.pitch ?? 1,
      rate: config.rate ?? 1,
      onCommand: config.onCommand ?? (async () => undefined),
      greetingMessage: config.greetingMessage ?? "Hello! How can I help you?",
      errorMessage: config.errorMessage ?? "I'm sorry, I didn't understand that.",
      debug: config.debug ?? false,
    };

    this.synthesizer = new SpeechSynthesizer({
      lang: this.config.language,
      voice: this.config.voice,
      pitch: this.config.pitch,
      rate: this.config.rate,
    });

    this.initializeRecognition();
  }

  private initializeRecognition(): void {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.error.set('Speech Recognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = this.config.language;
    this.recognition.continuous = true;
    this.recognition.interimResults = false;

    this.recognition.onstart = () => {
      this.isListening.set(true);
    };

    this.recognition.onend = () => {
      this.isListening.set(false);
      // Restart if still awake
      if (this.isAwake() && !this.isSpeaking()) {
        this.startListening();
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        this.error.set(event.error);
      }
    };

    this.recognition.onresult = async (event: any) => {
      const result = event.results[event.results.length - 1];
      if (!result || !result.isFinal) return;

      const text = result[0].transcript.trim();
      if (!text) return;

      if (this.config.debug) {
        console.log('Assistant heard:', text);
      }

      // Check for wake word if not already awake
      if (!this.isAwake() && this.config.wakeWord) {
        if (text.toLowerCase().includes(this.config.wakeWord.toLowerCase())) {
          await this.wake();
        }
        return;
      }

      // Process the command
      await this.processInput(text);
    };
  }

  private async processInput(text: string): Promise<void> {
    this.lastUserInput.set(text);
    this.addToConversation('user', text);

    // Stop listening while processing
    this.recognition?.stop();

    try {
      const response = await this.config.onCommand(text, text.split(/\s+/));

      if (response) {
        await this.say(response);
      }
    } catch (e) {
      console.error('Command processing error:', e);
      await this.say(this.config.errorMessage);
    }
  }

  private addToConversation(role: 'user' | 'assistant', text: string): void {
    const turn: ConversationTurn = {
      role,
      text,
      timestamp: new Date(),
    };

    this.conversation.set([...this.conversation(), turn]);
  }

  /**
   * Wake up the assistant
   */
  async wake(): Promise<void> {
    this.isAwake.set(true);
    this.error.set(null);

    if (this.config.greetingMessage) {
      await this.say(this.config.greetingMessage);
    }

    this.startListening();
  }

  /**
   * Put the assistant to sleep
   */
  sleep(): void {
    this.isAwake.set(false);
    this.recognition?.stop();
    this.synthesizer.cancel();
  }

  /**
   * Start listening for input
   */
  startListening(): void {
    if (!this.isListening() && !this.isSpeaking()) {
      try {
        this.recognition?.start();
      } catch (e) {
        // Already started
      }
    }
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    this.recognition?.stop();
  }

  /**
   * Speak a response
   */
  async say(text: string): Promise<void> {
    this.isSpeaking.set(true);
    this.addToConversation('assistant', text);

    try {
      await this.synthesizer.speak(text);
    } finally {
      this.isSpeaking.set(false);

      // Resume listening after speaking
      if (this.isAwake()) {
        this.startListening();
      }
    }
  }

  /**
   * Process a text command (for testing or alternative input)
   */
  async processText(text: string): Promise<void> {
    await this.processInput(text);
  }

  /**
   * Clear conversation history
   */
  clearConversation(): void {
    this.conversation.set([]);
  }

  /**
   * Get conversation history as text
   */
  getConversationText(): string {
    return this.conversation()
      .map((turn) => `${turn.role === 'user' ? 'You' : this.config.name}: ${turn.text}`)
      .join('\n');
  }

  /**
   * Set voice configuration
   */
  setVoice(config: Partial<SynthesisConfig>): void {
    if (config.voice) this.synthesizer.setVoice(config.voice);
    if (config.pitch) this.synthesizer.setPitch(config.pitch);
    if (config.rate) this.synthesizer.setRate(config.rate);
    if (config.volume) this.synthesizer.setVolume(config.volume);
  }
}

/**
 * Hook for using voice assistant in components
 */
export function useVoiceAssistant(config: AssistantConfig = {}) {
  const assistant = new VoiceAssistant(config);

  onCleanup(() => {
    assistant.sleep();
  });

  return assistant;
}

/**
 * Create a simple command-response assistant
 */
export function createSimpleAssistant(
  commands: Record<string, string | ((args: string[]) => string | Promise<string>)>,
  config: Omit<AssistantConfig, 'onCommand'> = {}
): VoiceAssistant {
  return new VoiceAssistant({
    ...config,
    onCommand: async (text, args) => {
      const lowerText = text.toLowerCase();

      for (const [trigger, response] of Object.entries(commands)) {
        if (lowerText.includes(trigger.toLowerCase())) {
          if (typeof response === 'function') {
            return response(args);
          }
          return response;
        }
      }

      return undefined;
    },
  });
}
