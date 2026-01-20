FROM node:20-alpine

# Setup pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy all files (required for monorepo workspace resolution)
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the API application
RUN pnpm exec turbo run build --filter=@open-urbis/map-api

EXPOSE 3000

# Start the application
CMD ["node", "apps/api/dist/app/main.js"]
