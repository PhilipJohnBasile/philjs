/**
 * @philjs/ar - Augmented Reality for PhilJS
 *
 * Production-ready WebXR AR implementation with:
 * - Real-time hit testing for surface detection
 * - Anchor-based object placement
 * - Plane detection (horizontal & vertical)
 * - Light estimation for realistic rendering
 * - Touch gesture recognition
 * - PhilJS reactive hooks integration
 *
 * @example
 * ```typescript
 * import { useAR } from '@philjs/ar';
 *
 * function ARApp() {
 *   const ar = useAR({
 *     near: 0.1,
 *     far: 100,
 *     planeDetection: true,
 *     gestures: true,
 *   });
 *
 *   // Start AR session
 *   await ar.start();
 *
 *   // Place object at detected surface
 *   ar.gestures.on('tap', (event) => {
 *     if (ar.hitResult.get()) {
 *       ar.placeObject({ model: 'cube' });
 *     }
 *   });
 * }
 * ```
 */
// Core AR
export * from './hologram.js';
// Anchors
export * from './anchors.js';
// Plane detection
export * from './planes.js';
// Gestures
export * from './gestures.js';
// PhilJS hooks
export * from './hooks.js';
//# sourceMappingURL=index.js.map