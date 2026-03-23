import type { User } from "../types";

interface UserPresenceProps {
  users: User[];
  currentUserId: string;
}

export function UserPresence(props: UserPresenceProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      {props.users.map((user) => (
        <div
          key={user.id}
          title={user.name}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: user.color,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.7rem",
            fontWeight: "bold",
            border:
              user.id === props.currentUserId
                ? "2px solid #333"
                : "2px solid transparent",
            cursor: "default",
          }}
        >
          {user.avatar}
        </div>
      ))}
      <span
        style={{
          fontSize: "0.8rem",
          color: "#888",
          marginLeft: "0.25rem",
        }}
      >
        {props.users.length} online
      </span>
    </div>
  );
}
