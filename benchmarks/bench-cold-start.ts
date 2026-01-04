
import { spawn } from 'child_process';
import { performance } from 'perf_hooks';

// Benchmark: Measure cold start time of PhilJS runtime
async function benchColdStart() {
    const start = performance.now();
    const child = spawn('node', ['packages/philjs-runtime/dist/index.js']);

    child.stdout.on('data', (data) => {
        if (data.toString().includes('Server running')) {
            const end = performance.now();
            console.log(\`PhilJS Cold Start: \${(end - start).toFixed(2)}ms\`);
      child.kill();
    }
  });
}

benchColdStart();
