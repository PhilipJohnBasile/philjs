/**
 * @philjs/fin - Comprehensive Quantitative Finance & Algorithmic Trading Toolkit
 *
 * A reactive financial analysis library built on PhilJS signals for real-time
 * market data processing, quantitative modeling, and algorithmic trading.
 *
 * Features:
 * - Real-time market data streaming with reactive signals
 * - Options pricing models (Black-Scholes, Binomial, Monte Carlo)
 * - Technical analysis indicators (SMA, EMA, RSI, MACD, Bollinger Bands)
 * - Portfolio optimization and risk management
 * - Backtesting engine with performance analytics
 * - Order management system
 * - WebSocket market data adapters
 *
 * @packageDocumentation
 */
import { signal, computed, effect, batch } from '@philjs/core';
/** Creates a reactive market data store */
export function createMarketDataStore() {
    return {
        prices: signal(new Map()),
        ohlcv: signal(new Map()),
        orderBooks: signal(new Map()),
        lastUpdate: signal(Date.now()),
        isConnected: signal(false),
        errors: signal([])
    };
}
/** Creates a reactive portfolio store */
export function createPortfolioStore(initialCash = 100000) {
    const positions = signal(new Map());
    const orders = signal(new Map());
    const trades = signal([]);
    const cash = signal(initialCash);
    const totalValue = computed(() => {
        let positionValue = 0;
        for (const pos of positions.value.values()) {
            positionValue += pos.marketValue;
        }
        return cash.value + positionValue;
    });
    const dayPnL = computed(() => {
        let pnl = 0;
        for (const pos of positions.value.values()) {
            pnl += pos.unrealizedPnL;
        }
        return pnl;
    });
    return {
        positions,
        orders,
        trades,
        cash,
        totalValue,
        dayPnL
    };
}
/** Creates a reactive strategy store */
export function createStrategyStore() {
    return {
        signals: signal([]),
        indicators: signal(new Map()),
        isRunning: signal(false),
        performance: signal(null)
    };
}
// ============================================================================
// Mathematical Utilities
// ============================================================================
/** Standard normal cumulative distribution function */
function normalCDF(x) {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return 0.5 * (1.0 + sign * y);
}
/** Standard normal probability density function */
function normalPDF(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}
/** Calculate mean of an array */
function mean(values) {
    if (values.length === 0)
        return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
}
/** Calculate standard deviation */
function standardDeviation(values, ddof = 0) {
    if (values.length <= ddof)
        return 0;
    const avg = mean(values);
    const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
    return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - ddof));
}
/** Calculate returns from price series */
function calculateReturns(prices) {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return returns;
}
/** Calculate log returns from price series */
function calculateLogReturns(prices) {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
        returns.push(Math.log(prices[i] / prices[i - 1]));
    }
    return returns;
}
/** Linear regression */
function linearRegression(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
    const sumXX = x.reduce((total, xi) => total + xi * xi, 0);
    const sumYY = y.reduce((total, yi) => total + yi * yi, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const ssRes = y.reduce((total, yi, i) => total + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
    const ssTot = y.reduce((total, yi) => total + Math.pow(yi - sumY / n, 2), 0);
    const r2 = 1 - ssRes / ssTot;
    return { slope, intercept, r2 };
}
/** Covariance between two series */
function covariance(x, y) {
    const n = Math.min(x.length, y.length);
    const meanX = mean(x.slice(0, n));
    const meanY = mean(y.slice(0, n));
    let cov = 0;
    for (let i = 0; i < n; i++) {
        cov += (x[i] - meanX) * (y[i] - meanY);
    }
    return cov / n;
}
/** Correlation between two series */
function correlation(x, y) {
    const cov = covariance(x, y);
    const stdX = standardDeviation(x);
    const stdY = standardDeviation(y);
    if (stdX === 0 || stdY === 0)
        return 0;
    return cov / (stdX * stdY);
}
// ============================================================================
// Options Pricing Models
// ============================================================================
/** Black-Scholes-Merton option pricing model */
export class BlackScholes {
    /**
     * Calculate option price using Black-Scholes formula
     * @param type - 'call' or 'put'
     * @param S - Current stock price
     * @param K - Strike price
     * @param T - Time to expiration in years
     * @param r - Risk-free interest rate (annualized)
     * @param sigma - Volatility (annualized)
     * @param q - Dividend yield (optional, default 0)
     */
    static price(type, S, K, T, r, sigma, q = 0) {
        if (T <= 0) {
            return type === 'call' ? Math.max(0, S - K) : Math.max(0, K - S);
        }
        const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
        const d2 = d1 - sigma * Math.sqrt(T);
        if (type === 'call') {
            return S * Math.exp(-q * T) * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2);
        }
        else {
            return K * Math.exp(-r * T) * normalCDF(-d2) - S * Math.exp(-q * T) * normalCDF(-d1);
        }
    }
    /** Calculate option delta */
    static delta(type, S, K, T, r, sigma, q = 0) {
        if (T <= 0) {
            if (type === 'call')
                return S > K ? 1 : 0;
            return S < K ? -1 : 0;
        }
        const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
        if (type === 'call') {
            return Math.exp(-q * T) * normalCDF(d1);
        }
        else {
            return Math.exp(-q * T) * (normalCDF(d1) - 1);
        }
    }
    /** Calculate option gamma */
    static gamma(S, K, T, r, sigma, q = 0) {
        if (T <= 0)
            return 0;
        const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
        return Math.exp(-q * T) * normalPDF(d1) / (S * sigma * Math.sqrt(T));
    }
    /** Calculate option theta (per day) */
    static theta(type, S, K, T, r, sigma, q = 0) {
        if (T <= 0)
            return 0;
        const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
        const d2 = d1 - sigma * Math.sqrt(T);
        const term1 = -S * Math.exp(-q * T) * normalPDF(d1) * sigma / (2 * Math.sqrt(T));
        if (type === 'call') {
            const term2 = q * S * Math.exp(-q * T) * normalCDF(d1);
            const term3 = -r * K * Math.exp(-r * T) * normalCDF(d2);
            return (term1 + term2 + term3) / 365;
        }
        else {
            const term2 = -q * S * Math.exp(-q * T) * normalCDF(-d1);
            const term3 = r * K * Math.exp(-r * T) * normalCDF(-d2);
            return (term1 + term2 + term3) / 365;
        }
    }
    /** Calculate option vega (per 1% change in volatility) */
    static vega(S, K, T, r, sigma, q = 0) {
        if (T <= 0)
            return 0;
        const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
        return S * Math.exp(-q * T) * normalPDF(d1) * Math.sqrt(T) / 100;
    }
    /** Calculate option rho (per 1% change in interest rate) */
    static rho(type, S, K, T, r, sigma, q = 0) {
        if (T <= 0)
            return 0;
        const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
        const d2 = d1 - sigma * Math.sqrt(T);
        if (type === 'call') {
            return K * T * Math.exp(-r * T) * normalCDF(d2) / 100;
        }
        else {
            return -K * T * Math.exp(-r * T) * normalCDF(-d2) / 100;
        }
    }
    /** Calculate implied volatility using Newton-Raphson method */
    static impliedVolatility(type, marketPrice, S, K, T, r, q = 0, tolerance = 0.0001, maxIterations = 100) {
        let sigma = 0.2; // Initial guess
        for (let i = 0; i < maxIterations; i++) {
            const price = this.price(type, S, K, T, r, sigma, q);
            const vega = this.vega(S, K, T, r, sigma, q) * 100; // Convert back from percentage
            if (Math.abs(vega) < 1e-10)
                break;
            const diff = marketPrice - price;
            if (Math.abs(diff) < tolerance)
                return sigma;
            sigma += diff / vega;
            if (sigma <= 0)
                sigma = 0.001;
        }
        return sigma;
    }
    /** Calculate all Greeks at once */
    static greeks(type, S, K, T, r, sigma, q = 0) {
        return {
            delta: this.delta(type, S, K, T, r, sigma, q),
            gamma: this.gamma(S, K, T, r, sigma, q),
            theta: this.theta(type, S, K, T, r, sigma, q),
            vega: this.vega(S, K, T, r, sigma, q),
            rho: this.rho(type, S, K, T, r, sigma, q)
        };
    }
}
/** Binomial options pricing model */
export class BinomialTree {
    /**
     * Calculate option price using Cox-Ross-Rubinstein binomial tree
     * @param type - 'call' or 'put'
     * @param style - 'european' or 'american'
     * @param S - Current stock price
     * @param K - Strike price
     * @param T - Time to expiration in years
     * @param r - Risk-free interest rate
     * @param sigma - Volatility
     * @param steps - Number of time steps
     */
    static price(type, style, S, K, T, r, sigma, steps = 100) {
        const dt = T / steps;
        const u = Math.exp(sigma * Math.sqrt(dt));
        const d = 1 / u;
        const p = (Math.exp(r * dt) - d) / (u - d);
        const discount = Math.exp(-r * dt);
        // Initialize asset prices at maturity
        const prices = new Array(steps + 1);
        for (let i = 0; i <= steps; i++) {
            prices[i] = S * Math.pow(u, steps - i) * Math.pow(d, i);
        }
        // Calculate option values at maturity
        const values = new Array(steps + 1);
        for (let i = 0; i <= steps; i++) {
            if (type === 'call') {
                values[i] = Math.max(0, prices[i] - K);
            }
            else {
                values[i] = Math.max(0, K - prices[i]);
            }
        }
        // Work backwards through the tree
        for (let step = steps - 1; step >= 0; step--) {
            for (let i = 0; i <= step; i++) {
                const holdValue = discount * (p * values[i] + (1 - p) * values[i + 1]);
                if (style === 'american') {
                    const assetPrice = S * Math.pow(u, step - i) * Math.pow(d, i);
                    const exerciseValue = type === 'call'
                        ? Math.max(0, assetPrice - K)
                        : Math.max(0, K - assetPrice);
                    values[i] = Math.max(holdValue, exerciseValue);
                }
                else {
                    values[i] = holdValue;
                }
            }
        }
        return values[0];
    }
}
/** Monte Carlo option pricing */
export class MonteCarlo {
    /**
     * Calculate option price using Monte Carlo simulation
     * @param type - 'call' or 'put'
     * @param S - Current stock price
     * @param K - Strike price
     * @param T - Time to expiration in years
     * @param r - Risk-free interest rate
     * @param sigma - Volatility
     * @param simulations - Number of simulation paths
     * @param steps - Number of time steps per path
     */
    static price(type, S, K, T, r, sigma, simulations = 10000, steps = 252) {
        const dt = T / steps;
        const drift = (r - 0.5 * sigma * sigma) * dt;
        const diffusion = sigma * Math.sqrt(dt);
        const discount = Math.exp(-r * T);
        const payoffs = [];
        for (let sim = 0; sim < simulations; sim++) {
            let price = S;
            for (let step = 0; step < steps; step++) {
                const z = this.boxMuller();
                price *= Math.exp(drift + diffusion * z);
            }
            const payoff = type === 'call'
                ? Math.max(0, price - K)
                : Math.max(0, K - price);
            payoffs.push(payoff);
        }
        const avgPayoff = mean(payoffs);
        const stdDev = standardDeviation(payoffs, 1);
        const standardError = stdDev / Math.sqrt(simulations);
        const price = discount * avgPayoff;
        const se = discount * standardError;
        return {
            price,
            standardError: se,
            confidenceInterval: [price - 1.96 * se, price + 1.96 * se]
        };
    }
    /** Box-Muller transform for generating standard normal random numbers */
    static boxMuller() {
        const u1 = Math.random();
        const u2 = Math.random();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }
}
// ============================================================================
// Technical Analysis Indicators
// ============================================================================
/** Technical Analysis indicator calculations */
export class TechnicalAnalysis {
    /** Simple Moving Average */
    static SMA(prices, period) {
        const result = [];
        for (let i = period - 1; i < prices.length; i++) {
            const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            result.push(sum / period);
        }
        return result;
    }
    /** Exponential Moving Average */
    static EMA(prices, period) {
        const result = [];
        const multiplier = 2 / (period + 1);
        // Start with SMA for first value
        let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
        result.push(ema);
        for (let i = period; i < prices.length; i++) {
            ema = (prices[i] - ema) * multiplier + ema;
            result.push(ema);
        }
        return result;
    }
    /** Weighted Moving Average */
    static WMA(prices, period) {
        const result = [];
        const weightSum = (period * (period + 1)) / 2;
        for (let i = period - 1; i < prices.length; i++) {
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += prices[i - period + 1 + j] * (j + 1);
            }
            result.push(sum / weightSum);
        }
        return result;
    }
    /** Relative Strength Index */
    static RSI(prices, period = 14) {
        const result = [];
        const gains = [];
        const losses = [];
        for (let i = 1; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            gains.push(change > 0 ? change : 0);
            losses.push(change < 0 ? -change : 0);
        }
        let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
        let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
        for (let i = period; i <= gains.length; i++) {
            if (avgLoss === 0) {
                result.push(100);
            }
            else {
                const rs = avgGain / avgLoss;
                result.push(100 - 100 / (1 + rs));
            }
            if (i < gains.length) {
                avgGain = (avgGain * (period - 1) + gains[i]) / period;
                avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
            }
        }
        return result;
    }
    /** Moving Average Convergence Divergence */
    static MACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        const fastEMA = this.EMA(prices, fastPeriod);
        const slowEMA = this.EMA(prices, slowPeriod);
        const offset = slowPeriod - fastPeriod;
        const macd = [];
        for (let i = 0; i < slowEMA.length; i++) {
            macd.push(fastEMA[i + offset] - slowEMA[i]);
        }
        const signal = this.EMA(macd, signalPeriod);
        const signalOffset = signalPeriod - 1;
        const histogram = [];
        for (let i = 0; i < signal.length; i++) {
            histogram.push(macd[i + signalOffset] - signal[i]);
        }
        return { macd, signal, histogram };
    }
    /** Bollinger Bands */
    static BollingerBands(prices, period = 20, stdDev = 2) {
        const middle = this.SMA(prices, period);
        const upper = [];
        const lower = [];
        for (let i = period - 1; i < prices.length; i++) {
            const slice = prices.slice(i - period + 1, i + 1);
            const std = standardDeviation(slice);
            const idx = i - period + 1;
            upper.push(middle[idx] + stdDev * std);
            lower.push(middle[idx] - stdDev * std);
        }
        return { upper, middle, lower };
    }
    /** Average True Range */
    static ATR(ohlcv, period = 14) {
        const trueRanges = [];
        for (let i = 0; i < ohlcv.length; i++) {
            const { high, low, close } = ohlcv[i];
            if (i === 0) {
                trueRanges.push(high - low);
            }
            else {
                const prevClose = ohlcv[i - 1].close;
                const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
                trueRanges.push(tr);
            }
        }
        return this.EMA(trueRanges, period);
    }
    /** Stochastic Oscillator */
    static Stochastic(ohlcv, kPeriod = 14, dPeriod = 3) {
        const k = [];
        for (let i = kPeriod - 1; i < ohlcv.length; i++) {
            const slice = ohlcv.slice(i - kPeriod + 1, i + 1);
            const highest = Math.max(...slice.map(c => c.high));
            const lowest = Math.min(...slice.map(c => c.low));
            const current = ohlcv[i].close;
            if (highest === lowest) {
                k.push(50);
            }
            else {
                k.push(((current - lowest) / (highest - lowest)) * 100);
            }
        }
        const d = this.SMA(k, dPeriod);
        return { k, d };
    }
    /** Average Directional Index */
    static ADX(ohlcv, period = 14) {
        const plusDM = [];
        const minusDM = [];
        const tr = [];
        for (let i = 1; i < ohlcv.length; i++) {
            const highDiff = ohlcv[i].high - ohlcv[i - 1].high;
            const lowDiff = ohlcv[i - 1].low - ohlcv[i].low;
            plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
            minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);
            const { high, low, close } = ohlcv[i];
            const prevClose = ohlcv[i - 1].close;
            tr.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
        }
        const smoothedPlusDM = this.EMA(plusDM, period);
        const smoothedMinusDM = this.EMA(minusDM, period);
        const smoothedTR = this.EMA(tr, period);
        const plusDI = [];
        const minusDI = [];
        const dx = [];
        for (let i = 0; i < smoothedTR.length; i++) {
            const pdi = (smoothedPlusDM[i] / smoothedTR[i]) * 100;
            const mdi = (smoothedMinusDM[i] / smoothedTR[i]) * 100;
            plusDI.push(pdi);
            minusDI.push(mdi);
            const sum = pdi + mdi;
            dx.push(sum === 0 ? 0 : (Math.abs(pdi - mdi) / sum) * 100);
        }
        const adx = this.EMA(dx, period);
        return { adx, plusDI, minusDI };
    }
    /** On-Balance Volume */
    static OBV(ohlcv) {
        const result = [0];
        for (let i = 1; i < ohlcv.length; i++) {
            const prevOBV = result[i - 1];
            if (ohlcv[i].close > ohlcv[i - 1].close) {
                result.push(prevOBV + ohlcv[i].volume);
            }
            else if (ohlcv[i].close < ohlcv[i - 1].close) {
                result.push(prevOBV - ohlcv[i].volume);
            }
            else {
                result.push(prevOBV);
            }
        }
        return result;
    }
    /** Volume Weighted Average Price */
    static VWAP(ohlcv) {
        const result = [];
        let cumulativeTPV = 0;
        let cumulativeVolume = 0;
        for (const candle of ohlcv) {
            const typicalPrice = (candle.high + candle.low + candle.close) / 3;
            cumulativeTPV += typicalPrice * candle.volume;
            cumulativeVolume += candle.volume;
            result.push(cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : typicalPrice);
        }
        return result;
    }
    /** Commodity Channel Index */
    static CCI(ohlcv, period = 20) {
        const typicalPrices = ohlcv.map(c => (c.high + c.low + c.close) / 3);
        const result = [];
        for (let i = period - 1; i < typicalPrices.length; i++) {
            const slice = typicalPrices.slice(i - period + 1, i + 1);
            const sma = mean(slice);
            const meanDeviation = mean(slice.map(p => Math.abs(p - sma)));
            const tp = typicalPrices[i];
            result.push(meanDeviation === 0 ? 0 : (tp - sma) / (0.015 * meanDeviation));
        }
        return result;
    }
    /** Williams %R */
    static WilliamsR(ohlcv, period = 14) {
        const result = [];
        for (let i = period - 1; i < ohlcv.length; i++) {
            const slice = ohlcv.slice(i - period + 1, i + 1);
            const highest = Math.max(...slice.map(c => c.high));
            const lowest = Math.min(...slice.map(c => c.low));
            const close = ohlcv[i].close;
            if (highest === lowest) {
                result.push(-50);
            }
            else {
                result.push(((highest - close) / (highest - lowest)) * -100);
            }
        }
        return result;
    }
    /** Parabolic SAR */
    static ParabolicSAR(ohlcv, acceleration = 0.02, maxAcceleration = 0.2) {
        if (ohlcv.length < 2)
            return [];
        const result = [];
        let isUptrend = ohlcv[1].close > ohlcv[0].close;
        let sar = isUptrend ? ohlcv[0].low : ohlcv[0].high;
        let ep = isUptrend ? ohlcv[0].high : ohlcv[0].low;
        let af = acceleration;
        result.push(sar);
        for (let i = 1; i < ohlcv.length; i++) {
            const { high, low } = ohlcv[i];
            if (isUptrend) {
                sar = sar + af * (ep - sar);
                sar = Math.min(sar, ohlcv[i - 1].low, i > 1 ? ohlcv[i - 2].low : ohlcv[i - 1].low);
                if (low < sar) {
                    isUptrend = false;
                    sar = ep;
                    ep = low;
                    af = acceleration;
                }
                else {
                    if (high > ep) {
                        ep = high;
                        af = Math.min(af + acceleration, maxAcceleration);
                    }
                }
            }
            else {
                sar = sar + af * (ep - sar);
                sar = Math.max(sar, ohlcv[i - 1].high, i > 1 ? ohlcv[i - 2].high : ohlcv[i - 1].high);
                if (high > sar) {
                    isUptrend = true;
                    sar = ep;
                    ep = high;
                    af = acceleration;
                }
                else {
                    if (low < ep) {
                        ep = low;
                        af = Math.min(af + acceleration, maxAcceleration);
                    }
                }
            }
            result.push(sar);
        }
        return result;
    }
}
// ============================================================================
// Candlestick Pattern Recognition
// ============================================================================
/** Candlestick pattern detector */
export class PatternRecognition {
    static BODY_THRESHOLD = 0.1;
    static DOJI_THRESHOLD = 0.05;
    /** Detect all patterns in OHLCV data */
    static detectAll(ohlcv) {
        const patterns = [];
        for (let i = 0; i < ohlcv.length; i++) {
            if (this.isDoji(ohlcv[i])) {
                patterns.push({ pattern: 'doji', startIndex: i, endIndex: i, confidence: 0.8, bullish: false });
            }
            if (this.isHammer(ohlcv[i])) {
                patterns.push({ pattern: 'hammer', startIndex: i, endIndex: i, confidence: 0.75, bullish: true });
            }
            if (this.isHangingMan(ohlcv[i])) {
                patterns.push({ pattern: 'hanging_man', startIndex: i, endIndex: i, confidence: 0.7, bullish: false });
            }
            if (this.isSpinningTop(ohlcv[i])) {
                patterns.push({ pattern: 'spinning_top', startIndex: i, endIndex: i, confidence: 0.6, bullish: false });
            }
            if (i >= 1) {
                if (this.isBullishEngulfing(ohlcv[i - 1], ohlcv[i])) {
                    patterns.push({ pattern: 'engulfing_bullish', startIndex: i - 1, endIndex: i, confidence: 0.85, bullish: true });
                }
                if (this.isBearishEngulfing(ohlcv[i - 1], ohlcv[i])) {
                    patterns.push({ pattern: 'engulfing_bearish', startIndex: i - 1, endIndex: i, confidence: 0.85, bullish: false });
                }
                if (this.isBullishHarami(ohlcv[i - 1], ohlcv[i])) {
                    patterns.push({ pattern: 'harami_bullish', startIndex: i - 1, endIndex: i, confidence: 0.7, bullish: true });
                }
                if (this.isBearishHarami(ohlcv[i - 1], ohlcv[i])) {
                    patterns.push({ pattern: 'harami_bearish', startIndex: i - 1, endIndex: i, confidence: 0.7, bullish: false });
                }
                if (this.isPiercingLine(ohlcv[i - 1], ohlcv[i])) {
                    patterns.push({ pattern: 'piercing_line', startIndex: i - 1, endIndex: i, confidence: 0.75, bullish: true });
                }
                if (this.isDarkCloudCover(ohlcv[i - 1], ohlcv[i])) {
                    patterns.push({ pattern: 'dark_cloud_cover', startIndex: i - 1, endIndex: i, confidence: 0.75, bullish: false });
                }
            }
            if (i >= 2) {
                if (this.isMorningStar(ohlcv[i - 2], ohlcv[i - 1], ohlcv[i])) {
                    patterns.push({ pattern: 'morning_star', startIndex: i - 2, endIndex: i, confidence: 0.9, bullish: true });
                }
                if (this.isEveningStar(ohlcv[i - 2], ohlcv[i - 1], ohlcv[i])) {
                    patterns.push({ pattern: 'evening_star', startIndex: i - 2, endIndex: i, confidence: 0.9, bullish: false });
                }
                if (this.isThreeWhiteSoldiers(ohlcv[i - 2], ohlcv[i - 1], ohlcv[i])) {
                    patterns.push({ pattern: 'three_white_soldiers', startIndex: i - 2, endIndex: i, confidence: 0.85, bullish: true });
                }
                if (this.isThreeBlackCrows(ohlcv[i - 2], ohlcv[i - 1], ohlcv[i])) {
                    patterns.push({ pattern: 'three_black_crows', startIndex: i - 2, endIndex: i, confidence: 0.85, bullish: false });
                }
            }
        }
        return patterns;
    }
    static bodySize(candle) {
        return Math.abs(candle.close - candle.open);
    }
    static range(candle) {
        return candle.high - candle.low;
    }
    static isBullish(candle) {
        return candle.close > candle.open;
    }
    static isDoji(candle) {
        const bodyRatio = this.bodySize(candle) / this.range(candle);
        return bodyRatio < this.DOJI_THRESHOLD;
    }
    static isHammer(candle) {
        const body = this.bodySize(candle);
        const range = this.range(candle);
        const lowerWick = Math.min(candle.open, candle.close) - candle.low;
        const upperWick = candle.high - Math.max(candle.open, candle.close);
        return lowerWick >= 2 * body && upperWick <= body * 0.5 && body / range > this.BODY_THRESHOLD;
    }
    static isHangingMan(candle) {
        return this.isHammer(candle);
    }
    static isSpinningTop(candle) {
        const body = this.bodySize(candle);
        const range = this.range(candle);
        const lowerWick = Math.min(candle.open, candle.close) - candle.low;
        const upperWick = candle.high - Math.max(candle.open, candle.close);
        return body / range < 0.3 && Math.abs(lowerWick - upperWick) / range < 0.3;
    }
    static isBullishEngulfing(prev, curr) {
        return !this.isBullish(prev) && this.isBullish(curr) &&
            curr.open < prev.close && curr.close > prev.open;
    }
    static isBearishEngulfing(prev, curr) {
        return this.isBullish(prev) && !this.isBullish(curr) &&
            curr.open > prev.close && curr.close < prev.open;
    }
    static isBullishHarami(prev, curr) {
        return !this.isBullish(prev) && this.isBullish(curr) &&
            curr.open > prev.close && curr.close < prev.open;
    }
    static isBearishHarami(prev, curr) {
        return this.isBullish(prev) && !this.isBullish(curr) &&
            curr.open < prev.close && curr.close > prev.open;
    }
    static isPiercingLine(prev, curr) {
        const prevMid = (prev.open + prev.close) / 2;
        return !this.isBullish(prev) && this.isBullish(curr) &&
            curr.open < prev.low && curr.close > prevMid && curr.close < prev.open;
    }
    static isDarkCloudCover(prev, curr) {
        const prevMid = (prev.open + prev.close) / 2;
        return this.isBullish(prev) && !this.isBullish(curr) &&
            curr.open > prev.high && curr.close < prevMid && curr.close > prev.open;
    }
    static isMorningStar(first, second, third) {
        return !this.isBullish(first) && this.isBullish(third) &&
            this.bodySize(second) < this.bodySize(first) * 0.3 &&
            second.close < first.close && third.close > (first.open + first.close) / 2;
    }
    static isEveningStar(first, second, third) {
        return this.isBullish(first) && !this.isBullish(third) &&
            this.bodySize(second) < this.bodySize(first) * 0.3 &&
            second.close > first.close && third.close < (first.open + first.close) / 2;
    }
    static isThreeWhiteSoldiers(first, second, third) {
        return this.isBullish(first) && this.isBullish(second) && this.isBullish(third) &&
            second.open > first.open && second.close > first.close &&
            third.open > second.open && third.close > second.close;
    }
    static isThreeBlackCrows(first, second, third) {
        return !this.isBullish(first) && !this.isBullish(second) && !this.isBullish(third) &&
            second.open < first.open && second.close < first.close &&
            third.open < second.open && third.close < second.close;
    }
}
// ============================================================================
// Risk Management
// ============================================================================
/** Risk analysis and portfolio metrics */
export class RiskManager {
    /** Calculate Value at Risk (VaR) using historical simulation */
    static historicalVaR(returns, confidence = 0.95) {
        const sorted = [...returns].sort((a, b) => a - b);
        const index = Math.floor((1 - confidence) * sorted.length);
        return -sorted[index];
    }
    /** Calculate parametric VaR */
    static parametricVaR(returns, confidence = 0.95) {
        const mu = mean(returns);
        const sigma = standardDeviation(returns);
        const zScore = this.getZScore(confidence);
        return -(mu - zScore * sigma);
    }
    /** Calculate Conditional VaR (Expected Shortfall) */
    static conditionalVaR(returns, confidence = 0.95) {
        const sorted = [...returns].sort((a, b) => a - b);
        const cutoffIndex = Math.floor((1 - confidence) * sorted.length);
        const tailReturns = sorted.slice(0, cutoffIndex + 1);
        return -mean(tailReturns);
    }
    /** Calculate maximum drawdown */
    static maxDrawdown(equityCurve) {
        let peak = equityCurve[0];
        let peakIndex = 0;
        let maxDrawdown = 0;
        let maxPeakIndex = 0;
        let maxTroughIndex = 0;
        for (let i = 1; i < equityCurve.length; i++) {
            if (equityCurve[i] > peak) {
                peak = equityCurve[i];
                peakIndex = i;
            }
            const drawdown = (peak - equityCurve[i]) / peak;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
                maxPeakIndex = peakIndex;
                maxTroughIndex = i;
            }
        }
        return { maxDrawdown, peakIndex: maxPeakIndex, troughIndex: maxTroughIndex };
    }
    /** Calculate Sharpe Ratio */
    static sharpeRatio(returns, riskFreeRate = 0.02) {
        const excessReturns = returns.map(r => r - riskFreeRate / 252);
        const mu = mean(excessReturns) * 252;
        const sigma = standardDeviation(excessReturns) * Math.sqrt(252);
        return sigma === 0 ? 0 : mu / sigma;
    }
    /** Calculate Sortino Ratio */
    static sortinoRatio(returns, riskFreeRate = 0.02, targetReturn = 0) {
        const excessReturns = returns.map(r => r - riskFreeRate / 252);
        const mu = mean(excessReturns) * 252;
        const downsideReturns = returns.filter(r => r < targetReturn);
        if (downsideReturns.length === 0)
            return Infinity;
        const downsideDeviation = Math.sqrt(downsideReturns.reduce((sum, r) => sum + Math.pow(r - targetReturn, 2), 0) / downsideReturns.length) * Math.sqrt(252);
        return downsideDeviation === 0 ? 0 : mu / downsideDeviation;
    }
    /** Calculate Calmar Ratio */
    static calmarRatio(returns, equityCurve) {
        const annualizedReturn = mean(returns) * 252;
        const { maxDrawdown } = this.maxDrawdown(equityCurve);
        return maxDrawdown === 0 ? 0 : annualizedReturn / maxDrawdown;
    }
    /** Calculate Beta relative to benchmark */
    static beta(assetReturns, benchmarkReturns) {
        const cov = covariance(assetReturns, benchmarkReturns);
        const benchmarkVar = Math.pow(standardDeviation(benchmarkReturns), 2);
        return benchmarkVar === 0 ? 0 : cov / benchmarkVar;
    }
    /** Calculate Alpha (Jensen's Alpha) */
    static alpha(assetReturns, benchmarkReturns, riskFreeRate = 0.02) {
        const assetReturn = mean(assetReturns) * 252;
        const benchmarkReturn = mean(benchmarkReturns) * 252;
        const beta = this.beta(assetReturns, benchmarkReturns);
        return assetReturn - (riskFreeRate + beta * (benchmarkReturn - riskFreeRate));
    }
    /** Calculate Information Ratio */
    static informationRatio(assetReturns, benchmarkReturns) {
        const excessReturns = assetReturns.map((r, i) => r - benchmarkReturns[i]);
        const trackingError = standardDeviation(excessReturns) * Math.sqrt(252);
        const excessReturn = mean(excessReturns) * 252;
        return trackingError === 0 ? 0 : excessReturn / trackingError;
    }
    /** Calculate Treynor Ratio */
    static treynorRatio(assetReturns, benchmarkReturns, riskFreeRate = 0.02) {
        const excessReturn = mean(assetReturns) * 252 - riskFreeRate;
        const beta = this.beta(assetReturns, benchmarkReturns);
        return beta === 0 ? 0 : excessReturn / beta;
    }
    /** Calculate all risk metrics */
    static analyze(returns, equityCurve, benchmarkReturns, riskFreeRate = 0.02) {
        const benchmark = benchmarkReturns || returns.map(() => 0);
        return {
            valueAtRisk: this.parametricVaR(returns),
            conditionalVaR: this.conditionalVaR(returns),
            expectedShortfall: this.conditionalVaR(returns),
            beta: this.beta(returns, benchmark),
            correlation: correlation(returns, benchmark),
            trackingError: standardDeviation(returns.map((r, i) => r - benchmark[i])) * Math.sqrt(252),
            informationRatio: this.informationRatio(returns, benchmark),
            maxDrawdown: this.maxDrawdown(equityCurve).maxDrawdown,
            volatility: standardDeviation(returns) * Math.sqrt(252),
            downsideDeviation: Math.sqrt(returns.filter(r => r < 0).reduce((sum, r) => sum + r * r, 0) / returns.filter(r => r < 0).length || 1) * Math.sqrt(252)
        };
    }
    static getZScore(confidence) {
        const zScores = {
            0.90: 1.282,
            0.95: 1.645,
            0.99: 2.326
        };
        return zScores[confidence] || 1.645;
    }
}
// ============================================================================
// Portfolio Optimization
// ============================================================================
/** Portfolio optimization using Modern Portfolio Theory */
export class PortfolioOptimizer {
    /** Calculate efficient frontier */
    static efficientFrontier(returns, expectedReturns, numPortfolios = 100) {
        const n = expectedReturns.length;
        const covMatrix = this.covarianceMatrix(returns);
        const results = [];
        for (let i = 0; i < numPortfolios; i++) {
            const weights = this.randomWeights(n);
            const portfolioReturn = this.portfolioReturn(weights, expectedReturns);
            const portfolioRisk = this.portfolioRisk(weights, covMatrix);
            const sharpe = portfolioRisk === 0 ? 0 : portfolioReturn / portfolioRisk;
            results.push({
                weights,
                return: portfolioReturn,
                risk: portfolioRisk,
                sharpe
            });
        }
        return results.sort((a, b) => a.risk - b.risk);
    }
    /** Find minimum variance portfolio */
    static minimumVariancePortfolio(returns, expectedReturns) {
        const n = expectedReturns.length;
        const covMatrix = this.covarianceMatrix(returns);
        let bestWeights = this.equalWeights(n);
        let bestRisk = Infinity;
        for (let iter = 0; iter < 1000; iter++) {
            const weights = this.randomWeights(n);
            const risk = this.portfolioRisk(weights, covMatrix);
            if (risk < bestRisk) {
                bestRisk = risk;
                bestWeights = weights;
            }
        }
        return {
            weights: bestWeights,
            return: this.portfolioReturn(bestWeights, expectedReturns),
            risk: bestRisk
        };
    }
    /** Find maximum Sharpe ratio portfolio */
    static maxSharpePortfolio(returns, expectedReturns, riskFreeRate = 0.02) {
        const n = expectedReturns.length;
        const covMatrix = this.covarianceMatrix(returns);
        let bestWeights = this.equalWeights(n);
        let bestSharpe = -Infinity;
        for (let iter = 0; iter < 1000; iter++) {
            const weights = this.randomWeights(n);
            const portfolioReturn = this.portfolioReturn(weights, expectedReturns);
            const portfolioRisk = this.portfolioRisk(weights, covMatrix);
            const sharpe = portfolioRisk === 0 ? 0 : (portfolioReturn - riskFreeRate) / portfolioRisk;
            if (sharpe > bestSharpe) {
                bestSharpe = sharpe;
                bestWeights = weights;
            }
        }
        return {
            weights: bestWeights,
            return: this.portfolioReturn(bestWeights, expectedReturns),
            risk: this.portfolioRisk(bestWeights, this.covarianceMatrix(returns)),
            sharpe: bestSharpe
        };
    }
    /** Calculate covariance matrix from returns */
    static covarianceMatrix(returns) {
        const n = returns.length;
        const matrix = Array(n).fill(null).map(() => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                matrix[i][j] = covariance(returns[i], returns[j]);
            }
        }
        return matrix;
    }
    /** Calculate portfolio return */
    static portfolioReturn(weights, expectedReturns) {
        return weights.reduce((sum, w, i) => sum + w * expectedReturns[i], 0);
    }
    /** Calculate portfolio risk (volatility) */
    static portfolioRisk(weights, covMatrix) {
        let variance = 0;
        for (let i = 0; i < weights.length; i++) {
            for (let j = 0; j < weights.length; j++) {
                variance += weights[i] * weights[j] * covMatrix[i][j];
            }
        }
        return Math.sqrt(variance * 252);
    }
    static randomWeights(n) {
        const weights = Array(n).fill(0).map(() => Math.random());
        const sum = weights.reduce((a, b) => a + b, 0);
        return weights.map(w => w / sum);
    }
    static equalWeights(n) {
        return Array(n).fill(1 / n);
    }
}
// ============================================================================
// Backtesting Engine
// ============================================================================
/** Strategy backtesting engine */
export class Backtester {
    config;
    data = new Map();
    positions = new Map();
    cash;
    trades = [];
    equityCurve = [];
    constructor(config) {
        this.config = config;
        this.cash = config.initialCapital;
    }
    /** Load historical data for backtesting */
    loadData(symbol, ohlcv) {
        const filtered = ohlcv.filter(bar => bar.timestamp >= this.config.startDate.getTime() &&
            bar.timestamp <= this.config.endDate.getTime());
        this.data.set(symbol, filtered);
    }
    /** Execute a buy order */
    buy(symbol, quantity, price, timestamp) {
        const cost = quantity * price;
        const slippage = this.calculateSlippage(price, quantity);
        const totalCost = cost + slippage + cost * this.config.commissionRate;
        if (totalCost > this.cash)
            return false;
        this.cash -= totalCost;
        const currentPosition = this.positions.get(symbol) || 0;
        this.positions.set(symbol, currentPosition + quantity);
        this.trades.push({
            id: `trade_${this.trades.length}`,
            symbol,
            side: 'buy',
            price: price + slippage / quantity,
            quantity,
            timestamp,
            fee: cost * this.config.commissionRate,
            feeCurrency: 'USD'
        });
        return true;
    }
    /** Execute a sell order */
    sell(symbol, quantity, price, timestamp) {
        const currentPosition = this.positions.get(symbol) || 0;
        if (quantity > currentPosition && !this.config.shortingAllowed)
            return false;
        const proceeds = quantity * price;
        const slippage = this.calculateSlippage(price, quantity);
        const netProceeds = proceeds - slippage - proceeds * this.config.commissionRate;
        this.cash += netProceeds;
        this.positions.set(symbol, currentPosition - quantity);
        this.trades.push({
            id: `trade_${this.trades.length}`,
            symbol,
            side: 'sell',
            price: price - slippage / quantity,
            quantity,
            timestamp,
            fee: proceeds * this.config.commissionRate,
            feeCurrency: 'USD'
        });
        return true;
    }
    /** Run backtest with a strategy function */
    run(strategy) {
        const allTimestamps = new Set();
        for (const ohlcv of this.data.values()) {
            for (const bar of ohlcv) {
                allTimestamps.add(bar.timestamp);
            }
        }
        const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);
        for (const timestamp of sortedTimestamps) {
            const currentPrices = new Map();
            for (const [symbol, ohlcv] of this.data.entries()) {
                const bar = ohlcv.find(b => b.timestamp === timestamp);
                if (bar)
                    currentPrices.set(symbol, bar.close);
            }
            const buy = (symbol, quantity) => {
                const price = currentPrices.get(symbol);
                if (!price)
                    return false;
                return this.buy(symbol, quantity, price, timestamp);
            };
            const sell = (symbol, quantity) => {
                const price = currentPrices.get(symbol);
                if (!price)
                    return false;
                return this.sell(symbol, quantity, price, timestamp);
            };
            strategy(timestamp, this.data, this.positions, this.cash, buy, sell);
            const portfolioValue = this.calculatePortfolioValue(currentPrices);
            this.equityCurve.push({ timestamp, value: portfolioValue });
        }
        return this.calculateResults();
    }
    calculateSlippage(price, quantity) {
        switch (this.config.slippageModel) {
            case 'fixed':
                return this.config.slippageValue * quantity;
            case 'percentage':
                return price * quantity * this.config.slippageValue;
            case 'volume_based':
                return price * quantity * this.config.slippageValue * Math.sqrt(quantity);
            default:
                return 0;
        }
    }
    calculatePortfolioValue(prices) {
        let positionValue = 0;
        for (const [symbol, quantity] of this.positions.entries()) {
            const price = prices.get(symbol) || 0;
            positionValue += quantity * price;
        }
        return this.cash + positionValue;
    }
    calculateResults() {
        const values = this.equityCurve.map(e => e.value);
        const returns = calculateReturns(values);
        const { maxDrawdown, peakIndex, troughIndex } = RiskManager.maxDrawdown(values);
        const wins = this.trades.filter((t, i, arr) => {
            if (t.side === 'buy')
                return false;
            const buyTrade = arr.slice(0, i).reverse().find(bt => bt.symbol === t.symbol && bt.side === 'buy');
            return buyTrade ? t.price > buyTrade.price : false;
        });
        const losses = this.trades.filter((t, i, arr) => {
            if (t.side === 'buy')
                return false;
            const buyTrade = arr.slice(0, i).reverse().find(bt => bt.symbol === t.symbol && bt.side === 'buy');
            return buyTrade ? t.price <= buyTrade.price : false;
        });
        const totalReturn = (values[values.length - 1] - values[0]) / values[0];
        const tradingDays = values.length;
        const annualizedReturn = Math.pow(1 + totalReturn, 252 / tradingDays) - 1;
        return {
            totalReturn,
            annualizedReturn,
            sharpeRatio: RiskManager.sharpeRatio(returns),
            sortinoRatio: RiskManager.sortinoRatio(returns),
            maxDrawdown,
            maxDrawdownDuration: troughIndex - peakIndex,
            winRate: this.trades.length > 0 ? wins.length / (wins.length + losses.length) : 0,
            profitFactor: losses.length > 0 && wins.length > 0
                ? wins.reduce((sum, t) => sum + t.price * t.quantity, 0) /
                    losses.reduce((sum, t) => sum + t.price * t.quantity, 0)
                : 0,
            totalTrades: this.trades.length,
            averageTradeDuration: 0,
            averageWin: wins.length > 0 ? mean(wins.map(t => t.price * t.quantity)) : 0,
            averageLoss: losses.length > 0 ? mean(losses.map(t => t.price * t.quantity)) : 0,
            largestWin: wins.length > 0 ? Math.max(...wins.map(t => t.price * t.quantity)) : 0,
            largestLoss: losses.length > 0 ? Math.max(...losses.map(t => t.price * t.quantity)) : 0,
            calmarRatio: RiskManager.calmarRatio(returns, values),
            volatility: standardDeviation(returns) * Math.sqrt(252),
            beta: 0,
            alpha: 0,
            informationRatio: 0,
            treynorRatio: 0,
            equityCurve: this.equityCurve,
            trades: this.trades,
            monthlyReturns: this.calculateMonthlyReturns()
        };
    }
    calculateMonthlyReturns() {
        const monthly = new Map();
        let prevValue = this.equityCurve[0]?.value || 0;
        let prevMonth = '';
        for (const point of this.equityCurve) {
            const date = new Date(point.timestamp);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthKey !== prevMonth && prevMonth !== '') {
                const monthReturn = (point.value - prevValue) / prevValue;
                monthly.set(prevMonth, monthReturn);
                prevValue = point.value;
            }
            prevMonth = monthKey;
        }
        return monthly;
    }
}
// ============================================================================
// PhilJS Hooks
// ============================================================================
/** Hook for managing market data subscriptions */
export function useMarketData(symbols, config) {
    const store = createMarketDataStore();
    let ws = null;
    let reconnectAttempts = 0;
    const maxReconnects = 5;
    const connect = () => {
        const wsUrl = config?.websocketUrl || 'wss://stream.data.alpaca.markets/v2/iex';
        try {
            ws = new WebSocket(wsUrl);
            ws.onopen = () => {
                store.isConnected.value = true;
                reconnectAttempts = 0;
                if (config?.apiKey) {
                    ws?.send(JSON.stringify({
                        action: 'auth',
                        key: config.apiKey,
                        secret: config.apiSecret
                    }));
                }
                ws?.send(JSON.stringify({
                    action: 'subscribe',
                    trades: symbols,
                    quotes: symbols,
                    bars: symbols
                }));
            };
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                batch(() => {
                    if (data.T === 't') {
                        const prices = new Map(store.prices.value);
                        prices.set(data.S, data.p);
                        store.prices.value = prices;
                    }
                    if (data.T === 'b') {
                        const ohlcv = new Map(store.ohlcv.value);
                        const bars = ohlcv.get(data.S) || [];
                        bars.push({
                            timestamp: new Date(data.t).getTime(),
                            open: data.o,
                            high: data.h,
                            low: data.l,
                            close: data.c,
                            volume: data.v
                        });
                        ohlcv.set(data.S, bars);
                        store.ohlcv.value = ohlcv;
                    }
                    store.lastUpdate.value = Date.now();
                });
            };
            ws.onerror = (error) => {
                const errors = [...store.errors.value, `WebSocket error: ${error}`];
                store.errors.value = errors;
            };
            ws.onclose = () => {
                store.isConnected.value = false;
                if (reconnectAttempts < maxReconnects) {
                    reconnectAttempts++;
                    setTimeout(connect, Math.pow(2, reconnectAttempts) * 1000);
                }
            };
        }
        catch (error) {
            const errors = [...store.errors.value, `Connection error: ${error}`];
            store.errors.value = errors;
        }
    };
    const disconnect = () => {
        if (ws) {
            ws.close();
            ws = null;
        }
    };
    const subscribe = (additionalSymbols) => {
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                action: 'subscribe',
                trades: additionalSymbols,
                quotes: additionalSymbols
            }));
        }
    };
    const unsubscribe = (symbolsToRemove) => {
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                action: 'unsubscribe',
                trades: symbolsToRemove,
                quotes: symbolsToRemove
            }));
        }
    };
    return {
        ...store,
        connect,
        disconnect,
        subscribe,
        unsubscribe
    };
}
/** Hook for portfolio management */
export function usePortfolio(initialCash = 100000) {
    const store = createPortfolioStore(initialCash);
    const updatePosition = (symbol, update) => {
        const positions = new Map(store.positions.value);
        const current = positions.get(symbol);
        if (current) {
            positions.set(symbol, { ...current, ...update });
        }
        else if (update.quantity && update.averageCost) {
            positions.set(symbol, {
                symbol,
                quantity: update.quantity,
                averageCost: update.averageCost,
                currentPrice: update.currentPrice || update.averageCost,
                marketValue: update.quantity * (update.currentPrice || update.averageCost),
                unrealizedPnL: 0,
                unrealizedPnLPercent: 0,
                realizedPnL: 0
            });
        }
        store.positions.value = positions;
    };
    const updatePrices = (prices) => {
        batch(() => {
            const positions = new Map(store.positions.value);
            for (const [symbol, position] of positions.entries()) {
                const price = prices.get(symbol);
                if (price) {
                    const marketValue = position.quantity * price;
                    const costBasis = position.quantity * position.averageCost;
                    const unrealizedPnL = marketValue - costBasis;
                    positions.set(symbol, {
                        ...position,
                        currentPrice: price,
                        marketValue,
                        unrealizedPnL,
                        unrealizedPnLPercent: costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0
                    });
                }
            }
            store.positions.value = positions;
        });
    };
    const closePosition = (symbol, price) => {
        const positions = new Map(store.positions.value);
        const position = positions.get(symbol);
        if (position) {
            const proceeds = position.quantity * price;
            store.cash.value = store.cash.value + proceeds;
            positions.delete(symbol);
            store.positions.value = positions;
        }
    };
    const deposit = (amount) => {
        store.cash.value = store.cash.value + amount;
    };
    const withdraw = (amount) => {
        if (amount > store.cash.value)
            return false;
        store.cash.value = store.cash.value - amount;
        return true;
    };
    return {
        ...store,
        updatePosition,
        updatePrices,
        closePosition,
        deposit,
        withdraw
    };
}
/** Hook for technical analysis */
export function useTechnicalAnalysis(ohlcv) {
    const indicators = signal(new Map());
    const calculate = (indicatorName, config) => {
        const data = ohlcv.value;
        const closes = data.map(c => c.close);
        let result = [];
        switch (indicatorName.toLowerCase()) {
            case 'sma':
                result = TechnicalAnalysis.SMA(closes, config?.period || 20);
                break;
            case 'ema':
                result = TechnicalAnalysis.EMA(closes, config?.period || 20);
                break;
            case 'rsi':
                result = TechnicalAnalysis.RSI(closes, config?.period || 14);
                break;
            case 'atr':
                result = TechnicalAnalysis.ATR(data, config?.period || 14);
                break;
            case 'obv':
                result = TechnicalAnalysis.OBV(data);
                break;
            case 'vwap':
                result = TechnicalAnalysis.VWAP(data);
                break;
            case 'cci':
                result = TechnicalAnalysis.CCI(data, config?.period || 20);
                break;
            case 'williams_r':
                result = TechnicalAnalysis.WilliamsR(data, config?.period || 14);
                break;
            case 'psar':
                result = TechnicalAnalysis.ParabolicSAR(data);
                break;
        }
        const map = new Map(indicators.value);
        map.set(indicatorName, result);
        indicators.value = map;
        return result;
    };
    const calculateMACD = (config) => {
        const closes = ohlcv.value.map(c => c.close);
        const result = TechnicalAnalysis.MACD(closes, config?.fastPeriod || 12, config?.slowPeriod || 26, config?.signalPeriod || 9);
        const map = new Map(indicators.value);
        map.set('macd_line', result.macd);
        map.set('macd_signal', result.signal);
        map.set('macd_histogram', result.histogram);
        indicators.value = map;
        return result;
    };
    const calculateBollinger = (config) => {
        const closes = ohlcv.value.map(c => c.close);
        const result = TechnicalAnalysis.BollingerBands(closes, config?.period || 20, config?.standardDeviations || 2);
        const map = new Map(indicators.value);
        map.set('bb_upper', result.upper);
        map.set('bb_middle', result.middle);
        map.set('bb_lower', result.lower);
        indicators.value = map;
        return result;
    };
    const calculateStochastic = (config) => {
        const result = TechnicalAnalysis.Stochastic(ohlcv.value, config?.period || 14, config?.smoothing || 3);
        const map = new Map(indicators.value);
        map.set('stoch_k', result.k);
        map.set('stoch_d', result.d);
        indicators.value = map;
        return result;
    };
    const calculateADX = (config) => {
        const result = TechnicalAnalysis.ADX(ohlcv.value, config?.period || 14);
        const map = new Map(indicators.value);
        map.set('adx', result.adx);
        map.set('plus_di', result.plusDI);
        map.set('minus_di', result.minusDI);
        indicators.value = map;
        return result;
    };
    const detectPatterns = () => {
        return PatternRecognition.detectAll(ohlcv.value);
    };
    const getLatest = (indicatorName) => {
        const values = indicators.value.get(indicatorName);
        return values ? values[values.length - 1] : undefined;
    };
    return {
        indicators,
        calculate,
        calculateMACD,
        calculateBollinger,
        calculateStochastic,
        calculateADX,
        detectPatterns,
        getLatest
    };
}
/** Hook for options pricing */
export function useOptionsChain(underlying, currentPrice) {
    const chain = signal([]);
    const generateChain = (expirations, strikes, riskFreeRate = 0.05, volatility = 0.25) => {
        const contracts = [];
        const S = currentPrice.value;
        for (const expiration of expirations) {
            const T = (expiration.getTime() - Date.now()) / (365 * 24 * 60 * 60 * 1000);
            if (T <= 0)
                continue;
            for (const strike of strikes) {
                for (const type of ['call', 'put']) {
                    const premium = BlackScholes.price(type, S, strike, T, riskFreeRate, volatility);
                    const greeks = BlackScholes.greeks(type, S, strike, T, riskFreeRate, volatility);
                    contracts.push({
                        underlying,
                        type,
                        strike,
                        expiration,
                        premium,
                        impliedVolatility: volatility,
                        delta: greeks.delta,
                        gamma: greeks.gamma,
                        theta: greeks.theta,
                        vega: greeks.vega,
                        rho: greeks.rho
                    });
                }
            }
        }
        chain.value = contracts;
        return contracts;
    };
    const updateChain = (riskFreeRate = 0.05) => {
        const S = currentPrice.value;
        const updated = chain.value.map(contract => {
            const T = (contract.expiration.getTime() - Date.now()) / (365 * 24 * 60 * 60 * 1000);
            if (T <= 0)
                return contract;
            const premium = BlackScholes.price(contract.type, S, contract.strike, T, riskFreeRate, contract.impliedVolatility);
            const greeks = BlackScholes.greeks(contract.type, S, contract.strike, T, riskFreeRate, contract.impliedVolatility);
            return {
                ...contract,
                premium,
                delta: greeks.delta,
                gamma: greeks.gamma,
                theta: greeks.theta,
                vega: greeks.vega,
                rho: greeks.rho
            };
        });
        chain.value = updated;
        return updated;
    };
    const findByStrike = (strike, type) => {
        return chain.value.filter(c => c.strike === strike && (!type || c.type === type));
    };
    const findByExpiration = (expiration) => {
        return chain.value.filter(c => c.expiration.getTime() === expiration.getTime());
    };
    const getATMOptions = () => {
        const S = currentPrice.value;
        const strikes = [...new Set(chain.value.map(c => c.strike))].sort((a, b) => a - b);
        const atmStrike = strikes.reduce((prev, curr) => Math.abs(curr - S) < Math.abs(prev - S) ? curr : prev);
        return chain.value.filter(c => c.strike === atmStrike);
    };
    return {
        chain,
        generateChain,
        updateChain,
        findByStrike,
        findByExpiration,
        getATMOptions
    };
}
/** Hook for backtesting strategies */
export function useBacktest(config) {
    const backtester = new Backtester(config);
    const results = signal(null);
    const isRunning = signal(false);
    const loadData = (symbol, ohlcv) => {
        backtester.loadData(symbol, ohlcv);
    };
    const run = (strategy) => {
        isRunning.value = true;
        try {
            const result = backtester.run(strategy);
            results.value = result;
            return result;
        }
        finally {
            isRunning.value = false;
        }
    };
    const getSummary = () => {
        const r = results.value;
        if (!r)
            return null;
        return {
            'Total Return': `${(r.totalReturn * 100).toFixed(2)}%`,
            'Annualized Return': `${(r.annualizedReturn * 100).toFixed(2)}%`,
            'Sharpe Ratio': r.sharpeRatio.toFixed(2),
            'Sortino Ratio': r.sortinoRatio.toFixed(2),
            'Max Drawdown': `${(r.maxDrawdown * 100).toFixed(2)}%`,
            'Win Rate': `${(r.winRate * 100).toFixed(2)}%`,
            'Profit Factor': r.profitFactor.toFixed(2),
            'Total Trades': r.totalTrades,
            'Volatility': `${(r.volatility * 100).toFixed(2)}%`
        };
    };
    return {
        results,
        isRunning,
        loadData,
        run,
        getSummary
    };
}
// ============================================================================
// Configuration Generators
// ============================================================================
/** Generate Alpaca API configuration */
export function generateAlpacaConfig(options) {
    return {
        provider: 'alpaca',
        apiKey: options.apiKey,
        apiSecret: options.apiSecret,
        sandbox: options.paper ?? true,
        websocketUrl: options.paper
            ? 'wss://stream.data.sandbox.alpaca.markets/v2/iex'
            : 'wss://stream.data.alpaca.markets/v2/iex',
        restUrl: options.paper
            ? 'https://paper-api.alpaca.markets'
            : 'https://api.alpaca.markets',
        rateLimitPerMinute: 200
    };
}
/** Generate Binance API configuration */
export function generateBinanceConfig(options) {
    return {
        provider: 'binance',
        apiKey: options.apiKey,
        apiSecret: options.apiSecret,
        sandbox: options.testnet ?? false,
        websocketUrl: options.testnet
            ? 'wss://testnet.binance.vision/ws'
            : 'wss://stream.binance.com:9443/ws',
        restUrl: options.testnet
            ? 'https://testnet.binance.vision/api'
            : 'https://api.binance.com/api',
        rateLimitPerMinute: 1200
    };
}
/** Generate Polygon.io API configuration */
export function generatePolygonConfig(options) {
    return {
        provider: 'polygon',
        apiKey: options.apiKey,
        websocketUrl: 'wss://socket.polygon.io/stocks',
        restUrl: 'https://api.polygon.io',
        rateLimitPerMinute: 5
    };
}
/** Generate backtest configuration */
export function generateBacktestConfig(options) {
    return {
        startDate: typeof options.startDate === 'string' ? new Date(options.startDate) : options.startDate,
        endDate: typeof options.endDate === 'string' ? new Date(options.endDate) : options.endDate,
        initialCapital: options.initialCapital ?? 100000,
        commissionRate: options.commissionRate ?? 0.001,
        slippageModel: options.slippage?.model ?? 'percentage',
        slippageValue: options.slippage?.value ?? 0.0005,
        shortingAllowed: options.allowShorting ?? false
    };
}
// ============================================================================
// Re-export legacy API for backwards compatibility
// ============================================================================
/** @deprecated Use BlackScholes class instead */
export class Quant {
    /** @deprecated Use BlackScholes.price() instead */
    static blackScholes(type, S, K, T, r, sigma) {
        return BlackScholes.price(type, S, K, T, r, sigma);
    }
    /** @deprecated Use Backtester class instead */
    static backtest(strategy, data) {
        console.warn('Quant.backtest is deprecated. Use the Backtester class for full functionality.');
        return { return: '0%', sharpeRatio: 0 };
    }
}
// ============================================================================
// Exports
// ============================================================================
export { 
// Utilities
mean, standardDeviation, calculateReturns, calculateLogReturns, linearRegression, covariance, correlation, normalCDF, normalPDF };
//# sourceMappingURL=index.js.map