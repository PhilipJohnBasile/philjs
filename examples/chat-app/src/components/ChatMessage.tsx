interface ChatMessageProps {
  message: {
    id: string;
    userName: string;
    text: string;
    timestamp: number;
  };
  color: string;
  isOwn: boolean;
}

export function ChatMessage(props: ChatMessageProps) {
  const time = new Date(props.message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: props.isOwn ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          maxWidth: "70%",
          padding: "0.75rem 1rem",
          borderRadius: props.isOwn
            ? "12px 12px 0 12px"
            : "12px 12px 12px 0",
          background: props.isOwn ? "#667eea" : "#f1f3f5",
          color: props.isOwn ? "white" : "#333",
        }}
      >
        {!props.isOwn && (
          <div
            style={{
              fontWeight: "bold",
              fontSize: "0.8rem",
              color: props.color,
              marginBottom: "0.25rem",
            }}
          >
            {props.message.userName}
          </div>
        )}
        <div style={{ fontSize: "0.9rem" }}>{props.message.text}</div>
      </div>
      <div
        style={{
          fontSize: "0.7rem",
          color: "#999",
          marginTop: "0.25rem",
          padding: "0 0.5rem",
        }}
      >
        {time}
      </div>
    </div>
  );
}
