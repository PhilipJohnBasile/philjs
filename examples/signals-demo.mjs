// Run with Node.js 24+. Imports the actual source; no package install is needed.
import assert from 'node:assert/strict';
import { signal, memo, effect, batch } from '../packages/philjs-core/src/signals.ts';

const price = signal(20);
const quantity = signal(1);
const total = memo(() => price() * quantity());
const observed = [];
const dispose = effect(() => observed.push(total()));

quantity.set(3);
batch(() => {
  price.set(15);
  quantity.set(4);
});

assert.deepEqual(observed, [20, 60, 60]);
assert.equal(total(), 60);
dispose();
price.set(10);
assert.equal(total(), 40);
assert.equal(observed.length, 3, 'disposed effects must stop receiving updates');

console.log('Initial total: $20');
console.log('Three items: $60');
console.log('Batched price + quantity update: $60');
console.log('Effect disposed; derived total still updates: $40');
console.log('Signals, memoization, batching, and disposal checks passed.');
