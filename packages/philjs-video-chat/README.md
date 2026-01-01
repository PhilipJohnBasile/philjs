# @philjs/video-chat

Full-featured video conferencing for PhilJS applications. Includes multi-party video rooms, virtual backgrounds, noise suppression, recording, transcription, breakout rooms, and more.

## Installation

```bash
npm install @philjs/video-chat
```

## Requirements

- Node.js >= 24
- Peer dependencies:
  - `@philjs/core`
  - `@philjs/webrtc`
- Browser with WebRTC support
- For virtual backgrounds: MediaPipe Selfie Segmentation (loaded dynamically)

## Basic Usage

```typescript
import { VideoRoom, useVideoRoom } from '@philjs/video-chat';

// Using the hook-based API
const {
  room,
  participants,
  localParticipant,
  join,
  leave,
  mute,
  unmute,
  startScreenShare
} = useVideoRoom({
  roomId: 'my-room-123',
  displayName: 'John Doe',
  signalingUrl: 'wss://your-signaling-server.com',
  enableRecording: true,
  enableTranscription: true
});

// Join the room
await join();

// Control your media
mute();
unmute();
startScreenShare();

// Send a chat message
sendMessage('Hello everyone!');

// Leave when done
await leave();
```

## Virtual Backgrounds

```typescript
import { VideoRoom, VirtualBackgroundProcessor } from '@philjs/video-chat';

const room = new VideoRoom({
  roomId: 'my-room',
  displayName: 'Jane',
  signalingUrl: 'wss://server.com',
  virtualBackground: {
    type: 'blur',
    blurStrength: 0.7,
    segmentationModel: 'mediapipe'
  }
});

// Change background during the call
room.setVirtualBackground({
  type: 'image',
  backgroundUrl: '/backgrounds/beach.jpg'
});

// Remove background (transparent)
room.setVirtualBackground({ type: 'remove' });
```

## Audio Enhancement

```typescript
import { AudioEnhancer } from '@philjs/video-chat';

const room = new VideoRoom({
  roomId: 'my-room',
  displayName: 'User',
  signalingUrl: 'wss://server.com',
  audioEnhancement: {
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
    noiseGate: true,
    noiseGateThreshold: -50,
    compressor: true,
    equalizer: [0, 0, 2, 4, 4, 2, 0, -2, -2, 0] // 10-band EQ
  }
});
```

## Recording and Transcription

```typescript
const room = new VideoRoom({
  roomId: 'meeting-001',
  displayName: 'Host',
  signalingUrl: 'wss://server.com',
  enableRecording: true,
  enableTranscription: true
});

await room.join();

// Start recording
await room.startRecording();

// Get live transcription
room.on('transcription', (segment) => {
  console.log(`${segment.speakerName}: ${segment.text}`);
});

// Stop recording and get the video blob
const recordingBlob = room.stopRecording();

// Get full transcription history
const transcript = room.getTranscription();
```

## Breakout Rooms

```typescript
// Create breakout rooms (host only)
const breakoutId = room.createBreakoutRoom('Discussion Group 1');

// Assign participants
room.assignToBreakoutRoom(participantId, breakoutId);

// Close all breakout rooms
room.closeBreakoutRooms();
```

## API Reference

### Classes

#### `VideoRoom`

Main video conferencing room class.

**Constructor Options (`RoomConfig`):**
- `roomId: string` - Unique room identifier
- `displayName: string` - Your display name
- `signalingUrl: string` - WebSocket signaling server URL
- `iceServers?: RTCIceServer[]` - STUN/TURN servers
- `maxParticipants?: number` - Maximum participants allowed
- `enableRecording?: boolean` - Enable recording capability
- `enableTranscription?: boolean` - Enable live transcription
- `enableChat?: boolean` - Enable in-room chat
- `virtualBackground?: VirtualBackgroundConfig` - Virtual background settings
- `audioEnhancement?: AudioEnhancementConfig` - Audio processing settings

**Methods:**
- `join(): Promise<Participant>` - Join the room
- `leave(): Promise<void>` - Leave the room
- `mute() / unmute()` - Control microphone
- `hideVideo() / showVideo()` - Control camera
- `startScreenShare() / stopScreenShare()` - Screen sharing
- `sendChatMessage(text: string)` - Send chat message
- `sendFile(file: File)` - Share a file
- `react(emoji: string)` - Send reaction
- `raiseHand() / lowerHand()` - Hand raising
- `setLayout(mode: LayoutMode)` - Change video layout
- `pinParticipant(id) / unpinParticipant()` - Pin a participant
- `startRecording() / stopRecording()` - Recording controls
- `createBreakoutRoom(name)` - Create breakout room
- `setVirtualBackground(config)` - Change background

**Events:**
- `joined` - You joined the room
- `left` - You left the room
- `participantJoined` - A participant joined
- `participantLeft` - A participant left
- `chatMessage` - New chat message
- `transcription` - Transcription segment
- `recordingStarted / recordingStopped`
- `screenShareStarted / screenShareStopped`
- `layoutChanged`

#### `Participant`

Represents a participant in the room.

**Properties:**
- `id: string` - Unique identifier
- `name: string` - Display name
- `isLocal: boolean` - Is this the local user
- `stream: MediaStream | null` - Video/audio stream
- `screenStream: MediaStream | null` - Screen share stream

**Methods:**
- `mute() / unmute()`
- `hideVideo() / showVideo()`
- `raiseHand() / lowerHand()`
- `react(emoji: string)`
- `getState(): ParticipantState`

#### `VirtualBackgroundProcessor`

Handles virtual background processing.

#### `AudioEnhancer`

Handles audio processing and enhancement.

#### `VideoGridLayout`

Pre-built video grid layout component.

### Hooks

- **`useVideoRoom(config: RoomConfig)`** - Main hook for video room functionality
- **`useParticipant(participant: Participant)`** - Get participant state
- **`useActiveSpeaker(room: VideoRoom)`** - Get the current active speaker
- **`useVirtualBackground(config?)`** - Manage virtual background settings

### Types

- `RoomConfig` - Room configuration options
- `VirtualBackgroundConfig` - Virtual background settings
- `AudioEnhancementConfig` - Audio enhancement settings
- `ParticipantState` - Participant status and metadata
- `ChatMessage` - Chat message structure
- `TranscriptionSegment` - Transcription data
- `LayoutMode` - 'grid' | 'speaker' | 'sidebar' | 'spotlight' | 'presentation'
- `VideoGridConfig` - Grid layout configuration

## Layout Modes

- **grid** - Equal-sized video tiles in a grid
- **speaker** - Active speaker large, others small
- **sidebar** - Main video with sidebar of participants
- **spotlight** - Single large video
- **presentation** - Screen share focused layout

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: .
- Source files: packages/philjs-video-chat/src/index.ts

### Public API
- Direct exports: // Core classes
  VideoRoom, // Hooks
  useVideoRoom, // Types
  type RoomConfig, AudioEnhancementConfig, AudioEnhancer, ChatMessage, LayoutMode, Participant, ParticipantState, TranscriptionSegment, UseVideoRoomResult, VideoGridConfig, VideoGridLayout, VirtualBackgroundConfig, VirtualBackgroundProcessor, useActiveSpeaker, useParticipant, useVirtualBackground
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT
