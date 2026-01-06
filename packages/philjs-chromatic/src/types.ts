/**
 * Type definitions for visual regression testing
 */

/**
 * Visual test configuration
 */
export interface VisualTestConfig {
  /** Component to test */
  component: unknown;
  /** Component name */
  name?: string;
  /** Test variants (e.g., 'default', 'hover', 'active') */
  variants?: string[];
  /** Viewports to capture */
  viewports?: ViewportConfig[];
  /** Whether to ignore regions */
  ignoreRegions?: IgnoreRegion[];
  /** Diff threshold (0-1) */
  diffThreshold?: number;
  /** Delay before capture (ms) */
  delay?: number;
  /** Whether to wait for animations */
  waitForAnimations?: boolean;
  /** Custom snapshot selector */
  selector?: string;
  /** Props for each variant */
  variantProps?: Record<string, Record<string, unknown>>;
}

/**
 * Viewport configuration
 */
export interface ViewportConfig {
  /** Viewport name */
  name: string;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Device pixel ratio */
  deviceScaleFactor?: number;
  /** Is mobile viewport */
  isMobile?: boolean;
  /** Has touch support */
  hasTouch?: boolean;
}

/**
 * Common viewport presets
 */
export const VIEWPORT_PRESETS: Record<string, ViewportConfig> = {
  mobile: { name: 'mobile', width: 375, height: 667, isMobile: true, hasTouch: true },
  tablet: { name: 'tablet', width: 768, height: 1024, isMobile: true, hasTouch: true },
  desktop: { name: 'desktop', width: 1280, height: 800 },
  wide: { name: 'wide', width: 1920, height: 1080 },
};

/**
 * Region to ignore during comparison
 */
export interface IgnoreRegion {
  /** CSS selector for region */
  selector?: string;
  /** Fixed coordinates */
  coordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Snapshot metadata
 */
export interface SnapshotMetadata {
  /** Snapshot ID */
  id: string;
  /** Component name */
  componentName: string;
  /** Variant name */
  variant: string;
  /** Viewport used */
  viewport: ViewportConfig;
  /** Capture timestamp */
  timestamp: number;
  /** Browser info */
  browser: string;
  /** Git branch */
  branch?: string;
  /** Git commit */
  commit?: string;
}

/**
 * Snapshot result
 */
export interface SnapshotResult {
  /** Snapshot metadata */
  metadata: SnapshotMetadata;
  /** Image data (base64) */
  imageData: string;
  /** Image dimensions */
  dimensions: { width: number; height: number };
  /** File path if saved */
  filePath?: string;
}

/**
 * Diff result between two snapshots
 */
export interface DiffResult {
  /** Whether snapshots match */
  match: boolean;
  /** Difference percentage (0-100) */
  diffPercentage: number;
  /** Number of changed pixels */
  changedPixels: number;
  /** Diff image (base64) */
  diffImage?: string;
  /** Baseline snapshot */
  baseline: SnapshotMetadata;
  /** Current snapshot */
  current: SnapshotMetadata;
  /** Bounding boxes of differences */
  diffRegions?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

/**
 * Visual test result
 */
export interface VisualTestResult {
  /** Test name */
  name: string;
  /** Whether test passed */
  passed: boolean;
  /** Individual snapshot results */
  snapshots: Array<{
    variant: string;
    viewport: string;
    diff?: DiffResult;
    error?: string;
  }>;
  /** Total duration (ms) */
  duration: number;
}

/**
 * Baseline storage configuration
 */
export interface BaselineConfig {
  /** Storage type */
  storage: 'local' | 's3' | 'chromatic';
  /** Base path for local storage */
  basePath?: string;
  /** S3 bucket for cloud storage */
  bucket?: string;
  /** S3 prefix */
  prefix?: string;
  /** Whether to auto-accept new baselines */
  autoAccept?: boolean;
}

/**
 * Chromatic integration options
 */
export interface ChromaticOptions {
  /** Chromatic project token */
  projectToken?: string;
  /** Build branch */
  branch?: string;
  /** CI build number */
  buildNumber?: string;
  /** Whether to exit on first failure */
  exitOnFirstFailure?: boolean;
  /** Skip unchanged stories */
  onlyChanged?: boolean;
  /** External build URL */
  buildUrl?: string;
}

/**
 * Story configuration for Storybook
 */
export interface StoryConfig {
  /** Story title */
  title: string;
  /** Component */
  component: unknown;
  /** Decorators */
  decorators?: Array<(story: () => unknown) => unknown>;
  /** Args (props) */
  args?: Record<string, unknown>;
  /** Arg types */
  argTypes?: Record<string, unknown>;
  /** Parameters */
  parameters?: {
    chromatic?: {
      /** Disable snapshot */
      disable?: boolean;
      /** Viewports */
      viewports?: number[];
      /** Delay */
      delay?: number;
      /** Pause animation frame */
      pauseAnimationAtEnd?: boolean;
      /** Diff threshold */
      diffThreshold?: number;
    };
    [key: string]: unknown;
  };
}
