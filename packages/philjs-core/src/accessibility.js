/**
 * Automatic Accessibility - PhilJS 2026 Innovation
 * Automatically improves accessibility with minimal developer effort
 */
import { signal } from './signals';
// ============================================================================
// Configuration
// ============================================================================
let globalConfig = {
    autoAria: true,
    headingHierarchy: true,
    keyboardNav: true,
    colorContrast: true,
    focusManagement: true,
    devWarnings: typeof process !== 'undefined' && process.env.NODE_ENV !== 'production',
    minContrastRatio: 4.5, // WCAG AA
};
export function configureA11y(config) {
    globalConfig = { ...globalConfig, ...config };
}
export function getA11yConfig() {
    return { ...globalConfig };
}
// ============================================================================
// Automatic ARIA Labels
// ============================================================================
const ariaPatterns = {
    button: (text) => ({
        role: 'button',
        'aria-label': text || 'Button',
    }),
    link: (href) => ({
        role: 'link',
        'aria-label': href ? `Link to ${href}` : 'Link',
    }),
    input: (type, label) => ({
        'aria-label': label || `Input field ${type || 'text'}`,
        'aria-required': 'false',
    }),
    image: (alt) => ({
        role: 'img',
        'aria-label': alt || 'Image',
    }),
    heading: (level, text) => ({
        role: 'heading',
        'aria-level': String(level),
        'aria-label': text || `Heading level ${level}`,
    }),
    list: () => ({
        role: 'list',
    }),
    listitem: () => ({
        role: 'listitem',
    }),
    navigation: () => ({
        role: 'navigation',
        'aria-label': 'Navigation',
    }),
    search: () => ({
        role: 'search',
        'aria-label': 'Search',
    }),
    dialog: (label) => ({
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': label || 'Dialog',
    }),
    alert: (message) => ({
        role: 'alert',
        'aria-live': 'assertive',
        'aria-atomic': 'true',
        'aria-label': message || 'Alert',
    }),
};
/**
 * Automatically enhance element with ARIA attributes
 */
export function enhanceWithAria(element, props = {}) {
    if (!globalConfig.autoAria)
        return props;
    const enhanced = { ...props };
    // Skip if already has ARIA role or label
    if (props.role || props['aria-label'] || props['aria-labelledby']) {
        return enhanced;
    }
    // Determine element type
    const type = element.toLowerCase();
    // Add appropriate ARIA attributes
    switch (type) {
        case 'button':
            Object.assign(enhanced, ariaPatterns.button(props.children?.toString()));
            break;
        case 'a':
            Object.assign(enhanced, ariaPatterns.link(props.href));
            break;
        case 'input':
            Object.assign(enhanced, ariaPatterns.input(props.type, props.placeholder));
            break;
        case 'img':
            if (!props.alt) {
                Object.assign(enhanced, ariaPatterns.image());
            }
            break;
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
            const level = parseInt(type[1]);
            Object.assign(enhanced, ariaPatterns.heading(level, props.children?.toString()));
            break;
        case 'ul':
        case 'ol':
            Object.assign(enhanced, ariaPatterns.list());
            break;
        case 'li':
            Object.assign(enhanced, ariaPatterns.listitem());
            break;
        case 'nav':
            Object.assign(enhanced, ariaPatterns.navigation());
            break;
    }
    return enhanced;
}
// ============================================================================
// Heading Hierarchy Validation
// ============================================================================
class HeadingTracker {
    headings = [];
    warnings = [];
    addHeading(level) {
        if (!globalConfig.headingHierarchy)
            return;
        if (this.headings.length > 0) {
            const lastLevel = this.headings[this.headings.length - 1];
            // Check if skipping levels
            if (level > lastLevel + 1) {
                this.warnings.push({
                    type: 'heading',
                    severity: 'warning',
                    message: `Heading skips from h${lastLevel} to h${level}`,
                    element: `h${level}`,
                    suggestion: `Use h${lastLevel + 1} instead of h${level} to maintain hierarchy`,
                });
            }
        }
        else if (level !== 1) {
            // First heading should be h1
            this.warnings.push({
                type: 'heading',
                severity: 'warning',
                message: `First heading is h${level}, should be h1`,
                element: `h${level}`,
                suggestion: 'Start document with h1 for proper hierarchy',
            });
        }
        this.headings.push(level);
    }
    getWarnings() {
        return [...this.warnings];
    }
    reset() {
        this.headings = [];
        this.warnings = [];
    }
}
const headingTracker = new HeadingTracker();
export function validateHeadingHierarchy(element) {
    if (element.match(/^h[1-6]$/i)) {
        const level = parseInt(element[1]);
        headingTracker.addHeading(level);
    }
}
export function getHeadingWarnings() {
    return headingTracker.getWarnings();
}
export function resetHeadingTracker() {
    headingTracker.reset();
}
// ============================================================================
// Color Contrast Validation
// ============================================================================
/**
 * Calculate relative luminance of a color
 */
function getLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}
/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1, color2) {
    const parseColor = (color) => {
        // Handle hex colors
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return [r, g, b];
        }
        // Handle rgb/rgba
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
            return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
        }
        return null;
    };
    const c1 = parseColor(color1);
    const c2 = parseColor(color2);
    if (!c1 || !c2)
        return 21; // Assume perfect if can't parse
    const l1 = getLuminance(...c1);
    const l2 = getLuminance(...c2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}
/**
 * Validate color contrast meets WCAG standards
 */
export function validateColorContrast(foreground, background, isLargeText = false) {
    if (!globalConfig.colorContrast) {
        return { passes: true, ratio: 21 };
    }
    const ratio = getContrastRatio(foreground, background);
    const minRatio = isLargeText ? 3 : globalConfig.minContrastRatio;
    const passes = ratio >= minRatio;
    if (!passes) {
        return {
            passes,
            ratio,
            warning: {
                type: 'contrast',
                severity: 'error',
                message: `Insufficient color contrast: ${ratio.toFixed(2)}:1 (minimum ${minRatio}:1)`,
                suggestion: `Increase contrast between ${foreground} and ${background}`,
            },
        };
    }
    return { passes, ratio };
}
// ============================================================================
// Keyboard Navigation
// ============================================================================
export class KeyboardNavigator {
    focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
    ].join(', ');
    getFocusableElements(container = document.body) {
        return Array.from(container.querySelectorAll(this.focusableSelectors));
    }
    focusFirst(container) {
        const elements = this.getFocusableElements(container);
        elements[0]?.focus();
    }
    focusLast(container) {
        const elements = this.getFocusableElements(container);
        elements[elements.length - 1]?.focus();
    }
    focusNext(container) {
        const elements = this.getFocusableElements(container);
        const currentIndex = elements.indexOf(document.activeElement);
        if (currentIndex === -1) {
            this.focusFirst(container);
        }
        else {
            const nextIndex = (currentIndex + 1) % elements.length;
            elements[nextIndex]?.focus();
        }
    }
    focusPrevious(container) {
        const elements = this.getFocusableElements(container);
        const currentIndex = elements.indexOf(document.activeElement);
        if (currentIndex === -1) {
            this.focusLast(container);
        }
        else {
            const prevIndex = currentIndex === 0 ? elements.length - 1 : currentIndex - 1;
            elements[prevIndex]?.focus();
        }
    }
    /**
     * Trap focus within a container (useful for modals)
     */
    trapFocus(container) {
        const handleKeyDown = (e) => {
            if (e.key !== 'Tab')
                return;
            const elements = this.getFocusableElements(container);
            const firstElement = elements[0];
            const lastElement = elements[elements.length - 1];
            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            }
            else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };
        container.addEventListener('keydown', handleKeyDown);
        // Focus first element
        this.focusFirst(container);
        // Return cleanup function
        return () => {
            container.removeEventListener('keydown', handleKeyDown);
        };
    }
}
const keyboardNavigator = new KeyboardNavigator();
export function createFocusManager() {
    const currentFocus = signal(null);
    // Track focus changes
    if (typeof document !== 'undefined') {
        document.addEventListener('focusin', (e) => {
            currentFocus.set(e.target);
        });
    }
    return {
        focusFirst: () => keyboardNavigator.focusFirst(),
        focusLast: () => keyboardNavigator.focusLast(),
        focusNext: () => keyboardNavigator.focusNext(),
        focusPrevious: () => keyboardNavigator.focusPrevious(),
        trapFocus: (container) => keyboardNavigator.trapFocus(container),
        getCurrentFocus: () => currentFocus,
    };
}
// ============================================================================
// Accessibility Audit
// ============================================================================
export function auditAccessibility() {
    const warnings = [];
    // Collect heading warnings
    warnings.push(...getHeadingWarnings());
    // Calculate score (100 - 10 points per error, 5 per warning)
    const errorCount = warnings.filter(w => w.severity === 'error').length;
    const warningCount = warnings.filter(w => w.severity === 'warning').length;
    const score = Math.max(0, 100 - errorCount * 10 - warningCount * 5);
    const passed = warnings.filter(w => w.severity === 'info').length;
    const failed = errorCount + warningCount;
    return {
        warnings,
        score,
        passed,
        failed,
        timestamp: Date.now(),
    };
}
/**
 * Live accessibility monitoring for development
 */
export function startA11yMonitoring(interval = 5000) {
    if (!globalConfig.devWarnings)
        return () => { };
    let timeoutId;
    const check = () => {
        const report = auditAccessibility();
        if (report.warnings.length > 0) {
            console.groupCollapsed(`%c♿ PhilJS A11y: ${report.warnings.length} issues found (Score: ${report.score}/100)`, 'color: orange; font-weight: bold');
            report.warnings.forEach(warning => {
                const emoji = warning.severity === 'error' ? '❌' : '⚠️';
                console.log(`${emoji} [${warning.type}] ${warning.message}`);
                if (warning.suggestion) {
                    console.log(`   💡 ${warning.suggestion}`);
                }
            });
            console.groupEnd();
        }
        timeoutId = setTimeout(check, interval);
    };
    check();
    return () => {
        if (timeoutId)
            clearTimeout(timeoutId);
    };
}
// ============================================================================
// Utilities
// ============================================================================
/**
 * Add skip navigation link (WCAG requirement)
 */
export function addSkipLink(targetId = 'main-content') {
    return `
<a
  href="#${targetId}"
  class="skip-link"
  style="position: absolute; top: -40px; left: 0; background: #000; color: #fff; padding: 8px; z-index: 9999; transition: top 0.3s;"
  onfocus="this.style.top='0'"
  onblur="this.style.top='-40px'"
>
  Skip to main content
</a>`;
}
/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message, priority = 'polite') {
    if (typeof document === 'undefined')
        return;
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.style.cssText =
        'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    // Remove after announcement
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}
/**
 * Create accessible loading state
 */
export function createLoadingState(message = 'Loading...') {
    let isLoading = false;
    return {
        start: () => {
            if (!isLoading) {
                isLoading = true;
                announceToScreenReader(message, 'polite');
            }
        },
        stop: () => {
            if (isLoading) {
                isLoading = false;
                announceToScreenReader('Finished loading', 'polite');
            }
        },
    };
}
//# sourceMappingURL=accessibility.js.map