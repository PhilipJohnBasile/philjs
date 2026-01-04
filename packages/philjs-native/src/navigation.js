/**
 * PhilJS Native Navigation
 *
 * Native navigation system with stack and tab navigators.
 * Provides seamless navigation with native transitions.
 */
import { signal, effect, memo, batch } from '@philjs/core';
import { detectPlatform, nativeBridge, platformSelect } from './runtime.js';
// ============================================================================
// Navigation Context
// ============================================================================
/**
 * Current navigation state
 */
export const navigationState = signal(null);
/**
 * Navigation history for back navigation
 */
const navigationHistory = [];
/**
 * Event listeners
 */
const eventListeners = new Map();
/**
 * Generate unique key
 */
let keyCounter = 0;
function generateKey() {
    return `route-${++keyCounter}`;
}
/**
 * Create a native router
 */
export function createNativeRouter(config) {
    const { screens, options } = config;
    // Initialize state
    const initialRouteName = options?.initialRouteName || screens[0]?.name;
    const initialParams = screens.find(s => s.name === initialRouteName)?.initialParams;
    const initialRoute = {
        key: generateKey(),
        name: initialRouteName || '',
        ...(initialParams !== undefined && { params: initialParams }),
    };
    const state = {
        routes: [initialRoute],
        index: 0,
        key: generateKey(),
        type: 'stack',
        stale: false,
    };
    navigationState.set(state);
    navigationHistory.push(initialRoute);
    // Create navigation object
    const navigation = {
        navigate(name, params) {
            const currentState = navigationState();
            const existingIndex = currentState.routes.findIndex(r => r.name === name);
            if (existingIndex !== -1) {
                // Navigate to existing route
                batch(() => {
                    navigationState.set({
                        ...currentState,
                        index: existingIndex,
                        routes: currentState.routes.map((r, i) => i === existingIndex ? { ...r, params: { ...r.params, ...params } } : r),
                    });
                });
            }
            else {
                // Push new route
                this.push(name, params);
            }
            emitEvent('state', { state: navigationState() });
        },
        push(name, params) {
            const currentState = navigationState();
            const newRoute = {
                key: generateKey(),
                name,
                ...(params !== undefined && { params }),
            };
            navigationHistory.push(newRoute);
            batch(() => {
                navigationState.set({
                    ...currentState,
                    routes: [...currentState.routes, newRoute],
                    index: currentState.routes.length,
                });
            });
            // Trigger native animation
            nativeBridge.call('Navigation', 'push', { name, params, animation: 'slide_from_right' });
            emitEvent('state', { state: navigationState() });
        },
        pop(count = 1) {
            const currentState = navigationState();
            if (currentState.index < count)
                return;
            for (let i = 0; i < count; i++) {
                navigationHistory.pop();
            }
            batch(() => {
                navigationState.set({
                    ...currentState,
                    routes: currentState.routes.slice(0, -count),
                    index: currentState.index - count,
                });
            });
            nativeBridge.call('Navigation', 'pop', { count });
            emitEvent('state', { state: navigationState() });
        },
        popToTop() {
            const currentState = navigationState();
            if (currentState.index === 0)
                return;
            navigationHistory.splice(1);
            batch(() => {
                navigationState.set({
                    ...currentState,
                    routes: [currentState.routes[0]],
                    index: 0,
                });
            });
            nativeBridge.call('Navigation', 'popToTop');
            emitEvent('state', { state: navigationState() });
        },
        goBack() {
            this.pop(1);
            emitEvent('beforeRemove', { action: { type: 'GO_BACK' } });
        },
        replace(name, params) {
            const currentState = navigationState();
            const newRoute = {
                key: generateKey(),
                name,
                ...(params !== undefined && { params }),
            };
            navigationHistory[navigationHistory.length - 1] = newRoute;
            batch(() => {
                const newRoutes = [...currentState.routes];
                newRoutes[currentState.index] = newRoute;
                navigationState.set({
                    ...currentState,
                    routes: newRoutes,
                });
            });
            nativeBridge.call('Navigation', 'replace', { name, params });
            emitEvent('state', { state: navigationState() });
        },
        reset(newState) {
            const routes = newState.routes || [];
            const index = newState.index ?? routes.length - 1;
            navigationHistory.splice(0, navigationHistory.length, ...routes);
            navigationState.set({
                routes,
                index,
                key: generateKey(),
                type: 'stack',
                stale: false,
            });
            nativeBridge.call('Navigation', 'reset', { state: navigationState() });
            emitEvent('state', { state: navigationState() });
        },
        setParams(params) {
            const currentState = navigationState();
            const currentRoute = currentState.routes[currentState.index];
            batch(() => {
                navigationState.set({
                    ...currentState,
                    routes: currentState.routes.map((r, i) => i === currentState.index
                        ? { ...r, params: { ...r.params, ...params } }
                        : r),
                });
            });
        },
        setOptions(opts) {
            // Store options for current screen
            const currentState = navigationState();
            const currentRoute = currentState.routes[currentState.index];
            emitEvent('options', { options: opts, route: currentRoute });
        },
        isFocused() {
            return true; // Simplified - would check actual focus state
        },
        canGoBack() {
            const currentState = navigationState();
            return currentState ? currentState.index > 0 : false;
        },
        getState() {
            return navigationState();
        },
        getParent() {
            return undefined; // Simplified - would return parent navigator
        },
        addListener(event, callback) {
            if (!eventListeners.has(event)) {
                eventListeners.set(event, new Set());
            }
            eventListeners.get(event).add(callback);
            return () => {
                eventListeners.get(event)?.delete(callback);
            };
        },
    };
    // Navigator component
    const Navigator = (props) => {
        const platform = detectPlatform();
        const currentState = navigationState();
        if (!currentState)
            return null;
        const currentRoute = currentState.routes[currentState.index];
        const screenDef = screens.find(s => s.name === currentRoute.name);
        if (!screenDef) {
            console.warn(`Screen "${currentRoute.name}" not found`);
            return null;
        }
        // Get screen options
        const screenOptions = typeof screenDef.options === 'function'
            ? screenDef.options({ route: currentRoute, navigation })
            : screenDef.options || {};
        const defaultOptions = typeof options?.screenOptions === 'function'
            ? options.screenOptions({ route: currentRoute, navigation })
            : options?.screenOptions || {};
        const mergedOptions = { ...defaultOptions, ...screenOptions };
        if (platform === 'web') {
            return {
                type: 'div',
                props: {
                    style: {
                        display: 'flex',
                        'flex-direction': 'column',
                        flex: 1,
                        height: '100%',
                    },
                },
                children: [
                    // Header
                    mergedOptions.headerShown !== false && {
                        type: 'div',
                        props: {
                            style: {
                                display: 'flex',
                                'align-items': 'center',
                                padding: '12px 16px',
                                'background-color': mergedOptions.headerTransparent ? 'transparent' : '#fff',
                                'border-bottom': '1px solid #eee',
                                ...mergedOptions.headerStyle,
                            },
                        },
                        children: [
                            currentState.index > 0 && {
                                type: 'button',
                                props: {
                                    style: {
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '8px',
                                        'margin-right': '8px',
                                    },
                                    onClick: () => navigation.goBack(),
                                },
                                children: mergedOptions.headerLeft?.() || '<',
                            },
                            {
                                type: 'span',
                                props: {
                                    style: {
                                        flex: 1,
                                        'font-weight': '600',
                                        'font-size': '17px',
                                        ...mergedOptions.headerTitleStyle,
                                    },
                                },
                                children: typeof mergedOptions.headerTitle === 'function'
                                    ? mergedOptions.headerTitle()
                                    : mergedOptions.headerTitle || mergedOptions.title || currentRoute.name,
                            },
                            mergedOptions.headerRight && {
                                type: 'div',
                                props: {},
                                children: mergedOptions.headerRight(),
                            },
                        ].filter(Boolean),
                    },
                    // Screen content
                    {
                        type: 'div',
                        props: {
                            style: {
                                flex: 1,
                                overflow: 'auto',
                                ...mergedOptions.contentStyle,
                            },
                        },
                        children: screenDef.component({
                            route: currentRoute,
                            navigation,
                        }),
                    },
                ].filter(Boolean),
            };
        }
        // Native
        return {
            type: 'NativeNavigator',
            props: {
                state: currentState,
                options: mergedOptions,
            },
            children: screenDef.component({
                route: currentRoute,
                navigation,
            }),
        };
    };
    // Screen component (declarative API)
    const Screen = (props) => {
        // Screens are registered, not rendered directly
        return null;
    };
    return { Navigator, Screen, navigation };
}
/**
 * Create a stack navigator
 */
export function createNativeStack(options) {
    const screens = [];
    const Navigator = (props) => {
        // Extract screen definitions from children
        // In a real implementation, this would parse JSX children
        const router = createNativeRouter({
            screens,
            ...(options !== undefined && { options }),
        });
        return router.Navigator(props);
    };
    const Screen = (screenProps) => {
        screens.push(screenProps);
        return null;
    };
    return { Navigator, Screen };
}
/**
 * NativeStack export alias
 */
export const NativeStack = createNativeStack;
/**
 * Create a tab navigator
 */
export function createNativeTabs(options) {
    const screens = [];
    const activeTab = signal(0);
    const Navigator = (props) => {
        const platform = detectPlatform();
        // Initialize state for tabs
        const state = {
            routes: screens.map((s, i) => ({
                key: generateKey(),
                name: s.name,
                ...(s.initialParams !== undefined && { params: s.initialParams }),
            })),
            index: activeTab(),
            key: generateKey(),
            type: 'tab',
            stale: false,
        };
        if (!navigationState()) {
            navigationState.set(state);
        }
        const currentScreen = screens[activeTab()];
        if (platform === 'web') {
            const tabBarPosition = options?.tabBarPosition || 'bottom';
            const activeTintColor = options?.tabBarActiveTintColor || '#007AFF';
            const inactiveTintColor = options?.tabBarInactiveTintColor || '#8E8E93';
            const tabBar = {
                type: 'div',
                props: {
                    style: {
                        display: 'flex',
                        'justify-content': 'space-around',
                        'align-items': 'center',
                        padding: '8px 0',
                        'background-color': '#fff',
                        'border-top': tabBarPosition === 'bottom' ? '1px solid #eee' : 'none',
                        'border-bottom': tabBarPosition === 'top' ? '1px solid #eee' : 'none',
                        ...options?.tabBarStyle,
                    },
                },
                children: screens.map((screen, index) => {
                    const isActive = index === activeTab();
                    const screenOptions = typeof screen.options === 'function'
                        ? screen.options({ route: state.routes[index], navigation: {} })
                        : screen.options || {};
                    return {
                        type: 'button',
                        props: {
                            style: {
                                display: 'flex',
                                'flex-direction': 'column',
                                'align-items': 'center',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '8px 16px',
                                color: isActive ? activeTintColor : inactiveTintColor,
                            },
                            onClick: () => {
                                activeTab.set(index);
                                navigationState.set({
                                    ...state,
                                    index,
                                });
                            },
                        },
                        children: [
                            options?.tabBarShowIcon !== false && screenOptions.tabBarIcon && {
                                type: 'span',
                                props: {},
                                children: screenOptions.tabBarIcon({
                                    focused: isActive,
                                    color: isActive ? activeTintColor : inactiveTintColor,
                                    size: 24,
                                }),
                            },
                            options?.tabBarShowLabel !== false && {
                                type: 'span',
                                props: {
                                    style: { 'font-size': '12px', 'margin-top': '4px' },
                                },
                                children: screenOptions.tabBarLabel || screen.name,
                            },
                            screenOptions.tabBarBadge && {
                                type: 'span',
                                props: {
                                    style: {
                                        position: 'absolute',
                                        top: '0',
                                        right: '0',
                                        'background-color': 'red',
                                        color: 'white',
                                        'border-radius': '10px',
                                        padding: '2px 6px',
                                        'font-size': '10px',
                                    },
                                },
                                children: screenOptions.tabBarBadge,
                            },
                        ].filter(Boolean),
                    };
                }),
            };
            return {
                type: 'div',
                props: {
                    style: {
                        display: 'flex',
                        'flex-direction': 'column',
                        flex: 1,
                        height: '100%',
                    },
                },
                children: [
                    tabBarPosition === 'top' && tabBar,
                    {
                        type: 'div',
                        props: { style: { flex: 1, overflow: 'auto' } },
                        children: currentScreen?.component({
                            route: state.routes[activeTab()],
                            navigation: {},
                        }),
                    },
                    tabBarPosition === 'bottom' && tabBar,
                ].filter(Boolean),
            };
        }
        return {
            type: 'NativeTabNavigator',
            props: { state, options },
            children: currentScreen?.component({
                route: state.routes[activeTab()],
                navigation: {},
            }),
        };
    };
    const Screen = (screenProps) => {
        screens.push(screenProps);
        return null;
    };
    return { Navigator, Screen };
}
/**
 * NativeTabs export alias
 */
export const NativeTabs = createNativeTabs;
// ============================================================================
// Navigation Hooks
// ============================================================================
/**
 * Hook to access navigation object
 */
export function useNativeNavigation() {
    // In a real implementation, this would get navigation from context
    // For now, return a basic navigation object
    const state = navigationState();
    return {
        navigate(name, params) {
            const currentState = navigationState();
            const newRoute = { key: generateKey(), name, ...(params !== undefined && { params }) };
            navigationState.set({
                ...currentState,
                routes: [...currentState.routes, newRoute],
                index: currentState.routes.length,
            });
        },
        push(name, params) {
            this.navigate(name, params);
        },
        pop(count = 1) {
            const currentState = navigationState();
            navigationState.set({
                ...currentState,
                routes: currentState.routes.slice(0, -count),
                index: Math.max(0, currentState.index - count),
            });
        },
        popToTop() {
            const currentState = navigationState();
            navigationState.set({
                ...currentState,
                routes: [currentState.routes[0]],
                index: 0,
            });
        },
        goBack() {
            this.pop(1);
        },
        replace(name, params) {
            const currentState = navigationState();
            const newRoute = { key: generateKey(), name, ...(params !== undefined && { params }) };
            const newRoutes = [...currentState.routes];
            newRoutes[currentState.index] = newRoute;
            navigationState.set({ ...currentState, routes: newRoutes });
        },
        reset(newState) {
            navigationState.set({
                routes: newState.routes || [],
                index: newState.index || 0,
                key: generateKey(),
                type: 'stack',
                stale: false,
            });
        },
        setParams(params) {
            const currentState = navigationState();
            const currentRoute = currentState.routes[currentState.index];
            navigationState.set({
                ...currentState,
                routes: currentState.routes.map((r, i) => i === currentState.index ? { ...r, params: { ...r.params, ...params } } : r),
            });
        },
        setOptions() { },
        isFocused() { return true; },
        canGoBack() { return state ? state.index > 0 : false; },
        getState() { return navigationState(); },
        getParent() { return undefined; },
        addListener(event, callback) {
            if (!eventListeners.has(event)) {
                eventListeners.set(event, new Set());
            }
            eventListeners.get(event).add(callback);
            return () => eventListeners.get(event)?.delete(callback);
        },
    };
}
/**
 * Hook to access current route
 */
export function useRoute() {
    const state = navigationState();
    if (!state) {
        return { key: '', name: '', params: {} };
    }
    return state.routes[state.index];
}
/**
 * Hook to check if screen is focused
 */
export function useIsFocused() {
    const state = navigationState();
    return !!state;
}
/**
 * Hook to subscribe to focus events
 */
export function useFocusEffect(callback) {
    effect(() => {
        const cleanup = callback();
        return cleanup;
    });
}
// ============================================================================
// Navigation Events
// ============================================================================
/**
 * Emit navigation event
 */
function emitEvent(event, data) {
    eventListeners.get(event)?.forEach(callback => {
        try {
            callback(data);
        }
        catch (error) {
            console.error(`Error in navigation event listener for ${event}:`, error);
        }
    });
}
export function Link(props) {
    const platform = detectPlatform();
    const navigation = useNativeNavigation();
    const handlePress = () => {
        navigation.navigate(props.to, props.params);
    };
    if (platform === 'web') {
        return {
            type: 'a',
            props: {
                href: `#${props.to}`,
                style: {
                    'text-decoration': 'none',
                    color: 'inherit',
                    ...props.style,
                },
                onClick: (e) => {
                    e.preventDefault();
                    handlePress();
                },
            },
            children: props.children,
        };
    }
    return {
        type: 'NativeLink',
        props: {
            ...props,
            onPress: handlePress,
        },
        children: props.children,
    };
}
//# sourceMappingURL=navigation.js.map