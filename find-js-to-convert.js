const fs = require('fs');
const path = require('path');

function walkDir(dir, filter) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(filePath, filter));
    } else if (filter(filePath)) {
      results.push(filePath);
    }
  });
  return results;
}

const excludePatterns = [
  'create-philjs',
  'create-philjs-plugin',
  'philjs-3d',
  'philjs-3d-physics',
  'philjs-adapters'
];

const packagesDir = './packages';
const packages = fs.readdirSync(packagesDir)
  .filter(p => !excludePatterns.some(ex => p.includes(ex)))
  .filter(p => fs.statSync(path.join(packagesDir, p)).isDirectory());

let filesToConvert = [];
let byPackage = {};

packages.forEach(pkg => {
  const srcDir = path.join(packagesDir, pkg, 'src');
  if (!fs.existsSync(srcDir)) return;

  try {
    const jsFiles = walkDir(srcDir, f => f.endsWith('.js') && !f.endsWith('.d.ts'));
    jsFiles.forEach(jsFile => {
      const base = jsFile.slice(0, -3);
      const tsExists = fs.existsSync(base + '.ts');
      const tsxExists = fs.existsSync(base + '.tsx');

      if (!tsExists && !tsxExists) {
        const normalized = jsFile.replace(/\\/g, '/');
        filesToConvert.push(normalized);
        byPackage[pkg] = byPackage[pkg] || [];
        byPackage[pkg].push(normalized);
      }
    });
  } catch(e) {}
});

console.log('Total files to convert:', filesToConvert.length);
console.log('\nBy package:');
Object.keys(byPackage).sort().forEach(pkg => {
  console.log(`  ${pkg}: ${byPackage[pkg].length} files`);
});
console.log('\n---');
filesToConvert.forEach(f => console.log(f));
