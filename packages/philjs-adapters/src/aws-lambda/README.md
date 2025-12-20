# PhilJS AWS Lambda Adapter

Deploy your PhilJS application to AWS Lambda with support for API Gateway, CloudFront, S3, and multiple deployment configurations.

## Features

- **Lambda Functions**: Serverless compute on AWS
- **API Gateway**: REST and HTTP APIs
- **CloudFront**: Global CDN integration
- **S3 Static Assets**: Static file hosting
- **Lambda@Edge**: Edge computing
- **ALB Support**: Application Load Balancer integration
- **SAM/Serverless/Terraform**: Multiple IaC options

## Installation

```bash
npm install philjs-adapters
```

## Basic Usage

### API Gateway (HTTP API)

```typescript
import { awsLambdaAdapter } from 'philjs-adapters/aws-lambda';

export default awsLambdaAdapter({
  region: 'us-east-1',
  runtime: 'nodejs20.x',
  memorySize: 1024,
  timeout: 30,
  integration: 'http-api'
});
```

### Lambda@Edge

```typescript
import { awsLambdaAdapter } from 'philjs-adapters/aws-lambda';

export default awsLambdaAdapter({
  integration: 'lambda-edge',
  runtime: 'nodejs20.x',
  memorySize: 128,
  timeout: 5
});
```

## Configuration

### S3 Static Assets

```typescript
awsLambdaAdapter({
  s3: {
    bucket: 'my-static-assets',
    region: 'us-east-1',
    prefix: 'static',
    cacheControl: 'public, max-age=31536000'
  }
});
```

### CloudFront Distribution

```typescript
awsLambdaAdapter({
  cloudfront: {
    distributionId: 'E1234567890ABC',
    s3Bucket: 'my-static-assets',
    cacheBehaviors: [
      {
        pathPattern: '/static/*',
        ttl: 86400
      }
    ]
  }
});
```

### VPC Configuration

```typescript
awsLambdaAdapter({
  vpc: {
    subnetIds: ['subnet-1', 'subnet-2'],
    securityGroupIds: ['sg-1']
  }
});
```

### Environment Variables

```typescript
awsLambdaAdapter({
  environment: {
    NODE_ENV: 'production',
    API_URL: 'https://api.example.com',
    DB_HOST: 'database.example.com'
  }
});
```

## Deployment

### Using AWS SAM

```bash
# Install SAM CLI
pip install aws-sam-cli

# Build
sam build -t .aws/template.yaml

# Deploy
sam deploy --guided
```

### Using Serverless Framework

```bash
# Install Serverless
npm install -g serverless

# Deploy
cd .aws
serverless deploy
```

### Using Terraform

```bash
# Initialize Terraform
cd .aws
terraform init

# Deploy
terraform apply
```

## Infrastructure as Code

### SAM Template (Generated)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  PhilJSFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: index.handler
      Runtime: nodejs20.x
      MemorySize: 1024
      Timeout: 30
      Events:
        ApiEvent:
          Type: HttpApi
          Properties:
            Path: /{proxy+}
            Method: ANY
```

### Serverless Framework (Generated)

```yaml
service: philjs-app

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1

functions:
  app:
    handler: index.handler
    events:
      - httpApi:
          path: /{proxy+}
          method: ANY
```

## API Gateway Integration

### REST API

```typescript
awsLambdaAdapter({
  integration: 'api-gateway',
  apiGateway: {
    type: 'REST',
    stageName: 'prod',
    cors: true,
    binaryMediaTypes: ['image/*', 'application/pdf']
  }
});
```

### HTTP API

```typescript
awsLambdaAdapter({
  integration: 'http-api',
  apiGateway: {
    type: 'HTTP',
    stageName: 'prod',
    cors: true
  }
});
```

## CloudFront Setup

### With Lambda@Edge

```typescript
awsLambdaAdapter({
  integration: 'lambda-edge',
  cloudfront: {
    s3Bucket: 'my-static-assets',
    cacheBehaviors: [
      {
        pathPattern: '/api/*',
        ttl: 0 // No caching for API
      },
      {
        pathPattern: '/static/*',
        ttl: 31536000 // 1 year cache
      }
    ]
  }
});
```

## Monitoring

### CloudWatch Logs

```bash
# View logs
aws logs tail /aws/lambda/philjs-app --follow

# Filter logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/philjs-app \
  --filter-pattern "ERROR"
```

### X-Ray Tracing

Enable X-Ray in your SAM template:

```yaml
Properties:
  Tracing: Active
```

## Performance

### Cold Start Optimization

```typescript
awsLambdaAdapter({
  memorySize: 1024, // More memory = faster CPU
  timeout: 30,
  layers: [
    'arn:aws:lambda:us-east-1:123456789:layer:my-layer:1'
  ]
});
```

### Provisioned Concurrency

```yaml
AutoPublishAlias: live
ProvisionedConcurrencyConfig:
  ProvisionedConcurrentExecutions: 5
```

## Examples

### Basic Lambda Handler

```typescript
export const handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Hello from Lambda!' })
  };
};
```

### With S3 Integration

```typescript
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: 'us-east-1' });

export const handler = async (event) => {
  const object = await s3.send(new GetObjectCommand({
    Bucket: 'my-bucket',
    Key: 'data.json'
  }));

  // Process object...
};
```

## Resources

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
