/**
 * @file Unreal Engine Hooks
 * @description PhilJS hooks for Unreal Engine Pixel Streaming integration
 */
/**
 * Global Unreal states
 */
const unrealStates = new WeakMap();
/**
 * Event handlers registry
 */
const eventHandlers = new Map();
/**
 * Get or create Unreal state
 */
function getUnrealState(video) {
    let state = unrealStates.get(video);
    if (!state) {
        state = {
            instance: null,
            isConnecting: false,
            isConnected: false,
            error: null,
            stats: null,
            isMuted: false,
            isFullscreen: false,
        };
        unrealStates.set(video, state);
    }
    return state;
}
/**
 * Create RTCPeerConnection configuration
 */
function createRTCConfig(config) {
    const iceServers = [];
    if (config.stunServerUrl) {
        iceServers.push({ urls: config.stunServerUrl });
    }
    if (config.turnServerUrl) {
        iceServers.push({
            urls: config.turnServerUrl,
            ...(config.turnUsername !== undefined ? { username: config.turnUsername } : {}),
            ...(config.turnCredential !== undefined ? { credential: config.turnCredential } : {}),
        });
    }
    // Default STUN server if none provided
    if (iceServers.length === 0) {
        iceServers.push({ urls: 'stun:stun.l.google.com:19302' });
    }
    return {
        iceServers,
        iceTransportPolicy: config.forceTurn ? 'relay' : 'all',
    };
}
/**
 * Create a Pixel Streaming instance
 */
export async function createPixelStreamingInstance(video, props) {
    const state = getUnrealState(video);
    state.isConnecting = true;
    state.error = null;
    const config = {
        signallingServerUrl: props.serverUrl,
        autoConnect: true,
        autoPlay: true,
        matchViewportResolution: true,
        startMuted: false,
        useMic: false,
        forceTurn: false,
        ...props.config,
    };
    let ws = null;
    let pc = null;
    let dataChannel = null;
    const handlers = new Map();
    const emit = (event, data) => {
        const eventHandlerSet = handlers.get(event);
        eventHandlerSet?.forEach((handler) => handler(data));
    };
    const instance = {
        connect: async () => {
            return new Promise((resolve, reject) => {
                try {
                    // Connect to signaling server
                    ws = new WebSocket(config.signallingServerUrl);
                    ws.onopen = () => {
                        state.isConnecting = false;
                        state.isConnected = true;
                        emit('connected', null);
                    };
                    ws.onclose = () => {
                        state.isConnected = false;
                        emit('disconnected', null);
                    };
                    ws.onerror = (event) => {
                        const error = new Error('WebSocket error');
                        state.error = error;
                        emit('error', error);
                        reject(error);
                    };
                    ws.onmessage = async (event) => {
                        try {
                            const message = JSON.parse(event.data);
                            switch (message.type) {
                                case 'config':
                                    // Create peer connection
                                    pc = new RTCPeerConnection(createRTCConfig(config));
                                    pc.ontrack = (e) => {
                                        if (e.streams && e.streams[0]) {
                                            video.srcObject = e.streams[0];
                                            if (config.autoPlay) {
                                                video.play().catch(console.error);
                                            }
                                        }
                                    };
                                    pc.onicecandidate = (e) => {
                                        if (e.candidate && ws) {
                                            ws.send(JSON.stringify({
                                                type: 'iceCandidate',
                                                candidate: e.candidate,
                                            }));
                                        }
                                    };
                                    pc.ondatachannel = (e) => {
                                        dataChannel = e.channel;
                                        dataChannel.onmessage = (msgEvent) => {
                                            try {
                                                const data = JSON.parse(msgEvent.data);
                                                emit('message', data);
                                                props.onCustomEvent?.({ type: data.type, data: data.data });
                                            }
                                            catch {
                                                // Binary data or non-JSON
                                            }
                                        };
                                    };
                                    // Send answer request
                                    ws?.send(JSON.stringify({ type: 'listStreamers' }));
                                    break;
                                case 'playerCount':
                                    // Handle player count updates
                                    break;
                                case 'offer':
                                    if (pc) {
                                        await pc.setRemoteDescription(new RTCSessionDescription(message));
                                        const answer = await pc.createAnswer();
                                        await pc.setLocalDescription(answer);
                                        ws?.send(JSON.stringify(answer));
                                    }
                                    break;
                                case 'answer':
                                    if (pc) {
                                        await pc.setRemoteDescription(new RTCSessionDescription(message));
                                    }
                                    break;
                                case 'iceCandidate':
                                    if (pc && message.candidate) {
                                        await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
                                    }
                                    break;
                                default:
                                    emit('message', message);
                            }
                        }
                        catch (error) {
                            console.error('Error processing message:', error);
                        }
                    };
                    // Wait for connection
                    const checkConnection = setInterval(() => {
                        if (state.isConnected) {
                            clearInterval(checkConnection);
                            resolve();
                        }
                    }, 100);
                    // Timeout after 10 seconds
                    setTimeout(() => {
                        clearInterval(checkConnection);
                        if (!state.isConnected) {
                            reject(new Error('Connection timeout'));
                        }
                    }, 10000);
                }
                catch (error) {
                    reject(error);
                }
            });
        },
        disconnect: () => {
            dataChannel?.close();
            pc?.close();
            ws?.close();
            state.isConnected = false;
            state.isConnecting = false;
        },
        reconnect: async () => {
            instance.disconnect();
            await instance.connect();
        },
        isConnected: () => state.isConnected,
        getStats: async () => {
            if (!pc) {
                return {
                    fps: 0,
                    bitrate: 0,
                    latency: 0,
                    packetLoss: 0,
                    width: 0,
                    height: 0,
                    codec: 'unknown',
                    connectionState: 'closed',
                };
            }
            const stats = await pc.getStats();
            let fps = 0;
            let bitrate = 0;
            let width = 0;
            let height = 0;
            let codec = 'unknown';
            stats.forEach((report) => {
                if (report.type === 'inbound-rtp' && report.kind === 'video') {
                    fps = report.framesPerSecond || 0;
                    width = report.frameWidth || 0;
                    height = report.frameHeight || 0;
                }
                if (report.type === 'codec' && report.mimeType?.includes('video')) {
                    codec = report.mimeType.split('/')[1] || 'unknown';
                }
            });
            return {
                fps,
                bitrate,
                latency: 0,
                packetLoss: 0,
                width,
                height,
                codec,
                connectionState: pc.connectionState,
            };
        },
        sendKeyboardInput: (data) => {
            if (dataChannel?.readyState === 'open') {
                const message = {
                    inputType: 'keyboard',
                    ...data,
                };
                dataChannel.send(JSON.stringify(message));
            }
        },
        sendMouseInput: (data) => {
            if (dataChannel?.readyState === 'open') {
                const message = {
                    inputType: 'mouse',
                    ...data,
                };
                dataChannel.send(JSON.stringify(message));
            }
        },
        sendTouchInput: (data) => {
            if (dataChannel?.readyState === 'open') {
                const message = {
                    inputType: 'touch',
                    ...data,
                };
                dataChannel.send(JSON.stringify(message));
            }
        },
        sendGamepadInput: (data) => {
            if (dataChannel?.readyState === 'open') {
                const message = {
                    type: 'gamepad',
                    ...data,
                };
                dataChannel.send(JSON.stringify(message));
            }
        },
        executeCommand: (command) => {
            if (dataChannel?.readyState === 'open') {
                const message = {
                    type: 'command',
                    command,
                };
                dataChannel.send(JSON.stringify(message));
            }
        },
        sendMessage: (type, data) => {
            if (dataChannel?.readyState === 'open') {
                const message = { type, data };
                dataChannel.send(JSON.stringify(message));
            }
        },
        on: (event, handler) => {
            let handlerSet = handlers.get(event);
            if (!handlerSet) {
                handlerSet = new Set();
                handlers.set(event, handlerSet);
            }
            handlerSet.add(handler);
            return () => {
                handlerSet?.delete(handler);
            };
        },
        setMuted: (muted) => {
            video.muted = muted;
            state.isMuted = muted;
        },
        requestFullscreen: async () => {
            await video.requestFullscreen();
            state.isFullscreen = true;
        },
        exitFullscreen: async () => {
            await document.exitFullscreen();
            state.isFullscreen = false;
        },
        setQualityLevel: (level) => {
            if (dataChannel?.readyState === 'open') {
                dataChannel.send(JSON.stringify({
                    type: 'qualityLevel',
                    level,
                }));
            }
        },
        requestKeyframe: () => {
            if (dataChannel?.readyState === 'open') {
                dataChannel.send(JSON.stringify({
                    type: 'requestKeyframe',
                }));
            }
        },
    };
    // Auto-connect if configured
    if (config.autoConnect) {
        await instance.connect();
    }
    state.instance = instance;
    props.onConnect?.(instance);
    // Start stats polling
    const statsInterval = setInterval(async () => {
        if (state.isConnected) {
            const stats = await instance.getStats();
            state.stats = stats;
            props.onStats?.(stats);
        }
    }, 1000);
    // Cleanup on disconnect
    instance.on('disconnected', () => {
        clearInterval(statsInterval);
        props.onDisconnect?.();
    });
    return instance;
}
/**
 * Hook to use Unreal Pixel Streaming
 */
export function useUnreal(video) {
    if (!video) {
        return {
            unreal: null,
            isConnecting: false,
            isConnected: false,
            error: null,
            stats: null,
            executeCommand: () => { },
            sendMessage: () => { },
            reconnect: async () => { },
            toggleMute: () => { },
            requestFullscreen: async () => { },
        };
    }
    const state = getUnrealState(video);
    return {
        unreal: state.instance,
        isConnecting: state.isConnecting,
        isConnected: state.isConnected,
        error: state.error,
        stats: state.stats,
        executeCommand: (command) => {
            state.instance?.executeCommand(command);
        },
        sendMessage: (type, data) => {
            state.instance?.sendMessage(type, data);
        },
        reconnect: async () => {
            await state.instance?.reconnect();
        },
        toggleMute: () => {
            const newMuted = !state.isMuted;
            state.instance?.setMuted(newMuted);
        },
        requestFullscreen: async () => {
            await state.instance?.requestFullscreen();
        },
    };
}
/**
 * Setup input forwarding for Pixel Streaming
 */
export function setupInputForwarding(video, instance) {
    const cleanupFns = [];
    // Keyboard events
    const handleKeyDown = (e) => {
        instance.sendKeyboardInput({
            type: 'keydown',
            keyCode: e.keyCode,
            repeat: e.repeat,
        });
    };
    const handleKeyUp = (e) => {
        instance.sendKeyboardInput({
            type: 'keyup',
            keyCode: e.keyCode,
            repeat: false,
        });
    };
    video.addEventListener('keydown', handleKeyDown);
    video.addEventListener('keyup', handleKeyUp);
    cleanupFns.push(() => {
        video.removeEventListener('keydown', handleKeyDown);
        video.removeEventListener('keyup', handleKeyUp);
    });
    // Mouse events
    const getMousePosition = (e) => {
        const rect = video.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / rect.width,
            y: (e.clientY - rect.top) / rect.height,
        };
    };
    const handleMouseMove = (e) => {
        const pos = getMousePosition(e);
        instance.sendMouseInput({
            type: 'mousemove',
            x: pos.x,
            y: pos.y,
        });
    };
    const handleMouseDown = (e) => {
        const pos = getMousePosition(e);
        instance.sendMouseInput({
            type: 'mousedown',
            button: e.button,
            x: pos.x,
            y: pos.y,
        });
    };
    const handleMouseUp = (e) => {
        const pos = getMousePosition(e);
        instance.sendMouseInput({
            type: 'mouseup',
            button: e.button,
            x: pos.x,
            y: pos.y,
        });
    };
    const handleWheel = (e) => {
        const pos = getMousePosition(e);
        instance.sendMouseInput({
            type: 'wheel',
            x: pos.x,
            y: pos.y,
            deltaX: e.deltaX,
            deltaY: e.deltaY,
        });
    };
    video.addEventListener('mousemove', handleMouseMove);
    video.addEventListener('mousedown', handleMouseDown);
    video.addEventListener('mouseup', handleMouseUp);
    video.addEventListener('wheel', handleWheel);
    cleanupFns.push(() => {
        video.removeEventListener('mousemove', handleMouseMove);
        video.removeEventListener('mousedown', handleMouseDown);
        video.removeEventListener('mouseup', handleMouseUp);
        video.removeEventListener('wheel', handleWheel);
    });
    // Touch events
    const getTouchPositions = (e) => {
        const rect = video.getBoundingClientRect();
        const touches = [];
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            if (touch) {
                touches.push({
                    id: touch.identifier,
                    x: (touch.clientX - rect.left) / rect.width,
                    y: (touch.clientY - rect.top) / rect.height,
                });
            }
        }
        return touches;
    };
    const handleTouchStart = (e) => {
        instance.sendTouchInput({
            type: 'touchstart',
            touches: getTouchPositions(e),
        });
    };
    const handleTouchMove = (e) => {
        instance.sendTouchInput({
            type: 'touchmove',
            touches: getTouchPositions(e),
        });
    };
    const handleTouchEnd = (e) => {
        instance.sendTouchInput({
            type: 'touchend',
            touches: getTouchPositions(e),
        });
    };
    video.addEventListener('touchstart', handleTouchStart);
    video.addEventListener('touchmove', handleTouchMove);
    video.addEventListener('touchend', handleTouchEnd);
    cleanupFns.push(() => {
        video.removeEventListener('touchstart', handleTouchStart);
        video.removeEventListener('touchmove', handleTouchMove);
        video.removeEventListener('touchend', handleTouchEnd);
    });
    // Make video focusable for keyboard input
    video.tabIndex = 0;
    return () => {
        cleanupFns.forEach((fn) => fn());
    };
}
/**
 * Cleanup Unreal instance
 */
export function disposeUnreal(video) {
    const state = unrealStates.get(video);
    state?.instance?.disconnect();
    unrealStates.delete(video);
}
//# sourceMappingURL=hooks.js.map