FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies layer
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# Build layer
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production layer
FROM base AS runner
ENV NODE_ENV=production

# Copy built artifacts and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

# Expose port
EXPOSE 3000

# Run migrations and start server
CMD ["sh", "-c", "node dist/db/migrate.js && npm start"]
