/**
 * PhilJS Todo App
 * Demonstrates signals, forms, and state management
 */

import { memo, signal } from "@philjs/core";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
  createdAt: number;
};

export function App() {
  const todos = signal<Todo[]>([]);
  const filter = signal<"all" | "active" | "completed">("all");
  const inputValue = signal("");

  // Add todo
  const addTodo = () => {
    const text = inputValue().trim();
    if (!text) return;

    const newTodo: Todo = {
      id: Date.now(),
      text,
      completed: false,
      createdAt: Date.now(),
    };

    todos.set([...todos(), newTodo]);
    inputValue.set("");
  };

  // Toggle todo
  const toggleTodo = (id: number) => {
    todos.set(
      todos().map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  // Delete todo
  const deleteTodo = (id: number) => {
    todos.set(todos().filter((todo) => todo.id !== id));
  };

  // Clear completed
  const clearCompleted = () => {
    todos.set(todos().filter((todo) => !todo.completed));
  };

  // Filtered todos
  const filteredTodos = memo(() => {
    const all = todos();
    const currentFilter = filter();

    if (currentFilter === "active") {
      return all.filter((t) => !t.completed);
    }
    if (currentFilter === "completed") {
      return all.filter((t) => t.completed);
    }
    return all;
  });

  const totalCount = memo(() => todos().length);
  const activeCount = memo(() => todos().filter((t) => !t.completed).length);
  const completedCount = memo(() => todos().filter((t) => t.completed).length);

  const allButtonStyle = memo(() => ({
    ...styles.filterButton,
    ...(filter() === "all" ? styles.filterButtonActive : {}),
  }));
  const activeButtonStyle = memo(() => ({
    ...styles.filterButton,
    ...(filter() === "active" ? styles.filterButtonActive : {}),
  }));
  const completedButtonStyle = memo(() => ({
    ...styles.filterButton,
    ...(filter() === "completed" ? styles.filterButtonActive : {}),
  }));

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>PhilJS Todo</h1>
        <p style={styles.subtitle}>
          Built with signals • Fine-grained reactivity
        </p>
      </header>

      <div style={styles.inputContainer}>
        <input
          type="text"
          value={inputValue}
          onInput={(e) => inputValue.set((e.target as HTMLInputElement).value)}
          onKeyPress={(e) => e.key === "Enter" && addTodo()}
          placeholder="What needs to be done?"
          style={styles.input}
        />
        <button onClick={addTodo} style={styles.addButton}>
          Add
        </button>
      </div>

      <div style={styles.filters}>
        <button
          onClick={() => filter.set("all")}
          style={allButtonStyle}
        >
          {() => `All (${totalCount()})`}
        </button>
        <button
          onClick={() => filter.set("active")}
          style={activeButtonStyle}
        >
          {() => `Active (${activeCount()})`}
        </button>
        <button
          onClick={() => filter.set("completed")}
          style={completedButtonStyle}
        >
          {() => `Completed (${completedCount()})`}
        </button>
      </div>

      <ul style={styles.todoList}>
        {() =>
          filteredTodos().map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={() => toggleTodo(todo.id)}
              onDelete={() => deleteTodo(todo.id)}
            />
          ))
        }

        {() => {
          if (filteredTodos().length > 0) return null;
          const currentFilter = filter();
          const message =
            currentFilter === "all"
              ? "No todos yet. Add one above!"
              : currentFilter === "active"
              ? "No active todos"
              : "No completed todos";
          return <li style={styles.emptyState}>{message}</li>;
        }}
      </ul>

      {() =>
        completedCount() > 0 ? (
          <button onClick={clearCompleted} style={styles.clearButton}>
            {`Clear completed (${completedCount()})`}
          </button>
        ) : null
      }

      <footer style={styles.footer}>
        <p style={styles.footerText}>
          ⚡ Powered by <strong>PhilJS</strong> - The framework that thinks ahead
        </p>
        <p style={styles.footerHint}>
          Try opening DevTools to see time-travel debugging!
        </p>
      </footer>
    </div>
  );
}

function TodoItem({
  todo,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <li style={styles.todoItem}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={onToggle}
        style={styles.checkbox}
      />
      <span
        style={{
          ...styles.todoText,
          ...(todo.completed ? styles.todoTextCompleted : {}),
        }}
      >
        {todo.text}
      </span>
      <button onClick={onDelete} style={styles.deleteButton}>
        ✕
      </button>
    </li>
  );
}

const styles: Record<string, Partial<CSSStyleDeclaration>> = {
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "2rem",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  title: {
    fontSize: "3rem",
    fontWeight: "100",
    color: "#af4bcc",
    margin: "0",
  },
  subtitle: {
    color: "#666",
    fontSize: "0.875rem",
    margin: "0.5rem 0 0",
  },
  inputContainer: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1.5rem",
  },
  input: {
    flex: 1,
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    border: "2px solid #e0e0e0",
    borderRadius: "8px",
    outline: "none",
  },
  addButton: {
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    backgroundColor: "#af4bcc",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
  },
  filters: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  filterButton: {
    flex: 1,
    padding: "0.5rem",
    fontSize: "0.875rem",
    backgroundColor: "white",
    border: "2px solid #e0e0e0",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  filterButtonActive: {
    backgroundColor: "#af4bcc",
    borderColor: "#af4bcc",
    color: "white",
  },
  todoList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  todoItem: {
    display: "flex",
    alignItems: "center",
    padding: "1rem",
    backgroundColor: "white",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    marginBottom: "0.5rem",
    gap: "0.75rem",
  },
  checkbox: {
    width: "20px",
    height: "20px",
    cursor: "pointer",
  },
  todoText: {
    flex: 1,
    fontSize: "1rem",
    color: "#333",
  },
  todoTextCompleted: {
    textDecoration: "line-through",
    color: "#999",
  },
  deleteButton: {
    padding: "0.25rem 0.5rem",
    fontSize: "1rem",
    backgroundColor: "transparent",
    border: "none",
    color: "#999",
    cursor: "pointer",
    borderRadius: "4px",
  },
  emptyState: {
    padding: "2rem",
    textAlign: "center",
    color: "#999",
    fontStyle: "italic",
  },
  clearButton: {
    width: "100%",
    padding: "0.75rem",
    marginTop: "1rem",
    fontSize: "0.875rem",
    backgroundColor: "white",
    border: "2px solid #ff6b6b",
    color: "#ff6b6b",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
  },
  footer: {
    marginTop: "3rem",
    padding: "1.5rem",
    textAlign: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
  },
  footerText: {
    margin: "0",
    fontSize: "0.875rem",
    color: "#666",
  },
  footerHint: {
    margin: "0.5rem 0 0",
    fontSize: "0.75rem",
    color: "#999",
  },
};
