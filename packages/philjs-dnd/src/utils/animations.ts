import type { AnimationConfig, DropAnimation, Position, Rect } from '../types.js';

// ============================================================================
// Default Animation Configurations
// ============================================================================

export const defaultDropAnimation: DropAnimation = {
  duration: 250,
  easing: 'ease',
};

export const fastDropAnimation: DropAnimation = {
  duration: 150,
  easing: 'ease-out',
};

export const slowDropAnimation: DropAnimation = {
  duration: 400,
  easing: 'ease-in-out',
};

export const springDropAnimation: DropAnimation = {
  duration: 300,
  easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

export const bounceDropAnimation: DropAnimation = {
  duration: 500,
  easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

// ============================================================================
// Easing Functions
// ============================================================================

export const easings = {
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
  easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easeInOutQuad: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
  easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  easeInQuart: 'cubic-bezier(0.895, 0.03, 0.685, 0.22)',
  easeOutQuart: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
  easeInOutQuart: 'cubic-bezier(0.77, 0, 0.175, 1)',
  easeInExpo: 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
  easeOutExpo: 'cubic-bezier(0.19, 1, 0.22, 1)',
  easeInOutExpo: 'cubic-bezier(1, 0, 0, 1)',
  easeInBack: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  easeOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  easeInOutBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

// ============================================================================
// Apply Drop Animation
// ============================================================================

export function applyDropAnimation(
  element: HTMLElement,
  animation: DropAnimation
): Promise<void> {
  return new Promise((resolve) => {
    const { duration, easing, sideEffects } = animation;

    // Apply custom side effects
    if (sideEffects) {
      sideEffects({
        active: { id: element.dataset['dragId'] ?? '', type: 'default' },
        dragOverlay: element,
      });
    }

    // Apply transition
    element.style.transition = `transform ${duration}ms ${easing}, opacity ${duration}ms ${easing}`;
    element.style.transform = 'translate3d(0, 0, 0)';
    element.style.opacity = '0';

    // Wait for animation to complete
    const handleTransitionEnd = () => {
      element.removeEventListener('transitionend', handleTransitionEnd);
      element.style.transition = '';
      resolve();
    };

    element.addEventListener('transitionend', handleTransitionEnd);

    // Fallback timeout
    setTimeout(() => {
      element.removeEventListener('transitionend', handleTransitionEnd);
      resolve();
    }, duration + 50);
  });
}

// ============================================================================
// Layout Shift Animation
// ============================================================================

export interface LayoutShiftAnimation {
  duration: number;
  easing: string;
}

export const defaultLayoutShiftAnimation: LayoutShiftAnimation = {
  duration: 200,
  easing: 'ease',
};

export function animateLayoutShift(
  element: HTMLElement,
  from: { x: number; y: number },
  to: { x: number; y: number },
  config: LayoutShiftAnimation = defaultLayoutShiftAnimation
): Promise<void> {
  return new Promise((resolve) => {
    const deltaX = from.x - to.x;
    const deltaY = from.y - to.y;

    // Start from the old position
    element.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
    element.style.transition = '';

    // Force reflow
    element.offsetHeight;

    // Animate to new position
    element.style.transition = `transform ${config.duration}ms ${config.easing}`;
    element.style.transform = 'translate3d(0, 0, 0)';

    const handleTransitionEnd = () => {
      element.removeEventListener('transitionend', handleTransitionEnd);
      element.style.transition = '';
      element.style.transform = '';
      resolve();
    };

    element.addEventListener('transitionend', handleTransitionEnd);

    // Fallback timeout
    setTimeout(() => {
      element.removeEventListener('transitionend', handleTransitionEnd);
      element.style.transition = '';
      element.style.transform = '';
      resolve();
    }, config.duration + 50);
  });
}

// ============================================================================
// Keyframe Animations
// ============================================================================

export function createKeyframeAnimation(
  element: HTMLElement,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions
): Animation {
  return element.animate(keyframes, options);
}

export const shakeKeyframes: Keyframe[] = [
  { transform: 'translate3d(0, 0, 0)' },
  { transform: 'translate3d(-5px, 0, 0)' },
  { transform: 'translate3d(5px, 0, 0)' },
  { transform: 'translate3d(-5px, 0, 0)' },
  { transform: 'translate3d(5px, 0, 0)' },
  { transform: 'translate3d(0, 0, 0)' },
];

export const pulseKeyframes: Keyframe[] = [
  { transform: 'scale(1)', opacity: 1 },
  { transform: 'scale(1.05)', opacity: 0.8 },
  { transform: 'scale(1)', opacity: 1 },
];

export const fadeOutKeyframes: Keyframe[] = [
  { opacity: 1 },
  { opacity: 0 },
];

export const fadeInKeyframes: Keyframe[] = [
  { opacity: 0 },
  { opacity: 1 },
];

export const scaleUpKeyframes: Keyframe[] = [
  { transform: 'scale(0.8)', opacity: 0 },
  { transform: 'scale(1)', opacity: 1 },
];

export const scaleDownKeyframes: Keyframe[] = [
  { transform: 'scale(1)', opacity: 1 },
  { transform: 'scale(0.8)', opacity: 0 },
];

export const slideInFromTopKeyframes: Keyframe[] = [
  { transform: 'translateY(-100%)', opacity: 0 },
  { transform: 'translateY(0)', opacity: 1 },
];

export const slideInFromBottomKeyframes: Keyframe[] = [
  { transform: 'translateY(100%)', opacity: 0 },
  { transform: 'translateY(0)', opacity: 1 },
];

// ============================================================================
// Utility Functions
// ============================================================================

export function getTransformValues(element: HTMLElement): Position {
  const style = window.getComputedStyle(element);
  const matrix = new DOMMatrixReadOnly(style.transform);

  return {
    x: matrix.m41,
    y: matrix.m42,
  };
}

export function setTransform(element: HTMLElement, position: Position): void {
  element.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
}

export function clearTransform(element: HTMLElement): void {
  element.style.transform = '';
  element.style.transition = '';
}

// ============================================================================
// FLIP Animation Helper
// ============================================================================

export interface FlipState {
  rect: DOMRect;
  element: HTMLElement;
}

export function captureFlipState(element: HTMLElement): FlipState {
  return {
    rect: element.getBoundingClientRect(),
    element,
  };
}

export function playFlipAnimation(
  firstState: FlipState,
  config: LayoutShiftAnimation = defaultLayoutShiftAnimation
): Promise<void> {
  const { element, rect: firstRect } = firstState;
  const lastRect = element.getBoundingClientRect();

  const deltaX = firstRect.left - lastRect.left;
  const deltaY = firstRect.top - lastRect.top;

  if (deltaX === 0 && deltaY === 0) {
    return Promise.resolve();
  }

  return animateLayoutShift(
    element,
    { x: firstRect.left, y: firstRect.top },
    { x: lastRect.left, y: lastRect.top },
    config
  );
}

// ============================================================================
// CSS Transition Helpers
// ============================================================================

export function getTransitionString(
  property: string | string[],
  duration: number,
  easing: string = 'ease',
  delay: number = 0
): string {
  const properties = Array.isArray(property) ? property : [property];
  return properties.map((p) => `${p} ${duration}ms ${easing} ${delay}ms`).join(', ');
}

export function removeTransition(element: HTMLElement): void {
  element.style.transition = 'none';
}

export function waitForTransition(element: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const handleTransitionEnd = () => {
      element.removeEventListener('transitionend', handleTransitionEnd);
      resolve();
    };

    element.addEventListener('transitionend', handleTransitionEnd);
  });
}
