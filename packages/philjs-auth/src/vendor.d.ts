// Type declarations for optional auth provider dependencies

declare module '@auth0/auth0-spa-js' {
  export class Auth0Client {
    constructor(options: any);
    isAuthenticated(): Promise<boolean>;
    handleRedirectCallback(): Promise<any>;
    getUser(): Promise<any>;
    getIdTokenClaims(): Promise<any>;
    getTokenSilently(): Promise<string>;
    loginWithRedirect(options?: any): Promise<void>;
    loginWithPopup(options?: any): Promise<void>;
    logout(options?: any): Promise<void>;
  }
}

declare module '@clerk/clerk-js' {
  export class Clerk {
    constructor(publishableKey: string);
    load(): Promise<void>;
    addListener(callback: (state: any) => void): void;
    user: any;
    session: any;
    signIn: any;
    signUp: any;
    signOut(options?: any): Promise<void>;
  }
}

declare module 'next-auth/react' {
  export function signIn(provider?: string, options?: any): Promise<any>;
  export function signOut(options?: any): Promise<any>;
  export function useSession(): { data: any; status: string };
  export function getSession(): Promise<any>;
}

declare module '@supabase/supabase-js' {
  export function createClient(url: string, key: string, options?: any): SupabaseClient;

  export interface SupabaseClient {
    auth: {
      signInWithPassword(credentials: { email: string; password: string }): Promise<{ data: { user: any; session: any }; error: any }>;
      signUp(credentials: { email: string; password: string }): Promise<{ data: { user: any; session: any }; error: any }>;
      signInWithOAuth(options: { provider: string }): Promise<{ data: any; error: any }>;
      signOut(): Promise<{ error: any }>;
      getSession(): Promise<{ data: { session: any }; error: any }>;
      getUser(): Promise<{ data: { user: any }; error: any }>;
      refreshSession(): Promise<{ data: { session: any }; error: any }>;
      onAuthStateChange(callback: (event: string, session: any) => void): { data: { subscription: { unsubscribe: () => void } } };
    };
  }
}
