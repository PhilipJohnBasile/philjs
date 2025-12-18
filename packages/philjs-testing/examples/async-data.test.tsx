/**
 * Example: Testing Async Data Loading
 *
 * This example demonstrates testing components that fetch
 * data asynchronously, including loading and error states.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from 'philjs-testing';
import { signal } from 'philjs-core';

// Async data loader component
function UserList() {
  const users = signal<any[]>([]);
  const loading = signal(true);
  const error = signal<string | null>(null);

  // Fetch users on mount
  (async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      users.set(data);
    } catch (err) {
      error.set((err as Error).message);
    } finally {
      loading.set(false);
    }
  })();

  if (loading()) {
    return <div role="progressbar">Loading users...</div>;
  }

  if (error()) {
    return <div role="alert">Error: {error()}</div>;
  }

  return (
    <ul>
      {users().map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

describe('UserList', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    vi.resetAllMocks();
  });

  it('shows loading state initially', () => {
    render(() => <UserList />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Loading users...')).toBeInTheDocument();
  });

  it('displays users after successful fetch', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
            { id: 3, name: 'Charlie' },
          ]),
      } as Response)
    );

    render(() => <UserList />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check that users are displayed
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('displays error on fetch failure', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      } as Response)
    );

    render(() => <UserList />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText(/Error:/)).toBeInTheDocument();
  });

  it('handles network errors', async () => {
    global.fetch = vi.fn(() =>
      Promise.reject(new Error('Network error'))
    );

    render(() => <UserList />);

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('displays empty state for no users', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
    );

    render(() => <UserList />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    const list = screen.getByRole('list');
    expect(list.children).toHaveLength(0);
  });
});
