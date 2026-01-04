# Kubernetes Deployment Guide for PhilJS

This guide covers deploying PhilJS applications to Kubernetes.

## Prerequisites

- kubectl configured
- A Kubernetes cluster (EKS, GKE, AKS, or local)
- Container registry access

## Deployment Configuration

### deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: philjs-app
  labels:
    app: philjs-app
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
          image: your-registry/philjs-app:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
```

### service.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: philjs-service
spec:
  selector:
    app: philjs-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
```

### ingress.yaml

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: philjs-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - app.example.com
      secretName: philjs-tls
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: philjs-service
                port:
                  number: 80
```

## Deployment Commands

```bash
# Apply all configurations
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml

# Check status
kubectl get pods -l app=philjs-app
kubectl get services
kubectl get ingress

# View logs
kubectl logs -l app=philjs-app -f

# Scale
kubectl scale deployment philjs-app --replicas=5
```

## Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: philjs-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: philjs-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

## Best Practices

1. **Use ConfigMaps** for environment-specific configuration
2. **Use Secrets** for sensitive data (API keys, database credentials)
3. **Enable resource limits** to prevent runaway containers
4. **Configure health checks** for proper load balancing
5. **Use namespaces** to organize environments (dev, staging, prod)
