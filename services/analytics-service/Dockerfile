# ---- Stage 1: Install dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY package*.json ./
RUN npm ci --omit=dev

# ---- Stage 2: Production runner ----
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=deps /usr/bin/dumb-init /usr/bin/dumb-init
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 4004
ENV NODE_ENV=production

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
