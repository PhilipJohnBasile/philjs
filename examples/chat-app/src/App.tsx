import { signal, computed } from "@philjs/core";
import { ChatMessage } from "./components/ChatMessage";
import { MessageInput } from "./components/MessageInput";
import { UserList } from "./components/UserList";

interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

interface User {
  id: string;
  name: string;
  color: string;
  online: boolean;
}

const currentUser: User = {
  id: "user-1",
  name: "You",
  color: "#667eea",
  online: true,
};

const users = signal<User[]>([
  currentUser,
  { id: "user-2", name: "Alice", color: "#FF6B6B", online: true },
  { id: "user-3", name: "Bob", color: "#4ECDC4", online: true },
  { id: "user-4", name: "Carol", color: "#95E1D3", online: false },
]);

const messages = signal<Message[]>([
  {
    id: "msg-1",
    userId: "user-2",
    userName: "Alice",
    text: "Hey everyone! Welcome to the PhilJS Chat App!",
    timestamp: Date.now() - 60000,
  },
  {
    id: "msg-2",
    userId: "user-3",
    userName: "Bob",
    text: "This is built with PhilJS signals for reactive state management.",
    timestamp: Date.now() - 30000,
  },
]);

const onlineUsers = computed(() => users().filter((u) => u.online));

let nextId = 3;

function sendMessage(text: string) {
  const msg: Message = {
    id: `msg-${++nextId}`,
    userId: currentUser.id,
    userName: currentUser.name,
    text,
    timestamp: Date.now(),
  };
  messages.set([...messages(), msg]);
}

export function App() {
  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        height: "calc(100vh - 4rem)",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: "200px",
          background: "rgba(255,255,255,0.95)",
          borderRadius: "12px",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h3 style={{ color: "#667eea", marginBottom: "1rem" }}>Users</h3>
        <UserList users={users()} onlineUsers={onlineUsers()} />
      </div>

      {/* Main chat area */}
      <div
        style={{
          flex: 1,
          background: "rgba(255,255,255,0.95)",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "1rem",
            borderBottom: "2px solid #e9ecef",
          }}
        >
          <h2 style={{ color: "#667eea" }}>PhilJS Chat</h2>
          <p style={{ fontSize: "0.85rem", color: "#666" }}>
            {onlineUsers().length} user{onlineUsers().length !== 1 ? "s" : ""}{" "}
            online
          </p>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {messages().map((msg) => {
            const user = users().find((u) => u.id === msg.userId);
            return (
              <ChatMessage
                key={msg.id}
                message={msg}
                color={user?.color || "#666"}
                isOwn={msg.userId === currentUser.id}
              />
            );
          })}
        </div>

        <MessageInput onSend={sendMessage} />
      </div>
    </div>
  );
}
