
// CLI Build Presets for specific providers
export const buildPresets = {
    vercel: {
        target: 'serverless',
        outputDirectory: '.vercel/output',
        buildCommand: 'philjs build --target=vercel'
    },
    netlify: {
        target: 'serverless',
        outputDirectory: 'netlify/functions',
        buildCommand: 'philjs build --target=netlify'
    }
};

export function getPreset(name: string) {
    return (buildPresets as any)[name];
}
