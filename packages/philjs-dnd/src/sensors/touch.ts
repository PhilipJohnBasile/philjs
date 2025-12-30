import type { Sensor, SensorOptions, SensorHandlers, Position } from '../types.js';

// ============================================================================
// Touch Sensor
// ============================================================================

export interface TouchSensorOptions extends SensorOptions {
  activationConstraint?: {
    delay?: number;
    tolerance?: number;
    distance?: number;
  };
}

export function TouchSensor(options: TouchSensorOptions = {}): Sensor {
  let isActive = false;
  let startPosition: Position | null = null;
  let currentHandlers: SensorHandlers | null = null;
  let activationTimer: ReturnType<typeof setTimeout> | null = null;
  let touchId: number | null = null;

  const { activationConstraint } = options;
  const delay = activationConstraint?.delay ?? 250; // Default delay for touch to distinguish from scroll
  const tolerance = activationConstraint?.tolerance ?? 10;
  const distance = activationConstraint?.distance ?? 0;

  function getTouchById(event: TouchEvent, id: number): Touch | null {
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      if (touch && touch.identifier === id) {
        return touch;
      }
    }
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      if (touch && touch.identifier === id) {
        return touch;
      }
    }
    return null;
  }

  function handleTouchMove(event: TouchEvent) {
    if (touchId === null) return;

    const touch = getTouchById(event, touchId);
    if (!touch) return;

    const currentPosition: Position = {
      x: touch.clientX,
      y: touch.clientY,
    };

    if (!isActive && startPosition) {
      const deltaX = currentPosition.x - startPosition.x;
      const deltaY = currentPosition.y - startPosition.y;
      const movedDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Cancel activation if moved too far during delay
      if (movedDistance > tolerance && activationTimer) {
        clearTimeout(activationTimer);
        activationTimer = null;
        cleanup();
        return;
      }

      // Activate based on distance if no delay
      if (delay === 0 && movedDistance >= distance) {
        activate(currentPosition);
      }
    } else if (isActive) {
      event.preventDefault();
      currentHandlers?.onMove(currentPosition);
    }
  }

  function handleTouchEnd(event: TouchEvent) {
    if (touchId === null) return;

    const touch = getTouchById(event, touchId);

    if (activationTimer) {
      clearTimeout(activationTimer);
      activationTimer = null;
    }

    if (isActive && touch) {
      currentHandlers?.onEnd({ x: touch.clientX, y: touch.clientY });
    } else if (isActive && startPosition) {
      currentHandlers?.onEnd(startPosition);
    }

    cleanup();
  }

  function handleTouchCancel() {
    if (activationTimer) {
      clearTimeout(activationTimer);
      activationTimer = null;
    }

    if (isActive) {
      currentHandlers?.onCancel();
    }

    cleanup();
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
    touchId = null;

    document.removeEventListener('touchmove', handleTouchMove, { capture: true } as EventListenerOptions);
    document.removeEventListener('touchend', handleTouchEnd);
    document.removeEventListener('touchcancel', handleTouchCancel);
    document.removeEventListener('contextmenu', handleContextMenu);
  }

  return {
    type: 'pointer',
    options,

    activate(event: Event, handlers: SensorHandlers) {
      if (!(event instanceof TouchEvent)) return;
      if (event.touches.length !== 1) return; // Only single touch

      const touch = event.touches[0]!;
      touchId = touch.identifier;

      startPosition = {
        x: touch.clientX,
        y: touch.clientY,
      };
      currentHandlers = handlers;

      // Set up event listeners
      document.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
      document.addEventListener('touchend', handleTouchEnd);
      document.addEventListener('touchcancel', handleTouchCancel);
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
// Touch Sensor Presets
// ============================================================================

export function LongPressSensor(delayMs: number = 250): Sensor {
  return TouchSensor({
    activationConstraint: {
      delay: delayMs,
      tolerance: 10,
    },
  });
}

export function ImmediateTouchSensor(): Sensor {
  return TouchSensor({
    activationConstraint: {
      delay: 0,
      distance: 10,
    },
  });
}

// ============================================================================
// Prevent Default Scrolling
// ============================================================================

export function preventScrolling(element: HTMLElement) {
  const originalTouchAction = element.style.touchAction;
  element.style.touchAction = 'none';

  return () => {
    element.style.touchAction = originalTouchAction;
  };
}
