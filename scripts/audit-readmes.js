const fs = require('fs');
const path = require('path');

const packagesDir = path.resolve(__dirname, '../packages');
const packages = fs.readdirSync(packagesDir);

console.log('Package | README Size | Status');
console.log('--- | --- | ---');

let emptyCount = 0;
let placeholderCount = 0;

packages.forEach(pkg => {
    const pkgDir = path.join(packagesDir, pkg);
    if (!fs.statSync(pkgDir).isDirectory()) return;

    const readmePath = path.join(pkgDir, 'README.md');

    if (!fs.existsSync(readmePath)) {
        console.log(`${pkg} | N/A | ❌ Missing`);
        emptyCount++;
        return;
    }

    const content = fs.readFileSync(readmePath, 'utf8');
    const size = content.length;
    const isPlaceholder = content.includes('Official PhilJS package') && size < 200;
    const isTodo = content.includes('Coming soon') || content.includes('TODO');

    let status = '✅ OK';
    if (size < 100) status = '⚠️ Tiny';
    if (isPlaceholder) status = '⚠️ Placeholder';
    if (isTodo) status = '⚠️ TODO';

    console.log(`${pkg} | ${size} | ${status}`);

    if (status !== '✅ OK') placeholderCount++;
});

console.log(`\nFound ${placeholderCount} potential documentation stubs.`);
