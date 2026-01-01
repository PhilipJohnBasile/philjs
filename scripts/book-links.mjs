#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const srcDir = 'docs/philjs-book/src';

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const lychee = resolveLychee();
if (!lychee) {
  fail(
    'Lychee not found. Install it (winget/brew/cargo) or set LYCHEE=/path/to/lychee.'
  );
}

const args = [
  '--no-progress',
  '--include-fragments',
  '--offline',
  '--exclude',
  '^(https?|mailto):',
  srcDir
];

const result = spawnSync(lychee, args, { stdio: 'inherit' });
if (result.error) {
  fail(`Failed to run lychee: ${result.error.message}`);
}
process.exit(result.status ?? 1);

function resolveLychee() {
  const envPath = process.env.LYCHEE;
  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }

  if (isOnPath('lychee')) {
    return 'lychee';
  }

  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA ?? '';
    const candidates = [
      localAppData &&
        path.join(
          localAppData,
          'Microsoft',
          'WinGet',
          'Packages',
          'lycheeverse.lychee_Microsoft.Winget.Source_8wekyb3d8bbwe',
          'lychee.exe'
        )
    ].filter(Boolean);

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

function isOnPath(command) {
  const result = spawnSync(command, ['--version'], { stdio: 'ignore' });
  return result.status === 0;
}
