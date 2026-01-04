/**
 * PhilJS AWS Adapter
 *
 * Deploy to AWS Lambda, Lambda@Edge, and AWS Amplify
 */
import type { Adapter, AdapterConfig, ServerlessAdapter } from '../types.js';
export interface AWSConfig extends AdapterConfig {
    /** Deployment mode */
    mode?: 'lambda' | 'lambda-edge' | 'amplify';
    /** Lambda runtime */
    runtime?: 'nodejs18.x' | 'nodejs20.x';
    /** Memory size in MB */
    memory?: number;
    /** Timeout in seconds */
    timeout?: number;
    /** AWS region */
    region?: string;
    /** Architecture */
    architecture?: 'x86_64' | 'arm64';
    /** Enable response streaming */
    streaming?: boolean;
    /** CloudFront configuration (for Lambda@Edge) */
    cloudfront?: {
        priceClass?: 'PriceClass_100' | 'PriceClass_200' | 'PriceClass_All';
        originShieldRegion?: string;
    };
    /** S3 bucket for static assets */
    s3Bucket?: string;
    /** API Gateway configuration */
    apiGateway?: {
        type?: 'REST' | 'HTTP';
        corsEnabled?: boolean;
    };
}
export declare function awsAdapter(config?: AWSConfig): Adapter & ServerlessAdapter;
export declare function getAWSContext(): any;
export declare function getRemainingTimeMs(): number;
export declare function getRequestId(): string;
export declare function getS3AssetUrl(key: string, bucket: string, region?: string): string;
export declare function signCloudFrontUrl(url: string, keyPairId: string, privateKey: string, expiresAt: Date): void;
export default awsAdapter;
//# sourceMappingURL=index.d.ts.map