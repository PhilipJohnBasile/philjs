
# @philjs/neuro

Brain-Computer Interface (BCI).

## Features
- **MindCtrl**: Stream EEG data to dispatch Redux actions.
- **Focus Detection**: Trigger UI changes based on Beta waves.

## Usage
```typescript
import { NeuralInterface } from '@philjs/neuro';
const bci = NeuralInterface.connect();
bci.onThought('focus', () => enableDeepWorkMode());
```
