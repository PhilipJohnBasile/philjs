/**
 * Authentication PhilJS Plugin Template
 * Template for creating authentication plugins
 */

import type { Plugin, PluginContext } from "philjs-core/plugin-system";

/**
 * Authentication provider
 */
export type AuthProvider =
  | "credentials"
  | "google"
  | "github"
  | "facebook"
  | "twitter"
  | "apple"
  | "oauth2"
  | "jwt";

/**
 * User type
 */
export interface User {
  id: string;
  email?: string;
  name?: string;
  image?: string;
  role?: string;
  metadata?: Record<string, any>;
}

/**
 * Session type
 */
export interface Session {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

/**
 * Authentication configuration
 */
export interface {{PLUGIN_NAME}}Config {
  /** Enable the plugin */
  enabled?: boolean;
  /** Authentication providers */
  providers: AuthProvider[];
  /** Session configuration */
  session?: {
    /** Session strategy */
    strategy?: "jwt" | "cookie";
    /** Session max age in seconds */
    maxAge?: number;
    /** Update age threshold */
    updateAge?: number;
    /** Secure cookies */
    secure?: boolean;
    /** Cookie name */
    cookieName?: string;
  };
  /** JWT configuration */
  jwt?: {
    /** Secret key */
    secret: string;
    /** Algorithm */
    algorithm?: "HS256" | "HS384" | "HS512" | "RS256" | "RS384" | "RS512";
    /** Token expiration in seconds */
    expiresIn?: number;
  };
  /** OAuth configuration */
  oauth?: {
    /** Google OAuth */
    google?: {
      clientId: string;
      clientSecret: string;
    };
    /** GitHub OAuth */
    github?: {
      clientId: string;
      clientSecret: string;
    };
    /** Facebook OAuth */
    facebook?: {
      clientId: string;
      clientSecret: string;
    };
  };
  /** Callback URLs */
  callbacks?: {
    signIn?: string;
    signOut?: string;
    error?: string;
  };
  /** Protected routes */
  protectedRoutes?: string[];
  /** Public routes (bypass auth) */
  publicRoutes?: string[];
}

/**
 * Authentication state
 */
interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Default auth state
 */
const defaultState: AuthState = {
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
};

// Global auth state
let authState: AuthState = { ...defaultState };
const listeners = new Set<(state: AuthState) => void>();

/**
 * Notify listeners of state changes
 */
function notifyListeners(): void {
  listeners.forEach((listener) => listener({ ...authState }));
}

/**
 * Get current auth state
 */
export function getAuthState(): AuthState {
  return { ...authState };
}

/**
 * Subscribe to auth state changes
 */
export function subscribeToAuth(listener: (state: AuthState) => void): () => void {
  listeners.add(listener);
  listener({ ...authState }); // Initial call
  return () => listeners.delete(listener);
}

/**
 * Sign in with credentials
 */
export async function signIn(
  provider: AuthProvider,
  credentials?: { email: string; password: string }
): Promise<Session | null> {
  authState = { ...authState, isLoading: true };
  notifyListeners();

  try {
    // In production, this would make actual auth requests
    // This is a mock implementation for the template

    if (provider === "credentials" && credentials) {
      // Validate credentials
      const mockUser: User = {
        id: "user-1",
        email: credentials.email,
        name: "Test User",
        role: "user",
      };

      const mockSession: Session = {
        user: mockUser,
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        expiresAt: Date.now() + 3600 * 1000,
      };

      authState = {
        user: mockUser,
        session: mockSession,
        isLoading: false,
        isAuthenticated: true,
      };

      notifyListeners();
      return mockSession;
    }

    if (["google", "github", "facebook", "twitter", "apple"].includes(provider)) {
      // OAuth flow would redirect to provider
      window.location.href = `/api/auth/${provider}`;
      return null;
    }

    throw new Error(`Unknown provider: ${provider}`);
  } catch (error) {
    authState = { ...defaultState, isLoading: false };
    notifyListeners();
    throw error;
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  authState = { ...authState, isLoading: true };
  notifyListeners();

  try {
    // Clear session
    // In production, this would also invalidate server-side session
    authState = { ...defaultState, isLoading: false };
    notifyListeners();
  } catch (error) {
    authState = { ...defaultState, isLoading: false };
    notifyListeners();
    throw error;
  }
}

/**
 * Get current session
 */
export async function getSession(): Promise<Session | null> {
  return authState.session;
}

/**
 * Get current user
 */
export function getUser(): User | null {
  return authState.user;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return authState.isAuthenticated;
}

/**
 * Check if session is expired
 */
export function isSessionExpired(): boolean {
  if (!authState.session) return true;
  return Date.now() > authState.session.expiresAt;
}

/**
 * Refresh session
 */
export async function refreshSession(): Promise<Session | null> {
  if (!authState.session?.refreshToken) {
    return null;
  }

  try {
    // In production, this would make a refresh token request
    const newSession: Session = {
      ...authState.session,
      accessToken: "new-access-token",
      expiresAt: Date.now() + 3600 * 1000,
    };

    authState = {
      ...authState,
      session: newSession,
    };

    notifyListeners();
    return newSession;
  } catch {
    await signOut();
    return null;
  }
}

/**
 * Protected route guard
 */
export function requireAuth(
  redirectTo = "/login"
): () => void {
  return () => {
    if (!isAuthenticated() && typeof window !== "undefined") {
      window.location.href = redirectTo;
    }
  };
}

/**
 * Create {{PLUGIN_NAME}} plugin
 */
export function create{{PLUGIN_NAME}}Plugin(
  pluginConfig: {{PLUGIN_NAME}}Config
): Plugin {
  return {
    meta: {
      name: "{{PACKAGE_NAME}}",
      version: "1.0.0",
      description: "{{DESCRIPTION}}",
      author: "{{AUTHOR}}",
      license: "{{LICENSE}}",
      philjs: "^2.0.0",
    },

    configSchema: {
      type: "object",
      required: ["providers"],
      properties: {
        providers: {
          type: "array",
          items: {
            type: "string",
            enum: ["credentials", "google", "github", "facebook", "twitter", "apple", "oauth2", "jwt"],
          },
          description: "Authentication providers",
        },
        session: {
          type: "object",
          properties: {
            strategy: {
              type: "string",
              enum: ["jwt", "cookie"],
              default: "jwt",
            },
            maxAge: {
              type: "number",
              default: 3600,
            },
          },
        },
        protectedRoutes: {
          type: "array",
          items: { type: "string" },
          description: "Routes that require authentication",
        },
      },
    },

    async setup(config: {{PLUGIN_NAME}}Config, ctx: PluginContext) {
      ctx.logger.info("Setting up {{PLUGIN_NAME}}...");

      if (!config.enabled) {
        ctx.logger.warn("Plugin is disabled");
        return;
      }

      // Generate auth utilities file
      const authCode = `
/**
 * Authentication utilities
 * Auto-generated by {{PACKAGE_NAME}}
 */

export {
  signIn,
  signOut,
  getSession,
  getUser,
  isAuthenticated,
  getAuthState,
  subscribeToAuth,
  requireAuth,
  refreshSession,
} from '{{PACKAGE_NAME}}';

export type { User, Session } from '{{PACKAGE_NAME}}';
`;

      try {
        await ctx.fs.mkdir("src/lib", { recursive: true });
        await ctx.fs.writeFile("src/lib/auth.ts", authCode);
        ctx.logger.success("Created auth utilities file");
      } catch (error) {
        ctx.logger.warn("Could not create auth utilities file");
      }

      // Generate protected layout component
      const layoutCode = `
/**
 * Protected layout component
 * Auto-generated by {{PACKAGE_NAME}}
 */

import { requireAuth, getUser, isAuthenticated } from './auth';

export function ProtectedLayout({ children }: { children: any }) {
  requireAuth('/login')();

  if (!isAuthenticated()) {
    return null; // Or loading spinner
  }

  const user = getUser();

  return (
    <div>
      <header>
        <span>Welcome, {user?.name || user?.email}</span>
      </header>
      <main>{children}</main>
    </div>
  );
}
`;

      try {
        await ctx.fs.writeFile("src/lib/ProtectedLayout.tsx", layoutCode);
        ctx.logger.success("Created protected layout component");
      } catch (error) {
        ctx.logger.warn("Could not create protected layout component");
      }

      ctx.logger.success("{{PLUGIN_NAME}} setup complete!");
      ctx.logger.info(`Providers: ${config.providers.join(", ")}`);
      ctx.logger.info(`Protected routes: ${config.protectedRoutes?.join(", ") || "none"}`);
    },

    hooks: {
      async init(ctx) {
        ctx.logger.info("{{PLUGIN_NAME}} initialized");

        // Try to restore session from storage
        if (typeof window !== "undefined") {
          try {
            const stored = localStorage.getItem("auth_session");
            if (stored) {
              const session = JSON.parse(stored);
              if (session.expiresAt > Date.now()) {
                authState = {
                  user: session.user,
                  session,
                  isLoading: false,
                  isAuthenticated: true,
                };
                notifyListeners();
              }
            }
          } catch {
            // Ignore storage errors
          }
        }

        authState = { ...authState, isLoading: false };
        notifyListeners();
      },

      async buildStart(ctx, buildConfig) {
        ctx.logger.debug("Build starting...");
      },

      async buildEnd(ctx, result) {
        if (result.success) {
          ctx.logger.success("Build completed successfully");
        }
      },
    },
  };
}

export default create{{PLUGIN_NAME}}Plugin;
