# Deploy with Docker

Deploy your PhilJS application using Docker containers for consistent, portable deployments across any platform.

## Quick Start

### Basic Dockerfile

Create `Dockerfile` in your project root:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --production

# Copy built application
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Start application
CMD ["npm", "start"]
```

### Build and Run

```bash
# Build image
docker build -t philjs-app .

# Run container
docker run -p 3000:3000 philjs-app

# Visit http://localhost:3000
```

## Multi-Stage Build

Optimize image size with multi-stage builds:

```dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Add non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 philjs

# Copy necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Change ownership
RUN chown -R philjs:nodejs /app

# Switch to non-root user
USER philjs

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

## Docker Compose

Create `docker-compose.yml` for local development:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PUBLIC_API_URL=https://api.example.com
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  postgres_data:
```

Run with Docker Compose:

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## Environment Variables

### Pass at Runtime

```bash
# Single variable
docker run -e PUBLIC_API_URL=https://api.example.com -p 3000:3000 philjs-app

# Multiple variables
docker run \
  -e PUBLIC_API_URL=https://api.example.com \
  -e DATABASE_URL=postgresql://... \
  -p 3000:3000 \
  philjs-app
```

### Using .env File

```bash
# Create .env file
cat > .env <<EOF
PUBLIC_API_URL=https://api.example.com
DATABASE_URL=postgresql://...
SECRET_KEY=xxx
EOF

# Run with env file
docker run --env-file .env -p 3000:3000 philjs-app
```

### In docker-compose.yml

```yaml
services:
  app:
    build: .
    env_file:
      - .env
    # Or inline
    environment:
      NODE_ENV: production
      PUBLIC_API_URL: ${PUBLIC_API_URL}
```

## Static vs SSR

### Static Export

For fully static sites:

```dockerfile
FROM nginx:alpine

# Copy built static files
COPY dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

With `nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### SSR with Node

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

## Health Checks

Add health check to Dockerfile:

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY . .

RUN npm ci --production
RUN npm run build

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "dist/server.js"]
```

Create health endpoint:

```typescript
// src/api/health.ts
export async function GET() {
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

## Optimization

### Reduce Image Size

```dockerfile
# Use alpine base
FROM node:18-alpine

# Use multi-stage builds
FROM node:18-alpine AS builder
# ... build
FROM node:18-alpine
# ... copy only needed files

# Remove unnecessary files
RUN rm -rf /app/src /app/tests

# Use .dockerignore
```

Create `.dockerignore`:

```
node_modules
.git
.env
dist
*.log
.DS_Store
coverage
.vscode
README.md
```

### Layer Caching

Order Dockerfile to maximize cache hits:

```dockerfile
# 1. Copy package.json first (changes rarely)
COPY package*.json ./
RUN npm ci

# 2. Copy source code (changes often)
COPY . .
RUN npm run build
```

### Production Dependencies Only

```dockerfile
# Install all deps for building
RUN npm ci

# Build
RUN npm run build

# Install production deps only for final image
RUN npm ci --production
```

## Deploy to Cloud

### AWS ECS

```bash
# Build and tag
docker build -t philjs-app .
docker tag philjs-app:latest <account-id>.dkr.ecr.<region>.amazonaws.com/philjs-app:latest

# Push to ECR
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/philjs-app:latest

# Deploy to ECS
aws ecs update-service --cluster my-cluster --service philjs-service --force-new-deployment
```

### Google Cloud Run

```bash
# Build and push
gcloud builds submit --tag gcr.io/<project-id>/philjs-app

# Deploy
gcloud run deploy philjs-app \
  --image gcr.io/<project-id>/philjs-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Azure Container Instances

```bash
# Build and push to ACR
az acr build --registry <registry-name> --image philjs-app .

# Deploy
az container create \
  --resource-group myResourceGroup \
  --name philjs-app \
  --image <registry-name>.azurecr.io/philjs-app:latest \
  --dns-name-label philjs-app \
  --ports 3000
```

## Kubernetes

### Deployment

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: philjs-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: philjs-app
  template:
    metadata:
      labels:
        app: philjs-app
    spec:
      containers:
      - name: philjs-app
        image: philjs-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PUBLIC_API_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: api-url
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: philjs-app
spec:
  selector:
    app: philjs-app
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

Deploy:

```bash
# Apply deployment
kubectl apply -f k8s/deployment.yaml

# Check status
kubectl get pods
kubectl get services

# View logs
kubectl logs -f deployment/philjs-app
```

## Monitoring

### Container Logs

```bash
# Docker
docker logs -f <container-id>

# Docker Compose
docker-compose logs -f app

# Kubernetes
kubectl logs -f deployment/philjs-app
```

### Metrics

Add Prometheus metrics:

```typescript
// src/api/metrics.ts
import { register, Counter, Histogram } from 'prom-client';

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
});

export async function GET() {
  const metrics = await register.metrics();
  return new Response(metrics, {
    headers: { 'Content-Type': register.contentType },
  });
}
```

## Security

### Non-Root User

```dockerfile
# Create user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S philjs -u 1001

# Change ownership
RUN chown -R philjs:nodejs /app

# Switch to user
USER philjs
```

### Scan for Vulnerabilities

```bash
# Scan image
docker scan philjs-app

# Use trivy
trivy image philjs-app
```

### Minimal Base Image

```dockerfile
# Use distroless for minimal attack surface
FROM gcr.io/distroless/nodejs18-debian11

COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules

WORKDIR /app
CMD ["dist/server.js"]
```

## CI/CD

### GitHub Actions

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to DockerHub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: username/philjs-app:latest
          cache-from: type=registry,ref=username/philjs-app:buildcache
          cache-to: type=registry,ref=username/philjs-app:buildcache,mode=max
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs <container-id>

# Run interactively
docker run -it philjs-app sh

# Check health
docker inspect <container-id>
```

### Port Not Accessible

```bash
# Verify port mapping
docker ps

# Check if port is exposed
docker inspect <container-id> | grep ExposedPorts

# Test from inside container
docker exec <container-id> wget -O- http://localhost:3000
```

### Build Fails

```bash
# Clear cache
docker build --no-cache -t philjs-app .

# Check .dockerignore
cat .dockerignore
```

## Best Practices

### ✅ Do

- Use multi-stage builds
- Run as non-root user
- Add health checks
- Use .dockerignore
- Scan for vulnerabilities
- Set resource limits

### ❌ Don't

- Run as root
- Store secrets in image
- Use `latest` tag in production
- Include development dependencies
- Skip health checks

## Next Steps

- [Deploy to Kubernetes](/docs/deployment/kubernetes)
- [AWS ECS Deployment](/docs/deployment/aws)
- [Monitor containers](/docs/monitoring/docker)

---

💡 **Tip**: Use `docker-compose` for local development, Kubernetes for production.

⚠️ **Warning**: Never include secrets in your Docker image - use environment variables.

ℹ️ **Note**: PhilJS's small bundle size means fast Docker builds and small images!
