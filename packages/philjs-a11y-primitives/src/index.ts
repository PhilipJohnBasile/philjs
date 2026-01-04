/**
 * PhilJS A11y Primitives (React Aria style)
 */

import { signal, effect } from '@philjs/core';

export function useFocusRing() {
    const isFocusVisible = signal(false);
    return {
        isFocusVisible,
        focusProps: {
            onFocus: () => isFocusVisible.set(true),
            onBlur: () => isFocusVisible.set(false),
        }
    };
}

export function usePress(options: { onPress?: () => void } = {}) {
    const isPressed = signal(false);
    return {
        isPressed,
        pressProps: {
            onPointerDown: () => isPressed.set(true),
            onPointerUp: () => { isPressed.set(false); options.onPress?.(); },
            onKeyDown: (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); isPressed.set(true); } },
            onKeyUp: (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { isPressed.set(false); options.onPress?.(); } },
        }
    };
}

export function useLabel(id: string) {
    return { labelProps: { id, for: id }, fieldProps: { 'aria-labelledby': id } };
}

export function useVisuallyHidden() {
    return {
        visuallyHiddenProps: {
            style: { position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }
        }
    };
}

export function useAnnounce() {
    const announce = (message: string, assertive = false) => {
        const el = document.createElement('div');
        el.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
        el.setAttribute('aria-atomic', 'true');
        el.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)';
        document.body.appendChild(el);
        setTimeout(() => { el.textContent = message; }, 100);
        setTimeout(() => { document.body.removeChild(el); }, 1000);
    };
    return { announce };
}
