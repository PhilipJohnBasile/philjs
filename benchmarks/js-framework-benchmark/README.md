# PhilJS Benchmark

Benchmark implementation for [js-framework-benchmark](https://github.com/nickyvanurk/js-framework-benchmark).

## Operations

| Operation | Description |
|-----------|-------------|
| Create 1,000 rows | Create a table with 1,000 rows |
| Create 10,000 rows | Create a table with 10,000 rows |
| Append 1,000 rows | Add 1,000 rows to existing table |
| Update every 10th row | Modify every 10th row label |
| Select row | Highlight a row |
| Swap rows | Swap two rows (1 and 998) |
| Remove row | Delete a specific row |
| Clear | Remove all rows |

## Running

```bash
# Install dependencies
pnpm install

# Development
pnpm dev

# Build for benchmark
pnpm build
```

## Results

Expected performance characteristics:

- **Bundle size**: ~7KB (minified + gzipped)
- **Create 1000**: <50ms
- **Update**: <10ms (fine-grained updates)
- **Memory**: Low (no virtual DOM diffing)

## Integration with js-framework-benchmark

To add to the official benchmark:

1. Copy `dist/` to `frameworks/keyed/philjs/`
2. Update `frameworks/keyed/philjs/package.json`
3. Run the benchmark suite

## License

MIT
