
export * from './inertia';
export * from './phoenix';
export * from './active-record';

export const ConfigGenerators = {
    fly: () => \`
app = "philjs-app"
primary_region = "iad"

[build]
  image = "philjs/runtime:latest"

[http_service]
  internal_port = 3000
  force_https = true
\`,
  
  railway: () => \`
[build]
  builder = "NIXPACKS"
  buildCommand = "npm run build"

[deploy]
  startCommand = "npm start"
\`,

  gcloud: () => \`
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/philjs-app', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/philjs-app']
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args: ['run', 'deploy', 'philjs-app', '--image', 'gcr.io/$PROJECT_ID/philjs-app', '--region', 'us-central1']
\`
};
