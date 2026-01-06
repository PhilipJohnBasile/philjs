import { describe, it, expect } from 'vitest';
import { BCIDevice } from '../bci.js';

describe('PhilJS Neuro: BCI', () => {
    it('should connect to synthetic device', async () => {
        const device = new BCIDevice({ type: 'synthetic' });
        await device.connect();
        expect(device.connected).toBe(true);
    });

    it('should stream EEG data', async () => {
        const device = new BCIDevice({ type: 'synthetic' });
        await device.connect();

        const sample = await device.readSample();
        expect(sample.channels.length).toBeGreaterThan(0);
        expect(typeof sample.timestamp).toBe('number');
    });

    it('should compute FFT (mocked)', () => {
        const device = new BCIDevice({ type: 'synthetic' });
        const bands = device.computeBands([1, 2, 3, 4]); // Mock input
        expect(bands.alpha).toBeDefined();
        expect(bands.beta).toBeDefined();
    });
});
