# @philjs/voice

Voice UI primitives for PhilJS - speech recognition, synthesis, and voice commands

<!-- PACKAGE_GUIDE_START -->
## Overview

Voice UI primitives for PhilJS - speech recognition, synthesis, and voice commands

## Focus Areas

- philjs, voice, speech, recognition, synthesis, voice-ui, accessibility

## Entry Points

- packages/philjs-voice/src/index.ts

## Quick Start

```ts
import { ConversationTurn, IntentParser, SpeechRecognitionEngine } from '@philjs/voice';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- ConversationTurn
- IntentParser
- SpeechRecognitionEngine
- SpeechResult
- SpeechSynthesisEngine
- VoiceAssistant
- VoiceAssistantConfig
- VoiceCommand
- VoiceCommandSystem
- VoiceConfig
- VoiceMatch
- VoiceNavigation
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/voice
```
## Usage

```ts
import { ConversationTurn, IntentParser, SpeechRecognitionEngine } from '@philjs/voice';
```

## Scripts

- pnpm run build
- pnpm run test

## Compatibility

- Node >=24
- TypeScript 6

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: .
- Source files: packages/philjs-voice/src/index.ts

### Public API
- Direct exports: ConversationTurn, IntentParser, SpeechRecognitionEngine, SpeechResult, SpeechSynthesisEngine, VoiceAssistant, VoiceAssistantConfig, VoiceCommand, VoiceCommandSystem, VoiceConfig, VoiceMatch, VoiceNavigation, VoiceState, useSpeechRecognition, useSpeechSynthesis, useVoiceAssistant, useVoiceCommands, useVoiceNavigation
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT
