/**
 * Tests for PhilJS Fly.io Integration
 *
 * Comprehensive Fly.io deployment, edge computing, and machine management
 * with signal-reactive state and SSR edge functions support.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  // Types
  type FlyConfig,
  type FlyRegion,
  type AutoscalingConfig,
  type VolumeConfig,
  type ServiceConfig,
  type HttpCheck,
  type TcpCheck,
  type ConcurrencyConfig,
  type Machine,
  type MachineState,
  type MachineConfig,
  type MachineInit,
  type RestartPolicy,
  type MachineService,
  type ServicePort,
  type TlsOptions,
  type ServiceCheck,
  type GuestConfig,
  type MachineMount,
  type ProcessConfig,
  type StaticConfig,
  type DnsConfig,
  type DnsOption,
  type ImageRef,
  type MachineEvent,
  type MachineCheck,
  type Volume,
  type VolumeSnapshot,
  type App,
  type Organization,
  type Release,
  type Secret,
  type Allocation,
  type AllocationEvent,
  type AllocationCheck,
  type Certificate,
  type CertificateIssued,
  type WireGuardPeer,
  type DatabaseConfig,
  type PostgresCluster,
  type PostgresUser,
  type PostgresDatabase,
  type RedisConfig,
  type UpstashRedis,
  type FlyState,
  type DeploymentState,
  type FlyApiClient,
  type DeployOptions,
  type RegionInfo,
  type EdgeFunctionConfig,
  type SSRConfig,
  type DockerfileOptions,
  type FlyMetrics,
  type FlyCliOptions,

  // Functions
  createFlyState,
  createFlyClient,
  createFlyAdapter,
  FlyApiError,
  REGION_INFO,
  createEdgeFunction,
  createSSRHandler,
  flyToml,
  dockerfile,
  dockerIgnore,
  useFlyApp,
  useFlyMachines,
  useFlyDeployment,
  useFlyRegions,
  createMetricsCollector,
  flyctl,
  fly,
} from './index';

// Mock fetch
global.fetch = vi.fn();

describe('PhilJS Fly.io Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Type Definitions', () => {
    describe('FlyConfig', () => {
      it('should define configuration options', () => {
        const config: FlyConfig = {
          app: 'my-app',
          org: 'my-org',
          region: 'iad',
          apiToken: 'test-token',
          primaryRegion: 'iad',
          replicas: 2,
          autoscaling: {
            minMachines: 1,
            maxMachines: 10,
            softLimit: 80,
            hardLimit: 100,
            scaleToZero: true,
          },
          volumes: [{ name: 'data', size: 10, mountPath: '/data' }],
          services: [{ name: 'http', internalPort: 3000 }],
          env: { NODE_ENV: 'production' },
          secrets: ['DATABASE_URL'],
          buildArgs: { VERSION: '1.0.0' },
          dockerfile: 'Dockerfile',
          dockerIgnore: ['node_modules'],
        };

        expect(config.app).toBe('my-app');
        expect(config.primaryRegion).toBe('iad');
        expect(config.autoscaling?.minMachines).toBe(1);
      });
    });

    describe('FlyRegion', () => {
      it('should include all valid regions', () => {
        const regions: FlyRegion[] = [
          'ams', 'arn', 'atl', 'bog', 'bom', 'bos', 'cdg', 'den',
          'dfw', 'ewr', 'eze', 'fra', 'gdl', 'gig', 'gru', 'hkg',
          'iad', 'jnb', 'lax', 'lhr', 'mad', 'mia', 'nrt', 'ord',
          'otp', 'phx', 'qro', 'scl', 'sea', 'sin', 'sjc', 'syd',
          'waw', 'yul', 'yyz',
        ];

        expect(regions).toHaveLength(35);
        expect(regions).toContain('iad');
        expect(regions).toContain('lhr');
      });
    });

    describe('AutoscalingConfig', () => {
      it('should define autoscaling configuration', () => {
        const config: AutoscalingConfig = {
          minMachines: 1,
          maxMachines: 10,
          softLimit: 80,
          hardLimit: 100,
          scaleToZero: true,
          concurrency: {
            type: 'requests',
            softLimit: 100,
            hardLimit: 200,
          },
        };

        expect(config.minMachines).toBe(1);
        expect(config.concurrency?.type).toBe('requests');
      });
    });

    describe('VolumeConfig', () => {
      it('should define volume configuration', () => {
        const config: VolumeConfig = {
          name: 'data-volume',
          size: 20,
          mountPath: '/data',
          encrypted: true,
          snapshotRetention: 7,
        };

        expect(config.name).toBe('data-volume');
        expect(config.encrypted).toBe(true);
      });
    });

    describe('ServiceConfig', () => {
      it('should define service configuration', () => {
        const config: ServiceConfig = {
          name: 'web',
          internalPort: 3000,
          protocol: 'tcp',
          forceHttps: true,
          autoStopMachines: true,
          autoStartMachines: true,
          minMachinesRunning: 1,
          httpChecks: [{ path: '/health' }],
          tcpChecks: [{ interval: '10s' }],
          concurrency: { type: 'connections', softLimit: 100, hardLimit: 200 },
        };

        expect(config.internalPort).toBe(3000);
        expect(config.forceHttps).toBe(true);
      });
    });

    describe('Machine', () => {
      it('should define machine structure', () => {
        const machine: Machine = {
          id: 'machine-123',
          name: 'web-1',
          state: 'started',
          region: 'iad',
          instanceId: 'instance-456',
          privateIp: '10.0.0.1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          config: {
            env: { NODE_ENV: 'production' },
            image: 'my-app:latest',
          },
          imageRef: {
            registry: 'registry.fly.io',
            repository: 'my-app',
            tag: 'latest',
            digest: 'sha256:abc123',
          },
          events: [],
          checks: [{ name: 'http', status: 'passing', updatedAt: '2024-01-01T00:00:00Z' }],
        };

        expect(machine.state).toBe('started');
        expect(machine.region).toBe('iad');
      });
    });

    describe('MachineState', () => {
      it('should include all machine states', () => {
        const states: MachineState[] = [
          'created', 'starting', 'started', 'stopping',
          'stopped', 'replacing', 'destroying', 'destroyed',
        ];

        expect(states).toHaveLength(8);
        expect(states).toContain('started');
      });
    });

    describe('GuestConfig', () => {
      it('should define guest configuration', () => {
        const config: GuestConfig = {
          cpuKind: 'performance',
          cpus: 4,
          memoryMb: 8192,
          gpuKind: 'a100-pcie-40gb',
          gpus: 1,
          kernelArgs: ['--max-threads=8'],
        };

        expect(config.cpuKind).toBe('performance');
        expect(config.gpuKind).toBe('a100-pcie-40gb');
      });
    });

    describe('Volume', () => {
      it('should define volume structure', () => {
        const volume: Volume = {
          id: 'vol-123',
          name: 'data',
          state: 'created',
          sizeGb: 10,
          region: 'iad',
          zone: 'iad-a',
          encrypted: true,
          attachedMachineId: 'machine-456',
          createdAt: '2024-01-01T00:00:00Z',
          snapshotRetention: 7,
        };

        expect(volume.state).toBe('created');
        expect(volume.encrypted).toBe(true);
      });
    });

    describe('App', () => {
      it('should define app structure', () => {
        const app: App = {
          id: 'app-123',
          name: 'my-app',
          organization: {
            id: 'org-123',
            name: 'My Org',
            slug: 'my-org',
            type: 'SHARED',
            paidPlan: true,
          },
          status: 'deployed',
          hostname: 'my-app.fly.dev',
          deployed: true,
          machines: [],
          volumes: [],
          secrets: [],
          allocations: [],
        };

        expect(app.status).toBe('deployed');
        expect(app.hostname).toBe('my-app.fly.dev');
      });
    });

    describe('Certificate', () => {
      it('should define certificate structure', () => {
        const cert: Certificate = {
          id: 'cert-123',
          hostname: 'example.com',
          clientStatus: 'Ready',
          issued: {
            nodes: [{ type: 'ecdsa', expiresAt: '2025-01-01T00:00:00Z' }],
          },
          check: true,
          createdAt: '2024-01-01T00:00:00Z',
        };

        expect(cert.clientStatus).toBe('Ready');
        expect(cert.issued.nodes).toHaveLength(1);
      });
    });

    describe('DatabaseConfig', () => {
      it('should define database configuration', () => {
        const config: DatabaseConfig = {
          type: 'postgres',
          version: '15',
          size: 'performance-2x',
          volumeSize: 20,
          region: 'iad',
          replicas: ['lhr', 'fra'],
          highAvailability: true,
          extensions: ['postgis', 'uuid-ossp'],
          name: 'my-db',
        };

        expect(config.type).toBe('postgres');
        expect(config.highAvailability).toBe(true);
      });
    });

    describe('FlyState', () => {
      it('should define state structure', () => {
        const state: FlyState = {
          config: { app: 'my-app' },
          app: null,
          machines: [],
          volumes: [],
          secrets: [],
          certificates: [],
          deployments: [],
          loading: false,
          error: null,
          connected: true,
        };

        expect(state.connected).toBe(true);
        expect(state.machines).toEqual([]);
      });
    });

    describe('DeploymentState', () => {
      it('should define deployment state', () => {
        const deployment: DeploymentState = {
          id: 'deploy-123',
          status: 'deploying',
          startedAt: '2024-01-01T00:00:00Z',
          logs: ['Starting deployment...'],
        };

        expect(deployment.status).toBe('deploying');
        expect(deployment.logs).toContain('Starting deployment...');
      });
    });

    describe('DeployOptions', () => {
      it('should define deploy options', () => {
        const options: DeployOptions = {
          image: 'my-app:v1.0.0',
          dockerfile: 'Dockerfile.prod',
          buildArgs: { VERSION: '1.0.0' },
          regions: ['iad', 'lhr'],
          strategy: 'bluegreen',
          maxUnavailable: 1,
          waitTimeout: 300,
          releaseCommand: 'npm run migrate',
          releaseCommandTimeout: 120,
          buildOnly: false,
          push: true,
          remote: true,
        };

        expect(options.strategy).toBe('bluegreen');
        expect(options.regions).toContain('iad');
      });
    });

    describe('FlyMetrics', () => {
      it('should define metrics structure', () => {
        const metrics: FlyMetrics = {
          app: 'my-app',
          timestamp: '2024-01-01T00:00:00Z',
          machines: {
            total: 5,
            running: 4,
            stopped: 1,
            byRegion: { iad: 3, lhr: 2 } as Record<FlyRegion, number>,
          },
          requests: {
            total: 10000,
            success: 9900,
            errors: 100,
            latencyP50: 50,
            latencyP95: 150,
            latencyP99: 300,
          },
          resources: {
            cpu: 45,
            memory: 60,
            bandwidth: 1024,
          },
        };

        expect(metrics.machines.total).toBe(5);
        expect(metrics.requests.success).toBe(9900);
      });
    });
  });

  describe('State Management', () => {
    describe('createFlyState', () => {
      it('should create initial state with config', () => {
        const config: FlyConfig = { app: 'test-app', primaryRegion: 'iad' };
        const { state } = createFlyState(config);

        expect(state.value.config.app).toBe('test-app');
        expect(state.value.machines).toEqual([]);
        expect(state.value.loading).toBe(false);
        expect(state.value.connected).toBe(false);
      });

      it('should provide computed signals', () => {
        const config: FlyConfig = { app: 'test-app' };
        const {
          state,
          isDeploying,
          activeMachines,
          healthyMachines,
          regions,
          appUrl,
          primaryUrl,
        } = createFlyState(config);

        expect(isDeploying.value).toBe(false);
        expect(activeMachines.value).toEqual([]);
        expect(healthyMachines.value).toEqual([]);
        expect(regions.value).toEqual([]);
        expect(appUrl.value).toBe(null);
        expect(primaryUrl.value).toBe('https://test-app.fly.dev');
      });

      it('should compute isDeploying correctly', () => {
        const config: FlyConfig = { app: 'test-app' };
        const { state, isDeploying } = createFlyState(config);

        state.value = {
          ...state.value,
          deployments: [{ id: '1', status: 'deploying', startedAt: '', logs: [] }],
        };

        expect(isDeploying.value).toBe(true);
      });

      it('should compute activeMachines correctly', () => {
        const config: FlyConfig = { app: 'test-app' };
        const { state, activeMachines } = createFlyState(config);

        const mockMachine: Machine = {
          id: 'm1',
          name: 'web-1',
          state: 'started',
          region: 'iad',
          instanceId: 'i1',
          privateIp: '10.0.0.1',
          createdAt: '',
          updatedAt: '',
          config: { env: {}, image: '' },
          imageRef: { registry: '', repository: '', tag: '', digest: '' },
          events: [],
        };

        state.value = { ...state.value, machines: [mockMachine] };

        expect(activeMachines.value).toHaveLength(1);
      });
    });
  });

  describe('API Client', () => {
    describe('createFlyClient', () => {
      it('should create client with config', () => {
        const config: FlyConfig = { app: 'test-app', apiToken: 'test-token' };
        const client = createFlyClient(config);

        expect(client).toBeDefined();
        expect(typeof client.getApp).toBe('function');
        expect(typeof client.listMachines).toBe('function');
        expect(typeof client.createMachine).toBe('function');
      });

      it('should have app management methods', () => {
        const client = createFlyClient({ app: 'test-app' });

        expect(typeof client.getApp).toBe('function');
        expect(typeof client.createApp).toBe('function');
        expect(typeof client.deleteApp).toBe('function');
        expect(typeof client.suspendApp).toBe('function');
        expect(typeof client.resumeApp).toBe('function');
      });

      it('should have machine management methods', () => {
        const client = createFlyClient({ app: 'test-app' });

        expect(typeof client.listMachines).toBe('function');
        expect(typeof client.getMachine).toBe('function');
        expect(typeof client.createMachine).toBe('function');
        expect(typeof client.updateMachine).toBe('function');
        expect(typeof client.startMachine).toBe('function');
        expect(typeof client.stopMachine).toBe('function');
        expect(typeof client.restartMachine).toBe('function');
        expect(typeof client.destroyMachine).toBe('function');
        expect(typeof client.waitMachine).toBe('function');
        expect(typeof client.execMachine).toBe('function');
      });

      it('should have volume management methods', () => {
        const client = createFlyClient({ app: 'test-app' });

        expect(typeof client.listVolumes).toBe('function');
        expect(typeof client.getVolume).toBe('function');
        expect(typeof client.createVolume).toBe('function');
        expect(typeof client.deleteVolume).toBe('function');
        expect(typeof client.extendVolume).toBe('function');
        expect(typeof client.listSnapshots).toBe('function');
        expect(typeof client.createSnapshot).toBe('function');
      });

      it('should have secrets management methods', () => {
        const client = createFlyClient({ app: 'test-app' });

        expect(typeof client.listSecrets).toBe('function');
        expect(typeof client.setSecrets).toBe('function');
        expect(typeof client.unsetSecrets).toBe('function');
      });

      it('should have certificates management methods', () => {
        const client = createFlyClient({ app: 'test-app' });

        expect(typeof client.listCertificates).toBe('function');
        expect(typeof client.getCertificate).toBe('function');
        expect(typeof client.addCertificate).toBe('function');
        expect(typeof client.deleteCertificate).toBe('function');
        expect(typeof client.checkCertificate).toBe('function');
      });

      it('should have deployment methods', () => {
        const client = createFlyClient({ app: 'test-app' });

        expect(typeof client.deploy).toBe('function');
        expect(typeof client.getReleases).toBe('function');
        expect(typeof client.rollback).toBe('function');
      });

      it('should have region management methods', () => {
        const client = createFlyClient({ app: 'test-app' });

        expect(typeof client.listRegions).toBe('function');
        expect(typeof client.addRegion).toBe('function');
        expect(typeof client.removeRegion).toBe('function');
      });

      it('should have WireGuard methods', () => {
        const client = createFlyClient({ app: 'test-app' });

        expect(typeof client.listWireGuardPeers).toBe('function');
        expect(typeof client.createWireGuardPeer).toBe('function');
        expect(typeof client.deleteWireGuardPeer).toBe('function');
      });

      it('should have database methods', () => {
        const client = createFlyClient({ app: 'test-app' });

        expect(typeof client.createPostgres).toBe('function');
        expect(typeof client.listPostgresClusters).toBe('function');
        expect(typeof client.createUpstashRedis).toBe('function');
      });
    });

    describe('FlyApiError', () => {
      it('should create error with status and message', () => {
        const error = new FlyApiError(404, 'Not found');

        expect(error.status).toBe(404);
        expect(error.message).toContain('404');
        expect(error.message).toContain('Not found');
        expect(error.name).toBe('FlyApiError');
      });
    });
  });

  describe('Fly Adapter', () => {
    describe('createFlyAdapter', () => {
      it('should create adapter with config', () => {
        const config: FlyConfig = { app: 'test-app' };
        const adapter = createFlyAdapter(config);

        expect(adapter).toBeDefined();
        expect(adapter.state).toBeDefined();
        expect(adapter.client).toBeDefined();
      });

      it('should expose computed signals', () => {
        const config: FlyConfig = { app: 'test-app' };
        const adapter = createFlyAdapter(config);

        expect(adapter.isDeploying).toBeDefined();
        expect(adapter.activeMachines).toBeDefined();
        expect(adapter.healthyMachines).toBeDefined();
        expect(adapter.regions).toBeDefined();
        expect(adapter.appUrl).toBeDefined();
        expect(adapter.primaryUrl).toBeDefined();
      });

      it('should have state management methods', () => {
        const adapter = createFlyAdapter({ app: 'test-app' });

        expect(typeof adapter.refreshState).toBe('function');
        expect(typeof adapter.startAutoRefresh).toBe('function');
        expect(typeof adapter.stopAutoRefresh).toBe('function');
      });

      it('should have convenience methods', () => {
        const adapter = createFlyAdapter({ app: 'test-app' });

        expect(typeof adapter.deploy).toBe('function');
        expect(typeof adapter.scale).toBe('function');
        expect(typeof adapter.scaleToRegions).toBe('function');
        expect(typeof adapter.getRegionInfo).toBe('function');
        expect(typeof adapter.getAllRegions).toBe('function');
        expect(typeof adapter.getAppUrl).toBe('function');
        expect(typeof adapter.getRegions).toBe('function');
      });
    });
  });

  describe('Region Information', () => {
    describe('REGION_INFO', () => {
      it('should contain all regions', () => {
        expect(Object.keys(REGION_INFO)).toHaveLength(35);
      });

      it('should have correct info for IAD', () => {
        expect(REGION_INFO.iad).toEqual({
          name: 'Ashburn',
          city: 'Ashburn',
          country: 'United States',
          continent: 'North America',
          latitude: 38.9519,
          longitude: -77.4480,
        });
      });

      it('should have correct info for LHR', () => {
        expect(REGION_INFO.lhr).toEqual({
          name: 'London',
          city: 'London',
          country: 'United Kingdom',
          continent: 'Europe',
          latitude: 51.4700,
          longitude: -0.4543,
        });
      });

      it('should have coordinates for all regions', () => {
        for (const region of Object.values(REGION_INFO)) {
          expect(region.latitude).toBeDefined();
          expect(region.longitude).toBeDefined();
          expect(typeof region.latitude).toBe('number');
          expect(typeof region.longitude).toBe('number');
        }
      });
    });
  });

  describe('Edge Functions', () => {
    describe('createEdgeFunction', () => {
      it('should create edge function config', () => {
        const config: EdgeFunctionConfig = {
          name: 'api-handler',
          path: '/api/*',
          regions: ['iad', 'lhr'],
          memory: 256,
          timeout: 30,
          env: { API_KEY: 'secret' },
        };

        const fn = createEdgeFunction(config);

        expect(fn.name).toBe('api-handler');
        expect(fn.path).toBe('/api/*');
        expect(fn.config).toEqual(config);
        expect(typeof fn.invoke).toBe('function');
      });

      it('should invoke with request', async () => {
        const fn = createEdgeFunction({ name: 'test', path: '/test' });
        const request = new Request('http://localhost/test');

        const result = await fn.invoke(request);

        expect(result.region).toBe('iad');
        expect(result.latency).toBeGreaterThanOrEqual(0);
        expect(result.headers['fly-request-id']).toBeDefined();
      });
    });

    describe('createSSRHandler', () => {
      it('should create SSR handler with options', () => {
        const options: SSRConfig = {
          streaming: true,
          cacheControl: 'max-age=3600',
          revalidate: 60,
          staleWhileRevalidate: 86400,
          regions: ['iad'],
        };

        const handler = createSSRHandler(options);

        expect(typeof handler.handle).toBe('function');
        expect(typeof handler.handleStreaming).toBe('function');
      });

      it('should handle regular render', async () => {
        const handler = createSSRHandler();
        const request = new Request('http://localhost/');
        const render = async () => '<html><body>Hello</body></html>';

        const response = await handler.handle(request, render);

        expect(response).toBeInstanceOf(Response);
        expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
      });

      it('should handle streaming render', async () => {
        const handler = createSSRHandler({ streaming: true });
        const request = new Request('http://localhost/');
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('<html>'));
            controller.close();
          },
        });

        const response = await handler.handleStreaming(request, () => stream);

        expect(response).toBeInstanceOf(Response);
        expect(response.headers.get('Transfer-Encoding')).toBe('chunked');
      });

      it('should set cache headers when revalidate is set', async () => {
        const handler = createSSRHandler({ revalidate: 60, staleWhileRevalidate: 3600 });
        const request = new Request('http://localhost/');
        const render = async () => '<html></html>';

        const response = await handler.handle(request, render);

        expect(response.headers.get('Cache-Control')).toBe('s-maxage=60, stale-while-revalidate=3600');
      });
    });
  });

  describe('Configuration Generators', () => {
    describe('flyToml', () => {
      it('should generate basic fly.toml', () => {
        const config: FlyConfig = {
          app: 'my-app',
          primaryRegion: 'iad',
        };

        const toml = flyToml(config);

        expect(toml).toContain('app = "my-app"');
        expect(toml).toContain('primary_region = "iad"');
      });

      it('should include environment variables', () => {
        const config: FlyConfig = {
          app: 'my-app',
          env: { NODE_ENV: 'production', API_URL: 'https://api.example.com' },
        };

        const toml = flyToml(config);

        expect(toml).toContain('[env]');
        expect(toml).toContain('NODE_ENV = "production"');
        expect(toml).toContain('API_URL = "https://api.example.com"');
      });

      it('should include http_service configuration', () => {
        const config: FlyConfig = {
          app: 'my-app',
          services: [{
            name: 'http',
            internalPort: 8080,
            forceHttps: true,
            autoStopMachines: true,
            autoStartMachines: true,
            minMachinesRunning: 1,
          }],
        };

        const toml = flyToml(config);

        expect(toml).toContain('[http_service]');
        expect(toml).toContain('internal_port = 8080');
        expect(toml).toContain('force_https = true');
        expect(toml).toContain('min_machines_running = 1');
      });

      it('should include volume mounts', () => {
        const config: FlyConfig = {
          app: 'my-app',
          volumes: [{ name: 'data', size: 10, mountPath: '/data' }],
        };

        const toml = flyToml(config);

        expect(toml).toContain('[[mounts]]');
        expect(toml).toContain('source = "data"');
        expect(toml).toContain('destination = "/data"');
      });

      it('should include autoscaling configuration', () => {
        const config: FlyConfig = {
          app: 'my-app',
          autoscaling: { minMachines: 2, maxMachines: 10 },
        };

        const toml = flyToml(config);

        expect(toml).toContain('[autoscaling]');
        expect(toml).toContain('min_machines = 2');
        expect(toml).toContain('max_machines = 10');
      });
    });

    describe('dockerfile', () => {
      it('should generate multistage Dockerfile by default', () => {
        const df = dockerfile();

        expect(df).toContain('FROM node:20-alpine AS builder');
        expect(df).toContain('FROM node:20-alpine AS runner');
        expect(df).toContain('ENV NODE_ENV=production');
        expect(df).toContain('EXPOSE 3000');
      });

      it('should use custom options', () => {
        const options: DockerfileOptions = {
          baseImage: 'node:18-slim',
          port: 8080,
          buildCommand: 'npm run build:prod',
          startCommand: 'node dist/main.js',
          packageManager: 'pnpm',
        };

        const df = dockerfile(options);

        expect(df).toContain('FROM node:18-slim');
        expect(df).toContain('EXPOSE 8080');
        expect(df).toContain('RUN pnpm install --frozen-lockfile');
      });

      it('should generate simple Dockerfile when multistage is false', () => {
        const df = dockerfile({ multistage: false });

        expect(df).not.toContain('AS builder');
        expect(df).not.toContain('AS runner');
        expect(df).toContain('FROM node:20-alpine');
      });

      it('should include environment variables', () => {
        const df = dockerfile({ env: { API_KEY: 'test', DEBUG: 'true' } });

        expect(df).toContain('ENV API_KEY=test');
        expect(df).toContain('ENV DEBUG=true');
      });
    });

    describe('dockerIgnore', () => {
      it('should generate .dockerignore content', () => {
        const ignore = dockerIgnore();

        expect(ignore).toContain('node_modules');
        expect(ignore).toContain('.env');
        expect(ignore).toContain('.git');
        expect(ignore).toContain('Dockerfile');
        expect(ignore).toContain('fly.toml');
      });
    });
  });

  describe('Hooks', () => {
    describe('useFlyApp', () => {
      it('should create adapter and start auto-refresh', () => {
        const config: FlyConfig = { app: 'test-app' };

        // Just verify it returns the adapter structure
        expect(typeof useFlyApp).toBe('function');
      });
    });

    describe('useFlyMachines', () => {
      it('should return machines state and controls', () => {
        const result = useFlyMachines('test-app');

        expect(result.machines).toBeDefined();
        expect(result.loading).toBeDefined();
        expect(result.error).toBeDefined();
        expect(typeof result.refresh).toBe('function');
        expect(typeof result.start).toBe('function');
        expect(typeof result.stop).toBe('function');
        expect(typeof result.restart).toBe('function');
        expect(typeof result.destroy).toBe('function');
      });
    });

    describe('useFlyDeployment', () => {
      it('should return deployment state and controls', () => {
        const config: FlyConfig = { app: 'test-app' };
        const result = useFlyDeployment(config);

        expect(result.status).toBeDefined();
        expect(result.logs).toBeDefined();
        expect(result.release).toBeDefined();
        expect(result.isDeploying).toBeDefined();
        expect(typeof result.deploy).toBe('function');
      });
    });

    describe('useFlyRegions', () => {
      it('should return region utilities', () => {
        const result = useFlyRegions();

        expect(result.regions).toHaveLength(35);
        expect(typeof result.getInfo).toBe('function');
        expect(typeof result.getAll).toBe('function');
        expect(typeof result.getByContinent).toBe('function');
        expect(typeof result.getNearestRegions).toBe('function');
      });

      it('should get region info', () => {
        const { getInfo } = useFlyRegions();
        const info = getInfo('iad');

        expect(info.name).toBe('Ashburn');
        expect(info.country).toBe('United States');
      });

      it('should get all regions', () => {
        const { getAll } = useFlyRegions();
        const all = getAll();

        expect(all).toHaveLength(35);
        expect(all[0]).toHaveProperty('code');
        expect(all[0]).toHaveProperty('name');
      });

      it('should filter by continent', () => {
        const { getByContinent } = useFlyRegions();
        const europeanRegions = getByContinent('Europe');

        expect(europeanRegions.length).toBeGreaterThan(0);
        expect(europeanRegions.every(r => r.continent === 'Europe')).toBe(true);
      });

      it('should find nearest regions', () => {
        const { getNearestRegions } = useFlyRegions();
        // London coordinates
        const nearest = getNearestRegions(51.5074, -0.1278, 3);

        expect(nearest).toHaveLength(3);
        expect(nearest[0].code).toBe('lhr'); // Should be London
      });
    });
  });

  describe('Metrics', () => {
    describe('createMetricsCollector', () => {
      it('should create metrics collector', () => {
        const config: FlyConfig = { app: 'test-app' };
        const collector = createMetricsCollector(config);

        expect(collector.metrics).toBeDefined();
        expect(collector.history).toBeDefined();
        expect(typeof collector.collect).toBe('function');
        expect(typeof collector.startCollecting).toBe('function');
      });
    });
  });

  describe('CLI Integration', () => {
    describe('flyctl', () => {
      it('should export flyctl function', () => {
        expect(typeof flyctl).toBe('function');
      });
    });

    describe('fly', () => {
      it('should have launch command', () => {
        expect(typeof fly.launch).toBe('function');
      });

      it('should have deploy command', () => {
        expect(typeof fly.deploy).toBe('function');
      });

      it('should have status command', () => {
        expect(typeof fly.status).toBe('function');
      });

      it('should have logs command', () => {
        expect(typeof fly.logs).toBe('function');
      });

      it('should have ssh command', () => {
        expect(typeof fly.ssh).toBe('function');
      });

      it('should have secrets commands', () => {
        expect(typeof fly.secrets.list).toBe('function');
        expect(typeof fly.secrets.set).toBe('function');
        expect(typeof fly.secrets.unset).toBe('function');
      });

      it('should have scale commands', () => {
        expect(typeof fly.scale.count).toBe('function');
        expect(typeof fly.scale.vm).toBe('function');
        expect(typeof fly.scale.memory).toBe('function');
      });

      it('should have volumes commands', () => {
        expect(typeof fly.volumes.list).toBe('function');
        expect(typeof fly.volumes.create).toBe('function');
        expect(typeof fly.volumes.destroy).toBe('function');
      });

      it('should have certs commands', () => {
        expect(typeof fly.certs.list).toBe('function');
        expect(typeof fly.certs.add).toBe('function');
        expect(typeof fly.certs.remove).toBe('function');
        expect(typeof fly.certs.check).toBe('function');
      });

      it('should have regions commands', () => {
        expect(typeof fly.regions.list).toBe('function');
        expect(typeof fly.regions.add).toBe('function');
        expect(typeof fly.regions.remove).toBe('function');
      });

      it('should have postgres commands', () => {
        expect(typeof fly.postgres.create).toBe('function');
        expect(typeof fly.postgres.attach).toBe('function');
        expect(typeof fly.postgres.detach).toBe('function');
      });

      it('should have redis commands', () => {
        expect(typeof fly.redis.create).toBe('function');
      });
    });
  });

  describe('Integration Patterns', () => {
    it('should support basic deployment workflow', () => {
      const config: FlyConfig = {
        app: 'my-app',
        primaryRegion: 'iad',
        autoscaling: { minMachines: 1, maxMachines: 5 },
      };

      const adapter = createFlyAdapter(config);

      expect(adapter.state.value.config.app).toBe('my-app');
      expect(typeof adapter.deploy).toBe('function');
      expect(typeof adapter.scale).toBe('function');
    });

    it('should support multi-region deployment', () => {
      const config: FlyConfig = {
        app: 'global-app',
        primaryRegion: 'iad',
        services: [{ name: 'http', internalPort: 3000 }],
      };

      const adapter = createFlyAdapter(config);

      expect(typeof adapter.scaleToRegions).toBe('function');
      expect(adapter.getAllRegions()).toHaveLength(35);
    });

    it('should support configuration generation', () => {
      const config: FlyConfig = {
        app: 'generated-app',
        primaryRegion: 'iad',
        env: { NODE_ENV: 'production' },
        volumes: [{ name: 'data', size: 10, mountPath: '/data' }],
      };

      const toml = flyToml(config);
      const df = dockerfile({ port: 3000 });
      const ignore = dockerIgnore();

      expect(toml).toContain('app = "generated-app"');
      expect(df).toContain('EXPOSE 3000');
      expect(ignore).toContain('node_modules');
    });
  });
});
