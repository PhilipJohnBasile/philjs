
import { signal, effect } from '@philjs/core';

// PhilJS Alpine Mode
// A drop-in replacement for Alpine.js powered by PhilJS Signals

export interface AlpineComponent {
    init?: () => void;
    [key: string]: any;
}

export class PhilAlpine {
    private static stores: Record<string, any> = {};

    static data(name: string, factory: () => AlpineComponent) {
        // Register component factory (stub for directive parser)
        console.log(`[PhilAlpine] Registered data: ${name}`);
    }

    static store(name: string, value: any) {
        PhilAlpine.stores[name] = signal(value);
    }

    static start() {
        // Scan DOM for x-data (stub)
        document.querySelectorAll('[x-data]').forEach(el => {
            console.log('[PhilAlpine] Initializing element', el);
            // In a real implementation, we would parse directives here
            // and bind them to PhilJS signals
        });
        console.log('PhilAlpine started');
    }
}

// Auto-start if CDN loaded
if (typeof window !== 'undefined') {
    (window as any).Alpine = PhilAlpine;
    (window as any).PhilAlpine = PhilAlpine;
    document.addEventListener('DOMContentLoaded', () => {
        PhilAlpine.start();
    });
}
