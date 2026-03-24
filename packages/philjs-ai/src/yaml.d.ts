declare module 'yaml' {
  export function parse(input: string): any;
  export function stringify(value: any): string;
}
