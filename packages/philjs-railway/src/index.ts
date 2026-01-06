/**
 * PhilJS Railway Integration
 *
 * Comprehensive Railway deployment, project management, and service orchestration
 * with signal-reactive state and real-time monitoring.
 */

import { signal, computed, effect, batch } from '@philjs/core';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface RailwayConfig {
    projectId?: string;
    environmentId?: string;
    serviceId?: string;
    apiToken?: string;
    teamId?: string;
}

export type RailwayRegion =
    | 'us-west1' | 'us-east4' | 'europe-west4' | 'asia-southeast1'
    | 'us-west2' | 'us-central1' | 'asia-northeast1' | 'europe-west1';

export interface Project {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    team?: Team;
    environments: Environment[];
    services: Service[];
    plugins: Plugin[];
    prDeploys: boolean;
    prForks: boolean;
    isPublic: boolean;
    baseEnvironmentId?: string;
}

export interface Team {
    id: string;
    name: string;
    avatar?: string;
    createdAt: string;
}

export interface Environment {
    id: string;
    name: string;
    isEphemeral: boolean;
    projectId: string;
    createdAt: string;
    updatedAt: string;
    variables: EnvironmentVariable[];
    deployments: Deployment[];
    meta?: EnvironmentMeta;
    sourceEnvironment?: Environment;
}

export interface EnvironmentMeta {
    baseBranch?: string;
    branch?: string;
    prNumber?: number;
    prRepo?: string;
    prTitle?: string;
}

export interface EnvironmentVariable {
    id: string;
    name: string;
    value: string;
    environmentId: string;
    serviceId?: string;
    pluginId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Service {
    id: string;
    name: string;
    projectId: string;
    environmentId: string;
    source?: ServiceSource;
    builder: 'NIXPACKS' | 'DOCKERFILE' | 'PAKETO' | 'HEROKU';
    startCommand?: string;
    buildCommand?: string;
    watchPatterns?: string[];
    rootDirectory?: string;
    healthcheckPath?: string;
    healthcheckTimeout?: number;
    restartPolicyType: 'ON_FAILURE' | 'ALWAYS' | 'NEVER';
    restartPolicyMaxRetries?: number;
    numReplicas: number;
    region?: RailwayRegion;
    cronSchedule?: string;
    sleepApplication?: boolean;
    icon?: string;
    createdAt: string;
    updatedAt: string;
    deployments: Deployment[];
    domains: Domain[];
    volumes: Volume[];
}

export interface ServiceSource {
    repo?: string;
    branch?: string;
    template?: string;
    image?: string;
}

export interface Deployment {
    id: string;
    serviceId: string;
    environmentId: string;
    projectId: string;
    status: DeploymentStatus;
    creator?: User;
    createdAt: string;
    updatedAt: string;
    staticUrl?: string;
    meta?: DeploymentMeta;
    canRedeploy: boolean;
    canRollback: boolean;
}

export type DeploymentStatus =
    | 'BUILDING'
    | 'DEPLOYING'
    | 'SUCCESS'
    | 'FAILED'
    | 'CRASHED'
    | 'REMOVED'
    | 'REMOVING'
    | 'INITIALIZING'
    | 'SKIPPED'
    | 'WAITING'
    | 'QUEUED'
    | 'SLEEPING'
    | 'NEEDS_APPROVAL';

export interface DeploymentMeta {
    branch?: string;
    commitHash?: string;
    commitMessage?: string;
    commitAuthor?: string;
    repo?: string;
    image?: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
}

export interface Domain {
    id: string;
    domain: string;
    serviceId: string;
    environmentId: string;
    createdAt: string;
    updatedAt: string;
    targetPort?: number;
    suffix?: string;
    cnameCheck?: CNAMECheck;
}

export interface CNAMECheck {
    id: string;
    status: 'PENDING' | 'VALID' | 'INVALID' | 'ERROR';
    statusMessage?: string;
    lastCheckedAt: string;
}

export interface Volume {
    id: string;
    name: string;
    mountPath: string;
    serviceId: string;
    environmentId: string;
    projectId: string;
    sizeGB: number;
    state: 'CREATED' | 'ATTACHED' | 'DELETED';
    createdAt: string;
    updatedAt: string;
}

export interface Plugin {
    id: string;
    name: string;
    projectId: string;
    friendlyName?: string;
    status: PluginStatus;
    createdAt: string;
    migrationDatabaseServiceId?: string;
}

export type PluginStatus = 'LOCKED' | 'RUNNING' | 'STOPPED' | 'REMOVED';
export type PluginType = 'postgresql' | 'mysql' | 'mongodb' | 'redis' | 'minio';

export interface DatabasePlugin extends Plugin {
    type: PluginType;
    version?: string;
    connectionString?: string;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database?: string;
}

export interface DeploymentLog {
    timestamp: string;
    severity: 'stdout' | 'stderr' | 'info' | 'warn' | 'error';
    message: string;
    attributes?: Record<string, any>;
}

export interface BuildLog {
    timestamp: string;
    message: string;
}

export interface Metric {
    timestamp: string;
    value: number;
}

export interface ServiceMetrics {
    serviceId: string;
    cpu: Metric[];
    memory: Metric[];
    network: {
        rx: Metric[];
        tx: Metric[];
    };
    disk: {
        read: Metric[];
        write: Metric[];
    };
}

export interface Usage {
    projectId: string;
    environmentId?: string;
    serviceId?: string;
    currentUsage: UsageItem[];
    estimatedMonthlyTotal: number;
}

export interface UsageItem {
    measurement: 'CPU' | 'MEMORY' | 'NETWORK' | 'DISK' | 'EXECUTION_TIME';
    value: number;
    unit: string;
    cost: number;
}

export interface Template {
    id: string;
    code: string;
    name: string;
    description?: string;
    image?: string;
    services: TemplateService[];
    teamId?: string;
    createdAt: string;
}

export interface TemplateService {
    name: string;
    source?: ServiceSource;
    variables?: Record<string, string>;
    domains?: { suffix: string }[];
    volumes?: { name: string; mountPath: string }[];
}

// ============================================================================
// State Management with Signals
// ============================================================================

export interface RailwayState {
    config: RailwayConfig;
    project: Project | null;
    environments: Environment[];
    services: Service[];
    deployments: Deployment[];
    variables: EnvironmentVariable[];
    plugins: Plugin[];
    loading: boolean;
    error: string | null;
    connected: boolean;
}

export function createRailwayState(config: RailwayConfig) {
    const state = signal<RailwayState>({
        config,
        project: null,
        environments: [],
        services: [],
        deployments: [],
        variables: [],
        plugins: [],
        loading: false,
        error: null,
        connected: false
    });

    const activeEnvironment = computed(() =>
        state.value.environments.find(e => e.id === state.value.config.environmentId)
    );

    const activeService = computed(() =>
        state.value.services.find(s => s.id === state.value.config.serviceId)
    );

    const latestDeployment = computed(() => {
        const deployments = [...state.value.deployments].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        return deployments[0];
    });

    const isDeploying = computed(() =>
        state.value.deployments.some(d =>
            ['BUILDING', 'DEPLOYING', 'INITIALIZING', 'QUEUED', 'WAITING'].includes(d.status)
        )
    );

    const healthyServices = computed(() =>
        state.value.services.filter(s => {
            const latestDeploy = state.value.deployments
                .filter(d => d.serviceId === s.id)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
            return latestDeploy?.status === 'SUCCESS';
        })
    );

    const servicesByEnvironment = computed(() => {
        const map = new Map<string, Service[]>();
        for (const service of state.value.services) {
            const existing = map.get(service.environmentId) || [];
            map.set(service.environmentId, [...existing, service]);
        }
        return map;
    });

    return {
        state,
        activeEnvironment,
        activeService,
        latestDeployment,
        isDeploying,
        healthyServices,
        servicesByEnvironment
    };
}

// ============================================================================
// Railway GraphQL API Client
// ============================================================================

export interface RailwayApiClient {
    // Projects
    getProject(id: string): Promise<Project>;
    listProjects(): Promise<Project[]>;
    createProject(name: string, options?: CreateProjectOptions): Promise<Project>;
    updateProject(id: string, updates: Partial<Project>): Promise<Project>;
    deleteProject(id: string): Promise<void>;

    // Environments
    getEnvironment(id: string): Promise<Environment>;
    createEnvironment(projectId: string, name: string, sourceEnvironmentId?: string): Promise<Environment>;
    deleteEnvironment(id: string): Promise<void>;

    // Services
    getService(id: string): Promise<Service>;
    createService(options: CreateServiceOptions): Promise<Service>;
    updateService(id: string, updates: Partial<Service>): Promise<Service>;
    deleteService(id: string): Promise<void>;
    restartService(id: string): Promise<void>;

    // Deployments
    getDeployment(id: string): Promise<Deployment>;
    listDeployments(serviceId: string, limit?: number): Promise<Deployment[]>;
    triggerDeploy(serviceId: string): Promise<Deployment>;
    cancelDeploy(deploymentId: string): Promise<void>;
    rollback(deploymentId: string): Promise<Deployment>;
    redeploy(deploymentId: string): Promise<Deployment>;

    // Variables
    listVariables(projectId: string, environmentId: string, serviceId?: string): Promise<EnvironmentVariable[]>;
    setVariable(environmentId: string, name: string, value: string, serviceId?: string): Promise<EnvironmentVariable>;
    deleteVariable(environmentId: string, name: string, serviceId?: string): Promise<void>;
    bulkSetVariables(environmentId: string, variables: Record<string, string>, serviceId?: string): Promise<void>;

    // Domains
    listDomains(serviceId: string): Promise<Domain[]>;
    addDomain(serviceId: string, domain: string, targetPort?: number): Promise<Domain>;
    deleteDomain(id: string): Promise<void>;
    generateDomain(serviceId: string): Promise<Domain>;

    // Volumes
    listVolumes(serviceId: string): Promise<Volume[]>;
    createVolume(serviceId: string, name: string, mountPath: string, sizeGB?: number): Promise<Volume>;
    updateVolume(id: string, updates: Partial<Volume>): Promise<Volume>;
    deleteVolume(id: string): Promise<void>;

    // Plugins
    listPlugins(projectId: string): Promise<Plugin[]>;
    createPlugin(projectId: string, type: PluginType, name?: string): Promise<Plugin>;
    deletePlugin(id: string): Promise<void>;
    restartPlugin(id: string): Promise<void>;

    // Logs
    getLogs(deploymentId: string, options?: LogsOptions): Promise<DeploymentLog[]>;
    getBuildLogs(deploymentId: string): Promise<BuildLog[]>;
    streamLogs(deploymentId: string, onLog: (log: DeploymentLog) => void): () => void;

    // Metrics
    getMetrics(serviceId: string, options?: MetricsOptions): Promise<ServiceMetrics>;
    getUsage(projectId: string, environmentId?: string): Promise<Usage>;

    // Templates
    listTemplates(): Promise<Template[]>;
    deployTemplate(templateCode: string, projectName?: string): Promise<Project>;
}

export interface CreateProjectOptions {
    description?: string;
    teamId?: string;
    isPublic?: boolean;
    prDeploys?: boolean;
    prForks?: boolean;
    defaultEnvironmentName?: string;
    plugins?: PluginType[];
}

export interface CreateServiceOptions {
    projectId: string;
    environmentId: string;
    name: string;
    source?: ServiceSource;
    builder?: Service['builder'];
    startCommand?: string;
    buildCommand?: string;
    rootDirectory?: string;
    healthcheckPath?: string;
    region?: RailwayRegion;
    numReplicas?: number;
    variables?: Record<string, string>;
}

export interface LogsOptions {
    limit?: number;
    filter?: string;
    startDate?: Date;
    endDate?: Date;
}

export interface MetricsOptions {
    period?: '15m' | '1h' | '6h' | '24h' | '7d' | '30d';
    resolution?: 'minute' | 'hour' | 'day';
}

const RAILWAY_API_URL = 'https://backboard.railway.app/graphql/v2';

export function createRailwayClient(config: RailwayConfig): RailwayApiClient {
    const headers = () => ({
        'Authorization': `Bearer ${config.apiToken || process.env.RAILWAY_TOKEN}`,
        'Content-Type': 'application/json'
    });

    async function graphql<T>(query: string, variables?: object): Promise<T> {
        const response = await fetch(RAILWAY_API_URL, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({ query, variables })
        });

        const result = await response.json();

        if (result.errors) {
            throw new RailwayApiError(result.errors[0]?.message || 'GraphQL Error', result.errors);
        }

        return result.data;
    }

    return {
        // Projects
        async getProject(id: string) {
            return graphql<{ project: Project }>(`
                query GetProject($id: String!) {
                    project(id: $id) {
                        id name description createdAt updatedAt prDeploys prForks isPublic
                        team { id name avatar createdAt }
                        environments { id name isEphemeral createdAt }
                        services { id name }
                        plugins { id name status }
                    }
                }
            `, { id }).then(r => r.project);
        },

        async listProjects() {
            return graphql<{ projects: { edges: Array<{ node: Project }> } }>(`
                query ListProjects {
                    projects(first: 100) {
                        edges { node { id name description createdAt updatedAt } }
                    }
                }
            `).then(r => r.projects.edges.map(e => e.node));
        },

        async createProject(name: string, options: CreateProjectOptions = {}) {
            return graphql<{ projectCreate: Project }>(`
                mutation CreateProject($input: ProjectCreateInput!) {
                    projectCreate(input: $input) {
                        id name description createdAt updatedAt
                    }
                }
            `, {
                input: {
                    name,
                    description: options.description,
                    teamId: options.teamId || config.teamId,
                    isPublic: options.isPublic ?? false,
                    prDeploys: options.prDeploys ?? true,
                    defaultEnvironmentName: options.defaultEnvironmentName || 'production',
                    plugins: options.plugins
                }
            }).then(r => r.projectCreate);
        },

        async updateProject(id: string, updates: Partial<Project>) {
            return graphql<{ projectUpdate: Project }>(`
                mutation UpdateProject($id: String!, $input: ProjectUpdateInput!) {
                    projectUpdate(id: $id, input: $input) {
                        id name description prDeploys prForks isPublic
                    }
                }
            `, { id, input: updates }).then(r => r.projectUpdate);
        },

        async deleteProject(id: string) {
            await graphql(`
                mutation DeleteProject($id: String!) {
                    projectDelete(id: $id)
                }
            `, { id });
        },

        // Environments
        async getEnvironment(id: string) {
            return graphql<{ environment: Environment }>(`
                query GetEnvironment($id: String!) {
                    environment(id: $id) {
                        id name isEphemeral projectId createdAt updatedAt
                        meta { baseBranch branch prNumber prRepo prTitle }
                        sourceEnvironment { id name }
                    }
                }
            `, { id }).then(r => r.environment);
        },

        async createEnvironment(projectId: string, name: string, sourceEnvironmentId?: string) {
            return graphql<{ environmentCreate: Environment }>(`
                mutation CreateEnvironment($input: EnvironmentCreateInput!) {
                    environmentCreate(input: $input) {
                        id name isEphemeral projectId createdAt
                    }
                }
            `, {
                input: { projectId, name, sourceEnvironmentId, isEphemeral: false }
            }).then(r => r.environmentCreate);
        },

        async deleteEnvironment(id: string) {
            await graphql(`
                mutation DeleteEnvironment($id: String!) {
                    environmentDelete(id: $id)
                }
            `, { id });
        },

        // Services
        async getService(id: string) {
            return graphql<{ service: Service }>(`
                query GetService($id: String!) {
                    service(id: $id) {
                        id name projectId environmentId createdAt updatedAt
                        source { repo branch template image }
                        builder startCommand buildCommand rootDirectory
                        healthcheckPath healthcheckTimeout
                        restartPolicyType restartPolicyMaxRetries
                        numReplicas region cronSchedule sleepApplication icon
                        domains { id domain targetPort }
                        volumes { id name mountPath sizeGB state }
                    }
                }
            `, { id }).then(r => r.service);
        },

        async createService(options: CreateServiceOptions) {
            return graphql<{ serviceCreate: Service }>(`
                mutation CreateService($input: ServiceCreateInput!) {
                    serviceCreate(input: $input) {
                        id name projectId environmentId createdAt
                    }
                }
            `, {
                input: {
                    projectId: options.projectId,
                    environmentId: options.environmentId,
                    name: options.name,
                    source: options.source,
                    builder: options.builder || 'NIXPACKS',
                    startCommand: options.startCommand,
                    buildCommand: options.buildCommand,
                    rootDirectory: options.rootDirectory,
                    healthcheckPath: options.healthcheckPath,
                    region: options.region,
                    numReplicas: options.numReplicas || 1
                }
            }).then(r => r.serviceCreate);
        },

        async updateService(id: string, updates: Partial<Service>) {
            return graphql<{ serviceUpdate: Service }>(`
                mutation UpdateService($id: String!, $input: ServiceUpdateInput!) {
                    serviceUpdate(id: $id, input: $input) {
                        id name builder startCommand buildCommand rootDirectory
                        healthcheckPath numReplicas region cronSchedule sleepApplication
                    }
                }
            `, { id, input: updates }).then(r => r.serviceUpdate);
        },

        async deleteService(id: string) {
            await graphql(`
                mutation DeleteService($id: String!) {
                    serviceDelete(id: $id)
                }
            `, { id });
        },

        async restartService(id: string) {
            await graphql(`
                mutation RestartService($id: String!) {
                    serviceRestart(id: $id)
                }
            `, { id });
        },

        // Deployments
        async getDeployment(id: string) {
            return graphql<{ deployment: Deployment }>(`
                query GetDeployment($id: String!) {
                    deployment(id: $id) {
                        id serviceId environmentId projectId status createdAt updatedAt
                        staticUrl canRedeploy canRollback
                        meta { branch commitHash commitMessage commitAuthor repo image }
                        creator { id name email avatar }
                    }
                }
            `, { id }).then(r => r.deployment);
        },

        async listDeployments(serviceId: string, limit = 20) {
            return graphql<{ deployments: { edges: Array<{ node: Deployment }> } }>(`
                query ListDeployments($serviceId: String!, $first: Int!) {
                    deployments(first: $first, input: { serviceId: $serviceId }) {
                        edges {
                            node {
                                id serviceId status createdAt updatedAt
                                staticUrl canRedeploy canRollback
                                meta { branch commitHash commitMessage }
                            }
                        }
                    }
                }
            `, { serviceId, first: limit }).then(r => r.deployments.edges.map(e => e.node));
        },

        async triggerDeploy(serviceId: string) {
            return graphql<{ deploymentTrigger: Deployment }>(`
                mutation TriggerDeploy($input: DeploymentTriggerInput!) {
                    deploymentTrigger(input: $input) {
                        id serviceId status createdAt
                    }
                }
            `, { input: { serviceId } }).then(r => r.deploymentTrigger);
        },

        async cancelDeploy(deploymentId: string) {
            await graphql(`
                mutation CancelDeploy($id: String!) {
                    deploymentCancel(id: $id)
                }
            `, { id: deploymentId });
        },

        async rollback(deploymentId: string) {
            return graphql<{ deploymentRollback: Deployment }>(`
                mutation Rollback($id: String!) {
                    deploymentRollback(id: $id) {
                        id serviceId status createdAt
                    }
                }
            `, { id: deploymentId }).then(r => r.deploymentRollback);
        },

        async redeploy(deploymentId: string) {
            return graphql<{ deploymentRedeploy: Deployment }>(`
                mutation Redeploy($id: String!) {
                    deploymentRedeploy(id: $id) {
                        id serviceId status createdAt
                    }
                }
            `, { id: deploymentId }).then(r => r.deploymentRedeploy);
        },

        // Variables
        async listVariables(projectId: string, environmentId: string, serviceId?: string) {
            return graphql<{ variables: { edges: Array<{ node: EnvironmentVariable }> } }>(`
                query ListVariables($projectId: String!, $environmentId: String!, $serviceId: String) {
                    variables(
                        projectId: $projectId
                        environmentId: $environmentId
                        serviceId: $serviceId
                        first: 200
                    ) {
                        edges {
                            node { id name value environmentId serviceId createdAt }
                        }
                    }
                }
            `, { projectId, environmentId, serviceId }).then(r => r.variables.edges.map(e => e.node));
        },

        async setVariable(environmentId: string, name: string, value: string, serviceId?: string) {
            return graphql<{ variableUpsert: EnvironmentVariable }>(`
                mutation SetVariable($input: VariableUpsertInput!) {
                    variableUpsert(input: $input) {
                        id name value environmentId serviceId createdAt
                    }
                }
            `, {
                input: {
                    projectId: config.projectId,
                    environmentId,
                    serviceId,
                    name,
                    value
                }
            }).then(r => r.variableUpsert);
        },

        async deleteVariable(environmentId: string, name: string, serviceId?: string) {
            await graphql(`
                mutation DeleteVariable($input: VariableDeleteInput!) {
                    variableDelete(input: $input)
                }
            `, {
                input: {
                    projectId: config.projectId,
                    environmentId,
                    serviceId,
                    name
                }
            });
        },

        async bulkSetVariables(environmentId: string, variables: Record<string, string>, serviceId?: string) {
            const mutations = Object.entries(variables).map(([name, value], i) => `
                v${i}: variableUpsert(input: {
                    projectId: "${config.projectId}"
                    environmentId: "${environmentId}"
                    ${serviceId ? `serviceId: "${serviceId}"` : ''}
                    name: "${name}"
                    value: "${value}"
                }) { id }
            `);

            await graphql(`mutation BulkSetVariables { ${mutations.join('\n')} }`);
        },

        // Domains
        async listDomains(serviceId: string) {
            return graphql<{ domains: Domain[] }>(`
                query ListDomains($serviceId: String!) {
                    domains(serviceId: $serviceId) {
                        id domain serviceId environmentId targetPort createdAt
                        suffix
                        cnameCheck { id status statusMessage lastCheckedAt }
                    }
                }
            `, { serviceId }).then(r => r.domains);
        },

        async addDomain(serviceId: string, domain: string, targetPort?: number) {
            return graphql<{ customDomainCreate: Domain }>(`
                mutation AddDomain($input: CustomDomainCreateInput!) {
                    customDomainCreate(input: $input) {
                        id domain serviceId targetPort createdAt
                        cnameCheck { id status }
                    }
                }
            `, {
                input: { serviceId, domain, targetPort }
            }).then(r => r.customDomainCreate);
        },

        async deleteDomain(id: string) {
            await graphql(`
                mutation DeleteDomain($id: String!) {
                    domainDelete(id: $id)
                }
            `, { id });
        },

        async generateDomain(serviceId: string) {
            return graphql<{ serviceDomainCreate: Domain }>(`
                mutation GenerateDomain($input: ServiceDomainCreateInput!) {
                    serviceDomainCreate(input: $input) {
                        id domain serviceId createdAt suffix
                    }
                }
            `, { input: { serviceId } }).then(r => r.serviceDomainCreate);
        },

        // Volumes
        async listVolumes(serviceId: string) {
            return graphql<{ volumes: Volume[] }>(`
                query ListVolumes($serviceId: String!) {
                    volumes(serviceId: $serviceId) {
                        id name mountPath serviceId sizeGB state createdAt
                    }
                }
            `, { serviceId }).then(r => r.volumes);
        },

        async createVolume(serviceId: string, name: string, mountPath: string, sizeGB = 10) {
            return graphql<{ volumeCreate: Volume }>(`
                mutation CreateVolume($input: VolumeCreateInput!) {
                    volumeCreate(input: $input) {
                        id name mountPath serviceId sizeGB state createdAt
                    }
                }
            `, {
                input: {
                    projectId: config.projectId,
                    environmentId: config.environmentId,
                    serviceId,
                    name,
                    mountPath,
                    sizeGB
                }
            }).then(r => r.volumeCreate);
        },

        async updateVolume(id: string, updates: Partial<Volume>) {
            return graphql<{ volumeUpdate: Volume }>(`
                mutation UpdateVolume($id: String!, $input: VolumeUpdateInput!) {
                    volumeUpdate(id: $id, input: $input) {
                        id name mountPath sizeGB
                    }
                }
            `, { id, input: updates }).then(r => r.volumeUpdate);
        },

        async deleteVolume(id: string) {
            await graphql(`
                mutation DeleteVolume($id: String!) {
                    volumeDelete(id: $id)
                }
            `, { id });
        },

        // Plugins
        async listPlugins(projectId: string) {
            return graphql<{ plugins: Plugin[] }>(`
                query ListPlugins($projectId: String!) {
                    plugins(projectId: $projectId) {
                        id name friendlyName status createdAt
                    }
                }
            `, { projectId }).then(r => r.plugins);
        },

        async createPlugin(projectId: string, type: PluginType, name?: string) {
            return graphql<{ pluginCreate: Plugin }>(`
                mutation CreatePlugin($input: PluginCreateInput!) {
                    pluginCreate(input: $input) {
                        id name status createdAt
                    }
                }
            `, {
                input: { projectId, type, name: name || type }
            }).then(r => r.pluginCreate);
        },

        async deletePlugin(id: string) {
            await graphql(`
                mutation DeletePlugin($id: String!) {
                    pluginDelete(id: $id)
                }
            `, { id });
        },

        async restartPlugin(id: string) {
            await graphql(`
                mutation RestartPlugin($id: String!) {
                    pluginRestart(id: $id)
                }
            `, { id });
        },

        // Logs
        async getLogs(deploymentId: string, options: LogsOptions = {}) {
            return graphql<{ deploymentLogs: DeploymentLog[] }>(`
                query GetLogs($deploymentId: String!, $limit: Int, $filter: String) {
                    deploymentLogs(deploymentId: $deploymentId, limit: $limit, filter: $filter) {
                        timestamp severity message attributes
                    }
                }
            `, {
                deploymentId,
                limit: options.limit || 1000,
                filter: options.filter
            }).then(r => r.deploymentLogs);
        },

        async getBuildLogs(deploymentId: string) {
            return graphql<{ buildLogs: BuildLog[] }>(`
                query GetBuildLogs($deploymentId: String!) {
                    buildLogs(deploymentId: $deploymentId) {
                        timestamp message
                    }
                }
            `, { deploymentId }).then(r => r.buildLogs);
        },

        streamLogs(deploymentId: string, onLog: (log: DeploymentLog) => void) {
            // WebSocket subscription for real-time logs
            // This would use Railway's subscription API in production
            let running = true;
            let lastTimestamp = new Date().toISOString();

            const poll = async () => {
                while (running) {
                    try {
                        const logs = await this.getLogs(deploymentId, {
                            limit: 100,
                            startDate: new Date(lastTimestamp)
                        });

                        for (const log of logs) {
                            onLog(log);
                            lastTimestamp = log.timestamp;
                        }
                    } catch (e) {
                        // Ignore polling errors
                    }

                    await new Promise(r => setTimeout(r, 2000));
                }
            };

            poll();

            return () => { running = false; };
        },

        // Metrics
        async getMetrics(serviceId: string, options: MetricsOptions = {}) {
            return graphql<{ metrics: ServiceMetrics }>(`
                query GetMetrics($serviceId: String!, $period: String!) {
                    metrics(serviceId: $serviceId, period: $period) {
                        serviceId
                        cpu { timestamp value }
                        memory { timestamp value }
                        network { rx { timestamp value } tx { timestamp value } }
                        disk { read { timestamp value } write { timestamp value } }
                    }
                }
            `, {
                serviceId,
                period: options.period || '1h'
            }).then(r => r.metrics);
        },

        async getUsage(projectId: string, environmentId?: string) {
            return graphql<{ usage: Usage }>(`
                query GetUsage($projectId: String!, $environmentId: String) {
                    usage(projectId: $projectId, environmentId: $environmentId) {
                        projectId environmentId
                        currentUsage { measurement value unit cost }
                        estimatedMonthlyTotal
                    }
                }
            `, { projectId, environmentId }).then(r => r.usage);
        },

        // Templates
        async listTemplates() {
            return graphql<{ templates: { edges: Array<{ node: Template }> } }>(`
                query ListTemplates {
                    templates(first: 50) {
                        edges {
                            node {
                                id code name description image createdAt
                                services { name source { repo template image } }
                            }
                        }
                    }
                }
            `).then(r => r.templates.edges.map(e => e.node));
        },

        async deployTemplate(templateCode: string, projectName?: string) {
            return graphql<{ templateDeploy: Project }>(`
                mutation DeployTemplate($input: TemplateDeployInput!) {
                    templateDeploy(input: $input) {
                        id name description createdAt
                        environments { id name }
                        services { id name }
                    }
                }
            `, {
                input: {
                    templateCode,
                    projectName,
                    teamId: config.teamId
                }
            }).then(r => r.templateDeploy);
        }
    };
}

export class RailwayApiError extends Error {
    constructor(message: string, public errors?: any[]) {
        super(message);
        this.name = 'RailwayApiError';
    }
}

// ============================================================================
// Railway Adapter Factory
// ============================================================================

export function createRailwayAdapter(config: RailwayConfig) {
    const client = createRailwayClient(config);
    const {
        state,
        activeEnvironment,
        activeService,
        latestDeployment,
        isDeploying,
        healthyServices,
        servicesByEnvironment
    } = createRailwayState(config);

    let refreshInterval: ReturnType<typeof setInterval> | null = null;

    async function refreshState() {
        if (!config.projectId) return;

        try {
            batch(() => {
                state.value = { ...state.value, loading: true, error: null };
            });

            const project = await client.getProject(config.projectId);
            const environments = project.environments || [];

            const allServices: Service[] = [];
            const allDeployments: Deployment[] = [];
            const allVariables: EnvironmentVariable[] = [];

            for (const env of environments) {
                try {
                    const vars = await client.listVariables(config.projectId, env.id);
                    allVariables.push(...vars);
                } catch (e) {
                    // Continue on variable fetch errors
                }
            }

            for (const service of project.services || []) {
                try {
                    const fullService = await client.getService(service.id);
                    allServices.push(fullService);

                    const deployments = await client.listDeployments(service.id, 10);
                    allDeployments.push(...deployments);
                } catch (e) {
                    // Continue on service fetch errors
                }
            }

            batch(() => {
                state.value = {
                    ...state.value,
                    project,
                    environments,
                    services: allServices,
                    deployments: allDeployments,
                    variables: allVariables,
                    plugins: project.plugins || [],
                    loading: false,
                    connected: true
                };
            });
        } catch (error) {
            batch(() => {
                state.value = {
                    ...state.value,
                    loading: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    connected: false
                };
            });
        }
    }

    function startAutoRefresh(intervalMs = 30000) {
        stopAutoRefresh();
        refreshInterval = setInterval(refreshState, intervalMs);
        refreshState();
    }

    function stopAutoRefresh() {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
    }

    return {
        // State
        state,
        activeEnvironment,
        activeService,
        latestDeployment,
        isDeploying,
        healthyServices,
        servicesByEnvironment,

        // State management
        refreshState,
        startAutoRefresh,
        stopAutoRefresh,

        // Client
        client,

        // Convenience methods
        async deploy(serviceId?: string) {
            const targetServiceId = serviceId || config.serviceId;
            if (!targetServiceId) throw new Error('No service ID specified');

            const deployment = await client.triggerDeploy(targetServiceId);
            await refreshState();
            return deployment;
        },

        async setEnvVar(name: string, value: string, serviceId?: string) {
            if (!config.environmentId) throw new Error('No environment ID specified');

            await client.setVariable(config.environmentId, name, value, serviceId || config.serviceId);
            await refreshState();
        },

        async setEnvVars(variables: Record<string, string>, serviceId?: string) {
            if (!config.environmentId) throw new Error('No environment ID specified');

            await client.bulkSetVariables(config.environmentId, variables, serviceId || config.serviceId);
            await refreshState();
        },

        async scale(replicas: number, serviceId?: string) {
            const targetServiceId = serviceId || config.serviceId;
            if (!targetServiceId) throw new Error('No service ID specified');

            await client.updateService(targetServiceId, { numReplicas: replicas });
            await refreshState();
        },

        async addCustomDomain(domain: string, serviceId?: string) {
            const targetServiceId = serviceId || config.serviceId;
            if (!targetServiceId) throw new Error('No service ID specified');

            const result = await client.addDomain(targetServiceId, domain);
            await refreshState();
            return result;
        },

        async restart(serviceId?: string) {
            const targetServiceId = serviceId || config.serviceId;
            if (!targetServiceId) throw new Error('No service ID specified');

            await client.restartService(targetServiceId);
        },

        getProjectUrl() {
            return config.projectId
                ? `https://railway.app/project/${config.projectId}`
                : null;
        },

        envVars: {
            get: (key: string) => process.env[key],
            set: async (key: string, value: string) => {
                if (!config.environmentId) return;
                await client.setVariable(config.environmentId, key, value, config.serviceId);
            }
        }
    };
}

// ============================================================================
// Hooks for PhilJS Components
// ============================================================================

export function useRailwayProject(config: RailwayConfig) {
    const adapter = createRailwayAdapter(config);

    effect(() => {
        adapter.startAutoRefresh();
        return () => adapter.stopAutoRefresh();
    });

    return adapter;
}

export function useRailwayDeployments(projectId: string, serviceId: string) {
    const client = createRailwayClient({ projectId, serviceId });
    const deployments = signal<Deployment[]>([]);
    const loading = signal(false);
    const error = signal<string | null>(null);

    async function refresh() {
        loading.value = true;
        error.value = null;
        try {
            deployments.value = await client.listDeployments(serviceId);
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to load deployments';
        } finally {
            loading.value = false;
        }
    }

    effect(() => {
        refresh();
        const interval = setInterval(refresh, 30000);
        return () => clearInterval(interval);
    });

    return {
        deployments,
        loading,
        error,
        refresh,
        deploy: () => client.triggerDeploy(serviceId).then(refresh),
        rollback: (id: string) => client.rollback(id).then(refresh)
    };
}

export function useRailwayLogs(deploymentId: string) {
    const client = createRailwayClient({});
    const logs = signal<DeploymentLog[]>([]);
    const buildLogs = signal<BuildLog[]>([]);
    const loading = signal(false);

    async function fetchLogs() {
        loading.value = true;
        try {
            const [runtimeLogs, build] = await Promise.all([
                client.getLogs(deploymentId),
                client.getBuildLogs(deploymentId)
            ]);
            logs.value = runtimeLogs;
            buildLogs.value = build;
        } finally {
            loading.value = false;
        }
    }

    function startStreaming() {
        return client.streamLogs(deploymentId, (log) => {
            logs.value = [...logs.value, log];
        });
    }

    effect(() => {
        fetchLogs();
    });

    return {
        logs,
        buildLogs,
        loading,
        refresh: fetchLogs,
        startStreaming
    };
}

export function useRailwayMetrics(serviceId: string) {
    const client = createRailwayClient({});
    const metrics = signal<ServiceMetrics | null>(null);
    const loading = signal(false);
    const period = signal<MetricsOptions['period']>('1h');

    async function refresh() {
        loading.value = true;
        try {
            metrics.value = await client.getMetrics(serviceId, { period: period.value });
        } finally {
            loading.value = false;
        }
    }

    effect(() => {
        refresh();
        const interval = setInterval(refresh, 60000);
        return () => clearInterval(interval);
    });

    return {
        metrics,
        loading,
        period,
        refresh,
        setPeriod: (p: MetricsOptions['period']) => {
            period.value = p;
            refresh();
        }
    };
}

export function useRailwayVariables(projectId: string, environmentId: string, serviceId?: string) {
    const client = createRailwayClient({ projectId, environmentId, serviceId });
    const variables = signal<EnvironmentVariable[]>([]);
    const loading = signal(false);
    const error = signal<string | null>(null);

    async function refresh() {
        loading.value = true;
        error.value = null;
        try {
            variables.value = await client.listVariables(projectId, environmentId, serviceId);
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to load variables';
        } finally {
            loading.value = false;
        }
    }

    effect(() => {
        refresh();
    });

    return {
        variables,
        loading,
        error,
        refresh,
        set: async (name: string, value: string) => {
            await client.setVariable(environmentId, name, value, serviceId);
            await refresh();
        },
        delete: async (name: string) => {
            await client.deleteVariable(environmentId, name, serviceId);
            await refresh();
        },
        bulkSet: async (vars: Record<string, string>) => {
            await client.bulkSetVariables(environmentId, vars, serviceId);
            await refresh();
        }
    };
}

// ============================================================================
// Configuration Generators
// ============================================================================

export interface RailwayJsonConfig {
    schema?: string;
    build?: {
        builder?: Service['builder'];
        buildCommand?: string;
        watchPatterns?: string[];
        nixpacksConfigPath?: string;
        nixpacksPlanPath?: string;
        dockerfilePath?: string;
    };
    deploy?: {
        startCommand?: string;
        healthcheckPath?: string;
        healthcheckTimeout?: number;
        restartPolicyType?: Service['restartPolicyType'];
        restartPolicyMaxRetries?: number;
        numReplicas?: number;
        region?: RailwayRegion;
        sleepApplication?: boolean;
        cronSchedule?: string;
    };
}

export function railwayJson(config: RailwayJsonConfig = {}): string {
    const json: RailwayJsonConfig = {
        '$schema': 'https://railway.app/railway.schema.json',
        ...config
    };

    if (!json.build) {
        json.build = { builder: 'NIXPACKS' };
    }

    if (!json.deploy) {
        json.deploy = {
            startCommand: 'npm start',
            healthcheckPath: '/health',
            restartPolicyType: 'ON_FAILURE',
            numReplicas: 1
        };
    }

    return JSON.stringify(json, null, 2);
}

export interface NixpacksConfig {
    providers?: string[];
    buildImage?: string;
    phases?: Record<string, NixpacksPhase>;
    start?: {
        cmd?: string;
        runImage?: string;
        onlyIncludeFiles?: string[];
    };
    staticAssets?: {
        [path: string]: string;
    };
    variables?: Record<string, string>;
    aptPkgs?: string[];
    libs?: string[];
}

export interface NixpacksPhase {
    dependsOn?: string[];
    cmds?: string[];
    cacheDirectories?: string[];
    paths?: string[];
    aptPkgs?: string[];
    nix?: { pkgs?: string[] };
}

export function nixpacksToml(config: NixpacksConfig = {}): string {
    let toml = '';

    if (config.providers && config.providers.length > 0) {
        toml += `providers = [${config.providers.map(p => `"${p}"`).join(', ')}]\n\n`;
    }

    if (config.buildImage) {
        toml += `buildImage = "${config.buildImage}"\n\n`;
    }

    if (config.variables) {
        toml += `[variables]\n`;
        for (const [key, value] of Object.entries(config.variables)) {
            toml += `${key} = "${value}"\n`;
        }
        toml += '\n';
    }

    if (config.phases) {
        for (const [name, phase] of Object.entries(config.phases)) {
            toml += `[phases.${name}]\n`;
            if (phase.dependsOn) {
                toml += `dependsOn = [${phase.dependsOn.map(d => `"${d}"`).join(', ')}]\n`;
            }
            if (phase.cmds) {
                toml += `cmds = [\n${phase.cmds.map(c => `  "${c}"`).join(',\n')}\n]\n`;
            }
            if (phase.cacheDirectories) {
                toml += `cacheDirectories = [${phase.cacheDirectories.map(d => `"${d}"`).join(', ')}]\n`;
            }
            if (phase.aptPkgs) {
                toml += `aptPkgs = [${phase.aptPkgs.map(p => `"${p}"`).join(', ')}]\n`;
            }
            toml += '\n';
        }
    }

    if (config.start) {
        toml += `[start]\n`;
        if (config.start.cmd) {
            toml += `cmd = "${config.start.cmd}"\n`;
        }
        if (config.start.runImage) {
            toml += `runImage = "${config.start.runImage}"\n`;
        }
        if (config.start.onlyIncludeFiles) {
            toml += `onlyIncludeFiles = [${config.start.onlyIncludeFiles.map(f => `"${f}"`).join(', ')}]\n`;
        }
        toml += '\n';
    }

    return toml || '# Nixpacks configuration\n# See https://nixpacks.com/docs/configuration/file\n';
}

export function procfile(processes: Record<string, string>): string {
    return Object.entries(processes)
        .map(([name, command]) => `${name}: ${command}`)
        .join('\n');
}

// ============================================================================
// CLI Integration
// ============================================================================

export interface RailwayCliOptions {
    cwd?: string;
    env?: Record<string, string>;
}

export async function railwayCli(
    args: string[],
    options: RailwayCliOptions = {}
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const { spawn } = await import('child_process');

    return new Promise((resolve, reject) => {
        const proc = spawn('railway', args, {
            cwd: options.cwd,
            env: { ...process.env, ...options.env }
        });

        let stdout = '';
        let stderr = '';

        proc.stdout?.on('data', (data) => { stdout += data.toString(); });
        proc.stderr?.on('data', (data) => { stderr += data.toString(); });

        proc.on('close', (code) => {
            resolve({ stdout, stderr, exitCode: code || 0 });
        });

        proc.on('error', reject);
    });
}

export const railway = {
    init: () => railwayCli(['init']),
    link: (projectId?: string) =>
        railwayCli(projectId ? ['link', projectId] : ['link']),
    up: (options: { detach?: boolean; service?: string; environment?: string } = {}) =>
        railwayCli([
            'up',
            ...(options.detach ? ['-d'] : []),
            ...(options.service ? ['-s', options.service] : []),
            ...(options.environment ? ['-e', options.environment] : [])
        ]),
    down: (options: { service?: string; environment?: string } = {}) =>
        railwayCli([
            'down',
            ...(options.service ? ['-s', options.service] : []),
            ...(options.environment ? ['-e', options.environment] : [])
        ]),
    run: (command: string, options: { service?: string; environment?: string } = {}) =>
        railwayCli([
            'run',
            ...(options.service ? ['-s', options.service] : []),
            ...(options.environment ? ['-e', options.environment] : []),
            '--',
            ...command.split(' ')
        ]),
    logs: (options: { service?: string; environment?: string; tail?: boolean } = {}) =>
        railwayCli([
            'logs',
            ...(options.service ? ['-s', options.service] : []),
            ...(options.environment ? ['-e', options.environment] : []),
            ...(options.tail ? ['--tail'] : [])
        ]),
    status: () => railwayCli(['status']),
    environment: () => railwayCli(['environment']),
    domain: {
        add: (domain: string, service?: string) =>
            railwayCli(['domain', 'add', domain, ...(service ? ['-s', service] : [])]),
        list: () => railwayCli(['domain', 'list']),
        delete: (domain: string) => railwayCli(['domain', 'delete', domain])
    },
    variables: {
        list: (options: { service?: string; environment?: string } = {}) =>
            railwayCli([
                'variables',
                ...(options.service ? ['-s', options.service] : []),
                ...(options.environment ? ['-e', options.environment] : [])
            ]),
        set: (variables: Record<string, string>, options: { service?: string } = {}) =>
            railwayCli([
                'variables', 'set',
                ...(options.service ? ['-s', options.service] : []),
                ...Object.entries(variables).map(([k, v]) => `${k}=${v}`)
            ]),
        delete: (key: string, options: { service?: string } = {}) =>
            railwayCli([
                'variables', 'delete', key,
                ...(options.service ? ['-s', options.service] : [])
            ])
    },
    service: {
        list: () => railwayCli(['service', 'list']),
        create: (options: { name?: string; repo?: string; image?: string } = {}) =>
            railwayCli([
                'service', 'create',
                ...(options.name ? ['--name', options.name] : []),
                ...(options.repo ? ['--repo', options.repo] : []),
                ...(options.image ? ['--image', options.image] : [])
            ]),
        delete: (name: string) => railwayCli(['service', 'delete', name])
    },
    volume: {
        list: () => railwayCli(['volume', 'list']),
        create: (name: string, mountPath: string, size?: number) =>
            railwayCli([
                'volume', 'create',
                '--name', name,
                '--mount', mountPath,
                ...(size ? ['--size', String(size)] : [])
            ]),
        delete: (name: string) => railwayCli(['volume', 'delete', name])
    },
    login: () => railwayCli(['login']),
    logout: () => railwayCli(['logout']),
    whoami: () => railwayCli(['whoami']),
    open: () => railwayCli(['open'])
};

// ============================================================================
// Region Information
// ============================================================================

export interface RegionInfo {
    name: string;
    location: string;
    provider: string;
}

export const RAILWAY_REGIONS: Record<RailwayRegion, RegionInfo> = {
    'us-west1': { name: 'US West 1', location: 'Oregon, USA', provider: 'GCP' },
    'us-west2': { name: 'US West 2', location: 'Los Angeles, USA', provider: 'GCP' },
    'us-east4': { name: 'US East 4', location: 'Virginia, USA', provider: 'GCP' },
    'us-central1': { name: 'US Central 1', location: 'Iowa, USA', provider: 'GCP' },
    'europe-west1': { name: 'Europe West 1', location: 'Belgium', provider: 'GCP' },
    'europe-west4': { name: 'Europe West 4', location: 'Netherlands', provider: 'GCP' },
    'asia-southeast1': { name: 'Asia Southeast 1', location: 'Singapore', provider: 'GCP' },
    'asia-northeast1': { name: 'Asia Northeast 1', location: 'Tokyo, Japan', provider: 'GCP' }
};

export function getRegionInfo(region: RailwayRegion): RegionInfo {
    return RAILWAY_REGIONS[region];
}

export function getAllRegions(): Array<{ code: RailwayRegion } & RegionInfo> {
    return Object.entries(RAILWAY_REGIONS).map(([code, info]) => ({
        code: code as RailwayRegion,
        ...info
    }));
}

// ============================================================================
// Export Default
// ============================================================================

export { createRailwayAdapter as default };
