/**
 * StatusBar Component
 *
 * Component to control the app status bar.
 * Controls appearance, visibility, and network activity indicator.
 */
/**
 * Status bar style
 */
export type StatusBarStyle = 'default' | 'light-content' | 'dark-content';
/**
 * Status bar animation
 */
export type StatusBarAnimation = 'none' | 'fade' | 'slide';
/**
 * StatusBar props
 */
export interface StatusBarProps {
    /**
     * Whether status bar is hidden
     */
    hidden?: boolean;
    /**
     * Status bar style
     */
    barStyle?: StatusBarStyle;
    /**
     * Whether translucent (Android)
     */
    translucent?: boolean;
    /**
     * Background color (Android)
     */
    backgroundColor?: string;
    /**
     * Show/hide animation
     */
    animated?: boolean;
    /**
     * Show network activity indicator (iOS)
     */
    networkActivityIndicatorVisible?: boolean;
    /**
     * Hide animation type
     */
    showHideTransition?: StatusBarAnimation;
}
/**
 * Create a StatusBar component
 */
export declare function StatusBar(props: StatusBarProps): any;
export declare namespace StatusBar {
    var setBarStyle: (style: StatusBarStyle, animated?: boolean) => void;
    var setHidden: (hidden: boolean, animation?: StatusBarAnimation) => void;
    var setBackgroundColor: (color: string, animated?: boolean) => void;
    var setTranslucent: (translucent: boolean) => void;
    var setNetworkActivityIndicatorVisible: (visible: boolean) => void;
    var pushStackEntry: (props: StatusBarProps) => any;
    var popStackEntry: (entry: any) => void;
    var replaceStackEntry: (entry: any, props: StatusBarProps) => any;
    var currentHeight: number;
}
export default StatusBar;
//# sourceMappingURL=StatusBar.d.ts.map