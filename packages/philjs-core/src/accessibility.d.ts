/**
 * Automatic Accessibility - PhilJS 2026 Innovation
 * Automatically improves accessibility with minimal developer effort
 */
import { type Signal } from './signals.js';
export interface A11yConfig {
    /** Enable automatic ARIA label generation */
    autoAria?: boolean;
    /** Enable automatic heading hierarchy validation */
    headingHierarchy?: boolean;
    /** Enable automatic keyboard navigation */
    keyboardNav?: boolean;
    /** Enable color contrast validation (dev mode) */
    colorContrast?: boolean;
    /** Enable focus management */
    focusManagement?: boolean;
    /** Enable accessibility warnings in dev mode */
    devWarnings?: boolean;
    /** Minimum contrast ratio (WCAG AA = 4.5, AAA = 7) */
    minContrastRatio?: number;
}
export interface A11yWarning {
    type: 'aria' | 'heading' | 'contrast' | 'keyboard' | 'focus' | 'semantic';
    severity: 'error' | 'warning' | 'info';
    message: string;
    element?: string;
    suggestion?: string;
}
export interface A11yReport {
    warnings: A11yWarning[];
    score: number;
    passed: number;
    failed: number;
    timestamp: number;
}
export interface FocusManager {
    focusFirst: () => void;
    focusLast: () => void;
    focusNext: () => void;
    focusPrevious: () => void;
    trapFocus: (container: HTMLElement) => () => void;
    getCurrentFocus: () => Signal<HTMLElement | null>;
}
export declare function configureA11y(config: A11yConfig): void;
export declare function getA11yConfig(): Required<A11yConfig>;
/**
 * Automatically enhance element with ARIA attributes
 */
export declare function enhanceWithAria(element: string, props?: Record<string, any>): Record<string, any>;
export declare function validateHeadingHierarchy(element: string): void;
export declare function getHeadingWarnings(): A11yWarning[];
export declare function resetHeadingTracker(): void;
/**
 * Calculate contrast ratio between two colors
 */
export declare function getContrastRatio(color1: string, color2: string): number;
/**
 * Validate color contrast meets WCAG standards
 */
export declare function validateColorContrast(foreground: string, background: string, isLargeText?: boolean): {
    passes: boolean;
    ratio: number;
    warning?: A11yWarning;
};
export declare class KeyboardNavigator {
    private focusableSelectors;
    getFocusableElements(container?: HTMLElement): HTMLElement[];
    focusFirst(container?: HTMLElement): void;
    focusLast(container?: HTMLElement): void;
    focusNext(container?: HTMLElement): void;
    focusPrevious(container?: HTMLElement): void;
    /**
     * Trap focus within a container (useful for modals)
     */
    trapFocus(container: HTMLElement): () => void;
}
export declare function createFocusManager(): FocusManager;
export declare function auditAccessibility(): A11yReport;
/**
 * Live accessibility monitoring for development
 */
export declare function startA11yMonitoring(interval?: number): () => void;
/**
 * Add skip navigation link (WCAG requirement)
 */
export declare function addSkipLink(targetId?: string): string;
/**
 * Announce message to screen readers
 */
export declare function announceToScreenReader(message: string, priority?: 'polite' | 'assertive'): void;
/**
 * Create accessible loading state
 */
export declare function createLoadingState(message?: string): {
    start: () => void;
    stop: () => void;
};
//# sourceMappingURL=accessibility.d.ts.map