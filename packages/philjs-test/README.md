
# @philjs/test

Autonomous Testing Suite.

## Features
- **Generative Tests**: `describeAI()` writes assertions for you.
- **Fuzzing**: `fuzzAI()` detects edge cases automatically.
- **Auto-Fix**: `attemptTestFix()` patches readable flaky tests.

## Usage
```typescript
import { describeAI } from '@philjs/test';
describeAI("Login Flow", "should block after 3 failed attempts");
```
