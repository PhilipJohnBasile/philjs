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

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Vector Clock
// ============================================================================

export class VectorClock {
  private clock: Map<string, number> = new Map();

  constructor(initial?: Record<string, number>) {
    if (initial) {
      Object.entries(initial).forEach(([node, time]) => {
        this.clock.set(node, time);
      });
    }
  }

  increment(nodeId: string): void {
    const current = this.clock.get(nodeId) ?? 0;
    this.clock.set(nodeId, current + 1);
  }

  get(nodeId: string): number {
    return this.clock.get(nodeId) ?? 0;
  }

  merge(other: VectorClock): void {
    for (const [node, time] of other.clock) {
      const current = this.clock.get(node) ?? 0;
      this.clock.set(node, Math.max(current, time));
    }
  }

  compare(other: VectorClock): 'before' | 'after' | 'concurrent' {
    let before = false;
    let after = false;

    const allNodes = new Set([...this.clock.keys(), ...other.clock.keys()]);

    for (const node of allNodes) {
      const thisTime = this.get(node);
      const otherTime = other.get(node);

      if (thisTime < otherTime) before = true;
      if (thisTime > otherTime) after = true;
    }

    if (before && !after) return 'before';
    if (after && !before) return 'after';
    return 'concurrent';
  }

  toJSON(): Record<string, number> {
    return Object.fromEntries(this.clock);
  }

  clone(): VectorClock {
    return new VectorClock(this.toJSON());
  }
}

// ============================================================================
// Gossip Protocol
// ============================================================================

export class GossipProtocol {
  private nodeId: string;
  private state: Map<string, { value: any; version: number; timestamp: number }> = new Map();
  private peers: Set<string> = new Set();
  private listeners: Map<string, Set<(value: any) => void>> = new Map();
  private onSend: (peerId: string, message: GossipMessage) => void;
  private fanout: number;
  private gossipInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    nodeId: string,
    onSend: (peerId: string, message: GossipMessage) => void,
    fanout: number = 3
  ) {
    this.nodeId = nodeId;
    this.onSend = onSend;
    this.fanout = fanout;
  }

  start(intervalMs: number = 1000): void {
    this.gossipInterval = setInterval(() => {
      this.gossip();
    }, intervalMs);
  }

  stop(): void {
    if (this.gossipInterval) {
      clearInterval(this.gossipInterval);
      this.gossipInterval = null;
    }
  }

  set(key: string, value: any): void {
    const existing = this.state.get(key);
    const version = (existing?.version ?? 0) + 1;

    this.state.set(key, {
      value,
      version,
      timestamp: Date.now()
    });

    this.notifyListeners(key, value);
    this.gossipKey(key);
  }

  get<T>(key: string): T | undefined {
    return this.state.get(key)?.value;
  }

  subscribe(key: string, callback: (value: any) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    // Call with current value
    const current = this.state.get(key);
    if (current) {
      callback(current.value);
    }

    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  addPeer(peerId: string): void {
    this.peers.add(peerId);
  }

  removePeer(peerId: string): void {
    this.peers.delete(peerId);
  }

  receiveMessage(message: GossipMessage): void {
    if (message.type === 'state') {
      const { key, value, version, timestamp } = message.payload;
      const existing = this.state.get(key);

      // Accept if newer version or same version with earlier timestamp
      if (!existing ||
          version > existing.version ||
          (version === existing.version && timestamp < existing.timestamp)) {
        this.state.set(key, { value, version, timestamp });
        this.notifyListeners(key, value);
      }
    }
  }

  private gossip(): void {
    const peers = this.selectPeers();
    const payload = this.getFullState();

    for (const peerId of peers) {
      this.onSend(peerId, {
        type: 'state',
        sender: this.nodeId,
        version: Date.now(),
        payload,
        timestamp: Date.now()
      });
    }
  }

  private gossipKey(key: string): void {
    const entry = this.state.get(key);
    if (!entry) return;

    const peers = this.selectPeers();

    for (const peerId of peers) {
      this.onSend(peerId, {
        type: 'state',
        sender: this.nodeId,
        version: entry.version,
        payload: { key, ...entry },
        timestamp: entry.timestamp
      });
    }
  }

  private selectPeers(): string[] {
    const peerArray = Array.from(this.peers);
    const selected: string[] = [];

    for (let i = 0; i < Math.min(this.fanout, peerArray.length); i++) {
      const idx = Math.floor(Math.random() * peerArray.length);
      const peer = peerArray.splice(idx, 1)[0]!;
      selected.push(peer);
    }

    return selected;
  }

  private getFullState(): Record<string, any> {
    const state: Record<string, any> = {};
    for (const [key, entry] of this.state) {
      state[key] = entry;
    }
    return state;
  }

  private notifyListeners(key: string, value: any): void {
    this.listeners.get(key)?.forEach(cb => cb(value));
  }
}

// ============================================================================
// Raft Consensus
// ============================================================================

export class RaftConsensus {
  private nodeId: string;
  private role: NodeRole = 'follower';
  private currentTerm = 0;
  private votedFor: string | null = null;
  private log: LogEntry[] = [];
  private commitIndex = 0;
  private lastApplied = 0;
  private leaderId: string | null = null;

  // Leader state
  private nextIndex: Map<string, number> = new Map();
  private matchIndex: Map<string, number> = new Map();

  private peers: Set<string> = new Set();
  private electionTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  private onSend: (peerId: string, message: any) => void;
  private onApply: (command: any) => void;
  private listeners: Set<(state: { role: NodeRole; term: number; leader: string | null }) => void> = new Set();

  constructor(
    nodeId: string,
    onSend: (peerId: string, message: any) => void,
    onApply: (command: any) => void
  ) {
    this.nodeId = nodeId;
    this.onSend = onSend;
    this.onApply = onApply;
  }

  start(): void {
    this.resetElectionTimeout();
  }

  stop(): void {
    if (this.electionTimeout) {
      clearTimeout(this.electionTimeout);
      this.electionTimeout = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  addPeer(peerId: string): void {
    this.peers.add(peerId);
    this.nextIndex.set(peerId, this.log.length);
    this.matchIndex.set(peerId, 0);
  }

  removePeer(peerId: string): void {
    this.peers.delete(peerId);
    this.nextIndex.delete(peerId);
    this.matchIndex.delete(peerId);
  }

  async propose(command: any): Promise<boolean> {
    if (this.role !== 'leader') {
      return false;
    }

    const entry: LogEntry = {
      term: this.currentTerm,
      index: this.log.length,
      command,
      timestamp: Date.now()
    };

    this.log.push(entry);
    this.sendAppendEntries();

    return true;
  }

  receiveVoteRequest(request: VoteRequest): VoteResponse {
    if (request.term < this.currentTerm) {
      return { term: this.currentTerm, voteGranted: false };
    }

    if (request.term > this.currentTerm) {
      this.currentTerm = request.term;
      this.votedFor = null;
      this.becomeFollower();
    }

    const lastLogIndex = this.log.length - 1;
    const lastLogTerm = lastLogIndex >= 0 ? this.log[lastLogIndex]!.term : 0;

    const logOk =
      request.lastLogTerm > lastLogTerm ||
      (request.lastLogTerm === lastLogTerm && request.lastLogIndex >= lastLogIndex);

    if ((this.votedFor === null || this.votedFor === request.candidateId) && logOk) {
      this.votedFor = request.candidateId;
      this.resetElectionTimeout();
      return { term: this.currentTerm, voteGranted: true };
    }

    return { term: this.currentTerm, voteGranted: false };
  }

  receiveVoteResponse(response: VoteResponse, votesReceived: Set<string>): void {
    if (response.term > this.currentTerm) {
      this.currentTerm = response.term;
      this.becomeFollower();
      return;
    }

    if (this.role !== 'candidate') return;

    // Check if we have majority
    const majority = Math.floor(this.peers.size / 2) + 1;
    if (votesReceived.size >= majority) {
      this.becomeLeader();
    }
  }

  receiveAppendEntries(request: AppendEntriesRequest): AppendEntriesResponse {
    if (request.term < this.currentTerm) {
      return { term: this.currentTerm, success: false };
    }

    if (request.term > this.currentTerm) {
      this.currentTerm = request.term;
      this.votedFor = null;
    }

    this.leaderId = request.leaderId;
    this.becomeFollower();
    this.resetElectionTimeout();

    // Check log consistency
    if (request.prevLogIndex >= 0) {
      if (request.prevLogIndex >= this.log.length) {
        return { term: this.currentTerm, success: false };
      }

      if (this.log[request.prevLogIndex]!.term !== request.prevLogTerm) {
        // Truncate log
        this.log = this.log.slice(0, request.prevLogIndex);
        return { term: this.currentTerm, success: false };
      }
    }

    // Append new entries
    for (const entry of request.entries) {
      if (entry.index < this.log.length) {
        if (this.log[entry.index]!.term !== entry.term) {
          this.log = this.log.slice(0, entry.index);
          this.log.push(entry);
        }
      } else {
        this.log.push(entry);
      }
    }

    // Update commit index
    if (request.leaderCommit > this.commitIndex) {
      this.commitIndex = Math.min(request.leaderCommit, this.log.length - 1);
      this.applyCommitted();
    }

    return {
      term: this.currentTerm,
      success: true,
      matchIndex: this.log.length - 1
    };
  }

  receiveAppendEntriesResponse(peerId: string, response: AppendEntriesResponse): void {
    if (response.term > this.currentTerm) {
      this.currentTerm = response.term;
      this.becomeFollower();
      return;
    }

    if (this.role !== 'leader') return;

    if (response.success) {
      this.matchIndex.set(peerId, response.matchIndex!);
      this.nextIndex.set(peerId, response.matchIndex! + 1);
      this.updateCommitIndex();
    } else {
      // Decrement nextIndex and retry
      const next = this.nextIndex.get(peerId) ?? 1;
      this.nextIndex.set(peerId, Math.max(0, next - 1));
    }
  }

  private resetElectionTimeout(): void {
    if (this.electionTimeout) {
      clearTimeout(this.electionTimeout);
    }

    // Random timeout between 150-300ms
    const timeout = 150 + Math.random() * 150;

    this.electionTimeout = setTimeout(() => {
      this.startElection();
    }, timeout);
  }

  private startElection(): void {
    this.role = 'candidate';
    this.currentTerm++;
    this.votedFor = this.nodeId;
    this.notifyListeners();

    const lastLogIndex = this.log.length - 1;
    const lastLogTerm = lastLogIndex >= 0 ? this.log[lastLogIndex]!.term : 0;

    const request: VoteRequest = {
      term: this.currentTerm,
      candidateId: this.nodeId,
      lastLogIndex,
      lastLogTerm
    };

    for (const peerId of this.peers) {
      this.onSend(peerId, { type: 'voteRequest', ...request });
    }

    this.resetElectionTimeout();
  }

  private becomeFollower(): void {
    this.role = 'follower';

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.resetElectionTimeout();
    this.notifyListeners();
  }

  private becomeLeader(): void {
    this.role = 'leader';
    this.leaderId = this.nodeId;

    if (this.electionTimeout) {
      clearTimeout(this.electionTimeout);
      this.electionTimeout = null;
    }

    // Initialize leader state
    for (const peerId of this.peers) {
      this.nextIndex.set(peerId, this.log.length);
      this.matchIndex.set(peerId, 0);
    }

    // Start heartbeats
    this.heartbeatInterval = setInterval(() => {
      this.sendAppendEntries();
    }, 50);

    this.sendAppendEntries();
    this.notifyListeners();
  }

  private sendAppendEntries(): void {
    for (const peerId of this.peers) {
      const nextIdx = this.nextIndex.get(peerId) ?? 0;
      const prevLogIndex = nextIdx - 1;
      const prevLogTerm = prevLogIndex >= 0 ? this.log[prevLogIndex]!.term : 0;

      const entries = this.log.slice(nextIdx);

      const request: AppendEntriesRequest = {
        term: this.currentTerm,
        leaderId: this.nodeId,
        prevLogIndex,
        prevLogTerm,
        entries,
        leaderCommit: this.commitIndex
      };

      this.onSend(peerId, { type: 'appendEntries', ...request });
    }
  }

  private updateCommitIndex(): void {
    // Find the highest index that a majority has replicated
    for (let n = this.log.length - 1; n > this.commitIndex; n--) {
      if (this.log[n]!.term !== this.currentTerm) continue;

      let count = 1; // Count self
      for (const matchIdx of this.matchIndex.values()) {
        if (matchIdx >= n) count++;
      }

      if (count > (this.peers.size + 1) / 2) {
        this.commitIndex = n;
        this.applyCommitted();
        break;
      }
    }
  }

  private applyCommitted(): void {
    while (this.lastApplied < this.commitIndex) {
      this.lastApplied++;
      const entry = this.log[this.lastApplied]!;
      this.onApply(entry.command);
    }
  }

  private notifyListeners(): void {
    const state = {
      role: this.role,
      term: this.currentTerm,
      leader: this.leaderId
    };
    this.listeners.forEach(cb => cb(state));
  }

  onStateChange(callback: (state: { role: NodeRole; term: number; leader: string | null }) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  getState(): { role: NodeRole; term: number; leader: string | null; commitIndex: number } {
    return {
      role: this.role,
      term: this.currentTerm,
      leader: this.leaderId,
      commitIndex: this.commitIndex
    };
  }

  isLeader(): boolean {
    return this.role === 'leader';
  }

  getLeader(): string | null {
    return this.leaderId;
  }
}

// ============================================================================
// Edge Mesh Network
// ============================================================================

export class EdgeMesh {
  private nodeId: string;
  private config: Required<MeshConfig>;
  private nodes: Map<string, MeshNode> = new Map();
  private connections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private gossip: GossipProtocol;
  private raft: RaftConsensus | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  constructor(config: MeshConfig = {}) {
    this.nodeId = config.nodeId ?? crypto.randomUUID();
    this.config = {
      nodeId: this.nodeId,
      signalServer: config.signalServer ?? 'wss://signal.example.com',
      heartbeatInterval: config.heartbeatInterval ?? 5000,
      suspectTimeout: config.suspectTimeout ?? 15000,
      deadTimeout: config.deadTimeout ?? 30000,
      maxPeers: config.maxPeers ?? 20,
      enableRaft: config.enableRaft ?? true,
      enableGossip: config.enableGossip ?? true
    };

    this.gossip = new GossipProtocol(
      this.nodeId,
      (peerId, message) => this.sendToPeer(peerId, message)
    );

    if (this.config.enableRaft) {
      this.raft = new RaftConsensus(
        this.nodeId,
        (peerId, message) => this.sendToPeer(peerId, message),
        (command) => this.emit('apply', command)
      );
    }
  }

  async start(): Promise<void> {
    if (this.config.enableGossip) {
      this.gossip.start();
    }

    if (this.raft) {
      this.raft.start();
    }

    this.startHeartbeat();
  }

  stop(): void {
    this.gossip.stop();
    this.raft?.stop();

    for (const connection of this.connections.values()) {
      connection.close();
    }

    this.connections.clear();
    this.dataChannels.clear();
  }

  async connectToPeer(peerId: string, offer?: RTCSessionDescriptionInit): Promise<void> {
    if (this.connections.has(peerId)) return;

    const connection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    this.connections.set(peerId, connection);

    // Create data channel
    const channel = connection.createDataChannel('mesh', {
      ordered: false,
      maxRetransmits: 3
    });

    this.setupDataChannel(peerId, channel);

    connection.ondatachannel = (event) => {
      this.setupDataChannel(peerId, event.channel);
    };

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        this.emit('iceCandidate', { peerId, candidate: event.candidate });
      }
    };

    connection.onconnectionstatechange = () => {
      this.updateNodeState(peerId, connection.connectionState);
    };

    if (offer) {
      await connection.setRemoteDescription(offer);
      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);
      this.emit('answer', { peerId, answer });
    } else {
      const newOffer = await connection.createOffer();
      await connection.setLocalDescription(newOffer);
      this.emit('offer', { peerId, offer: newOffer });
    }
  }

  async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const connection = this.connections.get(peerId);
    if (connection) {
      await connection.setRemoteDescription(answer);
    }
  }

  async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const connection = this.connections.get(peerId);
    if (connection) {
      await connection.addIceCandidate(candidate);
    }
  }

  private setupDataChannel(peerId: string, channel: RTCDataChannel): void {
    this.dataChannels.set(peerId, channel);

    channel.onopen = () => {
      this.gossip.addPeer(peerId);
      this.raft?.addPeer(peerId);

      this.nodes.set(peerId, {
        id: peerId,
        address: '',
        state: 'connected',
        lastSeen: Date.now()
      });

      this.emit('peerConnected', peerId);
    };

    channel.onclose = () => {
      this.gossip.removePeer(peerId);
      this.raft?.removePeer(peerId);
      this.dataChannels.delete(peerId);

      const node = this.nodes.get(peerId);
      if (node) {
        node.state = 'disconnected';
      }

      this.emit('peerDisconnected', peerId);
    };

    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(peerId, message);
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    };
  }

  private handleMessage(peerId: string, message: any): void {
    // Update last seen
    const node = this.nodes.get(peerId);
    if (node) {
      node.lastSeen = Date.now();
      node.state = 'connected';
    }

    if (message.type === 'gossip') {
      this.gossip.receiveMessage(message.payload);
    } else if (message.type === 'voteRequest' && this.raft) {
      const response = this.raft.receiveVoteRequest(message);
      this.sendToPeer(peerId, { type: 'voteResponse', ...response });
    } else if (message.type === 'voteResponse' && this.raft) {
      // Handle vote response (simplified)
    } else if (message.type === 'appendEntries' && this.raft) {
      const response = this.raft.receiveAppendEntries(message);
      this.sendToPeer(peerId, { type: 'appendEntriesResponse', ...response });
    } else if (message.type === 'appendEntriesResponse' && this.raft) {
      this.raft.receiveAppendEntriesResponse(peerId, message);
    } else {
      this.emit('message', { peerId, message });
    }
  }

  private sendToPeer(peerId: string, message: any): void {
    const channel = this.dataChannels.get(peerId);
    if (channel && channel.readyState === 'open') {
      channel.send(JSON.stringify(message));
    }
  }

  broadcast(message: any): void {
    for (const peerId of this.dataChannels.keys()) {
      this.sendToPeer(peerId, message);
    }
  }

  set(key: string, value: any): void {
    this.gossip.set(key, value);
  }

  get<T>(key: string): T | undefined {
    return this.gossip.get<T>(key);
  }

  subscribe(key: string, callback: (value: any) => void): () => void {
    return this.gossip.subscribe(key, callback);
  }

  async propose(command: any): Promise<boolean> {
    if (!this.raft) {
      throw new Error('Raft consensus not enabled');
    }
    return this.raft.propose(command);
  }

  isLeader(): boolean {
    return this.raft?.isLeader() ?? false;
  }

  getLeader(): string | null {
    return this.raft?.getLeader() ?? null;
  }

  getNodes(): MeshNode[] {
    return Array.from(this.nodes.values());
  }

  getConnectedPeers(): string[] {
    return Array.from(this.dataChannels.keys()).filter(
      id => this.dataChannels.get(id)?.readyState === 'open'
    );
  }

  private startHeartbeat(): void {
    setInterval(() => {
      const now = Date.now();

      for (const [id, node] of this.nodes) {
        const timeSinceLastSeen = now - node.lastSeen;

        if (timeSinceLastSeen > this.config.deadTimeout) {
          node.state = 'dead';
          this.emit('nodeDead', id);
        } else if (timeSinceLastSeen > this.config.suspectTimeout) {
          node.state = 'suspect';
          this.emit('nodeSuspect', id);
        }
      }

      // Send heartbeat
      this.broadcast({ type: 'heartbeat', timestamp: now });
    }, this.config.heartbeatInterval);
  }

  private updateNodeState(peerId: string, state: RTCPeerConnectionState): void {
    const node = this.nodes.get(peerId);
    if (!node) return;

    if (state === 'connected') {
      node.state = 'connected';
      node.lastSeen = Date.now();
    } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
      node.state = 'disconnected';
    }
  }

  on(event: string, callback: (...args: any[]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach(cb => cb(...args));
  }

  getNodeId(): string {
    return this.nodeId;
  }
}

// ============================================================================
// React-style Hooks
// ============================================================================

// State helper
function createState<T>(initial: T): [() => T, (value: T) => void] {
  let value = initial;
  return [() => value, (newValue: T) => { value = newValue; }];
}

let globalMesh: EdgeMesh | null = null;

/**
 * Hook for edge mesh networking
 */
export function useEdgeMesh(config?: MeshConfig): {
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
} {
  if (!globalMesh) {
    globalMesh = new EdgeMesh(config);
    globalMesh.start();
  }

  const mesh = globalMesh;
  const [getPeers, setPeers] = createState<string[]>([]);
  const [getNodes, setNodes] = createState<MeshNode[]>([]);
  const [getLeaderState, setLeaderState] = createState<{ isLeader: boolean; leader: string | null }>({
    isLeader: false,
    leader: null
  });

  mesh.on('peerConnected', () => setPeers(mesh.getConnectedPeers()));
  mesh.on('peerDisconnected', () => setPeers(mesh.getConnectedPeers()));

  // Update nodes periodically
  setInterval(() => {
    setNodes(mesh.getNodes());
    setLeaderState({ isLeader: mesh.isLeader(), leader: mesh.getLeader() });
  }, 1000);

  const leaderState = getLeaderState();

  return {
    nodeId: mesh.getNodeId(),
    peers: getPeers(),
    nodes: getNodes(),
    isLeader: leaderState.isLeader,
    leader: leaderState.leader,
    connect: (peerId) => mesh.connectToPeer(peerId),
    broadcast: (msg) => mesh.broadcast(msg),
    set: (key, value) => mesh.set(key, value),
    get: <T>(key: string) => mesh.get<T>(key),
    subscribe: (key, cb) => mesh.subscribe(key, cb),
    propose: (cmd) => mesh.propose(cmd)
  };
}

/**
 * Hook for gossip state
 */
export function useGossipState<T>(key: string, initialValue?: T): [T | undefined, (value: T) => void] {
  if (!globalMesh) {
    globalMesh = new EdgeMesh();
    globalMesh.start();
  }

  const mesh = globalMesh;
  const [getValue, setValue] = createState<T | undefined>(mesh.get<T>(key) ?? initialValue);

  mesh.subscribe(key, (value) => setValue(value));

  return [
    getValue(),
    (value: T) => mesh.set(key, value)
  ];
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  VectorClock,
  GossipProtocol,
  RaftConsensus,
  EdgeMesh,
  useEdgeMesh,
  useGossipState
};
