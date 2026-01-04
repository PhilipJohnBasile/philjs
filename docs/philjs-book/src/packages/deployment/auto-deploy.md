
# Autonomous Deployment (`@philjs/deploy`)

PhilJS doesn't just run code; it builds the clouds it runs on.

## AutoDeploy
The `autoDeploy` function analyzes your imports and generates the necessary Terraform or Pulumi configurations.

- **PostgreSQL**: Detected via `import { pg }`
- **Redis**: Detected via `import { redis }`
- **Lambda**: Detected via serverless entry points.

```typescript
import { autoDeploy } from '@philjs/deploy';
await autoDeploy({ cloud: 'aws' });
```
