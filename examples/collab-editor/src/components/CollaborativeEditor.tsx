import { signal, computed, effect } from "@philjs/core";
import type { User, Cursor, TextOperation, Presence } from "../types";
import { UserPresence } from "./UserPresence";
import { RichTextToolbar } from "./RichTextToolbar";
import { CursorOverlay } from "./CursorOverlay";

interface EditorProps {
  currentUser: User;
  simulateCollaboration?: boolean;
}

export function CollaborativeEditor(props: EditorProps) {
  // Document state
  const content = signal<string>("Welcome to the PhilJS Collaborative Editor!\n\nStart typing to see real-time collaboration in action. This demo simulates multiple users editing the same document simultaneously.\n\nKey Features:\n- Real-time cursor tracking\n- Simulated remote user edits\n- User presence indicators\n- Rich text formatting\n- Conflict-free updates using signals\n\nTry selecting text and see other users' cursors move around!");
  const version = signal<number>(0);
  const operations = signal<TextOperation[]>([]);

  // Cursor and selection state
  const cursorPosition = signal<number>(0);
  const selection = signal<{ start: number; end: number } | null>(null);

  // Active users and their presence
  const activeUsers = signal<User[]>([
    props.currentUser,
    {
      id: "user-2",
      name: "Alice Chen",
      color: "#FF6B6B",
      avatar: "AC"
    },
    {
      id: "user-3",
      name: "Bob Wilson",
      color: "#4ECDC4",
      avatar: "BW"
    },
    {
      id: "user-4",
      name: "Carol Davis",
      color: "#95E1D3",
      avatar: "CD"
    }
  ]);

  const presences = signal<Map<string, Presence>>(new Map([
    [props.currentUser.id, {
      userId: props.currentUser.id,
      cursor: { userId: props.currentUser.id, position: 0 },
      lastActivity: Date.now()
    }]
  ]));

  // Text formatting state
  const currentFormat = signal({
    bold: false,
    italic: false,
    underline: false
  });

  // Computed: Get other users' cursors
  const otherCursors = computed(() => {
    const cursors: Array<{ user: User; cursor: Cursor }> = [];
    const presenceMap = presences();

    activeUsers().forEach(user => {
      if (user.id !== props.currentUser.id) {
        const presence = presenceMap.get(user.id);
        if (presence) {
          cursors.push({ user, cursor: presence.cursor });
        }
      }
    });

    return cursors;
  });

  // Simulate remote user activity
  if (props.simulateCollaboration) {
    let simulationInterval: number;

    effect(() => {
      simulationInterval = window.setInterval(() => {
        const users = activeUsers();
        const remoteUsers = users.filter(u => u.id !== props.currentUser.id);

        if (remoteUsers.length > 0 && Math.random() > 0.3) {
          // Randomly pick a remote user
          const user = remoteUsers[Math.floor(Math.random() * remoteUsers.length)];
          const currentContent = content();
          const contentLength = currentContent.length;

          // Random action: move cursor or type
          const action = Math.random();

          if (action > 0.7 && contentLength > 0) {
            // Type something
            const insertPos = Math.floor(Math.random() * contentLength);
            const texts = [" ", ".", ",", "\n", "a", "e", "i", "o", "u"];
            const textToInsert = texts[Math.floor(Math.random() * texts.length)];

            const newContent =
              currentContent.slice(0, insertPos) +
              textToInsert +
              currentContent.slice(insertPos);

            content.set(newContent);
            version.set(version() + 1);

            operations.set([...operations(), {
              type: 'insert',
              position: insertPos,
              content: textToInsert,
              timestamp: Date.now(),
              userId: user.id
            }]);

            // Update cursor position
            updatePresence(user.id, insertPos + textToInsert.length);
          } else {
            // Just move cursor
            const newPos = Math.floor(Math.random() * Math.max(1, contentLength));
            updatePresence(user.id, newPos);
          }
        }
      }, 2000 + Math.random() * 3000);

      return () => clearInterval(simulationInterval);
    });
  }

  function updatePresence(userId: string, position: number, sel?: { start: number; end: number }) {
    const newPresences = new Map(presences());
    newPresences.set(userId, {
      userId,
      cursor: { userId, position, selection: sel },
      lastActivity: Date.now()
    });
    presences.set(newPresences);
  }

  function handleInput(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;
    const newContent = textarea.value;
    const oldContent = content();

    // Determine what changed
    if (newContent.length > oldContent.length) {
      // Insertion
      const insertPos = textarea.selectionStart - (newContent.length - oldContent.length);
      const insertedText = newContent.slice(insertPos, textarea.selectionStart);

      operations.set([...operations(), {
        type: 'insert',
        position: insertPos,
        content: insertedText,
        timestamp: Date.now(),
        userId: props.currentUser.id
      }]);
    } else if (newContent.length < oldContent.length) {
      // Deletion
      const deletePos = textarea.selectionStart;

      operations.set([...operations(), {
        type: 'delete',
        position: deletePos,
        length: oldContent.length - newContent.length,
        timestamp: Date.now(),
        userId: props.currentUser.id
      }]);
    }

    content.set(newContent);
    version.set(version() + 1);
    cursorPosition.set(textarea.selectionStart);
    updatePresence(props.currentUser.id, textarea.selectionStart);
  }

  function handleSelectionChange(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;
    cursorPosition.set(textarea.selectionStart);

    if (textarea.selectionStart !== textarea.selectionEnd) {
      selection.set({
        start: textarea.selectionStart,
        end: textarea.selectionEnd
      });
      updatePresence(props.currentUser.id, textarea.selectionStart, {
        start: textarea.selectionStart,
        end: textarea.selectionEnd
      });
    } else {
      selection.set(null);
      updatePresence(props.currentUser.id, textarea.selectionStart);
    }
  }

  function applyFormat(format: 'bold' | 'italic' | 'underline') {
    currentFormat.set({
      ...currentFormat(),
      [format]: !currentFormat()[format]
    });
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      height: '100%'
    }}>
      {/* Header with user presence */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        background: '#f8f9fa',
        borderRadius: '8px',
        border: '2px solid #e9ecef'
      }}>
        <div>
          <h3 style={{ color: '#667eea', marginBottom: '0.25rem' }}>
            Collaborative Document
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#666' }}>
            Version {version()} • {content().length} characters
          </p>
        </div>
        <UserPresence users={activeUsers()} currentUserId={props.currentUser.id} />
      </div>

      {/* Rich text toolbar */}
      <RichTextToolbar
        format={currentFormat()}
        onFormat={applyFormat}
        hasSelection={selection() !== null}
      />

      {/* Editor area with cursor overlay */}
      <div style={{
        position: 'relative',
        flex: 1,
        minHeight: '400px',
        background: 'white',
        borderRadius: '8px',
        border: '2px solid #e9ecef',
        overflow: 'hidden'
      }}>
        <textarea
          value={content()}
          onInput={handleInput}
          onSelect={handleSelectionChange}
          onClick={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          style={{
            width: '100%',
            height: '100%',
            padding: '1.5rem',
            border: 'none',
            outline: 'none',
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: '1.6',
            resize: 'none',
            background: 'transparent',
            position: 'relative',
            zIndex: 1
          }}
          placeholder="Start typing..."
        />

        {/* Cursor overlay for remote users */}
        <CursorOverlay
          cursors={otherCursors()}
          content={content()}
          editorPadding="1.5rem"
        />
      </div>

      {/* Activity log */}
      <div style={{
        padding: '1rem',
        background: '#f8f9fa',
        borderRadius: '8px',
        border: '2px solid #e9ecef',
        maxHeight: '150px',
        overflowY: 'auto'
      }}>
        <h4 style={{ color: '#667eea', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
          Recent Activity
        </h4>
        <div style={{ fontSize: '0.75rem', color: '#666' }}>
          {operations().slice(-5).reverse().map((op, idx) => {
            const user = activeUsers().find(u => u.id === op.userId);
            return (
              <div key={idx} style={{ marginBottom: '0.25rem' }}>
                <span style={{ color: user?.color || '#666', fontWeight: 'bold' }}>
                  {user?.name || 'Unknown'}
                </span>
                {' '}
                {op.type === 'insert' && `inserted "${op.content}" at position ${op.position}`}
                {op.type === 'delete' && `deleted ${op.length} characters at position ${op.position}`}
                {op.type === 'format' && `applied formatting at position ${op.position}`}
              </div>
            );
          })}
          {operations().length === 0 && (
            <div style={{ fontStyle: 'italic' }}>No activity yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
