import { CollaborativeEditor } from "./components/CollaborativeEditor";
import type { User } from "./types";

const currentUser: User = {
  id: "user-1",
  name: "You",
  color: "#667eea",
  avatar: "YO",
};

export function App() {
  return (
    <div>
      <h1
        style={{
          color: "white",
          textAlign: "center",
          marginBottom: "1.5rem",
          fontSize: "1.8rem",
          textShadow: "0 2px 4px rgba(0,0,0,0.2)",
        }}
      >
        PhilJS Collaborative Editor
      </h1>
      <CollaborativeEditor currentUser={currentUser} simulateCollaboration />
    </div>
  );
}
