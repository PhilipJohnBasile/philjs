# @philjs/edge-mesh - Distributed Edge Consensus

The `@philjs/edge-mesh` package provides distributed edge consensus capabilities for PhilJS applications. It enables P2P mesh networking with Byzantine fault-tolerant state synchronization, making it possible to build truly decentralized applications that work across edge locations.

**No other framework provides distributed edge consensus out of the box.**

## Installation

```bash
npm install @philjs/edge-mesh
# or
pnpm add @philjs/edge-mesh
# or
bun add @philjs/edge-mesh
```

## Features

- **P2P Mesh Networking** - WebRTC-based peer-to-peer connections with automatic peer discovery
- **Byzantine Fault Tolerance** - Tolerates malicious or failing nodes in the network
- **Raft Consensus Algorithm** - Industry-standard consensus for leader election and log replication
- **Gossip Protocol** - Efficient state synchronization across the mesh
- **Edge Location Awareness** - Region-aware routing and latency optimization
- **Conflict-Free Replicated State** - CRDT-style state that merges automatically
- **Partition Tolerance** - Continues operating during network partitions
- **Automatic Leader Election** - Self-healing cluster leadership
- **Vector Clocks** - Logical time tracking for causal ordering

## Quick Start

```typescript
import { EdgeMesh, useEdgeMesh } from '@philjs/edge-mesh';

// Create a mesh network
const mesh = new EdgeMesh({
  nodeId: 'my-node-123',
  enableRaft: true,
  enableGossip: true
});

// Start the mesh
await mesh.start();

// Connect to a peer
await mesh.connectToPeer('peer-456');

// Set shared state (gossip protocol)
mesh.set('sharedCounter', 42);

// Get shared state
const value = mesh.get<number>('sharedCounter');

// Subscribe to state changes
mesh.subscribe('sharedCounter', (newValue) => {
  console.log('Counter updated:', newValue);
});

// Propose a command (Raft consensus)
if (mesh.isLeader()) {
  await mesh.propose({ type: 'INCREMENT', amount: 1 });
}

// Listen for events
mesh.on('peerConnected', (peerId) => {
  console.log('New peer connected:', peerId);
});
```

## Architecture

```
@philjs/edge-mesh
|
+-- Vector Clock Layer
|   +-- VectorClock       - Logical time for causality tracking
|   +-- increment()       - Increment local clock
|   +-- merge()           - Merge with remote clock
|   +-- compare()         - Determine causal ordering
|
+-- Gossip Protocol Layer
|   +-- GossipProtocol    - Epidemic-style state sync
|   +-- set/get           - Key-value state storage
|   +-- subscribe         - Reactive state updates
|   +-- fanout            - Configurable gossip spread
|
+-- Raft Consensus Layer
|   +-- RaftConsensus     - Log replication consensus
|   +-- propose()         - Submit commands to cluster
|   +-- Leader election   - Automatic failover
|   +-- Log compaction    - Efficient storage
|
+-- Edge Mesh Layer
    +-- EdgeMesh          - High-level mesh orchestration
    +-- P2P connections   - WebRTC data channels
    +-- Heartbeat/health  - Node failure detection
    +-- Event system      - Mesh lifecycle events
```

---

## VectorClock

Vector clocks provide logical time tracking to establish causal ordering of events across distributed nodes. They help detect concurrent updates and resolve conflicts.

### Creating a Vector Clock

```typescript
import { VectorClock } from '@philjs/edge-mesh';

// Create empty vector clock
const clock = new VectorClock();

// Create with initial values
const clockWithState = new VectorClock({
  'node-a': 5,
  'node-b': 3
});
```

### Incrementing the Clock

```typescript
const clock = new VectorClock();

// Increment for current node
clock.increment('my-node');
clock.increment('my-node');

console.log(clock.get('my-node')); // 2
console.log(clock.get('other-node')); // 0 (default)
```

### Merging Clocks

```typescript
const localClock = new VectorClock({ 'node-a': 5, 'node-b': 2 });
const remoteClock = new VectorClock({ 'node-a': 3, 'node-b': 7 });

// Merge takes max of each component
localClock.merge(remoteClock);

console.log(localClock.toJSON());
// { 'node-a': 5, 'node-b': 7 }
```

### Comparing Clocks (Causal Ordering)

```typescript
const clockA = new VectorClock({ 'n1': 2, 'n2': 3 });
const clockB = new VectorClock({ 'n1': 3, 'n2': 4 });
const clockC = new VectorClock({ 'n1': 1, 'n2': 5 });

// clockA happened-before clockB
console.log(clockA.compare(clockB)); // 'before'

// clockB happened-after clockA
console.log(clockB.compare(clockA)); // 'after'

// clockA and clockC are concurrent (neither happened before the other)
console.log(clockA.compare(clockC)); // 'concurrent'
```

### Cloning

```typescript
const original = new VectorClock({ 'node-a': 5 });
const copy = original.clone();

copy.increment('node-a');

console.log(original.get('node-a')); // 5
console.log(copy.get('node-a'));     // 6
```

---

## GossipProtocol

The gossip protocol implements epidemic-style state synchronization. Each node periodically exchanges state with a random subset of peers, ensuring eventual consistency across the mesh.

### Creating a Gossip Protocol Instance

```typescript
import { GossipProtocol, GossipMessage } from '@philjs/edge-mesh';

const gossip = new GossipProtocol(
  'my-node-id',
  (peerId: string, message: GossipMessage) => {
    // Send message to peer via your transport layer
    sendToPeer(peerId, message);
  },
  3 // fanout: number of peers to gossip with each round
);
```

### Starting and Stopping Gossip

```typescript
// Start periodic gossip (every 1000ms by default)
gossip.start(1000);

// Stop gossip when done
gossip.stop();
```

### Managing Peers

```typescript
// Add peers to gossip with
gossip.addPeer('peer-1');
gossip.addPeer('peer-2');
gossip.addPeer('peer-3');

// Remove a peer
gossip.removePeer('peer-1');
```

### Setting and Getting State

```typescript
// Set a value (automatically gossips to peers)
gossip.set('user:online', true);
gossip.set('config:theme', { mode: 'dark', accent: 'blue' });

// Get current value
const isOnline = gossip.get<boolean>('user:online');
const theme = gossip.get<{ mode: string; accent: string }>('config:theme');
```

### Subscribing to State Changes

```typescript
// Subscribe to key changes
const unsubscribe = gossip.subscribe('user:online', (value) => {
  console.log('Online status changed:', value);
});

// Later: unsubscribe
unsubscribe();
```

### Receiving Messages from Peers

```typescript
// When you receive a message from a peer, pass it to the gossip protocol
function onMessageReceived(message: GossipMessage) {
  gossip.receiveMessage(message);
}
```

### Full Example: Distributed Counter

```typescript
import { GossipProtocol } from '@philjs/edge-mesh';

// Transport layer (simplified WebSocket example)
const connections = new Map<string, WebSocket>();

const gossip = new GossipProtocol(
  'node-1',
  (peerId, message) => {
    connections.get(peerId)?.send(JSON.stringify(message));
  }
);

// Add peers
gossip.addPeer('node-2');
gossip.addPeer('node-3');

// Start gossip
gossip.start(500); // Gossip every 500ms

// Subscribe to counter updates
gossip.subscribe('counter', (value) => {
  document.getElementById('counter')!.textContent = String(value);
});

// Increment counter
function incrementCounter() {
  const current = gossip.get<number>('counter') ?? 0;
  gossip.set('counter', current + 1);
}
```

---

## RaftConsensus

The Raft consensus algorithm provides strong consistency guarantees for state machine replication. It elects a leader that coordinates all state changes, ensuring all nodes see the same sequence of commands.

### Creating a Raft Consensus Instance

```typescript
import { RaftConsensus } from '@philjs/edge-mesh';

const raft = new RaftConsensus(
  'my-node-id',
  // Send messages to peers
  (peerId: string, message: any) => {
    sendToPeer(peerId, message);
  },
  // Apply committed commands to state machine
  (command: any) => {
    console.log('Applying command:', command);
    applyToStateMachine(command);
  }
);
```

### Starting and Stopping Raft

```typescript
// Start the consensus protocol
raft.start();

// Stop when shutting down
raft.stop();
```

### Managing Cluster Peers

```typescript
// Add nodes to the cluster
raft.addPeer('node-2');
raft.addPeer('node-3');

// Remove a node
raft.removePeer('node-3');
```

### Proposing Commands

Only the leader can propose new commands. Non-leaders should forward requests to the leader.

```typescript
async function handleClientRequest(command: any) {
  if (raft.isLeader()) {
    const success = await raft.propose(command);
    if (success) {
      console.log('Command accepted');
    } else {
      console.log('Command rejected');
    }
  } else {
    // Forward to leader
    const leaderId = raft.getLeader();
    if (leaderId) {
      forwardToLeader(leaderId, command);
    }
  }
}
```

### Checking Leadership Status

```typescript
// Check if this node is the leader
if (raft.isLeader()) {
  console.log('I am the leader');
}

// Get the current leader's ID
const leaderId = raft.getLeader();
console.log('Current leader:', leaderId ?? 'none (election in progress)');
```

### Getting Consensus State

```typescript
const state = raft.getState();
console.log('Role:', state.role);         // 'follower' | 'candidate' | 'leader'
console.log('Term:', state.term);          // Current election term
console.log('Leader:', state.leader);      // Current leader ID
console.log('Commit Index:', state.commitIndex); // Last committed log index
```

### Subscribing to State Changes

```typescript
const unsubscribe = raft.onStateChange((state) => {
  console.log(`Role changed to ${state.role} in term ${state.term}`);

  if (state.role === 'leader') {
    console.log('This node is now the leader!');
    startAcceptingClientRequests();
  }
});

// Later: unsubscribe
unsubscribe();
```

### Handling Raft Messages

When receiving messages from other nodes, dispatch them to the appropriate handlers:

```typescript
function onMessageReceived(peerId: string, message: any) {
  switch (message.type) {
    case 'voteRequest':
      const voteResponse = raft.receiveVoteRequest(message);
      sendToPeer(peerId, { type: 'voteResponse', ...voteResponse });
      break;

    case 'voteResponse':
      // Handle vote response (maintain votesReceived set)
      raft.receiveVoteResponse(message, votesReceived);
      break;

    case 'appendEntries':
      const appendResponse = raft.receiveAppendEntries(message);
      sendToPeer(peerId, { type: 'appendEntriesResponse', ...appendResponse });
      break;

    case 'appendEntriesResponse':
      raft.receiveAppendEntriesResponse(peerId, message);
      break;
  }
}
```

### Full Example: Replicated Key-Value Store

```typescript
import { RaftConsensus } from '@philjs/edge-mesh';

// In-memory state machine
const store = new Map<string, any>();

const raft = new RaftConsensus(
  'node-1',
  (peerId, msg) => broadcast(peerId, msg),
  (command) => {
    // Apply command to state machine
    switch (command.type) {
      case 'SET':
        store.set(command.key, command.value);
        break;
      case 'DELETE':
        store.delete(command.key);
        break;
    }
  }
);

raft.addPeer('node-2');
raft.addPeer('node-3');
raft.start();

// Client API
async function set(key: string, value: any): Promise<boolean> {
  if (!raft.isLeader()) {
    throw new Error('Not the leader');
  }
  return raft.propose({ type: 'SET', key, value });
}

function get(key: string): any {
  return store.get(key);
}
```

---

## EdgeMesh

The `EdgeMesh` class is the high-level orchestrator that combines WebRTC peer-to-peer connections, gossip protocol, and Raft consensus into a unified mesh networking solution.

### Creating an Edge Mesh

```typescript
import { EdgeMesh, MeshConfig } from '@philjs/edge-mesh';

const config: MeshConfig = {
  nodeId: 'my-unique-node-id',       // Optional: auto-generated if not provided
  signalServer: 'wss://signal.example.com', // WebRTC signaling server
  heartbeatInterval: 5000,           // Health check interval (ms)
  suspectTimeout: 15000,             // Mark node suspect after this silence
  deadTimeout: 30000,                // Mark node dead after this silence
  maxPeers: 20,                      // Maximum concurrent connections
  enableRaft: true,                  // Enable Raft consensus
  enableGossip: true                 // Enable gossip protocol
};

const mesh = new EdgeMesh(config);
```

### Starting and Stopping the Mesh

```typescript
// Start mesh networking
await mesh.start();

// Stop and clean up all connections
mesh.stop();
```

### Connecting to Peers

The mesh uses WebRTC for peer-to-peer connections. You need a signaling mechanism to exchange connection offers/answers.

```typescript
// Initiate connection to a peer
await mesh.connectToPeer('peer-123');

// Handle incoming connection (with offer from signaling)
await mesh.connectToPeer('peer-456', incomingOffer);

// Handle answer from remote peer
await mesh.handleAnswer('peer-123', answerDescription);

// Handle ICE candidate
await mesh.handleIceCandidate('peer-123', iceCandidate);
```

### Signaling Events

Listen for signaling events to exchange connection information:

```typescript
// When we create an offer
mesh.on('offer', ({ peerId, offer }) => {
  signalingServer.send({ type: 'offer', to: peerId, offer });
});

// When we create an answer
mesh.on('answer', ({ peerId, answer }) => {
  signalingServer.send({ type: 'answer', to: peerId, answer });
});

// When we have an ICE candidate
mesh.on('iceCandidate', ({ peerId, candidate }) => {
  signalingServer.send({ type: 'ice', to: peerId, candidate });
});
```

### Broadcasting Messages

```typescript
// Broadcast to all connected peers
mesh.broadcast({ type: 'CHAT_MESSAGE', text: 'Hello everyone!' });

// Listen for incoming messages
mesh.on('message', ({ peerId, message }) => {
  console.log(`Message from ${peerId}:`, message);
});
```

### Gossip State (Eventually Consistent)

```typescript
// Set shared state (propagates via gossip)
mesh.set('room:users', ['alice', 'bob', 'charlie']);

// Get current value
const users = mesh.get<string[]>('room:users');

// Subscribe to changes
const unsubscribe = mesh.subscribe('room:users', (users) => {
  updateUserList(users);
});
```

### Raft Consensus (Strong Consistency)

```typescript
// Check if this node is the leader
if (mesh.isLeader()) {
  // Propose a command (only leader can do this)
  const success = await mesh.propose({
    type: 'TRANSFER',
    from: 'alice',
    to: 'bob',
    amount: 100
  });
}

// Get current leader
const leader = mesh.getLeader();

// Listen for applied commands
mesh.on('apply', (command) => {
  applyToStateMachine(command);
});
```

### Node Management

```typescript
// Get all known nodes
const nodes = mesh.getNodes();
nodes.forEach(node => {
  console.log(`${node.id}: ${node.state}, last seen ${node.lastSeen}`);
});

// Get connected peer IDs
const peers = mesh.getConnectedPeers();
console.log('Connected to:', peers);

// Get this node's ID
const myId = mesh.getNodeId();
```

### Mesh Events

```typescript
// Peer connected
mesh.on('peerConnected', (peerId) => {
  console.log('Peer joined:', peerId);
});

// Peer disconnected
mesh.on('peerDisconnected', (peerId) => {
  console.log('Peer left:', peerId);
});

// Node suspected (no heartbeat)
mesh.on('nodeSuspect', (nodeId) => {
  console.log('Node may be failing:', nodeId);
});

// Node declared dead
mesh.on('nodeDead', (nodeId) => {
  console.log('Node is dead:', nodeId);
});
```

### Full Example: Collaborative Editor

```typescript
import { EdgeMesh } from '@philjs/edge-mesh';

const mesh = new EdgeMesh({
  enableRaft: true,
  enableGossip: true
});

// Track document state
let document = { content: '', version: 0 };

// Apply committed operations
mesh.on('apply', (op) => {
  document = applyOperation(document, op);
  renderDocument(document);
});

await mesh.start();

// Join room via signaling server
signalingServer.on('peer', async ({ peerId, offer }) => {
  if (offer) {
    await mesh.connectToPeer(peerId, offer);
  } else {
    await mesh.connectToPeer(peerId);
  }
});

// Handle user edits
editor.on('change', async (operation) => {
  if (mesh.isLeader()) {
    await mesh.propose(operation);
  } else {
    // Forward to leader
    const leader = mesh.getLeader();
    if (leader) {
      mesh.broadcast({ type: 'FORWARD_OP', to: leader, operation });
    }
  }
});

// Share cursor position (eventually consistent is fine)
editor.on('cursorMove', (position) => {
  mesh.set(`cursor:${mesh.getNodeId()}`, position);
});

// Render other users' cursors
mesh.subscribe('cursor:*', (cursors) => {
  renderCursors(cursors);
});
```

---

## Hooks

The package provides React-style hooks for easy integration with PhilJS components.

### useEdgeMesh

The `useEdgeMesh` hook provides access to a shared mesh instance with reactive state.

```typescript
import { useEdgeMesh } from '@philjs/edge-mesh';

function CollaborativeComponent() {
  const {
    nodeId,      // This node's ID
    peers,       // Array of connected peer IDs
    nodes,       // Array of all known nodes
    isLeader,    // Whether this node is the Raft leader
    leader,      // Current leader's ID
    connect,     // Connect to a peer
    broadcast,   // Broadcast a message
    set,         // Set gossip state
    get,         // Get gossip state
    subscribe,   // Subscribe to state changes
    propose      // Propose Raft command
  } = useEdgeMesh({
    enableRaft: true,
    enableGossip: true
  });

  return (
    <div>
      <p>Node ID: {nodeId}</p>
      <p>Connected Peers: {peers.length}</p>
      <p>Is Leader: {isLeader ? 'Yes' : 'No'}</p>
      <p>Leader: {leader ?? 'Election in progress'}</p>

      <button onClick={() => connect('new-peer')}>
        Connect to Peer
      </button>

      <button onClick={() => broadcast({ type: 'PING' })}>
        Ping All Peers
      </button>
    </div>
  );
}
```

### useGossipState

The `useGossipState` hook provides a signal-like interface for gossip-synchronized state.

```typescript
import { useGossipState } from '@philjs/edge-mesh';

function SharedCounter() {
  const [count, setCount] = useGossipState<number>('shared:counter', 0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount((count ?? 0) + 1)}>
        Increment
      </button>
    </div>
  );
}
```

The state automatically synchronizes across all nodes in the mesh via the gossip protocol.

```typescript
function OnlineUsers() {
  const [users, setUsers] = useGossipState<string[]>('room:users', []);
  const { nodeId } = useEdgeMesh();

  // Add ourselves to the room
  onMount(() => {
    setUsers([...(users ?? []), nodeId]);

    // Remove on unmount
    return () => {
      setUsers((users ?? []).filter(id => id !== nodeId));
    };
  });

  return (
    <ul>
      {(users ?? []).map(user => (
        <li key={user}>{user}</li>
      ))}
    </ul>
  );
}
```

---

## Types Reference

### MeshNode

Represents a node in the mesh network.

```typescript
interface MeshNode {
  id: string;                                          // Unique node identifier
  address: string;                                     // Network address
  region?: string;                                     // Geographic region
  latency?: number;                                    // Latency in milliseconds
  state: 'connected' | 'disconnected' | 'suspect' | 'dead';
  lastSeen: number;                                    // Timestamp of last activity
  metadata?: Record<string, any>;                      // Custom metadata
}
```

### MeshConfig

Configuration options for EdgeMesh.

```typescript
interface MeshConfig {
  nodeId?: string;              // Node identifier (auto-generated if omitted)
  signalServer?: string;        // WebRTC signaling server URL
  heartbeatInterval?: number;   // Health check interval in ms (default: 5000)
  suspectTimeout?: number;      // Suspect timeout in ms (default: 15000)
  deadTimeout?: number;         // Dead timeout in ms (default: 30000)
  maxPeers?: number;            // Max peer connections (default: 20)
  enableRaft?: boolean;         // Enable Raft consensus (default: true)
  enableGossip?: boolean;       // Enable gossip protocol (default: true)
}
```

### ConsensusState

Internal state of the Raft consensus algorithm.

```typescript
interface ConsensusState {
  term: number;                 // Current election term
  votedFor: string | null;      // Candidate voted for in current term
  log: LogEntry[];              // Replicated log entries
  commitIndex: number;          // Index of highest committed entry
  lastApplied: number;          // Index of highest applied entry
}
```

### LogEntry

A single entry in the Raft log.

```typescript
interface LogEntry {
  term: number;                 // Term when entry was created
  index: number;                // Position in the log
  command: any;                 // The command to apply
  timestamp: number;            // When the entry was created
}
```

### GossipMessage

Message exchanged between nodes in the gossip protocol.

```typescript
interface GossipMessage {
  type: 'state' | 'membership' | 'custom';
  sender: string;               // Sending node's ID
  version: number;              // Message version for deduplication
  payload: any;                 // Message content
  timestamp: number;            // When message was created
}
```

### VoteRequest

Raft vote request (RequestVote RPC).

```typescript
interface VoteRequest {
  term: number;                 // Candidate's term
  candidateId: string;          // Candidate requesting vote
  lastLogIndex: number;         // Index of candidate's last log entry
  lastLogTerm: number;          // Term of candidate's last log entry
}
```

### VoteResponse

Raft vote response.

```typescript
interface VoteResponse {
  term: number;                 // Current term (for candidate to update)
  voteGranted: boolean;         // Whether vote was granted
}
```

### AppendEntriesRequest

Raft append entries request (heartbeat and log replication).

```typescript
interface AppendEntriesRequest {
  term: number;                 // Leader's term
  leaderId: string;             // Leader's ID
  prevLogIndex: number;         // Index preceding new entries
  prevLogTerm: number;          // Term of prevLogIndex entry
  entries: LogEntry[];          // Entries to append (empty for heartbeat)
  leaderCommit: number;         // Leader's commit index
}
```

### AppendEntriesResponse

Raft append entries response.

```typescript
interface AppendEntriesResponse {
  term: number;                 // Current term
  success: boolean;             // Whether entries were appended
  matchIndex?: number;          // Highest replicated index
}
```

### NodeRole

Possible roles for a Raft node.

```typescript
type NodeRole = 'follower' | 'candidate' | 'leader';
```

---

## API Reference

### VectorClock

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `constructor` | `initial?: Record<string, number>` | `VectorClock` | Create a new vector clock |
| `increment` | `nodeId: string` | `void` | Increment clock for a node |
| `get` | `nodeId: string` | `number` | Get clock value for a node |
| `merge` | `other: VectorClock` | `void` | Merge with another clock (component-wise max) |
| `compare` | `other: VectorClock` | `'before' \| 'after' \| 'concurrent'` | Compare causal ordering |
| `toJSON` | - | `Record<string, number>` | Export as plain object |
| `clone` | - | `VectorClock` | Create a copy |

### GossipProtocol

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `constructor` | `nodeId: string, onSend: Function, fanout?: number` | `GossipProtocol` | Create protocol instance |
| `start` | `intervalMs?: number` | `void` | Start periodic gossip |
| `stop` | - | `void` | Stop gossip |
| `set` | `key: string, value: any` | `void` | Set and gossip a value |
| `get` | `key: string` | `T \| undefined` | Get current value |
| `subscribe` | `key: string, callback: Function` | `() => void` | Subscribe to changes |
| `addPeer` | `peerId: string` | `void` | Add peer to gossip with |
| `removePeer` | `peerId: string` | `void` | Remove peer |
| `receiveMessage` | `message: GossipMessage` | `void` | Process incoming message |

### RaftConsensus

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `constructor` | `nodeId: string, onSend: Function, onApply: Function` | `RaftConsensus` | Create Raft instance |
| `start` | - | `void` | Start consensus protocol |
| `stop` | - | `void` | Stop protocol |
| `addPeer` | `peerId: string` | `void` | Add cluster member |
| `removePeer` | `peerId: string` | `void` | Remove cluster member |
| `propose` | `command: any` | `Promise<boolean>` | Propose command (leader only) |
| `isLeader` | - | `boolean` | Check if leader |
| `getLeader` | - | `string \| null` | Get current leader ID |
| `getState` | - | `object` | Get consensus state |
| `onStateChange` | `callback: Function` | `() => void` | Subscribe to state changes |
| `receiveVoteRequest` | `request: VoteRequest` | `VoteResponse` | Handle vote request |
| `receiveVoteResponse` | `response: VoteResponse, votes: Set` | `void` | Handle vote response |
| `receiveAppendEntries` | `request: AppendEntriesRequest` | `AppendEntriesResponse` | Handle append entries |
| `receiveAppendEntriesResponse` | `peerId: string, response: AppendEntriesResponse` | `void` | Handle append response |

### EdgeMesh

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `constructor` | `config?: MeshConfig` | `EdgeMesh` | Create mesh instance |
| `start` | - | `Promise<void>` | Start mesh networking |
| `stop` | - | `void` | Stop and cleanup |
| `connectToPeer` | `peerId: string, offer?: RTCSessionDescriptionInit` | `Promise<void>` | Connect to peer |
| `handleAnswer` | `peerId: string, answer: RTCSessionDescriptionInit` | `Promise<void>` | Handle connection answer |
| `handleIceCandidate` | `peerId: string, candidate: RTCIceCandidateInit` | `Promise<void>` | Handle ICE candidate |
| `broadcast` | `message: any` | `void` | Broadcast to all peers |
| `set` | `key: string, value: any` | `void` | Set gossip state |
| `get` | `key: string` | `T \| undefined` | Get gossip state |
| `subscribe` | `key: string, callback: Function` | `() => void` | Subscribe to state |
| `propose` | `command: any` | `Promise<boolean>` | Propose Raft command |
| `isLeader` | - | `boolean` | Check if Raft leader |
| `getLeader` | - | `string \| null` | Get leader ID |
| `getNodes` | - | `MeshNode[]` | Get all known nodes |
| `getConnectedPeers` | - | `string[]` | Get connected peer IDs |
| `getNodeId` | - | `string` | Get this node's ID |
| `on` | `event: string, callback: Function` | `() => void` | Listen to events |

### Hooks

| Hook | Parameters | Returns | Description |
|------|------------|---------|-------------|
| `useEdgeMesh` | `config?: MeshConfig` | `object` | Access shared mesh with reactive state |
| `useGossipState` | `key: string, initialValue?: T` | `[T \| undefined, (value: T) => void]` | Signal-like gossip state |

---

## Use Cases

### Multiplayer Games

Use gossip for game state (positions, scores) and Raft for authoritative events (game start, round end).

### Collaborative Editing

Use Raft to ensure consistent document state while gossip handles presence and cursors.

### Decentralized Chat

Mesh networking enables serverless chat rooms with automatic peer discovery.

### Edge Computing

Distribute computation across edge nodes with consensus on task assignment.

### IoT Coordination

Coordinate IoT device clusters with fault-tolerant leader election.

---

## Compatibility

- Node >= 24
- TypeScript 6
- Modern browsers with WebRTC support

## License

MIT
