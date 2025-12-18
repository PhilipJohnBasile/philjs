# Performance Metrics

This directory contains performance benchmark baselines and historical data for PhilJS.

## Files

- **benchmark-baseline.json**: Current baseline for performance tests (updated on push to main)
- **benchmark-history.json**: Historical performance data (last 50 runs)
- **bundle-size-baseline.json**: Bundle size baseline for size regression testing
- **bundle-size-history.json**: Historical bundle size data

## Benchmark Workflow

The `.github/workflows/benchmark.yml` workflow runs automated performance benchmarks:

### On Pull Requests
- Runs all performance tests in `packages/philjs-core/src/performance.test.ts` and `benchmarks.test.ts`
- Compares results against baseline from the base branch
- Fails the build if performance regresses by >10%
- Posts detailed benchmark results as a PR comment showing:
  - Performance regressions (tests that got >10% slower)
  - Performance improvements (tests that got >10% faster)
  - New tests added
  - Overall summary statistics

### On Push to Main
- Runs all performance tests
- Updates the baseline with new results
- Commits updated baseline back to the repository
- Appends results to historical data

## Performance Test Structure

The performance tests measure:

### Signal Performance
- Signal creation speed (1K, 10K, 100K signals)
- Signal update speed (1K, 100K updates)
- Computed/memo performance (1K memos, diamond dependencies)
- Effect performance (1K effects, batched updates)

### SSR Performance
- Simple component rendering (1K renders)
- Nested component rendering (100 renders at depth 10)
- List rendering (1K items)
- Complex dashboard rendering (100 users)

### Real-World Scenarios
- Counter app (1K increments)
- Todo app (add/remove 1K items)
- Form validation (100 fields)

### Memory Efficiency
- Memory usage with 100K signals
- Effect cleanup and disposal

## Threshold Guidelines

- **Regression threshold**: 10% slower than baseline = failure
- **Improvement threshold**: 10% faster than baseline = noted
- **CI variability**: Tests have relaxed thresholds (2x) to account for CI environment variance

## Local Testing

To run benchmarks locally:

```bash
# Run all performance tests
pnpm --filter philjs-core vitest run src/performance.test.ts src/benchmarks.test.ts

# Run with verbose output
pnpm --filter philjs-core vitest run src/performance.test.ts src/benchmarks.test.ts --reporter=verbose

# Run benchmarks using the script
pnpm bench

# Save benchmark results
pnpm bench:save
```

## Interpreting Results

- Performance tests use `performance.now()` for timing
- All timings are in milliseconds
- Tests include console.log output showing actual durations
- Lower durations = better performance
- Tests are designed to be stable but can vary by ~10-20% between runs

## Maintaining Baselines

Baselines are automatically updated on push to main. If you need to manually reset:

1. Delete `metrics/benchmark-baseline.json`
2. Push to main - new baseline will be created
3. Alternatively, run locally and commit: `pnpm bench:save && git add metrics/`

## Best Practices

1. Review benchmark comments on PRs before merging
2. Investigate any regressions - they may indicate performance issues
3. Celebrate improvements but verify they're real (not test artifacts)
4. Keep tests focused and deterministic
5. Avoid network calls or I/O in performance tests
6. Use relaxed thresholds for CI (environments vary)
