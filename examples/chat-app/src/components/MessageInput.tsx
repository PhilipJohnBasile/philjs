import { signal } from "@philjs/core";

interface MessageInputProps {
  onSend: (text: string) => void;
}

export function MessageInput(props: MessageInputProps) {
  const text = signal("");

  function handleSubmit(e: Event) {
    e.preventDefault();
    const trimmed = text().trim();
    if (trimmed) {
      props.onSend(trimmed);
      text.set("");
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        gap: "0.5rem",
        padding: "1rem",
        borderTop: "2px solid #e9ecef",
      }}
    >
      <input
        type="text"
        value={text()}
        onInput={(e: Event) =>
          text.set((e.target as HTMLInputElement).value)
        }
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        style={{
          flex: 1,
          padding: "0.75rem 1rem",
          border: "2px solid #e9ecef",
          borderRadius: "8px",
          fontSize: "0.9rem",
          outline: "none",
        }}
      />
      <button
        type="submit"
        style={{
          padding: "0.75rem 1.5rem",
          background: "#667eea",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "0.9rem",
          fontWeight: "bold",
        }}
      >
        Send
      </button>
    </form>
  );
}
