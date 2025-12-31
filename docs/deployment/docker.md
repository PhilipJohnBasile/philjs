# Deploy with Docker

Deploy your PhilJS application using Docker containers for consistent, portable deployments across any platform.

## Quick Start

### Basic Dockerfile

Create `Dockerfile` in your project root:

```dockerfile
# Build stage
FROM node:24-alpine AS builder

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
FROM node:24-alpine

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
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Builder
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Runner
FROM node:24-alpine AS runner
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

CMD ["node", "dist/server"]
```

## Docker Compose

### Development Setup

Create `docker-compose.yml` for local development:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      target: runner
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PUBLIC_API_URL=https://api.example.com
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped
    volumes:
      # Mount for hot-reload in development
      - ./src:/app/src:ro
    networks:
      - app-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    restart: unless-stopped
    networks:
      - app-network

  # Optional: Nginx reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

### Production Setup

Create `docker-compose.prod.yml` for production:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      target: runner
      args:
        - NODE_ENV=production
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    environment:
      - NODE_ENV=production
      - PUBLIC_API_URL=${PUBLIC_API_URL}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - API_KEY=${API_KEY}
    env_file:
      - .env.production
    ports:
      - "3000:3000"
    depends_on:
      - db
      - redis
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - app-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - app-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
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
  -e API_KEY=secret123 \
  -p 3000:3000 \
  philjs-app
```

### Using .env File

```bash
# Create .env.production file
cat > .env.production <<EOF
# Public variables (exposed to client)
PUBLIC_API_URL=https://api.production.com
PUBLIC_APP_NAME=MyApp

# Server-only variables (never exposed to client)
DATABASE_URL=postgresql://user:pass@db:5432/myapp
REDIS_URL=redis://redis:6379
API_KEY=your-secret-api-key
JWT_SECRET=your-jwt-secret
SMTP_HOST=smtp.example.com
SMTP_USER=noreply@example.com
SMTP_PASS=smtp-password

# App configuration
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
EOF

# Run with env file
docker run --env-file .env.production -p 3000:3000 philjs-app
```

### In docker-compose.yml

```yaml
services:
  app:
    build: .
    env_file:
      # Load from multiple env files
      - .env
      - .env.production
    environment:
      # Override or add specific variables
      NODE_ENV: production
      PUBLIC_API_URL: ${PUBLIC_API_URL}
      DATABASE_URL: ${DATABASE_URL}
      # Set from host environment
      API_KEY: ${API_KEY}
```

### Build-Time vs Runtime Variables

```dockerfile
# Build-time variables
ARG NODE_VERSION=24
ARG BUILD_ENV=production

FROM node:${NODE_VERSION}-alpine

# Runtime environment variables
ENV NODE_ENV=${BUILD_ENV}
ENV PORT=3000

# Public variables (exposed to client - use sparingly)
ENV PUBLIC_API_URL=https://api.example.com

WORKDIR /app
COPY . .

# Use build arg during build
RUN if [ "$BUILD_ENV" = "production" ]; then \
      npm ci --production; \
    else \
      npm ci; \
    fi

RUN npm run build

EXPOSE ${PORT}

CMD ["node", "dist/server"]
```

Build with custom args:

```bash
# Build with custom Node version and environment
docker build \
  --build-arg NODE_VERSION=24 \
  --build-arg BUILD_ENV=production \
  -t philjs-app:latest \
  .

# Run with runtime environment variables
docker run \
  -e DATABASE_URL=postgresql://... \
  -e API_KEY=secret123 \
  -p 3000:3000 \
  philjs-app:latest
```

### Environment Variable Security

```dockerfile
# ❌ WRONG - hardcoded secrets in image
ENV API_KEY=secret123
ENV DATABASE_PASSWORD=password

# ✅ CORRECT - pass at runtime
# In Dockerfile: only set defaults
ENV PORT=3000
ENV NODE_ENV=production

# Then pass secrets at runtime:
# docker run -e API_KEY=secret123 -e DATABASE_URL=... philjs-app
```

### Using Docker Secrets (Swarm/Compose)

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    image: philjs-app
    secrets:
      - db_password
      - api_key
    environment:
      DATABASE_URL: postgresql://user:$(cat /run/secrets/db_password)@db:5432/myapp

secrets:
  db_password:
    external: true
  api_key:
    external: true
```

Create and use secrets:

```bash
# Create secrets
echo "my-db-password" | docker secret create db_password -
echo "my-api-key" | docker secret create api_key -

# Deploy with secrets
docker stack deploy -c docker-compose.prod.yml myapp
```

### Environment Variable Validation

Add validation in your application:

```typescript
// src/config/env.ts
interface Env {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  REDIS_URL: string;
  API_KEY: string;
  PUBLIC_API_URL: string;
}

function validateEnv(): Env {
  const requiredVars = [
    'DATABASE_URL',
    'REDIS_URL',
    'API_KEY',
    'PUBLIC_API_URL',
  ];

  const missing = requiredVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  return {
    NODE_ENV: (process.env.NODE_ENV as Env['NODE_ENV']) || 'production',
    PORT: parseInt(process.env.PORT || '3000', 10),
    DATABASE_URL: process.env.DATABASE_URL!,
    REDIS_URL: process.env.REDIS_URL!,
    API_KEY: process.env.API_KEY!,
    PUBLIC_API_URL: process.env.PUBLIC_API_URL!,
  };
}

export const env = validateEnv();
```

### Example .env Files

```bash
# .env.development
NODE_ENV=development
PORT=3000
PUBLIC_API_URL=http://localhost:4000
DATABASE_URL=postgresql://postgres:password@localhost:5432/myapp_dev
REDIS_URL=redis://localhost:6379
API_KEY=dev-api-key
LOG_LEVEL=debug

# .env.production
NODE_ENV=production
PORT=3000
PUBLIC_API_URL=https://api.example.com
DATABASE_URL=postgresql://user:${DB_PASSWORD}@db.example.com:5432/myapp_prod
REDIS_URL=redis://:${REDIS_PASSWORD}@redis.example.com:6379
API_KEY=${PRODUCTION_API_KEY}
LOG_LEVEL=info

# .env.test
NODE_ENV=test
PORT=3001
PUBLIC_API_URL=http://localhost:4001
DATABASE_URL=postgresql://postgres:password@localhost:5432/myapp_test
REDIS_URL=redis://localhost:6380
API_KEY=test-api-key
LOG_LEVEL=error
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
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/server"]
```

## Health Checks

Add health check to Dockerfile:

```dockerfile
FROM node:24-alpine

WORKDIR /app
COPY . .

RUN npm ci --production
RUN npm run build

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "dist/server"]
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
FROM node:24-alpine

# Use multi-stage builds
FROM node:24-alpine AS builder
# ... build
FROM node:24-alpine
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
FROM gcr.io/distroless/nodejs24-debian12

COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules

WORKDIR /app
CMD ["dist/server"]
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
