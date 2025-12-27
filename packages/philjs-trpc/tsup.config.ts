import { createConfig } from '../tsup.config.base';

export default createConfig([
  'src/index.ts',
  'src/client/index.ts',
  'src/server/index.ts',
]);
