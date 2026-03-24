declare module '@supabase/supabase-js' {
  export function createClient(url: string, key: string, options?: any): any;
  export type SupabaseClient = any;
  export type Session = any;
  export type User = any;
  export type AuthChangeEvent = string;
}
