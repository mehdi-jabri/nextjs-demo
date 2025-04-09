# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Install PNPM globally
RUN npm install -g pnpm

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Copy all source files and build the app
COPY . .
RUN pnpm run build

# Stage 2: Production Image
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV production

# Install PNPM globally in production image
RUN npm install -g pnpm

# Copy package files (for production install) and built assets
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js
# Copy .env.production if it exists
COPY --from=builder /app/.env.production ./.env.production

EXPOSE 3000
CMD ["pnpm", "start"]
