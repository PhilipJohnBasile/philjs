/**
 * Tests for PhilJS Railway Integration
 *
 * Comprehensive Railway deployment, project management, and service orchestration
 * with signal-reactive state and real-time monitoring.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  // Main exports
  createRailwayState,
  createRailwayClient,
  createRailwayAdapter,
  RailwayApiError,
  // Hooks
  useRailwayProject,
  useRailwayDeployments,
  useRailwayLogs,
  useRailwayMetrics,
  useRailwayVariables,
  // Configuration generators
  railwayJson,
  nixpacksToml,
  procfile,
  // CLI
  railwayCli,
  railway,
  // Region info
  RAILWAY_REGIONS,
  getRegionInfo,
  getAllRegions,
  // Types
  type RailwayConfig,
  type RailwayRegion,
  type Project,
  type Team,
  type Environment,
  type EnvironmentMeta,
  type EnvironmentVariable,
  type Service,
  type ServiceSource,
  type Deployment,
  type DeploymentStatus,
  type DeploymentMeta,
  type User,
  type Domain,
  type CNAMECheck,
  type Volume,
  type Plugin,
  type PluginStatus,
  type PluginType,
  type DatabasePlugin,
  type DeploymentLog,
  type BuildLog,
  type Metric,
  type ServiceMetrics,
  type Usage,
  type UsageItem,
  type Template,
  type TemplateService,
  type RailwayState,
  type RailwayApiClient,
  type CreateProjectOptions,
  type CreateServiceOptions,
  type LogsOptions,
  type MetricsOptions,
  type RailwayJsonConfig,
  type NixpacksConfig,
  type NixpacksPhase,
  type RailwayCliOptions,
  type RegionInfo,
} from './index';

describe('PhilJS Railway Integration', () => {
  describe('Type Definitions', () => {
    describe('RailwayConfig', () => {
      it('should define configuration structure', () => {
        const config: RailwayConfig = {
          projectId: 'proj_123',
          environmentId: 'env_456',
          serviceId: 'srv_789',
          apiToken: 'railway_token_xxx',
          teamId: 'team_abc',
        };
        expect(config.projectId).toBe('proj_123');
        expect(config.environmentId).toBe('env_456');
      });

      it('should allow partial configuration', () => {
        const config: RailwayConfig = {
          projectId: 'proj_123',
        };
        expect(config.projectId).toBe('proj_123');
        expect(config.environmentId).toBeUndefined();
      });
    });

    describe('RailwayRegion', () => {
      it('should accept all valid regions', () => {
        const regions: RailwayRegion[] = [
          'us-west1', 'us-east4', 'europe-west4', 'asia-southeast1',
          'us-west2', 'us-central1', 'asia-northeast1', 'europe-west1',
        ];
        expect(regions.length).toBe(8);
      });
    });

    describe('Project', () => {
      it('should define project structure', () => {
        const project: Project = {
          id: 'proj_123',
          name: 'My Project',
          description: 'A test project',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          team: { id: 'team_1', name: 'My Team', createdAt: '2024-01-01T00:00:00Z' },
          environments: [],
          services: [],
          plugins: [],
          prDeploys: true,
          prForks: false,
          isPublic: false,
          baseEnvironmentId: 'env_base',
        };
        expect(project.id).toBe('proj_123');
        expect(project.prDeploys).toBe(true);
      });
    });

    describe('Team', () => {
      it('should define team structure', () => {
        const team: Team = {
          id: 'team_123',
          name: 'Engineering',
          avatar: 'https://example.com/avatar.png',
          createdAt: '2024-01-01T00:00:00Z',
        };
        expect(team.name).toBe('Engineering');
      });
    });

    describe('Environment', () => {
      it('should define environment structure', () => {
        const env: Environment = {
          id: 'env_123',
          name: 'production',
          isEphemeral: false,
          projectId: 'proj_456',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          variables: [],
          deployments: [],
          meta: {
            baseBranch: 'main',
            branch: 'feature/new-feature',
            prNumber: 42,
            prRepo: 'org/repo',
            prTitle: 'Add new feature',
          },
        };
        expect(env.name).toBe('production');
        expect(env.meta?.prNumber).toBe(42);
      });
    });

    describe('EnvironmentMeta', () => {
      it('should define environment meta structure', () => {
        const meta: EnvironmentMeta = {
          baseBranch: 'main',
          branch: 'feature/test',
          prNumber: 123,
          prRepo: 'owner/repo',
          prTitle: 'Test PR',
        };
        expect(meta.prNumber).toBe(123);
      });
    });

    describe('EnvironmentVariable', () => {
      it('should define variable structure', () => {
        const variable: EnvironmentVariable = {
          id: 'var_123',
          name: 'DATABASE_URL',
          value: 'postgresql://localhost:5432/db',
          environmentId: 'env_456',
          serviceId: 'srv_789',
          pluginId: undefined,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        };
        expect(variable.name).toBe('DATABASE_URL');
      });
    });

    describe('Service', () => {
      it('should define service structure', () => {
        const service: Service = {
          id: 'srv_123',
          name: 'web',
          projectId: 'proj_456',
          environmentId: 'env_789',
          source: {
            repo: 'github.com/org/repo',
            branch: 'main',
          },
          builder: 'NIXPACKS',
          startCommand: 'npm start',
          buildCommand: 'npm run build',
          watchPatterns: ['src/**'],
          rootDirectory: '/',
          healthcheckPath: '/health',
          healthcheckTimeout: 30,
          restartPolicyType: 'ON_FAILURE',
          restartPolicyMaxRetries: 3,
          numReplicas: 2,
          region: 'us-west1',
          cronSchedule: undefined,
          sleepApplication: false,
          icon: '🚀',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          deployments: [],
          domains: [],
          volumes: [],
        };
        expect(service.builder).toBe('NIXPACKS');
        expect(service.numReplicas).toBe(2);
      });

      it('should accept all builder types', () => {
        const builders: Service['builder'][] = ['NIXPACKS', 'DOCKERFILE', 'PAKETO', 'HEROKU'];
        expect(builders.length).toBe(4);
      });

      it('should accept all restart policy types', () => {
        const policies: Service['restartPolicyType'][] = ['ON_FAILURE', 'ALWAYS', 'NEVER'];
        expect(policies.length).toBe(3);
      });
    });

    describe('ServiceSource', () => {
      it('should define service source structure', () => {
        const source: ServiceSource = {
          repo: 'github.com/org/repo',
          branch: 'main',
          template: 'nodejs',
          image: 'node:18-alpine',
        };
        expect(source.repo).toBe('github.com/org/repo');
      });
    });

    describe('Deployment', () => {
      it('should define deployment structure', () => {
        const deployment: Deployment = {
          id: 'deploy_123',
          serviceId: 'srv_456',
          environmentId: 'env_789',
          projectId: 'proj_012',
          status: 'SUCCESS',
          creator: { id: 'user_1', name: 'John', email: 'john@example.com' },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          staticUrl: 'https://app.up.railway.app',
          meta: {
            branch: 'main',
            commitHash: 'abc123',
            commitMessage: 'Fix bug',
            commitAuthor: 'John',
            repo: 'org/repo',
          },
          canRedeploy: true,
          canRollback: true,
        };
        expect(deployment.status).toBe('SUCCESS');
        expect(deployment.canRedeploy).toBe(true);
      });
    });

    describe('DeploymentStatus', () => {
      it('should accept all status values', () => {
        const statuses: DeploymentStatus[] = [
          'BUILDING', 'DEPLOYING', 'SUCCESS', 'FAILED', 'CRASHED',
          'REMOVED', 'REMOVING', 'INITIALIZING', 'SKIPPED',
          'WAITING', 'QUEUED', 'SLEEPING', 'NEEDS_APPROVAL',
        ];
        expect(statuses.length).toBe(13);
      });
    });

    describe('DeploymentMeta', () => {
      it('should define deployment meta structure', () => {
        const meta: DeploymentMeta = {
          branch: 'main',
          commitHash: 'abc123def456',
          commitMessage: 'Update dependencies',
          commitAuthor: 'developer@example.com',
          repo: 'organization/repository',
          image: 'node:18',
        };
        expect(meta.commitHash).toBe('abc123def456');
      });
    });

    describe('User', () => {
      it('should define user structure', () => {
        const user: User = {
          id: 'user_123',
          name: 'Jane Doe',
          email: 'jane@example.com',
          avatar: 'https://example.com/avatar.jpg',
        };
        expect(user.email).toBe('jane@example.com');
      });
    });

    describe('Domain', () => {
      it('should define domain structure', () => {
        const domain: Domain = {
          id: 'domain_123',
          domain: 'app.example.com',
          serviceId: 'srv_456',
          environmentId: 'env_789',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          targetPort: 3000,
          suffix: 'up.railway.app',
          cnameCheck: {
            id: 'check_123',
            status: 'VALID',
            statusMessage: 'CNAME record verified',
            lastCheckedAt: '2024-01-02T00:00:00Z',
          },
        };
        expect(domain.domain).toBe('app.example.com');
        expect(domain.cnameCheck?.status).toBe('VALID');
      });
    });

    describe('CNAMECheck', () => {
      it('should define CNAME check structure', () => {
        const check: CNAMECheck = {
          id: 'check_123',
          status: 'PENDING',
          statusMessage: 'Waiting for DNS propagation',
          lastCheckedAt: '2024-01-01T00:00:00Z',
        };
        expect(check.status).toBe('PENDING');
      });

      it('should accept all status values', () => {
        const statuses: CNAMECheck['status'][] = ['PENDING', 'VALID', 'INVALID', 'ERROR'];
        expect(statuses.length).toBe(4);
      });
    });

    describe('Volume', () => {
      it('should define volume structure', () => {
        const volume: Volume = {
          id: 'vol_123',
          name: 'data-volume',
          mountPath: '/data',
          serviceId: 'srv_456',
          environmentId: 'env_789',
          projectId: 'proj_012',
          sizeGB: 20,
          state: 'ATTACHED',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        };
        expect(volume.sizeGB).toBe(20);
        expect(volume.state).toBe('ATTACHED');
      });

      it('should accept all state values', () => {
        const states: Volume['state'][] = ['CREATED', 'ATTACHED', 'DELETED'];
        expect(states.length).toBe(3);
      });
    });

    describe('Plugin', () => {
      it('should define plugin structure', () => {
        const plugin: Plugin = {
          id: 'plugin_123',
          name: 'postgresql',
          projectId: 'proj_456',
          friendlyName: 'Production Database',
          status: 'RUNNING',
          createdAt: '2024-01-01T00:00:00Z',
          migrationDatabaseServiceId: 'srv_migration',
        };
        expect(plugin.status).toBe('RUNNING');
      });
    });

    describe('PluginStatus', () => {
      it('should accept all status values', () => {
        const statuses: PluginStatus[] = ['LOCKED', 'RUNNING', 'STOPPED', 'REMOVED'];
        expect(statuses.length).toBe(4);
      });
    });

    describe('PluginType', () => {
      it('should accept all plugin types', () => {
        const types: PluginType[] = ['postgresql', 'mysql', 'mongodb', 'redis', 'minio'];
        expect(types.length).toBe(5);
      });
    });

    describe('DatabasePlugin', () => {
      it('should define database plugin structure', () => {
        const plugin: DatabasePlugin = {
          id: 'plugin_123',
          name: 'postgresql',
          projectId: 'proj_456',
          status: 'RUNNING',
          createdAt: '2024-01-01T00:00:00Z',
          type: 'postgresql',
          version: '15.2',
          connectionString: 'postgresql://user:pass@host:5432/db',
          host: 'postgres.railway.internal',
          port: 5432,
          username: 'postgres',
          password: 'secret',
          database: 'railway',
        };
        expect(plugin.type).toBe('postgresql');
        expect(plugin.port).toBe(5432);
      });
    });

    describe('DeploymentLog', () => {
      it('should define deployment log structure', () => {
        const log: DeploymentLog = {
          timestamp: '2024-01-01T00:00:00Z',
          severity: 'info',
          message: 'Application started successfully',
          attributes: { pid: 1234, memory: '128MB' },
        };
        expect(log.severity).toBe('info');
      });

      it('should accept all severity levels', () => {
        const severities: DeploymentLog['severity'][] = ['stdout', 'stderr', 'info', 'warn', 'error'];
        expect(severities.length).toBe(5);
      });
    });

    describe('BuildLog', () => {
      it('should define build log structure', () => {
        const log: BuildLog = {
          timestamp: '2024-01-01T00:00:00Z',
          message: 'Installing dependencies...',
        };
        expect(log.message).toBe('Installing dependencies...');
      });
    });

    describe('Metric', () => {
      it('should define metric structure', () => {
        const metric: Metric = {
          timestamp: '2024-01-01T00:00:00Z',
          value: 45.5,
        };
        expect(metric.value).toBe(45.5);
      });
    });

    describe('ServiceMetrics', () => {
      it('should define service metrics structure', () => {
        const metrics: ServiceMetrics = {
          serviceId: 'srv_123',
          cpu: [{ timestamp: '2024-01-01T00:00:00Z', value: 25.5 }],
          memory: [{ timestamp: '2024-01-01T00:00:00Z', value: 512 }],
          network: {
            rx: [{ timestamp: '2024-01-01T00:00:00Z', value: 1000 }],
            tx: [{ timestamp: '2024-01-01T00:00:00Z', value: 500 }],
          },
          disk: {
            read: [{ timestamp: '2024-01-01T00:00:00Z', value: 100 }],
            write: [{ timestamp: '2024-01-01T00:00:00Z', value: 50 }],
          },
        };
        expect(metrics.serviceId).toBe('srv_123');
        expect(metrics.cpu[0].value).toBe(25.5);
      });
    });

    describe('Usage', () => {
      it('should define usage structure', () => {
        const usage: Usage = {
          projectId: 'proj_123',
          environmentId: 'env_456',
          serviceId: 'srv_789',
          currentUsage: [
            { measurement: 'CPU', value: 100, unit: 'vCPU-hours', cost: 5.0 },
            { measurement: 'MEMORY', value: 512, unit: 'GB-hours', cost: 2.5 },
          ],
          estimatedMonthlyTotal: 150.0,
        };
        expect(usage.estimatedMonthlyTotal).toBe(150.0);
      });
    });

    describe('UsageItem', () => {
      it('should define usage item structure', () => {
        const item: UsageItem = {
          measurement: 'NETWORK',
          value: 10,
          unit: 'GB',
          cost: 1.0,
        };
        expect(item.measurement).toBe('NETWORK');
      });

      it('should accept all measurement types', () => {
        const measurements: UsageItem['measurement'][] = ['CPU', 'MEMORY', 'NETWORK', 'DISK', 'EXECUTION_TIME'];
        expect(measurements.length).toBe(5);
      });
    });

    describe('Template', () => {
      it('should define template structure', () => {
        const template: Template = {
          id: 'tmpl_123',
          code: 'nodejs-starter',
          name: 'Node.js Starter',
          description: 'A starter template for Node.js apps',
          image: 'https://railway.app/templates/nodejs.png',
          services: [
            {
              name: 'web',
              source: { template: 'nodejs' },
              variables: { NODE_ENV: 'production' },
              domains: [{ suffix: 'railway.app' }],
              volumes: [{ name: 'data', mountPath: '/data' }],
            },
          ],
          teamId: 'team_456',
          createdAt: '2024-01-01T00:00:00Z',
        };
        expect(template.code).toBe('nodejs-starter');
        expect(template.services.length).toBe(1);
      });
    });

    describe('TemplateService', () => {
      it('should define template service structure', () => {
        const service: TemplateService = {
          name: 'api',
          source: { image: 'node:18-alpine' },
          variables: { PORT: '3000' },
          domains: [{ suffix: 'railway.app' }],
          volumes: [{ name: 'uploads', mountPath: '/uploads' }],
        };
        expect(service.name).toBe('api');
      });
    });

    describe('RailwayState', () => {
      it('should define state structure', () => {
        const state: RailwayState = {
          config: { projectId: 'proj_123' },
          project: null,
          environments: [],
          services: [],
          deployments: [],
          variables: [],
          plugins: [],
          loading: false,
          error: null,
          connected: false,
        };
        expect(state.loading).toBe(false);
        expect(state.connected).toBe(false);
      });
    });

    describe('CreateProjectOptions', () => {
      it('should define create project options', () => {
        const options: CreateProjectOptions = {
          description: 'A new project',
          teamId: 'team_123',
          isPublic: false,
          prDeploys: true,
          prForks: false,
          defaultEnvironmentName: 'production',
          plugins: ['postgresql', 'redis'],
        };
        expect(options.plugins).toContain('postgresql');
      });
    });

    describe('CreateServiceOptions', () => {
      it('should define create service options', () => {
        const options: CreateServiceOptions = {
          projectId: 'proj_123',
          environmentId: 'env_456',
          name: 'web',
          source: { repo: 'github.com/org/repo' },
          builder: 'NIXPACKS',
          startCommand: 'npm start',
          buildCommand: 'npm run build',
          rootDirectory: '/app',
          healthcheckPath: '/health',
          region: 'us-west1',
          numReplicas: 2,
          variables: { NODE_ENV: 'production' },
        };
        expect(options.name).toBe('web');
        expect(options.numReplicas).toBe(2);
      });
    });

    describe('LogsOptions', () => {
      it('should define logs options', () => {
        const options: LogsOptions = {
          limit: 1000,
          filter: 'error',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-02'),
        };
        expect(options.limit).toBe(1000);
        expect(options.filter).toBe('error');
      });
    });

    describe('MetricsOptions', () => {
      it('should define metrics options', () => {
        const options: MetricsOptions = {
          period: '24h',
          resolution: 'hour',
        };
        expect(options.period).toBe('24h');
      });

      it('should accept all period values', () => {
        const periods: MetricsOptions['period'][] = ['15m', '1h', '6h', '24h', '7d', '30d'];
        expect(periods.length).toBe(6);
      });

      it('should accept all resolution values', () => {
        const resolutions: MetricsOptions['resolution'][] = ['minute', 'hour', 'day'];
        expect(resolutions.length).toBe(3);
      });
    });

    describe('RailwayJsonConfig', () => {
      it('should define railway.json config', () => {
        const config: RailwayJsonConfig = {
          schema: 'https://railway.app/railway.schema.json',
          build: {
            builder: 'NIXPACKS',
            buildCommand: 'npm run build',
            watchPatterns: ['src/**'],
            nixpacksConfigPath: 'nixpacks.toml',
            nixpacksPlanPath: 'nixpacks-plan.json',
            dockerfilePath: 'Dockerfile',
          },
          deploy: {
            startCommand: 'npm start',
            healthcheckPath: '/health',
            healthcheckTimeout: 30,
            restartPolicyType: 'ON_FAILURE',
            restartPolicyMaxRetries: 3,
            numReplicas: 2,
            region: 'us-west1',
            sleepApplication: false,
            cronSchedule: '0 * * * *',
          },
        };
        expect(config.build?.builder).toBe('NIXPACKS');
        expect(config.deploy?.numReplicas).toBe(2);
      });
    });

    describe('NixpacksConfig', () => {
      it('should define nixpacks config', () => {
        const config: NixpacksConfig = {
          providers: ['node', 'npm'],
          buildImage: 'ghcr.io/railwayapp/nixpacks:latest',
          phases: {
            setup: {
              cmds: ['npm install'],
              cacheDirectories: ['node_modules'],
            },
            build: {
              dependsOn: ['setup'],
              cmds: ['npm run build'],
            },
          },
          start: {
            cmd: 'npm start',
            runImage: 'node:18-alpine',
            onlyIncludeFiles: ['dist/**', 'package.json'],
          },
          staticAssets: {
            '/static': 'public',
          },
          variables: {
            NODE_ENV: 'production',
          },
          aptPkgs: ['curl'],
          libs: ['libssl1.1'],
        };
        expect(config.providers).toContain('node');
      });
    });

    describe('NixpacksPhase', () => {
      it('should define nixpacks phase', () => {
        const phase: NixpacksPhase = {
          dependsOn: ['setup'],
          cmds: ['npm run build', 'npm run test'],
          cacheDirectories: ['node_modules', '.next/cache'],
          paths: ['/usr/local/bin'],
          aptPkgs: ['git', 'curl'],
          nix: { pkgs: ['nodejs-18_x'] },
        };
        expect(phase.cmds).toContain('npm run build');
      });
    });

    describe('RailwayCliOptions', () => {
      it('should define CLI options', () => {
        const options: RailwayCliOptions = {
          cwd: '/app',
          env: { RAILWAY_TOKEN: 'xxx' },
        };
        expect(options.cwd).toBe('/app');
      });
    });

    describe('RegionInfo', () => {
      it('should define region info', () => {
        const info: RegionInfo = {
          name: 'US West 1',
          location: 'Oregon, USA',
          provider: 'GCP',
        };
        expect(info.location).toBe('Oregon, USA');
      });
    });
  });

  describe('State Management', () => {
    describe('createRailwayState', () => {
      it('should create initial state with config', () => {
        const config: RailwayConfig = {
          projectId: 'proj_123',
          environmentId: 'env_456',
        };
        const { state } = createRailwayState(config);
        expect(state.value.config.projectId).toBe('proj_123');
        expect(state.value.project).toBeNull();
        expect(state.value.environments).toEqual([]);
        expect(state.value.loading).toBe(false);
        expect(state.value.connected).toBe(false);
      });

      it('should return computed signals', () => {
        const config: RailwayConfig = { projectId: 'proj_123' };
        const result = createRailwayState(config);

        expect(result.state).toBeDefined();
        expect(result.activeEnvironment).toBeDefined();
        expect(result.activeService).toBeDefined();
        expect(result.latestDeployment).toBeDefined();
        expect(result.isDeploying).toBeDefined();
        expect(result.healthyServices).toBeDefined();
        expect(result.servicesByEnvironment).toBeDefined();
      });

      it('should compute activeEnvironment correctly', () => {
        const config: RailwayConfig = {
          projectId: 'proj_123',
          environmentId: 'env_production',
        };
        const { state, activeEnvironment } = createRailwayState(config);

        state.value = {
          ...state.value,
          environments: [
            { id: 'env_staging', name: 'staging' } as Environment,
            { id: 'env_production', name: 'production' } as Environment,
          ],
        };

        expect(activeEnvironment.value?.name).toBe('production');
      });

      it('should compute activeService correctly', () => {
        const config: RailwayConfig = {
          projectId: 'proj_123',
          serviceId: 'srv_web',
        };
        const { state, activeService } = createRailwayState(config);

        state.value = {
          ...state.value,
          services: [
            { id: 'srv_api', name: 'api' } as Service,
            { id: 'srv_web', name: 'web' } as Service,
          ],
        };

        expect(activeService.value?.name).toBe('web');
      });

      it('should compute latestDeployment correctly', () => {
        const config: RailwayConfig = { projectId: 'proj_123' };
        const { state, latestDeployment } = createRailwayState(config);

        state.value = {
          ...state.value,
          deployments: [
            { id: 'deploy_1', createdAt: '2024-01-01T00:00:00Z' } as Deployment,
            { id: 'deploy_2', createdAt: '2024-01-03T00:00:00Z' } as Deployment,
            { id: 'deploy_3', createdAt: '2024-01-02T00:00:00Z' } as Deployment,
          ],
        };

        expect(latestDeployment.value?.id).toBe('deploy_2');
      });

      it('should compute isDeploying correctly', () => {
        const config: RailwayConfig = { projectId: 'proj_123' };
        const { state, isDeploying } = createRailwayState(config);

        state.value = {
          ...state.value,
          deployments: [
            { id: 'deploy_1', status: 'SUCCESS' } as Deployment,
          ],
        };

        expect(isDeploying.value).toBe(false);

        state.value = {
          ...state.value,
          deployments: [
            { id: 'deploy_1', status: 'SUCCESS' } as Deployment,
            { id: 'deploy_2', status: 'BUILDING' } as Deployment,
          ],
        };

        expect(isDeploying.value).toBe(true);
      });

      it('should compute healthyServices correctly', () => {
        const config: RailwayConfig = { projectId: 'proj_123' };
        const { state, healthyServices } = createRailwayState(config);

        state.value = {
          ...state.value,
          services: [
            { id: 'srv_1', name: 'api' } as Service,
            { id: 'srv_2', name: 'web' } as Service,
          ],
          deployments: [
            { id: 'deploy_1', serviceId: 'srv_1', status: 'SUCCESS', createdAt: '2024-01-01T00:00:00Z' } as Deployment,
            { id: 'deploy_2', serviceId: 'srv_2', status: 'FAILED', createdAt: '2024-01-01T00:00:00Z' } as Deployment,
          ],
        };

        expect(healthyServices.value.length).toBe(1);
        expect(healthyServices.value[0].name).toBe('api');
      });

      it('should compute servicesByEnvironment correctly', () => {
        const config: RailwayConfig = { projectId: 'proj_123' };
        const { state, servicesByEnvironment } = createRailwayState(config);

        state.value = {
          ...state.value,
          services: [
            { id: 'srv_1', name: 'api', environmentId: 'env_prod' } as Service,
            { id: 'srv_2', name: 'web', environmentId: 'env_prod' } as Service,
            { id: 'srv_3', name: 'worker', environmentId: 'env_staging' } as Service,
          ],
        };

        expect(servicesByEnvironment.value.get('env_prod')?.length).toBe(2);
        expect(servicesByEnvironment.value.get('env_staging')?.length).toBe(1);
      });
    });
  });

  describe('API Client', () => {
    describe('createRailwayClient', () => {
      it('should create client with all API methods', () => {
        const config: RailwayConfig = { apiToken: 'test_token' };
        const client = createRailwayClient(config);

        // Projects
        expect(typeof client.getProject).toBe('function');
        expect(typeof client.listProjects).toBe('function');
        expect(typeof client.createProject).toBe('function');
        expect(typeof client.updateProject).toBe('function');
        expect(typeof client.deleteProject).toBe('function');

        // Environments
        expect(typeof client.getEnvironment).toBe('function');
        expect(typeof client.createEnvironment).toBe('function');
        expect(typeof client.deleteEnvironment).toBe('function');

        // Services
        expect(typeof client.getService).toBe('function');
        expect(typeof client.createService).toBe('function');
        expect(typeof client.updateService).toBe('function');
        expect(typeof client.deleteService).toBe('function');
        expect(typeof client.restartService).toBe('function');

        // Deployments
        expect(typeof client.getDeployment).toBe('function');
        expect(typeof client.listDeployments).toBe('function');
        expect(typeof client.triggerDeploy).toBe('function');
        expect(typeof client.cancelDeploy).toBe('function');
        expect(typeof client.rollback).toBe('function');
        expect(typeof client.redeploy).toBe('function');

        // Variables
        expect(typeof client.listVariables).toBe('function');
        expect(typeof client.setVariable).toBe('function');
        expect(typeof client.deleteVariable).toBe('function');
        expect(typeof client.bulkSetVariables).toBe('function');

        // Domains
        expect(typeof client.listDomains).toBe('function');
        expect(typeof client.addDomain).toBe('function');
        expect(typeof client.deleteDomain).toBe('function');
        expect(typeof client.generateDomain).toBe('function');

        // Volumes
        expect(typeof client.listVolumes).toBe('function');
        expect(typeof client.createVolume).toBe('function');
        expect(typeof client.updateVolume).toBe('function');
        expect(typeof client.deleteVolume).toBe('function');

        // Plugins
        expect(typeof client.listPlugins).toBe('function');
        expect(typeof client.createPlugin).toBe('function');
        expect(typeof client.deletePlugin).toBe('function');
        expect(typeof client.restartPlugin).toBe('function');

        // Logs
        expect(typeof client.getLogs).toBe('function');
        expect(typeof client.getBuildLogs).toBe('function');
        expect(typeof client.streamLogs).toBe('function');

        // Metrics
        expect(typeof client.getMetrics).toBe('function');
        expect(typeof client.getUsage).toBe('function');

        // Templates
        expect(typeof client.listTemplates).toBe('function');
        expect(typeof client.deployTemplate).toBe('function');
      });
    });

    describe('RailwayApiError', () => {
      it('should create error with message', () => {
        const error = new RailwayApiError('API Error');
        expect(error.message).toBe('API Error');
        expect(error.name).toBe('RailwayApiError');
      });

      it('should include GraphQL errors', () => {
        const graphqlErrors = [{ message: 'Field not found' }];
        const error = new RailwayApiError('GraphQL Error', graphqlErrors);
        expect(error.errors).toEqual(graphqlErrors);
      });
    });
  });

  describe('Railway Adapter', () => {
    describe('createRailwayAdapter', () => {
      it('should create adapter with state and methods', () => {
        const config: RailwayConfig = {
          projectId: 'proj_123',
          environmentId: 'env_456',
          serviceId: 'srv_789',
        };
        const adapter = createRailwayAdapter(config);

        // State
        expect(adapter.state).toBeDefined();
        expect(adapter.activeEnvironment).toBeDefined();
        expect(adapter.activeService).toBeDefined();
        expect(adapter.latestDeployment).toBeDefined();
        expect(adapter.isDeploying).toBeDefined();
        expect(adapter.healthyServices).toBeDefined();
        expect(adapter.servicesByEnvironment).toBeDefined();

        // State management
        expect(typeof adapter.refreshState).toBe('function');
        expect(typeof adapter.startAutoRefresh).toBe('function');
        expect(typeof adapter.stopAutoRefresh).toBe('function');

        // Client
        expect(adapter.client).toBeDefined();

        // Convenience methods
        expect(typeof adapter.deploy).toBe('function');
        expect(typeof adapter.setEnvVar).toBe('function');
        expect(typeof adapter.setEnvVars).toBe('function');
        expect(typeof adapter.scale).toBe('function');
        expect(typeof adapter.addCustomDomain).toBe('function');
        expect(typeof adapter.restart).toBe('function');
        expect(typeof adapter.getProjectUrl).toBe('function');
        expect(adapter.envVars).toBeDefined();
      });

      it('should return correct project URL', () => {
        const config: RailwayConfig = { projectId: 'proj_123' };
        const adapter = createRailwayAdapter(config);

        expect(adapter.getProjectUrl()).toBe('https://railway.app/project/proj_123');
      });

      it('should return null for project URL when no project ID', () => {
        const config: RailwayConfig = {};
        const adapter = createRailwayAdapter(config);

        expect(adapter.getProjectUrl()).toBeNull();
      });

      it('should have envVars helper', () => {
        const config: RailwayConfig = { projectId: 'proj_123', environmentId: 'env_456' };
        const adapter = createRailwayAdapter(config);

        expect(typeof adapter.envVars.get).toBe('function');
        expect(typeof adapter.envVars.set).toBe('function');
      });
    });
  });

  describe('Hooks', () => {
    describe('useRailwayProject', () => {
      it('should be a function', () => {
        expect(typeof useRailwayProject).toBe('function');
      });
    });

    describe('useRailwayDeployments', () => {
      it('should be a function', () => {
        expect(typeof useRailwayDeployments).toBe('function');
      });

      it('should return deployments state and actions', () => {
        const result = useRailwayDeployments('proj_123', 'srv_456');
        expect(result.deployments).toBeDefined();
        expect(result.loading).toBeDefined();
        expect(result.error).toBeDefined();
        expect(typeof result.refresh).toBe('function');
        expect(typeof result.deploy).toBe('function');
        expect(typeof result.rollback).toBe('function');
      });
    });

    describe('useRailwayLogs', () => {
      it('should be a function', () => {
        expect(typeof useRailwayLogs).toBe('function');
      });

      it('should return logs state and actions', () => {
        const result = useRailwayLogs('deploy_123');
        expect(result.logs).toBeDefined();
        expect(result.buildLogs).toBeDefined();
        expect(result.loading).toBeDefined();
        expect(typeof result.refresh).toBe('function');
        expect(typeof result.startStreaming).toBe('function');
      });
    });

    describe('useRailwayMetrics', () => {
      it('should be a function', () => {
        expect(typeof useRailwayMetrics).toBe('function');
      });

      it('should return metrics state and actions', () => {
        const result = useRailwayMetrics('srv_123');
        expect(result.metrics).toBeDefined();
        expect(result.loading).toBeDefined();
        expect(result.period).toBeDefined();
        expect(typeof result.refresh).toBe('function');
        expect(typeof result.setPeriod).toBe('function');
      });
    });

    describe('useRailwayVariables', () => {
      it('should be a function', () => {
        expect(typeof useRailwayVariables).toBe('function');
      });

      it('should return variables state and actions', () => {
        const result = useRailwayVariables('proj_123', 'env_456');
        expect(result.variables).toBeDefined();
        expect(result.loading).toBeDefined();
        expect(result.error).toBeDefined();
        expect(typeof result.refresh).toBe('function');
        expect(typeof result.set).toBe('function');
        expect(typeof result.delete).toBe('function');
        expect(typeof result.bulkSet).toBe('function');
      });
    });
  });

  describe('Configuration Generators', () => {
    describe('railwayJson', () => {
      it('should generate default railway.json', () => {
        const json = railwayJson();
        const parsed = JSON.parse(json);

        expect(parsed['$schema']).toBe('https://railway.app/railway.schema.json');
        expect(parsed.build.builder).toBe('NIXPACKS');
        expect(parsed.deploy.startCommand).toBe('npm start');
        expect(parsed.deploy.healthcheckPath).toBe('/health');
      });

      it('should generate railway.json with custom config', () => {
        const json = railwayJson({
          build: {
            builder: 'DOCKERFILE',
            buildCommand: 'docker build .',
            dockerfilePath: 'Dockerfile.prod',
          },
          deploy: {
            startCommand: 'node server.js',
            numReplicas: 3,
            region: 'us-east4',
            cronSchedule: '0 0 * * *',
          },
        });
        const parsed = JSON.parse(json);

        expect(parsed.build.builder).toBe('DOCKERFILE');
        expect(parsed.build.dockerfilePath).toBe('Dockerfile.prod');
        expect(parsed.deploy.numReplicas).toBe(3);
        expect(parsed.deploy.region).toBe('us-east4');
        expect(parsed.deploy.cronSchedule).toBe('0 0 * * *');
      });
    });

    describe('nixpacksToml', () => {
      it('should generate empty nixpacks.toml with comment', () => {
        const toml = nixpacksToml();
        expect(toml).toContain('# Nixpacks configuration');
      });

      it('should generate nixpacks.toml with providers', () => {
        const toml = nixpacksToml({ providers: ['node', 'npm'] });
        expect(toml).toContain('providers = ["node", "npm"]');
      });

      it('should generate nixpacks.toml with buildImage', () => {
        const toml = nixpacksToml({ buildImage: 'ghcr.io/railwayapp/nixpacks:latest' });
        expect(toml).toContain('buildImage = "ghcr.io/railwayapp/nixpacks:latest"');
      });

      it('should generate nixpacks.toml with variables', () => {
        const toml = nixpacksToml({
          variables: {
            NODE_ENV: 'production',
            PORT: '3000',
          },
        });
        expect(toml).toContain('[variables]');
        expect(toml).toContain('NODE_ENV = "production"');
        expect(toml).toContain('PORT = "3000"');
      });

      it('should generate nixpacks.toml with phases', () => {
        const toml = nixpacksToml({
          phases: {
            setup: {
              cmds: ['npm install'],
              cacheDirectories: ['node_modules'],
            },
            build: {
              dependsOn: ['setup'],
              cmds: ['npm run build'],
            },
          },
        });
        expect(toml).toContain('[phases.setup]');
        expect(toml).toContain('[phases.build]');
        expect(toml).toContain('dependsOn = ["setup"]');
        expect(toml).toContain('"npm install"');
        expect(toml).toContain('"npm run build"');
      });

      it('should generate nixpacks.toml with start config', () => {
        const toml = nixpacksToml({
          start: {
            cmd: 'npm start',
            runImage: 'node:18-alpine',
            onlyIncludeFiles: ['dist/**', 'package.json'],
          },
        });
        expect(toml).toContain('[start]');
        expect(toml).toContain('cmd = "npm start"');
        expect(toml).toContain('runImage = "node:18-alpine"');
        expect(toml).toContain('onlyIncludeFiles');
      });
    });

    describe('procfile', () => {
      it('should generate Procfile', () => {
        const result = procfile({
          web: 'npm start',
          worker: 'npm run worker',
          scheduler: 'npm run scheduler',
        });

        expect(result).toContain('web: npm start');
        expect(result).toContain('worker: npm run worker');
        expect(result).toContain('scheduler: npm run scheduler');
      });

      it('should generate single-process Procfile', () => {
        const result = procfile({ web: 'node server.js' });
        expect(result).toBe('web: node server.js');
      });
    });
  });

  describe('CLI Integration', () => {
    describe('railwayCli', () => {
      it('should be a function', () => {
        expect(typeof railwayCli).toBe('function');
      });
    });

    describe('railway commands', () => {
      it('should have init command', () => {
        expect(typeof railway.init).toBe('function');
      });

      it('should have link command', () => {
        expect(typeof railway.link).toBe('function');
      });

      it('should have up command', () => {
        expect(typeof railway.up).toBe('function');
      });

      it('should have down command', () => {
        expect(typeof railway.down).toBe('function');
      });

      it('should have run command', () => {
        expect(typeof railway.run).toBe('function');
      });

      it('should have logs command', () => {
        expect(typeof railway.logs).toBe('function');
      });

      it('should have status command', () => {
        expect(typeof railway.status).toBe('function');
      });

      it('should have environment command', () => {
        expect(typeof railway.environment).toBe('function');
      });

      it('should have domain commands', () => {
        expect(typeof railway.domain.add).toBe('function');
        expect(typeof railway.domain.list).toBe('function');
        expect(typeof railway.domain.delete).toBe('function');
      });

      it('should have variables commands', () => {
        expect(typeof railway.variables.list).toBe('function');
        expect(typeof railway.variables.set).toBe('function');
        expect(typeof railway.variables.delete).toBe('function');
      });

      it('should have service commands', () => {
        expect(typeof railway.service.list).toBe('function');
        expect(typeof railway.service.create).toBe('function');
        expect(typeof railway.service.delete).toBe('function');
      });

      it('should have volume commands', () => {
        expect(typeof railway.volume.list).toBe('function');
        expect(typeof railway.volume.create).toBe('function');
        expect(typeof railway.volume.delete).toBe('function');
      });

      it('should have auth commands', () => {
        expect(typeof railway.login).toBe('function');
        expect(typeof railway.logout).toBe('function');
        expect(typeof railway.whoami).toBe('function');
      });

      it('should have open command', () => {
        expect(typeof railway.open).toBe('function');
      });
    });
  });

  describe('Region Information', () => {
    describe('RAILWAY_REGIONS', () => {
      it('should define all 8 regions', () => {
        const regionCodes = Object.keys(RAILWAY_REGIONS);
        expect(regionCodes.length).toBe(8);
      });

      it('should have correct US regions', () => {
        expect(RAILWAY_REGIONS['us-west1'].location).toBe('Oregon, USA');
        expect(RAILWAY_REGIONS['us-west2'].location).toBe('Los Angeles, USA');
        expect(RAILWAY_REGIONS['us-east4'].location).toBe('Virginia, USA');
        expect(RAILWAY_REGIONS['us-central1'].location).toBe('Iowa, USA');
      });

      it('should have correct European regions', () => {
        expect(RAILWAY_REGIONS['europe-west1'].location).toBe('Belgium');
        expect(RAILWAY_REGIONS['europe-west4'].location).toBe('Netherlands');
      });

      it('should have correct Asian regions', () => {
        expect(RAILWAY_REGIONS['asia-southeast1'].location).toBe('Singapore');
        expect(RAILWAY_REGIONS['asia-northeast1'].location).toBe('Tokyo, Japan');
      });

      it('should all use GCP provider', () => {
        for (const region of Object.values(RAILWAY_REGIONS)) {
          expect(region.provider).toBe('GCP');
        }
      });
    });

    describe('getRegionInfo', () => {
      it('should return info for valid region', () => {
        const info = getRegionInfo('us-west1');
        expect(info.name).toBe('US West 1');
        expect(info.location).toBe('Oregon, USA');
        expect(info.provider).toBe('GCP');
      });

      it('should return info for all regions', () => {
        const regions: RailwayRegion[] = [
          'us-west1', 'us-west2', 'us-east4', 'us-central1',
          'europe-west1', 'europe-west4', 'asia-southeast1', 'asia-northeast1',
        ];

        for (const region of regions) {
          const info = getRegionInfo(region);
          expect(info).toBeDefined();
          expect(info.name).toBeDefined();
          expect(info.location).toBeDefined();
          expect(info.provider).toBeDefined();
        }
      });
    });

    describe('getAllRegions', () => {
      it('should return all regions with codes', () => {
        const regions = getAllRegions();
        expect(regions.length).toBe(8);

        for (const region of regions) {
          expect(region.code).toBeDefined();
          expect(region.name).toBeDefined();
          expect(region.location).toBeDefined();
          expect(region.provider).toBeDefined();
        }
      });

      it('should include code in each region object', () => {
        const regions = getAllRegions();
        const codes = regions.map(r => r.code);

        expect(codes).toContain('us-west1');
        expect(codes).toContain('europe-west4');
        expect(codes).toContain('asia-southeast1');
      });
    });
  });
});
