import { defineConfig } from 'vite';
import { cloudflarePagesAdapter } from 'philjs-adapters/cloudflare-pages';

export default defineConfig({
  plugins: [
    cloudflarePagesAdapter({
      kv: [
        {
          binding: 'CACHE',
          id: process.env.KV_ID || 'preview-kv-id',
          preview_id: 'preview-kv-id'
        }
      ],
      d1: [
        {
          binding: 'DB',
          database_id: process.env.D1_ID || 'preview-db-id',
          database_name: 'my-database',
          preview_database_id: 'preview-db-id'
        }
      ],
      r2: [
        {
          binding: 'UPLOADS',
          bucket_name: 'my-uploads',
          preview_bucket_name: 'preview-uploads'
        }
      ],
      vars: {
        ENVIRONMENT: 'production',
        API_URL: 'https://api.example.com'
      }
    })
  ]
});
