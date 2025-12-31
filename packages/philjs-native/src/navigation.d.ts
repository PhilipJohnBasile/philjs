/**
 * PhilJS Native Navigation
 *
 * Native navigation system with stack and tab navigators.
 * Provides seamless navigation with native transitions.
 */
import { type Signal } from 'philjs-core';
import type { ViewStyle } from './styles.js';
/**
 * Navigation state
 */
export interface NavigationState {
    routes: Route[];
    index: number;
    key: string;
    type: 'stack' | 'tab' | 'drawer';
    stale: boolean;
}
/**
 * Route definition
 */
export interface Route {
    key: string;
    name: string;
    params?: Record<string, any>;
    state?: NavigationState;
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
    headerBackTitleVisible?: boolean;
    headerTintColor?: string;
    headerTransparent?: boolean;
    headerBlurEffect?: 'none' | 'light' | 'dark';
    gestureEnabled?: boolean;
    animation?: ScreenAnimation;
    presentation?: ScreenPresentation;
    contentStyle?: ViewStyle;
    tabBarLabel?: string;
    tabBarIcon?: (props: {
        focused: boolean;
        color: string;
        size: number;
    }) => any;
    tabBarBadge?: string | number;
    tabBarVisible?: boolean;
}
/**
 * Screen animation types
 */
export type ScreenAnimation = 'default' | 'fade' | 'flip' | 'simple_push' | 'slide_from_bottom' | 'slide_from_right' | 'slide_from_left' | 'none';
/**
 * Screen presentation types
 */
export type ScreenPresentation = 'card' | 'modal' | 'transparentModal' | 'containedModal' | 'containedTransparentModal' | 'fullScreenModal' | 'formSheet';
/**
 * Navigation options
 */
export interface NavigationOptions {
    initialRouteName?: string;
    screenOptions?: ScreenOptions | ((props: {
        route: Route;
        navigation: Navigation;
    }) => ScreenOptions);
}
/**
 * Screen definition
 */
export interface ScreenDefinition {
    name: string;
    component: (props: any) => any;
    options?: ScreenOptions | ((props: {
        route: Route;
        navigation: Navigation;
    }) => ScreenOptions);
    initialParams?: Record<string, any>;
}
/**
 * Navigation object
 */
export interface Navigation {
    navigate: (name: string, params?: Record<string, any>) => void;
    push: (name: string, params?: Record<string, any>) => void;
    pop: (count?: number) => void;
    popToTop: () => void;
    goBack: () => void;
    replace: (name: string, params?: Record<string, any>) => void;
    reset: (state: Partial<NavigationState>) => void;
    setParams: (params: Record<string, any>) => void;
    setOptions: (options: Partial<ScreenOptions>) => void;
    isFocused: () => boolean;
    canGoBack: () => boolean;
    getState: () => NavigationState;
    getParent: () => Navigation | undefined;
    addListener: (event: string, callback: Function) => () => void;
}
/**
 * Current navigation state
 */
export declare const navigationState: Signal<NavigationState | null>;
/**
 * Router configuration
 */
export interface RouterConfig {
    screens: ScreenDefinition[];
    options?: NavigationOptions;
}
/**
 * Create a native router
 */
export declare function createNativeRouter(config: RouterConfig): {
    Navigator: (props: {
        children?: any;
    }) => any;
    Screen: (props: ScreenDefinition) => any;
    navigation: Navigation;
};
/**
 * Stack navigator options
 */
export interface StackNavigatorOptions extends NavigationOptions {
    mode?: 'card' | 'modal';
    headerMode?: 'float' | 'screen' | 'none';
    initialRouteName?: string;
}
/**
 * Create a stack navigator
 */
export declare function createNativeStack(options?: StackNavigatorOptions): {
    Navigator: (props: {
        children?: any;
    }) => any;
    Screen: (props: ScreenDefinition) => any;
};
/**
 * NativeStack export alias
 */
export declare const NativeStack: typeof createNativeStack;
/**
 * Tab navigator options
 */
export interface TabNavigatorOptions extends NavigationOptions {
    tabBarPosition?: 'top' | 'bottom';
    tabBarStyle?: ViewStyle;
    tabBarActiveTintColor?: string;
    tabBarInactiveTintColor?: string;
    tabBarShowLabel?: boolean;
    tabBarShowIcon?: boolean;
    lazy?: boolean;
}
/**
 * Create a tab navigator
 */
export declare function createNativeTabs(options?: TabNavigatorOptions): {
    Navigator: (props: {
        children?: any;
    }) => any;
    Screen: (props: ScreenDefinition) => any;
};
/**
 * NativeTabs export alias
 */
export declare const NativeTabs: typeof createNativeTabs;
/**
 * Hook to access navigation object
 */
export declare function useNativeNavigation(): Navigation;
/**
 * Hook to access current route
 */
export declare function useRoute<T extends Record<string, any> = Record<string, any>>(): Route & {
    params: T;
};
/**
 * Hook to check if screen is focused
 */
export declare function useIsFocused(): boolean;
/**
 * Hook to subscribe to focus events
 */
export declare function useFocusEffect(callback: () => void | (() => void)): void;
/**
 * Link component for navigation
 */
export interface LinkProps {
    to: string;
    params?: Record<string, any>;
    children?: any;
    style?: ViewStyle;
}
export declare function Link(props: LinkProps): any;
//# sourceMappingURL=navigation.d.ts.map