FROM --platform=$BUILDPLATFORM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++ && corepack enable
WORKDIR /app

# Copy root workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
# Copy all workspace members to ensure dependencies are available
COPY packages ./packages
COPY apps ./apps
COPY patches ./patches

# Install dependencies
RUN pnpm config set store-dir /root/.local/share/pnpm/store/v3
RUN pnpm install

# Build the API application
RUN pnpm exec turbo run build --filter=@open-urbis/map-api

# Production stage
FROM --platform=$TARGETPLATFORM node:20-alpine AS runner
RUN corepack enable
WORKDIR /app

ENV NODE_ENV=production


# Copy everything from builder
COPY --from=builder /app ./

# Prune dev dependencies
RUN pnpm install --prod --frozen-lockfile

# Ensure express is available at the root if needed by NestJS platform-express in some configurations
# though usually the workspace symlinks should work.
# Added a check to verify it starts.

EXPOSE 3000

WORKDIR /app/apps/api

# Start the application from the app directory to ensure local node_modules are preferred
CMD ["node", "dist/app/src/main.js"]
