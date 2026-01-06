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
import { signal, computed } from '@philjs/core';
/** Represents a single price quote with OHLCV data */
export interface OHLCV {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
/** Level 2 order book entry */
export interface OrderBookEntry {
    price: number;
    size: number;
    orders: number;
}
/** Full order book snapshot */
export interface OrderBook {
    symbol: string;
    timestamp: number;
    bids: OrderBookEntry[];
    asks: OrderBookEntry[];
    spread: number;
    midPrice: number;
}
/** Trade execution record */
export interface Trade {
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    price: number;
    quantity: number;
    timestamp: number;
    fee: number;
    feeCurrency: string;
}
/** Order types supported by the system */
export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
/** Order status lifecycle */
export type OrderStatus = 'pending' | 'open' | 'partial' | 'filled' | 'cancelled' | 'rejected';
/** Order definition */
export interface Order {
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    type: OrderType;
    quantity: number;
    price?: number;
    stopPrice?: number;
    trailingPercent?: number;
    timeInForce: 'GTC' | 'IOC' | 'FOK' | 'DAY';
    status: OrderStatus;
    filledQuantity: number;
    averagePrice: number;
    createdAt: number;
    updatedAt: number;
}
/** Position in a single asset */
export interface Position {
    symbol: string;
    quantity: number;
    averageCost: number;
    currentPrice: number;
    marketValue: number;
    unrealizedPnL: number;
    unrealizedPnLPercent: number;
    realizedPnL: number;
}
/** Portfolio holdings and metrics */
export interface Portfolio {
    positions: Map<string, Position>;
    cash: number;
    totalValue: number;
    dayPnL: number;
    dayPnLPercent: number;
    totalPnL: number;
    totalPnLPercent: number;
}
/** Options contract specification */
export interface OptionContract {
    underlying: string;
    type: 'call' | 'put';
    strike: number;
    expiration: Date;
    premium: number;
    impliedVolatility: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
}
/** Market data provider configuration */
export interface MarketDataConfig {
    provider: 'alpaca' | 'polygon' | 'binance' | 'coinbase' | 'yahoo' | 'custom';
    apiKey?: string;
    apiSecret?: string;
    sandbox?: boolean;
    websocketUrl?: string;
    restUrl?: string;
    rateLimitPerMinute?: number;
}
/** Backtest configuration */
export interface BacktestConfig {
    startDate: Date;
    endDate: Date;
    initialCapital: number;
    commissionRate: number;
    slippageModel: 'fixed' | 'percentage' | 'volume_based';
    slippageValue: number;
    marginRequirement?: number;
    shortingAllowed?: boolean;
}
/** Backtest performance metrics */
export interface BacktestResult {
    totalReturn: number;
    annualizedReturn: number;
    sharpeRatio: number;
    sortinoRatio: number;
    maxDrawdown: number;
    maxDrawdownDuration: number;
    winRate: number;
    profitFactor: number;
    totalTrades: number;
    averageTradeDuration: number;
    averageWin: number;
    averageLoss: number;
    largestWin: number;
    largestLoss: number;
    calmarRatio: number;
    volatility: number;
    beta: number;
    alpha: number;
    informationRatio: number;
    treynorRatio: number;
    equityCurve: Array<{
        timestamp: number;
        value: number;
    }>;
    trades: Trade[];
    monthlyReturns: Map<string, number>;
}
/** Technical indicator configuration */
export interface IndicatorConfig {
    period?: number;
    fastPeriod?: number;
    slowPeriod?: number;
    signalPeriod?: number;
    standardDeviations?: number;
    smoothing?: number;
    source?: 'open' | 'high' | 'low' | 'close' | 'hl2' | 'hlc3' | 'ohlc4';
}
/** Risk metrics for portfolio analysis */
export interface RiskMetrics {
    valueAtRisk: number;
    conditionalVaR: number;
    expectedShortfall: number;
    beta: number;
    correlation: number;
    trackingError: number;
    informationRatio: number;
    maxDrawdown: number;
    volatility: number;
    downsideDeviation: number;
}
/** Strategy signal */
export type SignalType = 'buy' | 'sell' | 'hold' | 'close';
export interface StrategySignal {
    symbol: string;
    signal: SignalType;
    strength: number;
    price: number;
    timestamp: number;
    reason: string;
    indicators: Record<string, number>;
}
/** Candlestick pattern */
export type CandlestickPattern = 'doji' | 'hammer' | 'hanging_man' | 'engulfing_bullish' | 'engulfing_bearish' | 'morning_star' | 'evening_star' | 'three_white_soldiers' | 'three_black_crows' | 'harami_bullish' | 'harami_bearish' | 'piercing_line' | 'dark_cloud_cover' | 'spinning_top';
export interface PatternMatch {
    pattern: CandlestickPattern;
    startIndex: number;
    endIndex: number;
    confidence: number;
    bullish: boolean;
}
/** Market data store for real-time price tracking */
export interface MarketDataStore {
    prices: ReturnType<typeof signal<Map<string, number>>>;
    ohlcv: ReturnType<typeof signal<Map<string, OHLCV[]>>>;
    orderBooks: ReturnType<typeof signal<Map<string, OrderBook>>>;
    lastUpdate: ReturnType<typeof signal<number>>;
    isConnected: ReturnType<typeof signal<boolean>>;
    errors: ReturnType<typeof signal<string[]>>;
}
/** Creates a reactive market data store */
export declare function createMarketDataStore(): MarketDataStore;
/** Portfolio store for tracking positions and orders */
export interface PortfolioStore {
    positions: ReturnType<typeof signal<Map<string, Position>>>;
    orders: ReturnType<typeof signal<Map<string, Order>>>;
    trades: ReturnType<typeof signal<Trade[]>>;
    cash: ReturnType<typeof signal<number>>;
    totalValue: ReturnType<typeof computed<number>>;
    dayPnL: ReturnType<typeof computed<number>>;
}
/** Creates a reactive portfolio store */
export declare function createPortfolioStore(initialCash?: number): PortfolioStore;
/** Strategy store for tracking signals and performance */
export interface StrategyStore {
    signals: ReturnType<typeof signal<StrategySignal[]>>;
    indicators: ReturnType<typeof signal<Map<string, Map<string, number>>>>;
    isRunning: ReturnType<typeof signal<boolean>>;
    performance: ReturnType<typeof signal<BacktestResult | null>>;
}
/** Creates a reactive strategy store */
export declare function createStrategyStore(): StrategyStore;
/** Standard normal cumulative distribution function */
declare function normalCDF(x: number): number;
/** Standard normal probability density function */
declare function normalPDF(x: number): number;
/** Calculate mean of an array */
declare function mean(values: number[]): number;
/** Calculate standard deviation */
declare function standardDeviation(values: number[], ddof?: number): number;
/** Calculate returns from price series */
declare function calculateReturns(prices: number[]): number[];
/** Calculate log returns from price series */
declare function calculateLogReturns(prices: number[]): number[];
/** Linear regression */
declare function linearRegression(x: number[], y: number[]): {
    slope: number;
    intercept: number;
    r2: number;
};
/** Covariance between two series */
declare function covariance(x: number[], y: number[]): number;
/** Correlation between two series */
declare function correlation(x: number[], y: number[]): number;
/** Black-Scholes-Merton option pricing model */
export declare class BlackScholes {
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
    static price(type: 'call' | 'put', S: number, K: number, T: number, r: number, sigma: number, q?: number): number;
    /** Calculate option delta */
    static delta(type: 'call' | 'put', S: number, K: number, T: number, r: number, sigma: number, q?: number): number;
    /** Calculate option gamma */
    static gamma(S: number, K: number, T: number, r: number, sigma: number, q?: number): number;
    /** Calculate option theta (per day) */
    static theta(type: 'call' | 'put', S: number, K: number, T: number, r: number, sigma: number, q?: number): number;
    /** Calculate option vega (per 1% change in volatility) */
    static vega(S: number, K: number, T: number, r: number, sigma: number, q?: number): number;
    /** Calculate option rho (per 1% change in interest rate) */
    static rho(type: 'call' | 'put', S: number, K: number, T: number, r: number, sigma: number, q?: number): number;
    /** Calculate implied volatility using Newton-Raphson method */
    static impliedVolatility(type: 'call' | 'put', marketPrice: number, S: number, K: number, T: number, r: number, q?: number, tolerance?: number, maxIterations?: number): number;
    /** Calculate all Greeks at once */
    static greeks(type: 'call' | 'put', S: number, K: number, T: number, r: number, sigma: number, q?: number): {
        delta: number;
        gamma: number;
        theta: number;
        vega: number;
        rho: number;
    };
}
/** Binomial options pricing model */
export declare class BinomialTree {
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
    static price(type: 'call' | 'put', style: 'european' | 'american', S: number, K: number, T: number, r: number, sigma: number, steps?: number): number;
}
/** Monte Carlo option pricing */
export declare class MonteCarlo {
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
    static price(type: 'call' | 'put', S: number, K: number, T: number, r: number, sigma: number, simulations?: number, steps?: number): {
        price: number;
        standardError: number;
        confidenceInterval: [number, number];
    };
    /** Box-Muller transform for generating standard normal random numbers */
    private static boxMuller;
}
/** Technical Analysis indicator calculations */
export declare class TechnicalAnalysis {
    /** Simple Moving Average */
    static SMA(prices: number[], period: number): number[];
    /** Exponential Moving Average */
    static EMA(prices: number[], period: number): number[];
    /** Weighted Moving Average */
    static WMA(prices: number[], period: number): number[];
    /** Relative Strength Index */
    static RSI(prices: number[], period?: number): number[];
    /** Moving Average Convergence Divergence */
    static MACD(prices: number[], fastPeriod?: number, slowPeriod?: number, signalPeriod?: number): {
        macd: number[];
        signal: number[];
        histogram: number[];
    };
    /** Bollinger Bands */
    static BollingerBands(prices: number[], period?: number, stdDev?: number): {
        upper: number[];
        middle: number[];
        lower: number[];
    };
    /** Average True Range */
    static ATR(ohlcv: OHLCV[], period?: number): number[];
    /** Stochastic Oscillator */
    static Stochastic(ohlcv: OHLCV[], kPeriod?: number, dPeriod?: number): {
        k: number[];
        d: number[];
    };
    /** Average Directional Index */
    static ADX(ohlcv: OHLCV[], period?: number): {
        adx: number[];
        plusDI: number[];
        minusDI: number[];
    };
    /** On-Balance Volume */
    static OBV(ohlcv: OHLCV[]): number[];
    /** Volume Weighted Average Price */
    static VWAP(ohlcv: OHLCV[]): number[];
    /** Commodity Channel Index */
    static CCI(ohlcv: OHLCV[], period?: number): number[];
    /** Williams %R */
    static WilliamsR(ohlcv: OHLCV[], period?: number): number[];
    /** Parabolic SAR */
    static ParabolicSAR(ohlcv: OHLCV[], acceleration?: number, maxAcceleration?: number): number[];
}
/** Candlestick pattern detector */
export declare class PatternRecognition {
    private static BODY_THRESHOLD;
    private static DOJI_THRESHOLD;
    /** Detect all patterns in OHLCV data */
    static detectAll(ohlcv: OHLCV[]): PatternMatch[];
    private static bodySize;
    private static range;
    private static isBullish;
    private static isDoji;
    private static isHammer;
    private static isHangingMan;
    private static isSpinningTop;
    private static isBullishEngulfing;
    private static isBearishEngulfing;
    private static isBullishHarami;
    private static isBearishHarami;
    private static isPiercingLine;
    private static isDarkCloudCover;
    private static isMorningStar;
    private static isEveningStar;
    private static isThreeWhiteSoldiers;
    private static isThreeBlackCrows;
}
/** Risk analysis and portfolio metrics */
export declare class RiskManager {
    /** Calculate Value at Risk (VaR) using historical simulation */
    static historicalVaR(returns: number[], confidence?: number): number;
    /** Calculate parametric VaR */
    static parametricVaR(returns: number[], confidence?: number): number;
    /** Calculate Conditional VaR (Expected Shortfall) */
    static conditionalVaR(returns: number[], confidence?: number): number;
    /** Calculate maximum drawdown */
    static maxDrawdown(equityCurve: number[]): {
        maxDrawdown: number;
        peakIndex: number;
        troughIndex: number;
    };
    /** Calculate Sharpe Ratio */
    static sharpeRatio(returns: number[], riskFreeRate?: number): number;
    /** Calculate Sortino Ratio */
    static sortinoRatio(returns: number[], riskFreeRate?: number, targetReturn?: number): number;
    /** Calculate Calmar Ratio */
    static calmarRatio(returns: number[], equityCurve: number[]): number;
    /** Calculate Beta relative to benchmark */
    static beta(assetReturns: number[], benchmarkReturns: number[]): number;
    /** Calculate Alpha (Jensen's Alpha) */
    static alpha(assetReturns: number[], benchmarkReturns: number[], riskFreeRate?: number): number;
    /** Calculate Information Ratio */
    static informationRatio(assetReturns: number[], benchmarkReturns: number[]): number;
    /** Calculate Treynor Ratio */
    static treynorRatio(assetReturns: number[], benchmarkReturns: number[], riskFreeRate?: number): number;
    /** Calculate all risk metrics */
    static analyze(returns: number[], equityCurve: number[], benchmarkReturns?: number[], riskFreeRate?: number): RiskMetrics;
    private static getZScore;
}
/** Portfolio optimization using Modern Portfolio Theory */
export declare class PortfolioOptimizer {
    /** Calculate efficient frontier */
    static efficientFrontier(returns: number[][], expectedReturns: number[], numPortfolios?: number): Array<{
        weights: number[];
        return: number;
        risk: number;
        sharpe: number;
    }>;
    /** Find minimum variance portfolio */
    static minimumVariancePortfolio(returns: number[][], expectedReturns: number[]): {
        weights: number[];
        return: number;
        risk: number;
    };
    /** Find maximum Sharpe ratio portfolio */
    static maxSharpePortfolio(returns: number[][], expectedReturns: number[], riskFreeRate?: number): {
        weights: number[];
        return: number;
        risk: number;
        sharpe: number;
    };
    /** Calculate covariance matrix from returns */
    static covarianceMatrix(returns: number[][]): number[][];
    /** Calculate portfolio return */
    static portfolioReturn(weights: number[], expectedReturns: number[]): number;
    /** Calculate portfolio risk (volatility) */
    static portfolioRisk(weights: number[], covMatrix: number[][]): number;
    private static randomWeights;
    private static equalWeights;
}
/** Strategy backtesting engine */
export declare class Backtester {
    private config;
    private data;
    private positions;
    private cash;
    private trades;
    private equityCurve;
    constructor(config: BacktestConfig);
    /** Load historical data for backtesting */
    loadData(symbol: string, ohlcv: OHLCV[]): void;
    /** Execute a buy order */
    buy(symbol: string, quantity: number, price: number, timestamp: number): boolean;
    /** Execute a sell order */
    sell(symbol: string, quantity: number, price: number, timestamp: number): boolean;
    /** Run backtest with a strategy function */
    run(strategy: (timestamp: number, data: Map<string, OHLCV[]>, positions: Map<string, number>, cash: number, buy: (symbol: string, quantity: number) => boolean, sell: (symbol: string, quantity: number) => boolean) => void): BacktestResult;
    private calculateSlippage;
    private calculatePortfolioValue;
    private calculateResults;
    private calculateMonthlyReturns;
}
/** Hook for managing market data subscriptions */
export declare function useMarketData(symbols: string[], config?: Partial<MarketDataConfig>): {
    connect: () => void;
    disconnect: () => void;
    subscribe: (additionalSymbols: string[]) => void;
    unsubscribe: (symbolsToRemove: string[]) => void;
    prices: ReturnType<typeof signal<Map<string, number>>>;
    ohlcv: ReturnType<typeof signal<Map<string, OHLCV[]>>>;
    orderBooks: ReturnType<typeof signal<Map<string, OrderBook>>>;
    lastUpdate: ReturnType<typeof signal<number>>;
    isConnected: ReturnType<typeof signal<boolean>>;
    errors: ReturnType<typeof signal<string[]>>;
};
/** Hook for portfolio management */
export declare function usePortfolio(initialCash?: number): {
    updatePosition: (symbol: string, update: Partial<Position>) => void;
    updatePrices: (prices: Map<string, number>) => void;
    closePosition: (symbol: string, price: number) => void;
    deposit: (amount: number) => void;
    withdraw: (amount: number) => boolean;
    positions: ReturnType<typeof signal<Map<string, Position>>>;
    orders: ReturnType<typeof signal<Map<string, Order>>>;
    trades: ReturnType<typeof signal<Trade[]>>;
    cash: ReturnType<typeof signal<number>>;
    totalValue: ReturnType<typeof computed<number>>;
    dayPnL: ReturnType<typeof computed<number>>;
};
/** Hook for technical analysis */
export declare function useTechnicalAnalysis(ohlcv: ReturnType<typeof signal<OHLCV[]>>): {
    indicators: any;
    calculate: (indicatorName: string, config?: IndicatorConfig) => number[];
    calculateMACD: (config?: IndicatorConfig) => {
        macd: number[];
        signal: number[];
        histogram: number[];
    };
    calculateBollinger: (config?: IndicatorConfig) => {
        upper: number[];
        middle: number[];
        lower: number[];
    };
    calculateStochastic: (config?: IndicatorConfig) => {
        k: number[];
        d: number[];
    };
    calculateADX: (config?: IndicatorConfig) => {
        adx: number[];
        plusDI: number[];
        minusDI: number[];
    };
    detectPatterns: () => PatternMatch[];
    getLatest: (indicatorName: string) => number | undefined;
};
/** Hook for options pricing */
export declare function useOptionsChain(underlying: string, currentPrice: ReturnType<typeof signal<number>>): {
    chain: any;
    generateChain: (expirations: Date[], strikes: number[], riskFreeRate?: number, volatility?: number) => OptionContract[];
    updateChain: (riskFreeRate?: number) => any;
    findByStrike: (strike: number, type?: "call" | "put") => any;
    findByExpiration: (expiration: Date) => any;
    getATMOptions: () => any;
};
/** Hook for backtesting strategies */
export declare function useBacktest(config: BacktestConfig): {
    results: any;
    isRunning: any;
    loadData: (symbol: string, ohlcv: OHLCV[]) => void;
    run: (strategy: Parameters<(strategy: (timestamp: number, data: Map<string, OHLCV[]>, positions: Map<string, number>, cash: number, buy: (symbol: string, quantity: number) => boolean, sell: (symbol: string, quantity: number) => boolean) => void) => BacktestResult>[0]) => BacktestResult;
    getSummary: () => {
        'Total Return': string;
        'Annualized Return': string;
        'Sharpe Ratio': any;
        'Sortino Ratio': any;
        'Max Drawdown': string;
        'Win Rate': string;
        'Profit Factor': any;
        'Total Trades': any;
        Volatility: string;
    };
};
/** Generate Alpaca API configuration */
export declare function generateAlpacaConfig(options: {
    apiKey: string;
    apiSecret: string;
    paper?: boolean;
}): MarketDataConfig;
/** Generate Binance API configuration */
export declare function generateBinanceConfig(options: {
    apiKey: string;
    apiSecret: string;
    testnet?: boolean;
}): MarketDataConfig;
/** Generate Polygon.io API configuration */
export declare function generatePolygonConfig(options: {
    apiKey: string;
}): MarketDataConfig;
/** Generate backtest configuration */
export declare function generateBacktestConfig(options: {
    startDate: Date | string;
    endDate: Date | string;
    initialCapital?: number;
    commissionRate?: number;
    slippage?: {
        model: 'fixed' | 'percentage' | 'volume_based';
        value: number;
    };
    allowShorting?: boolean;
}): BacktestConfig;
/** @deprecated Use BlackScholes class instead */
export declare class Quant {
    /** @deprecated Use BlackScholes.price() instead */
    static blackScholes(type: 'call' | 'put', S: number, K: number, T: number, r: number, sigma: number): number;
    /** @deprecated Use Backtester class instead */
    static backtest(strategy: Function, data: any[]): {
        return: string;
        sharpeRatio: number;
    };
}
export { mean, standardDeviation, calculateReturns, calculateLogReturns, linearRegression, covariance, correlation, normalCDF, normalPDF };
//# sourceMappingURL=index.d.ts.map