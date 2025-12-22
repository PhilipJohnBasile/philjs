declare module 'jscodeshift' {
  const j: any;
  export default j;
  export type API = any;
  export type FileInfo = any;
  export type Options = any;
  export type Collection = any;
  export type ASTPath = any;
  export type Transform = (fileInfo: FileInfo, api: API, options: Options) => string | null | undefined;
  export type JSCodeshift = any;
}
