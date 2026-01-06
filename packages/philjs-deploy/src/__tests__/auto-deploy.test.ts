import { describe, it, expect } from 'vitest';
import { AutoDeploy } from '../auto-deploy.js';

describe('PhilJS Deploy: Auto-Deploy', () => {
    it('should generate Terraform config for generic app', async () => {
        const config = await AutoDeploy.generateConfig({
            type: 'terraform',
            provider: 'aws',
            region: 'us-east-1',
            services: ['app', 'db']
        });

        expect(config).toContain('resource "aws_instance"');
        expect(config).toContain('region = "us-east-1"');
    });

    it('should generate Pulumi config', async () => {
        const config = await AutoDeploy.generateConfig({
            type: 'pulumi',
            provider: 'azure',
            services: ['function']
        });

        expect(config).toContain('import * as azure');
        expect(config).toContain('new azure.appservice.FunctionApp');
    });

    it('should detect required resources from codebase', async () => {
        // Mock analysis
        const resources = await AutoDeploy.analyzeResources('./src');
        expect(Array.isArray(resources)).toBe(true);
        // Expect generic detection if no real code analysis logic is mocked
    });
});
