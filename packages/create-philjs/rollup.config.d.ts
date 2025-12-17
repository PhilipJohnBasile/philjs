declare namespace _default {
    let input: string;
    namespace output {
        let file: string;
        let format: string;
        let sourcemap: boolean;
        let banner: string;
    }
    let plugins: import("rollup").Plugin<any>[];
    let external: (string | RegExp)[];
}
export default _default;
//# sourceMappingURL=rollup.config.d.ts.map