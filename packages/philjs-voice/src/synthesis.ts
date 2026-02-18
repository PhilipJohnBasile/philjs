/**
 * Speech Synthesis (Text-to-Speech)
 *
 * Provides a reactive wrapper around the Web Speech Synthesis API
 */

import { signal } from '@philjs/core';

export interface SynthesisConfig {
  voice?: string;
  lang?: string;
  pitch?: number;
  rate?: number;
  volume?: number;
}

export interface VoiceInfo {
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
}

export class SpeechSynthesizer {
  private synthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private config: Required<SynthesisConfig>;

  // Reactive state
  readonly isSpeaking = signal(false);
  readonly isPaused = signal(false);
  readonly currentText = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly availableVoices = signal<VoiceInfo[]>([]);

  constructor(config: SynthesisConfig = {}) {
    this.config = {
      voice: config.voice ?? '',
      lang: config.lang ?? 'en-US',
      pitch: config.pitch ?? 1,
      rate: config.rate ?? 1,
      volume: config.volume ?? 1,
    };

    this.initialize();
  }

  private initialize(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      this.error.set('Speech Synthesis API not supported');
      return;
    }

    this.synthesis = window.speechSynthesis;

    // Load voices
    const loadVoices = () => {
      this.voices = this.synthesis!.getVoices();
      this.availableVoices.set(
        this.voices.map((v) => ({
          name: v.name,
          lang: v.lang,
          localService: v.localService,
          default: v.default,
        }))
      );
    };

    loadVoices();

    // Chrome loads voices asynchronously
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = loadVoices;
    }
  }

  /**
   * Speak the given text
   */
  speak(text: string, config?: Partial<SynthesisConfig>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech Synthesis not available'));
        return;
      }

      // Cancel any ongoing speech
      this.cancel();

      const mergedConfig = { ...this.config, ...config };
      const utterance = new SpeechSynthesisUtterance(text);

      // Find voice
      if (mergedConfig.voice) {
        const voice = this.voices.find(
          (v) =>
            v.name === mergedConfig.voice ||
            v.name.toLowerCase().includes(mergedConfig.voice!.toLowerCase())
        );
        if (voice) utterance.voice = voice;
      }

      utterance.lang = mergedConfig.lang;
      utterance.pitch = Math.max(0, Math.min(2, mergedConfig.pitch));
      utterance.rate = Math.max(0.1, Math.min(10, mergedConfig.rate));
      utterance.volume = Math.max(0, Math.min(1, mergedConfig.volume));

      utterance.onstart = () => {
        this.isSpeaking.set(true);
        this.currentText.set(text);
      };

      utterance.onend = () => {
        this.isSpeaking.set(false);
        this.isPaused.set(false);
        this.currentText.set(null);
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking.set(false);
        this.currentText.set(null);
        this.error.set(event.error);
        reject(new Error(event.error));
      };

      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
    });
  }

  /**
   * Speak multiple texts in sequence
   */
  async speakQueue(texts: string[], config?: Partial<SynthesisConfig>): Promise<void> {
    for (const text of texts) {
      await this.speak(text, config);
    }
  }

  /**
   * Pause speaking
   */
  pause(): void {
    if (this.synthesis && this.isSpeaking()) {
      this.synthesis.pause();
      this.isPaused.set(true);
    }
  }

  /**
   * Resume speaking
   */
  resume(): void {
    if (this.synthesis && this.isPaused()) {
      this.synthesis.resume();
      this.isPaused.set(false);
    }
  }

  /**
   * Cancel speaking
   */
  cancel(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isSpeaking.set(false);
      this.isPaused.set(false);
      this.currentText.set(null);
      this.currentUtterance = null;
    }
  }

  /**
   * Set the voice
   */
  setVoice(voiceName: string): void {
    this.config.voice = voiceName;
  }

  /**
   * Set the language
   */
  setLanguage(lang: string): void {
    this.config.lang = lang;
  }

  /**
   * Set speaking rate (0.1 to 10)
   */
  setRate(rate: number): void {
    this.config.rate = Math.max(0.1, Math.min(10, rate));
  }

  /**
   * Set pitch (0 to 2)
   */
  setPitch(pitch: number): void {
    this.config.pitch = Math.max(0, Math.min(2, pitch));
  }

  /**
   * Set volume (0 to 1)
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get voices for a specific language
   */
  getVoicesForLanguage(lang: string): VoiceInfo[] {
    return this.availableVoices().filter((v) =>
      v.lang.toLowerCase().startsWith(lang.toLowerCase())
    );
  }
}

/**
 * Convenience function for quick text-to-speech
 */
export async function speak(text: string, config?: SynthesisConfig): Promise<void> {
  const synthesizer = new SpeechSynthesizer(config);
  // Wait a bit for voices to load
  await new Promise((resolve) => setTimeout(resolve, 100));
  return synthesizer.speak(text);
}

/**
 * Get available voices
 */
export function getVoices(): VoiceInfo[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return [];
  }

  return window.speechSynthesis.getVoices().map((v) => ({
    name: v.name,
    lang: v.lang,
    localService: v.localService,
    default: v.default,
  }));
}
