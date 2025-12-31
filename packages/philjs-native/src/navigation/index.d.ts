/**
 * PhilJS Native - Navigation System
 *
 * Comprehensive native navigation with stack, tab, and drawer navigators,
 * deep linking support, and native-like transitions.
 */
import { type Signal } from 'philjs-core';
import type { ViewStyle } from '../styles.js';
/**
 * Route parameters
 */
export type RouteParams = Record<string, string | number | boolean | undefined>;
/**
 * Route definition
 */
export interface Route<T extends RouteParams = RouteParams> {
    key: string;
    name: string;
    params?: T;
    path?: string;
}
/**
 * Navigation state
 */
export interface NavigationState {
    index: number;
    routes: Route[];
    history: Route[];
    stale: boolean;
    type: 'stack' | 'tab' | 'drawer';
    key: string;
}
/**
 * Screen options
 */
export interface ScreenOptions {
    title?: string;
    headerShown?: boolean;
    headerTitle?: string | (() => any);
    headerLeft?: () => any;
    headerRight?: () => any;
    headerStyle?: ViewStyle;
    headerTitleStyle?: ViewStyle;
    headerBackTitle?: string;
    headerTintColor?: string;
    headerTransparent?: boolean;
    headerBlurEffect?: 'none' | 'light' | 'dark' | 'prominent';
    gestureEnabled?: boolean;
    gestureDirection?: 'horizontal' | 'vertical';
    animation?: NavigationAnimation;
    presentation?: PresentationStyle;
    tabBarLabel?: string;
    tabBarIcon?: (props: {
        focused: boolean;
        color: string;
        size: number;
    }) => any;
    tabBarBadge?: string | number;
    tabBarVisible?: boolean;
    drawerLabel?: string;
    drawerIcon?: (props: {
        focused: boolean;
        color: string;
        size: number;
    }) => any;
}
/**
 * Navigation animation types
 */
export type NavigationAnimation = 'default' | 'fade' | 'flip' | 'slide_from_bottom' | 'slide_from_right' | 'slide_from_left' | 'none';
/**
 * Presentation style
 */
export type PresentationStyle = 'card' | 'modal' | 'transparentModal' | 'containedModal' | 'fullScreenModal' | 'formSheet';
/**
 * Screen component definition
 */
export interface Screen<T extends RouteParams = RouteParams> {
    name: string;
    component: (props: ScreenProps<T>) => any;
    options?: ScreenOptions | ((props: ScreenProps<T>) => ScreenOptions);
    initialParams?: T;
}
/**
 * Screen props
 */
export interface ScreenProps<T extends RouteParams = RouteParams> {
    route: Route<T>;
    navigation: Navigation;
}
/**
 * Navigation object
 */
export interface Navigation {
    navigate<T extends RouteParams = RouteParams>(name: string, params?: T): void;
    push<T extends RouteParams = RouteParams>(name: string, params?: T): void;
    pop(count?: number): void;
    popToTop(): void;
    goBack(): void;
    replace<T extends RouteParams = RouteParams>(name: string, params?: T): void;
    reset(state: Partial<NavigationState>): void;
    setParams(params: RouteParams): void;
    setOptions(options: Partial<ScreenOptions>): void;
    isFocused(): boolean;
    canGoBack(): boolean;
    getState(): NavigationState;
    getParent<T extends Navigation = Navigation>(): T | undefined;
    addListener(event: NavigationEvent, callback: (data: any) => void): () => void;
    dispatch(action: NavigationAction): void;
}
/**
 * Navigation events
 */
export type NavigationEvent = 'focus' | 'blur' | 'state' | 'beforeRemove' | 'tabPress' | 'drawerOpen' | 'drawerClose';
/**
 * Navigation actions
 */
export interface NavigationAction {
    type: string;
    payload?: any;
}
/**
 * Deep link configuration
 */
export interface DeepLinkConfig {
    prefixes: string[];
    config: {
        screens: Record<string, string | {
            path: string;
            parse?: Record<string, (value: string) => any>;
        }>;
    };
}
/**
 * Global navigation state
 */
export declare const navigationState: Signal<NavigationState | null>;
/**
 * Stack navigator options
 */
export interface StackNavigatorOptions {
    initialRouteName?: string;
    screenOptions?: ScreenOptions;
    headerMode?: 'float' | 'screen' | 'none';
    mode?: 'card' | 'modal';
}
/**
 * Create a stack navigator
 */
export declare function createStackNavigator(options?: StackNavigatorOptions): {
    Navigator: (props: {
        children?: any;
    }) => any;
    Screen: <T extends RouteParams>(config: Screen<T>) => void;
    navigation: Navigation;
};
/**
 * Tab navigator options
 */
export interface TabNavigatorOptions {
    initialRouteName?: string;
    screenOptions?: ScreenOptions;
    tabBarPosition?: 'top' | 'bottom';
    tabBarStyle?: ViewStyle;
    tabBarActiveTintColor?: string;
    tabBarInactiveTintColor?: string;
    tabBarShowLabel?: boolean;
    lazy?: boolean;
}
/**
 * Create a tab navigator
 */
export declare function createTabNavigator(options?: TabNavigatorOptions): {
    Navigator: (props: {
        children?: any;
    }) => any;
    Screen: <T extends RouteParams>(config: Screen<T>) => void;
    navigation: Navigation;
};
/**
 * Drawer navigator options
 */
export interface DrawerNavigatorOptions {
    initialRouteName?: string;
    screenOptions?: ScreenOptions;
    drawerPosition?: 'left' | 'right';
    drawerType?: 'front' | 'back' | 'slide' | 'permanent';
    drawerStyle?: ViewStyle;
    drawerWidth?: number | string;
    overlayColor?: string;
    swipeEnabled?: boolean;
}
/**
 * Create a drawer navigator
 */
export declare function createDrawerNavigator(options?: DrawerNavigatorOptions): {
    Navigator: (props: {
        children?: any;
    }) => any;
    Screen: <T extends RouteParams>(config: Screen<T>) => void;
    navigation: Navigation;
    openDrawer: () => any;
    closeDrawer: () => any;
    toggleDrawer: () => any;
};
/**
 * Parse URL path to route
 */
export declare function parseRoute(path: string, config: DeepLinkConfig['config']): {
    name: string;
    params: RouteParams;
} | null;
/**
 * Build URL from route
 */
export declare function buildPath(name: string, params: RouteParams, config: DeepLinkConfig['config']): string;
/**
 * Set up deep linking
 */
export declare function setupDeepLinking(config: DeepLinkConfig, navigation: Navigation): () => void;
/**
 * Hook to get navigation object
 */
export declare function useNavigation(): Navigation;
/**
 * Hook to get current route
 */
export declare function useRoute<T extends RouteParams = RouteParams>(): Route<T>;
/**
 * Hook to check if screen is focused
 */
export declare function useIsFocused(): boolean;
/**
 * Hook for focus effect
 */
export declare function useFocusEffect(callback: () => void | (() => void)): void;
export { createStackNavigator as createNativeStack };
export { createTabNavigator as createNativeTabs };
export { createDrawerNavigator as createNativeDrawer };
declare const _default: {
    createStackNavigator: typeof createStackNavigator;
    createTabNavigator: typeof createTabNavigator;
    createDrawerNavigator: typeof createDrawerNavigator;
    parseRoute: typeof parseRoute;
    buildPath: typeof buildPath;
    setupDeepLinking: typeof setupDeepLinking;
    useNavigation: typeof useNavigation;
    useRoute: typeof useRoute;
    useIsFocused: typeof useIsFocused;
    useFocusEffect: typeof useFocusEffect;
};
export default _default;
//# sourceMappingURL=index.d.ts.map