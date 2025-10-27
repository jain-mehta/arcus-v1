# -------------------------------
# 1️⃣ Builder (Combined deps + build)
# -------------------------------
FROM node:18-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.19.0

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build Next.js with standalone output
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build


# -------------------------------
# 3️⃣ Runner
# -------------------------------
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# For graceful shutdowns in Docker
RUN apk add --no-cache dumb-init

# Copy production build artifacts only
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
