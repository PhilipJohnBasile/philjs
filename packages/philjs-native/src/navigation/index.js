// @ts-nocheck
/**
 * PhilJS Native - Navigation System
 *
 * Comprehensive native navigation with stack, tab, and drawer navigators,
 * deep linking support, and native-like transitions.
 */
import { signal, effect, batch } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';
// ============================================================================
// State
// ============================================================================
/**
 * Global navigation state
 */
export const navigationState = signal(null);
/**
 * Route key counter
 */
let routeKeyCounter = 0;
/**
 * Generate unique route key
 */
function generateKey() {
    return `route-${++routeKeyCounter}-${Date.now()}`;
}
/**
 * Event listeners
 */
const eventListeners = new Map();
/**
 * Create a stack navigator
 */
export function createStackNavigator(options) {
    const screens = [];
    const stackState = signal(null);
    /**
     * Register a screen
     */
    function Screen(config) {
        screens.push(config);
    }
    /**
     * Create navigation object
     */
    function createNavigation() {
        const getState = () => stackState() || createInitialState();
        const createInitialState = () => {
            const initialRouteName = options?.initialRouteName || screens[0]?.name || '';
            const initialScreen = screens.find((s) => s.name === initialRouteName);
            const initialRoute = {
                key: generateKey(),
                name: initialRouteName,
                params: initialScreen?.initialParams,
            };
            return {
                index: 0,
                routes: [initialRoute],
                history: [initialRoute],
                stale: false,
                type: 'stack',
                key: generateKey(),
            };
        };
        // Initialize state
        if (!stackState()) {
            stackState.set(createInitialState());
            navigationState.set(stackState());
        }
        const navigation = {
            navigate(name, params) {
                const state = getState();
                const existingIndex = state.routes.findIndex((r) => r.name === name);
                if (existingIndex !== -1) {
                    // Update existing route
                    batch(() => {
                        const newRoutes = [...state.routes];
                        newRoutes[existingIndex] = {
                            ...newRoutes[existingIndex],
                            params: { ...newRoutes[existingIndex].params, ...params },
                        };
                        stackState.set({ ...state, routes: newRoutes, index: existingIndex });
                    });
                }
                else {
                    this.push(name, params);
                }
                emitEvent('state', { state: getState() });
            },
            push(name, params) {
                const state = getState();
                const newRoute = {
                    key: generateKey(),
                    name,
                    params,
                };
                batch(() => {
                    stackState.set({
                        ...state,
                        routes: [...state.routes, newRoute],
                        history: [...state.history, newRoute],
                        index: state.routes.length,
                    });
                });
                nativeBridge.call('Navigation', 'push', { name, params });
                emitEvent('state', { state: getState() });
            },
            pop(count = 1) {
                const state = getState();
                if (state.index < count)
                    return;
                emitEvent('beforeRemove', { action: { type: 'POP', payload: { count } } });
                batch(() => {
                    stackState.set({
                        ...state,
                        routes: state.routes.slice(0, -count),
                        index: state.index - count,
                    });
                });
                nativeBridge.call('Navigation', 'pop', { count });
                emitEvent('state', { state: getState() });
            },
            popToTop() {
                const state = getState();
                if (state.index === 0)
                    return;
                batch(() => {
                    stackState.set({
                        ...state,
                        routes: [state.routes[0]],
                        index: 0,
                    });
                });
                nativeBridge.call('Navigation', 'popToTop');
                emitEvent('state', { state: getState() });
            },
            goBack() {
                this.pop(1);
            },
            replace(name, params) {
                const state = getState();
                const newRoute = {
                    key: generateKey(),
                    name,
                    params,
                };
                batch(() => {
                    const newRoutes = [...state.routes];
                    newRoutes[state.index] = newRoute;
                    stackState.set({ ...state, routes: newRoutes });
                });
                nativeBridge.call('Navigation', 'replace', { name, params });
                emitEvent('state', { state: getState() });
            },
            reset(newState) {
                const routes = newState.routes || [];
                const index = newState.index ?? routes.length - 1;
                stackState.set({
                    routes,
                    history: routes,
                    index,
                    stale: false,
                    type: 'stack',
                    key: generateKey(),
                });
                emitEvent('state', { state: getState() });
            },
            setParams(params) {
                const state = getState();
                const currentRoute = state.routes[state.index];
                batch(() => {
                    const newRoutes = [...state.routes];
                    newRoutes[state.index] = {
                        ...currentRoute,
                        params: { ...currentRoute.params, ...params },
                    };
                    stackState.set({ ...state, routes: newRoutes });
                });
            },
            setOptions(opts) {
                emitEvent('options', { options: opts });
            },
            isFocused() {
                return true;
            },
            canGoBack() {
                return getState().index > 0;
            },
            getState,
            getParent() {
                return undefined;
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
            dispatch(action) {
                switch (action.type) {
                    case 'NAVIGATE':
                        this.navigate(action.payload.name, action.payload.params);
                        break;
                    case 'PUSH':
                        this.push(action.payload.name, action.payload.params);
                        break;
                    case 'POP':
                        this.pop(action.payload?.count);
                        break;
                    case 'POP_TO_TOP':
                        this.popToTop();
                        break;
                    case 'GO_BACK':
                        this.goBack();
                        break;
                    case 'REPLACE':
                        this.replace(action.payload.name, action.payload.params);
                        break;
                    case 'RESET':
                        this.reset(action.payload);
                        break;
                }
            },
        };
        return navigation;
    }
    /**
     * Navigator component
     */
    function Navigator(props) {
        const platform = detectPlatform();
        const state = stackState();
        const navigation = createNavigation();
        if (!state)
            return null;
        const currentRoute = state.routes[state.index];
        const screen = screens.find((s) => s.name === currentRoute.name);
        if (!screen) {
            console.warn(`Screen "${currentRoute.name}" not found`);
            return null;
        }
        const screenOptions = typeof screen.options === 'function'
            ? screen.options({ route: currentRoute, navigation })
            : screen.options || {};
        const mergedOptions = { ...options?.screenOptions, ...screenOptions };
        if (platform === 'web') {
            return renderWebStack(state, screen, currentRoute, navigation, mergedOptions, options);
        }
        return {
            type: 'NativeStackNavigator',
            props: { state, options: mergedOptions },
            children: screen.component({ route: currentRoute, navigation }),
        };
    }
    return { Navigator, Screen, navigation: createNavigation() };
}
/**
 * Render web stack navigator
 */
function renderWebStack(state, screen, currentRoute, navigation, screenOptions, navOptions) {
    return {
        type: 'div',
        props: {
            style: {
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                height: '100%',
                position: 'relative',
            },
        },
        children: [
            // Header
            screenOptions.headerShown !== false && {
                type: 'header',
                props: {
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 16px',
                        backgroundColor: screenOptions.headerTransparent ? 'transparent' : '#fff',
                        borderBottom: '1px solid #eee',
                        minHeight: '44px',
                        ...screenOptions.headerStyle,
                    },
                },
                children: [
                    state.index > 0 && {
                        type: 'button',
                        props: {
                            style: {
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '8px',
                                marginRight: '8px',
                                color: screenOptions.headerTintColor || '#007AFF',
                            },
                            onClick: () => navigation.goBack(),
                        },
                        children: screenOptions.headerLeft?.() || '\u2190',
                    },
                    {
                        type: 'h1',
                        props: {
                            style: {
                                flex: 1,
                                margin: 0,
                                fontSize: '17px',
                                fontWeight: '600',
                                ...screenOptions.headerTitleStyle,
                            },
                        },
                        children: typeof screenOptions.headerTitle === 'function'
                            ? screenOptions.headerTitle()
                            : screenOptions.headerTitle || screenOptions.title || currentRoute.name,
                    },
                    screenOptions.headerRight?.(),
                ].filter(Boolean),
            },
            // Content
            {
                type: 'main',
                props: {
                    style: {
                        flex: 1,
                        overflow: 'auto',
                    },
                },
                children: screen.component({ route: currentRoute, navigation }),
            },
        ].filter(Boolean),
    };
}
/**
 * Create a tab navigator
 */
export function createTabNavigator(options) {
    const screens = [];
    const activeTab = signal(0);
    const tabState = signal(null);
    function Screen(config) {
        screens.push(config);
    }
    function createNavigation() {
        const getState = () => tabState() || createInitialState();
        const createInitialState = () => {
            const routes = screens.map((s, i) => ({
                key: generateKey(),
                name: s.name,
                params: s.initialParams,
            }));
            return {
                index: 0,
                routes,
                history: [routes[0]],
                stale: false,
                type: 'tab',
                key: generateKey(),
            };
        };
        if (!tabState()) {
            tabState.set(createInitialState());
        }
        const navigation = {
            navigate(name, params) {
                const state = getState();
                const index = state.routes.findIndex((r) => r.name === name);
                if (index !== -1) {
                    activeTab.set(index);
                    batch(() => {
                        tabState.set({ ...state, index });
                    });
                    emitEvent('state', { state: getState() });
                }
            },
            push(name, params) {
                this.navigate(name, params);
            },
            pop() { },
            popToTop() { },
            goBack() { },
            replace(name, params) {
                this.navigate(name, params);
            },
            reset(newState) {
                if (newState.index !== undefined) {
                    activeTab.set(newState.index);
                    tabState.set({ ...getState(), index: newState.index });
                }
            },
            setParams(params) {
                const state = getState();
                const index = activeTab();
                const newRoutes = [...state.routes];
                newRoutes[index] = {
                    ...newRoutes[index],
                    params: { ...newRoutes[index].params, ...params },
                };
                tabState.set({ ...state, routes: newRoutes });
            },
            setOptions(opts) {
                emitEvent('options', { options: opts });
            },
            isFocused() {
                return true;
            },
            canGoBack() {
                return false;
            },
            getState,
            getParent() {
                return undefined;
            },
            addListener(event, callback) {
                if (!eventListeners.has(event)) {
                    eventListeners.set(event, new Set());
                }
                eventListeners.get(event).add(callback);
                return () => eventListeners.get(event)?.delete(callback);
            },
            dispatch(action) {
                if (action.type === 'NAVIGATE' || action.type === 'JUMP_TO') {
                    this.navigate(action.payload.name, action.payload.params);
                }
            },
        };
        return navigation;
    }
    function Navigator(props) {
        const platform = detectPlatform();
        const state = tabState();
        const navigation = createNavigation();
        const currentIndex = activeTab();
        if (!state)
            return null;
        const currentRoute = state.routes[currentIndex];
        const screen = screens[currentIndex];
        if (!screen)
            return null;
        if (platform === 'web') {
            return renderWebTabs(state, screens, currentIndex, screen, currentRoute, navigation, options, activeTab);
        }
        return {
            type: 'NativeTabNavigator',
            props: { state, options },
            children: screen.component({ route: currentRoute, navigation }),
        };
    }
    return { Navigator, Screen, navigation: createNavigation() };
}
/**
 * Render web tabs
 */
function renderWebTabs(state, screens, currentIndex, screen, currentRoute, navigation, options, activeTab) {
    const position = options?.tabBarPosition || 'bottom';
    const activeTint = options?.tabBarActiveTintColor || '#007AFF';
    const inactiveTint = options?.tabBarInactiveTintColor || '#8E8E93';
    const tabBar = {
        type: 'nav',
        props: {
            style: {
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                padding: '8px 0',
                backgroundColor: '#fff',
                borderTop: position === 'bottom' ? '1px solid #eee' : 'none',
                borderBottom: position === 'top' ? '1px solid #eee' : 'none',
                ...options?.tabBarStyle,
            },
            role: 'tablist',
        },
        children: screens.map((s, index) => {
            const isActive = index === currentIndex;
            const screenOptions = typeof s.options === 'function'
                ? s.options({ route: state.routes[index], navigation })
                : s.options || {};
            return {
                type: 'button',
                props: {
                    key: s.name,
                    style: {
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        color: isActive ? activeTint : inactiveTint,
                    },
                    onClick: () => {
                        activeTab?.set(index);
                        navigation.navigate(s.name);
                        emitEvent('tabPress', { route: state.routes[index] });
                    },
                    role: 'tab',
                    'aria-selected': isActive,
                },
                children: [
                    screenOptions.tabBarIcon?.({ focused: isActive, color: isActive ? activeTint : inactiveTint, size: 24 }),
                    options?.tabBarShowLabel !== false && {
                        type: 'span',
                        props: { style: { fontSize: '10px', marginTop: '4px' } },
                        children: screenOptions.tabBarLabel || s.name,
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
                flexDirection: 'column',
                flex: 1,
                height: '100%',
            },
        },
        children: [
            position === 'top' && tabBar,
            {
                type: 'main',
                props: { style: { flex: 1, overflow: 'auto' } },
                children: screen.component({ route: currentRoute, navigation }),
            },
            position === 'bottom' && tabBar,
        ].filter(Boolean),
    };
}
/**
 * Create a drawer navigator
 */
export function createDrawerNavigator(options) {
    const screens = [];
    const isOpen = signal(false);
    const activeScreen = signal(0);
    const drawerState = signal(null);
    function Screen(config) {
        screens.push(config);
    }
    function createNavigation() {
        const getState = () => drawerState() || createInitialState();
        const createInitialState = () => {
            const routes = screens.map((s) => ({
                key: generateKey(),
                name: s.name,
                params: s.initialParams,
            }));
            return {
                index: 0,
                routes,
                history: [routes[0]],
                stale: false,
                type: 'drawer',
                key: generateKey(),
            };
        };
        if (!drawerState()) {
            drawerState.set(createInitialState());
        }
        const navigation = {
            navigate(name, params) {
                const state = getState();
                const index = state.routes.findIndex((r) => r.name === name);
                if (index !== -1) {
                    activeScreen.set(index);
                    drawerState.set({ ...state, index });
                    isOpen.set(false);
                    emitEvent('state', { state: getState() });
                }
            },
            push(name, params) {
                this.navigate(name, params);
            },
            pop() { },
            popToTop() { },
            goBack() { },
            replace(name, params) {
                this.navigate(name, params);
            },
            reset(newState) {
                if (newState.index !== undefined) {
                    activeScreen.set(newState.index);
                    drawerState.set({ ...getState(), index: newState.index });
                }
            },
            setParams(params) {
                const state = getState();
                const index = activeScreen();
                const newRoutes = [...state.routes];
                newRoutes[index] = {
                    ...newRoutes[index],
                    params: { ...newRoutes[index].params, ...params },
                };
                drawerState.set({ ...state, routes: newRoutes });
            },
            setOptions(opts) {
                emitEvent('options', { options: opts });
            },
            isFocused() {
                return true;
            },
            canGoBack() {
                return false;
            },
            getState,
            getParent() {
                return undefined;
            },
            addListener(event, callback) {
                if (!eventListeners.has(event)) {
                    eventListeners.set(event, new Set());
                }
                eventListeners.get(event).add(callback);
                return () => eventListeners.get(event)?.delete(callback);
            },
            dispatch(action) {
                switch (action.type) {
                    case 'OPEN_DRAWER':
                        isOpen.set(true);
                        emitEvent('drawerOpen', {});
                        break;
                    case 'CLOSE_DRAWER':
                        isOpen.set(false);
                        emitEvent('drawerClose', {});
                        break;
                    case 'TOGGLE_DRAWER':
                        isOpen.set(!isOpen());
                        break;
                    default:
                        if (action.type === 'NAVIGATE') {
                            this.navigate(action.payload.name, action.payload.params);
                        }
                }
            },
        };
        return navigation;
    }
    function Navigator(props) {
        const platform = detectPlatform();
        const state = drawerState();
        const navigation = createNavigation();
        const currentIndex = activeScreen();
        const drawerOpen = isOpen();
        if (!state)
            return null;
        const currentRoute = state.routes[currentIndex];
        const screen = screens[currentIndex];
        if (!screen)
            return null;
        const drawerWidth = options?.drawerWidth || 280;
        const position = options?.drawerPosition || 'left';
        if (platform === 'web') {
            return {
                type: 'div',
                props: {
                    style: {
                        display: 'flex',
                        flex: 1,
                        height: '100%',
                        position: 'relative',
                        overflow: 'hidden',
                    },
                },
                children: [
                    // Overlay
                    drawerOpen && {
                        type: 'div',
                        props: {
                            style: {
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: options?.overlayColor || 'rgba(0,0,0,0.5)',
                                zIndex: 99,
                            },
                            onClick: () => navigation.dispatch({ type: 'CLOSE_DRAWER' }),
                        },
                    },
                    // Drawer
                    {
                        type: 'aside',
                        props: {
                            style: {
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                [position]: 0,
                                width: typeof drawerWidth === 'number' ? `${drawerWidth}px` : drawerWidth,
                                backgroundColor: '#fff',
                                transform: drawerOpen ? 'translateX(0)' : `translateX(${position === 'left' ? '-100%' : '100%'})`,
                                transition: 'transform 0.3s ease',
                                zIndex: 100,
                                boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
                                ...options?.drawerStyle,
                            },
                        },
                        children: screens.map((s, index) => {
                            const screenOptions = typeof s.options === 'function'
                                ? s.options({ route: state.routes[index], navigation })
                                : s.options || {};
                            return {
                                type: 'button',
                                props: {
                                    key: s.name,
                                    style: {
                                        display: 'flex',
                                        alignItems: 'center',
                                        width: '100%',
                                        padding: '16px',
                                        background: index === currentIndex ? 'rgba(0,0,0,0.05)' : 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                    },
                                    onClick: () => navigation.navigate(s.name),
                                },
                                children: [
                                    screenOptions.drawerIcon?.({ focused: index === currentIndex, color: '#333', size: 24 }),
                                    {
                                        type: 'span',
                                        props: { style: { marginLeft: '12px' } },
                                        children: screenOptions.drawerLabel || s.name,
                                    },
                                ],
                            };
                        }),
                    },
                    // Content
                    {
                        type: 'main',
                        props: { style: { flex: 1, overflow: 'auto' } },
                        children: screen.component({ route: currentRoute, navigation }),
                    },
                ].filter(Boolean),
            };
        }
        return {
            type: 'NativeDrawerNavigator',
            props: { state, isOpen: drawerOpen, options },
            children: screen.component({ route: currentRoute, navigation }),
        };
    }
    return {
        Navigator,
        Screen,
        navigation: createNavigation(),
        openDrawer: () => isOpen.set(true),
        closeDrawer: () => isOpen.set(false),
        toggleDrawer: () => isOpen.set(!isOpen()),
    };
}
// ============================================================================
// Deep Linking
// ============================================================================
/**
 * Parse URL path to route
 */
export function parseRoute(path, config) {
    const pathSegments = path.split('/').filter(Boolean);
    for (const [screenName, screenConfig] of Object.entries(config.screens)) {
        const pattern = typeof screenConfig === 'string' ? screenConfig : screenConfig.path;
        const parse = typeof screenConfig === 'object' ? screenConfig.parse : undefined;
        const patternSegments = pattern.split('/').filter(Boolean);
        if (patternSegments.length !== pathSegments.length)
            continue;
        const params = {};
        let matches = true;
        for (let i = 0; i < patternSegments.length; i++) {
            const patternSeg = patternSegments[i];
            const pathSeg = pathSegments[i];
            if (patternSeg.startsWith(':')) {
                const paramName = patternSeg.slice(1);
                const parseFunc = parse?.[paramName];
                params[paramName] = parseFunc ? parseFunc(pathSeg) : pathSeg;
            }
            else if (patternSeg !== pathSeg) {
                matches = false;
                break;
            }
        }
        if (matches) {
            return { name: screenName, params };
        }
    }
    return null;
}
/**
 * Build URL from route
 */
export function buildPath(name, params, config) {
    const screenConfig = config.screens[name];
    if (!screenConfig)
        return '/';
    const pattern = typeof screenConfig === 'string' ? screenConfig : screenConfig.path;
    return pattern.replace(/:(\w+)/g, (_, paramName) => {
        const value = params[paramName];
        return value !== undefined ? String(value) : '';
    });
}
/**
 * Set up deep linking
 */
export function setupDeepLinking(config, navigation) {
    if (typeof window === 'undefined')
        return () => { };
    const handleUrl = (url) => {
        const parsed = parseRoute(new URL(url).pathname, config.config);
        if (parsed) {
            navigation.navigate(parsed.name, parsed.params);
        }
    };
    // Handle initial URL
    handleUrl(window.location.href);
    // Handle URL changes
    const handlePopState = () => {
        handleUrl(window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
        window.removeEventListener('popstate', handlePopState);
    };
}
// ============================================================================
// Event Helpers
// ============================================================================
function emitEvent(event, data) {
    eventListeners.get(event)?.forEach((callback) => {
        try {
            callback(data);
        }
        catch (error) {
            console.error(`Navigation event error [${event}]:`, error);
        }
    });
}
// ============================================================================
// Hooks
// ============================================================================
/**
 * Hook to get navigation object
 */
export function useNavigation() {
    const state = navigationState();
    // Return a basic navigation object - in real use, get from context
    return {
        navigate: () => { },
        push: () => { },
        pop: () => { },
        popToTop: () => { },
        goBack: () => { },
        replace: () => { },
        reset: () => { },
        setParams: () => { },
        setOptions: () => { },
        isFocused: () => true,
        canGoBack: () => !!state && state.index > 0,
        getState: () => state,
        getParent: () => undefined,
        addListener: () => () => { },
        dispatch: () => { },
    };
}
/**
 * Hook to get current route
 */
export function useRoute() {
    const state = navigationState();
    if (!state)
        return { key: '', name: '', params: {} };
    return state.routes[state.index];
}
/**
 * Hook to check if screen is focused
 */
export function useIsFocused() {
    return true; // Simplified
}
/**
 * Hook for focus effect
 */
export function useFocusEffect(callback) {
    effect(() => {
        const cleanup = callback();
        return cleanup;
    });
}
// ============================================================================
// Exports
// ============================================================================
export { createStackNavigator as createNativeStack };
export { createTabNavigator as createNativeTabs };
export { createDrawerNavigator as createNativeDrawer };
export default {
    createStackNavigator,
    createTabNavigator,
    createDrawerNavigator,
    parseRoute,
    buildPath,
    setupDeepLinking,
    useNavigation,
    useRoute,
    useIsFocused,
    useFocusEffect,
};
//# sourceMappingURL=index.js.map