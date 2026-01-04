
export interface BuildPreset {
    target: 'serverless' | 'static' | 'node';
    outputDirectory: string;
    buildCommand: string;
    generateConfig?: () => string;
}

export const buildPresets: Record<string, BuildPreset> = {
    vercel: {
        target: 'serverless',
        outputDirectory: '.vercel/output',
        buildCommand: 'philjs build --target=vercel',
        generateConfig: () => JSON.stringify({
            version: 2,
            builds: [{ src: "package.json", use: "@vercel/node" }],
            routes: [{ src: "/(.*)", dest: "/" }]
        }, null, 2)
    },
    netlify: {
        target: 'serverless',
        outputDirectory: 'netlify/functions',
        buildCommand: 'philjs build --target=netlify',
        generateConfig: () => [
            '[build]',
            '  command = "npm run build"',
            '  publish = "dist"',
            '[functions]',
            '  directory = "netlify/functions"'
        ].join('\n')
    }
};

export function getPreset(name: string): BuildPreset | undefined {
    return buildPresets[name];
}
