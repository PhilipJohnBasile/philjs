/**
 * PhilJS Capacitor Plugin
 */

import { signal, effect } from '@philjs/core';

export interface CapacitorDevice { model: string; platform: string; osVersion: string; }

export function useDevice() {
    const device = signal<CapacitorDevice | null>(null);

    effect(async () => {
        const { Device } = await import('@capacitor/device');
        const info = await Device.getInfo();
        device.set({ model: info.model, platform: info.platform, osVersion: info.osVersion });
    });

    return device;
}

export function useNetwork() {
    const status = signal<'online' | 'offline'>('online');

    effect(async () => {
        const { Network } = await import('@capacitor/network');
        const s = await Network.getStatus();
        status.set(s.connected ? 'online' : 'offline');
        Network.addListener('networkStatusChange', s => status.set(s.connected ? 'online' : 'offline'));
    });

    return status;
}

export function useStorage() {
    return {
        get: async (key: string) => {
            const { Preferences } = await import('@capacitor/preferences');
            const { value } = await Preferences.get({ key });
            return value ? JSON.parse(value) : null;
        },
        set: async (key: string, value: any) => {
            const { Preferences } = await import('@capacitor/preferences');
            await Preferences.set({ key, value: JSON.stringify(value) });
        },
        remove: async (key: string) => {
            const { Preferences } = await import('@capacitor/preferences');
            await Preferences.remove({ key });
        }
    };
}
