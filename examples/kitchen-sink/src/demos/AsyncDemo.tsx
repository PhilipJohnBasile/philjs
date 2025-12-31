import { signal, memo, effect } from "@philjs/core";

interface User {
  id: number;
  name: string;
  email: string;
}

export function AsyncDemo() {
  return (
    <div data-test="async-demo">
      <h2 style="margin: 0 0 1.5rem 0; color: var(--primary);">Async & Data Fetching</h2>

      <FetchExample />
      <LoadingStatesExample />
      <ErrorHandlingExample />
      <DebounceExample />
    </div>
  );
}

function FetchExample() {
  const data = signal<any>(null);
  const loading = signal(false);

  const fetchData = async () => {
    loading.set(true);
    try {
      const res = await fetch("https://jsonplaceholder.typicode.com/users/1");
      const json = await res.json();
      data.set(json);
    } catch (err) {
      console.error(err);
    } finally {
      loading.set(false);
    }
  };

  return (
    <div class="card" data-test="fetch-example">
      <h3 style="margin: 0 0 1rem 0;">Fetch API Integration</h3>

      <button class="button" onClick={fetchData} disabled={loading()} data-test="fetch-button">
        {loading() ? "Loading..." : "Fetch User Data"}
      </button>

      {data() && (
        <div style="background: var(--bg-alt); padding: 1rem; border-radius: 6px; margin-top: 1rem;" data-test="fetch-data">
          <p style="margin: 0 0 0.5rem 0;"><strong>Name:</strong> {data().name}</p>
          <p style="margin: 0 0 0.5rem 0;"><strong>Email:</strong> {data().email}</p>
          <p style="margin: 0;"><strong>Company:</strong> {data().company?.name || "N/A"}</p>
        </div>
      )}
    </div>
  );
}

function LoadingStatesExample() {
  const users = signal<User[]>([]);
  const loading = signal(false);
  const error = signal<string | null>(null);

  const loadUsers = async () => {
    loading.set(true);
    error.set(null);
    try {
      const res = await fetch("https://jsonplaceholder.typicode.com/users");
      const json = await res.json();
      users.set(json.slice(0, 5));
    } catch (err) {
      error.set("Failed to load users");
    } finally {
      loading.set(false);
    }
  };

  return (
    <div class="card" data-test="loading-states">
      <h3 style="margin: 0 0 1rem 0;">Loading States</h3>

      <button class="button" onClick={loadUsers} disabled={loading()} data-test="load-users">
        Load Users
      </button>

      {loading() && (
        <div style="text-align: center; padding: 2rem;" data-test="loading-indicator">
          <div style="border: 4px solid var(--bg-alt); border-top: 4px solid var(--primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
          <p style="margin: 1rem 0 0 0; color: var(--text-secondary);">Loading...</p>
        </div>
      )}

      {error() && (
        <div style="background: var(--error); color: white; padding: 1rem; border-radius: 6px; margin-top: 1rem;" data-test="error-message">
          ✕ {error()}
        </div>
      )}

      {users().length > 0 && !loading() && (
        <div style="margin-top: 1rem;" data-test="users-list">
          {users().map(user => (
            <div
              key={user.id}
              style="background: var(--bg-alt); padding: 1rem; border-radius: 6px; margin-bottom: 0.5rem;"
              data-test={`user-${user.id}`}
            >
              <p style="margin: 0 0 0.25rem 0; font-weight: 600;">{user.name}</p>
              <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">{user.email}</p>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function ErrorHandlingExample() {
  const result = signal<string | null>(null);
  const error = signal<string | null>(null);
  const loading = signal(false);

  const simulateSuccess = async () => {
    loading.set(true);
    error.set(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      result.set("✓ Operation completed successfully!");
      error.set(null);
    } finally {
      loading.set(false);
    }
  };

  const simulateError = async () => {
    loading.set(true);
    result.set(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      throw new Error("Something went wrong!");
    } catch (err) {
      error.set(err instanceof Error ? err.message : "An error occurred");
    } finally {
      loading.set(false);
    }
  };

  return (
    <div class="card" data-test="error-handling">
      <h3 style="margin: 0 0 1rem 0;">Error Handling</h3>

      <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
        <button class="button" onClick={simulateSuccess} disabled={loading()} data-test="simulate-success">
          Simulate Success
        </button>
        <button class="button" onClick={simulateError} disabled={loading()} data-test="simulate-error">
          Simulate Error
        </button>
      </div>

      {loading() && (
        <div style="background: var(--warning); color: white; padding: 1rem; border-radius: 6px;" data-test="processing">
          ⏳ Processing...
        </div>
      )}

      {result() && (
        <div style="background: var(--success); color: white; padding: 1rem; border-radius: 6px;" data-test="success-result">
          {result()}
        </div>
      )}

      {error() && (
        <div style="background: var(--error); color: white; padding: 1rem; border-radius: 6px;" data-test="error-result">
          ✕ {error()}
        </div>
      )}
    </div>
  );
}

function DebounceExample() {
  const searchTerm = signal("");
  const debouncedSearch = signal("");
  const results = signal<string[]>([]);
  const isSearching = signal(false);

  // Debounce effect
  effect(() => {
    const term = searchTerm();
    if (term.length < 2) {
      debouncedSearch.set("");
      results.set([]);
      return;
    }

    isSearching.set(true);
    const timeout = setTimeout(() => {
      debouncedSearch.set(term);
      // Simulate search
      const mockResults = [
        `Result for "${term}" #1`,
        `Result for "${term}" #2`,
        `Result for "${term}" #3`,
      ];
      results.set(mockResults);
      isSearching.set(false);
    }, 500);

    return () => clearTimeout(timeout);
  });

  return (
    <div class="card" data-test="debounce">
      <h3 style="margin: 0 0 1rem 0;">Debounced Search</h3>

      <input
        class="input"
        value={searchTerm()}
        onInput={(e) => searchTerm.set((e.target as HTMLInputElement).value)}
        placeholder="Type to search (min 2 chars)..."
        data-test="search-input"
      />

      <p style="margin: 0.5rem 0; font-size: 0.9rem; color: var(--text-secondary);">
        Searching for: <strong data-test="search-term">{debouncedSearch() || "nothing"}</strong>
      </p>

      {isSearching() && (
        <p style="margin: 0.5rem 0; font-size: 0.9rem; color: var(--primary);" data-test="searching">
          Searching...
        </p>
      )}

      {results().length > 0 && (
        <div style="margin-top: 1rem;" data-test="search-results">
          {results().map((result, i) => (
            <div
              key={i}
              style="background: var(--bg-alt); padding: 0.75rem; border-radius: 6px; margin-bottom: 0.5rem;"
              data-test={`result-${i}`}
            >
              {result}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
