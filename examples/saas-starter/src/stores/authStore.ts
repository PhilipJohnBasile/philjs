import { signal, computed } from "@philjs/core";

export type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: "free" | "pro" | "enterprise";
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

const authState = signal<AuthState>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
});

// Computed values
export const user = computed(() => authState().user);
export const isAuthenticated = computed(() => authState().isAuthenticated);
export const isLoading = computed(() => authState().isLoading);

// Mock authentication functions
export async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  authState.set({ ...authState(), isLoading: true });

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (email && password.length >= 6) {
    const mockUser: User = {
      id: "user-123",
      email,
      name: email.split("@")[0],
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split("@")[0])}&background=667eea&color=fff`,
      plan: "pro",
    };

    authState.set({ user: mockUser, isAuthenticated: true, isLoading: false });
    localStorage.setItem("philjs_auth_user", JSON.stringify(mockUser));
    return { success: true };
  }

  authState.set({ ...authState(), isLoading: false });
  return { success: false, error: "Invalid credentials" };
}

export async function register(email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> {
  authState.set({ ...authState(), isLoading: true });

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (email && password.length >= 6 && name) {
    const mockUser: User = {
      id: "user-" + Date.now(),
      email,
      name,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=667eea&color=fff`,
      plan: "free",
    };

    authState.set({ user: mockUser, isAuthenticated: true, isLoading: false });
    localStorage.setItem("philjs_auth_user", JSON.stringify(mockUser));
    return { success: true };
  }

  authState.set({ ...authState(), isLoading: false });
  return { success: false, error: "Invalid input" };
}

export async function logout(): Promise<void> {
  authState.set({ user: null, isAuthenticated: false, isLoading: false });
  localStorage.removeItem("philjs_auth_user");
}

export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (email) {
    return { success: true };
  }

  return { success: false, error: "Invalid email" };
}

// Initialize auth state from localStorage
export function initAuth(): void {
  const savedUser = localStorage.getItem("philjs_auth_user");
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      authState.set({ user, isAuthenticated: true, isLoading: false });
    } catch (e) {
      localStorage.removeItem("philjs_auth_user");
    }
  }
}
