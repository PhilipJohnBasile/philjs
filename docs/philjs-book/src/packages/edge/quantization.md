
# Edge AI (`@philjs/edge`)

Run models closer to the user.

## Quantization
The `quantizeModel` function simulates compressing 500MB Float32 models into 50MB Int8 binaries for browser/mobile use.

```typescript
import { quantizeModel } from '@philjs/edge';

await quantizeModel({
  sourceModelPath: './model.onnx',
  targetFormat: 'int8'
});
```
