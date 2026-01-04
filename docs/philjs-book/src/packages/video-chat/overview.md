# @philjs/video-chat

Full-featured video conferencing for PhilJS with virtual backgrounds, noise suppression, recording, transcription, breakout rooms, and collaborative features.

## Installation

```bash
npm install @philjs/video-chat
```

## Features

- **Multi-Party Video** - Grid, speaker, and sidebar layouts
- **Virtual Backgrounds** - Blur, replace, or remove backgrounds
- **Audio Enhancement** - Noise suppression, echo cancellation, EQ
- **Recording** - Record meetings with composite video
- **Live Transcription** - Real-time speech-to-text
- **Breakout Rooms** - Split participants into smaller groups
- **Reactions & Hand Raising** - Interactive meeting features
- **Chat & File Sharing** - In-meeting communication
- **Screen Sharing** - Share screens with annotation support

## Quick Start

```typescript
import { VideoRoom, useVideoRoom } from '@philjs/video-chat';

function VideoCall() {
  const {
    join,
    leave,
    participants,
    localParticipant,
    mute,
    unmute,
  } = useVideoRoom({
    roomId: 'my-room',
    displayName: 'John Doe',
    signalingUrl: 'wss://signaling.example.com',
  });

  return (
    <div class="video-call">
      <div class="video-grid">
        {participants.map(p => (
          <VideoTile key={p.id} participant={p} />
        ))}
      </div>
      <div class="controls">
        <button onClick={() => join()}>Join</button>
        <button onClick={() => leave()}>Leave</button>
      </div>
    </div>
  );
}
```

## VideoRoom

### Creating a Room

```typescript
import { VideoRoom } from '@philjs/video-chat';

const room = new VideoRoom({
  roomId: 'meeting-123',
  displayName: 'John Doe',
  signalingUrl: 'wss://signaling.example.com',

  // ICE servers
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:turn.example.com', username: 'user', credential: 'pass' },
  ],

  // Features
  enableRecording: true,
  enableTranscription: true,
  enableChat: true,

  // Virtual background
  virtualBackground: {
    type: 'blur',
    blurStrength: 0.7,
  },

  // Audio enhancement
  audioEnhancement: {
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
  },
});

// Join the room
const localParticipant = await room.join();
```

### Room Events

```typescript
// Participant events
room.on('participantJoined', (participant) => {
  console.log('Joined:', participant.name);
});

room.on('participantLeft', (participant) => {
  console.log('Left:', participant.name);
});

// Chat events
room.on('chatMessage', (message) => {
  console.log(`${message.senderName}: ${message.text}`);
});

// Recording events
room.on('recordingStarted', () => {
  console.log('Recording started');
});

room.on('recordingStopped', (blob) => {
  downloadRecording(blob);
});

// Transcription events
room.on('transcription', (segment) => {
  console.log(`${segment.speakerName}: ${segment.text}`);
});

// Connection events
room.on('connectionQualityChanged', ({ participantId, quality }) => {
  console.log(`${participantId} quality: ${quality}`);
});
```

### Audio/Video Controls

```typescript
// Mute/unmute
room.mute();
room.unmute();

// Hide/show video
room.hideVideo();
room.showVideo();

// Screen sharing
await room.startScreenShare();
await room.stopScreenShare();
```

### Leaving the Room

```typescript
await room.leave();
```

## Virtual Backgrounds

### Configuration

```typescript
import { VirtualBackgroundProcessor } from '@philjs/video-chat';

// Create processor
const bgProcessor = new VirtualBackgroundProcessor({
  type: 'blur',         // 'none' | 'blur' | 'image' | 'video' | 'remove'
  blurStrength: 0.7,    // 0-1 for blur intensity
  edgeBlur: 0.1,        // Edge smoothing
  segmentationModel: 'mediapipe', // 'mediapipe' | 'tensorflow'
});

await bgProcessor.initialize();
```

### Background Types

```typescript
// Blur background
room.setVirtualBackground({
  type: 'blur',
  blurStrength: 0.8,
});

// Replace with image
room.setVirtualBackground({
  type: 'image',
  backgroundUrl: '/backgrounds/office.jpg',
});

// Remove background (transparent)
room.setVirtualBackground({
  type: 'remove',
});

// Disable virtual background
room.setVirtualBackground({
  type: 'none',
});
```

## Audio Enhancement

### AudioEnhancer

```typescript
import { AudioEnhancer } from '@philjs/video-chat';

const enhancer = new AudioEnhancer({
  noiseSuppression: true,
  echoCancellation: true,
  autoGainControl: true,
  noiseGate: true,
  noiseGateThreshold: -50,
  compressor: true,
  equalizer: [0, 0, 0, 2, 4, 4, 2, 0, 0, 0], // 10-band EQ
});

await enhancer.initialize();

// Process audio stream
const enhancedStream = enhancer.processStream(inputStream);

// Adjust EQ in real-time
enhancer.setEqualizer([0, 2, 4, 6, 4, 2, 0, -2, -4, -6]);
```

## Participants

### Participant State

```typescript
const participant = room.getParticipants().find(p => p.id === id);
const state = participant.getState();

console.log({
  id: state.id,
  name: state.name,
  isLocal: state.isLocal,
  isMuted: state.isMuted,
  isVideoOff: state.isVideoOff,
  isScreenSharing: state.isScreenSharing,
  isSpeaking: state.isSpeaking,
  isHandRaised: state.isHandRaised,
  reaction: state.reaction,
  connectionQuality: state.connectionQuality, // 'excellent' | 'good' | 'fair' | 'poor'
  audioLevel: state.audioLevel, // 0-1
  role: state.role, // 'host' | 'cohost' | 'participant'
});
```

### Participant Events

```typescript
participant.on('muted', (isMuted) => {
  updateMuteIcon(isMuted);
});

participant.on('videoOff', (isOff) => {
  toggleVideoPlaceholder(isOff);
});

participant.on('reaction', (emoji) => {
  showReaction(emoji);
});

participant.on('handRaised', (isRaised) => {
  updateHandRaisedList();
});

participant.on('streamChanged', (stream) => {
  videoElement.srcObject = stream;
});
```

## Chat

### Sending Messages

```typescript
// Text message
room.sendChatMessage('Hello everyone!');

// File sharing
const file = document.getElementById('file-input').files[0];
await room.sendFile(file);
```

### Chat History

```typescript
const messages = room.getChatHistory();

messages.forEach(msg => {
  console.log({
    id: msg.id,
    senderId: msg.senderId,
    senderName: msg.senderName,
    text: msg.text,
    timestamp: msg.timestamp,
    type: msg.type, // 'text' | 'file' | 'system'
    fileUrl: msg.fileUrl,
    fileName: msg.fileName,
  });
});
```

## Reactions & Hand Raising

```typescript
// Send reaction (visible for 3 seconds)
room.react('👏');
room.react('❤️');
room.react('😂');
room.react('👍');

// Raise/lower hand
room.raiseHand();
room.lowerHand();

// Get participants with raised hands
const raisedHands = room.getParticipants()
  .filter(p => p.getState().isHandRaised);
```

## Recording

### Start/Stop Recording

```typescript
// Start recording
await room.startRecording();

// Stop and get recording blob
const recordingBlob = room.stopRecording();

// Download recording
const url = URL.createObjectURL(recordingBlob);
const a = document.createElement('a');
a.href = url;
a.download = 'meeting-recording.webm';
a.click();
```

### Recording Events

```typescript
room.on('recordingStarted', () => {
  showRecordingIndicator();
});

room.on('recordingStopped', (blob) => {
  uploadToCloud(blob);
});
```

## Live Transcription

### Getting Transcription

```typescript
// Get transcript
const transcript = room.getTranscription();

transcript.forEach(segment => {
  console.log({
    id: segment.id,
    speakerId: segment.speakerId,
    speakerName: segment.speakerName,
    text: segment.text,
    timestamp: segment.timestamp,
    isFinal: segment.isFinal,
  });
});
```

### Real-time Updates

```typescript
room.on('transcription', (segment) => {
  if (segment.isFinal) {
    addToTranscript(segment);
  } else {
    updateLiveCaption(segment);
  }
});
```

## Breakout Rooms

### Creating Breakout Rooms

```typescript
// Create breakout room
const roomId = room.createBreakoutRoom('Discussion Group 1');

// Assign participants
room.assignToBreakoutRoom(participantId, roomId);

// Close all breakout rooms
room.closeBreakoutRooms();
```

### Breakout Events

```typescript
room.on('breakoutRoomCreated', ({ roomId, name }) => {
  console.log('Created breakout room:', name);
});

room.on('participantAssigned', ({ participantId, breakoutRoomId }) => {
  console.log('Participant assigned to breakout room');
});

room.on('breakoutRoomsClosed', () => {
  console.log('All breakout rooms closed');
});
```

## Layout Modes

```typescript
// Set layout
room.setLayout('grid');      // Equal-sized tiles
room.setLayout('speaker');   // Active speaker prominent
room.setLayout('sidebar');   // Speaker with sidebar
room.setLayout('spotlight'); // Focus on one person
room.setLayout('presentation'); // Screen share focus

// Get current layout
const layout = room.getLayout();

// Pin participant
room.pinParticipant(participantId);
room.unpinParticipant();
```

## Video Grid Layout

### Pre-built Grid Component

```typescript
import { VideoGridLayout } from '@philjs/video-chat';

const container = document.getElementById('video-container');
const grid = new VideoGridLayout(container, {
  maxColumns: 4,
  aspectRatio: 16 / 9,
  gap: 8,
  showNames: true,
  showMuteIndicator: true,
  showConnectionQuality: true,
});

// Update when participants change
room.on('participantJoined', () => {
  grid.updateLayout(room.getParticipants());
});

room.on('participantLeft', () => {
  grid.updateLayout(room.getParticipants());
});
```

## React Hooks

### useVideoRoom

```typescript
import { useVideoRoom } from '@philjs/video-chat';

function VideoCall() {
  const {
    room,
    participants,
    localParticipant,
    activeSpeaker,
    layout,
    isConnected,
    chatMessages,
    join,
    leave,
    mute,
    unmute,
    hideVideo,
    showVideo,
    startScreenShare,
    stopScreenShare,
    sendMessage,
    react,
    raiseHand,
    lowerHand,
    setLayout,
    pinParticipant,
    unpinParticipant,
    setVirtualBackground,
  } = useVideoRoom({
    roomId: 'meeting-123',
    displayName: 'John Doe',
    signalingUrl: 'wss://signaling.example.com',
  });

  return (/* ... */);
}
```

### useParticipant

```typescript
import { useParticipant } from '@philjs/video-chat';

function ParticipantTile({ participant }) {
  const state = useParticipant(participant);

  return (
    <div class={`tile ${state.isSpeaking ? 'speaking' : ''}`}>
      <video ref={el => el && (el.srcObject = participant.stream)} />
      <div class="name">{state.name}</div>
      {state.isMuted && <span class="muted-icon">🔇</span>}
      {state.isHandRaised && <span class="hand">✋</span>}
      {state.reaction && <span class="reaction">{state.reaction}</span>}
    </div>
  );
}
```

### useActiveSpeaker

```typescript
import { useActiveSpeaker } from '@philjs/video-chat';

function ActiveSpeakerView({ room }) {
  const activeSpeaker = useActiveSpeaker(room);

  return activeSpeaker ? (
    <div class="active-speaker">
      <video
        autoPlay
        playsInline
        ref={el => el && (el.srcObject = activeSpeaker.stream)}
      />
      <span>{activeSpeaker.name} is speaking</span>
    </div>
  ) : null;
}
```

### useVirtualBackground

```typescript
import { useVirtualBackground } from '@philjs/video-chat';

function BackgroundPicker() {
  const { config, setType, setBlurStrength, setBackgroundImage } = useVirtualBackground();

  return (
    <div class="bg-picker">
      <button onClick={() => setType('none')}>None</button>
      <button onClick={() => setType('blur')}>Blur</button>
      <button onClick={() => setBackgroundImage('/bg/office.jpg')}>Office</button>
      <button onClick={() => setBackgroundImage('/bg/beach.jpg')}>Beach</button>

      {config.type === 'blur' && (
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={config.blurStrength}
          onChange={(e) => setBlurStrength(parseFloat(e.target.value))}
        />
      )}
    </div>
  );
}
```

## Types Reference

```typescript
// Room configuration
interface RoomConfig {
  roomId: string;
  displayName: string;
  signalingUrl: string;
  iceServers?: RTCIceServer[];
  maxParticipants?: number;
  enableRecording?: boolean;
  enableTranscription?: boolean;
  enableChat?: boolean;
  virtualBackground?: VirtualBackgroundConfig;
  audioEnhancement?: Partial<AudioEnhancementConfig>;
}

// Virtual background
interface VirtualBackgroundConfig {
  type: 'none' | 'blur' | 'image' | 'video' | 'remove';
  blurStrength?: number;
  backgroundUrl?: string;
  edgeBlur?: number;
  segmentationModel?: 'mediapipe' | 'tensorflow' | 'custom';
}

// Audio enhancement
interface AudioEnhancementConfig {
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  noiseGate: boolean;
  noiseGateThreshold?: number;
  compressor: boolean;
  equalizer?: number[];
}

// Participant state
interface ParticipantState {
  id: string;
  name: string;
  isLocal: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
  isHandRaised: boolean;
  reaction?: string;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  audioLevel: number;
  role: 'host' | 'cohost' | 'participant';
}

// Chat message
interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  type: 'text' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
}

// Transcription segment
interface TranscriptionSegment {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  timestamp: Date;
  isFinal: boolean;
}

// Layout modes
type LayoutMode = 'grid' | 'speaker' | 'sidebar' | 'spotlight' | 'presentation';
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `VideoRoom` | Main video room management |
| `Participant` | Individual participant |
| `VirtualBackgroundProcessor` | Background effects |
| `AudioEnhancer` | Audio processing |
| `VideoGridLayout` | Pre-built video grid |

### Hooks

| Hook | Description |
|------|-------------|
| `useVideoRoom(config)` | Full room management |
| `useParticipant(participant)` | Participant state |
| `useActiveSpeaker(room)` | Active speaker detection |
| `useVirtualBackground(config?)` | Background controls |
