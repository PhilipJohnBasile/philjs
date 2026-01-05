
export * from './inertia';
export * from './phoenix';
export * from './active-record';

export const ConfigGenerators = {
  fly: () => "philjs-fly-config",
  railway: () => "philjs-railway-config",
  gcloud: () => "philjs-gcloud-config"
};
