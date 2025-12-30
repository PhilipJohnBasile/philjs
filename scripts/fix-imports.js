const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TS2835 errors
const output = execSync('npx tsc --noEmit 2>&1 || true', { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
const errors = output.split('\n').filter(line => line.includes('TS2835'));

const fileChanges = new Map();

for (const error of errors) {
  const match = error.match(/^([^(]+)\((\d+),(\d+)\).*Did you mean '([^']+)'/);
  if (match) {
    const [, filePath, lineNum, colNum, suggestedImport] = match;
    const normalizedPath = path.normalize(filePath);
    if (!fileChanges.has(normalizedPath)) {
      fileChanges.set(normalizedPath, []);
    }
    fileChanges.get(normalizedPath).push({
      line: parseInt(lineNum) - 1,
      col: parseInt(colNum) - 1,
      suggested: suggestedImport
    });
  }
}

let fixed = 0;
for (const [filePath, changes] of fileChanges) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Sort changes by line in reverse so indices remain valid
    changes.sort((a, b) => b.line - a.line);

    for (const change of changes) {
      const line = lines[change.line];
      if (line) {
        // Extract the import path without .js and replace with suggested
        const importMatch = line.match(/from\s+['"]([^'"]+)['"]/);
        if (importMatch) {
          const oldImport = importMatch[1];
          if (!oldImport.endsWith('.js') && change.suggested.endsWith('.js')) {
            lines[change.line] = line.replace(oldImport, change.suggested);
            fixed++;
          }
        }
      }
    }

    fs.writeFileSync(filePath, lines.join('\n'));
  } catch (e) {
    console.error('Error processing', filePath, e.message);
  }
}

console.log('Fixed', fixed, 'import extensions in', fileChanges.size, 'files');
