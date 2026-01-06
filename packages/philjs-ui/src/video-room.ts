/**
 * @philjs/ui - Video Room Component
 *
 * WebRTC-based video room with signaling server integration.
 * Supports peer-to-peer video calls, screen sharing, and data channels.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
 */

// ============================================================================
// Types
// ============================================================================

export interface VideoRoomProps {
    /** Auth token for the room */
    token: string;
    /** Signaling server URL (WebSocket) */
    serverUrl: string;
    /** Room ID to join */
    roomId?: string;
    /** User display name */
    displayName?: string;
    /** Enable video by default */
    video?: boolean;
    /** Enable audio by default */
    audio?: boolean;
    /** Enable screen share button */
    enableScreenShare?: boolean;
    /** Enable chat functionality */
    enableChat?: boolean;
    /** Maximum participants (0 = unlimited) */
    maxParticipants?: number;
    /** Video quality preset */
    videoQuality?: 'low' | 'medium' | 'high' | 'hd';
    /** Custom ICE servers */
    iceServers?: RTCIceServer[];
    /** Callback when connected to room */
    onConnected?: () => void;
    /** Callback when disconnected from room */
    onDisconnected?: (reason?: string) => void;
    /** Callback when a participant joins */
    onParticipantJoined?: (participant: Participant) => void;
    /** Callback when a participant leaves */
    onParticipantLeft?: (participantId: string) => void;
    /** Callback when chat message received */
    onChatMessage?: (message: ChatMessage) => void;
    /** Callback on error */
    onError?: (error: Error) => void;
    /** Custom className */
    className?: string;
}

export interface Participant {
    id: string;
    displayName: string;
    isLocal: boolean;
    videoEnabled: boolean;
    audioEnabled: boolean;
    isScreenSharing: boolean;
    stream?: MediaStream;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: number;
}

export interface RoomAPI {
    /** Leave the room */
    leave: () => Promise<void>;
    /** Toggle local video */
    toggleVideo: () => void;
    /** Toggle local audio */
    toggleAudio: () => void;
    /** Start screen sharing */
    startScreenShare: () => Promise<void>;
    /** Stop screen sharing */
    stopScreenShare: () => void;
    /** Send chat message */
    sendMessage: (content: string) => void;
    /** Get all participants */
    getParticipants: () => Participant[];
    /** Get local participant */
    getLocalParticipant: () => Participant | null;
    /** Check if connected */
    isConnected: () => boolean;
}

interface SignalingMessage {
    type: 'join' | 'leave' | 'offer' | 'answer' | 'ice-candidate' | 'chat' | 'participant-update';
    from?: string;
    to?: string;
    payload?: any;
}

// ============================================================================
// Video Quality Presets
// ============================================================================

const VIDEO_CONSTRAINTS: Record<string, MediaTrackConstraints> = {
    low: { width: 320, height: 240, frameRate: 15 },
    medium: { width: 640, height: 480, frameRate: 24 },
    high: { width: 1280, height: 720, frameRate: 30 },
    hd: { width: 1920, height: 1080, frameRate: 30 }
};

// ============================================================================
// VideoRoom Implementation
// ============================================================================

/**
 * Create a WebRTC video room
 *
 * This implementation provides:
 * - WebSocket-based signaling for peer discovery
 * - ICE candidate exchange for NAT traversal
 * - Multi-peer mesh network topology
 * - Local/remote media stream management
 * - Screen sharing support
 * - Real-time chat via data channels
 */
export function VideoRoom(props: VideoRoomProps): HTMLElement & { api: RoomAPI } {
    const {
        token,
        serverUrl,
        roomId = 'default',
        displayName = 'Anonymous',
        video = true,
        audio = true,
        enableScreenShare = true,
        enableChat = true,
        maxParticipants = 0,
        videoQuality = 'medium',
        iceServers = [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ],
        onConnected,
        onDisconnected,
        onParticipantJoined,
        onParticipantLeft,
        onChatMessage,
        onError,
        className = ''
    } = props;

    // State
    const localParticipantId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let localStream: MediaStream | null = null;
    let screenStream: MediaStream | null = null;
    let ws: WebSocket | null = null;
    let isConnected = false;
    let videoEnabled = video;
    let audioEnabled = audio;

    const participants: Map<string, Participant> = new Map();
    const peerConnections: Map<string, RTCPeerConnection> = new Map();
    const dataChannels: Map<string, RTCDataChannel> = new Map();
    const chatMessages: ChatMessage[] = [];

    // Create container
    const container = document.createElement('div');
    container.className = `phil-video-room ${className}`.trim();
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        background: #1a1a1a;
        color: #fff;
        height: 100%;
        overflow: hidden;
    `;

    // Video grid
    const videoGrid = document.createElement('div');
    videoGrid.className = 'phil-video-grid';
    videoGrid.style.cssText = `
        flex: 1;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 10px;
        padding: 10px;
        overflow: auto;
    `;

    // Controls bar
    const controls = document.createElement('div');
    controls.className = 'phil-video-controls';
    controls.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 15px;
        padding: 15px;
        background: rgba(0,0,0,0.8);
    `;

    // Chat panel (hidden by default)
    const chatPanel = document.createElement('div');
    chatPanel.className = 'phil-chat-panel';
    chatPanel.style.cssText = `
        position: absolute;
        right: 0;
        top: 0;
        bottom: 60px;
        width: 300px;
        background: rgba(0,0,0,0.9);
        display: none;
        flex-direction: column;
    `;

    // Helper: Create control button
    function createControlButton(icon: string, title: string, onClick: () => void, active = false): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.innerHTML = icon;
        btn.title = title;
        btn.style.cssText = `
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: none;
            background: ${active ? '#4CAF50' : '#333'};
            color: #fff;
            font-size: 20px;
            cursor: pointer;
            transition: background 0.2s;
        `;
        btn.addEventListener('click', onClick);
        btn.addEventListener('mouseenter', () => { btn.style.background = active ? '#45a049' : '#444'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = active ? '#4CAF50' : '#333'; });
        return btn;
    }

    // Helper: Create video tile for participant
    function createVideoTile(participant: Participant): HTMLElement {
        const tile = document.createElement('div');
        tile.className = 'phil-video-tile';
        tile.id = `tile-${participant.id}`;
        tile.style.cssText = `
            position: relative;
            background: #2a2a2a;
            border-radius: 8px;
            overflow: hidden;
            aspect-ratio: 16/9;
            min-height: 200px;
        `;

        const video = document.createElement('video');
        video.autoplay = true;
        video.playsInline = true;
        video.muted = participant.isLocal;
        video.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';

        if (participant.stream) {
            video.srcObject = participant.stream;
        }

        const nameLabel = document.createElement('div');
        nameLabel.className = 'phil-participant-name';
        nameLabel.textContent = participant.displayName + (participant.isLocal ? ' (You)' : '');
        nameLabel.style.cssText = `
            position: absolute;
            bottom: 10px;
            left: 10px;
            background: rgba(0,0,0,0.7);
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 14px;
        `;

        const statusIcons = document.createElement('div');
        statusIcons.className = 'phil-status-icons';
        statusIcons.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            display: flex;
            gap: 5px;
        `;

        const micIcon = document.createElement('span');
        micIcon.textContent = participant.audioEnabled ? '🎤' : '🔇';
        micIcon.style.cssText = 'background: rgba(0,0,0,0.7); padding: 5px; border-radius: 4px;';

        const camIcon = document.createElement('span');
        camIcon.textContent = participant.videoEnabled ? '📹' : '📷';
        camIcon.style.cssText = 'background: rgba(0,0,0,0.7); padding: 5px; border-radius: 4px;';

        statusIcons.appendChild(micIcon);
        statusIcons.appendChild(camIcon);

        tile.appendChild(video);
        tile.appendChild(nameLabel);
        tile.appendChild(statusIcons);

        return tile;
    }

    // Helper: Update video tile
    function updateVideoTile(participantId: string): void {
        const participant = participants.get(participantId);
        if (!participant) return;

        const tile = document.getElementById(`tile-${participantId}`);
        if (!tile) return;

        const video = tile.querySelector('video');
        if (video && participant.stream) {
            video.srcObject = participant.stream;
        }

        const micIcon = tile.querySelector('.phil-status-icons span:first-child');
        const camIcon = tile.querySelector('.phil-status-icons span:last-child');
        if (micIcon) micIcon.textContent = participant.audioEnabled ? '🎤' : '🔇';
        if (camIcon) camIcon.textContent = participant.videoEnabled ? '📹' : '📷';
    }

    // Helper: Remove video tile
    function removeVideoTile(participantId: string): void {
        const tile = document.getElementById(`tile-${participantId}`);
        if (tile) {
            tile.remove();
        }
    }

    // WebRTC: Create peer connection
    function createPeerConnection(remoteId: string): RTCPeerConnection {
        const pc = new RTCPeerConnection({ iceServers });

        pc.onicecandidate = (event) => {
            if (event.candidate && ws?.readyState === WebSocket.OPEN) {
                sendSignalingMessage({
                    type: 'ice-candidate',
                    to: remoteId,
                    payload: event.candidate
                });
            }
        };

        pc.ontrack = (event) => {
            const participant = participants.get(remoteId);
            if (participant) {
                participant.stream = event.streams[0];
                updateVideoTile(remoteId);
            }
        };

        pc.ondatachannel = (event) => {
            setupDataChannel(event.channel, remoteId);
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                handleParticipantLeft(remoteId);
            }
        };

        // Add local tracks
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream!);
            });
        }

        // Create data channel for chat
        if (enableChat) {
            const dc = pc.createDataChannel('chat', { ordered: true });
            setupDataChannel(dc, remoteId);
        }

        peerConnections.set(remoteId, pc);
        return pc;
    }

    // WebRTC: Setup data channel
    function setupDataChannel(channel: RTCDataChannel, remoteId: string): void {
        channel.onopen = () => {
            dataChannels.set(remoteId, channel);
        };

        channel.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'chat') {
                    const chatMsg: ChatMessage = {
                        id: `msg-${Date.now()}`,
                        senderId: remoteId,
                        senderName: participants.get(remoteId)?.displayName || 'Unknown',
                        content: message.content,
                        timestamp: Date.now()
                    };
                    chatMessages.push(chatMsg);
                    appendChatMessage(chatMsg);
                    onChatMessage?.(chatMsg);
                }
            } catch (e) {
                // Non-JSON message
            }
        };

        channel.onclose = () => {
            dataChannels.delete(remoteId);
        };
    }

    // Signaling: Send message
    function sendSignalingMessage(message: SignalingMessage): void {
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                ...message,
                from: localParticipantId,
                roomId,
                token
            }));
        }
    }

    // Signaling: Handle incoming message
    async function handleSignalingMessage(message: SignalingMessage): Promise<void> {
        switch (message.type) {
            case 'join': {
                // New participant joined
                const participant: Participant = {
                    id: message.from!,
                    displayName: message.payload?.displayName || 'Anonymous',
                    isLocal: false,
                    videoEnabled: message.payload?.video ?? true,
                    audioEnabled: message.payload?.audio ?? true,
                    isScreenSharing: false
                };

                if (maxParticipants > 0 && participants.size >= maxParticipants) {
                    return; // Room full
                }

                participants.set(participant.id, participant);
                videoGrid.appendChild(createVideoTile(participant));
                onParticipantJoined?.(participant);

                // Create offer for new participant
                const pc = createPeerConnection(participant.id);
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                sendSignalingMessage({
                    type: 'offer',
                    to: participant.id,
                    payload: offer
                });
                break;
            }

            case 'leave': {
                handleParticipantLeft(message.from!);
                break;
            }

            case 'offer': {
                // Received offer from remote peer
                let pc = peerConnections.get(message.from!);
                if (!pc) {
                    // Create participant entry
                    const participant: Participant = {
                        id: message.from!,
                        displayName: 'Connecting...',
                        isLocal: false,
                        videoEnabled: true,
                        audioEnabled: true,
                        isScreenSharing: false
                    };
                    participants.set(participant.id, participant);
                    videoGrid.appendChild(createVideoTile(participant));
                    pc = createPeerConnection(message.from!);
                }

                await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                sendSignalingMessage({
                    type: 'answer',
                    to: message.from,
                    payload: answer
                });
                break;
            }

            case 'answer': {
                const pc = peerConnections.get(message.from!);
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
                }
                break;
            }

            case 'ice-candidate': {
                const pc = peerConnections.get(message.from!);
                if (pc && message.payload) {
                    await pc.addIceCandidate(new RTCIceCandidate(message.payload));
                }
                break;
            }

            case 'participant-update': {
                const participant = participants.get(message.from!);
                if (participant) {
                    if (message.payload.displayName) participant.displayName = message.payload.displayName;
                    if (message.payload.videoEnabled !== undefined) participant.videoEnabled = message.payload.videoEnabled;
                    if (message.payload.audioEnabled !== undefined) participant.audioEnabled = message.payload.audioEnabled;
                    updateVideoTile(message.from!);
                }
                break;
            }

            case 'chat': {
                const chatMsg: ChatMessage = {
                    id: `msg-${Date.now()}`,
                    senderId: message.from!,
                    senderName: participants.get(message.from!)?.displayName || 'Unknown',
                    content: message.payload.content,
                    timestamp: Date.now()
                };
                chatMessages.push(chatMsg);
                appendChatMessage(chatMsg);
                onChatMessage?.(chatMsg);
                break;
            }
        }
    }

    // Handle participant leaving
    function handleParticipantLeft(participantId: string): void {
        const pc = peerConnections.get(participantId);
        if (pc) {
            pc.close();
            peerConnections.delete(participantId);
        }

        dataChannels.delete(participantId);
        participants.delete(participantId);
        removeVideoTile(participantId);
        onParticipantLeft?.(participantId);
    }

    // Chat UI
    function appendChatMessage(msg: ChatMessage): void {
        const messagesContainer = chatPanel.querySelector('.phil-chat-messages');
        if (!messagesContainer) return;

        const msgEl = document.createElement('div');
        msgEl.className = 'phil-chat-message';
        msgEl.style.cssText = 'padding: 8px; border-bottom: 1px solid #333;';
        msgEl.innerHTML = `
            <strong style="color: #4CAF50;">${msg.senderName}</strong>
            <span style="color: #888; font-size: 12px;"> ${new Date(msg.timestamp).toLocaleTimeString()}</span>
            <p style="margin: 5px 0 0 0;">${escapeHtml(msg.content)}</p>
        `;
        messagesContainer.appendChild(msgEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Room API
    const api: RoomAPI = {
        async leave() {
            sendSignalingMessage({ type: 'leave' });

            // Close all peer connections
            peerConnections.forEach(pc => pc.close());
            peerConnections.clear();
            dataChannels.clear();

            // Stop local streams
            localStream?.getTracks().forEach(track => track.stop());
            screenStream?.getTracks().forEach(track => track.stop());

            // Close WebSocket
            ws?.close();
            ws = null;

            isConnected = false;
            onDisconnected?.();
        },

        toggleVideo() {
            if (localStream) {
                const videoTrack = localStream.getVideoTracks()[0];
                if (videoTrack) {
                    videoEnabled = !videoEnabled;
                    videoTrack.enabled = videoEnabled;

                    const localParticipant = participants.get(localParticipantId);
                    if (localParticipant) {
                        localParticipant.videoEnabled = videoEnabled;
                        updateVideoTile(localParticipantId);
                    }

                    sendSignalingMessage({
                        type: 'participant-update',
                        payload: { videoEnabled }
                    });

                    updateControlButtons();
                }
            }
        },

        toggleAudio() {
            if (localStream) {
                const audioTrack = localStream.getAudioTracks()[0];
                if (audioTrack) {
                    audioEnabled = !audioEnabled;
                    audioTrack.enabled = audioEnabled;

                    const localParticipant = participants.get(localParticipantId);
                    if (localParticipant) {
                        localParticipant.audioEnabled = audioEnabled;
                        updateVideoTile(localParticipantId);
                    }

                    sendSignalingMessage({
                        type: 'participant-update',
                        payload: { audioEnabled }
                    });

                    updateControlButtons();
                }
            }
        },

        async startScreenShare() {
            try {
                screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true
                });

                const screenTrack = screenStream.getVideoTracks()[0];

                // Replace video track in all peer connections
                peerConnections.forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(screenTrack);
                    }
                });

                // Update local video
                const localParticipant = participants.get(localParticipantId);
                if (localParticipant) {
                    localParticipant.isScreenSharing = true;
                    const tile = document.getElementById(`tile-${localParticipantId}`);
                    const video = tile?.querySelector('video');
                    if (video) {
                        video.srcObject = screenStream;
                    }
                }

                // Handle screen share stop
                screenTrack.onended = () => {
                    api.stopScreenShare();
                };

                updateControlButtons();
            } catch (error) {
                onError?.(error instanceof Error ? error : new Error('Screen share failed'));
            }
        },

        stopScreenShare() {
            if (screenStream) {
                screenStream.getTracks().forEach(track => track.stop());
                screenStream = null;

                // Restore camera video
                if (localStream) {
                    const videoTrack = localStream.getVideoTracks()[0];
                    peerConnections.forEach(pc => {
                        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                        if (sender && videoTrack) {
                            sender.replaceTrack(videoTrack);
                        }
                    });

                    const localParticipant = participants.get(localParticipantId);
                    if (localParticipant) {
                        localParticipant.isScreenSharing = false;
                        const tile = document.getElementById(`tile-${localParticipantId}`);
                        const video = tile?.querySelector('video');
                        if (video) {
                            video.srcObject = localStream;
                        }
                    }
                }

                updateControlButtons();
            }
        },

        sendMessage(content: string) {
            if (!content.trim()) return;

            // Send via data channels
            const message = JSON.stringify({ type: 'chat', content });
            dataChannels.forEach(dc => {
                if (dc.readyState === 'open') {
                    dc.send(message);
                }
            });

            // Also send via signaling (for participants we don't have DC with yet)
            sendSignalingMessage({
                type: 'chat',
                payload: { content }
            });

            // Add to local chat
            const chatMsg: ChatMessage = {
                id: `msg-${Date.now()}`,
                senderId: localParticipantId,
                senderName: displayName,
                content,
                timestamp: Date.now()
            };
            chatMessages.push(chatMsg);
            appendChatMessage(chatMsg);
        },

        getParticipants() {
            return Array.from(participants.values());
        },

        getLocalParticipant() {
            return participants.get(localParticipantId) || null;
        },

        isConnected() {
            return isConnected;
        }
    };

    // Control buttons
    let videoBtn: HTMLButtonElement;
    let audioBtn: HTMLButtonElement;
    let screenBtn: HTMLButtonElement;

    function updateControlButtons(): void {
        if (videoBtn) {
            videoBtn.innerHTML = videoEnabled ? '📹' : '📷';
            videoBtn.style.background = videoEnabled ? '#4CAF50' : '#f44336';
        }
        if (audioBtn) {
            audioBtn.innerHTML = audioEnabled ? '🎤' : '🔇';
            audioBtn.style.background = audioEnabled ? '#4CAF50' : '#f44336';
        }
        if (screenBtn) {
            screenBtn.style.background = screenStream ? '#4CAF50' : '#333';
        }
    }

    // Build UI
    videoBtn = createControlButton(videoEnabled ? '📹' : '📷', 'Toggle Video', api.toggleVideo, videoEnabled);
    audioBtn = createControlButton(audioEnabled ? '🎤' : '🔇', 'Toggle Audio', api.toggleAudio, audioEnabled);
    const leaveBtn = createControlButton('📞', 'Leave', () => api.leave());
    leaveBtn.style.background = '#f44336';

    controls.appendChild(audioBtn);
    controls.appendChild(videoBtn);

    if (enableScreenShare) {
        screenBtn = createControlButton('🖥️', 'Share Screen', () => {
            if (screenStream) {
                api.stopScreenShare();
            } else {
                api.startScreenShare();
            }
        });
        controls.appendChild(screenBtn);
    }

    if (enableChat) {
        const chatBtn = createControlButton('💬', 'Toggle Chat', () => {
            chatPanel.style.display = chatPanel.style.display === 'none' ? 'flex' : 'none';
        });
        controls.appendChild(chatBtn);

        // Build chat panel
        chatPanel.innerHTML = `
            <div class="phil-chat-header" style="padding: 15px; border-bottom: 1px solid #333; font-weight: bold;">Chat</div>
            <div class="phil-chat-messages" style="flex: 1; overflow-y: auto; padding: 10px;"></div>
            <div class="phil-chat-input" style="padding: 10px; border-top: 1px solid #333; display: flex; gap: 10px;">
                <input type="text" placeholder="Type a message..." style="flex: 1; padding: 10px; border: none; border-radius: 4px; background: #333; color: #fff;">
                <button style="padding: 10px 15px; background: #4CAF50; border: none; border-radius: 4px; color: #fff; cursor: pointer;">Send</button>
            </div>
        `;

        const chatInput = chatPanel.querySelector('.phil-chat-input input') as HTMLInputElement;
        const sendBtn = chatPanel.querySelector('.phil-chat-input button') as HTMLButtonElement;

        const sendChatMessage = () => {
            if (chatInput.value.trim()) {
                api.sendMessage(chatInput.value);
                chatInput.value = '';
            }
        };

        sendBtn.addEventListener('click', sendChatMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendChatMessage();
        });
    }

    controls.appendChild(leaveBtn);

    // Assemble container
    const mainArea = document.createElement('div');
    mainArea.style.cssText = 'position: relative; flex: 1; display: flex; overflow: hidden;';
    mainArea.appendChild(videoGrid);
    if (enableChat) {
        mainArea.appendChild(chatPanel);
    }

    container.appendChild(mainArea);
    container.appendChild(controls);

    // Initialize room
    async function initialize(): Promise<void> {
        try {
            // Get local media
            localStream = await navigator.mediaDevices.getUserMedia({
                video: video ? VIDEO_CONSTRAINTS[videoQuality] : false,
                audio
            });

            // Set initial track states
            if (!video && localStream.getVideoTracks().length > 0) {
                localStream.getVideoTracks().forEach(t => t.enabled = false);
            }
            if (!audio && localStream.getAudioTracks().length > 0) {
                localStream.getAudioTracks().forEach(t => t.enabled = false);
            }

            // Create local participant
            const localParticipant: Participant = {
                id: localParticipantId,
                displayName,
                isLocal: true,
                videoEnabled,
                audioEnabled,
                isScreenSharing: false,
                stream: localStream
            };
            participants.set(localParticipantId, localParticipant);
            videoGrid.appendChild(createVideoTile(localParticipant));

            // Connect to signaling server
            ws = new WebSocket(serverUrl);

            ws.onopen = () => {
                isConnected = true;
                sendSignalingMessage({
                    type: 'join',
                    payload: { displayName, video: videoEnabled, audio: audioEnabled }
                });
                onConnected?.();
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data) as SignalingMessage;
                    if (message.from !== localParticipantId) {
                        handleSignalingMessage(message);
                    }
                } catch (e) {
                    // Non-JSON message
                }
            };

            ws.onerror = () => {
                onError?.(new Error('WebSocket connection error'));
            };

            ws.onclose = (event) => {
                isConnected = false;
                onDisconnected?.(event.reason || 'Connection closed');
            };

        } catch (error) {
            onError?.(error instanceof Error ? error : new Error('Failed to initialize room'));
        }
    }

    // Auto-initialize
    if (typeof window !== 'undefined') {
        initialize();
    }

    // Attach API
    (container as any).api = api;

    return container as HTMLElement & { api: RoomAPI };
}

// ============================================================================
// Exports
// ============================================================================

export type {
    VideoRoomProps,
    Participant,
    ChatMessage,
    RoomAPI
};
