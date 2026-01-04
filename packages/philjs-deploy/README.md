
# @philjs/deploy

Autonomous Infrastructure-as-Code.

## Features
- **AutoDeploy**: Generates Terraform/Pulumi configs from your codebase.
- **Provider Agnostic**: Supports AWS, GCP, Azure, and Vercel.

## Usage
```typescript
import { autoDeploy } from '@philjs/deploy';
await autoDeploy({ cloud: 'aws', resources: ['lambda', 's3'] });
```
