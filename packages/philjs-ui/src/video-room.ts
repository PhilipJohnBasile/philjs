
// Stub for LiveKit Video Room
export interface VideoRoomProps {
    token: string;
    serverUrl: string;
    onConnected?: () => void;
    onDisconnected?: () => void;
}

export function VideoRoom(props: VideoRoomProps) {
    const containerId = `room-${Math.random().toString(36).substr(2, 9)}`;

    // Mock LiveKit connection logic
    const connect = async () => {
        console.log('LiveKit: Connecting to', props.serverUrl);

        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 500));

        if (props.onConnected) props.onConnected();

        // Mock track subscription event
        console.log('LiveKit: Subscribed to remote video track');
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '<div class="video-grid">Participant 1 (Connected)</div>';
        }
    };

    setTimeout(connect, 0);

    return `<div id="${containerId}" class="phil-livekit-room">
    Connecting to Video Room...
  </div>`;
}
