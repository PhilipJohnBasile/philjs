import { signal, memo } from "philjs-core";

interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

export function ListsDemo() {
  return (
    <div data-test="lists-demo">
      <h2 style="margin: 0 0 1.5rem 0; color: var(--primary);">Lists & Rendering</h2>

      <BasicListExample />
      <TodoListExample />
      <ConditionalRenderingExample />
      <FragmentsExample />
    </div>
  );
}

function BasicListExample() {
  const items = signal<string[]>(["Apple", "Banana", "Cherry"]);
  const newItem = signal("");

  const addItem = () => {
    if (newItem().trim()) {
      items.set([...items(), newItem()]);
      newItem.set("");
    }
  };

  const removeItem = (index: number) => {
    items.set(items().filter((_, i) => i !== index));
  };

  return (
    <div class="card" data-test="basic-list">
      <h3 style="margin: 0 0 1rem 0;">Basic List Rendering</h3>
      <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
        <input
          class="input"
          value={newItem()}
          onInput={(e) => newItem.set((e.target as HTMLInputElement).value)}
          onKeyPress={(e) => e.key === "Enter" && addItem()}
          placeholder="Add item..."
          data-test="basic-list-input"
        />
        <button class="button" onClick={addItem} data-test="basic-list-add">
          Add
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.5rem;" data-test="basic-list-items">
        {items().length === 0 ? (
          <p style="margin: 0; color: var(--text-secondary); text-align: center; padding: 2rem;">
            No items yet. Add one above!
          </p>
        ) : (
          items().map((item, index) => (
            <div
              key={index}
              style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--bg-alt); border-radius: 6px;"
              data-test={`basic-list-item-${index}`}
            >
              <span>{item}</span>
              <button
                onClick={() => removeItem(index)}
                style="background: var(--error); color: white; border: none; padding: 0.5rem 0.75rem; border-radius: 4px; cursor: pointer;"
                data-test={`basic-list-remove-${index}`}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TodoListExample() {
  const todos = signal<TodoItem[]>([
    { id: 1, text: "Learn PhilJS", completed: false },
    { id: 2, text: "Build an app", completed: false },
    { id: 3, text: "Ship to production", completed: false },
  ]);
  const newTodo = signal("");
  const filter = signal<"all" | "active" | "completed">("all");

  const filteredTodos = memo(() => {
    const f = filter();
    if (f === "active") return todos().filter(t => !t.completed);
    if (f === "completed") return todos().filter(t => t.completed);
    return todos();
  });

  const activeCount = memo(() => todos().filter(t => !t.completed).length);
  const completedCount = memo(() => todos().filter(t => t.completed).length);

  const addTodo = () => {
    if (newTodo().trim()) {
      todos.set([...todos(), {
        id: Date.now(),
        text: newTodo(),
        completed: false,
      }]);
      newTodo.set("");
    }
  };

  const toggleTodo = (id: number) => {
    todos.set(todos().map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: number) => {
    todos.set(todos().filter(t => t.id !== id));
  };

  const clearCompleted = () => {
    todos.set(todos().filter(t => !t.completed));
  };

  return (
    <div class="card" data-test="todo-list">
      <h3 style="margin: 0 0 1rem 0;">Todo List with Filtering</h3>

      <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
        <input
          class="input"
          value={newTodo()}
          onInput={(e) => newTodo.set((e.target as HTMLInputElement).value)}
          onKeyPress={(e) => e.key === "Enter" && addTodo()}
          placeholder="What needs to be done?"
          data-test="todo-input"
        />
        <button class="button" onClick={addTodo} data-test="todo-add">
          Add
        </button>
      </div>

      <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
        <button
          onClick={() => filter.set("all")}
          class="button"
          data-test="filter-all"
        >
          All {filter() === "all" ? "✓" : ""}
        </button>
        <button
          onClick={() => filter.set("active")}
          class="button"
          data-test="filter-active"
        >
          Active {filter() === "active" ? "✓" : ""}
        </button>
        <button
          onClick={() => filter.set("completed")}
          class="button"
          data-test="filter-completed"
        >
          Completed {filter() === "completed" ? "✓" : ""}
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem;" data-test="todo-items">
        {filteredTodos().map(todo => (
          <div
            key={todo.id}
            style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: var(--bg-alt); border-radius: 6px;"
            data-test={`todo-item-${todo.id}`}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
              data-test={`todo-checkbox-${todo.id}`}
            />
            <span style={todo.completed ? { textDecoration: "line-through", opacity: "0.6", flex: "1" } : { flex: "1" }}>
              {todo.text}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              style="background: var(--error); color: white; border: none; padding: 0.5rem 0.75rem; border-radius: 4px; cursor: pointer; font-size: 0.875rem;"
              data-test={`todo-delete-${todo.id}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--bg-alt); border-radius: 6px;">
        <span style="font-size: 0.9rem;" data-test="todo-stats">
          <strong data-test="active-count">{activeCount()}</strong> active, <strong data-test="completed-count">{completedCount()}</strong> completed
        </span>
        {completedCount() > 0 && (
          <button
            onClick={clearCompleted}
            style="background: var(--error); color: white; border: none; padding: 0.5rem 0.75rem; border-radius: 4px; cursor: pointer; font-size: 0.875rem;"
            data-test="clear-completed"
          >
            Clear Completed
          </button>
        )}
      </div>
    </div>
  );
}

function ConditionalRenderingExample() {
  const showContent = signal(true);
  const userRole = signal<"guest" | "user" | "admin">("guest");

  return (
    <div class="card" data-test="conditional">
      <h3 style="margin: 0 0 1rem 0;">Conditional Rendering</h3>

      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <label style="display: flex; align-items: center; gap: 0.5rem;">
            <input
              type="checkbox"
              checked={showContent()}
              onChange={(e) => showContent.set((e.target as HTMLInputElement).checked)}
              data-test="show-content"
            />
            <span>Show Content</span>
          </label>
        </div>

        {showContent() ? (
          <div style="background: var(--success); color: white; padding: 1rem; border-radius: 6px;" data-test="content-visible">
            ✓ Content is visible!
          </div>
        ) : (
          <div style="background: var(--error); color: white; padding: 1rem; border-radius: 6px;" data-test="content-hidden">
            ✕ Content is hidden
          </div>
        )}

        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">User Role:</label>
          <div style="display: flex; gap: 0.5rem;">
            {(["guest", "user", "admin"] as const).map(role => (
              <button
                key={role}
                onClick={() => userRole.set(role)}
                style={userRole() === role ? {
                  background: "var(--primary)",
                  color: "white",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "4px",
                  cursor: "pointer",
                } : {
                  background: "var(--bg-alt)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  padding: "0.5rem 1rem",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
                data-test={`role-${role}`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style="background: var(--bg-alt); padding: 1rem; border-radius: 6px;" data-test="role-content">
          {userRole() === "guest" && <p style="margin: 0;">👋 Welcome, guest! Please sign in.</p>}
          {userRole() === "user" && <p style="margin: 0;">✓ You have user access.</p>}
          {userRole() === "admin" && <p style="margin: 0;">⚡ You have admin privileges!</p>}
        </div>
      </div>
    </div>
  );
}

function FragmentsExample() {
  const showList = signal(true);

  return (
    <div class="card" data-test="fragments">
      <h3 style="margin: 0 0 1rem 0;">Fragments & Multiple Elements</h3>

      <button class="button" onClick={() => showList.set(!showList())} data-test="toggle-fragments">
        {showList() ? "Hide" : "Show"} List
      </button>

      {showList() && (
        <>
          <h4 style="margin: 1rem 0 0.5rem 0;">Fragment Example</h4>
          <p style="margin: 0 0 0.5rem 0;">These elements are wrapped in a fragment.</p>
          <ul style="margin: 0; padding-left: 1.5rem;">
            <li>Item 1</li>
            <li>Item 2</li>
            <li>Item 3</li>
          </ul>
        </>
      )}
    </div>
  );
}
