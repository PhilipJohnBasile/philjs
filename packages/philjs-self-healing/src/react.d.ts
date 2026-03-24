declare module 'react' {
  namespace React {
    type ReactNode = any;
    interface ErrorInfo {
      componentStack: string;
    }
    class Component<P = {}, S = {}> {
      constructor(props: P);
      props: Readonly<P>;
      state: Readonly<S>;
      setState(state: Partial<S> | ((prevState: Readonly<S>) => Partial<S>)): void;
      forceUpdate(): void;
    }
    function createElement(type: any, props?: any, ...children: any[]): any;
  }
  export = React;
}
