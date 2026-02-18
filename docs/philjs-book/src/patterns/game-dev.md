# Game Development Patterns

PhilJS provides a unique advantage for game development: **Signals**. The fine-grained reactivity model is perfect for high-frequency updates (60fps+) without the overhead of Virtual DOM reconciliation.

The `@philjs/3d` package provides integrations for WebGL and external game engines.

## The Signal Game Loop

Traditional React-like frameworks struggle with game loops because they re-render components. In PhilJS, components run once. You can bind signals directly to properties for zero-overhead updates.

```tsx
import { signal, effect } from '@philjs/core';
import { Canvas, Mesh } from '@philjs/3d/three';

function Game() {
  const rotation = signal(0);

  // Game Loop
  const loop = () => {
    rotation.set(r => r + 0.01);
    requestAnimationFrame(loop);
  };
  
  onMount(() => loop());

  // The Mesh component initializes once.
  // The 'rotation-y' prop subscribes directly to the signal.
  // No re-renders occur.
  return (
    <Canvas>
      <Mesh 
        geometry="box" 
        material="standard" 
        rotation-y={rotation} 
      />
    </Canvas>
  );
}
```

## Entity Component System (ECS)

Signals map naturally to ECS architectures.

- **Keys**: Entity IDs.
- **Values**: Signals of Component data.
- **Systems**: `computed` or `effect` observing the signals.

```typescript
const position = signal({ x: 0, y: 0 });
const velocity = signal({ x: 1, y: 0 });

// Physics System
effect(() => {
  const p = position();
  const v = velocity();
  // Update logic...
});
```

## Three.js Integration

The `@philjs/3d/three` module provides a thin wrapper around Three.js that accepts signals as props.

```tsx
import { Canvas, PerspectiveCamera, AmbientLight } from '@philjs/3d/three';

<Canvas>
  <PerspectiveCamera position={[0, 0, 5]} />
  <AmbientLight intensity={0.5} />
  <Player />
  <Enemy />
</Canvas>
```

## External Engine Bridges

For AAA experiences, you can embed engines like Unreal or Unity and communicate via the PhilJS Bridge.

### Unreal Engine (Pixel Streaming)

```tsx
import { UnrealStream } from '@philjs/3d/unreal';

<UnrealStream 
  source="wss://my-unreal-server.com" 
  onEvent={(e) => console.log('Game Event:', e)}
  quality="epic"
/>
```

### Godot (Web Export)

```tsx
import { GodotGame } from '@philjs/3d/godot';

<GodotGame 
  src="/games/my-game.pck" 
  wasm="/games/my-game.wasm" 
  width={800}
  height={600}
/>
```

## Performance Tips

1. **Bypass the Framework**: For raw WebGL performance, access the DOM node directly using `ref`.
2. **Use Workers**: Offload physics and AI calculations to Web Workers (`@philjs/workers`).
3. **Object Pooling**: Reuse objects instead of creating new ones in the loop to avoid Garbage Collection spikes.
