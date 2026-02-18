/**
 * @philjs/backend-adapters
 *
 * Backend framework adapters for PhilJS - Inertia.js, Phoenix, Rails, and deployment configs
 */
export * from './inertia.js';
export * from './phoenix.js';
export * from './active-record.js';
export * from './generators/fly.js';
export * from './generators/railway.js';
export declare const ConfigGenerators: {
    fly: () => string;
    railway: () => string;
    gcloud: () => string;
};
