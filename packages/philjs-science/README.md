
# @philjs/science

Scientific Computing Primitives.

## Features
- **Tensors**: NumPy-like n-dimensional arrays.
- **Linear Algebra**: Matrix multiplication and broadcasting.

## Usage
```typescript
import { Tensor } from '@philjs/science';
const t1 = Tensor.zeros([3, 3]);
const t2 = t1.add(t1);
```
