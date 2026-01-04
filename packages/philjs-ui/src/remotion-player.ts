
// Stub for Remotion Player
export interface RemotionPlayerProps {
    composition: any;
    fps: number;
    durationInFrames: number;
    autoPlay?: boolean;
    controls?: boolean;
}

export function RemotionPlayer(props: RemotionPlayerProps) {
    let isPlaying = props.autoPlay || false;
    let currentFrame = 0;

    const toggle = () => {
        isPlaying = !isPlaying;
        console.log('Remotion: Playback state', isPlaying);
    };

    const seek = (frame: number) => {
        currentFrame = Math.min(Math.max(0, frame), props.durationInFrames);
        console.log('Remotion: Seek to', currentFrame);
    };

    // Render player UI
    return `<div class="phil-remotion-player" style="position: relative;">
    <div class="viewport">
      Mock Render of Composition (FPS: ${props.fps})
    </div>
    ${props.controls ? `
      <div class="controls">
        <button onclick="console.log('Toggle')">Play/Pause</button>
        <div class="timeline">Frame: ${currentFrame} / ${props.durationInFrames}</div>
      </div>
    ` : ''}
  </div>`;
}
