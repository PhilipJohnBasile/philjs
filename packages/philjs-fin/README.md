
# @philjs/fin

Quantitative Finance Engine.

## Features
- **Option Pricing**: Black-Scholes and Binomial models.
- **Backtesting**: Historical strategy simulation.

## Usage
```typescript
import { Quant } from '@philjs/fin';
const price = Quant.blackScholes('call', 100, 100, 1, 0.05, 0.2);
```
