import type { Sensor, SensorOptions, SensorHandlers, Position } from '../types.js';

// ============================================================================
// Keyboard Sensor
// ============================================================================

export interface KeyboardSensorOptions extends SensorOptions {
  keyboardCodes?: {
    start?: string[];
    cancel?: string[];
    end?: string[];
    up?: string[];
    down?: string[];
    left?: string[];
    right?: string[];
  };
  moveStep?: number;
  moveStepLarge?: number;
}

const defaultKeyboardCodes = {
  start: ['Space', 'Enter'],
  cancel: ['Escape'],
  end: ['Space', 'Enter'],
  up: ['ArrowUp'],
  down: ['ArrowDown'],
  left: ['ArrowLeft'],
  right: ['ArrowRight'],
};

export function KeyboardSensor(options: KeyboardSensorOptions = {}): Sensor {
  let isActive = false;
  let currentPosition: Position | null = null;
  let currentHandlers: SensorHandlers | null = null;
  let targetElement: HTMLElement | null = null;

  const codes = { ...defaultKeyboardCodes, ...options.keyboardCodes };
  const moveStep = options.moveStep ?? 10;
  const moveStepLarge = options.moveStepLarge ?? 50;

  function handleKeyDown(event: KeyboardEvent) {
    const key = event.code;

    if (!isActive) {
      // Check for start keys
      if (codes.start.includes(key)) {
        event.preventDefault();
        activate();
      }
      return;
    }

    // Already active - handle navigation
    event.preventDefault();

    const step = event.shiftKey ? moveStepLarge : moveStep;

    if (codes.cancel.includes(key)) {
      currentHandlers?.onCancel();
      cleanup();
      return;
    }

    if (codes.end.includes(key)) {
      if (currentPosition) {
        currentHandlers?.onEnd(currentPosition);
      }
      cleanup();
      return;
    }

    if (!currentPosition) return;

    let newPosition = { ...currentPosition };

    if (codes.up.includes(key)) {
      newPosition.y -= step;
    } else if (codes.down.includes(key)) {
      newPosition.y += step;
    } else if (codes.left.includes(key)) {
      newPosition.x -= step;
    } else if (codes.right.includes(key)) {
      newPosition.x += step;
    } else {
      return;
    }

    currentPosition = newPosition;
    currentHandlers?.onMove(newPosition);
  }

  function handleBlur() {
    if (isActive) {
      currentHandlers?.onCancel();
      cleanup();
    }
  }

  function activate() {
    if (isActive || !targetElement) return;

    const rect = targetElement.getBoundingClientRect();
    currentPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    isActive = true;
    currentHandlers?.onStart(currentPosition);
  }

  function cleanup() {
    isActive = false;
    currentPosition = null;

    if (targetElement) {
      targetElement.removeEventListener('keydown', handleKeyDown);
      targetElement.removeEventListener('blur', handleBlur);
    }

    targetElement = null;
    currentHandlers = null;
  }

  return {
    type: 'keyboard',
    options,

    activate(event: Event, handlers: SensorHandlers) {
      if (!(event instanceof KeyboardEvent)) return;
      if (!codes.start.includes(event.code)) return;

      const element = event.target as HTMLElement;
      if (!element) return;

      targetElement = element;
      currentHandlers = handlers;

      element.addEventListener('keydown', handleKeyDown);
      element.addEventListener('blur', handleBlur);

      // Activate immediately since the event is already a start key
      event.preventDefault();
      activate();
    },

    deactivate() {
      if (isActive) {
        currentHandlers?.onCancel();
      }
      cleanup();
    },
  };
}

// ============================================================================
// Keyboard Sensor Presets
// ============================================================================

export function WasdKeyboardSensor(options?: Omit<KeyboardSensorOptions, 'keyboardCodes'>): Sensor {
  return KeyboardSensor({
    ...options,
    keyboardCodes: {
      start: ['Space', 'Enter'],
      cancel: ['Escape'],
      end: ['Space', 'Enter'],
      up: ['KeyW', 'ArrowUp'],
      down: ['KeyS', 'ArrowDown'],
      left: ['KeyA', 'ArrowLeft'],
      right: ['KeyD', 'ArrowRight'],
    },
  });
}

export function VimKeyboardSensor(options?: Omit<KeyboardSensorOptions, 'keyboardCodes'>): Sensor {
  return KeyboardSensor({
    ...options,
    keyboardCodes: {
      start: ['Space', 'Enter'],
      cancel: ['Escape'],
      end: ['Space', 'Enter'],
      up: ['KeyK', 'ArrowUp'],
      down: ['KeyJ', 'ArrowDown'],
      left: ['KeyH', 'ArrowLeft'],
      right: ['KeyL', 'ArrowRight'],
    },
  });
}

// ============================================================================
// Keyboard Coordinate Helpers
// ============================================================================

export interface KeyboardCoordinates {
  currentCoordinates: Position;
  context: {
    activeRect: DOMRect | null;
    droppableRects: Map<string, DOMRect>;
    droppableOrder: string[];
  };
}

export function getNextDroppableId(
  direction: 'up' | 'down' | 'left' | 'right',
  context: KeyboardCoordinates['context'],
  currentOverId?: string | null
): string | null {
  const { droppableRects, droppableOrder } = context;

  if (droppableOrder.length === 0) return null;

  const currentIndex = currentOverId ? droppableOrder.indexOf(currentOverId) : -1;

  switch (direction) {
    case 'up':
    case 'left':
      if (currentIndex <= 0) return droppableOrder[droppableOrder.length - 1]!;
      return droppableOrder[currentIndex - 1]!;

    case 'down':
    case 'right':
      if (currentIndex >= droppableOrder.length - 1 || currentIndex === -1) {
        return droppableOrder[0]!;
      }
      return droppableOrder[currentIndex + 1]!;

    default:
      return null;
  }
}

export function getDroppableCenter(droppableId: string, rects: Map<string, DOMRect>): Position | null {
  const rect = rects.get(droppableId);
  if (!rect) return null;

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}
