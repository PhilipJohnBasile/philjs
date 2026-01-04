
import * as fs from 'fs';
import * as path from 'path';

// Benchmark: Measure build time simulation
async function benchBuild() {
    console.log('Benchmarking Build Time (Simulating 10k pages)...');

    const start = Date.now();
    const totalPages = 10000;

    // Simulate realish IO and transformation work
    // Not just an empty loop, but mock "work"
    const mockTransform = (content: string) => content.replace('{{data}}', 'hydrated');

    for (let i = 0; i < totalPages; i++) {
        const page = \`<html><body><h1>Page \${i}</h1>{{data}}</body></html>\`;
        mockTransform(page);
        
        // Every 100 pages, simulate a heavier task (e.g. image optimization or bundle write)
        if (i % 100 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0)); 
        }
    }
    
    const end = Date.now();
    const duration = end - start;
    const rate = (totalPages / (duration / 1000)).toFixed(0);
    
    console.log(\`Build Time: \${duration}ms\`);
    console.log(\`Throughput: \${rate} pages/sec\`);
}

if (require.main === module) {
    benchBuild();
}
