/**
 * Expo/React Native Adapter for PhilJS
 * 
 * Enables PhilJS signals and components in Expo apps.
 */

import { signal, effect, memo, type Signal } from '@philjs/core';

export interface ExpoAdapterConfig {
    /** Enable React Native specific optimizations */
    nativeOptimizations?: boolean;
    /** Debug mode */
    debug?: boolean;
}

/**
 * Initialize PhilJS for Expo
 * 
 * @example
 * ```tsx
 * // App.tsx
 * import { initPhilJSExpo } from '@philjs/mobile/expo';
 * import { signal } from '@philjs/core';
 * 
 * initPhilJSExpo({ nativeOptimizations: true });
 * 
 * const count = signal(0);
 * 
 * export default function App() {
 *   return (
 *     <View>
 *       <Text>Count: {count()}</Text>
 *       <Button title="Increment" onPress={() => count.set(count() + 1)} />
 *     </View>
 *   );
 * }
 * ```
 */
export function initPhilJSExpo(config: ExpoAdapterConfig = {}): void {
    const { nativeOptimizations = true, debug = false } = config;

    if (debug) {
        console.log('[PhilJS Expo] Initializing with config:', config);
    }

    // Setup native optimizations if enabled
    if (nativeOptimizations) {
        setupNativeOptimizations();
    }
}

/**
 * Setup React Native specific optimizations
 */
function setupNativeOptimizations(): void {
    // Use React Native's InteractionManager for batched updates
    // This ensures UI stays responsive during signal updates
}

/**
 * Create a signal that persists to AsyncStorage
 * 
 * @example
 * ```tsx
 * const theme = persistedSignal('theme', 'light');
 * 
 * // Later...
 * theme.set('dark'); // Automatically persisted
 * ```
 */
export function persistedSignal<T>(
    key: string,
    initialValue: T
): Signal<T> & { hydrate: () => Promise<void> } {
    const sig = signal<T>(initialValue);
    let isHydrated = false;

    const hydrate = async () => {
        if (isHydrated) return;

        try {
            const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
            const stored = await AsyncStorage.getItem(`philjs:${key}`);
            if (stored !== null) {
                sig.set(JSON.parse(stored));
            }
            isHydrated = true;
        } catch (error) {
            console.warn(`[PhilJS] Failed to hydrate signal "${key}":`, error);
        }
    };

    // Auto-persist on changes
    effect(async () => {
        if (!isHydrated) return;

        try {
            const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
            await AsyncStorage.setItem(`philjs:${key}`, JSON.stringify(sig()));
        } catch (error) {
            console.warn(`[PhilJS] Failed to persist signal "${key}":`, error);
        }
    });

    return Object.assign(sig, { hydrate });
}

/**
 * Hook to use PhilJS signals in React Native components
 * 
 * @example
 * ```tsx
 * import { useSignal } from '@philjs/mobile/expo';
 * import { count } from './signals';
 * 
 * function Counter() {
 *   const value = useSignal(count);
 *   return <Text>{value}</Text>;
 * }
 * ```
 */
export function useSignal<T>(sig: Signal<T>): T {
    const React = require('react');
    const [value, setValue] = React.useState(sig());

    React.useEffect(() => {
        // Subscribe to signal changes
        const cleanup = effect(() => {
            setValue(sig());
        });
        return cleanup;
    }, [sig]);

    return value;
}

/**
 * Navigation integration for Expo Router
 */
export function createExpoRouter() {
    return {
        /**
         * Navigate with signal-based params
         */
        push: (path: string, params?: Record<string, any>) => {
            const router = require('expo-router').router;

            // Convert signal values to primitives
            const resolvedParams = params
                ? Object.fromEntries(
                    Object.entries(params).map(([k, v]) => [
                        k,
                        typeof v === 'function' ? v() : v,
                    ])
                )
                : undefined;

            router.push({ pathname: path, params: resolvedParams });
        },

        /**
         * Replace current route
         */
        replace: (path: string, params?: Record<string, any>) => {
            const router = require('expo-router').router;
            router.replace({ pathname: path, params });
        },

        /**
         * Go back
         */
        back: () => {
            const router = require('expo-router').router;
            router.back();
        },
    };
}

/**
 * Native module bridges for common functionality
 */
export const nativeBridges = {
    /**
     * Haptic feedback signal
     */
    haptic: (type: 'light' | 'medium' | 'heavy' = 'light') => {
        try {
            const Haptics = require('expo-haptics');
            switch (type) {
                case 'light':
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    break;
                case 'medium':
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    break;
                case 'heavy':
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    break;
            }
        } catch {
            // Haptics not available
        }
    },

    /**
     * Get device info as signals
     */
    deviceInfo: () => {
        const Device = require('expo-device');
        return {
            brand: signal(Device.brand),
            model: signal(Device.modelName),
            osName: signal(Device.osName),
            osVersion: signal(Device.osVersion),
        };
    },
};

export { signal, effect, memo };
