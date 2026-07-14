# Fancy AI™ Core —— Next.js 映像
# 設計原則：以「第一次就跑得起來」為優先（保留 prisma CLI 與 tsx，供 migrate/seed 使用）。
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 在受限或離線環境直接使用套件內已鎖定版本的 Alpine 引擎，避免建置時對外下載。
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 \
    PRISMA_SCHEMA_ENGINE_BINARY=/app/node_modules/@prisma/engines/schema-engine-linux-musl-openssl-3.0.x \
    PRISMA_QUERY_ENGINE_LIBRARY=/app/node_modules/@prisma/engines/libquery_engine-linux-musl-openssl-3.0.x.so.node
RUN test -x "$PRISMA_SCHEMA_ENGINE_BINARY" \
 && test -f "$PRISMA_QUERY_ENGINE_LIBRARY" \
 && npx prisma generate \
 && npm run build

FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production PORT=3000
RUN apk add --no-cache openssl

# Next.js standalone 產出
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

# migrate / seed 需要：prisma CLI、tsx、schema、seed 及其 import 的 src/lib/password
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/tsconfig.json ./tsconfig.json

EXPOSE 3000
CMD ["node", "server.js"]
