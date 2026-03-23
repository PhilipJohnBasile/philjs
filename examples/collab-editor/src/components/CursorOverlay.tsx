import type { User, Cursor } from "../types";

interface CursorOverlayProps {
  cursors: Array<{ user: User; cursor: Cursor }>;
  content: string;
  editorPadding: string;
}

export function CursorOverlay(props: CursorOverlayProps) {
  if (props.cursors.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: "0",
        left: "0",
        right: "0",
        bottom: "0",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {props.cursors.map(({ user, cursor }) => {
        // Estimate cursor position based on character offset
        // This is a simplified approximation for the demo
        const lines = props.content.slice(0, cursor.position).split("\n");
        const lineNumber = lines.length - 1;
        const charOffset = lines[lines.length - 1].length;

        const top = lineNumber * 22.4 + 24; // line-height approx + padding
        const left = charOffset * 8.4 + 24; // char-width approx + padding

        return (
          <div key={user.id}>
            {/* Cursor line */}
            <div
              style={{
                position: "absolute",
                top: `${top}px`,
                left: `${left}px`,
                width: "2px",
                height: "18px",
                background: user.color,
                borderRadius: "1px",
              }}
            />
            {/* User label */}
            <div
              style={{
                position: "absolute",
                top: `${top - 18}px`,
                left: `${left}px`,
                background: user.color,
                color: "white",
                fontSize: "0.65rem",
                padding: "1px 4px",
                borderRadius: "3px",
                whiteSpace: "nowrap",
                fontWeight: "bold",
              }}
            >
              {user.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
