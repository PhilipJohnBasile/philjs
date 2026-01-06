/**
 * @philjs/voice - Voice Control & Speech Recognition
 *
 * Provides a reactive wrapper around the Web Speech API.
 */

import { signal, onCleanup } from '@philjs/core';

export interface VoiceCommand {
    phrase: string;
    action: (args: string[]) => void;
    confidenceThreshold?: number;
}

export interface VoiceControlConfig {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
    commands?: VoiceCommand[];
    debug?: boolean;
}

export interface SpeechResult {
    transcript: string;
    confidence: number;
    isFinal: boolean;
}

export class VoiceControl {
    private recognition: any; // SpeechRecognition types are not standard in all TS envs
    private isListening = signal(false);
    private lastResult = signal<SpeechResult | null>(null);
    private error = signal<string | null>(null);
    private commands: VoiceCommand[] = [];
    private config: VoiceControlConfig;

    constructor(config: VoiceControlConfig = {}) {
        this.config = {
            language: 'en-US',
            continuous: true,
            interimResults: true,
            debug: false,
            ...config
        };

        if (config.commands) {
            this.commands = config.commands;
        }

        this.initializeRecognition();
    }

    private initializeRecognition() {
        if (typeof window === 'undefined') return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            this.error.set('Speech Recognition API not supported in this browser.');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.lang = this.config.language;
        this.recognition.continuous = this.config.continuous;
        this.recognition.interimResults = this.config.interimResults;

        this.recognition.onstart = () => {
            this.isListening.set(true);
        };

        this.recognition.onend = () => {
            this.isListening.set(false);
            // Auto-restart if continuous mode requires it (chrome stops occasionally)
            if (this.config.continuous && !this.error()) {
                // Optional: debounce restart
            }
        };

        this.recognition.onerror = (event: any) => {
            this.error.set(event.error);
            if (this.config.debug) console.error('VoiceControl: ⚠️ Error', event.error);
        };

        this.recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';
            let finalConfidence = 0;

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                    finalConfidence = event.results[i][0].confidence;
                    this.processCommands(event.results[i][0].transcript, finalConfidence);
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            const result: SpeechResult = {
                transcript: finalTranscript || interimTranscript,
                confidence: finalConfidence,
                isFinal: !!finalTranscript
            };

            this.lastResult.set(result);
            if (this.config.debug && result.isFinal) {
            }
        };
    }

    private processCommands(text: string, confidence: number) {
        const cleanText = text.trim().toLowerCase();

        for (const cmd of this.commands) {
            const minConfidence = cmd.confidenceThreshold || 0.6;
            if (confidence < minConfidence) continue;

            // Simple keyword matching (enhanced regex could be used here)
            // Check if text starts with command phrase
            const phrase = cmd.phrase.toLowerCase();
            if (cleanText.includes(phrase)) {
                const args = cleanText.replace(phrase, '').trim().split(/\s+/);
                cmd.action(args);
            }
        }
    }

    start() {
        this.error.set(null);
        try {
            this.recognition?.start();
        } catch (e) {
            // Ignore "already started" errors
        }
    }

    stop() {
        this.recognition?.stop();
    }

    abort() {
        this.recognition?.abort();
    }

    // Reactive getters
    get listening() { return this.isListening(); }
    get result() { return this.lastResult(); }
    get errorState() { return this.error(); }

    addCommand(command: VoiceCommand) {
        this.commands.push(command);
    }

    removeCommand(phrase: string) {
        this.commands = this.commands.filter(c => c.phrase !== phrase);
    }
}

// Hook for usage in components
export function useVoiceControl(config: VoiceControlConfig = {}) {
    const voice = new VoiceControl(config);

    onCleanup(() => {
        voice.abort();
    });

    return voice;
}
