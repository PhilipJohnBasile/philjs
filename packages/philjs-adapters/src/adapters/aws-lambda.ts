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

import { writeFileSync, mkdirSync, cpSync, existsSync } from 'fs';
import { join } from 'path';
import type { Adapter, AdapterConfig, ServerlessAdapter, RequestContext } from '../types';
import { createBuildManifest, copyStaticAssets } from '../utils/build';
import { loadEnvFile } from '../utils/env';

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
export function awsLambdaAdapter(config: AWSLambdaAdapterConfig = {}): Adapter & ServerlessAdapter {
  const {
    outDir = '.aws',
    region = 'us-east-1',
    runtime = 'nodejs20.x',
    memorySize = 1024,
    timeout = 30,
    handler = 'index.handler',
    architecture = 'arm64',
    integration = 'http-api',
    streaming = false,
    apiGateway = { type: 'HTTP', cors: true },
    cloudfront,
    s3,
    layers = [],
    environment = {},
    vpc,
    roleArn,
    reservedConcurrency,
    provisionedConcurrency,
    deadLetterQueueArn,
    generateSAM = true,
    generateCDK = false,
    generateTerraform = false,
    functionUrl,
    tracing,
    ephemeralStorageSize,
  } = config;

  return {
    name: 'aws-lambda',
    serverless: true,
    functionConfig: {
      memory: memorySize,
      timeout,
      runtime,
    },

    async adapt() {
      console.log(`Building for AWS Lambda (${integration})...`);

      // Create output structure
      mkdirSync(outDir, { recursive: true });
      mkdirSync(join(outDir, 'lambda'), { recursive: true });

      // Generate Lambda handler
      writeFileSync(
        join(outDir, 'lambda', 'index.mjs'),
        generateLambdaHandler()
      );

      // Generate package.json for Lambda
      writeFileSync(
        join(outDir, 'lambda', 'package.json'),
        JSON.stringify({
          name: 'philjs-lambda',
          version: '1.0.0',
          type: 'module',
          dependencies: {
            '@philjs/ssr': 'latest',
          },
        }, null, 2)
      );

      // Generate infrastructure templates
      if (generateSAM) {
        writeFileSync(
          join(outDir, 'template.yaml'),
          generateSAMTemplate()
        );
      }

      if (generateCDK) {
        await generateCDKCode();
      }

      if (generateTerraform) {
        writeFileSync(
          join(outDir, 'main.tf'),
          generateTerraformConfig()
        );
      }

      // Generate deployment script
      writeFileSync(
        join(outDir, 'deploy.sh'),
        generateDeployScript()
      );

      // Copy static assets
      if (s3) {
        mkdirSync(join(outDir, 's3'), { recursive: true });
        await copyStaticAssets(config.static?.assets || 'public', join(outDir, 's3'));

        if (existsSync('.philjs/prerendered')) {
          cpSync('.philjs/prerendered', join(outDir, 's3'), { recursive: true });
        }
      }

      // Generate build manifest
      const manifest = await createBuildManifest({
        adapter: 'aws-lambda',
        outputDir: outDir,
        routes: [],
      });
      writeFileSync(
        join(outDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

      console.log(`AWS Lambda build complete: ${outDir}`);
    },

    getHandler() {
      return async (request: Request, context?: unknown): Promise<Response> => {
        const url = new URL(request.url);

        const requestContext: RequestContext = {
          url,
          method: request.method,
          headers: request.headers,
          body: request.body,
          params: {},
          platform: {
            name: 'aws-lambda',
            edge: integration === 'lambda-edge',
            context,
            region,
            streaming,
          },
        };

        const { handleRequest } = await import('@philjs/ssr');
        return handleRequest(requestContext);
      };
    },
  };

  /**
   * Generate Lambda handler code based on integration type
   */
  function generateLambdaHandler(): string {
    switch (integration) {
      case 'lambda-edge':
        return generateLambdaEdgeHandler();
      case 'alb':
        return generateALBHandler();
      case 'function-url':
        return generateFunctionUrlHandler();
      default:
        return streaming
          ? generateStreamingHandler()
          : generateAPIGatewayHandler();
    }
  }

  /**
   * Generate API Gateway handler
   */
  function generateAPIGatewayHandler(): string {
    return `// PhilJS AWS Lambda Handler
// Generated by PhilJS Adapters

import { handleRequest } from '@philjs/ssr';

export async function handler(event, context) {
  // Construct URL
  const protocol = event.headers['x-forwarded-proto'] || 'https';
  const host = event.headers.host || event.requestContext?.domainName;
  const path = event.rawPath || event.requestContext?.http?.path || event.path || '/';
  const queryString = event.rawQueryString || '';
  const url = new URL(\`\${protocol}://\${host}\${path}\${queryString ? '?' + queryString : ''}\`);

  // Convert headers
  const headers = new Headers();
  for (const [key, value] of Object.entries(event.headers || {})) {
    if (value) headers.append(key, value);
  }

  // Create request context
  const requestContext = {
    url,
    method: event.requestContext?.http?.method || event.httpMethod || 'GET',
    headers,
    body: event.body ? new ReadableStream({
      start(controller) {
        const body = event.isBase64Encoded
          ? Buffer.from(event.body, 'base64').toString()
          : event.body;
        controller.enqueue(new TextEncoder().encode(body));
        controller.close();
      }
    }) : null,
    params: event.pathParameters || {},
    platform: {
      name: 'aws-lambda',
      edge: false,
      context,
      event,
      region: '${region}',
      requestId: context.awsRequestId,
      remainingTime: context.getRemainingTimeInMillis(),
    },
  };

  try {
    const response = await handleRequest(requestContext);

    // Convert response
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let body = '';
    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        body += decoder.decode(value, { stream: true });
      }
    }

    return {
      statusCode: response.status,
      headers: responseHeaders,
      body,
      isBase64Encoded: false,
    };
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal Server Error',
        requestId: context.awsRequestId,
      }),
    };
  }
}
`;
  }

  /**
   * Generate streaming handler for Lambda response streaming
   */
  function generateStreamingHandler(): string {
    return `// PhilJS AWS Lambda Streaming Handler
// Generated by PhilJS Adapters

import { handleRequest } from '@philjs/ssr';

export const handler = awslambda.streamifyResponse(
  async (event, responseStream, context) => {
    const url = new URL(
      event.rawPath + (event.rawQueryString ? '?' + event.rawQueryString : ''),
      \`https://\${event.requestContext?.domainName || 'localhost'}\`
    );

    const headers = new Headers();
    for (const [key, value] of Object.entries(event.headers || {})) {
      if (value) headers.append(key, value);
    }

    const requestContext = {
      url,
      method: event.requestContext?.http?.method || 'GET',
      headers,
      body: event.body ? new ReadableStream({
        start(controller) {
          const body = event.isBase64Encoded
            ? Buffer.from(event.body, 'base64').toString()
            : event.body;
          controller.enqueue(new TextEncoder().encode(body));
          controller.close();
        }
      }) : null,
      params: event.pathParameters || {},
      platform: {
        name: 'aws-lambda',
        edge: false,
        streaming: true,
        context,
        region: '${region}',
      },
    };

    try {
      const response = await handleRequest(requestContext);

      // Create streaming metadata
      const metadata = {
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      };

      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);

      if (response.body) {
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          responseStream.write(value);
        }
      }

      responseStream.end();
    } catch (error) {
      console.error('Streaming error:', error);
      responseStream.write(JSON.stringify({ error: 'Internal Server Error' }));
      responseStream.end();
    }
  }
);
`;
  }

  /**
   * Generate Lambda@Edge handler
   */
  function generateLambdaEdgeHandler(): string {
    return `// PhilJS AWS Lambda@Edge Handler
// Generated by PhilJS Adapters

import { handleRequest } from '@philjs/ssr';

export async function handler(event, context, callback) {
  const request = event.Records[0].cf.request;

  // Build headers
  const headers = new Headers();
  for (const [key, values] of Object.entries(request.headers)) {
    for (const { value } of values) {
      headers.append(key, value);
    }
  }

  const host = headers.get('host') || 'localhost';
  const url = new URL(
    request.uri + (request.querystring ? '?' + request.querystring : ''),
    \`https://\${host}\`
  );

  const requestContext = {
    url,
    method: request.method,
    headers,
    body: request.body?.data ? new ReadableStream({
      start(controller) {
        const body = request.body.encoding === 'base64'
          ? Buffer.from(request.body.data, 'base64').toString()
          : request.body.data;
        controller.enqueue(new TextEncoder().encode(body));
        controller.close();
      }
    }) : null,
    params: {},
    platform: {
      name: 'aws-lambda-edge',
      edge: true,
      event,
    },
  };

  try {
    const response = await handleRequest(requestContext);

    // Convert to Lambda@Edge format
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key.toLowerCase()] = [{ key, value }];
    });

    let body = '';
    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        body += decoder.decode(value, { stream: true });
      }
    }

    callback(null, {
      status: response.status.toString(),
      statusDescription: response.statusText || 'OK',
      headers: responseHeaders,
      body,
    });
  } catch (error) {
    console.error('Lambda@Edge error:', error);
    callback(null, {
      status: '500',
      statusDescription: 'Internal Server Error',
      headers: {
        'content-type': [{ key: 'Content-Type', value: 'application/json' }],
      },
      body: JSON.stringify({ error: 'Internal Server Error' }),
    });
  }
}
`;
  }

  /**
   * Generate ALB handler
   */
  function generateALBHandler(): string {
    return `// PhilJS AWS ALB Handler
// Generated by PhilJS Adapters

import { handleRequest } from '@philjs/ssr';

export async function handler(event, context) {
  const protocol = event.headers['x-forwarded-proto'] || 'https';
  const host = event.headers.host;
  const path = event.path;
  const queryString = event.queryStringParameters
    ? new URLSearchParams(event.queryStringParameters).toString()
    : '';
  const url = new URL(\`\${protocol}://\${host}\${path}\${queryString ? '?' + queryString : ''}\`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(event.headers || {})) {
    if (value) headers.append(key, value);
  }

  const requestContext = {
    url,
    method: event.httpMethod,
    headers,
    body: event.body ? new ReadableStream({
      start(controller) {
        const body = event.isBase64Encoded
          ? Buffer.from(event.body, 'base64').toString()
          : event.body;
        controller.enqueue(new TextEncoder().encode(body));
        controller.close();
      }
    }) : null,
    params: {},
    platform: {
      name: 'aws-lambda',
      edge: false,
      integration: 'alb',
      context,
      region: '${region}',
    },
  };

  try {
    const response = await handleRequest(requestContext);

    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let body = '';
    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        body += decoder.decode(value, { stream: true });
      }
    }

    return {
      statusCode: response.status,
      statusDescription: \`\${response.status} \${response.statusText || 'OK'}\`,
      headers: responseHeaders,
      body,
      isBase64Encoded: false,
    };
  } catch (error) {
    console.error('ALB handler error:', error);
    return {
      statusCode: 500,
      statusDescription: '500 Internal Server Error',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
}
`;
  }

  /**
   * Generate Function URL handler
   */
  function generateFunctionUrlHandler(): string {
    const invokeMode = functionUrl?.invokeMode || 'BUFFERED';

    if (invokeMode === 'RESPONSE_STREAM') {
      return generateStreamingHandler();
    }

    return generateAPIGatewayHandler();
  }

  /**
   * Generate SAM template
   */
  function generateSAMTemplate(): string {
    const corsConfig = apiGateway?.cors === true
      ? { AllowOrigins: ['*'], AllowMethods: ['*'], AllowHeaders: ['*'] }
      : apiGateway?.cors || null;

    return `AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: PhilJS Application - Generated by PhilJS Adapters

Globals:
  Function:
    Timeout: ${timeout}
    MemorySize: ${memorySize}
    Runtime: ${runtime}
    Architectures:
      - ${architecture}
    ${tracing ? `Tracing: ${tracing}` : ''}
    ${ephemeralStorageSize ? `EphemeralStorage:\n      Size: ${ephemeralStorageSize}` : ''}
    ${Object.keys(environment).length > 0 ? `Environment:
      Variables:
${Object.entries(environment).map(([k, v]) => `        ${k}: "${v}"`).join('\n')}` : ''}

Resources:
  PhilJSFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: lambda/
      Handler: ${handler}
      Description: PhilJS Application Handler
      ${layers.length > 0 ? `Layers:\n${layers.map(l => `        - ${l}`).join('\n')}` : ''}
      ${roleArn ? `Role: ${roleArn}` : ''}
      ${vpc ? `VpcConfig:
        SubnetIds:
${vpc.subnetIds.map(id => `          - ${id}`).join('\n')}
        SecurityGroupIds:
${vpc.securityGroupIds.map(id => `          - ${id}`).join('\n')}` : ''}
      ${reservedConcurrency !== undefined ? `ReservedConcurrentExecutions: ${reservedConcurrency}` : ''}
      ${deadLetterQueueArn ? `DeadLetterQueue:
        Type: SQS
        TargetArn: ${deadLetterQueueArn}` : ''}
      ${streaming ? `FunctionUrlConfig:
        AuthType: NONE
        InvokeMode: RESPONSE_STREAM` : ''}
      Events:
${integration === 'http-api' ? `        HttpApi:
          Type: HttpApi
          Properties:
            Path: /{proxy+}
            Method: ANY
${corsConfig ? `            PayloadFormatVersion: "2.0"` : ''}` : `        Api:
          Type: Api
          Properties:
            Path: /{proxy+}
            Method: ANY`}

${functionUrl ? `  PhilJSFunctionUrl:
    Type: AWS::Lambda::Url
    Properties:
      TargetFunctionArn: !GetAtt PhilJSFunction.Arn
      AuthType: ${functionUrl.authType}
      ${functionUrl.invokeMode ? `InvokeMode: ${functionUrl.invokeMode}` : ''}
      ${functionUrl.cors ? `Cors:
        AllowOrigins: ${JSON.stringify(functionUrl.cors.allowOrigins || ['*'])}
        AllowMethods: ${JSON.stringify(functionUrl.cors.allowMethods || ['*'])}
        AllowHeaders: ${JSON.stringify(functionUrl.cors.allowHeaders || ['*'])}` : ''}` : ''}

${s3 ? `  StaticAssetsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: ${s3.bucket}
      ${s3.versioning ? 'VersioningConfiguration:\n        Status: Enabled' : ''}
      PublicAccessBlockConfiguration:
        BlockPublicAcls: false
        BlockPublicPolicy: false
        IgnorePublicAcls: false
        RestrictPublicBuckets: false

  StaticAssetsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref StaticAssetsBucket
      PolicyDocument:
        Statement:
          - Effect: Allow
            Principal: '*'
            Action: s3:GetObject
            Resource: !Sub '\${StaticAssetsBucket.Arn}/*'` : ''}

${cloudfront?.enabled ? `  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        PriceClass: ${cloudfront.priceClass || 'PriceClass_100'}
        ${cloudfront.aliases?.length ? `Aliases:\n${cloudfront.aliases.map(a => `          - ${a}`).join('\n')}` : ''}
        ${cloudfront.certificateArn ? `ViewerCertificate:
          AcmCertificateArn: ${cloudfront.certificateArn}
          SslSupportMethod: sni-only
          MinimumProtocolVersion: TLSv1.2_2021` : ''}
        DefaultCacheBehavior:
          TargetOriginId: APIOrigin
          ViewerProtocolPolicy: redirect-to-https
          ${cloudfront.compress ? 'Compress: true' : ''}
          CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad
          OriginRequestPolicyId: b689b0a8-53d0-40ab-baf2-68738e2966ac
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
            - PUT
            - POST
            - PATCH
            - DELETE
        ${s3 ? `CacheBehaviors:
          - PathPattern: /static/*
            TargetOriginId: S3Origin
            ViewerProtocolPolicy: redirect-to-https
            Compress: true
            CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6` : ''}
        Origins:
          - Id: APIOrigin
            DomainName: !Sub '\${ServerlessHttpApi}.execute-api.\${AWS::Region}.amazonaws.com'
            CustomOriginConfig:
              HTTPSPort: 443
              OriginProtocolPolicy: https-only
          ${s3 ? `- Id: S3Origin
            DomainName: !GetAtt StaticAssetsBucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: ''` : ''}` : ''}

Outputs:
  ApiEndpoint:
    Description: API Gateway endpoint URL
    Value: !Sub 'https://\${ServerlessHttpApi}.execute-api.\${AWS::Region}.amazonaws.com/'

  FunctionArn:
    Description: Lambda Function ARN
    Value: !GetAtt PhilJSFunction.Arn

${functionUrl ? `  FunctionUrl:
    Description: Lambda Function URL
    Value: !GetAtt PhilJSFunctionUrl.FunctionUrl` : ''}

${s3 ? `  S3BucketName:
    Description: S3 bucket for static assets
    Value: !Ref StaticAssetsBucket` : ''}

${cloudfront?.enabled ? `  CloudFrontDomain:
    Description: CloudFront distribution domain
    Value: !GetAtt CloudFrontDistribution.DomainName` : ''}
`;
  }

  /**
   * Generate CDK code
   */
  async function generateCDKCode(): Promise<void> {
    mkdirSync(join(outDir, 'cdk'), { recursive: true });

    writeFileSync(
      join(outDir, 'cdk', 'stack.ts'),
      `// PhilJS AWS CDK Stack
// Generated by PhilJS Adapters

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
${s3 ? `import * as s3 from 'aws-cdk-lib/aws-s3';` : ''}
${cloudfront?.enabled ? `import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';` : ''}
import { Construct } from 'constructs';

export class PhilJSStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda Function
    const handler = new lambda.Function(this, 'PhilJSHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('../lambda'),
      handler: 'index.handler',
      memorySize: ${memorySize},
      timeout: cdk.Duration.seconds(${timeout}),
      architecture: lambda.Architecture.${architecture === 'arm64' ? 'ARM_64' : 'X86_64'},
      ${tracing ? `tracing: lambda.Tracing.${tracing.toUpperCase()},` : ''}
      ${Object.keys(environment).length > 0 ? `environment: ${JSON.stringify(environment)},` : ''}
    });

    // HTTP API
    const api = new apigatewayv2.HttpApi(this, 'PhilJSApi', {
      ${apiGateway?.cors ? `corsPreflight: {
        allowOrigins: ${JSON.stringify((typeof apiGateway.cors === 'object' && apiGateway.cors.allowOrigins ? apiGateway.cors.allowOrigins : undefined) || ['*'])},
        allowMethods: [apigatewayv2.CorsHttpMethod.ANY],
        allowHeaders: ${JSON.stringify((typeof apiGateway.cors === 'object' && apiGateway.cors.allowHeaders ? apiGateway.cors.allowHeaders : undefined) || ['*'])},
      },` : ''}
    });

    api.addRoutes({
      path: '/{proxy+}',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: new integrations.HttpLambdaIntegration('LambdaIntegration', handler),
    });

${s3 ? `
    // S3 Bucket for static assets
    const bucket = new s3.Bucket(this, 'StaticAssets', {
      bucketName: '${s3.bucket}',
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      ${s3.versioning ? 'versioned: true,' : ''}
    });
` : ''}

${cloudfront?.enabled ? `
    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.HttpOrigin(cdk.Fn.select(2, cdk.Fn.split('/', api.url!))),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        ${cloudfront.compress ? 'compress: true,' : ''}
      },
      ${s3 ? `additionalBehaviors: {
        '/static/*': {
          origin: new origins.S3Origin(bucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          compress: true,
        },
      },` : ''}
      priceClass: cloudfront.PriceClass.${(cloudfront.priceClass || 'PriceClass_100').replace('PriceClass_', 'PRICE_CLASS_')},
    });

    new cdk.CfnOutput(this, 'CloudFrontDomain', {
      value: distribution.distributionDomainName,
    });
` : ''}

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url!,
    });

    new cdk.CfnOutput(this, 'FunctionArn', {
      value: handler.functionArn,
    });
  }
}
`
    );

    // Generate CDK app entry point
    writeFileSync(
      join(outDir, 'cdk', 'app.ts'),
      `#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { PhilJSStack } from './stack';

const app = new cdk.App();
new PhilJSStack(app, 'PhilJSStack', {
  env: {
    region: '${region}',
  },
});
`
    );
  }

  /**
   * Generate Terraform configuration
   */
  function generateTerraformConfig(): string {
    return `# PhilJS AWS Lambda Terraform Configuration
# Generated by PhilJS Adapters

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "${region}"
}

# Lambda Function
resource "aws_lambda_function" "philjs" {
  filename         = "lambda.zip"
  function_name    = "philjs-app"
  role             = ${roleArn ? `"${roleArn}"` : 'aws_iam_role.lambda.arn'}
  handler          = "${handler}"
  runtime          = "${runtime}"
  memory_size      = ${memorySize}
  timeout          = ${timeout}
  architectures    = ["${architecture}"]
  ${tracing ? `\n  tracing_config {\n    mode = "${tracing}"\n  }` : ''}
  ${ephemeralStorageSize ? `\n  ephemeral_storage {\n    size = ${ephemeralStorageSize}\n  }` : ''}
  ${Object.keys(environment).length > 0 ? `\n  environment {\n    variables = ${JSON.stringify(environment, null, 2)}\n  }` : ''}
  ${vpc ? `\n  vpc_config {\n    subnet_ids         = ${JSON.stringify(vpc.subnetIds)}\n    security_group_ids = ${JSON.stringify(vpc.securityGroupIds)}\n  }` : ''}
}

${!roleArn ? `
# IAM Role
resource "aws_iam_role" "lambda" {
  name = "philjs-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
` : ''}

# API Gateway
resource "aws_apigatewayv2_api" "api" {
  name          = "philjs-api"
  protocol_type = "HTTP"
  ${apiGateway?.cors ? `\n  cors_configuration {\n    allow_origins = ["*"]\n    allow_methods = ["*"]\n    allow_headers = ["*"]\n  }` : ''}
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id             = aws_apigatewayv2_api.api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.philjs.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/\${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "api" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.philjs.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "\${aws_apigatewayv2_api.api.execution_arn}/*/*"
}

${s3 ? `
# S3 Bucket
resource "aws_s3_bucket" "static" {
  bucket = "${s3.bucket}"
}

resource "aws_s3_bucket_public_access_block" "static" {
  bucket = aws_s3_bucket.static.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "static" {
  bucket = aws_s3_bucket.static.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "\${aws_s3_bucket.static.arn}/*"
    }]
  })
}
` : ''}

# Outputs
output "api_endpoint" {
  value = aws_apigatewayv2_stage.default.invoke_url
}

output "function_arn" {
  value = aws_lambda_function.philjs.arn
}

${s3 ? `
output "s3_bucket" {
  value = aws_s3_bucket.static.bucket
}
` : ''}
`;
  }

  /**
   * Generate deployment script
   */
  function generateDeployScript(): string {
    return `#!/bin/bash
# PhilJS AWS Lambda Deployment Script
# Generated by PhilJS Adapters

set -e

echo "Building Lambda package..."
cd lambda
npm ci --production
cd ..

echo "Creating deployment package..."
cd lambda
zip -r ../lambda.zip . -x "*.git*" "node_modules/aws-sdk/*"
cd ..

${generateSAM ? `
echo "Deploying with AWS SAM..."
sam build
sam deploy --guided
` : ''}

${generateTerraform ? `
echo "Deploying with Terraform..."
terraform init
terraform apply -auto-approve
` : ''}

${s3 ? `
echo "Uploading static assets to S3..."
aws s3 sync s3/ s3://${s3.bucket}${s3.prefix ? `/${s3.prefix}` : ''} \\
  --delete \\
  ${s3.cacheControl ? `--cache-control "${s3.cacheControl}"` : '--cache-control "public, max-age=31536000, immutable"'} \\
  --region ${s3.region || region}
` : ''}

echo "Deployment complete!"
`;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get AWS Lambda context
 */
export function getAWSLambdaContext(): AWSLambdaContext | undefined {
  return (globalThis as any).__AWS_LAMBDA_CONTEXT__;
}

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
export function getRemainingTimeMs(): number {
  const context = getAWSLambdaContext();
  return context?.getRemainingTimeInMillis() || 0;
}

/**
 * Get AWS request ID
 */
export function getAWSRequestId(): string {
  const context = getAWSLambdaContext();
  return context?.awsRequestId || '';
}

/**
 * Create S3 URL for an asset
 */
export function getS3AssetUrl(key: string, bucket: string, region = 'us-east-1'): string {
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export default awsLambdaAdapter;
