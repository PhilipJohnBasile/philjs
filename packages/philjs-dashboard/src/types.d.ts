// Type declarations for optional dependencies

declare module 'source-map' {
  export interface RawSourceMap {
    version: number;
    sources: string[];
    names: string[];
    sourceRoot?: string;
    sourcesContent?: string[];
    mappings: string;
    file?: string;
  }

  export interface MappedPosition {
    source: string | null;
    line: number | null;
    column: number | null;
    name: string | null;
  }

  export interface Position {
    line: number;
    column: number;
  }

  export interface SourceMapConsumer {
    originalPositionFor(generatedPosition: Position): MappedPosition;
    generatedPositionFor(originalPosition: { source: string; line: number; column: number }): Position;
    eachMapping(callback: (mapping: any) => void): void;
    destroy(): void;
  }

  export const SourceMapConsumer: {
    new (rawSourceMap: RawSourceMap | string): Promise<SourceMapConsumer>;
    with<T>(rawSourceMap: RawSourceMap | string, mapUrl: string | null, callback: (consumer: SourceMapConsumer) => T): Promise<T>;
  };
}

declare module 'pako' {
  export function deflate(data: Uint8Array | string, options?: { level?: number }): Uint8Array;
  export function inflate(data: Uint8Array, options?: { to?: 'string' }): Uint8Array | string;
  export function gzip(data: Uint8Array | string, options?: { level?: number }): Uint8Array;
  export function ungzip(data: Uint8Array, options?: { to?: 'string' }): Uint8Array | string;
  const pako: {
    deflate: typeof deflate;
    inflate: typeof inflate;
    gzip: typeof gzip;
    ungzip: typeof ungzip;
  };
  export default pako;
}
