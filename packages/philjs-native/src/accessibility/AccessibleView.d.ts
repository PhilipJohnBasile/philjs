/**
 * AccessibleView Component
 *
 * Components for building accessible interfaces.
 */
import type { ViewStyle } from '../styles.js';
/**
 * Accessibility role
 */
export type A11yRole = 'none' | 'button' | 'link' | 'search' | 'image' | 'keyboardkey' | 'text' | 'adjustable' | 'imagebutton' | 'header' | 'summary' | 'alert' | 'checkbox' | 'combobox' | 'menu' | 'menubar' | 'menuitem' | 'progressbar' | 'radio' | 'radiogroup' | 'scrollbar' | 'spinbutton' | 'switch' | 'tab' | 'tablist' | 'timer' | 'toolbar';
/**
 * Accessibility state
 */
export interface A11yState {
    disabled?: boolean | undefined;
    selected?: boolean | undefined;
    checked?: boolean | 'mixed' | undefined;
    busy?: boolean | undefined;
    expanded?: boolean | undefined;
}
/**
 * Accessibility value
 */
export interface A11yValue {
    min?: number | undefined;
    max?: number | undefined;
    now?: number | undefined;
    text?: string | undefined;
}
/**
 * Accessibility action
 */
export interface A11yAction {
    name: string;
    label?: string | undefined;
}
/**
 * AccessibleView props
 */
export interface AccessibleViewProps {
    accessible?: boolean | undefined;
    accessibilityLabel?: string | undefined;
    accessibilityHint?: string | undefined;
    accessibilityRole?: A11yRole | undefined;
    accessibilityState?: A11yState | undefined;
    accessibilityValue?: A11yValue | undefined;
    accessibilityActions?: A11yAction[] | undefined;
    onAccessibilityAction?: ((event: {
        actionName: string;
    }) => void) | undefined;
    accessibilityLiveRegion?: 'none' | 'polite' | 'assertive' | undefined;
    accessibilityElementsHidden?: boolean | undefined;
    importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants' | undefined;
    accessibilityViewIsModal?: boolean | undefined;
    onAccessibilityEscape?: (() => boolean) | undefined;
    onAccessibilityTap?: (() => void) | undefined;
    onMagicTap?: (() => void) | undefined;
    children?: unknown;
    style?: ViewStyle | undefined;
    testID?: string | undefined;
}
/**
 * ScreenReaderOnly props
 */
export interface ScreenReaderOnlyProps {
    children?: unknown;
    style?: ViewStyle | undefined;
}
/**
 * FocusTrap props
 */
export interface FocusTrapProps {
    active?: boolean | undefined;
    children?: unknown;
    style?: ViewStyle | undefined;
    initialFocus?: string | undefined;
    returnFocus?: boolean | undefined;
    onEscape?: (() => void) | undefined;
}
/**
 * SkipLink props
 */
export interface SkipLinkProps {
    targetId: string;
    label?: string | undefined;
    style?: ViewStyle | undefined;
}
/**
 * AccessibleView component with full accessibility support
 */
export declare function AccessibleView(props: AccessibleViewProps): unknown;
/**
 * Component visible only to screen readers
 */
export declare function ScreenReaderOnly(props: ScreenReaderOnlyProps): unknown;
/**
 * Traps keyboard focus within a container
 */
export declare function FocusTrap(props: FocusTrapProps): unknown;
/**
 * Skip link for keyboard navigation
 */
export declare function SkipLink(props: SkipLinkProps): unknown;
export default AccessibleView;
//# sourceMappingURL=AccessibleView.d.ts.map