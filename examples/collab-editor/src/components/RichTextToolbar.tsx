interface RichTextToolbarProps {
  format: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
  };
  onFormat: (format: "bold" | "italic" | "underline") => void;
  hasSelection: boolean;
}

export function RichTextToolbar(props: RichTextToolbarProps) {
  const buttonStyle = (active: boolean) => ({
    padding: "0.4rem 0.75rem",
    border: "2px solid " + (active ? "#667eea" : "#dee2e6"),
    borderRadius: "6px",
    background: active ? "#667eea" : "white",
    color: active ? "white" : "#333",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "bold" as const,
  });

  return (
    <div
      style={{
        display: "flex",
        gap: "0.5rem",
        padding: "0.75rem 1rem",
        background: "white",
        borderRadius: "8px",
        border: "2px solid #e9ecef",
        alignItems: "center",
      }}
    >
      <button
        onClick={() => props.onFormat("bold")}
        style={buttonStyle(props.format.bold)}
        title="Bold"
      >
        B
      </button>
      <button
        onClick={() => props.onFormat("italic")}
        style={{
          ...buttonStyle(props.format.italic),
          fontStyle: "italic",
        }}
        title="Italic"
      >
        I
      </button>
      <button
        onClick={() => props.onFormat("underline")}
        style={{
          ...buttonStyle(props.format.underline),
          textDecoration: "underline",
        }}
        title="Underline"
      >
        U
      </button>
      {props.hasSelection && (
        <span
          style={{
            marginLeft: "0.5rem",
            fontSize: "0.75rem",
            color: "#888",
          }}
        >
          Text selected
        </span>
      )}
    </div>
  );
}
