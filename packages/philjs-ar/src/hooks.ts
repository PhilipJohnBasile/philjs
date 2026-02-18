/**
 * @philjs/ar - AR Hooks
 *
 * PhilJS hooks for AR integration with reactive signals.
 */

import { signal, memo, effect, type Signal, type Memo } from '@philjs/core';

// Compatibility aliases
const computed = memo;
type Computed<T> = Memo<T>;
import {
  Hologram,
  type ARConfig,
  type ARSessionState,
  type HitTestResult,
  type PlacedObject,
  type LightEstimate,
} from './hologram.js';
import { AnchorManager, type ARAnchorp, type AnchorManagerConfig } from './anchors.js';
import { PlaneDetector, type ARPlane, type PlaneDetectorConfig } from './planes.js';
import { GestureRecognizer, type GestureRecognizerConfig, type GestureState } from './gestures.js';

export interface UseAROptions extends ARConfig {
  planeDetection?: PlaneDetectorConfig | boolean;
  anchors?: AnchorManagerConfig | boolean;
  gestures?: GestureRecognizerConfig | boolean;
  onSessionStart?: () => void;
  onSessionEnd?: () => void;
  onError?: (error: Error) => void;
}

export interface UseARResult {
  // Core state
  supported: Signal<boolean>;
  active: Signal<boolean>;
  error: Signal<Error | null>;

  // Session control
  start: () => Promise<void>;
  end: () => Promise<void>;

  // Hit testing
  hitResult: Signal<HitTestResult | null>;
  performHitTest: (x: number, y: number) => Promise<HitTestResult | null>;

  // Object placement
  placedObjects: Signal<PlacedObject[]>;
  placeObject: (options?: { model?: string; scale?: [number, number, number]; userData?: Record<string, unknown> }) => PlacedObject | null;
  placeObjectAt: (position: Float32Array, orientation: Float32Array, options?: { model?: string; scale?: [number, number, number]; userData?: Record<string, unknown> }) => PlacedObject;
  removeObject: (id: string) => boolean;

  // Light estimation
  lightEstimate: Signal<LightEstimate | null>;

  // Plane detection (if enabled)
  planes: Signal<ARPlane[]> | null;
  horizontalPlanes: Signal<ARPlane[]> | null;
  verticalPlanes: Signal<ARPlane[]> | null;
  largestPlane: Signal<ARPlane | null> | null;

  // Anchors (if enabled)
  anchors: Signal<ARAnchorp[]> | null;
  createAnchor: ((pose: { position: Float32Array; orientation: Float32Array; matrix: Float32Array }) => Promise<ARAnchorp | null>) | null;
  deleteAnchor: ((id: string) => boolean) | null;

  // Gestures (if enabled)
  gestureState: Signal<GestureState> | null;

  // Low-level access
  hologram: Hologram | null;
  glContext: WebGLRenderingContext | null;
  session: XRSession | null;
  referenceSpace: XRReferenceSpace | null;
}

/**
 * Main AR hook for PhilJS
 */
export function useAR(options: UseAROptions): UseARResult {
  // State
  const supported = signal(false);
  const active = signal(false);
  const error = signal<Error | null>(null);
  const hitResult = signal<HitTestResult | null>(null);
  const placedObjects = signal<PlacedObject[]>([]);
  const lightEstimate = signal<LightEstimate | null>(null);

  // Instances
  let hologram: Hologram | null = null;
  let planeDetector: PlaneDetector | null = null;
  let anchorManager: AnchorManager | null = null;
  let gestureRecognizer: GestureRecognizer | null = null;

  // Check support
  Hologram.isSupported().then((isSupported) => {
    supported.set(isSupported);
  });

  // Initialize optional components based on config
  const planesSignal = options.planeDetection ? signal<ARPlane[]>([]) : null;
  const horizontalPlanesSignal = options.planeDetection ? signal<ARPlane[]>([]) : null;
  const verticalPlanesSignal = options.planeDetection ? signal<ARPlane[]>([]) : null;
  const largestPlaneSignal = options.planeDetection ? signal<ARPlane | null>(null) : null;
  const anchorsSignal = options.anchors ? signal<ARAnchorp[]>([]) : null;
  const gestureStateSignal = options.gestures ? signal<GestureState>({
    isActive: false,
    type: null,
    startPosition: null,
    currentPosition: null,
    delta: { x: 0, y: 0 },
    scale: 1,
    rotation: 0,
    velocity: { x: 0, y: 0 },
  }) : null;

  /**
   * Start AR session
   */
  const start = async (): Promise<void> => {
    if (active.get()) return;

    try {
      error.set(null);

      // Create hologram instance
      hologram = await Hologram.start({
        near: options.near,
        far: options.far,
        referenceSpaceType: options.referenceSpaceType,
        domOverlay: options.domOverlay,
        lightEstimation: options.lightEstimation,
      });

      active.set(true);

      // Set up event handlers
      hologram.on('hit', (event) => {
        hitResult.set(event.data as HitTestResult);
      });

      hologram.on('place', () => {
        placedObjects.set(hologram!.getPlacedObjects().slice());
      });

      hologram.on('remove', () => {
        placedObjects.set(hologram!.getPlacedObjects().slice());
      });

      hologram.on('sessionend', () => {
        active.set(false);
        options.onSessionEnd?.();
      });

      hologram.on('error', (event) => {
        error.set(event.data as Error);
        options.onError?.(event.data as Error);
      });

      // Initialize plane detection if enabled
      if (options.planeDetection) {
        const planeConfig = typeof options.planeDetection === 'object' ? options.planeDetection : {};
        planeDetector = new PlaneDetector(planeConfig);
        planeDetector.initialize(hologram.getSession()!, hologram.getReferenceSpace()!);

        // Add frame callback for plane updates
        hologram.addFrameCallback((_, frame) => {
          planeDetector!.processFrame(frame);
          planesSignal!.set(planeDetector!.getPlanes());
          horizontalPlanesSignal!.set(planeDetector!.getHorizontalPlanes());
          verticalPlanesSignal!.set(planeDetector!.getVerticalPlanes());
          largestPlaneSignal!.set(planeDetector!.getLargestPlane());
        });
      }

      // Initialize anchor manager if enabled
      if (options.anchors) {
        const anchorConfig = typeof options.anchors === 'object' ? options.anchors : {};
        anchorManager = new AnchorManager(anchorConfig);
        anchorManager.initialize(hologram.getSession()!, hologram.getReferenceSpace()!);

        // Sync anchor updates
        anchorManager.on('create', () => anchorsSignal!.set(anchorManager!.getAnchors()));
        anchorManager.on('delete', () => anchorsSignal!.set(anchorManager!.getAnchors()));

        // Add frame callback for anchor updates
        hologram.addFrameCallback((_, frame) => {
          anchorManager!.updateAnchors(frame);
        });
      }

      // Initialize gesture recognizer if enabled
      if (options.gestures && options.domOverlay) {
        const gestureConfig = typeof options.gestures === 'object' ? options.gestures : {};
        gestureRecognizer = new GestureRecognizer(gestureConfig);
        gestureRecognizer.attach(options.domOverlay);

        // Sync gesture state
        effect(() => {
          if (gestureRecognizer) {
            gestureStateSignal!.set(gestureRecognizer.state.get());
          }
        });
      }

      // Update light estimate
      hologram.addFrameCallback(() => {
        lightEstimate.set(hologram!.getLightEstimate());
      });

      options.onSessionStart?.();
    } catch (err) {
      error.set(err as Error);
      options.onError?.(err as Error);
    }
  };

  /**
   * End AR session
   */
  const end = async (): Promise<void> => {
    if (!active.get() || !hologram) return;

    try {
      if (planeDetector) {
        planeDetector.dispose();
        planeDetector = null;
      }

      if (anchorManager) {
        anchorManager.dispose();
        anchorManager = null;
      }

      if (gestureRecognizer) {
        gestureRecognizer.dispose();
        gestureRecognizer = null;
      }

      await hologram.end();
      hologram = null;
      active.set(false);
    } catch (err) {
      error.set(err as Error);
    }
  };

  /**
   * Perform hit test
   */
  const performHitTest = async (x: number, y: number): Promise<HitTestResult | null> => {
    if (!hologram) return null;
    return hologram.performHitTest(x, y);
  };

  /**
   * Place object at current hit
   */
  const placeObject = (opts?: { model?: string; scale?: [number, number, number]; userData?: Record<string, unknown> }): PlacedObject | null => {
    if (!hologram) return null;
    return hologram.placeObject(opts);
  };

  /**
   * Place object at position
   */
  const placeObjectAt = (
    position: Float32Array,
    orientation: Float32Array,
    opts?: { model?: string; scale?: [number, number, number]; userData?: Record<string, unknown> }
  ): PlacedObject => {
    if (!hologram) {
      throw new Error('AR session not active');
    }
    return hologram.placeObjectAt(position, orientation, opts);
  };

  /**
   * Remove placed object
   */
  const removeObject = (id: string): boolean => {
    if (!hologram) return false;
    return hologram.removeObject(id);
  };

  /**
   * Create anchor
   */
  const createAnchor = anchorsSignal
    ? async (pose: { position: Float32Array; orientation: Float32Array; matrix: Float32Array }): Promise<ARAnchorp | null> => {
        if (!anchorManager) return null;
        return anchorManager.createAnchor(pose);
      }
    : null;

  /**
   * Delete anchor
   */
  const deleteAnchor = anchorsSignal
    ? (id: string): boolean => {
        if (!anchorManager) return false;
        return anchorManager.deleteAnchor(id);
      }
    : null;

  return {
    // Core state
    supported,
    active,
    error,

    // Session control
    start,
    end,

    // Hit testing
    hitResult,
    performHitTest,

    // Object placement
    placedObjects,
    placeObject,
    placeObjectAt,
    removeObject,

    // Light estimation
    lightEstimate,

    // Plane detection
    planes: planesSignal,
    horizontalPlanes: horizontalPlanesSignal,
    verticalPlanes: verticalPlanesSignal,
    largestPlane: largestPlaneSignal,

    // Anchors
    anchors: anchorsSignal,
    createAnchor,
    deleteAnchor,

    // Gestures
    gestureState: gestureStateSignal,

    // Low-level access
    get hologram() { return hologram; },
    get glContext() { return hologram?.getGLContext() ?? null; },
    get session() { return hologram?.getSession() ?? null; },
    get referenceSpace() { return hologram?.getReferenceSpace() ?? null; },
  };
}

/**
 * Hook for AR hit testing
 */
export function useHitTest(): {
  result: Signal<HitTestResult | null>;
  isHitting: Computed<boolean>;
} {
  const result = signal<HitTestResult | null>(null);
  const isHitting = computed(() => result.get() !== null);

  return { result, isHitting };
}

/**
 * Hook for AR light estimation
 */
export function useLightEstimate(): {
  estimate: Signal<LightEstimate | null>;
  ambientIntensity: Computed<number>;
  primaryDirection: Computed<{ x: number; y: number; z: number } | null>;
} {
  const estimate = signal<LightEstimate | null>(null);

  const ambientIntensity = computed(() => {
    const e = estimate.get();
    if (!e) return 1;
    // Calculate ambient intensity from spherical harmonics or primary light
    const intensity = e.primaryLightIntensity;
    return Math.sqrt(intensity[0] * intensity[0] + intensity[1] * intensity[1] + intensity[2] * intensity[2]);
  });

  const primaryDirection = computed(() => {
    const e = estimate.get();
    if (!e) return null;
    const dir = e.primaryLightDirection;
    return { x: dir[0], y: dir[1], z: dir[2] };
  });

  return { estimate, ambientIntensity, primaryDirection };
}

/**
 * Hook for AR gestures
 */
export function useARGestures(element: HTMLElement | null, config?: GestureRecognizerConfig): {
  state: Signal<GestureState>;
  dispose: () => void;
} {
  const recognizer = new GestureRecognizer(config);
  const state = recognizer.state;

  if (element) {
    recognizer.attach(element);
  }

  return {
    state,
    dispose: () => recognizer.dispose(),
  };
}

/**
 * Hook for object placement
 */
export function usePlacedObjects(): {
  objects: Signal<PlacedObject[]>;
  add: (object: PlacedObject) => void;
  remove: (id: string) => void;
  clear: () => void;
  getById: (id: string) => PlacedObject | undefined;
} {
  const objects = signal<PlacedObject[]>([]);

  return {
    objects,
    add: (object) => objects.set([...objects.get(), object]),
    remove: (id) => objects.set(objects.get().filter((o) => o.id !== id)),
    clear: () => objects.set([]),
    getById: (id) => objects.get().find((o) => o.id === id),
  };
}
