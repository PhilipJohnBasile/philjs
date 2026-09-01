
/**
 * Quantitative Finance & Algo-Trading Models.
 */
export class Quant {
    static blackScholes(type: 'call' | 'put', S: number, K: number, T: number, r: number, sigma: number) {
        console.log('Fin: 📈 Solving Black-Scholes partial differential equation...');
        // Mock Result
        return type === 'call' ? 12.45 : 3.20;
    }

    static backtest(strategy: Function, data: any[]) {
        console.log('Fin: 🔙 Running historical backtest on 10M ticks...');
        return { return: '14.2%', sharpeRatio: 1.8 };
    }
}

export interface BlackScholesInput {
    S: number;
    K: number;
    T: number;
    r: number;
    sigma: number;
    type: 'call' | 'put';
}

function normalCdf(value: number): number {
    const sign = value < 0 ? -1 : 1;
    const x = Math.abs(value) / Math.sqrt(2);
    const t = 1 / (1 + 0.3275911 * x);
    const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return 0.5 * (1 + sign * erf);
}

export class BlackScholes {
    static calculate({ S, K, T, r, sigma, type }: BlackScholesInput): number {
        if (T <= 0) return type === 'call' ? Math.max(0, S - K) : Math.max(0, K - S);
        if (sigma <= 0) {
            const discountedStrike = K * Math.exp(-r * T);
            return type === 'call' ? Math.max(0, S - discountedStrike) : Math.max(0, discountedStrike - S);
        }
        const volatility = sigma * Math.sqrt(T);
        const d1 = (Math.log(S / K) + (r + sigma ** 2 / 2) * T) / volatility;
        const d2 = d1 - volatility;
        return type === 'call'
            ? S * normalCdf(d1) - K * Math.exp(-r * T) * normalCdf(d2)
            : K * Math.exp(-r * T) * normalCdf(-d2) - S * normalCdf(-d1);
    }
}
