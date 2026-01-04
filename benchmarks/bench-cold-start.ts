
import { spawn } from 'child_process';
import { performance } from 'perf_hooks';
import * as path from 'path';

// Benchmark: Measure cold start time of PhilJS runtime
async function benchColdStart() {
  console.log('Starting Cold Start Benchmark...');
  const start = performance.now();

  const serverPath = path.resolve('packages/philjs-runtime/dist/index.js');

  // In a real scenario, ensure this file exists or point to a valid entry point
  const child = spawn('node', [serverPath], {
    env: { ...process.env, NODE_ENV: 'production' }
  });

  child.stdout.on('data', (data) => {
    const output = data.toString();
    // Check for specific signal that server is ready
    if (output.includes('Server running') || output.includes('Ready')) {
      const end = performance.now();
      console.log(`PhilJS Cold Start: ${(end - start).toFixed(2)}ms`);
      child.kill();
      process.exit(0);
    }
  });

  child.stderr.on('data', (data) => {
    console.error('Server Error:', data.toString());
  });

  child.on('error', (err) => {
    console.error('Failed to start process:', err);
  });

  // Timeout fallback
  setTimeout(() => {
    console.log('Benchmark timed out (no server signal received)');
    child.kill();
  }, 5000);
}

if (require.main === module) {
  benchColdStart();
}
