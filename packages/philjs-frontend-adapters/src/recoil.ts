
// Stub for Recoil atomFamily
export function atomFamily(options: { key: string, default: any }) {
    const atoms = new Map();
    return (param: string) => {
        if (!atoms.has(param)) {
            atoms.set(param, { key: \`\${options.key}/\${param}\`, value: options.default });
    }
    return atoms.get(param);
  };
}
