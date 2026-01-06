/**
 * PhilJS Fly.io Integration
 *
 * Comprehensive Fly.io deployment, edge computing, and machine management
 * with signal-reactive state and SSR edge functions support.
 */

import { signal, computed, effect, batch } from '@philjs/core';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface FlyConfig {
    app: string;
    org?: string;
    region?: FlyRegion;
    apiToken?: string;
    primaryRegion?: FlyRegion;
    replicas?: number;
    autoscaling?: AutoscalingConfig;
    volumes?: VolumeConfig[];
    services?: ServiceConfig[];
    env?: Record<string, string>;
    secrets?: string[];
    buildArgs?: Record<string, string>;
    dockerfile?: string;
    dockerIgnore?: string[];
}

export type FlyRegion =
    | 'ams' | 'arn' | 'atl' | 'bog' | 'bom' | 'bos' | 'cdg' | 'den'
    | 'dfw' | 'ewr' | 'eze' | 'fra' | 'gdl' | 'gig' | 'gru' | 'hkg'
    | 'iad' | 'jnb' | 'lax' | 'lhr' | 'mad' | 'mia' | 'nrt' | 'ord'
    | 'otp' | 'phx' | 'qro' | 'scl' | 'sea' | 'sin' | 'sjc' | 'syd'
    | 'waw' | 'yul' | 'yyz';

export interface AutoscalingConfig {
    minMachines: number;
    maxMachines: number;
    softLimit?: number;
    hardLimit?: number;
    scaleToZero?: boolean;
    concurrency?: {
        type: 'connections' | 'requests';
        softLimit: number;
        hardLimit: number;
    };
}

export interface VolumeConfig {
    name: string;
    size: number; // GB
    mountPath: string;
    encrypted?: boolean;
    snapshotRetention?: number;
}

export interface ServiceConfig {
    name: string;
    internalPort: number;
    protocol?: 'tcp' | 'udp';
    forceHttps?: boolean;
    autoStopMachines?: boolean;
    autoStartMachines?: boolean;
    minMachinesRunning?: number;
    httpChecks?: HttpCheck[];
    tcpChecks?: TcpCheck[];
    concurrency?: ConcurrencyConfig;
}

export interface HttpCheck {
    path: string;
    interval?: string;
    timeout?: string;
    gracePeriod?: string;
    method?: 'GET' | 'HEAD' | 'POST';
    headers?: Record<string, string>;
}

export interface TcpCheck {
    interval?: string;
    timeout?: string;
    gracePeriod?: string;
}

export interface ConcurrencyConfig {
    type: 'connections' | 'requests';
    softLimit: number;
    hardLimit: number;
}

export interface Machine {
    id: string;
    name: string;
    state: MachineState;
    region: FlyRegion;
    instanceId: string;
    privateIp: string;
    createdAt: string;
    updatedAt: string;
    config: MachineConfig;
    imageRef: ImageRef;
    events: MachineEvent[];
    checks?: MachineCheck[];
}

export type MachineState =
    | 'created' | 'starting' | 'started' | 'stopping'
    | 'stopped' | 'replacing' | 'destroying' | 'destroyed';

export interface MachineConfig {
    env: Record<string, string>;
    init?: MachineInit;
    image: string;
    metadata?: Record<string, string>;
    restart?: RestartPolicy;
    services?: MachineService[];
    guest?: GuestConfig;
    mounts?: MachineMount[];
    processes?: ProcessConfig[];
    schedule?: string;
    standbys?: string[];
    statics?: StaticConfig[];
    autoDestroy?: boolean;
    dns?: DnsConfig;
}

export interface MachineInit {
    cmd?: string[];
    entrypoint?: string[];
    exec?: string[];
    tty?: boolean;
}

export interface RestartPolicy {
    policy: 'no' | 'always' | 'on-failure';
    maxRetries?: number;
}

export interface MachineService {
    protocol: 'tcp' | 'udp';
    internalPort: number;
    ports: ServicePort[];
    concurrency?: ConcurrencyConfig;
    checks?: ServiceCheck[];
    forceInstanceKey?: string;
}

export interface ServicePort {
    port: number;
    handlers?: string[];
    forceHttps?: boolean;
    tlsOptions?: TlsOptions;
}

export interface TlsOptions {
    alpn?: string[];
    versions?: string[];
    defaultSelfSigned?: boolean;
}

export interface ServiceCheck {
    type: 'http' | 'tcp';
    port?: number;
    path?: string;
    interval?: string;
    timeout?: string;
    gracePeriod?: string;
    method?: string;
    headers?: Array<{ name: string; values: string[] }>;
    protocol?: string;
    tlsSkipVerify?: boolean;
    tlsServerName?: string;
}

export interface GuestConfig {
    cpuKind: 'shared' | 'performance';
    cpus: number;
    memoryMb: number;
    gpuKind?: 'a10' | 'l40s' | 'a100-pcie-40gb' | 'a100-sxm4-80gb';
    gpus?: number;
    kernelArgs?: string[];
}

export interface MachineMount {
    volume: string;
    path: string;
    sizeGb?: number;
    sizeGbLimit?: number;
    encrypted?: boolean;
    name?: string;
}

export interface ProcessConfig {
    name: string;
    entrypoint?: string[];
    cmd?: string[];
    env?: Record<string, string>;
    ignoreAppSecrets?: boolean;
}

export interface StaticConfig {
    guestPath: string;
    urlPrefix: string;
}

export interface DnsConfig {
    skipRegistration?: boolean;
    nameservers?: string[];
    searches?: string[];
    options?: DnsOption[];
}

export interface DnsOption {
    name: string;
    value?: string;
}

export interface ImageRef {
    registry: string;
    repository: string;
    tag: string;
    digest: string;
    labels?: Record<string, string>;
}

export interface MachineEvent {
    id: string;
    type: string;
    status: string;
    source: string;
    timestamp: number;
    request?: object;
}

export interface MachineCheck {
    name: string;
    status: 'passing' | 'warning' | 'critical';
    output?: string;
    updatedAt: string;
}

export interface Volume {
    id: string;
    name: string;
    state: 'created' | 'pending_destroy' | 'hydrating' | 'destroyed';
    sizeGb: number;
    region: FlyRegion;
    zone: string;
    encrypted: boolean;
    attachedMachineId?: string;
    attachedAllocId?: string;
    createdAt: string;
    snapshotRetention: number;
    blocks?: number;
    blockSize?: number;
    blocksAvail?: number;
    blocksFree?: number;
    fsType?: string;
}

export interface VolumeSnapshot {
    id: string;
    volumeId: string;
    status: string;
    size: number;
    digest: string;
    createdAt: string;
    retentionDays: number;
}

export interface App {
    id: string;
    name: string;
    organization: Organization;
    status: 'pending' | 'deployed' | 'suspended';
    hostname: string;
    deployed: boolean;
    currentRelease?: Release;
    machines: Machine[];
    volumes: Volume[];
    secrets: Secret[];
    allocations: Allocation[];
}

export interface Organization {
    id: string;
    name: string;
    slug: string;
    type: 'PERSONAL' | 'SHARED';
    paidPlan: boolean;
}

export interface Release {
    id: string;
    version: number;
    status: string;
    description: string;
    reason: string;
    stable: boolean;
    user: { name: string; email: string };
    createdAt: string;
    imageRef?: string;
}

export interface Secret {
    name: string;
    digest: string;
    createdAt: string;
}

export interface Allocation {
    id: string;
    idShort: string;
    version: number;
    region: FlyRegion;
    status: string;
    desiredStatus: string;
    healthy: boolean;
    canary: boolean;
    failed: boolean;
    restarts: number;
    createdAt: string;
    updatedAt: string;
    privateIp?: string;
    taskName?: string;
    events?: AllocationEvent[];
    latestVersion: boolean;
    passingCheckCount: number;
    warningCheckCount: number;
    criticalCheckCount: number;
    checks?: AllocationCheck[];
}

export interface AllocationEvent {
    timestamp: string;
    type: string;
    message: string;
}

export interface AllocationCheck {
    name: string;
    status: string;
    output?: string;
}

export interface Certificate {
    id: string;
    hostname: string;
    clientStatus: string;
    issued: CertificateIssued;
    check: boolean;
    dnsProvider?: string;
    dnsValidationHostname?: string;
    dnsValidationInstructions?: string;
    dnsValidationTarget?: string;
    source?: string;
    createdAt: string;
}

export interface CertificateIssued {
    nodes: Array<{
        type: string;
        expiresAt: string;
    }>;
}

export interface WireGuardPeer {
    id: string;
    name: string;
    network: string;
    region: FlyRegion;
    peerip: string;
    pubkey: string;
    createdAt: string;
}

export interface DatabaseConfig {
    type: 'postgres' | 'redis' | 'mysql' | 'sqlite';
    version?: string;
    size?: 'shared-cpu-1x' | 'shared-cpu-2x' | 'shared-cpu-4x' | 'performance-1x' | 'performance-2x' | 'performance-4x';
    volumeSize?: number;
    region?: FlyRegion;
    replicas?: FlyRegion[];
    highAvailability?: boolean;
    extensions?: string[];
    name?: string;
}

export interface PostgresCluster {
    id: string;
    name: string;
    organization: Organization;
    status: string;
    region: FlyRegion;
    readRegions: FlyRegion[];
    ipAddress: string;
    primaryMachine: Machine;
    replicaMachines: Machine[];
    users: PostgresUser[];
    databases: PostgresDatabase[];
}

export interface PostgresUser {
    username: string;
    superuser: boolean;
}

export interface PostgresDatabase {
    name: string;
    users: string[];
}

export interface RedisConfig {
    name: string;
    region: FlyRegion;
    planId?: string;
    eviction?: boolean;
    primaryRegion?: FlyRegion;
    readRegions?: FlyRegion[];
    enableNonTls?: boolean;
}

export interface UpstashRedis {
    id: string;
    name: string;
    publicUrl: string;
    privateUrl: string;
    primaryRegion: FlyRegion;
    readRegions: FlyRegion[];
    eviction: boolean;
    maxRequests: number;
    maxRequestSize: number;
    maxRecordSize: number;
    maxDailyBandwidth: number;
    maxDailyCommands: number;
    maxConcurrentConnections: number;
    password: string;
}

// ============================================================================
// State Management with Signals
// ============================================================================

export interface FlyState {
    config: FlyConfig;
    app: App | null;
    machines: Machine[];
    volumes: Volume[];
    secrets: Secret[];
    certificates: Certificate[];
    deployments: DeploymentState[];
    loading: boolean;
    error: string | null;
    connected: boolean;
}

export interface DeploymentState {
    id: string;
    status: 'pending' | 'building' | 'pushing' | 'deploying' | 'success' | 'failed';
    startedAt: string;
    completedAt?: string;
    logs: string[];
    release?: Release;
    error?: string;
}

export function createFlyState(config: FlyConfig) {
    const state = signal<FlyState>({
        config,
        app: null,
        machines: [],
        volumes: [],
        secrets: [],
        certificates: [],
        deployments: [],
        loading: false,
        error: null,
        connected: false
    });

    const isDeploying = computed(() =>
        state.value.deployments.some(d =>
            ['pending', 'building', 'pushing', 'deploying'].includes(d.status)
        )
    );

    const activeMachines = computed(() =>
        state.value.machines.filter(m =>
            ['started', 'starting'].includes(m.state)
        )
    );

    const healthyMachines = computed(() =>
        state.value.machines.filter(m =>
            m.state === 'started' &&
            (!m.checks || m.checks.every(c => c.status === 'passing'))
        )
    );

    const regions = computed(() =>
        [...new Set(state.value.machines.map(m => m.region))]
    );

    const appUrl = computed(() =>
        state.value.app ? `https://${state.value.app.hostname}` : null
    );

    const primaryUrl = computed(() =>
        state.value.config.app ? `https://${state.value.config.app}.fly.dev` : null
    );

    return {
        state,
        isDeploying,
        activeMachines,
        healthyMachines,
        regions,
        appUrl,
        primaryUrl
    };
}

// ============================================================================
// Fly.io API Client
// ============================================================================

export interface FlyApiClient {
    // Apps
    getApp(): Promise<App>;
    createApp(name: string, org?: string): Promise<App>;
    deleteApp(): Promise<void>;
    suspendApp(): Promise<void>;
    resumeApp(): Promise<void>;

    // Machines
    listMachines(): Promise<Machine[]>;
    getMachine(machineId: string): Promise<Machine>;
    createMachine(config: Partial<MachineConfig>, region?: FlyRegion): Promise<Machine>;
    updateMachine(machineId: string, config: Partial<MachineConfig>): Promise<Machine>;
    startMachine(machineId: string): Promise<void>;
    stopMachine(machineId: string): Promise<void>;
    restartMachine(machineId: string): Promise<void>;
    destroyMachine(machineId: string, force?: boolean): Promise<void>;
    waitMachine(machineId: string, state: MachineState, timeout?: number): Promise<Machine>;
    execMachine(machineId: string, cmd: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }>;

    // Volumes
    listVolumes(): Promise<Volume[]>;
    getVolume(volumeId: string): Promise<Volume>;
    createVolume(config: VolumeConfig, region?: FlyRegion): Promise<Volume>;
    deleteVolume(volumeId: string): Promise<void>;
    extendVolume(volumeId: string, sizeGb: number): Promise<Volume>;
    listSnapshots(volumeId: string): Promise<VolumeSnapshot[]>;
    createSnapshot(volumeId: string): Promise<VolumeSnapshot>;

    // Secrets
    listSecrets(): Promise<Secret[]>;
    setSecrets(secrets: Record<string, string>): Promise<Release>;
    unsetSecrets(keys: string[]): Promise<Release>;

    // Certificates
    listCertificates(): Promise<Certificate[]>;
    getCertificate(hostname: string): Promise<Certificate>;
    addCertificate(hostname: string): Promise<Certificate>;
    deleteCertificate(hostname: string): Promise<void>;
    checkCertificate(hostname: string): Promise<Certificate>;

    // Deployments
    deploy(options?: DeployOptions): Promise<Release>;
    getReleases(): Promise<Release[]>;
    rollback(version: number): Promise<Release>;

    // Regions
    listRegions(): Promise<FlyRegion[]>;
    addRegion(region: FlyRegion): Promise<void>;
    removeRegion(region: FlyRegion): Promise<void>;

    // WireGuard
    listWireGuardPeers(): Promise<WireGuardPeer[]>;
    createWireGuardPeer(name: string, region: FlyRegion): Promise<WireGuardPeer & { privateKey: string }>;
    deleteWireGuardPeer(peerId: string): Promise<void>;

    // Databases
    createPostgres(config: DatabaseConfig): Promise<PostgresCluster>;
    listPostgresClusters(): Promise<PostgresCluster[]>;
    createUpstashRedis(config: RedisConfig): Promise<UpstashRedis>;
}

export interface DeployOptions {
    image?: string;
    dockerfile?: string;
    buildArgs?: Record<string, string>;
    regions?: FlyRegion[];
    strategy?: 'rolling' | 'bluegreen' | 'canary' | 'immediate';
    maxUnavailable?: number;
    waitTimeout?: number;
    releaseCommand?: string;
    releaseCommandTimeout?: number;
    buildOnly?: boolean;
    push?: boolean;
    remote?: boolean;
}

export function createFlyClient(config: FlyConfig): FlyApiClient {
    const baseUrl = 'https://api.fly.io';
    const machinesUrl = `https://api.machines.dev/v1/apps/${config.app}`;

    const headers = () => ({
        'Authorization': `Bearer ${config.apiToken || process.env.FLY_API_TOKEN}`,
        'Content-Type': 'application/json'
    });

    async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(url, {
            ...options,
            headers: { ...headers(), ...options.headers as Record<string, string> }
        });

        if (!response.ok) {
            const error = await response.text();
            throw new FlyApiError(response.status, error);
        }

        return response.json();
    }

    async function graphql<T>(query: string, variables?: object): Promise<T> {
        const response = await fetch(`${baseUrl}/graphql`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({ query, variables })
        });

        const result = await response.json();
        if (result.errors) {
            throw new FlyApiError(400, JSON.stringify(result.errors));
        }

        return result.data;
    }

    return {
        // Apps
        async getApp() {
            return graphql<{ app: App }>(`
                query GetApp($name: String!) {
                    app(name: $name) {
                        id name status hostname deployed
                        organization { id name slug type paidPlan }
                        currentRelease { id version status description stable createdAt }
                    }
                }
            `, { name: config.app }).then(r => r.app);
        },

        async createApp(name: string, org?: string) {
            return graphql<{ createApp: { app: App } }>(`
                mutation CreateApp($input: CreateAppInput!) {
                    createApp(input: $input) {
                        app { id name status hostname organization { id name slug } }
                    }
                }
            `, { input: { name, organizationId: org || config.org } }).then(r => r.createApp.app);
        },

        async deleteApp() {
            await graphql(`
                mutation DeleteApp($appId: ID!) {
                    deleteApp(appId: $appId) { organization { id } }
                }
            `, { appId: config.app });
        },

        async suspendApp() {
            await graphql(`
                mutation PauseApp($input: PauseAppInput!) {
                    pauseApp(input: $input) { app { id status } }
                }
            `, { input: { appId: config.app } });
        },

        async resumeApp() {
            await graphql(`
                mutation ResumeApp($input: ResumeAppInput!) {
                    resumeApp(input: $input) { app { id status } }
                }
            `, { input: { appId: config.app } });
        },

        // Machines
        async listMachines() {
            return request<Machine[]>(`${machinesUrl}/machines`);
        },

        async getMachine(machineId: string) {
            return request<Machine>(`${machinesUrl}/machines/${machineId}`);
        },

        async createMachine(machineConfig: Partial<MachineConfig>, region?: FlyRegion) {
            return request<Machine>(`${machinesUrl}/machines`, {
                method: 'POST',
                body: JSON.stringify({
                    region: region || config.region || config.primaryRegion,
                    config: machineConfig
                })
            });
        },

        async updateMachine(machineId: string, machineConfig: Partial<MachineConfig>) {
            return request<Machine>(`${machinesUrl}/machines/${machineId}`, {
                method: 'POST',
                body: JSON.stringify({ config: machineConfig })
            });
        },

        async startMachine(machineId: string) {
            await request(`${machinesUrl}/machines/${machineId}/start`, { method: 'POST' });
        },

        async stopMachine(machineId: string) {
            await request(`${machinesUrl}/machines/${machineId}/stop`, { method: 'POST' });
        },

        async restartMachine(machineId: string) {
            await request(`${machinesUrl}/machines/${machineId}/restart`, { method: 'POST' });
        },

        async destroyMachine(machineId: string, force = false) {
            await request(`${machinesUrl}/machines/${machineId}?force=${force}`, { method: 'DELETE' });
        },

        async waitMachine(machineId: string, state: MachineState, timeout = 60) {
            return request<Machine>(`${machinesUrl}/machines/${machineId}/wait?state=${state}&timeout=${timeout}`);
        },

        async execMachine(machineId: string, cmd: string[]) {
            return request<{ stdout: string; stderr: string; exitCode: number }>(
                `${machinesUrl}/machines/${machineId}/exec`,
                { method: 'POST', body: JSON.stringify({ cmd }) }
            );
        },

        // Volumes
        async listVolumes() {
            return request<Volume[]>(`${machinesUrl}/volumes`);
        },

        async getVolume(volumeId: string) {
            return request<Volume>(`${machinesUrl}/volumes/${volumeId}`);
        },

        async createVolume(volumeConfig: VolumeConfig, region?: FlyRegion) {
            return request<Volume>(`${machinesUrl}/volumes`, {
                method: 'POST',
                body: JSON.stringify({
                    name: volumeConfig.name,
                    size_gb: volumeConfig.size,
                    region: region || config.region || config.primaryRegion,
                    encrypted: volumeConfig.encrypted ?? true,
                    snapshot_retention: volumeConfig.snapshotRetention
                })
            });
        },

        async deleteVolume(volumeId: string) {
            await request(`${machinesUrl}/volumes/${volumeId}`, { method: 'DELETE' });
        },

        async extendVolume(volumeId: string, sizeGb: number) {
            return request<Volume>(`${machinesUrl}/volumes/${volumeId}/extend`, {
                method: 'PUT',
                body: JSON.stringify({ size_gb: sizeGb })
            });
        },

        async listSnapshots(volumeId: string) {
            return request<VolumeSnapshot[]>(`${machinesUrl}/volumes/${volumeId}/snapshots`);
        },

        async createSnapshot(volumeId: string) {
            return request<VolumeSnapshot>(`${machinesUrl}/volumes/${volumeId}/snapshots`, {
                method: 'POST'
            });
        },

        // Secrets
        async listSecrets() {
            return graphql<{ app: { secrets: Secret[] } }>(`
                query GetSecrets($name: String!) {
                    app(name: $name) {
                        secrets { name digest createdAt }
                    }
                }
            `, { name: config.app }).then(r => r.app.secrets);
        },

        async setSecrets(secrets: Record<string, string>) {
            const input = Object.entries(secrets).map(([key, value]) => ({
                key,
                value
            }));

            return graphql<{ setSecrets: { release: Release } }>(`
                mutation SetSecrets($input: SetSecretsInput!) {
                    setSecrets(input: $input) {
                        release { id version status }
                    }
                }
            `, { input: { appId: config.app, secrets: input } }).then(r => r.setSecrets.release);
        },

        async unsetSecrets(keys: string[]) {
            return graphql<{ unsetSecrets: { release: Release } }>(`
                mutation UnsetSecrets($input: UnsetSecretsInput!) {
                    unsetSecrets(input: $input) {
                        release { id version status }
                    }
                }
            `, { input: { appId: config.app, keys } }).then(r => r.unsetSecrets.release);
        },

        // Certificates
        async listCertificates() {
            return graphql<{ app: { certificates: { nodes: Certificate[] } } }>(`
                query GetCertificates($name: String!) {
                    app(name: $name) {
                        certificates {
                            nodes {
                                id hostname clientStatus check createdAt
                                issued { nodes { type expiresAt } }
                                dnsProvider dnsValidationHostname dnsValidationTarget
                            }
                        }
                    }
                }
            `, { name: config.app }).then(r => r.app.certificates.nodes);
        },

        async getCertificate(hostname: string) {
            return graphql<{ app: { certificate: Certificate } }>(`
                query GetCertificate($name: String!, $hostname: String!) {
                    app(name: $name) {
                        certificate(hostname: $hostname) {
                            id hostname clientStatus check createdAt
                            issued { nodes { type expiresAt } }
                        }
                    }
                }
            `, { name: config.app, hostname }).then(r => r.app.certificate);
        },

        async addCertificate(hostname: string) {
            return graphql<{ addCertificate: { certificate: Certificate } }>(`
                mutation AddCertificate($appId: ID!, $hostname: String!) {
                    addCertificate(appId: $appId, hostname: $hostname) {
                        certificate { id hostname clientStatus check }
                    }
                }
            `, { appId: config.app, hostname }).then(r => r.addCertificate.certificate);
        },

        async deleteCertificate(hostname: string) {
            await graphql(`
                mutation DeleteCertificate($appId: ID!, $hostname: String!) {
                    deleteCertificate(appId: $appId, hostname: $hostname) {
                        app { id }
                    }
                }
            `, { appId: config.app, hostname });
        },

        async checkCertificate(hostname: string) {
            return graphql<{ app: { certificate: Certificate } }>(`
                mutation CheckCertificate($input: CheckCertificateInput!) {
                    checkCertificate(input: $input) {
                        certificate { id hostname clientStatus check }
                    }
                }
            `, { input: { appId: config.app, hostname } }).then(r => r.app.certificate);
        },

        // Deployments
        async deploy(options: DeployOptions = {}) {
            return graphql<{ deploy: { release: Release } }>(`
                mutation Deploy($input: DeployImageInput!) {
                    deployImage(input: $input) {
                        release { id version status description stable createdAt }
                    }
                }
            `, {
                input: {
                    appId: config.app,
                    image: options.image,
                    strategy: options.strategy?.toUpperCase(),
                    definition: {}
                }
            }).then(r => r.deploy.release);
        },

        async getReleases() {
            return graphql<{ app: { releases: { nodes: Release[] } } }>(`
                query GetReleases($name: String!) {
                    app(name: $name) {
                        releases(first: 25) {
                            nodes { id version status description stable createdAt imageRef }
                        }
                    }
                }
            `, { name: config.app }).then(r => r.app.releases.nodes);
        },

        async rollback(version: number) {
            const releases = await this.getReleases();
            const target = releases.find(r => r.version === version);
            if (!target?.imageRef) throw new Error(`Release version ${version} not found or has no image`);
            return this.deploy({ image: target.imageRef });
        },

        // Regions
        async listRegions() {
            return graphql<{ app: { regions: Array<{ code: FlyRegion }> } }>(`
                query GetRegions($name: String!) {
                    app(name: $name) { regions { code } }
                }
            `, { name: config.app }).then(r => r.app.regions.map(region => region.code));
        },

        async addRegion(region: FlyRegion) {
            await graphql(`
                mutation AddRegion($input: EnableRegionInput!) {
                    enableRegion(input: $input) { region { code } }
                }
            `, { input: { appId: config.app, region } });
        },

        async removeRegion(region: FlyRegion) {
            await graphql(`
                mutation RemoveRegion($input: DisableRegionInput!) {
                    disableRegion(input: $input) { region { code } }
                }
            `, { input: { appId: config.app, region } });
        },

        // WireGuard
        async listWireGuardPeers() {
            return graphql<{ organization: { wireGuardPeers: { nodes: WireGuardPeer[] } } }>(`
                query GetPeers($slug: String!) {
                    organization(slug: $slug) {
                        wireGuardPeers { nodes { id name network region peerip pubkey createdAt } }
                    }
                }
            `, { slug: config.org || 'personal' }).then(r => r.organization.wireGuardPeers.nodes);
        },

        async createWireGuardPeer(name: string, region: FlyRegion) {
            return graphql<{ addWireGuardPeer: WireGuardPeer & { privateKey: string } }>(`
                mutation CreatePeer($input: AddWireGuardPeerInput!) {
                    addWireGuardPeer(input: $input) {
                        peerip pubkey privateKey network region
                    }
                }
            `, { input: { organizationId: config.org, name, region } }).then(r => r.addWireGuardPeer);
        },

        async deleteWireGuardPeer(peerId: string) {
            await graphql(`
                mutation DeletePeer($input: RemoveWireGuardPeerInput!) {
                    removeWireGuardPeer(input: $input) { organization { id } }
                }
            `, { input: { organizationId: config.org, name: peerId } });
        },

        // Databases
        async createPostgres(dbConfig: DatabaseConfig) {
            return graphql<{ createPostgresCluster: { cluster: PostgresCluster } }>(`
                mutation CreatePostgres($input: CreatePostgresClusterInput!) {
                    createPostgresCluster(input: $input) {
                        cluster {
                            id name status region ipAddress
                            organization { id name }
                        }
                    }
                }
            `, {
                input: {
                    organizationId: config.org,
                    name: dbConfig.name || `${config.app}-db`,
                    region: dbConfig.region || config.primaryRegion,
                    vmSize: dbConfig.size || 'shared-cpu-1x',
                    volumeSizeGb: dbConfig.volumeSize || 10,
                    storageSizeGb: dbConfig.volumeSize || 10,
                    imageRef: `flyio/postgres:${dbConfig.version || '15'}`,
                    password: null,
                    count: dbConfig.highAvailability ? 2 : 1
                }
            }).then(r => r.createPostgresCluster.cluster);
        },

        async listPostgresClusters() {
            return graphql<{ apps: { nodes: App[] } }>(`
                query GetPostgresClusters($org: String!) {
                    apps(type: "postgres", organizationSlug: $org) {
                        nodes { id name status hostname }
                    }
                }
            `, { org: config.org || 'personal' }).then(r => r.apps.nodes as unknown as PostgresCluster[]);
        },

        async createUpstashRedis(redisConfig: RedisConfig) {
            return graphql<{ createAddOn: { addOn: UpstashRedis } }>(`
                mutation CreateRedis($input: CreateAddOnInput!) {
                    createAddOn(input: $input) {
                        addOn {
                            id name publicUrl privateUrl primaryRegion password
                            options
                        }
                    }
                }
            `, {
                input: {
                    organizationId: config.org,
                    name: redisConfig.name,
                    type: 'upstash_redis',
                    primaryRegion: redisConfig.primaryRegion || config.primaryRegion,
                    readRegions: redisConfig.readRegions,
                    options: { eviction: redisConfig.eviction }
                }
            }).then(r => r.createAddOn.addOn);
        }
    };
}

export class FlyApiError extends Error {
    constructor(public status: number, message: string) {
        super(`Fly API error (${status}): ${message}`);
        this.name = 'FlyApiError';
    }
}

// ============================================================================
// Fly.io Adapter Factory
// ============================================================================

export function createFlyAdapter(config: FlyConfig) {
    const client = createFlyClient(config);
    const { state, isDeploying, activeMachines, healthyMachines, regions, appUrl, primaryUrl } = createFlyState(config);

    // Auto-refresh state
    let refreshInterval: ReturnType<typeof setInterval> | null = null;

    async function refreshState() {
        try {
            batch(() => {
                state.value = { ...state.value, loading: true, error: null };
            });

            const [app, machines, volumes, secrets, certificates] = await Promise.all([
                client.getApp().catch(() => null),
                client.listMachines().catch(() => []),
                client.listVolumes().catch(() => []),
                client.listSecrets().catch(() => []),
                client.listCertificates().catch(() => [])
            ]);

            batch(() => {
                state.value = {
                    ...state.value,
                    app,
                    machines,
                    volumes,
                    secrets,
                    certificates,
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
        isDeploying,
        activeMachines,
        healthyMachines,
        regions,
        appUrl,
        primaryUrl,

        // State management
        refreshState,
        startAutoRefresh,
        stopAutoRefresh,

        // Client passthrough
        client,

        // Convenience methods
        async deploy(options?: DeployOptions) {
            const deploymentId = crypto.randomUUID();
            const deployment: DeploymentState = {
                id: deploymentId,
                status: 'pending',
                startedAt: new Date().toISOString(),
                logs: []
            };

            batch(() => {
                state.value = {
                    ...state.value,
                    deployments: [...state.value.deployments, deployment]
                };
            });

            try {
                deployment.status = 'deploying';
                deployment.logs.push('Starting deployment...');

                const release = await client.deploy(options);

                deployment.status = 'success';
                deployment.completedAt = new Date().toISOString();
                deployment.release = release;
                deployment.logs.push(`Deployed release v${release.version}`);

                await refreshState();
                return release;
            } catch (error) {
                deployment.status = 'failed';
                deployment.completedAt = new Date().toISOString();
                deployment.error = error instanceof Error ? error.message : 'Deployment failed';
                deployment.logs.push(`Error: ${deployment.error}`);
                throw error;
            } finally {
                batch(() => {
                    state.value = {
                        ...state.value,
                        deployments: state.value.deployments.map(d =>
                            d.id === deploymentId ? deployment : d
                        )
                    };
                });
            }
        },

        async scale(count: number, region?: FlyRegion) {
            const targetRegion = region || config.primaryRegion || config.region;
            const currentMachines = state.value.machines.filter(m =>
                !region || m.region === region
            );

            const diff = count - currentMachines.length;

            if (diff > 0) {
                // Scale up
                const promises = Array.from({ length: diff }, () =>
                    client.createMachine(
                        { image: state.value.app?.currentRelease?.imageRef || '' },
                        targetRegion
                    )
                );
                await Promise.all(promises);
            } else if (diff < 0) {
                // Scale down
                const toDestroy = currentMachines.slice(0, Math.abs(diff));
                await Promise.all(toDestroy.map(m => client.destroyMachine(m.id)));
            }

            await refreshState();
        },

        async scaleToRegions(regions: FlyRegion[], machinesPerRegion = 1) {
            await Promise.all(regions.map(region => this.scale(machinesPerRegion, region)));
        },

        getRegionInfo(region: FlyRegion): RegionInfo {
            return REGION_INFO[region];
        },

        getAllRegions() {
            return Object.entries(REGION_INFO).map(([code, info]) => ({
                code: code as FlyRegion,
                ...info
            }));
        },

        getAppUrl() {
            return primaryUrl.value;
        },

        getRegions() {
            return regions.value;
        }
    };
}

// ============================================================================
// Region Information
// ============================================================================

export interface RegionInfo {
    name: string;
    city: string;
    country: string;
    continent: string;
    latitude: number;
    longitude: number;
}

export const REGION_INFO: Record<FlyRegion, RegionInfo> = {
    ams: { name: 'Amsterdam', city: 'Amsterdam', country: 'Netherlands', continent: 'Europe', latitude: 52.3676, longitude: 4.9041 },
    arn: { name: 'Stockholm', city: 'Stockholm', country: 'Sweden', continent: 'Europe', latitude: 59.6519, longitude: 17.9186 },
    atl: { name: 'Atlanta', city: 'Atlanta', country: 'United States', continent: 'North America', latitude: 33.6407, longitude: -84.4277 },
    bog: { name: 'Bogotá', city: 'Bogotá', country: 'Colombia', continent: 'South America', latitude: 4.7110, longitude: -74.0721 },
    bom: { name: 'Mumbai', city: 'Mumbai', country: 'India', continent: 'Asia', latitude: 19.0896, longitude: 72.8656 },
    bos: { name: 'Boston', city: 'Boston', country: 'United States', continent: 'North America', latitude: 42.3656, longitude: -71.0096 },
    cdg: { name: 'Paris', city: 'Paris', country: 'France', continent: 'Europe', latitude: 49.0097, longitude: 2.5479 },
    den: { name: 'Denver', city: 'Denver', country: 'United States', continent: 'North America', latitude: 39.8561, longitude: -104.6737 },
    dfw: { name: 'Dallas', city: 'Dallas', country: 'United States', continent: 'North America', latitude: 32.8998, longitude: -97.0403 },
    ewr: { name: 'Secaucus', city: 'Secaucus', country: 'United States', continent: 'North America', latitude: 40.7895, longitude: -74.0565 },
    eze: { name: 'Buenos Aires', city: 'Ezeiza', country: 'Argentina', continent: 'South America', latitude: -34.8222, longitude: -58.5358 },
    fra: { name: 'Frankfurt', city: 'Frankfurt', country: 'Germany', continent: 'Europe', latitude: 50.0379, longitude: 8.5622 },
    gdl: { name: 'Guadalajara', city: 'Guadalajara', country: 'Mexico', continent: 'North America', latitude: 20.5218, longitude: -103.3111 },
    gig: { name: 'Rio de Janeiro', city: 'Rio de Janeiro', country: 'Brazil', continent: 'South America', latitude: -22.8099, longitude: -43.2505 },
    gru: { name: 'São Paulo', city: 'Guarulhos', country: 'Brazil', continent: 'South America', latitude: -23.4356, longitude: -46.4731 },
    hkg: { name: 'Hong Kong', city: 'Hong Kong', country: 'Hong Kong', continent: 'Asia', latitude: 22.3080, longitude: 113.9185 },
    iad: { name: 'Ashburn', city: 'Ashburn', country: 'United States', continent: 'North America', latitude: 38.9519, longitude: -77.4480 },
    jnb: { name: 'Johannesburg', city: 'Johannesburg', country: 'South Africa', continent: 'Africa', latitude: -26.1367, longitude: 28.2411 },
    lax: { name: 'Los Angeles', city: 'Los Angeles', country: 'United States', continent: 'North America', latitude: 33.9425, longitude: -118.4081 },
    lhr: { name: 'London', city: 'London', country: 'United Kingdom', continent: 'Europe', latitude: 51.4700, longitude: -0.4543 },
    mad: { name: 'Madrid', city: 'Madrid', country: 'Spain', continent: 'Europe', latitude: 40.4983, longitude: -3.5676 },
    mia: { name: 'Miami', city: 'Miami', country: 'United States', continent: 'North America', latitude: 25.7959, longitude: -80.2870 },
    nrt: { name: 'Tokyo', city: 'Tokyo', country: 'Japan', continent: 'Asia', latitude: 35.7720, longitude: 140.3929 },
    ord: { name: 'Chicago', city: 'Chicago', country: 'United States', continent: 'North America', latitude: 41.9742, longitude: -87.9073 },
    otp: { name: 'Bucharest', city: 'Bucharest', country: 'Romania', continent: 'Europe', latitude: 44.5711, longitude: 26.0850 },
    phx: { name: 'Phoenix', city: 'Phoenix', country: 'United States', continent: 'North America', latitude: 33.4373, longitude: -112.0078 },
    qro: { name: 'Querétaro', city: 'Querétaro', country: 'Mexico', continent: 'North America', latitude: 20.6170, longitude: -100.3700 },
    scl: { name: 'Santiago', city: 'Santiago', country: 'Chile', continent: 'South America', latitude: -33.3930, longitude: -70.7858 },
    sea: { name: 'Seattle', city: 'Seattle', country: 'United States', continent: 'North America', latitude: 47.4502, longitude: -122.3088 },
    sin: { name: 'Singapore', city: 'Singapore', country: 'Singapore', continent: 'Asia', latitude: 1.3644, longitude: 103.9915 },
    sjc: { name: 'San Jose', city: 'San Jose', country: 'United States', continent: 'North America', latitude: 37.3639, longitude: -121.9289 },
    syd: { name: 'Sydney', city: 'Sydney', country: 'Australia', continent: 'Oceania', latitude: -33.9399, longitude: 151.1753 },
    waw: { name: 'Warsaw', city: 'Warsaw', country: 'Poland', continent: 'Europe', latitude: 52.1672, longitude: 20.9679 },
    yul: { name: 'Montreal', city: 'Montreal', country: 'Canada', continent: 'North America', latitude: 45.4657, longitude: -73.7455 },
    yyz: { name: 'Toronto', city: 'Toronto', country: 'Canada', continent: 'North America', latitude: 43.6777, longitude: -79.6248 }
};

// ============================================================================
// Edge Functions & SSR Support
// ============================================================================

export interface EdgeFunctionConfig {
    name: string;
    path: string;
    regions?: FlyRegion[];
    memory?: number;
    timeout?: number;
    env?: Record<string, string>;
}

export interface SSRConfig {
    streaming?: boolean;
    cacheControl?: string;
    revalidate?: number;
    staleWhileRevalidate?: number;
    regions?: FlyRegion[];
}

export function createEdgeFunction(config: EdgeFunctionConfig) {
    return {
        name: config.name,
        path: config.path,
        invoke: async (request: Request) => {
            // Edge function invocation logic
            const region = request.headers.get('fly-region') as FlyRegion || 'iad';
            const startTime = Date.now();

            return {
                region,
                latency: Date.now() - startTime,
                headers: {
                    'fly-region': region,
                    'fly-request-id': crypto.randomUUID()
                }
            };
        },
        config
    };
}

export function createSSRHandler(options: SSRConfig = {}) {
    return {
        handle: async (request: Request, render: () => Promise<string>) => {
            const region = request.headers.get('fly-region') || 'iad';
            const cacheKey = `ssr:${request.url}`;

            const html = await render();

            const headers = new Headers({
                'Content-Type': 'text/html; charset=utf-8',
                'fly-region': region,
                'Cache-Control': options.cacheControl || 'private, no-cache'
            });

            if (options.revalidate) {
                headers.set('Cache-Control', `s-maxage=${options.revalidate}, stale-while-revalidate=${options.staleWhileRevalidate || 86400}`);
            }

            return new Response(html, { headers });
        },

        handleStreaming: async (request: Request, render: () => ReadableStream) => {
            const region = request.headers.get('fly-region') || 'iad';

            const stream = render();

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'Transfer-Encoding': 'chunked',
                    'fly-region': region
                }
            });
        }
    };
}

// ============================================================================
// Configuration Generators
// ============================================================================

export function flyToml(config: FlyConfig): string {
    const services = config.services || [{
        name: 'http',
        internalPort: 3000,
        forceHttps: true,
        autoStopMachines: true,
        autoStartMachines: true,
        minMachinesRunning: 0
    }];

    let toml = `# Fly.io configuration for ${config.app}
# Generated by @philjs/fly

app = "${config.app}"
primary_region = "${config.primaryRegion || config.region || 'iad'}"
`;

    if (config.env && Object.keys(config.env).length > 0) {
        toml += `
[env]
${Object.entries(config.env).map(([k, v]) => `  ${k} = "${v}"`).join('\n')}
`;
    }

    toml += `
[build]
  ${config.dockerfile ? `dockerfile = "${config.dockerfile}"` : 'dockerfile = "Dockerfile"'}
`;

    if (config.buildArgs && Object.keys(config.buildArgs).length > 0) {
        toml += `
[build.args]
${Object.entries(config.buildArgs).map(([k, v]) => `  ${k} = "${v}"`).join('\n')}
`;
    }

    for (const service of services) {
        toml += `
[http_service]
  internal_port = ${service.internalPort}
  force_https = ${service.forceHttps ?? true}
  auto_stop_machines = ${service.autoStopMachines ?? true}
  auto_start_machines = ${service.autoStartMachines ?? true}
  min_machines_running = ${service.minMachinesRunning ?? 0}
`;

        if (service.concurrency) {
            toml += `
  [http_service.concurrency]
    type = "${service.concurrency.type}"
    soft_limit = ${service.concurrency.softLimit}
    hard_limit = ${service.concurrency.hardLimit}
`;
        }

        if (service.httpChecks && service.httpChecks.length > 0) {
            for (const check of service.httpChecks) {
                toml += `
  [[http_service.checks]]
    path = "${check.path}"
    interval = "${check.interval || '10s'}"
    timeout = "${check.timeout || '2s'}"
    grace_period = "${check.gracePeriod || '5s'}"
    method = "${check.method || 'GET'}"
`;
            }
        }
    }

    if (config.volumes && config.volumes.length > 0) {
        for (const volume of config.volumes) {
            toml += `
[[mounts]]
  source = "${volume.name}"
  destination = "${volume.mountPath}"
`;
        }
    }

    if (config.autoscaling) {
        toml += `
[autoscaling]
  min_machines = ${config.autoscaling.minMachines}
  max_machines = ${config.autoscaling.maxMachines}
`;
    }

    return toml;
}

export function dockerfile(options: DockerfileOptions = {}): string {
    const {
        baseImage = 'node:20-alpine',
        workdir = '/app',
        port = 3000,
        buildCommand = 'npm run build',
        startCommand = 'npm start',
        copyFiles = ['.'],
        env = {},
        multistage = true,
        packageManager = 'npm'
    } = options;

    if (multistage) {
        return `# Build stage
FROM ${baseImage} AS builder
WORKDIR ${workdir}

# Install dependencies
COPY package*.json ./
${packageManager === 'npm' ? 'RUN npm ci' : packageManager === 'yarn' ? 'RUN yarn install --frozen-lockfile' : 'RUN pnpm install --frozen-lockfile'}

# Copy source and build
${copyFiles.map(f => `COPY ${f} ./`).join('\n')}
RUN ${buildCommand}

# Production stage
FROM ${baseImage} AS runner
WORKDIR ${workdir}

# Set production environment
ENV NODE_ENV=production
${Object.entries(env).map(([k, v]) => `ENV ${k}=${v}`).join('\n')}

# Copy built assets
COPY --from=builder ${workdir}/dist ./dist
COPY --from=builder ${workdir}/node_modules ./node_modules
COPY --from=builder ${workdir}/package.json ./

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 philjs
USER philjs

EXPOSE ${port}
ENV PORT=${port}

CMD ${JSON.stringify(startCommand.split(' '))}
`;
    }

    return `FROM ${baseImage}
WORKDIR ${workdir}

# Set environment
ENV NODE_ENV=production
${Object.entries(env).map(([k, v]) => `ENV ${k}=${v}`).join('\n')}

# Install dependencies
COPY package*.json ./
${packageManager === 'npm' ? 'RUN npm ci --only=production' : packageManager === 'yarn' ? 'RUN yarn install --production --frozen-lockfile' : 'RUN pnpm install --prod --frozen-lockfile'}

# Copy application
${copyFiles.map(f => `COPY ${f} ./`).join('\n')}

EXPOSE ${port}
ENV PORT=${port}

CMD ${JSON.stringify(startCommand.split(' '))}
`;
}

export interface DockerfileOptions {
    baseImage?: string;
    workdir?: string;
    port?: number;
    buildCommand?: string;
    startCommand?: string;
    copyFiles?: string[];
    env?: Record<string, string>;
    multistage?: boolean;
    packageManager?: 'npm' | 'yarn' | 'pnpm';
}

export function dockerIgnore(): string {
    return `# Dependencies
node_modules
.pnpm-store

# Build outputs
dist
build
.next
.nuxt
.output

# Development
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Environment
.env
.env.*
!.env.example

# IDE
.idea
.vscode
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
coverage
.nyc_output

# Git
.git
.gitignore

# Docker
Dockerfile*
docker-compose*
.dockerignore

# Documentation
*.md
docs

# Fly.io
fly.toml
`;
}

// ============================================================================
// Hooks for PhilJS Components
// ============================================================================

export function useFlyApp(config: FlyConfig) {
    const adapter = createFlyAdapter(config);

    effect(() => {
        adapter.startAutoRefresh();
        return () => adapter.stopAutoRefresh();
    });

    return adapter;
}

export function useFlyMachines(appName: string, apiToken?: string) {
    const client = createFlyClient({ app: appName, apiToken });
    const machines = signal<Machine[]>([]);
    const loading = signal(false);
    const error = signal<string | null>(null);

    async function refresh() {
        loading.value = true;
        error.value = null;
        try {
            machines.value = await client.listMachines();
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to load machines';
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
        machines,
        loading,
        error,
        refresh,
        start: (id: string) => client.startMachine(id).then(refresh),
        stop: (id: string) => client.stopMachine(id).then(refresh),
        restart: (id: string) => client.restartMachine(id).then(refresh),
        destroy: (id: string) => client.destroyMachine(id).then(refresh)
    };
}

export function useFlyDeployment(config: FlyConfig) {
    const adapter = createFlyAdapter(config);
    const status = signal<'idle' | 'deploying' | 'success' | 'error'>('idle');
    const logs = signal<string[]>([]);
    const release = signal<Release | null>(null);

    async function deploy(options?: DeployOptions) {
        status.value = 'deploying';
        logs.value = ['Starting deployment...'];

        try {
            const result = await adapter.deploy(options);
            release.value = result;
            status.value = 'success';
            logs.value = [...logs.value, `Deployed release v${result.version}`];
            return result;
        } catch (e) {
            status.value = 'error';
            logs.value = [...logs.value, `Error: ${e instanceof Error ? e.message : 'Unknown error'}`];
            throw e;
        }
    }

    return {
        status,
        logs,
        release,
        deploy,
        isDeploying: computed(() => status.value === 'deploying')
    };
}

export function useFlyRegions() {
    return {
        regions: Object.keys(REGION_INFO) as FlyRegion[],
        getInfo: (region: FlyRegion) => REGION_INFO[region],
        getAll: () => Object.entries(REGION_INFO).map(([code, info]) => ({
            code: code as FlyRegion,
            ...info
        })),
        getByContinent: (continent: string) =>
            Object.entries(REGION_INFO)
                .filter(([, info]) => info.continent === continent)
                .map(([code, info]) => ({ code: code as FlyRegion, ...info })),
        getNearestRegions: (lat: number, lon: number, count = 3) => {
            const withDistance = Object.entries(REGION_INFO).map(([code, info]) => ({
                code: code as FlyRegion,
                ...info,
                distance: haversineDistance(lat, lon, info.latitude, info.longitude)
            }));
            return withDistance.sort((a, b) => a.distance - b.distance).slice(0, count);
        }
    };
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ============================================================================
// Metrics & Monitoring
// ============================================================================

export interface FlyMetrics {
    app: string;
    timestamp: string;
    machines: {
        total: number;
        running: number;
        stopped: number;
        byRegion: Record<FlyRegion, number>;
    };
    requests: {
        total: number;
        success: number;
        errors: number;
        latencyP50: number;
        latencyP95: number;
        latencyP99: number;
    };
    resources: {
        cpu: number;
        memory: number;
        bandwidth: number;
    };
}

export function createMetricsCollector(config: FlyConfig) {
    const client = createFlyClient(config);
    const metrics = signal<FlyMetrics | null>(null);
    const history = signal<FlyMetrics[]>([]);

    async function collect(): Promise<FlyMetrics> {
        const machines = await client.listMachines();

        const byRegion = machines.reduce((acc, m) => {
            acc[m.region] = (acc[m.region] || 0) + 1;
            return acc;
        }, {} as Record<FlyRegion, number>);

        const collected: FlyMetrics = {
            app: config.app,
            timestamp: new Date().toISOString(),
            machines: {
                total: machines.length,
                running: machines.filter(m => m.state === 'started').length,
                stopped: machines.filter(m => m.state === 'stopped').length,
                byRegion
            },
            requests: {
                total: 0,
                success: 0,
                errors: 0,
                latencyP50: 0,
                latencyP95: 0,
                latencyP99: 0
            },
            resources: {
                cpu: 0,
                memory: 0,
                bandwidth: 0
            }
        };

        metrics.value = collected;
        history.value = [...history.value.slice(-99), collected];

        return collected;
    }

    return {
        metrics,
        history,
        collect,
        startCollecting: (intervalMs = 60000) => {
            collect();
            const interval = setInterval(collect, intervalMs);
            return () => clearInterval(interval);
        }
    };
}

// ============================================================================
// CLI Integration
// ============================================================================

export interface FlyCliOptions {
    cwd?: string;
    env?: Record<string, string>;
    timeout?: number;
}

export async function flyctl(args: string[], options: FlyCliOptions = {}): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const { spawn } = await import('child_process');

    return new Promise((resolve, reject) => {
        const proc = spawn('flyctl', args, {
            cwd: options.cwd,
            env: { ...process.env, ...options.env },
            timeout: options.timeout
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

export const fly = {
    launch: (options: { name?: string; org?: string; region?: FlyRegion; now?: boolean } = {}) =>
        flyctl(['launch',
            ...(options.name ? ['--name', options.name] : []),
            ...(options.org ? ['--org', options.org] : []),
            ...(options.region ? ['--region', options.region] : []),
            ...(options.now ? ['--now'] : [])
        ]),

    deploy: (options: { image?: string; remote?: boolean; strategy?: string } = {}) =>
        flyctl(['deploy',
            ...(options.image ? ['--image', options.image] : []),
            ...(options.remote ? ['--remote-only'] : ['--local-only']),
            ...(options.strategy ? ['--strategy', options.strategy] : [])
        ]),

    status: () => flyctl(['status']),

    logs: (options: { region?: FlyRegion; instance?: string } = {}) =>
        flyctl(['logs',
            ...(options.region ? ['--region', options.region] : []),
            ...(options.instance ? ['--instance', options.instance] : [])
        ]),

    ssh: (command: string) => flyctl(['ssh', 'console', '-C', command]),

    secrets: {
        list: () => flyctl(['secrets', 'list']),
        set: (secrets: Record<string, string>) =>
            flyctl(['secrets', 'set', ...Object.entries(secrets).map(([k, v]) => `${k}=${v}`)]),
        unset: (keys: string[]) => flyctl(['secrets', 'unset', ...keys])
    },

    scale: {
        count: (count: number, options: { region?: FlyRegion } = {}) =>
            flyctl(['scale', 'count', String(count),
                ...(options.region ? ['--region', options.region] : [])
            ]),
        vm: (size: string) => flyctl(['scale', 'vm', size]),
        memory: (mb: number) => flyctl(['scale', 'memory', String(mb)])
    },

    volumes: {
        list: () => flyctl(['volumes', 'list']),
        create: (name: string, options: { size?: number; region?: FlyRegion } = {}) =>
            flyctl(['volumes', 'create', name,
                '--size', String(options.size || 1),
                ...(options.region ? ['--region', options.region] : [])
            ]),
        destroy: (id: string) => flyctl(['volumes', 'destroy', id, '-y'])
    },

    certs: {
        list: () => flyctl(['certs', 'list']),
        add: (hostname: string) => flyctl(['certs', 'add', hostname]),
        remove: (hostname: string) => flyctl(['certs', 'remove', hostname, '-y']),
        check: (hostname: string) => flyctl(['certs', 'check', hostname])
    },

    regions: {
        list: () => flyctl(['regions', 'list']),
        add: (region: FlyRegion) => flyctl(['regions', 'add', region]),
        remove: (region: FlyRegion) => flyctl(['regions', 'remove', region])
    },

    postgres: {
        create: (name: string, options: { region?: FlyRegion; vmSize?: string } = {}) =>
            flyctl(['postgres', 'create', '--name', name,
                ...(options.region ? ['--region', options.region] : []),
                ...(options.vmSize ? ['--vm-size', options.vmSize] : [])
            ]),
        attach: (appName: string, dbName: string) =>
            flyctl(['postgres', 'attach', dbName, '-a', appName]),
        detach: (appName: string, dbName: string) =>
            flyctl(['postgres', 'detach', dbName, '-a', appName])
    },

    redis: {
        create: (name: string, options: { region?: FlyRegion; eviction?: boolean } = {}) =>
            flyctl(['redis', 'create', '--name', name,
                ...(options.region ? ['--region', options.region] : []),
                ...(options.eviction ? ['--enable-eviction'] : [])
            ])
    }
};

// ============================================================================
// Export Utilities
// ============================================================================

export { createFlyAdapter as default };
