# Release Notes Template

Use this template when preparing release notes for PhilJS. Copy this template and fill in the relevant sections based on the changes being released.

---

## PhilJS vX.Y.Z

**Release Date:** YYYY-MM-DD

**Release Type:** Major | Minor | Patch

### Overview

[Provide a brief 2-3 sentence summary of what this release includes and why it matters to users]

---

## Breaking Changes

> Important: This section lists changes that may require updates to your code.

### [Breaking Change Title]

**What Changed:**
[Describe what changed in technical terms]

**Why:**
[Explain the rationale behind this breaking change]

**Migration Path:**
```typescript
// Before
[old code example]

// After
[new code example]
```

**Affected Packages:**
- `philjs-core@X.Y.Z`
- `philjs-compiler@X.Y.Z`
- etc.

---

## New Features

### [Feature Name]

**Description:**
[Explain what this feature does and what problem it solves]

**Example Usage:**
```typescript
import { featureName } from 'philjs-core';

// Example code showing how to use the new feature
```

**Benefits:**
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

**Documentation:** [Link to docs]

**Package:** `package-name@X.Y.Z`

---

## Bug Fixes

### [Bug Fix Title]

**Issue:** [Brief description of the bug]

**Resolution:** [How it was fixed]

**Impact:** [What users can expect now]

**Package:** `package-name@X.Y.Z`

**Related Issues:** #123, #456

---

## Performance Improvements

### [Performance Improvement Title]

**Optimization:** [What was optimized]

**Benchmark Results:**
- Before: [metric]
- After: [metric]
- Improvement: [percentage or absolute improvement]

**Impact:**
[Describe the real-world impact on user applications]

**Package:** `package-name@X.Y.Z`

---

## Documentation Updates

- [Documentation update 1]
- [Documentation update 2]
- [Documentation update 3]

---

## Migration Guide

> For users upgrading from version X.X.X to X.Y.Z

### Step 1: Update Dependencies

```bash
pnpm add philjs-core@latest philjs-compiler@latest
# or
npm install philjs-core@latest philjs-compiler@latest
# or
yarn add philjs-core@latest philjs-compiler@latest
```

### Step 2: Handle Breaking Changes

#### [Breaking Change 1]

1. [Step-by-step migration instruction]
2. [Next step]
3. [Final step]

**Codemod Available:** [Yes/No - link if available]

#### [Breaking Change 2]

[Similar format as above]

### Step 3: Update Configuration

[Any configuration changes needed]

### Step 4: Test Your Application

Run your test suite to ensure everything works as expected:

```bash
npm test
```

### Step 5: Update Type Definitions

If you're using TypeScript, you may need to update type imports:

```typescript
// Old imports
import type { OldType } from 'philjs-core';

// New imports
import type { NewType } from 'philjs-core';
```

---

## Deprecation Notices

### [Feature/API Being Deprecated]

**Status:** Deprecated in vX.Y.Z, will be removed in vX.Y.Z

**Reason:** [Why this is being deprecated]

**Alternative:**
```typescript
// Instead of deprecated API
deprecatedFunction();

// Use this
newFunction();
```

---

## Package Versions

This release includes the following package versions:

| Package | Version | Changes |
|---------|---------|---------|
| `philjs-core` | X.Y.Z | [Major/Minor/Patch] |
| `philjs-compiler` | X.Y.Z | [Major/Minor/Patch] |
| `philjs-islands` | X.Y.Z | [Major/Minor/Patch] |
| `philjs-router` | X.Y.Z | [Major/Minor/Patch] |
| `philjs-devtools-extension` | X.Y.Z | [Major/Minor/Patch] |

---

## Credits

Special thanks to the following contributors who made this release possible:

- @contributor1 - [contribution description]
- @contributor2 - [contribution description]
- @contributor3 - [contribution description]

And thank you to everyone who reported issues, provided feedback, and helped improve PhilJS!

---

## Installation

### NPM
```bash
npm install philjs-core@latest
```

### PNPM
```bash
pnpm add philjs-core@latest
```

### Yarn
```bash
yarn add philjs-core@latest
```

---

## Resources

- [Documentation](https://github.com/yourusername/philjs)
- [Examples](https://github.com/yourusername/philjs/tree/main/examples)
- [Migration Guide](https://github.com/yourusername/philjs/blob/main/docs/migrations/vX.Y.Z.md)
- [Changelog](https://github.com/yourusername/philjs/blob/main/CHANGELOG.md)
- [GitHub Releases](https://github.com/yourusername/philjs/releases)

---

## What's Next

[Brief preview of what's coming in the next release or roadmap items]

---

## Feedback

We'd love to hear your feedback on this release!

- Report bugs: [GitHub Issues](https://github.com/yourusername/philjs/issues)
- Feature requests: [GitHub Discussions](https://github.com/yourusername/philjs/discussions)
- Join the community: [Discord/Slack link if available]

---

**Full Changelog:** vX.X.X...vX.Y.Z
