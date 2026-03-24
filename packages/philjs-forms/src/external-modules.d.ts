declare module 'joi' {
  export interface Schema<T = any> {
    validate(value: any, options?: any): { value: T; error?: { details: Array<{ path: string[]; message: string }> } };
  }
  export interface ValidationResult<T = any> {
    value: T;
    error?: { details: Array<{ path: string[]; message: string }> };
  }
}

declare module 'valibot' {
  export type BaseSchema = any;
  export type Output<T> = T extends BaseSchema ? any : never;
  export interface ValiError {
    issues: Array<{ path?: Array<{ key: string }>; message: string }>;
  }
  export function safeParse(schema: any, data: any): { success: boolean; output?: any; issues?: Array<{ path?: Array<{ key: string }>; message: string }> };
}
