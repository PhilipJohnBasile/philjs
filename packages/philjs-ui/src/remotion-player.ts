/**
 * @philjs/ui - Remotion Player Integration
 *
 * Provides video composition playback using Remotion or fallback
 * canvas-based rendering when Remotion is not available.
 *
 * @see https://www.remotion.dev/docs/player
 */

// ============================================================================
// Types
// ============================================================================

export interface RemotionPlayerProps {
    /** The composition to render (function component or Remotion composition) */
    composition: RemotionComposition;
    /** Frames per second */
    fps: number;
    /** Total duration in frames */
    durationInFrames: number;
    /** Width in pixels */
    width?: number;
    /** Height in pixels */
    height?: number;
    /** Auto-play on mount */
    autoPlay?: boolean;
    /** Show playback controls */
    controls?: boolean;
    /** Loop playback */
    loop?: boolean;
    /** Click to play toggle */
    clickToPlay?: boolean;
    /** Double-click to fullscreen */
    doubleClickToFullscreen?: boolean;
    /** Mute audio */
    muted?: boolean;
    /** Volume (0-1) */
    volume?: number;
    /** Playback rate */
    playbackRate?: number;
    /** Input props for the composition */
    inputProps?: Record<string, any>;
    /** Callback when frame changes */
    onFrameChange?: (frame: number) => void;
    /** Callback when playback ends */
    onEnded?: () => void;
    /** Callback when playback starts */
    onPlay?: () => void;
    /** Callback when playback pauses */
    onPause?: () => void;
    /** Callback on seek */
    onSeek?: (frame: number) => void;
    /** Callback on error */
    onError?: (error: Error) => void;
    /** Custom className */
    className?: string;
    /** Custom styles */
    style?: Partial<CSSStyleDeclaration>;
}

export interface RemotionComposition {
    /** Unique composition ID */
    id?: string;
    /** Component to render */
    component: (props: CompositionProps) => any;
    /** Default input props */
    defaultProps?: Record<string, any>;
}

export interface CompositionProps {
    /** Current frame number */
    frame: number;
    /** Frames per second */
    fps: number;
    /** Total duration in frames */
    durationInFrames: number;
    /** Width in pixels */
    width: number;
    /** Height in pixels */
    height: number;
    /** Custom input props */
    inputProps: Record<string, any>;
}

export interface PlayerAPI {
    /** Play the composition */
    play: () => void;
    /** Pause the composition */
    pause: () => void;
    /** Toggle play/pause */
    toggle: () => void;
    /** Seek to a specific frame */
    seekTo: (frame: number) => void;
    /** Get current frame */
    getCurrentFrame: () => number;
    /** Get playback state */
    isPlaying: () => boolean;
    /** Set volume */
    setVolume: (volume: number) => void;
    /** Set playback rate */
    setPlaybackRate: (rate: number) => void;
    /** Enter fullscreen */
    enterFullscreen: () => Promise<void>;
    /** Exit fullscreen */
    exitFullscreen: () => Promise<void>;
    /** Destroy the player */
    destroy: () => void;
}

// ============================================================================
// State
// ============================================================================

interface PlayerState {
    currentFrame: number;
    isPlaying: boolean;
    volume: number;
    muted: boolean;
    playbackRate: number;
    isFullscreen: boolean;
    hasEnded: boolean;
}

// ============================================================================
// RemotionPlayer Implementation
// ============================================================================

/**
 * Create a Remotion-compatible video player
 *
 * This implementation provides a canvas-based renderer that can play
 * frame-by-frame compositions. It supports playback controls, seeking,
 * and composition callbacks.
 */
export function RemotionPlayer(props: RemotionPlayerProps): HTMLElement & { api: PlayerAPI } {
    const {
        composition,
        fps,
        durationInFrames,
        width = 1920,
        height = 1080,
        autoPlay = false,
        controls = true,
        loop = false,
        clickToPlay = true,
        doubleClickToFullscreen = true,
        muted = false,
        volume = 1,
        playbackRate = 1,
        inputProps = {},
        onFrameChange,
        onEnded,
        onPlay,
        onPause,
        onSeek,
        onError,
        className = '',
        style = {}
    } = props;

    // State
    const state: PlayerState = {
        currentFrame: 0,
        isPlaying: autoPlay,
        volume: muted ? 0 : volume,
        muted,
        playbackRate,
        isFullscreen: false,
        hasEnded: false
    };

    let animationFrameId: number | null = null;
    let lastTimestamp: number | null = null;
    let accumulatedTime = 0;

    // Create container
    const container = document.createElement('div');
    container.className = `phil-remotion-player ${className}`.trim();
    Object.assign(container.style, {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#000',
        overflow: 'hidden',
        ...style
    });

    // Create canvas for rendering
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.display = 'block';

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Canvas 2D context not available');
    }

    // Create viewport wrapper
    const viewport = document.createElement('div');
    viewport.className = 'phil-remotion-viewport';
    viewport.style.cssText = 'position: relative; flex: 1; display: flex; align-items: center; justify-content: center; overflow: hidden;';
    viewport.appendChild(canvas);

    // Render a single frame
    function renderFrame(frame: number): void {
        if (!ctx) return;

        try {
            // Clear canvas
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, width, height);

            // Get composition props
            const compositionProps: CompositionProps = {
                frame,
                fps,
                durationInFrames,
                width,
                height,
                inputProps: {
                    ...composition.defaultProps,
                    ...inputProps
                }
            };

            // Call the composition component
            const result = composition.component(compositionProps);

            // Handle different return types
            if (result === null || result === undefined) {
                // No render
            } else if (typeof result === 'string') {
                // String (HTML) - render as text
                ctx.fillStyle = '#fff';
                ctx.font = '24px system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(result, width / 2, height / 2);
            } else if (result instanceof HTMLCanvasElement) {
                // Canvas element - draw it
                ctx.drawImage(result, 0, 0);
            } else if (result instanceof ImageBitmap || result instanceof HTMLImageElement) {
                // Image - draw it
                ctx.drawImage(result, 0, 0, width, height);
            } else if (typeof result === 'object') {
                // Object with render instructions
                renderCompositionObject(ctx, result, compositionProps);
            }

            // Draw frame counter overlay (debug)
            if (process.env.NODE_ENV === 'development') {
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.font = '12px monospace';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText(`Frame: ${frame}/${durationInFrames} | FPS: ${fps}`, 10, 10);
            }

        } catch (error) {
            onError?.(error instanceof Error ? error : new Error('Render error'));
            ctx.fillStyle = '#f00';
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = '#fff';
            ctx.font = '20px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('Render Error', width / 2, height / 2);
        }

        onFrameChange?.(frame);
    }

    // Render composition object (scene graph)
    function renderCompositionObject(
        ctx: CanvasRenderingContext2D,
        obj: any,
        props: CompositionProps
    ): void {
        if (Array.isArray(obj)) {
            // Array of children
            obj.forEach(child => renderCompositionObject(ctx, child, props));
            return;
        }

        ctx.save();

        // Apply transforms
        if (obj.transform) {
            const { x = 0, y = 0, scale = 1, rotation = 0, opacity = 1 } = obj.transform;
            ctx.translate(x, y);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.scale(scale, scale);
            ctx.globalAlpha = opacity;
        }

        // Render based on type
        switch (obj.type) {
            case 'rect':
                ctx.fillStyle = obj.fill || '#fff';
                ctx.fillRect(obj.x || 0, obj.y || 0, obj.width || 100, obj.height || 100);
                break;

            case 'circle':
                ctx.fillStyle = obj.fill || '#fff';
                ctx.beginPath();
                ctx.arc(obj.x || 0, obj.y || 0, obj.radius || 50, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'text':
                ctx.fillStyle = obj.fill || '#fff';
                ctx.font = obj.font || '24px system-ui';
                ctx.textAlign = obj.align || 'left';
                ctx.textBaseline = obj.baseline || 'top';
                ctx.fillText(obj.text || '', obj.x || 0, obj.y || 0);
                break;

            case 'image':
                if (obj.src instanceof HTMLImageElement) {
                    ctx.drawImage(obj.src, obj.x || 0, obj.y || 0, obj.width || obj.src.width, obj.height || obj.src.height);
                }
                break;

            case 'sequence':
                // Render children based on timing
                const sequenceFrame = props.frame - (obj.from || 0);
                if (sequenceFrame >= 0 && sequenceFrame < (obj.durationInFrames || Infinity)) {
                    if (obj.children) {
                        renderCompositionObject(ctx, obj.children, {
                            ...props,
                            frame: sequenceFrame
                        });
                    }
                }
                break;

            case 'group':
            case 'abs-fill':
            case 'container':
                if (obj.children) {
                    renderCompositionObject(ctx, obj.children, props);
                }
                break;
        }

        ctx.restore();
    }

    // Animation loop
    function tick(timestamp: number): void {
        if (!state.isPlaying) return;

        if (lastTimestamp === null) {
            lastTimestamp = timestamp;
        }

        const deltaTime = (timestamp - lastTimestamp) * state.playbackRate;
        lastTimestamp = timestamp;
        accumulatedTime += deltaTime;

        const frameDuration = 1000 / fps;

        while (accumulatedTime >= frameDuration) {
            accumulatedTime -= frameDuration;
            state.currentFrame++;

            if (state.currentFrame >= durationInFrames) {
                if (loop) {
                    state.currentFrame = 0;
                } else {
                    state.currentFrame = durationInFrames - 1;
                    state.isPlaying = false;
                    state.hasEnded = true;
                    onEnded?.();
                    updateControlsUI();
                    return;
                }
            }
        }

        renderFrame(state.currentFrame);
        updateProgressBar();

        if (state.isPlaying) {
            animationFrameId = requestAnimationFrame(tick);
        }
    }

    // Player API
    const api: PlayerAPI = {
        play() {
            if (state.hasEnded) {
                state.currentFrame = 0;
                state.hasEnded = false;
            }
            state.isPlaying = true;
            lastTimestamp = null;
            accumulatedTime = 0;
            animationFrameId = requestAnimationFrame(tick);
            onPlay?.();
            updateControlsUI();
        },

        pause() {
            state.isPlaying = false;
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            onPause?.();
            updateControlsUI();
        },

        toggle() {
            if (state.isPlaying) {
                api.pause();
            } else {
                api.play();
            }
        },

        seekTo(frame: number) {
            state.currentFrame = Math.max(0, Math.min(frame, durationInFrames - 1));
            state.hasEnded = false;
            renderFrame(state.currentFrame);
            onSeek?.(state.currentFrame);
            updateProgressBar();
        },

        getCurrentFrame() {
            return state.currentFrame;
        },

        isPlaying() {
            return state.isPlaying;
        },

        setVolume(vol: number) {
            state.volume = Math.max(0, Math.min(1, vol));
            state.muted = state.volume === 0;
        },

        setPlaybackRate(rate: number) {
            state.playbackRate = Math.max(0.1, Math.min(4, rate));
        },

        async enterFullscreen() {
            try {
                await container.requestFullscreen();
                state.isFullscreen = true;
            } catch (e) {
                // Fullscreen not supported
            }
        },

        async exitFullscreen() {
            try {
                await document.exitFullscreen();
                state.isFullscreen = false;
            } catch (e) {
                // Not in fullscreen
            }
        },

        destroy() {
            api.pause();
            container.remove();
        }
    };

    // Controls UI
    let controlsContainer: HTMLElement | null = null;
    let playButton: HTMLButtonElement | null = null;
    let progressBar: HTMLInputElement | null = null;
    let timeDisplay: HTMLElement | null = null;

    function updateControlsUI(): void {
        if (playButton) {
            playButton.textContent = state.isPlaying ? '⏸' : '▶';
            playButton.title = state.isPlaying ? 'Pause' : 'Play';
        }
    }

    function updateProgressBar(): void {
        if (progressBar) {
            progressBar.value = String(state.currentFrame);
        }
        if (timeDisplay) {
            const currentTime = state.currentFrame / fps;
            const totalTime = durationInFrames / fps;
            timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(totalTime)}`;
        }
    }

    function formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    if (controls) {
        controlsContainer = document.createElement('div');
        controlsContainer.className = 'phil-remotion-controls';
        controlsContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            background: rgba(0,0,0,0.8);
            color: #fff;
        `;

        // Play/Pause button
        playButton = document.createElement('button');
        playButton.textContent = state.isPlaying ? '⏸' : '▶';
        playButton.title = state.isPlaying ? 'Pause' : 'Play';
        playButton.style.cssText = 'background: none; border: none; color: #fff; font-size: 18px; cursor: pointer; padding: 5px 10px;';
        playButton.addEventListener('click', () => api.toggle());

        // Progress bar
        progressBar = document.createElement('input');
        progressBar.type = 'range';
        progressBar.min = '0';
        progressBar.max = String(durationInFrames - 1);
        progressBar.value = '0';
        progressBar.style.cssText = 'flex: 1; cursor: pointer;';
        progressBar.addEventListener('input', () => {
            api.seekTo(parseInt(progressBar!.value, 10));
        });

        // Time display
        timeDisplay = document.createElement('span');
        timeDisplay.className = 'phil-remotion-time';
        timeDisplay.style.cssText = 'font-family: monospace; font-size: 12px; min-width: 80px;';
        updateProgressBar();

        // Fullscreen button
        const fullscreenButton = document.createElement('button');
        fullscreenButton.textContent = '⛶';
        fullscreenButton.title = 'Fullscreen';
        fullscreenButton.style.cssText = 'background: none; border: none; color: #fff; font-size: 18px; cursor: pointer; padding: 5px 10px;';
        fullscreenButton.addEventListener('click', () => {
            if (state.isFullscreen) {
                api.exitFullscreen();
            } else {
                api.enterFullscreen();
            }
        });

        controlsContainer.appendChild(playButton);
        controlsContainer.appendChild(progressBar);
        controlsContainer.appendChild(timeDisplay);
        controlsContainer.appendChild(fullscreenButton);
    }

    // Event handlers
    if (clickToPlay) {
        viewport.addEventListener('click', () => api.toggle());
        viewport.style.cursor = 'pointer';
    }

    if (doubleClickToFullscreen) {
        viewport.addEventListener('dblclick', () => {
            if (state.isFullscreen) {
                api.exitFullscreen();
            } else {
                api.enterFullscreen();
            }
        });
    }

    // Keyboard controls
    container.tabIndex = 0;
    container.addEventListener('keydown', (e) => {
        switch (e.key) {
            case ' ':
            case 'k':
                e.preventDefault();
                api.toggle();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                api.seekTo(state.currentFrame - fps); // -1 second
                break;
            case 'ArrowRight':
                e.preventDefault();
                api.seekTo(state.currentFrame + fps); // +1 second
                break;
            case 'Home':
                e.preventDefault();
                api.seekTo(0);
                break;
            case 'End':
                e.preventDefault();
                api.seekTo(durationInFrames - 1);
                break;
            case 'f':
                e.preventDefault();
                if (state.isFullscreen) {
                    api.exitFullscreen();
                } else {
                    api.enterFullscreen();
                }
                break;
        }
    });

    // Assemble
    container.appendChild(viewport);
    if (controlsContainer) {
        container.appendChild(controlsContainer);
    }

    // Initial render
    renderFrame(0);

    // Auto-play
    if (autoPlay) {
        api.play();
    }

    // Attach API
    (container as any).api = api;

    return container as HTMLElement & { api: PlayerAPI };
}

// ============================================================================
// Composition Helpers
// ============================================================================

/**
 * Create a simple composition from a render function
 */
export function createComposition(
    id: string,
    component: (props: CompositionProps) => any,
    defaultProps?: Record<string, any>
): RemotionComposition {
    return { id, component, defaultProps };
}

/**
 * Linear interpolation helper
 */
export function interpolate(
    frame: number,
    inputRange: [number, number],
    outputRange: [number, number],
    options?: {
        extrapolateLeft?: 'clamp' | 'extend';
        extrapolateRight?: 'clamp' | 'extend';
        easing?: (t: number) => number;
    }
): number {
    const [inStart, inEnd] = inputRange;
    const [outStart, outEnd] = outputRange;
    const { extrapolateLeft = 'clamp', extrapolateRight = 'clamp', easing = (t: number) => t } = options || {};

    let progress = (frame - inStart) / (inEnd - inStart);

    // Extrapolation
    if (progress < 0) {
        if (extrapolateLeft === 'clamp') progress = 0;
    } else if (progress > 1) {
        if (extrapolateRight === 'clamp') progress = 1;
    }

    // Apply easing
    progress = easing(progress);

    return outStart + progress * (outEnd - outStart);
}

/**
 * Spring animation helper
 */
export function spring(options: {
    frame: number;
    fps: number;
    from?: number;
    to?: number;
    config?: {
        damping?: number;
        mass?: number;
        stiffness?: number;
    };
}): number {
    const { frame, fps, from = 0, to = 1, config = {} } = options;
    const { damping = 10, mass = 1, stiffness = 100 } = config;

    const time = frame / fps;
    const omega = Math.sqrt(stiffness / mass);
    const zeta = damping / (2 * Math.sqrt(stiffness * mass));

    let value: number;
    if (zeta < 1) {
        // Underdamped
        const omega_d = omega * Math.sqrt(1 - zeta * zeta);
        value = 1 - Math.exp(-zeta * omega * time) *
            (Math.cos(omega_d * time) + (zeta * omega / omega_d) * Math.sin(omega_d * time));
    } else {
        // Critically or overdamped
        value = 1 - (1 + omega * time) * Math.exp(-omega * time);
    }

    return from + value * (to - from);
}

/**
 * Easing functions
 */
export const Easing = {
    linear: (t: number) => t,
    easeIn: (t: number) => t * t,
    easeOut: (t: number) => 1 - (1 - t) * (1 - t),
    easeInOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    easeInCubic: (t: number) => t * t * t,
    easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
    easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    easeInQuart: (t: number) => t * t * t * t,
    easeOutQuart: (t: number) => 1 - Math.pow(1 - t, 4),
    easeInQuint: (t: number) => t * t * t * t * t,
    easeOutQuint: (t: number) => 1 - Math.pow(1 - t, 5),
    easeInSine: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
    easeOutSine: (t: number) => Math.sin((t * Math.PI) / 2),
    easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
    easeInExpo: (t: number) => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
    easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeInElastic: (t: number) => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
    },
    easeOutElastic: (t: number) => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    easeOutBounce: (t: number) => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) return n1 * t * t;
        if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
        if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
};

/**
 * Sequence helper - runs items in sequence
 */
export function sequence(
    items: Array<{ from: number; durationInFrames: number; children: any }>
): any[] {
    let offset = 0;
    return items.map(item => {
        const result = {
            type: 'sequence',
            from: offset,
            durationInFrames: item.durationInFrames,
            children: item.children
        };
        offset += item.durationInFrames;
        return result;
    });
}

// ============================================================================
// Exports
// ============================================================================

export type {
    RemotionPlayerProps,
    RemotionComposition,
    CompositionProps,
    PlayerAPI
};
