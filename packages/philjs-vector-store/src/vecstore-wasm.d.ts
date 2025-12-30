declare module 'vecstore-wasm' {
  const init: () => Promise<void>;
  export default init;
  export class WasmVecStore {
    constructor(dimensions: number);
  }
  export class VecStore {
    constructor(dimensions: number);
  }
  export function createStore(config: unknown): Promise<unknown>;
}
