/**
 * PhilJS Chromatic Integration
 */

export interface ChromaticConfig { projectToken: string; buildScriptName?: string; }

export function configureChromaticCI(config: ChromaticConfig) {
    return {
        'chromatic.yml': `
name: Chromatic
on: push
jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with: { node-version: 24 }
      - run: npm ci
      - uses: chromaui/action@latest
        with:
          projectToken: \${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          buildScriptName: ${config.buildScriptName || 'build-storybook'}
`
    };
}

export const chromaticDecorator = (Story: any) => (
    <div data-chromatic-ignore={false}>
        <Story />
    </div>
);
