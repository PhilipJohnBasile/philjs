declare module '@hapi/hapi' {
  export interface Server {
    route(options: any): void;
    register(plugin: any, options?: any): Promise<void>;
    start(): Promise<void>;
    stop(options?: any): Promise<void>;
    ext(event: string, method: any, options?: any): void;
    events: any;
    app: ApplicationState;
    auth: any;
    decorate(type: string, property: string, method: any): void;
    log(tags: string | string[], data?: any): void;
    method(name: string, method: any, options?: any): void;
    state(name: string, options?: any): void;
    info: { host: string; port: number; protocol: string; uri: string };
  }

  export interface Request {
    url: URL;
    path: string;
    query: Record<string, any>;
    params: Record<string, any>;
    payload: any;
    headers: Record<string, string>;
    state: Record<string, any>;
    auth: { isAuthenticated: boolean; credentials: AuthCredentials; artifacts: any };
    server: Server;
    info: { remoteAddress: string; remotePort: number; host: string };
    method: string;
    raw: { req: any; res: any };
    app: ApplicationState;
    route: { settings: RouteOptions };
  }

  export interface ResponseToolkit {
    response(value?: any): any;
    redirect(uri: string): any;
    continue: symbol;
    state(name: string, value: string, options?: any): void;
    unstate(name: string, options?: any): void;
  }

  export interface Plugin<T = any> {
    name: string;
    version?: string;
    register: (server: Server, options: T) => void | Promise<void>;
  }

  export interface ServerRoute {
    method: string | string[];
    path: string;
    handler: Lifecycle.Method;
    options?: RouteOptions;
  }

  export interface RouteOptions {
    auth?: any;
    validate?: any;
    cors?: any;
    tags?: string[];
    description?: string;
    notes?: string;
    pre?: any[];
    plugins?: Record<string, any>;
    payload?: any;
    cache?: any;
  }

  export namespace Lifecycle {
    type Method = (request: Request, h: ResponseToolkit) => any;
    type ReturnValue = any;
  }

  export interface ServerAuthScheme {
    (server: Server, options: any): { authenticate: (request: Request, h: ResponseToolkit) => any };
  }

  export interface AuthCredentials {
    [key: string]: any;
  }

  export interface ApplicationState {
    [key: string]: any;
  }

  export function server(options?: any): Server;
  export default function (options?: any): Server;
}
