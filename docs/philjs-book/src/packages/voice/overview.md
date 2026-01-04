# @philjs/voice

Voice UI primitives for building voice-first interfaces with speech recognition, synthesis, voice commands, intent parsing, and conversational assistants.

## Installation

```bash
npm install @philjs/voice
```

## Features

- **Speech Recognition** - Web Speech API integration with continuous listening
- **Speech Synthesis** - Text-to-speech with voice selection
- **Voice Commands** - Pattern-based command registration
- **Wake Word Detection** - Activate on custom wake words
- **Intent Parsing** - Natural language understanding
- **Voice Assistant** - Conversational AI assistant
- **Voice Navigation** - Navigate apps with voice
- **React Hooks** - Easy component integration

## Quick Start

```typescript
import { SpeechRecognitionEngine, SpeechSynthesisEngine } from '@philjs/voice';

// Speech recognition
const recognition = new SpeechRecognitionEngine({
  language: 'en-US',
  continuous: true,
});

recognition.on('final', (result) => {
  console.log('You said:', result.transcript);
});

recognition.start();

// Speech synthesis
const synthesis = new SpeechSynthesisEngine();
await synthesis.speak('Hello! How can I help you?');
```

## Speech Recognition

### Basic Recognition

```typescript
import { SpeechRecognitionEngine } from '@philjs/voice';

const recognition = new SpeechRecognitionEngine({
  language: 'en-US',
  continuous: true,       // Keep listening
  interimResults: true,   // Show partial results
  maxAlternatives: 3,     // Number of alternatives
});

// Listen for results
recognition.on('result', (results) => {
  for (const result of results) {
    console.log('Transcript:', result.transcript);
    console.log('Confidence:', result.confidence);
    console.log('Is final:', result.isFinal);
  }
});

// Final results only
recognition.on('final', (result) => {
  console.log('Final:', result.transcript);
  processCommand(result.transcript);
});

// Error handling
recognition.on('error', (error) => {
  console.error('Recognition error:', error);
});

// Start/stop listening
recognition.start();
recognition.stop();
recognition.abort(); // Stop immediately

// Change language
recognition.setLanguage('es-ES');

// Check browser support
if (SpeechRecognitionEngine.isSupported()) {
  // Speech recognition available
}
```

### Events

| Event | Description |
|-------|-------------|
| `start` | Recognition started |
| `end` | Recognition ended |
| `result` | Received results (interim and final) |
| `final` | Received final result |
| `error` | Error occurred |

## Speech Synthesis

### Basic Synthesis

```typescript
import { SpeechSynthesisEngine } from '@philjs/voice';

const synthesis = new SpeechSynthesisEngine({
  language: 'en-US',
  speechRate: 1,      // 0.1 to 10
  speechPitch: 1,     // 0 to 2
  speechVolume: 1,    // 0 to 1
  voice: 'Samantha',  // Voice name (partial match)
});

// Speak text (returns promise)
await synthesis.speak('Hello, world!');

// Speak with custom options
await synthesis.speak('Hola mundo', {
  language: 'es-ES',
  speechRate: 0.8,
});

// Control playback
synthesis.pause();
synthesis.resume();
synthesis.stop();

// Check if speaking
if (synthesis.isSpeaking()) {
  console.log('Currently speaking...');
}
```

### Voice Selection

```typescript
// Get all available voices
const voices = synthesis.getVoices();
console.log(voices.map(v => `${v.name} (${v.lang})`));

// Get voices for specific language
const spanishVoices = synthesis.getVoicesForLanguage('es');

// Use specific voice
await synthesis.speak('Hello', { voice: 'Google UK English Female' });

// Check browser support
if (SpeechSynthesisEngine.isSupported()) {
  // Speech synthesis available
}
```

## Voice Commands

### Registering Commands

```typescript
import { VoiceCommandSystem } from '@philjs/voice';

const commands = new VoiceCommandSystem({
  language: 'en-US',
  continuous: true,
  wakeWord: 'hey assistant', // Optional wake word
});

// Register commands with string patterns
commands.registerCommand({
  pattern: 'hello',
  handler: (match) => {
    console.log('User said hello!');
  },
  description: 'Greet the assistant',
});

// Register with regex patterns
commands.registerCommand({
  pattern: /(?:play|start)\s+(.+)/i,
  handler: (match) => {
    const song = match.matches[1];
    console.log('Playing:', song);
  },
  priority: 10, // Higher priority commands match first
  description: 'Play music',
});

// Register multiple commands
const unsubscribe = commands.registerCommands([
  { pattern: 'pause', handler: () => pauseMusic() },
  { pattern: 'stop', handler: () => stopMusic() },
  { pattern: /volume (\d+)/i, handler: (m) => setVolume(m.matches[1]) },
]);

// Start listening
commands.start();

// Stop listening
commands.stop();

// Get registered commands
const registered = commands.getCommands();
```

### Wake Word Detection

```typescript
const commands = new VoiceCommandSystem({
  wakeWord: 'hey jarvis',
  wakeWordSensitivity: 0.7,
});

// Commands only execute after wake word is detected
commands.registerCommand({
  pattern: 'turn on the lights',
  handler: () => turnOnLights(),
});

// Wake word activates for 10 seconds
// Say: "Hey Jarvis, turn on the lights"

// Change wake word
commands.setWakeWord('ok computer');

// Disable wake word
commands.setWakeWord(null);
```

## Intent Parsing

### Built-in Intents

```typescript
import { IntentParser } from '@philjs/voice';

const parser = new IntentParser();

// Built-in intents:
// - navigation: "go to", "navigate to", "open"
// - search: "search for", "find", "what is"
// - action: "click", "scroll", "go back"
// - form: "type X into Y", "set X to Y"
// - control: "stop", "cancel", "yes", "no"
// - help: "help", "what can you do"

const result = parser.parse('go to the settings page');

if (result) {
  console.log({
    transcript: result.transcript,
    intent: result.intent,           // 'navigation'
    entities: result.entities,       // { destination: 'settings page' }
    confidence: result.confidence,
  });
}
```

### Custom Intents

```typescript
// Register custom intent
parser.registerIntent('smart_home', [
  {
    pattern: /turn\s+(on|off)\s+(?:the\s+)?(.+)/i,
    entities: ['state', 'device'],
  },
  {
    pattern: /set\s+(.+)\s+to\s+(\d+)\s*(?:degrees|percent)?/i,
    entities: ['device', 'value'],
  },
]);

const result = parser.parse('turn off the living room lights');
// { intent: 'smart_home', entities: { state: 'off', device: 'living room lights' } }

const result2 = parser.parse('set thermostat to 72 degrees');
// { intent: 'smart_home', entities: { device: 'thermostat', value: '72' } }
```

## Voice Assistant

### Creating an Assistant

```typescript
import { VoiceAssistant } from '@philjs/voice';

const assistant = new VoiceAssistant({
  name: 'Aria',
  language: 'en-US',
  wakeWord: 'hey aria',
  greeting: 'Hello! I\'m Aria. How can I help you today?',
  fallbackResponse: 'I\'m not sure how to help with that.',
  confirmationPhrases: ['Got it', 'Done', 'Okay'],
  cancelPhrases: ['Cancelled', 'Never mind'],
  speechRate: 1,
  speechPitch: 1.1,
});

// Listen for events
assistant.on('statechange', (state) => {
  console.log('Listening:', state.isListening);
  console.log('Speaking:', state.isSpeaking);
  console.log('Processing:', state.isProcessing);
});

assistant.on('intent', (parsed) => {
  console.log('Detected intent:', parsed.intent);
  console.log('Entities:', parsed.entities);
});

assistant.on('navigate', (destination) => {
  router.push(`/${destination}`);
});

assistant.on('search', (query) => {
  search(query);
});

// Start the assistant
await assistant.start();

// Respond programmatically
await assistant.respond('I found 5 results for your search.');

// Get current state
const state = assistant.getState();

// Get conversation history
const history = assistant.getConversation();

// Clear history
assistant.clearConversation();

// Stop the assistant
assistant.stop();
```

### Custom Commands

```typescript
// Register custom commands
assistant.registerCommand({
  pattern: /(?:set|change) theme to (dark|light)/i,
  handler: async (match) => {
    const theme = match.matches[1];
    setTheme(theme);
    await assistant.respond(`Theme changed to ${theme} mode.`);
  },
  description: 'Change theme',
});

// Register custom intents
assistant.registerIntent('weather', [
  {
    pattern: /(?:what's|what is) the weather (?:like )?(?:in\s+)?(.+)?/i,
    entities: ['location'],
  },
]);
```

### AI Integration

```typescript
const assistant = new VoiceAssistant({
  aiProvider: 'openai',
  aiApiKey: process.env.OPENAI_API_KEY,
  // When no intent matches, falls back to AI
});
```

## Voice Navigation

### Setting Up Navigation

```typescript
import { VoiceNavigation } from '@philjs/voice';

const navigation = new VoiceNavigation(
  (path) => {
    // Your navigation function (e.g., router.push)
    router.push(path);
  },
  { language: 'en-US' }
);

// Map phrases to routes
navigation.mapRoute('home', '/');
navigation.mapRoute('settings', '/settings');
navigation.mapRoute('profile', '/user/profile');
navigation.mapRoute('my orders', '/orders');

// Or map multiple at once
navigation.mapRoutes({
  'dashboard': '/dashboard',
  'analytics': '/analytics',
  'help': '/support',
});

// Start listening
navigation.start();

// Now say: "Go to dashboard" or "Navigate to settings"
// Built-in: "Go back", "Go forward", "Home"

// Stop listening
navigation.stop();
```

## React Hooks

### useSpeechRecognition

```typescript
import { useSpeechRecognition } from '@philjs/voice';

function VoiceInput() {
  const {
    transcript,
    isListening,
    start,
    stop,
    error,
    supported,
  } = useSpeechRecognition({ language: 'en-US' });

  if (!supported) {
    return <p>Speech recognition not supported</p>;
  }

  return (
    <div>
      <p>Transcript: {transcript}</p>
      <button onClick={isListening ? stop : start}>
        {isListening ? 'Stop' : 'Start'} Listening
      </button>
      {error && <p class="error">{error}</p>}
    </div>
  );
}
```

### useSpeechSynthesis

```typescript
import { useSpeechSynthesis } from '@philjs/voice';

function TextToSpeech() {
  const {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    voices,
    supported,
  } = useSpeechSynthesis();

  if (!supported) {
    return <p>Speech synthesis not supported</p>;
  }

  return (
    <div>
      <select>
        {voices.map(voice => (
          <option key={voice.name} value={voice.name}>
            {voice.name} ({voice.lang})
          </option>
        ))}
      </select>
      <button onClick={() => speak('Hello, world!')}>
        Speak
      </button>
      <button onClick={isSpeaking ? pause : resume}>
        {isSpeaking ? 'Pause' : 'Resume'}
      </button>
      <button onClick={stop}>Stop</button>
    </div>
  );
}
```

### useVoiceCommands

```typescript
import { useVoiceCommands } from '@philjs/voice';

function VoiceControlledApp() {
  const { isListening, start, stop, setWakeWord } = useVoiceCommands([
    {
      pattern: 'scroll down',
      handler: () => window.scrollBy(0, 300),
    },
    {
      pattern: 'scroll up',
      handler: () => window.scrollBy(0, -300),
    },
    {
      pattern: /zoom (in|out)/i,
      handler: (match) => {
        const direction = match.matches[1];
        direction === 'in' ? zoomIn() : zoomOut();
      },
    },
  ]);

  return (
    <div>
      <button onClick={isListening ? stop : start}>
        {isListening ? 'Disable' : 'Enable'} Voice Control
      </button>
      <button onClick={() => setWakeWord('hey app')}>
        Set Wake Word
      </button>
    </div>
  );
}
```

### useVoiceAssistant

```typescript
import { useVoiceAssistant } from '@philjs/voice';

function AssistantUI() {
  const {
    state,
    conversation,
    start,
    stop,
    respond,
    registerCommand,
    clearConversation,
  } = useVoiceAssistant({
    name: 'Aria',
    greeting: 'Hello! How can I help?',
  });

  useEffect(() => {
    registerCommand({
      pattern: 'clear history',
      handler: () => clearConversation(),
    });
  }, []);

  return (
    <div class="assistant">
      <div class="status">
        {state.isListening && '🎤 Listening...'}
        {state.isSpeaking && '🔊 Speaking...'}
        {state.isProcessing && '⏳ Processing...'}
      </div>

      <div class="conversation">
        {conversation.map((turn, i) => (
          <div key={i} class={`turn ${turn.role}`}>
            <strong>{turn.role}:</strong> {turn.content}
          </div>
        ))}
      </div>

      <div class="controls">
        <button onClick={() => start()}>Start</button>
        <button onClick={() => stop()}>Stop</button>
      </div>
    </div>
  );
}
```

### useVoiceNavigation

```typescript
import { useVoiceNavigation } from '@philjs/voice';
import { useNavigate } from '@philjs/router';

function App() {
  const navigate = useNavigate();

  const { start, stop, mapRoute } = useVoiceNavigation(
    navigate,
    {
      'home': '/',
      'settings': '/settings',
      'profile': '/user/profile',
    }
  );

  // Dynamically add routes
  useEffect(() => {
    mapRoute('my cart', '/cart');
    mapRoute('checkout', '/checkout');
  }, []);

  return (
    <button onClick={start}>
      Enable Voice Navigation
    </button>
  );
}
```

## Types Reference

```typescript
// Voice configuration
interface VoiceConfig {
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

// Voice command
interface VoiceCommand {
  pattern: string | RegExp;
  handler: (match: VoiceMatch) => void | Promise<void>;
  priority?: number;
  description?: string;
}

// Voice match result
interface VoiceMatch {
  transcript: string;
  confidence: number;
  matches: string[];
  intent?: string;
  entities?: Record<string, string>;
}

// Speech result
interface SpeechResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives: Array<{ transcript: string; confidence: number }>;
}

// Voice state
interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  transcript: string;
  error: string | null;
  wakeWordDetected: boolean;
}

// Conversation turn
interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  intent?: string;
  entities?: Record<string, string>;
}

// Voice assistant config
interface VoiceAssistantConfig extends VoiceConfig {
  name?: string;
  greeting?: string;
  fallbackResponse?: string;
  confirmationPhrases?: string[];
  cancelPhrases?: string[];
  aiProvider?: 'openai' | 'anthropic' | 'local';
  aiApiKey?: string;
}
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `SpeechRecognitionEngine` | Speech-to-text |
| `SpeechSynthesisEngine` | Text-to-speech |
| `VoiceCommandSystem` | Voice command registration |
| `IntentParser` | Natural language intent parsing |
| `VoiceAssistant` | Conversational assistant |
| `VoiceNavigation` | Voice-driven navigation |

### Hooks

| Hook | Description |
|------|-------------|
| `useSpeechRecognition(config?)` | Speech recognition |
| `useSpeechSynthesis(config?)` | Speech synthesis |
| `useVoiceCommands(commands, config?)` | Voice commands |
| `useVoiceAssistant(config?)` | Voice assistant |
| `useVoiceNavigation(onNavigate, routes?, config?)` | Voice navigation |

### Browser Support

- **Speech Recognition**: Chrome, Edge, Safari (partial)
- **Speech Synthesis**: All modern browsers

```typescript
// Check support
SpeechRecognitionEngine.isSupported();
SpeechSynthesisEngine.isSupported();
```

## Examples

### Voice-Controlled Form

```typescript
import { VoiceCommandSystem, SpeechSynthesisEngine } from '@philjs/voice';

function setupVoiceForm(form: HTMLFormElement) {
  const commands = new VoiceCommandSystem();
  const synthesis = new SpeechSynthesisEngine();

  // Fill fields by voice
  commands.registerCommand({
    pattern: /(?:set|enter|type)\s+(.+)\s+(?:in|into|for)\s+(.+)/i,
    handler: async (match) => {
      const value = match.matches[1];
      const fieldName = match.matches[2];

      const input = form.querySelector(`[name*="${fieldName}"]`);
      if (input) {
        (input as HTMLInputElement).value = value;
        await synthesis.speak(`Set ${fieldName} to ${value}`);
      } else {
        await synthesis.speak(`Field ${fieldName} not found`);
      }
    },
  });

  // Submit form
  commands.registerCommand({
    pattern: /submit|send|done/i,
    handler: async () => {
      form.submit();
      await synthesis.speak('Form submitted');
    },
  });

  commands.start();
  return () => commands.stop();
}
```

### Accessibility Voice Control

```typescript
import { VoiceCommandSystem } from '@philjs/voice';

const commands = new VoiceCommandSystem();

// Page navigation
commands.registerCommand({
  pattern: /(?:click|press|select)\s+(.+)/i,
  handler: (match) => {
    const target = match.matches[1].toLowerCase();
    const element = document.querySelector(
      `[aria-label*="${target}"], button:contains("${target}"), a:contains("${target}")`
    );
    if (element) (element as HTMLElement).click();
  },
});

// Scrolling
commands.registerCommand({
  pattern: /scroll\s+(up|down)/i,
  handler: (match) => {
    const amount = match.matches[1] === 'up' ? -300 : 300;
    window.scrollBy({ top: amount, behavior: 'smooth' });
  },
});

// Reading content
commands.registerCommand({
  pattern: /read\s+(?:the\s+)?(.+)/i,
  handler: async (match) => {
    const target = match.matches[1];
    const element = document.querySelector(`[aria-label*="${target}"]`);
    if (element) {
      const synthesis = new SpeechSynthesisEngine();
      await synthesis.speak(element.textContent || '');
    }
  },
});

commands.start();
```
