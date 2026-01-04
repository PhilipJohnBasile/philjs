/**
 * PhilJS AWS Lambda Adapter
 *
 * Production-ready deployment adapter for AWS with:
 * - Lambda functions
 * - API Gateway integration (REST & HTTP)
 * - CloudFront CDN
 * - S3 static assets
 * - Lambda@Edge support
 * - SAM template generation
 * - CDK support
 *
 * @module philjs-adapters/adapters/aws-lambda
 */
import type { Adapter, AdapterConfig, ServerlessAdapter } from '../types.js';
/**
 * Configuration options for the AWS Lambda adapter
 */
export interface AWSLambdaAdapterConfig extends AdapterConfig {
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
    /** Lambda architecture */
    architecture?: 'x86_64' | 'arm64';
    /** Integration type */
    integration?: 'api-gateway' | 'http-api' | 'alb' | 'lambda-edge' | 'function-url';
    /** Enable response streaming */
    streaming?: boolean;
    /** API Gateway configuration */
    apiGateway?: APIGatewayConfig;
    /** CloudFront configuration */
    cloudfront?: CloudFrontConfig;
    /** S3 configuration for static assets */
    s3?: S3Config;
    /** Lambda layers */
    layers?: string[];
    /** Environment variables */
    environment?: Record<string, string>;
    /** VPC configuration */
    vpc?: VPCConfig;
    /** IAM role ARN */
    roleArn?: string;
    /** Reserved concurrent executions */
    reservedConcurrency?: number;
    /** Provisioned concurrency */
    provisionedConcurrency?: number;
    /** Dead letter queue ARN */
    deadLetterQueueArn?: string;
    /** Generate SAM template */
    generateSAM?: boolean;
    /** Generate CDK code */
    generateCDK?: boolean;
    /** Generate Terraform config */
    generateTerraform?: boolean;
    /** Function URL configuration */
    functionUrl?: FunctionUrlConfig;
    /** X-Ray tracing */
    tracing?: 'Active' | 'PassThrough';
    /** Ephemeral storage size (512-10240 MB) */
    ephemeralStorageSize?: number;
}
/**
 * API Gateway configuration
 */
export interface APIGatewayConfig {
    /** API type */
    type?: 'REST' | 'HTTP';
    /** Stage name */
    stageName?: string;
    /** Enable CORS */
    cors?: boolean | CORSConfig;
    /** Custom domain */
    domain?: string;
    /** Binary media types */
    binaryMediaTypes?: string[];
    /** Throttling configuration */
    throttling?: {
        burstLimit?: number;
        rateLimit?: number;
    };
    /** API key required */
    apiKeyRequired?: boolean;
    /** Authorization */
    authorization?: AuthorizationConfig;
}
/**
 * CORS configuration
 */
export interface CORSConfig {
    allowOrigins?: string[];
    allowMethods?: string[];
    allowHeaders?: string[];
    exposeHeaders?: string[];
    maxAge?: number;
    allowCredentials?: boolean;
}
/**
 * Authorization configuration
 */
export interface AuthorizationConfig {
    type: 'NONE' | 'AWS_IAM' | 'JWT' | 'CUSTOM';
    jwtConfiguration?: {
        issuer: string;
        audience: string[];
    };
    authorizerUri?: string;
}
/**
 * CloudFront configuration
 */
export interface CloudFrontConfig {
    /** Enable CloudFront */
    enabled: boolean;
    /** Price class */
    priceClass?: 'PriceClass_100' | 'PriceClass_200' | 'PriceClass_All';
    /** S3 bucket for static assets origin */
    s3Bucket?: string;
    /** Custom domain names */
    aliases?: string[];
    /** SSL certificate ARN */
    certificateArn?: string;
    /** Cache behaviors */
    cacheBehaviors?: CacheBehavior[];
    /** Default TTL in seconds */
    defaultTTL?: number;
    /** Maximum TTL in seconds */
    maxTTL?: number;
    /** Minimum TTL in seconds */
    minTTL?: number;
    /** Enable compression */
    compress?: boolean;
    /** Origin Shield region */
    originShieldRegion?: string;
    /** Web ACL ARN (WAF) */
    webAclArn?: string;
}
/**
 * Cache behavior configuration
 */
export interface CacheBehavior {
    pathPattern: string;
    targetOriginId: string;
    ttl?: number;
    compress?: boolean;
    viewerProtocolPolicy?: 'allow-all' | 'redirect-to-https' | 'https-only';
}
/**
 * S3 configuration
 */
export interface S3Config {
    /** Bucket name */
    bucket: string;
    /** Bucket region */
    region?: string;
    /** Key prefix for assets */
    prefix?: string;
    /** Cache control header */
    cacheControl?: string;
    /** Enable versioning */
    versioning?: boolean;
    /** Lifecycle rules */
    lifecycleRules?: LifecycleRule[];
}
/**
 * S3 lifecycle rule
 */
export interface LifecycleRule {
    prefix?: string;
    expirationDays?: number;
    transitionDays?: number;
    storageClass?: 'GLACIER' | 'GLACIER_IR' | 'INTELLIGENT_TIERING';
}
/**
 * VPC configuration
 */
export interface VPCConfig {
    /** Subnet IDs */
    subnetIds: string[];
    /** Security group IDs */
    securityGroupIds: string[];
}
/**
 * Function URL configuration
 */
export interface FunctionUrlConfig {
    /** Authorization type */
    authType: 'NONE' | 'AWS_IAM';
    /** CORS configuration */
    cors?: CORSConfig;
    /** Invoke mode */
    invokeMode?: 'BUFFERED' | 'RESPONSE_STREAM';
}
/**
 * Create an AWS Lambda deployment adapter
 *
 * @example
 * ```typescript
 * import { awsLambdaAdapter } from 'philjs-adapters/adapters/aws-lambda';
 *
 * export default defineConfig({
 *   adapter: awsLambdaAdapter({
 *     region: 'us-east-1',
 *     runtime: 'nodejs20.x',
 *     memorySize: 1024,
 *     integration: 'http-api',
 *     s3: {
 *       bucket: 'my-static-assets',
 *     },
 *     cloudfront: {
 *       enabled: true,
 *       priceClass: 'PriceClass_100',
 *     },
 *   }),
 * });
 * ```
 */
export declare function awsLambdaAdapter(config?: AWSLambdaAdapterConfig): Adapter & ServerlessAdapter;
/**
 * Get AWS Lambda context
 */
export declare function getAWSLambdaContext(): AWSLambdaContext | undefined;
/**
 * AWS Lambda context interface
 */
export interface AWSLambdaContext {
    functionName: string;
    functionVersion: string;
    invokedFunctionArn: string;
    memoryLimitInMB: string;
    awsRequestId: string;
    logGroupName: string;
    logStreamName: string;
    getRemainingTimeInMillis(): number;
}
/**
 * Get remaining execution time in milliseconds
 */
export declare function getRemainingTimeMs(): number;
/**
 * Get AWS request ID
 */
export declare function getAWSRequestId(): string;
/**
 * Create S3 URL for an asset
 */
export declare function getS3AssetUrl(key: string, bucket: string, region?: string): string;
export default awsLambdaAdapter;
//# sourceMappingURL=aws-lambda.d.ts.map