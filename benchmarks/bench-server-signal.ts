
// Benchmark: Payload size of Server Signals vs RSC
// Stub implementation comparing JSON size
const signalState = { id: 1, value: "test" };
const rscPayload = \`["$L1", null, { "id": 1, "value": "test" }]\`;

console.log(\`Signal JSON Size: \${JSON.stringify(signalState).length} bytes\`);
console.log(\`RSC Payload Size: \${rscPayload.length} bytes\`);
