# PhilJS Railway Adapter

Deploy your PhilJS application to Railway with Docker, Nixpacks, and automatic configuration generation.

## Features

- **Docker Support**: Automated Dockerfile generation
- **Nixpacks**: Automatic buildpack detection
- **Railway.toml**: Configuration management
- **Health Checks**: Built-in health monitoring
- **Graceful Shutdown**: Clean process termination
- **Static Files**: Optimized static asset serving
- **Auto-scaling**: Automatic horizontal scaling

## Installation

```bash
npm install philjs-adapters
```

## Basic Usage

### Docker Deployment

```typescript
import { railwayAdapter } from 'philjs-adapters/railway';

export default railwayAdapter({
  docker: {
    baseImage: 'node:20-alpine',
    nodeVersion: '20',
    packages: ['python3', 'make', 'g++']
  },
  port: 3000
});
```

### Nixpacks Deployment

```typescript
import { railwayAdapter } from 'philjs-adapters/railway';

export default railwayAdapter({
  nixpacks: {
    packages: ['nodejs', 'npm'],
    buildCommand: 'npm run build',
    startCommand: 'npm start'
  }
});
```

## Configuration

### Railway.toml

```typescript
railwayAdapter({
  railway: {
    buildCommand: 'npm install && npm run build',
    startCommand: 'npm start',
    healthCheckPath: '/health',
    healthCheckInterval: 300,
    restartPolicy: 'on-failure',
    region: 'us-west1',
    variables: {
      NODE_ENV: 'production',
      PORT: '3000'
    }
  }
});
```

### Docker Configuration

```typescript
railwayAdapter({
  docker: {
    baseImage: 'node:20-alpine',
    nodeVersion: '20',
    packages: ['python3', 'make', 'g++'],
    buildArgs: {
      NODE_ENV: 'production'
    },
    env: {
      PORT: '3000'
    },
    exposePorts: [3000, 8080]
  }
});
```

### Static Files

```typescript
railwayAdapter({
  staticFiles: {
    directory: 'public',
    cacheControl: 'public, max-age=31536000, immutable'
  },
  compression: true
});
```

### Graceful Shutdown

```typescript
railwayAdapter({
  gracefulShutdown: {
    timeout: 30000, // 30 seconds
    signals: ['SIGTERM', 'SIGINT']
  }
});
```

## Deployment

### Using Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Using GitHub Integration

1. Connect your repository to Railway
2. Railway automatically detects and deploys
3. Push to deploy automatically

## Environment Variables

### In Railway Dashboard

1. Go to your project
2. Click "Variables"
3. Add your environment variables

### In Code

```typescript
railwayAdapter({
  railway: {
    variables: {
      DATABASE_URL: '${{DATABASE_URL}}',
      API_KEY: '${{API_KEY}}',
      NODE_ENV: 'production'
    }
  }
});
```

## Database Integration

### PostgreSQL

```bash
# Add PostgreSQL
railway add postgres

# Access in your app
const db = new Pool({
  connectionString: process.env.DATABASE_URL
});
```

### MySQL

```bash
# Add MySQL
railway add mysql
```

### Redis

```bash
# Add Redis
railway add redis
```

## Custom Domains

1. Go to project settings
2. Click "Add Domain"
3. Configure DNS:

```
CNAME: your-domain.com -> your-app.up.railway.app
```

## Health Checks

The adapter generates a health check endpoint:

```typescript
// Automatically available at /health
{
  status: 'ok',
  uptime: 12345
}
```

## Monitoring

### View Logs

```bash
# View real-time logs
railway logs

# Follow logs
railway logs --follow
```

### Metrics

Available in Railway dashboard:
- CPU usage
- Memory usage
- Network traffic
- Request count

## Scaling

Railway automatically scales based on:
- CPU usage
- Memory usage
- Request volume

Configure in project settings:
- Min replicas: 1
- Max replicas: 10
- Target CPU: 80%

## Examples

### Full Docker Configuration

```dockerfile
# Generated Dockerfile
FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s \\
  CMD node healthcheck.js

CMD ["npm", "start"]
```

### Railway.toml

```toml
# Generated railway.toml
[build]
command = "npm install"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on-failure"

[env]
NODE_ENV = "production"
PORT = "3000"
```

### Nixpacks.toml

```toml
# Generated nixpacks.toml
[phases.setup]
nixPkgs = ["nodejs", "npm"]

[start]
cmd = "npm start"
```

## Best Practices

### 1. Use Health Checks

```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});
```

### 2. Implement Graceful Shutdown

```typescript
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await server.close();
  await db.disconnect();
  process.exit(0);
});
```

### 3. Set Resource Limits

```typescript
railwayAdapter({
  docker: {
    env: {
      NODE_OPTIONS: '--max-old-space-size=4096'
    }
  }
});
```

### 4. Enable Compression

```typescript
railwayAdapter({
  compression: true
});
```

## Troubleshooting

### Build Failures

Check build logs:
```bash
railway logs --build
```

### Port Issues

Railway provides PORT environment variable:
```typescript
const PORT = process.env.PORT || 3000;
```

### Memory Issues

Increase memory limit in Railway dashboard or use:
```typescript
NODE_OPTIONS: '--max-old-space-size=4096'
```

## Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway CLI](https://docs.railway.app/develop/cli)
- [Nixpacks](https://nixpacks.com)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
