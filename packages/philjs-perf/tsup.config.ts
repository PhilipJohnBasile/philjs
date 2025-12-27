import { createConfig } from '../tsup.config.base';

export default createConfig({
  'src/index.ts': 'index',
  'src/memo.ts': 'memo',
  'src/batch.ts': 'batch',
  'src/pool.ts': 'pool',
  'src/lazy.ts': 'lazy',
  'src/timing.ts': 'timing',
  'src/cache.ts': 'cache',
});
