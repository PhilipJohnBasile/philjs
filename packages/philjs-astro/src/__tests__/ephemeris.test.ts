import { describe, it, expect } from 'vitest';
import { OrbitalMechanics, Vector3 } from '../ephemeris.js';

describe('PhilJS Astro: Orbital Mechanics', () => {
    it('should calculate orbital period via Kepler Third Law', () => {
        // Earth: 1 AU semi-major axis, 1 Solar Mass -> 1 Year period (approx 31.5M seconds)
        const earthOrbit = OrbitalMechanics.keplerPeriod(1.496e11, 1.989e30);
        const yearInSeconds = 365.25 * 24 * 60 * 60;

        // Allow 1% margin of error due to constants precision
        expect(earthOrbit).toBeCloseTo(yearInSeconds, -5);
    });

    it('should calculate gravitational force between two bodies', () => {
        // F = G * m1 * m2 / r^2
        const m1 = 1000;
        const m2 = 1000;
        const r = 10;
        const force = OrbitalMechanics.gravitationalForce(m1, m2, r);

        // G approx 6.674e-11
        // F = 6.674e-11 * 10^6 / 100 = 6.674e-11 * 10^4 = 6.674e-7
        expect(force).toBeCloseTo(6.674e-7, 10);
    });

    it('should propagate state vectors', () => {
        const position = new Vector3(1000, 0, 0);
        const velocity = new Vector3(0, 10, 0); // Moving perp

        // Simple propagation test (just ensures method runs and returns new vectors)
        const newState = OrbitalMechanics.propagate(position, velocity, 1.0);

        expect(newState.position.x).not.toBe(1000); // Should have moved
        expect(newState.velocity).toBeDefined();
    });
});
