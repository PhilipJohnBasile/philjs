# Common Patterns Cookbook

A collection of battle-tested patterns for building robust applications with PhilJS. Each pattern includes complete working examples, explanations, and production tips.

## Table of Contents

- [Data Fetching with Loading States](#data-fetching-with-loading-states)
- [Form Handling with Validation](#form-handling-with-validation)
- [Authentication Flow](#authentication-flow)
- [Pagination Patterns](#pagination-patterns)
- [Infinite Scroll](#infinite-scroll)
- [Debouncing and Throttling](#debouncing-and-throttling)
- [Local Storage Persistence](#local-storage-persistence)

---

## Data Fetching with Loading States

**Problem**: Fetch data from an API with proper loading, error, and success states.

**Solution**: Use signals to track state and async functions for data fetching.

```typescript
import { signal, memo } from 'philjs-core';

interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile({ userId }: { userId: number }) {
  const user = signal<User | null>(null);
  const loading = signal(false);
  const error = signal<string | null>(null);

  const fetchUser = async () => {
    loading.set(true);
    error.set(null);

    try {
      const response = await fetch(`/api/users/${userId}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      user.set(data);
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Failed to fetch user');
      user.set(null);
    } finally {
      loading.set(false);
    }
  };

  const buttonDisabled = memo(() => loading());
  const buttonText = memo(() => loading() ? 'Loading...' : 'Fetch User');

  return (
    <div>
      <button
        onClick={fetchUser}
        disabled={buttonDisabled()}
        style={{
          padding: '0.75rem 1.5rem',
          opacity: loading() ? 0.6 : 1,
          cursor: loading() ? 'not-allowed' : 'pointer',
        }}
      >
        {buttonText()}
      </button>

      {/* Loading State */}
      {loading() && (
        <div style={{ padding: '1rem', textAlign: 'center' }}>
          <div className="spinner" />
          <p>Loading user data...</p>
        </div>
      )}

      {/* Error State */}
      {error() && (
        <div
          role="alert"
          style={{
            padding: '1rem',
            background: '#fee',
            color: '#c33',
            borderRadius: '6px',
            marginTop: '1rem',
          }}
        >
          <strong>Error:</strong> {error()}
        </div>
      )}

      {/* Success State */}
      {user() && !loading() && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5' }}>
          <h3>{user()!.name}</h3>
          <p>Email: {user()!.email}</p>
          <p>ID: {user()!.id}</p>
        </div>
      )}

      {/* Empty State */}
      {!user() && !loading() && !error() && (
        <p style={{ color: '#666', marginTop: '1rem' }}>
          Click the button to load user data
        </p>
      )}
    </div>
  );
}
```

**Key Concepts**:
- Separate signals for data, loading, and error states
- Try-catch-finally for proper error handling
- Conditional rendering based on state
- Disabled button during loading

**Production Tips**:
- Add request cancellation with AbortController
- Implement retry logic with exponential backoff
- Use the built-in `resource` or `createQuery` for automatic caching
- Add request timeouts

```typescript
// Advanced: With abort controller and timeout
const fetchUser = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  loading.set(true);
  error.set(null);

  try {
    const response = await fetch(`/api/users/${userId}`, {
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    user.set(data);
  } catch (err) {
    if (err.name === 'AbortError') {
      error.set('Request timeout - please try again');
    } else {
      error.set(err instanceof Error ? err.message : 'Unknown error');
    }
  } finally {
    clearTimeout(timeoutId);
    loading.set(false);
  }
};
```

---

## Form Handling with Validation

**Problem**: Create forms with real-time validation and proper UX feedback.

**Solution**: Use signals for each field and memo for validation state.

```typescript
import { signal, memo } from 'philjs-core';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

function RegistrationForm() {
  // Form fields
  const email = signal('');
  const password = signal('');
  const confirmPassword = signal('');
  const agreeToTerms = signal(false);

  // Form state
  const submitting = signal(false);
  const submitted = signal(false);

  // Track touched fields
  const emailTouched = signal(false);
  const passwordTouched = signal(false);
  const confirmTouched = signal(false);

  // Validation rules
  const emailValid = memo(() => {
    const value = email();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  });

  const passwordValid = memo(() => {
    const value = password();
    return value.length >= 8 &&
           /[A-Z]/.test(value) &&
           /[a-z]/.test(value) &&
           /[0-9]/.test(value);
  });

  const passwordsMatch = memo(() => {
    return password() === confirmPassword() && confirmPassword().length > 0;
  });

  const formValid = memo(() => {
    return emailValid() &&
           passwordValid() &&
           passwordsMatch() &&
           agreeToTerms();
  });

  // Error messages
  const emailError = memo(() => {
    if (!emailTouched()) return '';
    if (!emailValid()) return 'Please enter a valid email address';
    return '';
  });

  const passwordError = memo(() => {
    if (!passwordTouched()) return '';
    if (password().length === 0) return 'Password is required';
    if (password().length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password())) return 'Password must contain an uppercase letter';
    if (!/[a-z]/.test(password())) return 'Password must contain a lowercase letter';
    if (!/[0-9]/.test(password())) return 'Password must contain a number';
    return '';
  });

  const confirmError = memo(() => {
    if (!confirmTouched()) return '';
    if (!passwordsMatch()) return 'Passwords do not match';
    return '';
  });

  // Handlers
  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    // Mark all fields as touched
    emailTouched.set(true);
    passwordTouched.set(true);
    confirmTouched.set(true);

    if (!formValid()) return;

    submitting.set(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email(),
          password: password(),
        }),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      submitted.set(true);

      // Reset form
      setTimeout(() => {
        email.set('');
        password.set('');
        confirmPassword.set('');
        agreeToTerms.set(false);
        emailTouched.set(false);
        passwordTouched.set(false);
        confirmTouched.set(false);
        submitted.set(false);
      }, 3000);

    } catch (err) {
      alert(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      submitting.set(false);
    }
  };

  const getInputStyle = (isValid: boolean, touched: boolean) => ({
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    borderRadius: '6px',
    border: `2px solid ${
      !touched ? '#e0e0e0' :
      isValid ? '#22c55e' :
      '#ef4444'
    }`,
    transition: 'border-color 0.2s',
  });

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2>Create Account</h2>

      {submitted() && (
        <div
          role="status"
          style={{
            padding: '1rem',
            background: '#dcfce7',
            color: '#166534',
            borderRadius: '6px',
            marginBottom: '1rem',
          }}
        >
          ✓ Account created successfully!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Email Field */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
            Email Address
          </label>
          <input
            type="email"
            value={email()}
            onInput={(e) => email.set((e.target as HTMLInputElement).value)}
            onBlur={() => emailTouched.set(true)}
            style={getInputStyle(emailValid(), emailTouched())}
            placeholder="you@example.com"
            aria-invalid={emailTouched() && !emailValid()}
            aria-describedby={emailError() ? 'email-error' : undefined}
          />
          {emailError() && (
            <p
              id="email-error"
              role="alert"
              style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}
            >
              {emailError()}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
            Password
          </label>
          <input
            type="password"
            value={password()}
            onInput={(e) => password.set((e.target as HTMLInputElement).value)}
            onBlur={() => passwordTouched.set(true)}
            style={getInputStyle(passwordValid(), passwordTouched())}
            placeholder="••••••••"
            aria-invalid={passwordTouched() && !passwordValid()}
            aria-describedby={passwordError() ? 'password-error' : undefined}
          />
          {passwordError() && (
            <p
              id="password-error"
              role="alert"
              style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}
            >
              {passwordError()}
            </p>
          )}
          <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
            Must be 8+ characters with uppercase, lowercase, and number
          </p>
        </div>

        {/* Confirm Password Field */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword()}
            onInput={(e) => confirmPassword.set((e.target as HTMLInputElement).value)}
            onBlur={() => confirmTouched.set(true)}
            style={getInputStyle(passwordsMatch(), confirmTouched())}
            placeholder="••••••••"
            aria-invalid={confirmTouched() && !passwordsMatch()}
            aria-describedby={confirmError() ? 'confirm-error' : undefined}
          />
          {confirmError() && (
            <p
              id="confirm-error"
              role="alert"
              style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}
            >
              {confirmError()}
            </p>
          )}
        </div>

        {/* Terms Checkbox */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={agreeToTerms()}
              onChange={(e) => agreeToTerms.set((e.target as HTMLInputElement).checked)}
            />
            <span style={{ fontSize: '0.875rem' }}>
              I agree to the Terms of Service and Privacy Policy
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!formValid() || submitting()}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            fontWeight: 600,
            background: formValid() && !submitting() ? '#667eea' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: formValid() && !submitting() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
        >
          {submitting() ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
```

**Key Concepts**:
- Separate signals for each form field
- Track touched state to avoid showing errors prematurely
- Use memo for computed validation states
- Proper ARIA attributes for accessibility

**Production Tips**:
- Use the built-in `useForm` hook for complex forms
- Add debounced validation for expensive checks (e.g., username availability)
- Implement field-level async validation
- Show inline success indicators
- Add password strength meter

---

## Authentication Flow

**Problem**: Implement user authentication with protected routes and session management.

**Solution**: Use signals for auth state and localStorage for persistence.

```typescript
import { signal, effect, createContext, useContext } from 'philjs-core';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

// Create auth context
const AuthContext = createContext<{
  user: () => User | null;
  isAuthenticated: () => boolean;
  isLoading: () => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
}>();

function AuthProvider({ children }: { children: any }) {
  const user = signal<User | null>(null);
  const token = signal<string | null>(null);
  const loading = signal(true);

  // Initialize auth state from localStorage
  effect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      token.set(storedToken);
      user.set(JSON.parse(storedUser));
    }

    loading.set(false);
  });

  // Persist token and user to localStorage
  effect(() => {
    const currentToken = token();
    const currentUser = user();

    if (currentToken && currentUser) {
      localStorage.setItem('auth_token', currentToken);
      localStorage.setItem('auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  });

  const login = async (email: string, password: string) => {
    loading.set(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      token.set(data.token);
      user.set(data.user);
    } catch (err) {
      token.set(null);
      user.set(null);
      throw err;
    } finally {
      loading.set(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    loading.set(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();
      token.set(data.token);
      user.set(data.user);
    } catch (err) {
      token.set(null);
      user.set(null);
      throw err;
    } finally {
      loading.set(false);
    }
  };

  const logout = () => {
    token.set(null);
    user.set(null);
  };

  const isAuthenticated = () => !!user() && !!token();
  const isLoading = () => loading();

  return (
    <AuthContext.Provider
      value={{
        user: () => user(),
        isAuthenticated,
        isLoading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Protected route component
function ProtectedRoute({
  children,
  fallback,
}: {
  children: any;
  fallback?: any;
}) {
  const auth = useAuth();

  if (auth.isLoading()) {
    return <div>Loading...</div>;
  }

  if (!auth.isAuthenticated()) {
    return fallback || <LoginPage />;
  }

  return children;
}

// Example login page
function LoginPage() {
  const auth = useAuth();
  const email = signal('');
  const password = signal('');
  const error = signal<string | null>(null);
  const submitting = signal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    error.set(null);
    submitting.set(true);

    try {
      await auth.login(email(), password());
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Login failed');
    } finally {
      submitting.set(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h1>Login</h1>

      {error() && (
        <div
          role="alert"
          style={{
            padding: '1rem',
            background: '#fee',
            color: '#c33',
            borderRadius: '6px',
            marginBottom: '1rem',
          }}
        >
          {error()}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
          <input
            type="email"
            value={email()}
            onInput={(e) => email.set((e.target as HTMLInputElement).value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
          <input
            type="password"
            value={password()}
            onInput={(e) => password.set((e.target as HTMLInputElement).value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        <button
          type="submit"
          disabled={submitting()}
          style={{ width: '100%', padding: '0.75rem' }}
        >
          {submitting() ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

// Example usage in app
function App() {
  return (
    <AuthProvider>
      <Router>
        <Route path="/login" component={LoginPage} />
        <Route path="/dashboard">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Route>
      </Router>
    </AuthProvider>
  );
}
```

**Key Concepts**:
- Context API for global auth state
- localStorage persistence with effects
- Protected route wrapper component
- Async login/logout handlers

**Production Tips**:
- Add token refresh logic
- Implement JWT expiration handling
- Add role-based access control
- Use secure cookie storage for tokens (httpOnly)
- Add remember me functionality
- Implement session timeout

---

## Pagination Patterns

**Problem**: Display large datasets with client-side or server-side pagination.

**Solution**: Track page state and calculate visible items.

```typescript
import { signal, memo } from 'philjs-core';

interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// Client-side pagination
function ClientPagination<T>({
  data,
  itemsPerPage = 10,
  renderItem,
}: {
  data: T[];
  itemsPerPage?: number;
  renderItem: (item: T, index: number) => any;
}) {
  const currentPage = signal(1);

  const totalPages = memo(() => Math.ceil(data.length / itemsPerPage));

  const visibleItems = memo(() => {
    const start = (currentPage() - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return data.slice(start, end);
  });

  const canGoPrev = memo(() => currentPage() > 1);
  const canGoNext = memo(() => currentPage() < totalPages());

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages()) {
      currentPage.set(page);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const pageNumbers = memo(() => {
    const pages: number[] = [];
    const total = totalPages();
    const current = currentPage();

    // Always show first page
    pages.push(1);

    // Calculate range around current page
    const rangeStart = Math.max(2, current - 2);
    const rangeEnd = Math.min(total - 1, current + 2);

    // Add ellipsis if needed
    if (rangeStart > 2) {
      pages.push(-1); // -1 represents ellipsis
    }

    // Add range
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    // Add ellipsis if needed
    if (rangeEnd < total - 1) {
      pages.push(-1);
    }

    // Always show last page if there's more than one page
    if (total > 1) {
      pages.push(total);
    }

    return pages;
  });

  return (
    <div>
      {/* Items */}
      <div>
        {visibleItems().map((item, index) => renderItem(item, index))}
      </div>

      {/* Pagination Controls */}
      {totalPages() > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '2rem',
          }}
        >
          {/* Previous Button */}
          <button
            onClick={() => goToPage(currentPage() - 1)}
            disabled={!canGoPrev()}
            style={{
              padding: '0.5rem 1rem',
              cursor: canGoPrev() ? 'pointer' : 'not-allowed',
              opacity: canGoPrev() ? 1 : 0.5,
            }}
            aria-label="Previous page"
          >
            ← Previous
          </button>

          {/* Page Numbers */}
          {pageNumbers().map((pageNum, idx) => {
            if (pageNum === -1) {
              return <span key={`ellipsis-${idx}`} style={{ padding: '0 0.5rem' }}>...</span>;
            }

            const isActive = pageNum === currentPage();

            return (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: isActive ? '#667eea' : 'white',
                  color: isActive ? 'white' : '#333',
                  border: `1px solid ${isActive ? '#667eea' : '#ddd'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 400,
                }}
                aria-label={`Page ${pageNum}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {pageNum}
              </button>
            );
          })}

          {/* Next Button */}
          <button
            onClick={() => goToPage(currentPage() + 1)}
            disabled={!canGoNext()}
            style={{
              padding: '0.5rem 1rem',
              cursor: canGoNext() ? 'pointer' : 'not-allowed',
              opacity: canGoNext() ? 1 : 0.5,
            }}
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      )}

      {/* Page Info */}
      <p style={{ textAlign: 'center', color: '#666', marginTop: '1rem' }}>
        Showing {((currentPage() - 1) * itemsPerPage) + 1} - {Math.min(currentPage() * itemsPerPage, data.length)} of {data.length} items
      </p>
    </div>
  );
}

// Server-side pagination
function ServerPagination() {
  const data = signal<any[]>([]);
  const currentPage = signal(1);
  const totalPages = signal(1);
  const totalItems = signal(0);
  const loading = signal(false);
  const perPage = 20;

  const fetchPage = async (page: number) => {
    loading.set(true);

    try {
      const response = await fetch(`/api/items?page=${page}&limit=${perPage}`);
      const result: PaginatedData<any> = await response.json();

      data.set(result.items);
      currentPage.set(result.page);
      totalPages.set(result.totalPages);
      totalItems.set(result.total);
    } catch (err) {
      console.error('Failed to fetch page:', err);
    } finally {
      loading.set(false);
    }
  };

  // Fetch initial page
  effect(() => {
    fetchPage(1);
  });

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages()) {
      fetchPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div>
      {loading() && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner" />
          <p>Loading...</p>
        </div>
      )}

      {!loading() && (
        <>
          <div>
            {data().map((item, index) => (
              <div key={item.id} style={{ padding: '1rem', border: '1px solid #ddd' }}>
                {item.title}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
            <button
              onClick={() => goToPage(currentPage() - 1)}
              disabled={currentPage() === 1}
            >
              Previous
            </button>

            <span style={{ padding: '0.5rem 1rem' }}>
              Page {currentPage()} of {totalPages()}
            </span>

            <button
              onClick={() => goToPage(currentPage() + 1)}
              disabled={currentPage() === totalPages()}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

**Key Concepts**:
- Client-side: Slice array based on current page
- Server-side: Fetch data for specific page
- Smart page number display with ellipsis
- Accessibility attributes (aria-label, aria-current)

**Production Tips**:
- Add URL sync for page state
- Implement keyboard navigation (arrow keys)
- Add "jump to page" input
- Show skeleton loaders during fetch
- Prefetch adjacent pages
- Add items-per-page selector

---

## Infinite Scroll

**Problem**: Load more content automatically as the user scrolls.

**Solution**: Use Intersection Observer to detect when to load more.

```typescript
import { signal, effect } from 'philjs-core';

interface InfiniteScrollProps<T> {
  fetchPage: (page: number) => Promise<T[]>;
  renderItem: (item: T, index: number) => any;
  pageSize?: number;
  threshold?: number;
}

function InfiniteScroll<T>({
  fetchPage,
  renderItem,
  pageSize = 20,
  threshold = 0.8,
}: InfiniteScrollProps<T>) {
  const items = signal<T[]>([]);
  const page = signal(1);
  const loading = signal(false);
  const hasMore = signal(true);
  const error = signal<string | null>(null);

  let sentinelRef: HTMLDivElement | null = null;

  const loadMore = async () => {
    if (loading() || !hasMore()) return;

    loading.set(true);
    error.set(null);

    try {
      const newItems = await fetchPage(page());

      if (newItems.length === 0) {
        hasMore.set(false);
      } else {
        items.set([...items(), ...newItems]);
        page.set(page() + 1);

        // If we got fewer items than requested, we're at the end
        if (newItems.length < pageSize) {
          hasMore.set(false);
        }
      }
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Failed to load more items');
    } finally {
      loading.set(false);
    }
  };

  // Load initial page
  effect(() => {
    loadMore();
  });

  // Set up intersection observer
  effect(() => {
    if (!sentinelRef || !hasMore()) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading()) {
          loadMore();
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before reaching sentinel
        threshold,
      }
    );

    observer.observe(sentinelRef);

    return () => {
      observer.disconnect();
    };
  });

  return (
    <div>
      {/* Items List */}
      <div>
        {items().map((item, index) => (
          <div key={index}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Loading State */}
      {loading() && (
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
          }}
        >
          <div
            style={{
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto',
            }}
          />
          <p style={{ marginTop: '1rem', color: '#666' }}>Loading more items...</p>
        </div>
      )}

      {/* Error State */}
      {error() && (
        <div
          role="alert"
          style={{
            padding: '1rem',
            background: '#fee',
            color: '#c33',
            borderRadius: '6px',
            margin: '1rem 0',
            textAlign: 'center',
          }}
        >
          <p>{error()}</p>
          <button
            onClick={loadMore}
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#c33',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Sentinel Element */}
      {hasMore() && !loading() && (
        <div
          ref={(el) => sentinelRef = el}
          style={{
            height: '20px',
            margin: '1rem 0',
          }}
          aria-hidden="true"
        />
      )}

      {/* End of List */}
      {!hasMore() && items().length > 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#666',
          }}
        >
          <p>You've reached the end!</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Loaded {items().length} items total
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading() && items().length === 0 && !error() && (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#999',
          }}
        >
          <p>No items found</p>
        </div>
      )}

      {/* Add spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Example usage
function ProductList() {
  const fetchProducts = async (page: number) => {
    const response = await fetch(`/api/products?page=${page}&limit=20`);
    const data = await response.json();
    return data.products;
  };

  return (
    <InfiniteScroll
      fetchPage={fetchProducts}
      renderItem={(product) => (
        <div style={{ padding: '1rem', border: '1px solid #ddd', marginBottom: '0.5rem' }}>
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <p>${product.price}</p>
        </div>
      )}
    />
  );
}
```

**Key Concepts**:
- Intersection Observer for scroll detection
- Sentinel element at the bottom to trigger loading
- Track hasMore state to stop fetching
- Automatic loading with manual retry option

**Production Tips**:
- Add virtualization for very long lists (use `react-window` or similar)
- Implement "Load More" button as fallback
- Add scroll restoration on navigation
- Debounce rapid scroll events
- Handle orientation changes on mobile
- Add pull-to-refresh on mobile

---

## Debouncing and Throttling

**Problem**: Control the rate of function execution for performance.

**Solution**: Use effects with cleanup for debouncing and throttling.

### Debouncing (Wait for User to Stop)

```typescript
import { signal, effect } from 'philjs-core';

function DebounceExample() {
  const searchTerm = signal('');
  const debouncedTerm = signal('');
  const results = signal<any[]>([]);
  const isSearching = signal(false);

  // Debounce the search term
  effect(() => {
    const term = searchTerm();

    // Don't search for very short terms
    if (term.length < 2) {
      debouncedTerm.set('');
      results.set([]);
      return;
    }

    isSearching.set(true);

    const timeout = setTimeout(() => {
      debouncedTerm.set(term);
    }, 500); // 500ms delay

    // Cleanup: Cancel the timeout if searchTerm changes again
    return () => {
      clearTimeout(timeout);
    };
  });

  // Perform search when debouncedTerm changes
  effect(() => {
    const term = debouncedTerm();

    if (!term) {
      isSearching.set(false);
      return;
    }

    const controller = new AbortController();

    fetch(`/api/search?q=${encodeURIComponent(term)}`, {
      signal: controller.signal,
    })
      .then(res => res.json())
      .then(data => {
        results.set(data);
        isSearching.set(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Search failed:', err);
          isSearching.set(false);
        }
      });

    return () => controller.abort();
  });

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <input
          type="search"
          value={searchTerm()}
          onInput={(e) => searchTerm.set((e.target as HTMLInputElement).value)}
          placeholder="Search... (min 2 characters)"
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            borderRadius: '8px',
            border: '2px solid #e0e0e0',
          }}
          aria-label="Search"
          aria-describedby="search-status"
        />

        {isSearching() && (
          <div
            style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <div className="spinner" />
          </div>
        )}
      </div>

      <div id="search-status" role="status" aria-live="polite" style={{ marginTop: '0.5rem' }}>
        {isSearching() && <p style={{ color: '#666', fontSize: '0.875rem' }}>Searching...</p>}
        {!isSearching() && debouncedTerm() && (
          <p style={{ color: '#666', fontSize: '0.875rem' }}>
            Found {results().length} results for "{debouncedTerm()}"
          </p>
        )}
      </div>

      <div style={{ marginTop: '1rem' }}>
        {results().map((result, i) => (
          <div
            key={result.id || i}
            style={{
              padding: '1rem',
              background: '#f9f9f9',
              borderRadius: '6px',
              marginBottom: '0.5rem',
            }}
          >
            <h4 style={{ margin: '0 0 0.5rem 0' }}>{result.title}</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
              {result.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Throttling (Execute at Most Once Per Interval)

```typescript
import { signal } from 'philjs-core';

function ThrottleExample() {
  const scrollPosition = signal(0);
  const lastUpdate = signal(0);
  const throttleDelay = 200; // Update at most every 200ms

  const handleScroll = () => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdate();

    if (timeSinceLastUpdate >= throttleDelay) {
      scrollPosition.set(window.scrollY);
      lastUpdate.set(now);
    }
  };

  // Set up scroll listener
  effect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  });

  const showScrollToTop = memo(() => scrollPosition() > 300);

  return (
    <div>
      {/* Scroll indicator */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: '#f0f0f0',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            height: '100%',
            background: '#667eea',
            width: `${Math.min((scrollPosition() / (document.body.scrollHeight - window.innerHeight)) * 100, 100)}%`,
            transition: 'width 0.2s',
          }}
        />
      </div>

      {/* Scroll to top button */}
      {showScrollToTop() && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            padding: '1rem',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
          }}
          aria-label="Scroll to top"
        >
          ↑
        </button>
      )}
    </div>
  );
}
```

### Reusable Debounce Hook

```typescript
function useDebounce<T>(value: () => T, delay: number): () => T {
  const debouncedValue = signal<T>(value());

  effect(() => {
    const currentValue = value();
    const timeout = setTimeout(() => {
      debouncedValue.set(currentValue);
    }, delay);

    return () => clearTimeout(timeout);
  });

  return debouncedValue;
}

// Usage
function MyComponent() {
  const searchInput = signal('');
  const debouncedSearch = useDebounce(searchInput, 500);

  // Use debouncedSearch() for API calls
}
```

**Key Concepts**:
- Debounce: Delay execution until activity stops
- Throttle: Limit execution rate
- Use effect cleanup to cancel pending operations
- AbortController for canceling fetch requests

**Production Tips**:
- Adjust delays based on use case (search: 300-500ms, scroll: 100-200ms)
- Add visual feedback during debounce period
- Consider leading vs trailing edge debounce
- Use requestAnimationFrame for smooth animations
- Add cancel button for long-running searches

---

## Local Storage Persistence

**Problem**: Save and restore application state across sessions.

**Solution**: Sync signals with localStorage using effects.

```typescript
import { signal, effect } from 'philjs-core';

// Generic localStorage hook
function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  } = {}
) {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
  } = options;

  // Initialize from localStorage
  const getStoredValue = (): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? deserialize(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  const storedValue = signal<T>(getStoredValue());

  // Sync to localStorage when value changes
  effect(() => {
    try {
      const value = storedValue();
      localStorage.setItem(key, serialize(value));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  });

  // Listen for changes in other tabs
  effect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          storedValue.set(deserialize(e.newValue));
        } catch (error) {
          console.warn(`Error parsing localStorage change for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  });

  const removeItem = () => {
    try {
      localStorage.removeItem(key);
      storedValue.set(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  };

  return {
    value: storedValue,
    setValue: (value: T) => storedValue.set(value),
    removeItem,
  };
}

// Example: User preferences
interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  fontSize: number;
  notifications: boolean;
}

function UserPreferencesComponent() {
  const { value: preferences, setValue: setPreferences } = useLocalStorage<UserPreferences>(
    'user-preferences',
    {
      theme: 'auto',
      language: 'en',
      fontSize: 16,
      notifications: true,
    }
  );

  const updateTheme = (theme: UserPreferences['theme']) => {
    setPreferences({
      ...preferences(),
      theme,
    });
  };

  const updateFontSize = (delta: number) => {
    const newSize = Math.max(12, Math.min(24, preferences().fontSize + delta));
    setPreferences({
      ...preferences(),
      fontSize: newSize,
    });
  };

  // Apply theme to document
  effect(() => {
    const prefs = preferences();
    document.documentElement.setAttribute('data-theme', prefs.theme);
    document.documentElement.style.fontSize = `${prefs.fontSize}px`;
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Preferences</h2>

      {/* Theme Selection */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Theme</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['light', 'dark', 'auto'] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => updateTheme(theme)}
              style={{
                padding: '0.5rem 1rem',
                background: preferences().theme === theme ? '#667eea' : 'white',
                color: preferences().theme === theme ? 'white' : '#333',
                border: '1px solid #667eea',
                borderRadius: '6px',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {theme}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Font Size: {preferences().fontSize}px</h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => updateFontSize(-1)}
            style={{ padding: '0.5rem 1rem' }}
          >
            A-
          </button>
          <div
            style={{
              flex: 1,
              height: '4px',
              background: '#e0e0e0',
              borderRadius: '2px',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                background: '#667eea',
                borderRadius: '2px',
                width: `${((preferences().fontSize - 12) / (24 - 12)) * 100}%`,
              }}
            />
          </div>
          <button
            onClick={() => updateFontSize(1)}
            style={{ padding: '0.5rem 1rem' }}
          >
            A+
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={preferences().notifications}
            onChange={(e) => setPreferences({
              ...preferences(),
              notifications: (e.target as HTMLInputElement).checked,
            })}
          />
          <span>Enable notifications</span>
        </label>
      </div>

      {/* Debug Info */}
      <details style={{ marginTop: '2rem' }}>
        <summary style={{ cursor: 'pointer', padding: '0.5rem' }}>
          Show stored data
        </summary>
        <pre style={{
          background: '#f5f5f5',
          padding: '1rem',
          borderRadius: '6px',
          overflow: 'auto',
          fontSize: '0.875rem',
        }}>
          {JSON.stringify(preferences(), null, 2)}
        </pre>
      </details>
    </div>
  );
}

// Example: Form draft autosave
function AutosaveForm() {
  const { value: draft, setValue: setDraft, removeItem } = useLocalStorage(
    'form-draft',
    {
      title: '',
      content: '',
      tags: [] as string[],
    }
  );

  const lastSaved = signal<Date | null>(null);

  // Autosave every 2 seconds after changes
  effect(() => {
    const currentDraft = draft();

    const timeout = setTimeout(() => {
      // Draft is automatically saved to localStorage via the hook
      lastSaved.set(new Date());
    }, 2000);

    return () => clearTimeout(timeout);
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    try {
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft()),
      });

      // Clear draft after successful submission
      removeItem();
      alert('Post published!');
    } catch (err) {
      alert('Failed to publish');
    }
  };

  const hasChanges = memo(() => {
    const d = draft();
    return d.title.length > 0 || d.content.length > 0 || d.tags.length > 0;
  });

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h2>Create Post</h2>

      {lastSaved() && (
        <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Draft saved at {lastSaved()!.toLocaleTimeString()}
        </p>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Title</label>
        <input
          type="text"
          value={draft().title}
          onInput={(e) => setDraft({
            ...draft(),
            title: (e.target as HTMLInputElement).value,
          })}
          style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
          placeholder="Enter title..."
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Content</label>
        <textarea
          value={draft().content}
          onInput={(e) => setDraft({
            ...draft(),
            content: (e.target as HTMLTextAreaElement).value,
          })}
          rows={10}
          style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
          placeholder="Write your post..."
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="submit"
          disabled={!hasChanges()}
          style={{
            padding: '0.75rem 1.5rem',
            background: hasChanges() ? '#667eea' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: hasChanges() ? 'pointer' : 'not-allowed',
          }}
        >
          Publish
        </button>

        <button
          type="button"
          onClick={removeItem}
          disabled={!hasChanges()}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '6px',
            cursor: hasChanges() ? 'pointer' : 'not-allowed',
          }}
        >
          Discard Draft
        </button>
      </div>
    </form>
  );
}
```

**Key Concepts**:
- Generic hook for type-safe localStorage access
- Automatic serialization/deserialization
- Cross-tab synchronization with storage events
- Error handling for quota exceeded scenarios

**Production Tips**:
- Add versioning for stored data (migrate old formats)
- Implement storage quota checking
- Add compression for large data
- Use IndexedDB for larger datasets
- Implement backup/restore functionality
- Add privacy mode detection (localStorage may be disabled)
- Consider encryption for sensitive data

```typescript
// Storage quota check
function checkStorageQuota() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    navigator.storage.estimate().then(estimate => {
      const percentUsed = (estimate.usage! / estimate.quota!) * 100;
      console.log(`Storage: ${percentUsed.toFixed(2)}% used`);

      if (percentUsed > 80) {
        console.warn('Storage quota nearly exceeded');
      }
    });
  }
}

// Data versioning
function useVersionedStorage<T>(
  key: string,
  version: number,
  initialValue: T,
  migrations: Record<number, (data: any) => T> = {}
) {
  const storageKey = `${key}_v${version}`;

  const getStoredValue = (): T => {
    // Try current version first
    const current = localStorage.getItem(storageKey);
    if (current) {
      return JSON.parse(current);
    }

    // Try to migrate from older versions
    for (let v = version - 1; v >= 1; v--) {
      const oldKey = `${key}_v${v}`;
      const oldData = localStorage.getItem(oldKey);

      if (oldData && migrations[v]) {
        const migrated = migrations[v](JSON.parse(oldData));
        localStorage.removeItem(oldKey); // Clean up old version
        return migrated;
      }
    }

    return initialValue;
  };

  // Rest of implementation...
}
```

---

## Additional Resources

- [PhilJS Core Concepts](../core-concepts/signals.md)
- [Data Fetching Guide](../data-fetching/overview.md)
- [Form Validation](../forms/validation.md)
- [Performance Best Practices](../best-practices/performance.md)

## Contributing

Found a useful pattern? Submit a PR to add it to this cookbook!
