import { createConfig } from '../tsup.config.base.js';

export default createConfig([
  'src/index.ts',
  'src/client/index.ts',
  'src/server/index.ts',
]);
