/**
 * Statistical Analysis Toolkit
 *
 * Comprehensive statistical functions for scientific computing
 */

// ============================================================================
// Descriptive Statistics
// ============================================================================

/**
 * Calculate the arithmetic mean
 */
export function mean(data: number[]): number {
  if (data.length === 0) return NaN;
  return data.reduce((a, b) => a + b, 0) / data.length;
}

/**
 * Calculate the median
 */
export function median(data: number[]): number {
  if (data.length === 0) return NaN;
  const sorted = [...data].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? (sorted[mid] ?? NaN) : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

/**
 * Calculate the mode (most frequent value)
 */
export function mode(data: number[]): number[] {
  if (data.length === 0) return [];
  const counts = new Map<number, number>();
  let maxCount = 0;

  for (const val of data) {
    const count = (counts.get(val) ?? 0) + 1;
    counts.set(val, count);
    maxCount = Math.max(maxCount, count);
  }

  const modes: number[] = [];
  for (const [val, count] of counts) {
    if (count === maxCount) modes.push(val);
  }

  return modes;
}

/**
 * Calculate sample variance
 */
export function variance(data: number[], population = false): number {
  if (data.length === 0) return NaN;
  const m = mean(data);
  const squaredDiffs = data.map((x) => (x - m) ** 2);
  const divisor = population ? data.length : data.length - 1;
  return squaredDiffs.reduce((a, b) => a + b, 0) / divisor;
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(data: number[], population = false): number {
  return Math.sqrt(variance(data, population));
}

/**
 * Calculate standard error of the mean
 */
export function standardError(data: number[]): number {
  return standardDeviation(data) / Math.sqrt(data.length);
}

/**
 * Calculate coefficient of variation
 */
export function coefficientOfVariation(data: number[]): number {
  const m = mean(data);
  if (m === 0) return NaN;
  return (standardDeviation(data) / Math.abs(m)) * 100;
}

/**
 * Calculate skewness
 */
export function skewness(data: number[]): number {
  if (data.length < 3) return NaN;
  const n = data.length;
  const m = mean(data);
  const s = standardDeviation(data);
  const sum = data.reduce((acc, x) => acc + ((x - m) / s) ** 3, 0);
  return (n / ((n - 1) * (n - 2))) * sum;
}

/**
 * Calculate kurtosis
 */
export function kurtosis(data: number[]): number {
  if (data.length < 4) return NaN;
  const n = data.length;
  const m = mean(data);
  const s = standardDeviation(data);
  const sum = data.reduce((acc, x) => acc + ((x - m) / s) ** 4, 0);
  const k = ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum;
  const correction = (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));
  return k - correction;
}

/**
 * Calculate percentile
 */
export function percentile(data: number[], p: number): number {
  if (data.length === 0 || p < 0 || p > 100) return NaN;
  const sorted = [...data].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) return sorted[lower] ?? NaN;
  return (sorted[lower] ?? 0) * (1 - weight) + (sorted[upper] ?? 0) * weight;
}

/**
 * Calculate quartiles
 */
export function quartiles(data: number[]): { q1: number; q2: number; q3: number } {
  return {
    q1: percentile(data, 25),
    q2: percentile(data, 50),
    q3: percentile(data, 75),
  };
}

/**
 * Calculate interquartile range
 */
export function iqr(data: number[]): number {
  const q = quartiles(data);
  return q.q3 - q.q1;
}

/**
 * Get descriptive statistics summary
 */
export function describe(data: number[]): DescriptiveStats {
  const sorted = [...data].sort((a, b) => a - b);
  return {
    count: data.length,
    mean: mean(data),
    std: standardDeviation(data),
    min: sorted[0] ?? NaN,
    max: sorted[sorted.length - 1] ?? NaN,
    ...quartiles(data),
    skewness: skewness(data),
    kurtosis: kurtosis(data),
  };
}

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

// ============================================================================
// Correlation and Regression
// ============================================================================

/**
 * Calculate Pearson correlation coefficient
 */
export function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return NaN;

  const n = x.length;
  const meanX = mean(x);
  const meanY = mean(y);

  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;

  for (let i = 0; i < n; i++) {
    const dx = (x[i] ?? 0) - meanX;
    const dy = (y[i] ?? 0) - meanY;
    numerator += dx * dy;
    sumSqX += dx * dx;
    sumSqY += dy * dy;
  }

  const denominator = Math.sqrt(sumSqX * sumSqY);
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Calculate Spearman rank correlation
 */
export function spearmanCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return NaN;

  const rankX = rank(x);
  const rankY = rank(y);

  return pearsonCorrelation(rankX, rankY);
}

/**
 * Assign ranks to data
 */
function rank(data: number[]): number[] {
  const indexed = data.map((val, i) => ({ val, i }));
  indexed.sort((a, b) => a.val - b.val);

  const ranks = new Array(data.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j < indexed.length && indexed[j]?.val === indexed[i]?.val) {
      j++;
    }
    // Average rank for ties
    const avgRank = (i + j + 1) / 2;
    for (let k = i; k < j; k++) {
      const idx = indexed[k]?.i;
      if (idx !== undefined) {
        ranks[idx] = avgRank;
      }
    }
    i = j;
  }

  return ranks;
}

/**
 * Simple linear regression
 */
export function linearRegression(x: number[], y: number[]): LinearRegressionResult {
  if (x.length !== y.length || x.length < 2) {
    return { slope: NaN, intercept: NaN, rSquared: NaN, standardError: NaN };
  }

  const n = x.length;
  const meanX = mean(x);
  const meanY = mean(y);

  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;

  for (let i = 0; i < n; i++) {
    const dx = (x[i] ?? 0) - meanX;
    const dy = (y[i] ?? 0) - meanY;
    sumXY += dx * dy;
    sumXX += dx * dx;
    sumYY += dy * dy;
  }

  const slope = sumXX === 0 ? 0 : sumXY / sumXX;
  const intercept = meanY - slope * meanX;

  // R-squared
  const ssReg = slope * sumXY;
  const rSquared = sumYY === 0 ? 0 : ssReg / sumYY;

  // Standard error of estimate
  let ssResidual = 0;
  for (let i = 0; i < n; i++) {
    const predicted = slope * (x[i] ?? 0) + intercept;
    ssResidual += ((y[i] ?? 0) - predicted) ** 2;
  }
  const standardError = Math.sqrt(ssResidual / (n - 2));

  return { slope, intercept, rSquared, standardError };
}

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  standardError: number;
}

// ============================================================================
// Hypothesis Testing
// ============================================================================

/**
 * One-sample t-test
 */
export function tTest(data: number[], populationMean: number): TTestResult {
  const n = data.length;
  if (n < 2) return { t: NaN, df: NaN, pValue: NaN };

  const sampleMean = mean(data);
  const se = standardError(data);
  const t = (sampleMean - populationMean) / se;
  const df = n - 1;
  const pValue = 2 * (1 - tCDF(Math.abs(t), df));

  return { t, df, pValue };
}

/**
 * Two-sample t-test (Welch's t-test)
 */
export function tTest2(data1: number[], data2: number[]): TTestResult {
  const n1 = data1.length;
  const n2 = data2.length;
  if (n1 < 2 || n2 < 2) return { t: NaN, df: NaN, pValue: NaN };

  const mean1 = mean(data1);
  const mean2 = mean(data2);
  const var1 = variance(data1);
  const var2 = variance(data2);

  const se = Math.sqrt(var1 / n1 + var2 / n2);
  const t = (mean1 - mean2) / se;

  // Welch-Satterthwaite degrees of freedom
  const v1 = var1 / n1;
  const v2 = var2 / n2;
  const df = (v1 + v2) ** 2 / (v1 ** 2 / (n1 - 1) + v2 ** 2 / (n2 - 1));

  const pValue = 2 * (1 - tCDF(Math.abs(t), df));

  return { t, df, pValue };
}

export interface TTestResult {
  t: number;
  df: number;
  pValue: number;
}

/**
 * Chi-squared test for independence
 */
export function chiSquaredTest(observed: number[][], expected?: number[][]): ChiSquaredResult {
  const rows = observed.length;
  const cols = observed[0]?.length ?? 0;

  // Calculate expected values if not provided
  if (!expected) {
    const rowSums = observed.map((row) => row.reduce((a, b) => a + b, 0));
    const colSums: number[] = [];
    for (let j = 0; j < cols; j++) {
      let sum = 0;
      for (let i = 0; i < rows; i++) {
        sum += observed[i]?.[j] ?? 0;
      }
      colSums.push(sum);
    }
    const total = rowSums.reduce((a, b) => a + b, 0);

    expected = [];
    for (let i = 0; i < rows; i++) {
      const row: number[] = [];
      for (let j = 0; j < cols; j++) {
        row.push(((rowSums[i] ?? 0) * (colSums[j] ?? 0)) / total);
      }
      expected.push(row);
    }
  }

  // Calculate chi-squared statistic
  let chiSq = 0;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const o = observed[i]?.[j] ?? 0;
      const e = expected[i]?.[j] ?? 1;
      chiSq += (o - e) ** 2 / e;
    }
  }

  const df = (rows - 1) * (cols - 1);
  const pValue = 1 - chiSquaredCDF(chiSq, df);

  return { chiSquared: chiSq, df, pValue };
}

export interface ChiSquaredResult {
  chiSquared: number;
  df: number;
  pValue: number;
}

// ============================================================================
// Distribution Functions (Approximations)
// ============================================================================

/**
 * Standard normal CDF approximation
 */
export function normalCDF(z: number): number {
  // Approximation using error function
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * z);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Student's t CDF approximation
 */
function tCDF(t: number, df: number): number {
  // Approximation for large df
  if (df >= 30) {
    return normalCDF(t);
  }

  // Beta function approximation for small df
  const x = df / (df + t * t);
  return 1 - 0.5 * incompleteBeta(df / 2, 0.5, x);
}

/**
 * Chi-squared CDF approximation
 */
function chiSquaredCDF(x: number, df: number): number {
  // Using relationship to gamma function
  return lowerGamma(df / 2, x / 2) / gamma(df / 2);
}

// Helper functions for distributions
function gamma(z: number): number {
  // Stirling's approximation
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  }
  z -= 1;
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];

  let x = c[0] ?? 1;
  for (let i = 1; i < g + 2; i++) {
    x += (c[i] ?? 0) / (z + i);
  }

  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

function lowerGamma(a: number, x: number): number {
  // Series expansion
  let sum = 0;
  let term = 1 / a;
  sum += term;

  for (let n = 1; n < 100; n++) {
    term *= x / (a + n);
    sum += term;
    if (Math.abs(term) < 1e-10) break;
  }

  return Math.pow(x, a) * Math.exp(-x) * sum;
}

function incompleteBeta(a: number, b: number, x: number): number {
  // Continued fraction approximation
  const maxIterations = 100;
  const epsilon = 1e-10;

  if (x < 0 || x > 1) return NaN;
  if (x === 0 || x === 1) return x;

  // Use symmetry for better convergence
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - incompleteBeta(b, a, 1 - x);
  }

  let f = 1;
  let c = 1;
  let d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < epsilon) d = epsilon;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= maxIterations; m++) {
    const m2 = 2 * m;

    // Even step
    let num = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
    d = 1 + num * d;
    if (Math.abs(d) < epsilon) d = epsilon;
    c = 1 + num / c;
    if (Math.abs(c) < epsilon) c = epsilon;
    d = 1 / d;
    h *= d * c;

    // Odd step
    num = -((a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
    d = 1 + num * d;
    if (Math.abs(d) < epsilon) d = epsilon;
    c = 1 + num / c;
    if (Math.abs(c) < epsilon) c = epsilon;
    d = 1 / d;
    const delta = d * c;
    h *= delta;

    if (Math.abs(delta - 1) < epsilon) break;
  }

  return (Math.pow(x, a) * Math.pow(1 - x, b) * h) / (a * betaFunc(a, b));
}

function betaFunc(a: number, b: number): number {
  return (gamma(a) * gamma(b)) / gamma(a + b);
}
