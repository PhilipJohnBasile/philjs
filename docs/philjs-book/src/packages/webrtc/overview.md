# @philjs/webrtc

Full-featured WebRTC framework for peer-to-peer communication with signaling, room management, data channels, and network quality monitoring.

## Installation

```bash
npm install @philjs/webrtc
```

## Features

- **Signaling Client** - WebSocket-based signaling with auto-reconnection
- **Perfect Negotiation** - Collision-free offer/answer handling
- **Room Management** - Multi-peer room with automatic peer connections
- **Data Channels** - Reliable messaging with chunking for large data
- **ICE/STUN/TURN** - Configurable ICE servers with fallbacks
- **Network Quality** - Real-time RTT, jitter, and packet loss monitoring
- **Stats Collection** - Detailed peer connection statistics
- **React Hooks** - Easy integration with components

## Quick Start

```typescript
import { SignalingClient, RTCRoom } from '@philjs/webrtc';

// Create signaling client
const signaling = new SignalingClient({
  type: 'websocket',
  url: 'wss://your-signaling-server.com'
});

// Connect and join room
await signaling.connect();
const room = new RTCRoom(signaling, 'my-room');

// Set up callbacks
room.onPeerJoined((peerId) => {
  console.log('Peer joined:', peerId);
});

room.onTrack((peerId, track, streams) => {
  videoElement.srcObject = streams[0];
});

// Add local media
const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
room.setLocalStream(stream);

// Join the room
room.join();
```

## Signaling Client

### Creating a Signaling Client

```typescript
import { SignalingClient } from '@philjs/webrtc';

const signaling = new SignalingClient({
  type: 'websocket',
  url: 'wss://signaling.example.com'
}, 'optional-peer-id');

// Connect to server
await signaling.connect();

// Get local peer ID
const myId = signaling.getPeerId();
```

### Joining and Leaving Rooms

```typescript
// Join a room
signaling.joinRoom('room-123');

// Leave current room
signaling.leaveRoom();

// Disconnect from server
signaling.disconnect();
```

### Handling Signaling Messages

```typescript
// Listen for specific message types
const unsubscribe = signaling.on('peer-joined', (data) => {
  console.log('New peer:', data.peerId);
});

signaling.on('peer-left', (data) => {
  console.log('Peer left:', data.peerId);
});

signaling.on('offer', async (data) => {
  // Handle incoming offer
  const { peerId, sdp } = data;
});

signaling.on('answer', async (data) => {
  // Handle incoming answer
  const { peerId, sdp } = data;
});

signaling.on('candidate', async (data) => {
  // Handle ICE candidate
  const { peerId, candidate } = data;
});

// Stop listening
unsubscribe();
```

### Sending Signaling Messages

```typescript
// Send offer to specific peer
signaling.sendOffer(peerId, offer);

// Send answer
signaling.sendAnswer(peerId, answer);

// Send ICE candidate
signaling.sendCandidate(peerId, candidate);
```

### Auto-Reconnection

The signaling client automatically reconnects with exponential backoff:
- Max 5 reconnection attempts
- Starting delay of 1 second, doubling each attempt
- Re-joins the room after reconnection

## Peer Connection

### Creating a Peer Connection

```typescript
import { PeerConnection, DEFAULT_ICE_SERVERS } from '@philjs/webrtc';

const peer = new PeerConnection({
  peerId: 'remote-peer-id',
  polite: true, // Use perfect negotiation pattern

  // ICE configuration
  rtcConfig: {
    iceServers: DEFAULT_ICE_SERVERS,
    iceTransportPolicy: 'all', // 'all' | 'relay'
    bundlePolicy: 'balanced',
  },

  // Pre-create data channels
  dataChannels: [
    { label: 'chat', ordered: true },
    { label: 'files', ordered: false, maxRetransmits: 3 },
  ],

  // Callbacks
  onTrack: (track, streams) => {
    console.log('Received track:', track.kind);
    videoElement.srcObject = streams[0];
  },

  onDataChannel: (channel) => {
    console.log('Data channel:', channel.label);
  },

  onConnectionStateChange: (state) => {
    console.log('Connection state:', state);
  },

  onIceConnectionStateChange: (state) => {
    console.log('ICE state:', state);
  },
});
```

### Perfect Negotiation

The PeerConnection implements the "perfect negotiation" pattern for collision-free offer/answer exchange:

```typescript
// One peer is "polite" (yields on collision)
const politePeer = new PeerConnection({ peerId: 'A', polite: true });

// One peer is "impolite" (wins on collision)
const impolitePeer = new PeerConnection({ peerId: 'B', polite: false });
```

### Handling Signaling

```typescript
// Set up signal handler
peer.setSignalHandler((type, data) => {
  if (type === 'offer') {
    signaling.sendOffer(peerId, data);
  } else if (type === 'answer') {
    signaling.sendAnswer(peerId, data);
  } else if (type === 'candidate') {
    signaling.sendCandidate(peerId, data);
  }
});

// Handle incoming signals
await peer.handleOffer(offer);
await peer.handleAnswer(answer);
await peer.handleCandidate(candidate);
```

### Managing Media Tracks

```typescript
// Add a track
const sender = peer.addTrack(videoTrack, mediaStream);

// Remove a track
peer.removeTrack(sender);

// Replace a track (e.g., switch camera)
await peer.replaceTrack(sender, newVideoTrack);

// Replace with null to mute
await peer.replaceTrack(sender, null);
```

### Data Channels

```typescript
// Get a data channel
const channel = peer.getDataChannel('chat');

// Send data
peer.sendData('chat', 'Hello, peer!');
peer.sendData('files', binaryData);
```

### Connection Statistics

```typescript
// Get current stats
const stats = await peer.getStats();
console.log({
  connectionState: stats.connectionState,
  bytesReceived: stats.bytesReceived,
  bytesSent: stats.bytesSent,
  packetsLost: stats.packetsLost,
  roundTripTime: stats.roundTripTime,
  jitter: stats.jitter,
  framesPerSecond: stats.framesPerSecond,
});

// Monitor stats continuously
peer.startStatsMonitoring(2000, (stats) => {
  updateStatsUI(stats);
});

// Stop monitoring
peer.stopStatsMonitoring();
```

### Lifecycle

```typescript
// Get connection state
const state = peer.getConnectionState();

// Close connection
peer.close();
```

## Room Management

### Creating and Joining a Room

```typescript
import { RTCRoom, SignalingClient } from '@philjs/webrtc';

const signaling = new SignalingClient({
  type: 'websocket',
  url: 'wss://signaling.example.com'
});

await signaling.connect();

const room = new RTCRoom(signaling, 'room-id', {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
});

// Join room
room.join();

// Leave room
room.leave();
```

### Room Callbacks

```typescript
// Peer events
room.onPeerJoined((peerId) => {
  console.log('Peer joined:', peerId);
});

room.onPeerLeft((peerId) => {
  console.log('Peer left:', peerId);
});

// Media tracks
room.onTrack((peerId, track, streams) => {
  const videoElement = document.createElement('video');
  videoElement.srcObject = streams[0];
  videoElement.play();
  document.getElementById('videos').appendChild(videoElement);
});

// Data channels
room.onDataChannel((peerId, channel) => {
  channel.onmessage = (e) => {
    console.log(`Message from ${peerId}:`, e.data);
  };
});

// Connection state
room.onConnectionStateChange((peerId, state) => {
  console.log(`Peer ${peerId} state:`, state);
});
```

### Managing Local Media

```typescript
// Get local media
const stream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true,
});

// Set local stream (adds tracks to all peers)
room.setLocalStream(stream);

// Remove local stream
room.removeLocalStream();
```

### Sending Data

```typescript
// Broadcast to all peers
room.broadcast('chat', JSON.stringify({ message: 'Hello everyone!' }));

// Send to specific peer
room.sendToPeer('peer-123', 'chat', 'Private message');
```

### Getting Room Info

```typescript
// Get all peer IDs
const peers = room.getPeers();

// Get specific peer connection
const peer = room.getPeer('peer-123');

// Get stats for all peers
const allStats = await room.getAllStats();
allStats.forEach((stats, peerId) => {
  console.log(`${peerId}:`, stats);
});
```

## Data Channels with Chunking

### ChunkedDataChannel

For sending large files or data:

```typescript
import { ChunkedDataChannel } from '@philjs/webrtc';

const channel = peer.getDataChannel('files');
const chunked = new ChunkedDataChannel(channel);

// Send large data (automatically chunked)
const largeFile = await file.arrayBuffer();
await chunked.send(largeFile);

// Send text
await chunked.send('Hello!');

// Receive data
chunked.onMessage((data) => {
  if (data instanceof ArrayBuffer) {
    // Binary data received
    const blob = new Blob([data]);
    downloadFile(blob);
  } else {
    // String received
    console.log('Message:', data);
  }
});

// Check state
console.log('Ready state:', chunked.readyState);

// Close
chunked.close();
```

### Chunking Details

- Default chunk size: 16KB
- Automatic backpressure handling
- Reliable reassembly of large data
- Control messages for chunk start/end

## Network Quality Monitoring

### NetworkQualityMonitor

```typescript
import { NetworkQualityMonitor } from '@philjs/webrtc';

const pc = peer.getRTCPeerConnection(); // Get underlying RTCPeerConnection
const monitor = new NetworkQualityMonitor(pc);

// Start monitoring
monitor.start(1000); // Check every second

// Listen for quality updates
const unsubscribe = monitor.onQuality((quality) => {
  console.log({
    rtt: quality.rtt,           // Round-trip time (ms)
    jitter: quality.jitter,     // Jitter (ms)
    packetLoss: quality.packetLoss, // Packet loss (%)
    bandwidth: quality.bandwidth,    // { upload, download } (kbps)
    score: quality.score,       // 'excellent' | 'good' | 'fair' | 'poor'
  });

  updateQualityIndicator(quality.score);
});

// Get history
const history = monitor.getHistory(); // Last 60 measurements

// Get average
const average = monitor.getAverage();

// Stop monitoring
monitor.stop();

// Clean up
unsubscribe();
```

### Quality Scores

| Score | RTT | Packet Loss | Jitter |
|-------|-----|-------------|--------|
| Excellent | < 50ms | < 1% | < 10ms |
| Good | < 100ms | < 3% | < 30ms |
| Fair | < 200ms | < 5% | < 50ms |
| Poor | >= 200ms | >= 5% | >= 50ms |

## ICE Configuration

### Default ICE Servers

```typescript
import { DEFAULT_ICE_SERVERS } from '@philjs/webrtc';

// Google's public STUN servers
console.log(DEFAULT_ICE_SERVERS);
// [
//   { urls: 'stun:stun.l.google.com:19302' },
//   { urls: 'stun:stun1.l.google.com:19302' },
//   { urls: 'stun:stun2.l.google.com:19302' },
//   { urls: 'stun:stun3.l.google.com:19302' },
//   { urls: 'stun:stun4.l.google.com:19302' },
// ]
```

### Custom TURN Servers

```typescript
const room = new RTCRoom(signaling, 'room-id', {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:turn.example.com:3478',
      username: 'user',
      credential: 'pass',
    },
    {
      urls: 'turns:turn.example.com:5349',
      username: 'user',
      credential: 'pass',
    },
  ],
  iceTransportPolicy: 'relay', // Force TURN
});
```

## React Hooks

### useWebRTC

```typescript
import { useWebRTC } from '@philjs/webrtc';

function VideoChat({ roomId }) {
  const {
    isConnected,
    peers,
    remoteStreams,
    localPeerId,
    setLocalStream,
    broadcast,
    sendToPeer,
    leave,
  } = useWebRTC('wss://signaling.example.com', roomId);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(setLocalStream);
  }, []);

  return (
    <div>
      <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
      <p>My ID: {localPeerId}</p>
      <p>Peers: {peers.join(', ')}</p>

      {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
        <video
          key={peerId}
          autoPlay
          playsInline
          ref={(el) => el && (el.srcObject = stream)}
        />
      ))}

      <button onClick={() => broadcast('chat', 'Hello!')}>
        Say Hello
      </button>
      <button onClick={leave}>Leave</button>
    </div>
  );
}
```

### usePeerConnection

```typescript
import { usePeerConnection } from '@philjs/webrtc';

function PeerView({ peerId }) {
  const { peer, connectionState, stats } = usePeerConnection({
    peerId,
    polite: true,
    onTrack: (track, streams) => {
      // Handle track
    },
  });

  return (
    <div>
      <p>State: {connectionState}</p>
      {stats && (
        <div>
          <p>RTT: {stats.roundTripTime}ms</p>
          <p>Packets lost: {stats.packetsLost}</p>
          <p>FPS: {stats.framesPerSecond}</p>
        </div>
      )}
    </div>
  );
}
```

### useNetworkQuality

```typescript
import { useNetworkQuality } from '@philjs/webrtc';

function QualityIndicator({ pc }) {
  const { quality, history, average } = useNetworkQuality(pc);

  return (
    <div>
      {quality && (
        <div class={`quality-${quality.score}`}>
          <p>Quality: {quality.score}</p>
          <p>RTT: {Math.round(quality.rtt)}ms</p>
          <p>Packet Loss: {quality.packetLoss.toFixed(1)}%</p>
        </div>
      )}
    </div>
  );
}
```

### useDataChannel

```typescript
import { useDataChannel } from '@philjs/webrtc';

function Chat({ peer }) {
  const { isOpen, lastMessage, send } = useDataChannel(peer, 'chat');
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    if (lastMessage && typeof lastMessage === 'string') {
      setMessages((prev) => [...prev, lastMessage]);
    }
  }, [lastMessage]);

  const sendMessage = (text: string) => {
    send(text);
    setMessages((prev) => [...prev, `Me: ${text}`]);
  };

  return (
    <div>
      <p>Channel: {isOpen ? 'Open' : 'Closed'}</p>
      <div class="messages">
        {messages.map((msg, i) => <p key={i}>{msg}</p>)}
      </div>
      <input
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            sendMessage(e.currentTarget.value);
            e.currentTarget.value = '';
          }
        }}
      />
    </div>
  );
}
```

## Types Reference

```typescript
// ICE configuration
interface RTCConfig {
  iceServers?: RTCIceServer[];
  iceTransportPolicy?: RTCIceTransportPolicy;
  bundlePolicy?: RTCBundlePolicy;
  sdpSemantics?: 'unified-plan' | 'plan-b';
}

// Signaling configuration
interface SignalingConfig {
  type: 'websocket' | 'custom';
  url?: string;
  handlers?: SignalingHandlers;
}

// Peer connection options
interface PeerConnectionOptions {
  peerId: string;
  polite: boolean;
  rtcConfig?: RTCConfig;
  dataChannels?: DataChannelConfig[];
  onTrack?: (track: MediaStreamTrack, streams: readonly MediaStream[]) => void;
  onDataChannel?: (channel: RTCDataChannel) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onIceConnectionStateChange?: (state: RTCIceConnectionState) => void;
}

// Data channel configuration
interface DataChannelConfig {
  label: string;
  ordered?: boolean;
  maxRetransmits?: number;
  maxPacketLifeTime?: number;
  protocol?: string;
  negotiated?: boolean;
  id?: number;
}

// Network quality
interface NetworkQuality {
  rtt: number;
  jitter: number;
  packetLoss: number;
  bandwidth: { upload: number; download: number };
  score: 'excellent' | 'good' | 'fair' | 'poor';
}

// Peer statistics
interface PeerStats {
  peerId: string;
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  localCandidateType?: string;
  remoteCandidateType?: string;
  bytesReceived: number;
  bytesSent: number;
  packetsLost: number;
  roundTripTime: number;
  jitter: number;
  audioLevel?: number;
  framesPerSecond?: number;
  frameWidth?: number;
  frameHeight?: number;
  codec?: string;
}

// Signal message types
type SignalMessage =
  | { type: 'offer'; sdp: string; peerId: string }
  | { type: 'answer'; sdp: string; peerId: string }
  | { type: 'candidate'; candidate: RTCIceCandidateInit; peerId: string }
  | { type: 'join'; roomId: string; peerId: string }
  | { type: 'leave'; peerId: string }
  | { type: 'peer-joined'; peerId: string }
  | { type: 'peer-left'; peerId: string };
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `SignalingClient` | WebSocket signaling with auto-reconnect |
| `PeerConnection` | Perfect negotiation peer connection |
| `RTCRoom` | Multi-peer room management |
| `ChunkedDataChannel` | Large data transfer with chunking |
| `NetworkQualityMonitor` | Connection quality monitoring |

### Hooks

| Hook | Description |
|------|-------------|
| `useWebRTC(url, roomId, config?)` | Full room management |
| `usePeerConnection(options)` | Single peer connection |
| `useNetworkQuality(pc)` | Network quality monitoring |
| `useDataChannel(peer, label)` | Data channel messaging |

### Constants

| Export | Description |
|--------|-------------|
| `DEFAULT_ICE_SERVERS` | Google STUN servers |

## Examples

### Video Call Application

```typescript
import { SignalingClient, RTCRoom } from '@philjs/webrtc';

async function startCall() {
  // Connect to signaling
  const signaling = new SignalingClient({
    type: 'websocket',
    url: 'wss://signaling.example.com'
  });
  await signaling.connect();

  // Create room
  const room = new RTCRoom(signaling, 'video-call-room');

  // Handle remote videos
  room.onTrack((peerId, track, streams) => {
    if (track.kind === 'video') {
      const video = document.createElement('video');
      video.id = `video-${peerId}`;
      video.srcObject = streams[0];
      video.autoplay = true;
      video.playsInline = true;
      document.getElementById('videos').appendChild(video);
    }
  });

  // Handle peer leaving
  room.onPeerLeft((peerId) => {
    document.getElementById(`video-${peerId}`)?.remove();
  });

  // Get local media
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 1280, height: 720 },
    audio: true,
  });

  // Show local video
  const localVideo = document.getElementById('local-video');
  localVideo.srcObject = stream;

  // Add to room
  room.setLocalStream(stream);
  room.join();

  return { room, signaling, stream };
}
```

### Screen Sharing

```typescript
async function shareScreen(room: RTCRoom) {
  const screenStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true,
  });

  room.setLocalStream(screenStream);

  // Stop sharing when track ends
  screenStream.getVideoTracks()[0].onended = () => {
    // Switch back to camera
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((cameraStream) => room.setLocalStream(cameraStream));
  };
}
```

### File Transfer

```typescript
import { ChunkedDataChannel } from '@philjs/webrtc';

async function sendFile(peer: PeerConnection, file: File) {
  const channel = peer.getDataChannel('files');
  const chunked = new ChunkedDataChannel(channel);

  // Send file metadata
  await chunked.send(JSON.stringify({
    type: 'file-meta',
    name: file.name,
    size: file.size,
    mimeType: file.type,
  }));

  // Send file data
  const buffer = await file.arrayBuffer();
  await chunked.send(buffer);

  // Send completion signal
  await chunked.send(JSON.stringify({ type: 'file-complete' }));
}

function receiveFile(peer: PeerConnection) {
  const channel = peer.getDataChannel('files');
  const chunked = new ChunkedDataChannel(channel);

  let fileMeta: { name: string; size: number; mimeType: string } | null = null;
  let fileData: ArrayBuffer | null = null;

  chunked.onMessage((data) => {
    if (typeof data === 'string') {
      const msg = JSON.parse(data);
      if (msg.type === 'file-meta') {
        fileMeta = msg;
      } else if (msg.type === 'file-complete' && fileMeta && fileData) {
        const blob = new Blob([fileData], { type: fileMeta.mimeType });
        downloadBlob(blob, fileMeta.name);
      }
    } else {
      fileData = data;
    }
  });
}
```
