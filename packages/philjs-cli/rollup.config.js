import config from '../../rollup.config.js';

// Override for CLI - need to include commander, picocolors as dependencies
export default {
  ...config,
  external: [
    /^node:/,
    'vite',
    'rollup',
    'esbuild',
    'chokidar',
    /^philjs-/
  ]
};
