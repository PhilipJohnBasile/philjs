
export * from './inertia.js';
export * from './phoenix.js';
export * from './active-record.js';

export const ConfigGenerators = {
  fly: () => "philjs-fly-config",
  railway: () => "philjs-railway-config",
  gcloud: () => "philjs-gcloud-config"
};
