# Enterprise Kubernetes Deployment

This guide outlines the recommended architecture for deploying PhilJS apps to Kubernetes.

## Architecture

- **Ingress**: Nginx or Traefik
- **Service**: ClusterIP
- **Pods**: 
  - `philjs-app`: Node.js SSR container
  - `philjs-worker`: Background jobs (optional)
- **State**: External managed database (RDS, Mongo Atlas) + Redis for cache

## Deployment Manifest (Example)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: philjs-app
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: web
          image: myregistry/philjs-app:latest
          env:
            - name: NODE_ENV
              value: "production"
```
