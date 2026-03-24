declare module 'koa' {
  import type { IncomingMessage, ServerResponse } from 'http';

  export interface DefaultState {
    [key: string]: any;
  }

  export interface DefaultContext {
    [key: string]: any;
  }

  export interface Context {
    request: any;
    response: any;
    state: DefaultState;
    body: any;
    status: number;
    params: Record<string, string>;
    query: Record<string, string>;
    path: string;
    url: string;
    method: string;
    headers: Record<string, string>;
    cookies: any;
    type: string;
    set(field: string, value: string): void;
    get(field: string): string;
    throw(status: number, msg?: string): void;
    redirect(url: string): void;
    req: IncomingMessage;
    res: ServerResponse;
    app: any;
    ip: string;
  }

  export type Next = () => Promise<void>;
  export type Middleware = (ctx: Context, next: Next) => any;
  export type ParameterizedContext<TState = DefaultState, TContext = DefaultContext> = Context & { state: TState };

  export default class Koa {
    use(middleware: Middleware): this;
    listen(port: number, callback?: () => void): any;
    callback(): any;
    context: DefaultContext;
  }
}
