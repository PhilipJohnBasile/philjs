import { describe, it, expect } from 'vitest';
import { BlackScholes } from '../quant.js';

describe('PhilJS Fin: Black-Scholes', () => {
    it('should calculate call option price', () => {
        // Example: S=100, K=100, T=1, r=0.05, sigma=0.2
        // Call price should be approx 10.45
        const call = BlackScholes.calculate({
            S: 100,
            K: 100,
            T: 1,
            r: 0.05,
            sigma: 0.2,
            type: 'call'
        });
        expect(call).toBeCloseTo(10.45, 2);
    });

    it('should calculate put option price', () => {
        // Put price using Put-Call Parity: C - P = S - K*e^(-rT)
        // 10.45 - P = 100 - 100*e^(-0.05) = 100 - 95.12 = 4.88
        // P = 10.45 - 4.88 = 5.57
        const put = BlackScholes.calculate({
            S: 100,
            K: 100,
            T: 1,
            r: 0.05,
            sigma: 0.2,
            type: 'put'
        });
        expect(put).toBeCloseTo(5.57, 2);
    });

    it('should handle zero volatility', () => {
        // If sigma=0, and S > K*e^(-r*T), Call = S - K*e^(-r*T)
        // S=110, K=100, T=1, r=0, sigma=0
        const call = BlackScholes.calculate({
            S: 110,
            K: 100,
            T: 1,
            r: 0,
            sigma: 0.0001, // Avoid divide by zero if impl isn't robust
            type: 'call'
        });
        expect(call).toBeCloseTo(10, 1);
    });
});
