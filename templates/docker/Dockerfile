# PhilJS Docker Template

FROM node:24-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build
RUN corepack enable pnpm && pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 philjs
USER philjs

# Copy built assets
COPY --from=builder --chown=philjs:nodejs /app/dist ./dist
COPY --from=builder --chown=philjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=philjs:nodejs /app/package.json ./package.json

EXPOSE 3000

CMD ["node", "dist/server.js"]
