interface User {
  id: string;
  name: string;
  color: string;
  online: boolean;
}

interface UserListProps {
  users: User[];
  onlineUsers: User[];
}

export function UserList(props: UserListProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {props.users.map((user) => (
        <div
          key={user.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem",
            borderRadius: "8px",
            background: user.online ? "#f8f9fa" : "transparent",
            opacity: user.online ? 1 : 0.5,
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: user.online ? "#51cf66" : "#adb5bd",
            }}
          />
          <span
            style={{
              fontSize: "0.85rem",
              color: user.color,
              fontWeight: "bold",
            }}
          >
            {user.name}
          </span>
        </div>
      ))}
    </div>
  );
}
