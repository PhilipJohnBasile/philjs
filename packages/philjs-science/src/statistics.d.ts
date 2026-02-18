/**
 * Statistical Analysis Toolkit
 *
 * Comprehensive statistical functions for scientific computing
 */
/**
 * Calculate the arithmetic mean
 */
export declare function mean(data: number[]): number;
/**
 * Calculate the median
 */
export declare function median(data: number[]): number;
/**
 * Calculate the mode (most frequent value)
 */
export declare function mode(data: number[]): number[];
/**
 * Calculate sample variance
 */
export declare function variance(data: number[], population?: boolean): number;
/**
 * Calculate standard deviation
 */
export declare function standardDeviation(data: number[], population?: boolean): number;
/**
 * Calculate standard error of the mean
 */
export declare function standardError(data: number[]): number;
/**
 * Calculate coefficient of variation
 */
export declare function coefficientOfVariation(data: number[]): number;
/**
 * Calculate skewness
 */
export declare function skewness(data: number[]): number;
/**
 * Calculate kurtosis
 */
export declare function kurtosis(data: number[]): number;
/**
 * Calculate percentile
 */
export declare function percentile(data: number[], p: number): number;
/**
 * Calculate quartiles
 */
export declare function quartiles(data: number[]): {
    q1: number;
    q2: number;
    q3: number;
};
/**
 * Calculate interquartile range
 */
export declare function iqr(data: number[]): number;
/**
 * Get descriptive statistics summary
 */
export declare function describe(data: number[]): DescriptiveStats;
export interface DescriptiveStats {
    count: number;
    mean: number;
    std: number;
    min: number;
    max: number;
    q1: number;
    q2: number;
    q3: number;
    skewness: number;
    kurtosis: number;
}
/**
 * Calculate Pearson correlation coefficient
 */
export declare function pearsonCorrelation(x: number[], y: number[]): number;
/**
 * Calculate Spearman rank correlation
 */
export declare function spearmanCorrelation(x: number[], y: number[]): number;
/**
 * Simple linear regression
 */
export declare function linearRegression(x: number[], y: number[]): LinearRegressionResult;
export interface LinearRegressionResult {
    slope: number;
    intercept: number;
    rSquared: number;
    standardError: number;
}
/**
 * One-sample t-test
 */
export declare function tTest(data: number[], populationMean: number): TTestResult;
/**
 * Two-sample t-test (Welch's t-test)
 */
export declare function tTest2(data1: number[], data2: number[]): TTestResult;
export interface TTestResult {
    t: number;
    df: number;
    pValue: number;
}
/**
 * Chi-squared test for independence
 */
export declare function chiSquaredTest(observed: number[][], expected?: number[][]): ChiSquaredResult;
export interface ChiSquaredResult {
    chiSquared: number;
    df: number;
    pValue: number;
}
/**
 * Standard normal CDF approximation
 */
export declare function normalCDF(z: number): number;
