import { describe, it, expect } from 'vitest';
import { Hologram } from '../hologram.js';

describe('PhilJS AR: Hologram', () => {
    it('should create holographic entity', () => {
        const holo = new Hologram({
            position: { x: 0, y: 1, z: -2 },
            mesh: 'cube'
        });

        expect(holo.id).toBeDefined();
        expect(holo.position.x).toBe(0);
    });

    it('should support interactions', () => {
        const holo = new Hologram({ mesh: 'sphere' });
        holo.on('select', () => { }); // Should not throw

        expect(holo.hasListeners('select')).toBe(true);
    });

    it('should serialize to WebXR descriptor', () => {
        const holo = new Hologram({ mesh: 'cube' });
        const json = holo.toJSON();

        expect(json.type).toBe('hologram');
        expect(json.mesh).toBe('cube');
    });
});
