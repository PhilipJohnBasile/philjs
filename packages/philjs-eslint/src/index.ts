import noUnusedSignals from './rules/no-unused-signals.js';
import effectCleanupRequired from './rules/effect-cleanup-required.js';
import preferMemoForExpensive from './rules/prefer-memo-for-expensive.js';

export const rules = {
  'no-unused-signals': noUnusedSignals,
  'effect-cleanup-required': effectCleanupRequired,
  'prefer-memo-for-expensive': preferMemoForExpensive,
};

export const configs = {
  recommended: {
    plugins: ['philjs'],
    rules: {
      'philjs/no-unused-signals': 'error',
      'philjs/effect-cleanup-required': 'warn',
      'philjs/prefer-memo-for-expensive': 'warn',
    },
  },
};
