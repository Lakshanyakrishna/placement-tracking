# ============================================================
# Stage 1: Base
# ============================================================
FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache tzdata curl postgresql-client netcat-openbsd

ENV TZ=UTC

# ============================================================
# Stage 2: Dependencies
# ============================================================
FROM base AS deps

COPY package*.json ./

RUN npm ci

# ============================================================
# Stage 3: Build
# ============================================================
FROM deps AS build

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ============================================================
# Stage 4: Development
# ============================================================
FROM deps AS development

COPY --from=deps /app/node_modules ./node_modules
COPY infrastructure/docker/app/entrypoint.dev.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "run", "start:dev"]

# ============================================================
# Stage 5: Production
# ============================================================
FROM base AS production

RUN apk add --no-cache curl

COPY --from=build /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY infrastructure/docker/app/entrypoint.prod.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

USER node

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/main.js"]
