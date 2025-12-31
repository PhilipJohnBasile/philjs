/**
 * ActivityIndicator Component
 *
 * A loading indicator component for showing pending operations.
 */
import type { ViewStyle } from '../styles.js';
/**
 * Activity indicator size
 */
export type ActivityIndicatorSize = 'small' | 'large' | number;
/**
 * ActivityIndicator props
 */
export interface ActivityIndicatorProps {
    /**
     * Whether the indicator is animating
     */
    animating?: boolean;
    /**
     * Color of the spinner
     */
    color?: string;
    /**
     * Size of the spinner
     */
    size?: ActivityIndicatorSize;
    /**
     * Style for the container
     */
    style?: ViewStyle | ViewStyle[];
    /**
     * Whether to hide when not animating
     */
    hidesWhenStopped?: boolean;
    /**
     * Test ID for testing
     */
    testID?: string;
    /**
     * Accessibility label
     */
    accessibilityLabel?: string;
}
/**
 * Create an ActivityIndicator component
 */
export declare function ActivityIndicator(props: ActivityIndicatorProps): any;
export default ActivityIndicator;
//# sourceMappingURL=ActivityIndicator.d.ts.map