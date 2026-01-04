/**
 * PhilJS AWS Lambda Adapter
 *
 * Full-featured AWS deployment with:
 * - Lambda function handler
 * - API Gateway integration (REST & HTTP APIs)
 * - CloudFront integration
 * - S3 static assets
 * - Lambda@Edge support
 * - ALB (Application Load Balancer) support
 */
import type { Adapter, AdapterConfig, ServerlessAdapter } from '../types.js';
export interface AWSLambdaConfig extends AdapterConfig {
    /** AWS region */
    region?: string;
    /** Lambda runtime */
    runtime?: 'nodejs18.x' | 'nodejs20.x';
    /** Lambda memory in MB */
    memorySize?: number;
    /** Lambda timeout in seconds */
    timeout?: number;
    /** Lambda handler name */
    handler?: string;
    /** Integration type */
    integration?: 'api-gateway' | 'http-api' | 'alb' | 'lambda-edge' | 'cloudfront';
    /** API Gateway configuration */
    apiGateway?: {
        /** API type */
        type?: 'REST' | 'HTTP';
        /** Stage name */
        stageName?: string;
        /** Enable CORS */
        cors?: boolean;
        /** Custom domain */
        domain?: string;
        /** Binary media types */
        binaryMediaTypes?: string[];
    };
    /** CloudFront configuration */
    cloudfront?: {
        /** Distribution ID */
        distributionId?: string;
        /** S3 bucket for static assets */
        s3Bucket?: string;
        /** Cache behaviors */
        cacheBehaviors?: Array<{
            pathPattern: string;
            ttl?: number;
        }>;
    };
    /** S3 configuration for static assets */
    s3?: {
        /** Bucket name */
        bucket: string;
        /** Bucket region */
        region?: string;
        /** Key prefix */
        prefix?: string;
        /** Cache control */
        cacheControl?: string;
    };
    /** Lambda layers */
    layers?: string[];
    /** Environment variables */
    environment?: Record<string, string>;
    /** VPC configuration */
    vpc?: {
        /** Subnet IDs */
        subnetIds: string[];
        /** Security group IDs */
        securityGroupIds: string[];
    };
    /** IAM role ARN */
    roleArn?: string;
    /** Generate SAM template */
    generateSAM?: boolean;
    /** Generate Serverless Framework config */
    generateServerless?: boolean;
    /** Generate Terraform config */
    generateTerraform?: boolean;
}
export declare function awsLambdaAdapter(config?: AWSLambdaConfig): Adapter & ServerlessAdapter;
export declare function getAWSContext(): any;
export declare function getRemainingTimeMs(): number;
export declare function getRequestId(): string;
export declare function getS3AssetUrl(key: string, bucket?: string): string;
export default awsLambdaAdapter;
//# sourceMappingURL=index.d.ts.map