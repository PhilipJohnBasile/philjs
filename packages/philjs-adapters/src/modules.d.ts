/**
 * Type declarations for external modules
 */

declare module '@philjs/ssr' {
  export function handleRequest(request: any, options?: any): Promise<Response>;
  export function renderToString(component: any, options?: any): Promise<string>;
}
