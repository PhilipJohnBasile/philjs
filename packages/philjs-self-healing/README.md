
# @philjs/self-healing

Resilient Runtime & Auto-Repair.

## Features
- **Error Boundaries**: `SelfHealBarrier` catches and patches errors.
- **Pattern Matching**: Library of known fixes for runtime exceptions.
- **Metrics**: Track stability scores.

## Usage
```tsx
import { SelfHealingBarrier } from '@philjs/self-healing';
<SelfHealingBarrier>
  <App />
</SelfHealingBarrier>
```
