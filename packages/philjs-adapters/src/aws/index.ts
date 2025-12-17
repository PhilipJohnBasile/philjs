/**
 * PhilJS AWS Adapter
 *
 * Deploy to AWS Lambda, Lambda@Edge, and AWS Amplify
 */

import { writeFileSync, mkdirSync, cpSync, existsSync } from 'fs';
import { join } from 'path';
import type { Adapter, AdapterConfig, ServerlessAdapter, RequestContext } from '../types';

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

export function awsAdapter(config: AWSConfig = {}): Adapter & ServerlessAdapter {
  const {
    outDir = '.aws',
    mode = 'lambda',
    runtime = 'nodejs20.x',
    memory = 1024,
    timeout = 30,
    region = 'us-east-1',
    architecture = 'arm64',
    streaming = false,
    cloudfront,
    s3Bucket,
    apiGateway = { type: 'HTTP', corsEnabled: true },
  } = config;

  return {
    name: 'aws',
    serverless: true,
    functionConfig: {
      memory,
      timeout,
      runtime,
    },

    async adapt() {
      console.log(`Building for AWS ${mode}...`);

      mkdirSync(outDir, { recursive: true });

      switch (mode) {
        case 'lambda':
          await adaptForLambda();
          break;
        case 'lambda-edge':
          await adaptForLambdaEdge();
          break;
        case 'amplify':
          await adaptForAmplify();
          break;
      }

      console.log('AWS build complete');
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
            name: 'aws',
            mode,
            context,
          },
        };

        const { handleRequest } = await import('@philjs/ssr');
        return handleRequest(requestContext);
      };
    },
  };

  async function adaptForLambda() {
    // Create Lambda function handler
    writeFileSync(
      join(outDir, 'index.mjs'),
      generateLambdaHandler(streaming)
    );

    // Create SAM template
    writeFileSync(
      join(outDir, 'template.yaml'),
      generateSAMTemplate({
        runtime,
        memory,
        timeout,
        architecture,
        streaming,
        apiGateway,
        s3Bucket,
      })
    );

    // Create package.json for Lambda
    writeFileSync(
      join(outDir, 'package.json'),
      JSON.stringify({
        name: 'philjs-lambda',
        type: 'module',
        dependencies: {
          '@philjs/core': '*',
          '@philjs/ssr': '*',
        },
      }, null, 2)
    );

    // Copy static assets if S3 bucket specified
    if (s3Bucket) {
      mkdirSync(join(outDir, 'static'), { recursive: true });
      const staticDir = config.static?.assets || 'public';
      if (existsSync(staticDir)) {
        cpSync(staticDir, join(outDir, 'static'), { recursive: true });
      }
    }
  }

  async function adaptForLambdaEdge() {
    // Lambda@Edge has restrictions - no env vars, limited memory/timeout
    writeFileSync(
      join(outDir, 'index.mjs'),
      generateLambdaEdgeHandler()
    );

    // CloudFormation template for Lambda@Edge + CloudFront
    writeFileSync(
      join(outDir, 'template.yaml'),
      generateLambdaEdgeTemplate({
        runtime,
        cloudfront,
        s3Bucket,
      })
    );
  }

  async function adaptForAmplify() {
    // AWS Amplify configuration
    writeFileSync(
      join(outDir, 'amplify.yml'),
      generateAmplifyConfig()
    );

    // Server handler
    mkdirSync(join(outDir, 'amplify-ssr'), { recursive: true });
    writeFileSync(
      join(outDir, 'amplify-ssr', 'index.mjs'),
      generateAmplifyHandler()
    );

    // Copy static assets
    const staticDir = config.static?.assets || 'public';
    if (existsSync(staticDir)) {
      cpSync(staticDir, join(outDir, 'public'), { recursive: true });
    }
  }
}

function generateLambdaHandler(streaming: boolean): string {
  if (streaming) {
    return `
// PhilJS AWS Lambda Handler (Streaming)
import { pipeline } from 'stream';
import { promisify } from 'util';

const pipelineAsync = promisify(pipeline);

export const handler = awslambda.streamifyResponse(async (event, responseStream, context) => {
  const { handleRequest } = await import('@philjs/ssr');

  const url = new URL(event.rawPath || '/', \`https://\${event.requestContext?.domainName || 'localhost'}\`);

  // Add query parameters
  if (event.rawQueryString) {
    url.search = event.rawQueryString;
  }

  const headers = new Headers();
  for (const [key, value] of Object.entries(event.headers || {})) {
    if (value) headers.set(key, value);
  }

  const requestContext = {
    url,
    method: event.requestContext?.http?.method || 'GET',
    headers,
    body: event.body,
    params: event.pathParameters || {},
    platform: {
      name: 'aws',
      mode: 'lambda',
      streaming: true,
      context,
    },
  };

  const response = await handleRequest(requestContext);

  // Stream the response
  const metadata = {
    statusCode: response.status,
    headers: Object.fromEntries(response.headers.entries()),
  };

  responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);

  if (response.body) {
    const reader = response.body.getReader();
    const encoder = new TextEncoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        responseStream.write(value);
      }
    } finally {
      responseStream.end();
    }
  } else {
    responseStream.end();
  }
});
`;
  }

  return `
// PhilJS AWS Lambda Handler
export async function handler(event, context) {
  const { handleRequest } = await import('@philjs/ssr');

  const url = new URL(event.rawPath || '/', \`https://\${event.requestContext?.domainName || 'localhost'}\`);

  // Add query parameters
  if (event.rawQueryString) {
    url.search = event.rawQueryString;
  }

  const headers = new Headers();
  for (const [key, value] of Object.entries(event.headers || {})) {
    if (value) headers.set(key, value);
  }

  const requestContext = {
    url,
    method: event.requestContext?.http?.method || 'GET',
    headers,
    body: event.body,
    params: event.pathParameters || {},
    platform: {
      name: 'aws',
      mode: 'lambda',
      streaming: false,
      context,
    },
  };

  const response = await handleRequest(requestContext);

  const responseHeaders = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  return {
    statusCode: response.status,
    headers: responseHeaders,
    body: await response.text(),
    isBase64Encoded: false,
  };
}
`;
}

function generateLambdaEdgeHandler(): string {
  return `
// PhilJS AWS Lambda@Edge Handler (Origin Request)
export async function handler(event, context, callback) {
  const { handleRequest } = await import('@philjs/ssr');

  const request = event.Records[0].cf.request;
  const headers = {};

  for (const [key, values] of Object.entries(request.headers)) {
    headers[key] = values[0].value;
  }

  const url = new URL(
    request.uri + (request.querystring ? '?' + request.querystring : ''),
    \`https://\${headers.host || 'localhost'}\`
  );

  const requestContext = {
    url,
    method: request.method,
    headers: new Headers(headers),
    body: request.body?.data,
    params: {},
    platform: {
      name: 'aws',
      mode: 'lambda-edge',
      config: event.Records[0].cf.config,
    },
  };

  try {
    const response = await handleRequest(requestContext);

    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      // Lambda@Edge header format
      responseHeaders[key.toLowerCase()] = [{ key, value }];
    });

    callback(null, {
      status: String(response.status),
      statusDescription: 'OK',
      headers: responseHeaders,
      body: await response.text(),
    });
  } catch (error) {
    callback(null, {
      status: '500',
      statusDescription: 'Internal Server Error',
      body: 'Internal Server Error',
    });
  }
}
`;
}

function generateAmplifyHandler(): string {
  return `
// PhilJS AWS Amplify SSR Handler
export async function handler(event, context) {
  const { handleRequest } = await import('@philjs/ssr');

  const url = new URL(event.rawPath || '/', \`https://\${event.headers?.host || 'localhost'}\`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(event.headers || {})) {
    if (value) headers.set(key, value);
  }

  const requestContext = {
    url,
    method: event.httpMethod || 'GET',
    headers,
    body: event.body,
    params: event.pathParameters || {},
    platform: {
      name: 'aws',
      mode: 'amplify',
      context,
    },
  };

  const response = await handleRequest(requestContext);

  const responseHeaders = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  return {
    statusCode: response.status,
    headers: responseHeaders,
    body: await response.text(),
  };
}
`;
}

function generateSAMTemplate(options: {
  runtime: string;
  memory: number;
  timeout: number;
  architecture: string;
  streaming: boolean;
  apiGateway: AWSConfig['apiGateway'];
  s3Bucket?: string;
}): string {
  return `AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: PhilJS Application

Globals:
  Function:
    Timeout: ${options.timeout}
    MemorySize: ${options.memory}
    Runtime: ${options.runtime}
    Architectures:
      - ${options.architecture}

Resources:
  PhilJSFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: index.handler
      CodeUri: .
      Description: PhilJS SSR Handler
      ${options.streaming ? 'FunctionUrlConfig:\n        AuthType: NONE\n        InvokeMode: RESPONSE_STREAM' : ''}
      Events:
        Api:
          Type: ${options.apiGateway?.type === 'REST' ? 'Api' : 'HttpApi'}
          Properties:
            Path: /{proxy+}
            Method: ANY
        Root:
          Type: ${options.apiGateway?.type === 'REST' ? 'Api' : 'HttpApi'}
          Properties:
            Path: /
            Method: ANY
${options.s3Bucket ? `
  StaticAssetsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: ${options.s3Bucket}
      PublicAccessBlockConfiguration:
        BlockPublicAcls: false
      WebsiteConfiguration:
        IndexDocument: index.html
` : ''}

Outputs:
  ApiEndpoint:
    Description: API Gateway endpoint URL
    Value: !Sub "https://\${ServerlessHttpApi}.execute-api.\${AWS::Region}.amazonaws.com/"
  FunctionArn:
    Description: Lambda Function ARN
    Value: !GetAtt PhilJSFunction.Arn
`;
}

function generateLambdaEdgeTemplate(options: {
  runtime: string;
  cloudfront?: AWSConfig['cloudfront'];
  s3Bucket?: string;
}): string {
  return `AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: PhilJS Lambda@Edge Application

Resources:
  PhilJSEdgeFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: index.handler
      Runtime: ${options.runtime}
      CodeUri: .
      MemorySize: 128
      Timeout: 5
      Role: !GetAtt LambdaEdgeRole.Arn
      AutoPublishAlias: live

  LambdaEdgeRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - lambda.amazonaws.com
                - edgelambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        PriceClass: ${options.cloudfront?.priceClass || 'PriceClass_100'}
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6
          LambdaFunctionAssociations:
            - EventType: origin-request
              LambdaFunctionARN: !Ref PhilJSEdgeFunction.Version
        Origins:
          - Id: S3Origin
            DomainName: !Sub "${options.s3Bucket || 'philjs-assets'}.s3.amazonaws.com"
            S3OriginConfig:
              OriginAccessIdentity: ''

Outputs:
  CloudFrontDomain:
    Description: CloudFront Distribution Domain
    Value: !GetAtt CloudFrontDistribution.DomainName
  EdgeFunctionArn:
    Description: Lambda@Edge Function ARN
    Value: !Ref PhilJSEdgeFunction.Version
`;
}

function generateAmplifyConfig(): string {
  return `version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .aws
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*

backend:
  phases:
    build:
      commands:
        - npm run build:server
`;
}

// AWS-specific utilities
export function getAWSContext() {
  return (globalThis as any).__AWS_CONTEXT__;
}

export function getRemainingTimeMs(): number {
  const ctx = getAWSContext();
  return ctx?.getRemainingTimeInMillis?.() ?? 0;
}

export function getRequestId(): string {
  const ctx = getAWSContext();
  return ctx?.awsRequestId ?? '';
}

// S3 URL helper
export function getS3AssetUrl(key: string, bucket: string, region = 'us-east-1') {
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

// CloudFront signed URL helper
export function signCloudFrontUrl(
  url: string,
  keyPairId: string,
  privateKey: string,
  expiresAt: Date
) {
  // Implementation would use aws-cloudfront-sign or similar
  throw new Error('CloudFront signing requires aws-cloudfront-sign package');
}

export default awsAdapter;
