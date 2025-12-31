import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

function walkDir(dir: string, filter: (filePath: string) => boolean) {
  let results: string[] = [];
  const list = readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(filePath, filter));
    } else if (filter(filePath)) {
      results.push(filePath);
    }
  });
  return results;
}

const excludePatterns: string[] = [
  'create-philjs',
  'create-philjs-plugin',
  'philjs-3d',
  'philjs-3d-physics',
  'philjs-adapters'
];

const packagesDir = './packages';
const packages = readdirSync(packagesDir)
  .filter(p => !excludePatterns.some(ex => p.includes(ex)))
  .filter(p => statSync(path.join(packagesDir, p)).isDirectory());

let filesToConvert: string[] = [];
const byPackage: Record<string, string[]> = {};

packages.forEach(pkg => {
  const srcDir = path.join(packagesDir, pkg, 'src');
  if (!existsSync(srcDir)) return;

  try {
    const jsFiles = walkDir(srcDir, f => f.endsWith('.js') && !f.endsWith('.d.ts'));
    jsFiles.forEach(jsFile => {
      const base = jsFile.slice(0, -3);
      const tsExists = existsSync(base + '.ts');
      const tsxExists = existsSync(base + '.tsx');

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
