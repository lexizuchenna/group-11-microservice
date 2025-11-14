# Stage 1: Builder
FROM node:20-bullseye AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /usr/src/app

# Copy package.json and lockfile
COPY package.json pnpm-lock.yaml ./

# Install deps
RUN pnpm install --frozen-lockfile

# Copy all source code
COPY . .

# Set build-time environment for Prisma
ARG DATABASE_URL
ARG JWT_SECRET
ENV DATABASE_URL=$DATABASE_URL
ENV JWT_SECRET=$JWT_SECRET

# Generate Prisma client inside the container
RUN pnpm prisma generate

# Build TypeScript
RUN pnpm build

# Stage 2: Production
FROM node:20-bullseye
WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json and lockfile
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Copy built files and prisma client

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma /prisma
COPY --from=builder /usr/src/app/src/generated/prisma ./dist/generated/prisma
COPY --from=builder /usr/src/app/node_modules/@prisma/client ./node_modules/@prisma/client

EXPOSE 3001

CMD ["node", "dist/server.js"]
