
# Quantitative Finance (`@philjs/fin`)

Wall Street algorithms in JavaScript.

## Models
- **Black-Scholes**: Option pricing.
- **Monte Carlo**: Risk simulation.
- **Backtesting**: Validate trading strategies.

```typescript
import { Quant } from '@philjs/fin';
const price = Quant.blackScholes('call', 100, 100, 1, 0.05, 0.2);
```
