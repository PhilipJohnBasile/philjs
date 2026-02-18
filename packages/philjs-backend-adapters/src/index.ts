/**
 * @philjs/backend-adapters
 *
 * Backend framework adapters for PhilJS - Inertia.js, Phoenix, Rails, and deployment configs
 */

// Inertia.js adapter (Laravel/Rails)
export * from './inertia.js';

// Phoenix LiveView adapter (Elixir)
export * from './phoenix.js';

// Active Record pattern adapter (Rails-style)
export * from './active-record.js';

// Deployment generators
export * from './generators/fly.js';
export * from './generators/railway.js';

// Configuration generators
export const ConfigGenerators = {
  fly: () => 'philjs-fly-config',
  railway: () => 'philjs-railway-config',
  gcloud: () => 'philjs-gcloud-config',
};
