import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

describe('package metadata', () => {
  it('has the expected name and version', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const pkgPath = resolve(here, '../package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name: string; version: string };

    expect(pkg.name).toBe('@philjs/eye-tracking');
    expect(pkg.version).toBe('0.1.0');
  });

  it('loads the entry when available', async () => {

  });
});
