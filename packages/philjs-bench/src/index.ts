
import { signal, computed, effect } from '@philjs/core';
import { performance } from 'perf_hooks';

// Benchmark: Create 1000 signals, 1 computed derived from all, update 1
// This tests the "Glitch-free" propagation graph efficiency

function runBenchmark() {
    const count = 1000;
    const signals = Array.from({ length: count }, (_, i) => signal(i));

    const sum = computed(() => {
        return signals.reduce((acc, s) => acc + s.value, 0);
    });

    const start = performance.now();

    // Force Read
    const initial = sum.value;

    // Update all
    for (let i = 0; i < count; i++) {
        signals[i].value += 1;
    }

    // Force Read again
    const final = sum.value;

    const end = performance.now();

    console.log(`PhilJS 1000 Signals Update: ${(end - start).toFixed(4)}ms`);
    console.log(`Check logic: ${initial} -> ${final}`);
}

runBenchmark();
