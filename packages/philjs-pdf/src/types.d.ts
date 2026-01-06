// Type declarations for optional dependencies

declare namespace React {
  type ReactNode = any;
  type ReactElement = any;
  type FC<P = {}> = (props: P) => ReactElement | null;
  type ComponentType<P = {}> = FC<P> | (new (props: P) => any);
}

declare module '@react-pdf/renderer' {
  export const Document: React.FC<any>;
  export const Page: React.FC<any>;
  export const View: React.FC<any>;
  export const Text: React.FC<any>;
  export const Image: React.FC<any>;
  export const Link: React.FC<any>;
  export const Font: {
    register: (config: any) => void;
  };
  export const StyleSheet: {
    create: <T extends Record<string, any>>(styles: T) => T;
  };
  export const pdf: (element: React.ReactElement) => {
    toBlob: () => Promise<Blob>;
    toBuffer: () => Promise<Buffer>;
    toString: () => Promise<string>;
  };
  export const renderToStream: (element: React.ReactElement) => NodeJS.ReadableStream;
  export const renderToBuffer: (element: React.ReactElement) => Promise<Buffer>;
  export const renderToString: (element: React.ReactElement) => Promise<string>;
}
