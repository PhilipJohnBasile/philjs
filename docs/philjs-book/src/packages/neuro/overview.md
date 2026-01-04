
# Brain-Computer Interfaces (`@philjs/neuro`)

Control the UI with your mind.

## NeuralInterface
Connects to mocked EEG headsets (Simulated Muse/Emotiv).

```typescript
import { NeuralInterface } from '@philjs/neuro';
const bci = NeuralInterface.connect();

// Trigger Redux action when focus > 0.8
bci.onThought('focus', () => store.dispatch({ type: 'DEEP_WORK' }));
```
