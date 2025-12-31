const defaultKeyboardCodes = {
    start: ['Space', 'Enter'],
    cancel: ['Escape'],
    end: ['Space', 'Enter'],
    up: ['ArrowUp'],
    down: ['ArrowDown'],
    left: ['ArrowLeft'],
    right: ['ArrowRight'],
};
export function KeyboardSensor(options = {}) {
    let isActive = false;
    let currentPosition = null;
    let currentHandlers = null;
    let targetElement = null;
    const codes = { ...defaultKeyboardCodes, ...options.keyboardCodes };
    const moveStep = options.moveStep ?? 10;
    const moveStepLarge = options.moveStepLarge ?? 50;
    function handleKeyDown(event) {
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
        if (!currentPosition)
            return;
        let newPosition = { ...currentPosition };
        if (codes.up.includes(key)) {
            newPosition.y -= step;
        }
        else if (codes.down.includes(key)) {
            newPosition.y += step;
        }
        else if (codes.left.includes(key)) {
            newPosition.x -= step;
        }
        else if (codes.right.includes(key)) {
            newPosition.x += step;
        }
        else {
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
        if (isActive || !targetElement)
            return;
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
        activate(event, handlers) {
            if (!(event instanceof KeyboardEvent))
                return;
            if (!codes.start.includes(event.code))
                return;
            const element = event.target;
            if (!element)
                return;
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
export function WasdKeyboardSensor(options) {
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
export function VimKeyboardSensor(options) {
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
export function getNextDroppableId(direction, context, currentOverId) {
    const { droppableRects, droppableOrder } = context;
    if (droppableOrder.length === 0)
        return null;
    const currentIndex = currentOverId ? droppableOrder.indexOf(currentOverId) : -1;
    switch (direction) {
        case 'up':
        case 'left':
            if (currentIndex <= 0)
                return droppableOrder[droppableOrder.length - 1];
            return droppableOrder[currentIndex - 1];
        case 'down':
        case 'right':
            if (currentIndex >= droppableOrder.length - 1 || currentIndex === -1) {
                return droppableOrder[0];
            }
            return droppableOrder[currentIndex + 1];
        default:
            return null;
    }
}
export function getDroppableCenter(droppableId, rects) {
    const rect = rects.get(droppableId);
    if (!rect)
        return null;
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
    };
}
//# sourceMappingURL=keyboard.js.map