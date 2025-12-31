/**
 * @philjs/edge-mesh - Distributed Edge Consensus
 *
 * Mesh networking with Byzantine fault-tolerant state.
 * NO OTHER FRAMEWORK provides distributed edge consensus.
 *
 * Features:
 * - P2P mesh networking
 * - Byzantine fault tolerance
 * - Raft consensus algorithm
 * - Gossip protocol for state sync
 * - Edge location awareness
 * - Conflict-free replicated state
 * - Partition tolerance
 * - Automatic leader election
 */
export interface MeshNode {
    id: string;
    address: string;
    region?: string;
    latency?: number;
    state: 'connected' | 'disconnected' | 'suspect' | 'dead';
    lastSeen: number;
    metadata?: Record<string, any>;
}
export interface MeshConfig {
    nodeId?: string;
    signalServer?: string;
    heartbeatInterval?: number;
    suspectTimeout?: number;
    deadTimeout?: number;
    maxPeers?: number;
    enableRaft?: boolean;
    enableGossip?: boolean;
}
export interface ConsensusState {
    term: number;
    votedFor: string | null;
    log: LogEntry[];
    commitIndex: number;
    lastApplied: number;
}
export interface LogEntry {
    term: number;
    index: number;
    command: any;
    timestamp: number;
}
export interface GossipMessage {
    type: 'state' | 'membership' | 'custom';
    sender: string;
    version: number;
    payload: any;
    timestamp: number;
}
export interface VoteRequest {
    term: number;
    candidateId: string;
    lastLogIndex: number;
    lastLogTerm: number;
}
export interface VoteResponse {
    term: number;
    voteGranted: boolean;
}
export interface AppendEntriesRequest {
    term: number;
    leaderId: string;
    prevLogIndex: number;
    prevLogTerm: number;
    entries: LogEntry[];
    leaderCommit: number;
}
export interface AppendEntriesResponse {
    term: number;
    success: boolean;
    matchIndex?: number;
}
export type NodeRole = 'follower' | 'candidate' | 'leader';
export declare class VectorClock {
    private clock;
    constructor(initial?: Record<string, number>);
    increment(nodeId: string): void;
    get(nodeId: string): number;
    merge(other: VectorClock): void;
    compare(other: VectorClock): 'before' | 'after' | 'concurrent';
    toJSON(): Record<string, number>;
    clone(): VectorClock;
}
export declare class GossipProtocol {
    private nodeId;
    private state;
    private peers;
    private listeners;
    private onSend;
    private fanout;
    private gossipInterval;
    constructor(nodeId: string, onSend: (peerId: string, message: GossipMessage) => void, fanout?: number);
    start(intervalMs?: number): void;
    stop(): void;
    set(key: string, value: any): void;
    get<T>(key: string): T | undefined;
    subscribe(key: string, callback: (value: any) => void): () => void;
    addPeer(peerId: string): void;
    removePeer(peerId: string): void;
    receiveMessage(message: GossipMessage): void;
    private gossip;
    private gossipKey;
    private selectPeers;
    private getFullState;
    private notifyListeners;
}
export declare class RaftConsensus {
    private nodeId;
    private role;
    private currentTerm;
    private votedFor;
    private log;
    private commitIndex;
    private lastApplied;
    private leaderId;
    private nextIndex;
    private matchIndex;
    private peers;
    private electionTimeout;
    private heartbeatInterval;
    private onSend;
    private onApply;
    private listeners;
    constructor(nodeId: string, onSend: (peerId: string, message: any) => void, onApply: (command: any) => void);
    start(): void;
    stop(): void;
    addPeer(peerId: string): void;
    removePeer(peerId: string): void;
    propose(command: any): Promise<boolean>;
    receiveVoteRequest(request: VoteRequest): VoteResponse;
    receiveVoteResponse(response: VoteResponse, votesReceived: Set<string>): void;
    receiveAppendEntries(request: AppendEntriesRequest): AppendEntriesResponse;
    receiveAppendEntriesResponse(peerId: string, response: AppendEntriesResponse): void;
    private resetElectionTimeout;
    private startElection;
    private becomeFollower;
    private becomeLeader;
    private sendAppendEntries;
    private updateCommitIndex;
    private applyCommitted;
    private notifyListeners;
    onStateChange(callback: (state: {
        role: NodeRole;
        term: number;
        leader: string | null;
    }) => void): () => void;
    getState(): {
        role: NodeRole;
        term: number;
        leader: string | null;
        commitIndex: number;
    };
    isLeader(): boolean;
    getLeader(): string | null;
}
export declare class EdgeMesh {
    private nodeId;
    private config;
    private nodes;
    private connections;
    private dataChannels;
    private gossip;
    private raft;
    private listeners;
    constructor(config?: MeshConfig);
    start(): Promise<void>;
    stop(): void;
    connectToPeer(peerId: string, offer?: RTCSessionDescriptionInit): Promise<void>;
    handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void>;
    handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void>;
    private setupDataChannel;
    private handleMessage;
    private sendToPeer;
    broadcast(message: any): void;
    set(key: string, value: any): void;
    get<T>(key: string): T | undefined;
    subscribe(key: string, callback: (value: any) => void): () => void;
    propose(command: any): Promise<boolean>;
    isLeader(): boolean;
    getLeader(): string | null;
    getNodes(): MeshNode[];
    getConnectedPeers(): string[];
    private startHeartbeat;
    private updateNodeState;
    on(event: string, callback: (...args: any[]) => void): () => void;
    private emit;
    getNodeId(): string;
}
/**
 * Hook for edge mesh networking
 */
export declare function useEdgeMesh(config?: MeshConfig): {
    nodeId: string;
    peers: string[];
    nodes: MeshNode[];
    isLeader: boolean;
    leader: string | null;
    connect: (peerId: string) => Promise<void>;
    broadcast: (message: any) => void;
    set: (key: string, value: any) => void;
    get: <T>(key: string) => T | undefined;
    subscribe: (key: string, callback: (value: any) => void) => () => void;
    propose: (command: any) => Promise<boolean>;
};
/**
 * Hook for gossip state
 */
export declare function useGossipState<T>(key: string, initialValue?: T): [T | undefined, (value: T) => void];
declare const _default: {
    VectorClock: typeof VectorClock;
    GossipProtocol: typeof GossipProtocol;
    RaftConsensus: typeof RaftConsensus;
    EdgeMesh: typeof EdgeMesh;
    useEdgeMesh: typeof useEdgeMesh;
    useGossipState: typeof useGossipState;
};
export default _default;
//# sourceMappingURL=index.d.ts.map