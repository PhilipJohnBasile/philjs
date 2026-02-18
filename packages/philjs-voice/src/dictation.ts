/**
 * Dictation Mode - Continuous speech transcription
 *
 * Provides a reactive dictation experience for transcribing longer content
 */

import { signal, onCleanup } from '@philjs/core';

export interface DictationConfig {
  language?: string;
  autoPunctuation?: boolean;
  autoCapitalize?: boolean;
  paragraphOnPause?: number; // ms of silence to trigger paragraph break
  debug?: boolean;
}

export interface DictationState {
  isActive: boolean;
  transcript: string;
  interimText: string;
  wordCount: number;
  duration: number; // seconds
}

export class Dictation {
  private recognition: any;
  private startTime: number = 0;
  private lastSpeechTime: number = 0;
  private pauseCheckInterval: any;
  private config: Required<DictationConfig>;

  // Reactive state
  readonly isActive = signal(false);
  readonly transcript = signal('');
  readonly interimText = signal('');
  readonly wordCount = signal(0);
  readonly duration = signal(0);
  readonly error = signal<string | null>(null);

  constructor(config: DictationConfig = {}) {
    this.config = {
      language: config.language ?? 'en-US',
      autoPunctuation: config.autoPunctuation ?? true,
      autoCapitalize: config.autoCapitalize ?? true,
      paragraphOnPause: config.paragraphOnPause ?? 2000,
      debug: config.debug ?? false,
    };

    this.initializeRecognition();
  }

  private initializeRecognition(): void {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.error.set('Speech Recognition API not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = this.config.language;
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onstart = () => {
      this.isActive.set(true);
      this.startTime = Date.now();
      this.lastSpeechTime = Date.now();
      this.startPauseDetection();
    };

    this.recognition.onend = () => {
      this.isActive.set(false);
      this.stopPauseDetection();

      // Auto-restart if still active (Chrome stops periodically)
      if (this.isActive()) {
        try {
          this.recognition.start();
        } catch (e) {
          // Ignore
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        this.error.set(event.error);
        if (this.config.debug) {
          console.error('Dictation error:', event.error);
        }
      }
    };

    this.recognition.onresult = (event: any) => {
      this.lastSpeechTime = Date.now();
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;

        if (result.isFinal) {
          finalText += this.processText(text);
        } else {
          interimText += text;
        }
      }

      if (finalText) {
        const current = this.transcript();
        const newTranscript = current + (current && !current.endsWith('\n') ? ' ' : '') + finalText;
        this.transcript.set(newTranscript.trim());
        this.wordCount.set(this.countWords(newTranscript));
      }

      this.interimText.set(interimText);
      this.duration.set(Math.floor((Date.now() - this.startTime) / 1000));
    };
  }

  private processText(text: string): string {
    let processed = text.trim();

    if (this.config.autoCapitalize) {
      const current = this.transcript();
      // Capitalize if at start or after sentence-ending punctuation
      if (!current || /[.!?]\s*$/.test(current) || current.endsWith('\n')) {
        processed = processed.charAt(0).toUpperCase() + processed.slice(1);
      }
    }

    return processed;
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter((w) => w.length > 0).length;
  }

  private startPauseDetection(): void {
    this.pauseCheckInterval = setInterval(() => {
      const timeSinceLastSpeech = Date.now() - this.lastSpeechTime;

      if (timeSinceLastSpeech >= this.config.paragraphOnPause) {
        const current = this.transcript();
        if (current && !current.endsWith('\n\n')) {
          // Add paragraph break
          this.transcript.set(current + '\n\n');
        }
      }

      // Update duration
      this.duration.set(Math.floor((Date.now() - this.startTime) / 1000));
    }, 500);
  }

  private stopPauseDetection(): void {
    if (this.pauseCheckInterval) {
      clearInterval(this.pauseCheckInterval);
      this.pauseCheckInterval = null;
    }
  }

  /**
   * Start dictation
   */
  start(): void {
    this.error.set(null);
    try {
      this.recognition?.start();
    } catch (e) {
      // Already started
    }
  }

  /**
   * Stop dictation
   */
  stop(): void {
    this.recognition?.stop();
    this.stopPauseDetection();
  }

  /**
   * Clear the transcript
   */
  clear(): void {
    this.transcript.set('');
    this.interimText.set('');
    this.wordCount.set(0);
  }

  /**
   * Get the current state
   */
  getState(): DictationState {
    return {
      isActive: this.isActive(),
      transcript: this.transcript(),
      interimText: this.interimText(),
      wordCount: this.wordCount(),
      duration: this.duration(),
    };
  }

  /**
   * Add text manually
   */
  addText(text: string): void {
    const current = this.transcript();
    const newTranscript = current + (current ? ' ' : '') + text;
    this.transcript.set(newTranscript);
    this.wordCount.set(this.countWords(newTranscript));
  }

  /**
   * Add punctuation
   */
  addPunctuation(punct: string): void {
    const current = this.transcript();
    if (current) {
      this.transcript.set(current.trimEnd() + punct + ' ');
    }
  }

  /**
   * Add a new paragraph
   */
  newParagraph(): void {
    const current = this.transcript();
    if (current && !current.endsWith('\n\n')) {
      this.transcript.set(current.trimEnd() + '\n\n');
    }
  }

  /**
   * Undo last word
   */
  undoLastWord(): void {
    const current = this.transcript();
    const words = current.trim().split(/\s+/);
    if (words.length > 0) {
      words.pop();
      const newTranscript = words.join(' ');
      this.transcript.set(newTranscript);
      this.wordCount.set(this.countWords(newTranscript));
    }
  }
}

/**
 * Hook for using dictation in components
 */
export function useDictation(config: DictationConfig = {}) {
  const dictation = new Dictation(config);

  onCleanup(() => {
    dictation.stop();
  });

  return dictation;
}
