export interface DeployConfig {
    appName: string;
    cloud: 'aws' | 'gcp' | 'azure';
    region?: string;
    resources?: string[];
}
export declare class TerraformGenerator {
    generate(config: DeployConfig): Record<string, string>;
    private generateProvider;
    private generateDatabase;
    private generateCache;
    private generateStorage;
    private generateVariables;
}
//# sourceMappingURL=terraform.d.ts.map