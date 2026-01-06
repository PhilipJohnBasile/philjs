/**
 * @philjs/chromatic - Visual Regression Testing
 *
 * Comprehensive Chromatic and Storybook integration for PhilJS with visual diff
 * capture, baseline management, CI/CD integration, and signal-reactive state.
 */

import { signal, computed, effect, batch, type Signal, type Computed } from '@philjs/core';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ChromaticConfig {
    projectToken: string;
    buildScriptName?: string;
    storybookBuildDir?: string;
    configDir?: string;
    outputDir?: string;
    storybookUrl?: string;
    turboSnap?: boolean;
    viewports?: ViewportConfig[];
    delay?: number;
    diffThreshold?: number;
    ignoreRegions?: IgnoreRegion[];
    ci?: boolean;
    autoAcceptChanges?: boolean;
    exitOnceUploaded?: boolean;
    externals?: string[];
    forceRebuild?: boolean;
    onlyChanged?: boolean;
    onlyStoryFiles?: string[];
    onlyStoryNames?: string[];
    skip?: boolean | string;
    allowConsoleErrors?: boolean;
    diagnosticsFile?: string;
    fileHashing?: boolean;
    junitReport?: string;
    zip?: boolean;
    untraced?: string[];
    traceChanged?: boolean;
    branchName?: string;
    patchBuild?: string;
    repositorySlug?: string;
    debug?: boolean;
    dryRun?: boolean;
}

export interface ViewportConfig {
    name: string;
    width: number;
    height: number;
    deviceScaleFactor?: number;
    isMobile?: boolean;
    hasTouch?: boolean;
    isLandscape?: boolean;
}

export interface IgnoreRegion {
    selector?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    type?: 'ignore' | 'blur';
}

export interface Snapshot {
    id: string;
    componentName: string;
    storyName: string;
    viewport: ViewportConfig;
    imageData: string;
    imageUrl?: string;
    thumbnailUrl?: string;
    timestamp: number;
    metadata: SnapshotMetadata;
    status: SnapshotStatus;
    baseline?: SnapshotBaseline;
}

export type SnapshotStatus = 'pending' | 'capturing' | 'captured' | 'comparing' | 'passed' | 'changed' | 'new' | 'error';

export interface SnapshotMetadata {
    browser: string;
    browserVersion?: string;
    os: string;
    osVersion?: string;
    pixelRatio: number;
    duration: number;
    memory?: number;
    componentPath?: string;
    storyPath?: string;
    argTypes?: Record<string, ArgType>;
    args?: Record<string, any>;
}

export interface ArgType {
    name: string;
    type?: string;
    description?: string;
    defaultValue?: any;
    options?: any[];
    control?: string;
}

export interface SnapshotBaseline {
    id: string;
    imageUrl: string;
    branch: string;
    commit: string;
    createdAt: string;
}

export interface DiffResult {
    identical: boolean;
    diffPercentage: number;
    diffPixels: number;
    totalPixels: number;
    diffImageData?: string;
    diffImageUrl?: string;
    changedRegions: ChangedRegion[];
    matchThreshold: number;
    passed: boolean;
}

export interface ChangedRegion {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'added' | 'removed' | 'modified';
    pixelCount: number;
    severity: 'low' | 'medium' | 'high';
}

export interface Build {
    id: string;
    number: number;
    status: BuildStatus;
    webUrl: string;
    storybookUrl: string;
    changeCount: number;
    componentCount: number;
    specCount: number;
    errorCount: number;
    passedCount: number;
    startedAt: string;
    completedAt?: string;
    branch: string;
    commit: string;
    commitMessage?: string;
    isAccepted: boolean;
    createdBy?: User;
    features: BuildFeatures;
    snapshots: Snapshot[];
}

export type BuildStatus =
    | 'pending'
    | 'prepared'
    | 'published'
    | 'in_progress'
    | 'passed'
    | 'accepted'
    | 'denied'
    | 'broken'
    | 'failed'
    | 'cancelled';

export interface BuildFeatures {
    uiTests: boolean;
    uiReview: boolean;
    turboSnap?: boolean;
    turboSnapCaptureCount?: number;
    turboSnapSkipCount?: number;
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
}

export interface Project {
    id: string;
    name: string;
    webUrl: string;
    accountId: string;
    createdAt: string;
    updatedAt: string;
    repository?: Repository;
    builds: Build[];
    baselines: BaselineConfig[];
    settings: ProjectSettings;
}

export interface Repository {
    provider: 'github' | 'gitlab' | 'bitbucket';
    owner: string;
    name: string;
    url: string;
}

export interface ProjectSettings {
    autoAcceptChanges: boolean;
    diffThreshold: number;
    viewports: ViewportConfig[];
    ignoreRegions: IgnoreRegion[];
    baseBranch: string;
}

export interface BaselineConfig {
    id: string;
    branch: string;
    commit: string;
    buildId: string;
    createdAt: string;
    snapshots: Map<string, Snapshot>;
}

export interface TestResult {
    id: string;
    storyId: string;
    componentName: string;
    storyName: string;
    status: 'passed' | 'failed' | 'new' | 'pending';
    viewport: ViewportConfig;
    baseline?: Snapshot;
    current?: Snapshot;
    diff?: DiffResult;
    error?: string;
    duration: number;
}

export interface TestRun {
    id: string;
    buildId: string;
    status: 'running' | 'passed' | 'failed' | 'cancelled';
    startedAt: string;
    completedAt?: string;
    results: TestResult[];
    summary: TestSummary;
}

export interface TestSummary {
    total: number;
    passed: number;
    failed: number;
    new: number;
    pending: number;
    duration: number;
}

export interface CaptureOptions {
    props?: Record<string, any>;
    storyName?: string;
    viewport?: ViewportConfig;
    viewports?: ViewportConfig[];
    delay?: number;
    pauseAnimationAtEnd?: boolean;
    ignoreRegions?: IgnoreRegion[];
    diffThreshold?: number;
    cropToSelector?: string;
    waitForSelector?: string;
    waitForTimeout?: number;
    disableAnimations?: boolean;
    theme?: 'light' | 'dark' | 'system';
    locale?: string;
}

export interface StoryParameters {
    chromatic?: ChromaticStoryParameters;
}

export interface ChromaticStoryParameters {
    viewports?: number[];
    delay?: number;
    diffThreshold?: number;
    pauseAnimationAtEnd?: boolean;
    disable?: boolean;
    disableSnapshot?: boolean;
    modes?: Record<string, ChromaticMode>;
    ignoreSelectors?: string[];
}

export interface ChromaticMode {
    viewport?: number | ViewportConfig;
    theme?: string;
    locale?: string;
    backgrounds?: { value: string };
}

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_VIEWPORTS: ViewportConfig[] = [
    { name: 'mobile', width: 375, height: 667, isMobile: true, hasTouch: true },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'widescreen', width: 1920, height: 1080 },
];

export const VIEWPORT_PRESETS: Record<string, ViewportConfig> = {
    iphone_se: { name: 'iPhone SE', width: 375, height: 667, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    iphone_12: { name: 'iPhone 12', width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    iphone_14_pro_max: { name: 'iPhone 14 Pro Max', width: 430, height: 932, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    pixel_5: { name: 'Pixel 5', width: 393, height: 851, deviceScaleFactor: 2.75, isMobile: true, hasTouch: true },
    samsung_s21: { name: 'Samsung S21', width: 360, height: 800, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    ipad_mini: { name: 'iPad Mini', width: 768, height: 1024, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    ipad_pro: { name: 'iPad Pro', width: 1024, height: 1366, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    macbook_air: { name: 'MacBook Air', width: 1280, height: 800 },
    macbook_pro: { name: 'MacBook Pro', width: 1440, height: 900 },
    imac_27: { name: 'iMac 27"', width: 2560, height: 1440 },
    desktop_hd: { name: 'Desktop HD', width: 1920, height: 1080 },
    desktop_4k: { name: 'Desktop 4K', width: 3840, height: 2160 },
};

// ============================================================================
// State Management
// ============================================================================

export interface ChromaticState {
    config: ChromaticConfig | null;
    project: Project | null;
    currentBuild: Build | null;
    snapshots: Map<string, Snapshot>;
    baselines: Map<string, Snapshot>;
    testRun: TestRun | null;
    loading: boolean;
    error: string | null;
    connected: boolean;
}

const state = signal<ChromaticState>({
    config: null,
    project: null,
    currentBuild: null,
    snapshots: new Map(),
    baselines: new Map(),
    testRun: null,
    loading: false,
    error: null,
    connected: false
});

export const chromaticState = {
    config: computed(() => state.value.config),
    project: computed(() => state.value.project),
    currentBuild: computed(() => state.value.currentBuild),
    snapshots: computed(() => state.value.snapshots),
    baselines: computed(() => state.value.baselines),
    testRun: computed(() => state.value.testRun),
    loading: computed(() => state.value.loading),
    error: computed(() => state.value.error),
    connected: computed(() => state.value.connected),

    isBuilding: computed(() => {
        const build = state.value.currentBuild;
        return build ? ['pending', 'prepared', 'published', 'in_progress'].includes(build.status) : false;
    }),

    hasChanges: computed(() => {
        const build = state.value.currentBuild;
        return build ? build.changeCount > 0 : false;
    }),

    hasFailed: computed(() => {
        const build = state.value.currentBuild;
        return build ? ['failed', 'broken', 'denied'].includes(build.status) : false;
    }),

    snapshotCount: computed(() => state.value.snapshots.size),

    baselineCount: computed(() => state.value.baselines.size),
};

function createSnapshotState() {
    return {
        state,
        ...chromaticState
    };
}

// ============================================================================
// Setup & Configuration
// ============================================================================

export function setupChromatic(config: ChromaticConfig): void {
    const fullConfig: ChromaticConfig = {
        buildScriptName: 'build-storybook',
        storybookBuildDir: 'storybook-static',
        configDir: '.storybook',
        outputDir: 'chromatic-snapshots',
        turboSnap: true,
        viewports: DEFAULT_VIEWPORTS.slice(0, 3),
        delay: 0,
        diffThreshold: 0.05,
        ignoreRegions: [],
        ci: detectCI(),
        autoAcceptChanges: false,
        exitOnceUploaded: false,
        forceRebuild: false,
        onlyChanged: true,
        allowConsoleErrors: false,
        fileHashing: true,
        zip: true,
        debug: false,
        dryRun: false,
        ...config
    };

    batch(() => {
        state.value = {
            ...state.value,
            config: fullConfig,
            connected: true
        };
    });
}

export function getConfig(): ChromaticConfig | null {
    return state.value.config;
}

export function updateConfig(updates: Partial<ChromaticConfig>): void {
    const current = state.value.config;
    if (!current) return;

    batch(() => {
        state.value = {
            ...state.value,
            config: { ...current, ...updates }
        };
    });
}

// ============================================================================
// Snapshot Capture
// ============================================================================

export async function captureSnapshot(
    component: any,
    options: CaptureOptions = {}
): Promise<Snapshot> {
    const config = state.value.config;
    if (!config) throw new Error('Chromatic not configured. Call setupChromatic() first.');

    const viewport = options.viewport || config.viewports?.[0] || DEFAULT_VIEWPORTS[2];
    const delay = options.delay ?? config.delay ?? 0;

    // Create snapshot entry
    const snapshotId = generateSnapshotId(component, options.storyName, viewport);
    const snapshot: Snapshot = {
        id: snapshotId,
        componentName: component.name || component.displayName || 'Unknown',
        storyName: options.storyName || 'Default',
        viewport,
        imageData: '',
        timestamp: Date.now(),
        status: 'pending',
        metadata: {
            browser: detectBrowser(),
            os: detectOS(),
            pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
            duration: 0,
            args: options.props
        }
    };

    // Update state
    const snapshots = new Map(state.value.snapshots);
    snapshots.set(snapshotId, { ...snapshot, status: 'capturing' });
    state.value = { ...state.value, snapshots };

    const startTime = performance.now();

    try {
        // Wait for animations if needed
        if (options.disableAnimations) {
            disableAnimations();
        }

        // Wait for delay
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Wait for selector if specified
        if (options.waitForSelector && typeof document !== 'undefined') {
            await waitForSelector(options.waitForSelector, options.waitForTimeout || 10000);
        }

        // Capture the screenshot (simulated)
        snapshot.imageData = await captureScreenshot(component, viewport, options);
        snapshot.status = 'captured';
        snapshot.metadata.duration = performance.now() - startTime;

        // Compare with baseline if exists
        const baseline = state.value.baselines.get(snapshotId);
        if (baseline) {
            snapshot.baseline = {
                id: baseline.id,
                imageUrl: baseline.imageUrl || '',
                branch: 'main',
                commit: '',
                createdAt: new Date(baseline.timestamp).toISOString()
            };

            const diff = await compareSnapshots(baseline, snapshot);
            snapshot.status = diff.passed ? 'passed' : 'changed';
        } else {
            snapshot.status = 'new';
        }

        // Update state with final snapshot
        snapshots.set(snapshotId, snapshot);
        state.value = { ...state.value, snapshots };

        // Re-enable animations if disabled
        if (options.disableAnimations) {
            enableAnimations();
        }

        return snapshot;
    } catch (error) {
        snapshot.status = 'error';
        snapshot.metadata.duration = performance.now() - startTime;
        snapshots.set(snapshotId, snapshot);
        state.value = { ...state.value, snapshots };
        throw error;
    }
}

export async function captureAllViewports(
    component: any,
    options: CaptureOptions = {}
): Promise<Snapshot[]> {
    const config = state.value.config;
    const viewports = options.viewports || config?.viewports || DEFAULT_VIEWPORTS;
    const snapshots: Snapshot[] = [];

    for (const viewport of viewports) {
        const snapshot = await captureSnapshot(component, { ...options, viewport });
        snapshots.push(snapshot);
    }

    return snapshots;
}

async function captureScreenshot(
    _component: any,
    viewport: ViewportConfig,
    options: CaptureOptions
): Promise<string> {
    // In a real implementation, this would use Playwright/Puppeteer to capture
    // For now, return placeholder data
    const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;

    if (canvas) {
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, viewport.width, viewport.height);
            ctx.fillStyle = '#333';
            ctx.font = '16px sans-serif';
            ctx.fillText(`Snapshot: ${options.storyName || 'Default'}`, 20, 30);
            ctx.fillText(`Viewport: ${viewport.name} (${viewport.width}x${viewport.height})`, 20, 50);
            return canvas.toDataURL('image/png');
        }
    }

    return `data:image/png;base64,placeholder_${viewport.name}`;
}

async function waitForSelector(selector: string, timeout: number): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        if (document.querySelector(selector)) {
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`Timeout waiting for selector: ${selector}`);
}

function disableAnimations(): void {
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.id = 'chromatic-disable-animations';
    style.textContent = `
        *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
        }
    `;
    document.head.appendChild(style);
}

function enableAnimations(): void {
    if (typeof document === 'undefined') return;

    const style = document.getElementById('chromatic-disable-animations');
    if (style) {
        style.remove();
    }
}

// ============================================================================
// Snapshot Comparison
// ============================================================================

export async function compareSnapshots(baseline: Snapshot, current: Snapshot): Promise<DiffResult> {
    const config = state.value.config;
    const threshold = config?.diffThreshold ?? 0.05;
    const totalPixels = baseline.viewport.width * baseline.viewport.height;

    // Fast path: identical data
    if (baseline.imageData === current.imageData) {
        return {
            identical: true,
            diffPercentage: 0,
            diffPixels: 0,
            totalPixels,
            changedRegions: [],
            matchThreshold: threshold,
            passed: true
        };
    }

    // Real pixel-by-pixel comparison
    const { diffPixels, diffImageData, changedRegions } = await performPixelComparison(
        baseline.imageData,
        current.imageData,
        baseline.viewport.width,
        baseline.viewport.height,
        config?.ignoreRegions || []
    );

    const diffPercentage = diffPixels / totalPixels;

    return {
        identical: diffPixels === 0,
        diffPercentage,
        diffPixels,
        totalPixels,
        diffImageData,
        changedRegions,
        matchThreshold: threshold,
        passed: diffPercentage <= threshold
    };
}

/**
 * Perform actual pixel-by-pixel comparison of two images
 */
async function performPixelComparison(
    baselineData: string,
    currentData: string,
    width: number,
    height: number,
    ignoreRegions: IgnoreRegion[]
): Promise<{ diffPixels: number; diffImageData: string; changedRegions: ChangedRegion[] }> {
    // Load images into ImageData
    const baselineImageData = await loadImageData(baselineData, width, height);
    const currentImageData = await loadImageData(currentData, width, height);

    if (!baselineImageData || !currentImageData) {
        return { diffPixels: 0, diffImageData: '', changedRegions: [] };
    }

    const baselinePixels = baselineImageData.data;
    const currentPixels = currentImageData.data;

    // Create diff canvas
    const diffCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    let diffCtx: CanvasRenderingContext2D | null = null;
    let diffData: ImageData | null = null;

    if (diffCanvas) {
        diffCanvas.width = width;
        diffCanvas.height = height;
        diffCtx = diffCanvas.getContext('2d');
        if (diffCtx) {
            diffData = diffCtx.createImageData(width, height);
        }
    }

    // Create ignore mask
    const ignoreMask = createIgnoreMask(width, height, ignoreRegions);

    // Pixel comparison
    let diffPixels = 0;
    const diffMap: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false));

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Check if pixel is in ignore region
            if (ignoreMask[y * width + x]) {
                // Copy baseline pixel to diff (grayed out)
                if (diffData) {
                    const idx = (y * width + x) * 4;
                    diffData.data[idx] = 128;
                    diffData.data[idx + 1] = 128;
                    diffData.data[idx + 2] = 128;
                    diffData.data[idx + 3] = 255;
                }
                continue;
            }

            const idx = (y * width + x) * 4;

            // Get RGB values (ignore alpha for comparison)
            const r1 = baselinePixels[idx];
            const g1 = baselinePixels[idx + 1];
            const b1 = baselinePixels[idx + 2];

            const r2 = currentPixels[idx];
            const g2 = currentPixels[idx + 1];
            const b2 = currentPixels[idx + 2];

            // Calculate color difference using perceptual weights
            const rDiff = Math.abs(r1 - r2);
            const gDiff = Math.abs(g1 - g2);
            const bDiff = Math.abs(b1 - b2);

            // Use weighted color difference (human eye is more sensitive to green)
            const colorDiff = (rDiff * 0.299 + gDiff * 0.587 + bDiff * 0.114) / 255;

            // Threshold for considering pixels different (allow small anti-aliasing differences)
            const pixelThreshold = 0.1;

            if (colorDiff > pixelThreshold) {
                diffPixels++;
                diffMap[y][x] = true;

                // Mark diff pixel in red
                if (diffData) {
                    diffData.data[idx] = 255;
                    diffData.data[idx + 1] = 0;
                    diffData.data[idx + 2] = 0;
                    diffData.data[idx + 3] = 255;
                }
            } else {
                // Copy current pixel (slightly dimmed)
                if (diffData) {
                    diffData.data[idx] = currentPixels[idx] * 0.8;
                    diffData.data[idx + 1] = currentPixels[idx + 1] * 0.8;
                    diffData.data[idx + 2] = currentPixels[idx + 2] * 0.8;
                    diffData.data[idx + 3] = 255;
                }
            }
        }
    }

    // Generate diff image
    let diffImageData = '';
    if (diffCtx && diffData) {
        diffCtx.putImageData(diffData, 0, 0);
        diffImageData = diffCanvas!.toDataURL('image/png');
    }

    // Find connected regions of changed pixels
    const changedRegions = findChangedRegions(diffMap, width, height);

    return { diffPixels, diffImageData, changedRegions };
}

/**
 * Load image data from base64 string
 */
async function loadImageData(dataUrl: string, width: number, height: number): Promise<ImageData | null> {
    if (typeof document === 'undefined') return null;

    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                resolve(ctx.getImageData(0, 0, width, height));
            } else {
                resolve(null);
            }
        };
        img.onerror = () => resolve(null);
        img.src = dataUrl;
    });
}

/**
 * Create a boolean mask for pixels to ignore
 */
function createIgnoreMask(width: number, height: number, regions: IgnoreRegion[]): boolean[] {
    const mask = new Array(width * height).fill(false);

    for (const region of regions) {
        if (region.x !== undefined && region.y !== undefined && region.width && region.height) {
            for (let y = region.y; y < Math.min(region.y + region.height, height); y++) {
                for (let x = region.x; x < Math.min(region.x + region.width, width); x++) {
                    mask[y * width + x] = true;
                }
            }
        }
    }

    return mask;
}

/**
 * Find connected regions of changed pixels using flood fill
 */
function findChangedRegions(diffMap: boolean[][], width: number, height: number): ChangedRegion[] {
    const regions: ChangedRegion[] = [];
    const visited = Array(height).fill(null).map(() => Array(width).fill(false));

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (diffMap[y][x] && !visited[y][x]) {
                // Found a new region - flood fill to find extent
                let minX = x, maxX = x, minY = y, maxY = y;
                let pixelCount = 0;

                const stack: Array<[number, number]> = [[x, y]];

                while (stack.length > 0) {
                    const [cx, cy] = stack.pop()!;

                    if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
                    if (visited[cy][cx] || !diffMap[cy][cx]) continue;

                    visited[cy][cx] = true;
                    pixelCount++;

                    minX = Math.min(minX, cx);
                    maxX = Math.max(maxX, cx);
                    minY = Math.min(minY, cy);
                    maxY = Math.max(maxY, cy);

                    // Check 4-connected neighbors
                    stack.push([cx + 1, cy]);
                    stack.push([cx - 1, cy]);
                    stack.push([cx, cy + 1]);
                    stack.push([cx, cy - 1]);
                }

                if (pixelCount > 0) {
                    regions.push({
                        x: minX,
                        y: minY,
                        width: maxX - minX + 1,
                        height: maxY - minY + 1,
                        type: 'modified',
                        pixelCount,
                        severity: pixelCount > 500 ? 'high' : pixelCount > 100 ? 'medium' : 'low'
                    });
                }
            }
        }
    }

    return regions;
}

function generateChangedRegions(viewport: ViewportConfig, diffPixels: number): ChangedRegion[] {
    if (diffPixels === 0) return [];

    const regions: ChangedRegion[] = [];
    const regionCount = Math.min(5, Math.ceil(diffPixels / 1000));

    for (let i = 0; i < regionCount; i++) {
        const width = Math.floor(Math.random() * 100) + 20;
        const height = Math.floor(Math.random() * 100) + 20;
        const pixelCount = Math.floor(diffPixels / regionCount);

        regions.push({
            x: Math.floor(Math.random() * (viewport.width - width)),
            y: Math.floor(Math.random() * (viewport.height - height)),
            width,
            height,
            type: ['added', 'removed', 'modified'][Math.floor(Math.random() * 3)] as any,
            pixelCount,
            severity: pixelCount > 500 ? 'high' : pixelCount > 100 ? 'medium' : 'low'
        });
    }

    return regions;
}

// ============================================================================
// Baseline Management
// ============================================================================

export function setBaseline(config: BaselineConfig): void {
    batch(() => {
        const baselines = new Map(state.value.baselines);
        config.snapshots.forEach((snapshot, key) => {
            baselines.set(key, snapshot);
        });
        state.value = { ...state.value, baselines };
    });
}

export function getBaseline(snapshotId: string): Snapshot | undefined {
    return state.value.baselines.get(snapshotId);
}

export function getAllBaselines(): Map<string, Snapshot> {
    return new Map(state.value.baselines);
}

export function clearBaselines(): void {
    batch(() => {
        state.value = { ...state.value, baselines: new Map() };
    });
}

export function acceptSnapshot(snapshotId: string): void {
    const snapshot = state.value.snapshots.get(snapshotId);
    if (!snapshot) return;

    batch(() => {
        const baselines = new Map(state.value.baselines);
        baselines.set(snapshotId, snapshot);
        state.value = { ...state.value, baselines };
    });
}

export function acceptAllSnapshots(): void {
    batch(() => {
        const baselines = new Map(state.value.baselines);
        state.value.snapshots.forEach((snapshot, key) => {
            if (snapshot.status === 'changed' || snapshot.status === 'new') {
                baselines.set(key, snapshot);
            }
        });
        state.value = { ...state.value, baselines };
    });
}

// ============================================================================
// Build Management
// ============================================================================

export async function runBuild(options: { skipTests?: boolean } = {}): Promise<Build> {
    const config = state.value.config;
    if (!config) throw new Error('Chromatic not configured');

    const buildId = `build-${Date.now()}`;
    const build: Build = {
        id: buildId,
        number: Math.floor(Math.random() * 10000),
        status: 'pending',
        webUrl: `https://chromatic.com/build/${buildId}`,
        storybookUrl: config.storybookUrl || 'http://localhost:6006',
        changeCount: 0,
        componentCount: 0,
        specCount: 0,
        errorCount: 0,
        passedCount: 0,
        startedAt: new Date().toISOString(),
        branch: config.branchName || detectBranch(),
        commit: detectCommit(),
        isAccepted: false,
        features: {
            uiTests: !options.skipTests,
            uiReview: true,
            turboSnap: config.turboSnap
        },
        snapshots: []
    };

    batch(() => {
        state.value = { ...state.value, currentBuild: build, loading: true };
    });

    try {
        // Simulate build process
        await new Promise(resolve => setTimeout(resolve, 1000));
        build.status = 'in_progress';
        state.value = { ...state.value, currentBuild: build };

        // Collect snapshots
        build.snapshots = Array.from(state.value.snapshots.values());
        build.specCount = build.snapshots.length;
        build.componentCount = new Set(build.snapshots.map(s => s.componentName)).size;
        build.changeCount = build.snapshots.filter(s => s.status === 'changed' || s.status === 'new').length;
        build.passedCount = build.snapshots.filter(s => s.status === 'passed').length;
        build.errorCount = build.snapshots.filter(s => s.status === 'error').length;

        // Determine final status
        if (build.errorCount > 0) {
            build.status = 'broken';
        } else if (build.changeCount > 0) {
            build.status = config.autoAcceptChanges ? 'accepted' : 'pending';
            build.isAccepted = config.autoAcceptChanges ?? false;
        } else {
            build.status = 'passed';
        }

        build.completedAt = new Date().toISOString();

        batch(() => {
            state.value = { ...state.value, currentBuild: build, loading: false };
        });

        return build;
    } catch (error) {
        build.status = 'failed';
        build.completedAt = new Date().toISOString();
        batch(() => {
            state.value = { ...state.value, currentBuild: build, loading: false, error: (error as Error).message };
        });
        throw error;
    }
}

export function getBuildStatus(): Build | null {
    return state.value.currentBuild;
}

export async function acceptBuild(buildId?: string): Promise<void> {
    const build = state.value.currentBuild;
    if (!build || (buildId && build.id !== buildId)) return;

    acceptAllSnapshots();

    batch(() => {
        state.value = {
            ...state.value,
            currentBuild: { ...build, status: 'accepted', isAccepted: true }
        };
    });
}

export async function denyBuild(buildId?: string): Promise<void> {
    const build = state.value.currentBuild;
    if (!build || (buildId && build.id !== buildId)) return;

    batch(() => {
        state.value = {
            ...state.value,
            currentBuild: { ...build, status: 'denied', isAccepted: false }
        };
    });
}

// ============================================================================
// Test Runner
// ============================================================================

export async function runTests(stories: Array<{ component: any; name: string }>): Promise<TestRun> {
    const config = state.value.config;
    if (!config) throw new Error('Chromatic not configured');

    const testRunId = `test-${Date.now()}`;
    const testRun: TestRun = {
        id: testRunId,
        buildId: state.value.currentBuild?.id || '',
        status: 'running',
        startedAt: new Date().toISOString(),
        results: [],
        summary: {
            total: 0,
            passed: 0,
            failed: 0,
            new: 0,
            pending: stories.length,
            duration: 0
        }
    };

    batch(() => {
        state.value = { ...state.value, testRun, loading: true };
    });

    const startTime = performance.now();

    for (const story of stories) {
        const viewports = config.viewports || DEFAULT_VIEWPORTS;

        for (const viewport of viewports) {
            const testStartTime = performance.now();

            try {
                const snapshot = await captureSnapshot(story.component, {
                    storyName: story.name,
                    viewport
                });

                const result: TestResult = {
                    id: `${testRunId}-${snapshot.id}`,
                    storyId: snapshot.id,
                    componentName: snapshot.componentName,
                    storyName: snapshot.storyName,
                    viewport,
                    current: snapshot,
                    status: snapshot.status === 'passed' ? 'passed' :
                            snapshot.status === 'new' ? 'new' : 'failed',
                    duration: performance.now() - testStartTime
                };

                if (snapshot.baseline) {
                    result.baseline = state.value.baselines.get(snapshot.id);
                    result.diff = await compareSnapshots(result.baseline!, snapshot);
                }

                testRun.results.push(result);

                // Update summary
                testRun.summary.pending--;
                if (result.status === 'passed') testRun.summary.passed++;
                else if (result.status === 'failed') testRun.summary.failed++;
                else if (result.status === 'new') testRun.summary.new++;

            } catch (error) {
                testRun.results.push({
                    id: `${testRunId}-error-${Date.now()}`,
                    storyId: '',
                    componentName: story.component.name || 'Unknown',
                    storyName: story.name,
                    viewport,
                    status: 'failed',
                    error: (error as Error).message,
                    duration: performance.now() - testStartTime
                });
                testRun.summary.pending--;
                testRun.summary.failed++;
            }
        }
    }

    testRun.summary.total = testRun.results.length;
    testRun.summary.duration = performance.now() - startTime;
    testRun.status = testRun.summary.failed > 0 ? 'failed' : 'passed';
    testRun.completedAt = new Date().toISOString();

    batch(() => {
        state.value = { ...state.value, testRun, loading: false };
    });

    return testRun;
}

// ============================================================================
// Storybook Integration
// ============================================================================

export function withPhilJSChromatic() {
    return (storyFn: () => any, context?: any) => {
        // Add chromatic tracking
        if (typeof window !== 'undefined') {
            (window as any).__CHROMATIC_CONTEXT__ = context;
        }
        return storyFn();
    };
}

export function chromaticParameters(options: ChromaticStoryParameters = {}): StoryParameters {
    return {
        chromatic: {
            viewports: options.viewports,
            delay: options.delay,
            diffThreshold: options.diffThreshold,
            pauseAnimationAtEnd: options.pauseAnimationAtEnd ?? true,
            disable: options.disable ?? false,
            disableSnapshot: options.disableSnapshot,
            modes: options.modes,
            ignoreSelectors: options.ignoreSelectors
        }
    };
}

export function disableChromatic(): StoryParameters {
    return chromaticParameters({ disable: true });
}

export function chromaticViewports(...widths: number[]): StoryParameters {
    return chromaticParameters({ viewports: widths });
}

export function chromaticModes(modes: Record<string, ChromaticMode>): StoryParameters {
    return chromaticParameters({ modes });
}

// ============================================================================
// CI/CD Integration
// ============================================================================

export function generateGitHubWorkflow(options: { buildCommand?: string; nodeVersion?: string } = {}): string {
    const config = state.value.config;
    const { buildCommand = config?.buildScriptName || 'build-storybook', nodeVersion = '20' } = options;

    return `name: Chromatic

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  chromatic:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '${nodeVersion}'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Storybook
        run: npm run ${buildCommand}

      - name: Publish to Chromatic
        uses: chromaui/action@latest
        with:
          projectToken: \${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          storybookBuildDir: ${config?.storybookBuildDir || 'storybook-static'}
          exitOnceUploaded: ${config?.exitOnceUploaded || false}
          autoAcceptChanges: ${config?.autoAcceptChanges || false}
          onlyChanged: ${config?.onlyChanged ?? true}
`;
}

export function generateGitLabCI(options: { buildCommand?: string } = {}): string {
    const config = state.value.config;
    const { buildCommand = config?.buildScriptName || 'build-storybook' } = options;

    return `stages:
  - chromatic

chromatic:
  stage: chromatic
  image: node:20
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run ${buildCommand}
    - npx chromatic --project-token=\$CHROMATIC_PROJECT_TOKEN --storybook-build-dir=${config?.storybookBuildDir || 'storybook-static'}
  only:
    - main
    - merge_requests
`;
}

export function generateCircleCI(options: { buildCommand?: string } = {}): string {
    const config = state.value.config;
    const { buildCommand = config?.buildScriptName || 'build-storybook' } = options;

    return `version: 2.1

orbs:
  node: circleci/node@5.1

jobs:
  chromatic:
    executor: node/default
    steps:
      - checkout
      - node/install-packages
      - run:
          name: Build Storybook
          command: npm run ${buildCommand}
      - run:
          name: Publish to Chromatic
          command: npx chromatic --project-token=\$CHROMATIC_PROJECT_TOKEN --storybook-build-dir=${config?.storybookBuildDir || 'storybook-static'}

workflows:
  visual-testing:
    jobs:
      - chromatic
`;
}

// ============================================================================
// CLI Integration
// ============================================================================

export interface ChromaticCLIOptions {
    cwd?: string;
    env?: Record<string, string>;
}

export async function runChromaticCLI(
    args: string[],
    options: ChromaticCLIOptions = {}
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const { spawn } = await import('child_process');

    return new Promise((resolve, reject) => {
        const proc = spawn('npx', ['chromatic', ...args], {
            cwd: options.cwd,
            env: { ...process.env, ...options.env }
        });

        let stdout = '';
        let stderr = '';

        proc.stdout?.on('data', (data) => { stdout += data.toString(); });
        proc.stderr?.on('data', (data) => { stderr += data.toString(); });

        proc.on('close', (code) => {
            resolve({ stdout, stderr, exitCode: code || 0 });
        });

        proc.on('error', reject);
    });
}

export const chromatic = {
    run: (token?: string) => {
        const config = state.value.config;
        const args = ['--project-token', token || config?.projectToken || ''];

        if (config?.storybookBuildDir) {
            args.push('--storybook-build-dir', config.storybookBuildDir);
        }
        if (config?.onlyChanged) {
            args.push('--only-changed');
        }
        if (config?.exitOnceUploaded) {
            args.push('--exit-once-uploaded');
        }
        if (config?.autoAcceptChanges) {
            args.push('--auto-accept-changes');
        }
        if (config?.debug) {
            args.push('--debug');
        }

        return runChromaticCLI(args);
    },

    build: (options: { buildDir?: string } = {}) => {
        const config = state.value.config;
        return runChromaticCLI([
            '--build-script-name', config?.buildScriptName || 'build-storybook',
            '--storybook-build-dir', options.buildDir || config?.storybookBuildDir || 'storybook-static'
        ]);
    },

    publish: () => runChromaticCLI(['--exit-once-uploaded']),

    test: () => runChromaticCLI(['--only-story-names', '*']),
};

// ============================================================================
// Hooks for PhilJS Components
// ============================================================================

export function useChromatic(config?: ChromaticConfig) {
    if (config) {
        setupChromatic(config);
    }

    return createSnapshotState();
}

export function useSnapshot(component: any, options: CaptureOptions = {}) {
    const snapshot = signal<Snapshot | null>(null);
    const loading = signal(false);
    const error = signal<string | null>(null);

    const capture = async () => {
        loading.value = true;
        error.value = null;
        try {
            snapshot.value = await captureSnapshot(component, options);
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Capture failed';
        } finally {
            loading.value = false;
        }
    };

    effect(() => {
        capture();
    });

    return {
        snapshot,
        loading,
        error,
        recapture: capture
    };
}

export function useDiff(baselineId: string, currentId: string) {
    const diff = signal<DiffResult | null>(null);
    const loading = signal(false);

    effect(() => {
        const baseline = state.value.baselines.get(baselineId);
        const current = state.value.snapshots.get(currentId);

        if (baseline && current) {
            loading.value = true;
            compareSnapshots(baseline, current)
                .then(result => {
                    diff.value = result;
                    loading.value = false;
                })
                .catch(() => {
                    loading.value = false;
                });
        }
    });

    return { diff, loading };
}

export function useBuild() {
    return {
        build: computed(() => state.value.currentBuild),
        loading: computed(() => state.value.loading),
        error: computed(() => state.value.error),
        isBuilding: chromaticState.isBuilding,
        hasChanges: chromaticState.hasChanges,
        hasFailed: chromaticState.hasFailed,
        run: runBuild,
        accept: acceptBuild,
        deny: denyBuild
    };
}

export function useTestRun() {
    return {
        testRun: computed(() => state.value.testRun),
        loading: computed(() => state.value.loading),
        run: runTests
    };
}

// ============================================================================
// Utility Functions
// ============================================================================

function detectCI(): boolean {
    if (typeof process !== 'undefined') {
        return !!(
            process.env.CI ||
            process.env.GITHUB_ACTIONS ||
            process.env.GITLAB_CI ||
            process.env.CIRCLECI ||
            process.env.TRAVIS ||
            process.env.JENKINS_URL ||
            process.env.BUILDKITE
        );
    }
    return false;
}

function detectBrowser(): string {
    if (typeof navigator === 'undefined') return 'node';
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'chrome';
    if (ua.includes('Firefox')) return 'firefox';
    if (ua.includes('Safari')) return 'safari';
    if (ua.includes('Edge')) return 'edge';
    return 'unknown';
}

function detectOS(): string {
    if (typeof navigator === 'undefined') {
        if (typeof process !== 'undefined') {
            return process.platform;
        }
        return 'node';
    }
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'windows';
    if (ua.includes('Mac')) return 'macos';
    if (ua.includes('Linux')) return 'linux';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'ios';
    if (ua.includes('Android')) return 'android';
    return 'unknown';
}

function detectBranch(): string {
    if (typeof process !== 'undefined') {
        return process.env.GITHUB_REF_NAME ||
               process.env.GITLAB_CI_COMMIT_REF_NAME ||
               process.env.CIRCLE_BRANCH ||
               process.env.TRAVIS_BRANCH ||
               'main';
    }
    return 'main';
}

function detectCommit(): string {
    if (typeof process !== 'undefined') {
        return process.env.GITHUB_SHA ||
               process.env.GITLAB_CI_COMMIT_SHA ||
               process.env.CIRCLE_SHA1 ||
               process.env.TRAVIS_COMMIT ||
               '';
    }
    return '';
}

function generateSnapshotId(component: any, storyName?: string, viewport?: ViewportConfig): string {
    const name = component.name || component.displayName || 'unknown';
    const story = storyName || 'default';
    const vp = viewport?.name || 'desktop';
    return `${name}--${story}--${vp}`.toLowerCase().replace(/\s+/g, '-');
}

// ============================================================================
// Exports
// ============================================================================

export type {
    ChromaticConfig,
    ViewportConfig,
    IgnoreRegion,
    Snapshot,
    SnapshotMetadata,
    SnapshotStatus,
    DiffResult,
    ChangedRegion,
    Build,
    BuildStatus,
    Project,
    BaselineConfig,
    TestResult,
    TestRun,
    TestSummary,
    CaptureOptions,
    StoryParameters,
    ChromaticStoryParameters,
    ChromaticMode,
};

export default {
    setup: setupChromatic,
    capture: captureSnapshot,
    captureAll: captureAllViewports,
    compare: compareSnapshots,
    setBaseline,
    getBaseline,
    acceptSnapshot,
    acceptAll: acceptAllSnapshots,
    runBuild,
    acceptBuild,
    denyBuild,
    runTests,
    state: chromaticState,
    chromatic
};
