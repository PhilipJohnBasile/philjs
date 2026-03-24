interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly SSR: boolean;
}

interface ImportMetaHot {
  accept(): void;
  accept(cb: (mod: any) => void): void;
  accept(deps: string[], cb: (mods: any[]) => void): void;
  dispose(cb: (data: any) => void): void;
  invalidate(message?: string): void;
  on(event: string, cb: (payload: any) => void): void;
  send(event: string, data?: any): void;
  data: any;
}

interface ImportMeta {
  readonly hot?: ImportMetaHot;
  readonly env: ImportMetaEnv;
}

declare module 'rollup' {
  export interface Plugin {
    name: string;
    [key: string]: any;
  }
  export interface TransformResult {
    code: string;
    map?: any;
  }
}

declare module '@rollup/pluginutils' {
  export function createFilter(
    include?: string | RegExp | (string | RegExp)[],
    exclude?: string | RegExp | (string | RegExp)[]
  ): (id: string | unknown) => boolean;
}
