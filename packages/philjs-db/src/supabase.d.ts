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
/**
 * Create and configure Supabase client
 */
export declare function createSupabaseClient(config: SupabaseConfig): Promise<any>;
/**
 * Get Supabase client instance
 */
export declare function useSupabase<T = any>(): T;
/**
 * Higher-order function to inject Supabase client
 */
export declare function withSupabase<T extends (...args: any[]) => any>(fn: (supabase: any, ...args: Parameters<T>) => ReturnType<T>): (...args: Parameters<T>) => ReturnType<T>;
/**
 * Supabase context provider
 */
export declare function SupabaseProvider(props: {
    children: any;
}): any;
/**
 * Hook for Supabase Auth
 */
export declare function useSupabaseAuth(): {
    /** Sign up with email and password */
    signUp(email: string, password: string, metadata?: Record<string, unknown>): Promise<any>;
    /** Sign in with email and password */
    signIn(email: string, password: string): Promise<any>;
    /** Sign in with OAuth provider */
    signInWithOAuth(provider: "google" | "github" | "twitter" | "facebook" | "discord"): Promise<any>;
    /** Sign in with magic link */
    signInWithMagicLink(email: string): Promise<any>;
    /** Sign out */
    signOut(): Promise<any>;
    /** Get current session */
    getSession(): Promise<any>;
    /** Get current user */
    getUser(): Promise<any>;
    /** Subscribe to auth changes */
    onAuthStateChange(callback: (event: string, session: any) => void): any;
    /** Reset password */
    resetPassword(email: string): Promise<any>;
    /** Update password */
    updatePassword(newPassword: string): Promise<any>;
    /** Update user metadata */
    updateUser(attributes: {
        email?: string;
        data?: Record<string, unknown>;
    }): Promise<any>;
};
/**
 * Hook for Supabase Storage
 */
export declare function useSupabaseStorage(bucket: string): {
    /** Upload a file */
    upload(path: string, file: File | Blob, options?: {
        cacheControl?: string;
        upsert?: boolean;
    }): Promise<any>;
    /** Download a file */
    download(path: string): Promise<any>;
    /** Get public URL */
    getPublicUrl(path: string): any;
    /** Create signed URL */
    createSignedUrl(path: string, expiresIn: number): Promise<any>;
    /** List files */
    list(path?: string, options?: {
        limit?: number;
        offset?: number;
        sortBy?: {
            column: string;
            order: "asc" | "desc";
        };
    }): Promise<any>;
    /** Remove files */
    remove(paths: string[]): Promise<any>;
    /** Move/rename a file */
    move(fromPath: string, toPath: string): Promise<any>;
    /** Copy a file */
    copy(fromPath: string, toPath: string): Promise<any>;
};
/**
 * Example usage with PhilJS
 */
export declare const exampleUsage = "\n// src/lib/supabase.ts\nimport { createSupabaseClient } from '@philjs/db/supabase';\n\nexport const supabase = await createSupabaseClient({\n  url: import.meta.env.PHILJS_PUBLIC_SUPABASE_URL,\n  anonKey: import.meta.env.PHILJS_PUBLIC_SUPABASE_ANON_KEY,\n});\n\n// src/routes/api/users/+server.ts\nimport { defineAPIRoute, json } from '@philjs/api';\nimport { supabase } from '$lib/supabase';\n\nexport const GET = defineAPIRoute({\n  handler: async () => {\n    const { data: users, error } = await supabase\n      .from('users')\n      .select('id, email, name');\n\n    if (error) {\n      return json({ error: error.message }, { status: 500 });\n    }\n\n    return json(users);\n  },\n});\n\n// src/components/AuthButton.tsx\nimport { useSupabaseAuth } from '@philjs/db/supabase';\nimport { signal } from '@philjs/core';\n\nexport function AuthButton() {\n  const auth = useSupabaseAuth();\n  const user = signal(null);\n\n  auth.getUser().then(u => user.set(u));\n\n  return (\n    <div>\n      {user.get() ? (\n        <button onClick={() => auth.signOut()}>Sign Out</button>\n      ) : (\n        <button onClick={() => auth.signInWithOAuth('google')}>\n          Sign In with Google\n        </button>\n      )}\n    </div>\n  );\n}\n\n// src/components/FileUpload.tsx\nimport { useSupabaseStorage } from '@philjs/db/supabase';\n\nexport function FileUpload() {\n  const storage = useSupabaseStorage('avatars');\n\n  const handleUpload = async (file: File) => {\n    const { data, error } = await storage.upload(`${Date.now()}-${file.name}`, file);\n    if (error) {\n      console.error('Upload error:', error);\n      return;\n    }\n    const url = storage.getPublicUrl(data.path);\n    console.log('Uploaded:', url);\n  };\n\n  return (\n    <input\n      type=\"file\"\n      onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}\n    />\n  );\n}\n";
/**
 * Realtime subscription helper
 */
export declare function useSupabaseRealtime(table: string, callback: (payload: any) => void): () => void;
//# sourceMappingURL=supabase.d.ts.map