#!/usr/bin/env node
// Fix .value to .get()/.set() for PhilJS Signal API
const fs = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node fix-signal-value.js <file>');
  process.exit(1);
}

let content = fs.readFileSync(file, 'utf8');

// Replace assignments: x.value = y → x.set(y)
// This handles both single line and multi-line assignments
content = content.replace(
  /(\w+)\.value\s*=\s*(\{[\s\S]*?\n\s*\};)/g,
  (match, varName, assignValue) => {
    // For objects spanning multiple lines, change to set() and close with )
    const innerValue = assignValue.slice(0, -1); // Remove trailing ;
    return `${varName}.set(${innerValue});`;
  }
);

// Replace single-line assignments: x.value = y; → x.set(y);
content = content.replace(
  /(\w+)\.value\s*=\s*([^;{]+);/g,
  (match, varName, value) => {
    return `${varName}.set(${value.trim()});`;
  }
);

// Replace remaining reads: x.value → x.get()
// But not when it's inside a set() call we just created
content = content.replace(/\.value\b(?!\s*\))/g, '.get()');

// Fix any remaining .value that's just a property read
content = content.replace(/\.value\b/g, '.get()');

fs.writeFileSync(file, content);
console.log(`Fixed: ${file}`);
