# Multi-stage build for production

FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# Copy source and build frontend
COPY . .
RUN npm run build

############################################
# Runtime image
FROM node:20-bookworm-slim AS runner

ENV NODE_ENV=production
WORKDIR /app

# Copy only needed artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/index.html ./index.html
COPY --from=builder /app/data/migrations ./data/migrations

# Ensure data directory exists at runtime
RUN mkdir -p /app/data && mkdir -p /app/uploads

EXPOSE 3000

CMD ["node", "server.js"]
