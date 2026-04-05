# ---- Stage 1: Install dependencies ----
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---- Stage 2: Production runner ----
FROM gcr.io/distroless/nodejs20-debian12 AS runner
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

USER nonroot

EXPOSE 4004
ENV NODE_ENV=production

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD ["/nodejs/bin/node", "healthcheck.js"]

CMD ["server.js"]
