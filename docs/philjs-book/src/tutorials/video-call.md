# Tutorial: Video Call App

Build a Zoom alternative using WebRTC and PhilJS signals.

## 1. Media Streams
Capture camera/microphone.

```typescript
const localStream = signal<MediaStream | null>(null);

async function startCamera() {
  localStream.value = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });
}
```

## 2. Signaling
Use Nexus for SDP exchange (signaling).

```typescript
nexus.channel('calls').on('offer', async (offer) => {
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  nexus.channel('calls').send('answer', answer);
});
```
