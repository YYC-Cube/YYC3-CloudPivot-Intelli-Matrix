# ── YYC³ Music API · 生产镜像 ──────────────────
# 构建: docker build -t yyc3-music-api .
# 运行: docker compose -f docker-compose.yml up -d
FROM docker.m.daocloud.io/library/node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --registry=https://registry.npmmirror.com

FROM docker.m.daocloud.io/library/node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S yyc3 && adduser -S yyc3 -G yyc3
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
USER yyc3
EXPOSE 3113
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3113/healthz || exit 1
CMD ["node", "src/server.js"]
