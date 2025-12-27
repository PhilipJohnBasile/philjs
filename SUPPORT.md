# Node.js Support Policy

PhilJS officially supports the latest Node.js LTS and Current releases.

## Supported Versions

| Version | Status | Notes |
|---------|--------|-------|
| Node 24 LTS | **Official Baseline** | Minimum required version |
| Node 25 Current | **Supported** | Tested in CI |
| Node 26+ | Planned | Will be added when available |

## Version Policy

- **Baseline**: Node 24 LTS is the minimum supported version. All packages require `node >= 24`.
- **Current**: Node 25 is fully tested and supported for early adopters.
- **New Majors**: New Node.js versions (e.g., Node 26) will be added to CI promptly after release and verified before being officially supported.
- **EOL Versions**: Support for older versions is dropped when they reach Node.js End-of-Life. Node 24 will remain the floor until its EOL date.

## Testing Locally

Run the full test suite on your current Node version:

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
pnpm lint
```

To test on a specific Node version, use a version manager like nvm or fnm:

```bash
# Using nvm
nvm install 24
nvm use 24
pnpm install
pnpm test

# Using fnm
fnm install 24
fnm use 24
pnpm install
pnpm test
```

## Version Pinning for Development

The repository includes version pinning files for consistent development environments:

- `.nvmrc` - Node 24 (for nvm, fnm, and similar tools)
- `.node-version` - Node 24 (for asdf and other tools)

These files specify the baseline version. Contributors can use newer versions (e.g., Node 25) but the baseline ensures consistent behavior.

## CI Matrix

Every pull request runs the full test suite on:

- **Node 24.x** (Ubuntu, Windows, macOS)
- **Node 25.x** (Ubuntu, Windows, macOS)

All CI jobs must pass before merging.

## Compatibility Notes

### Node 24 vs Node 25

PhilJS uses stable Node.js APIs and has no known compatibility issues between Node 24 and Node 25. The codebase uses:

- `crypto` module for security operations (stable)
- `fs/promises` for file operations (stable)
- `stream/promises` for streaming (stable)
- Web Streams API (`ReadableStream`, `WritableStream`) (stable)
- `fetch()` global (stable)
- ES Modules with `import.meta` (stable)

### Reporting Issues

If you encounter Node version-specific behavior:

1. Note your exact Node version (`node --version`)
2. Check if the issue reproduces on both Node 24 and Node 25
3. Open an issue with reproduction steps and version details

## Package Manager

PhilJS requires **pnpm 9.15.4** or later. The version is specified in `package.json`:

```json
{
  "packageManager": "pnpm@9.15.4"
}
```

Install pnpm via corepack:

```bash
corepack enable
corepack prepare pnpm@9.15.4 --activate
```
