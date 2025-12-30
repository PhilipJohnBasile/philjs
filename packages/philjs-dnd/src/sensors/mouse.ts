import type { Sensor, SensorOptions, SensorHandlers, Position } from '../types.js';

// ============================================================================
// Mouse Sensor
// ============================================================================

export interface MouseSensorOptions extends SensorOptions {
  activationConstraint?: {
    distance?: number;
    delay?: number;
    tolerance?: number;
  };
}

export function MouseSensor(options: MouseSensorOptions = {}): Sensor {
  let isActive = false;
  let startPosition: Position | null = null;
  let currentHandlers: SensorHandlers | null = null;
  let activationTimer: ReturnType<typeof setTimeout> | null = null;

  const { activationConstraint } = options;
  const distance = activationConstraint?.distance ?? 10;
  const delay = activationConstraint?.delay ?? 0;
  const tolerance = activationConstraint?.tolerance ?? 5;

  function handlePointerMove(event: PointerEvent) {
    if (!startPosition) return;

    const currentPosition: Position = {
      x: event.clientX,
      y: event.clientY,
    };

    if (!isActive) {
      // Check if we should activate based on distance
      const deltaX = currentPosition.x - startPosition.x;
      const deltaY = currentPosition.y - startPosition.y;
      const movedDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (movedDistance >= distance) {
        activate(currentPosition);
      } else if (delay > 0 && activationTimer) {
        // Cancel activation if moved too far during delay
        if (movedDistance > tolerance) {
          clearTimeout(activationTimer);
          activationTimer = null;
          cleanup();
        }
      }
    } else {
      currentHandlers?.onMove(currentPosition);
    }
  }

  function handlePointerUp(event: PointerEvent) {
    if (activationTimer) {
      clearTimeout(activationTimer);
      activationTimer = null;
    }

    if (isActive) {
      currentHandlers?.onEnd({ x: event.clientX, y: event.clientY });
    }

    cleanup();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isActive) {
      currentHandlers?.onCancel();
      cleanup();
    }
  }

  function handleContextMenu(event: Event) {
    event.preventDefault();
  }

  function activate(position: Position) {
    if (isActive) return;
    isActive = true;
    currentHandlers?.onStart(position);
  }

  function cleanup() {
    isActive = false;
    startPosition = null;
    currentHandlers = null;

    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('contextmenu', handleContextMenu);
  }

  return {
    type: 'pointer',
    options,

    activate(event: Event, handlers: SensorHandlers) {
      if (!(event instanceof PointerEvent)) return;
      if (event.button !== 0) return; // Only left mouse button

      startPosition = {
        x: event.clientX,
        y: event.clientY,
      };
      currentHandlers = handlers;

      // Set up event listeners
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('contextmenu', handleContextMenu);

      // Handle activation with delay
      if (delay > 0) {
        activationTimer = setTimeout(() => {
          if (startPosition) {
            activate(startPosition);
          }
        }, delay);
      } else if (distance === 0) {
        // Activate immediately if no distance requirement
        activate(startPosition);
      }
    },

    deactivate() {
      if (activationTimer) {
        clearTimeout(activationTimer);
        activationTimer = null;
      }
      cleanup();
    },
  };
}

// ============================================================================
// Mouse Sensor Presets
// ============================================================================

export function PointerSensor(options?: MouseSensorOptions): Sensor {
  return MouseSensor(options);
}

export function DelayedMouseSensor(delayMs: number = 250): Sensor {
  return MouseSensor({
    activationConstraint: {
      delay: delayMs,
      tolerance: 5,
    },
  });
}

export function DistanceMouseSensor(distancePx: number = 10): Sensor {
  return MouseSensor({
    activationConstraint: {
      distance: distancePx,
    },
  });
}
