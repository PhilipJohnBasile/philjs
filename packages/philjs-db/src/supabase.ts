/**
 * PhilJS Supabase Integration
 *
 * Supabase utilities for PhilJS applications.
 */

export interface SupabaseConfig {
  /** Supabase project URL */
  url: string;
  /** Supabase anonymous key */
  anonKey: string;
  /** Auth configuration */
  auth?: {
    persistSession?: boolean;
    autoRefreshToken?: boolean;
    detectSessionInUrl?: boolean;
  };
}

let supabaseClient: any = null;

/**
 * Create and configure Supabase client
 */
export async function createSupabaseClient(config: SupabaseConfig) {
  if (supabaseClient) return supabaseClient;

  const { createClient } = await import('@supabase/supabase-js');

  supabaseClient = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: config.auth?.persistSession ?? true,
      autoRefreshToken: config.auth?.autoRefreshToken ?? true,
      detectSessionInUrl: config.auth?.detectSessionInUrl ?? true,
    },
  });

  return supabaseClient;
}

/**
 * Get Supabase client instance
 */
export function useSupabase<T = any>(): T {
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized. Call createSupabaseClient() first.');
  }
  return supabaseClient;
}

/**
 * Higher-order function to inject Supabase client
 */
export function withSupabase<T extends (...args: any[]) => any>(
  fn: (supabase: any, ...args: Parameters<T>) => ReturnType<T>
) {
  return (...args: Parameters<T>): ReturnType<T> => {
    const supabase = useSupabase();
    return fn(supabase, ...args);
  };
}

/**
 * Supabase context provider
 */
export function SupabaseProvider(props: { children: any }) {
  return props.children;
}

/**
 * Hook for Supabase Auth
 */
export function useSupabaseAuth() {
  const supabase = useSupabase();

  return {
    /** Sign up with email and password */
    async signUp(email: string, password: string, metadata?: Record<string, unknown>) {
      return supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });
    },

    /** Sign in with email and password */
    async signIn(email: string, password: string) {
      return supabase.auth.signInWithPassword({ email, password });
    },

    /** Sign in with OAuth provider */
    async signInWithOAuth(provider: 'google' | 'github' | 'twitter' | 'facebook' | 'discord') {
      return supabase.auth.signInWithOAuth({ provider });
    },

    /** Sign in with magic link */
    async signInWithMagicLink(email: string) {
      return supabase.auth.signInWithOtp({ email });
    },

    /** Sign out */
    async signOut() {
      return supabase.auth.signOut();
    },

    /** Get current session */
    async getSession() {
      return supabase.auth.getSession();
    },

    /** Get current user */
    async getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },

    /** Subscribe to auth changes */
    onAuthStateChange(callback: (event: string, session: any) => void) {
      return supabase.auth.onAuthStateChange(callback);
    },

    /** Reset password */
    async resetPassword(email: string) {
      return supabase.auth.resetPasswordForEmail(email);
    },

    /** Update password */
    async updatePassword(newPassword: string) {
      return supabase.auth.updateUser({ password: newPassword });
    },

    /** Update user metadata */
    async updateUser(attributes: { email?: string; data?: Record<string, unknown> }) {
      return supabase.auth.updateUser(attributes);
    },
  };
}

/**
 * Hook for Supabase Storage
 */
export function useSupabaseStorage(bucket: string) {
  const supabase = useSupabase();
  const storage = supabase.storage.from(bucket);

  return {
    /** Upload a file */
    async upload(path: string, file: File | Blob, options?: { cacheControl?: string; upsert?: boolean }) {
      return storage.upload(path, file, options);
    },

    /** Download a file */
    async download(path: string) {
      return storage.download(path);
    },

    /** Get public URL */
    getPublicUrl(path: string) {
      return storage.getPublicUrl(path);
    },

    /** Create signed URL */
    async createSignedUrl(path: string, expiresIn: number) {
      return storage.createSignedUrl(path, expiresIn);
    },

    /** List files */
    async list(path?: string, options?: { limit?: number; offset?: number; sortBy?: { column: string; order: 'asc' | 'desc' } }) {
      return storage.list(path, options);
    },

    /** Remove files */
    async remove(paths: string[]) {
      return storage.remove(paths);
    },

    /** Move/rename a file */
    async move(fromPath: string, toPath: string) {
      return storage.move(fromPath, toPath);
    },

    /** Copy a file */
    async copy(fromPath: string, toPath: string) {
      return storage.copy(fromPath, toPath);
    },
  };
}

/**
 * Example usage with PhilJS
 */
export const exampleUsage = `
// src/lib/supabase.ts
import { createSupabaseClient } from '@philjs/db/supabase';

export const supabase = await createSupabaseClient({
  url: import.meta.env.PHILJS_PUBLIC_SUPABASE_URL,
  anonKey: import.meta.env.PHILJS_PUBLIC_SUPABASE_ANON_KEY,
});

// src/routes/api/users/+server.ts
import { defineAPIRoute, json } from '@philjs/api';
import { supabase } from '$lib/supabase';

export const GET = defineAPIRoute({
  handler: async () => {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name');

    if (error) {
      return json({ error: error.message }, { status: 500 });
    }

    return json(users);
  },
});

// src/components/AuthButton.tsx
import { useSupabaseAuth } from '@philjs/db/supabase';
import { signal } from '@philjs/core';

export function AuthButton() {
  const auth = useSupabaseAuth();
  const user = signal(null);

  auth.getUser().then(u => user.set(u));

  return (
    <div>
      {user.get() ? (
        <button onClick={() => auth.signOut()}>Sign Out</button>
      ) : (
        <button onClick={() => auth.signInWithOAuth('google')}>
          Sign In with Google
        </button>
      )}
    </div>
  );
}

// src/components/FileUpload.tsx
import { useSupabaseStorage } from '@philjs/db/supabase';

export function FileUpload() {
  const storage = useSupabaseStorage('avatars');

  const handleUpload = async (file: File) => {
    const { data, error } = await storage.upload(\`\${Date.now()}-\${file.name}\`, file);
    if (error) {
      console.error('Upload error:', error);
      return;
    }
    const url = storage.getPublicUrl(data.path);
  };

  return (
    <input
      type="file"
      onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
    />
  );
}
`;

/**
 * Realtime subscription helper
 */
export function useSupabaseRealtime(table: string, callback: (payload: any) => void) {
  const supabase = useSupabase();

  const channel = supabase
    .channel(`realtime:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
