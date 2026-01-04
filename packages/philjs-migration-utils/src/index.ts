
// PhilJS Migration Utilities
// Helpers for migrating from Legacy Stacks (Java, C#, Backbone)

export const JAVA_SPRING_MAPPING = {
    '@Controller': 'Route',
    '@Service': 'Injectable',
    '@Repository': 'Store'
};

export const CSHARP_NET_MAPPING = {
    '[ApiController]': 'Route',
    'IHubContext': 'SignalRAdapter'
};

export function detectLegacyPatterns(code: string) {
    const patterns = [];
    if (code.includes('extends Backbone.View')) patterns.push('Backbone');
    if (code.includes('Ember.Component.extend')) patterns.push('Ember');
    return patterns;
}

export function generateMigrationPrompt(legacyCode: string, type: 'java' | 'csharp' | 'backbone') {
    return `Migrate this ${type} code to PhilJS Components/Signals:\n\n${legacyCode}`;
}
