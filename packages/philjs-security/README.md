
# @philjs/security

Autonomous Security Scanner (SAST).

## Features
- **AutoPatch**: Detects XSS, SQLi, and PII leaks, then fixes them.
- **Zero Config**: Scans entire repository by default.

## Usage
```typescript
import { scanAndPatch } from '@philjs/security';
const report = await scanAndPatch();
```
