export interface MavenDependency {
    groupId: string;
    artifactId: string;
    version: string;
    scope?: 'compile' | 'provided' | 'runtime' | 'test' | 'system';
}
export interface MavenPluginConfig {
    groupId: string;
    artifactId: string;
    version: string;
    packaging?: 'jar' | 'war' | 'pom';
    name?: string;
    dependencies?: MavenDependency[];
    properties?: Record<string, string>;
    buildPlugins?: MavenDependency[];
}
export declare function generatePomXml(config: MavenPluginConfig): string;
//# sourceMappingURL=maven-plugin.d.ts.map