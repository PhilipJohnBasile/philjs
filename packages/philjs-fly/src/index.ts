/**
 * PhilJS Fly.io Adapter
 */

export interface FlyConfig { app: string; region?: string; }

export function createFlyAdapter(config: FlyConfig) {
    return {
        deploy: async () => {
            console.log(`Deploying to Fly.io app: ${config.app}`);
            // This would integrate with Fly.io CLI/API
        },
        getRegions: () => ['iad', 'lax', 'lhr', 'sin', 'syd', 'fra', 'nrt'],
        getAppUrl: () => `https://${config.app}.fly.dev`,
    };
}

export const flyToml = (appName: string) => `
app = "${appName}"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
`;
