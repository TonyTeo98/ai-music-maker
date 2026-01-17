# ===== Stage 1: Base - 安装依赖 =====
FROM node:22-alpine AS base

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@9.15.1 --activate

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY workers/media/package.json ./workers/media/
COPY packages/shared/package.json ./packages/shared/

# 安装所有依赖（包括 devDependencies，用于构建）
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# ===== Stage 2: Builder - 构建所有应用 =====
FROM base AS builder

WORKDIR /app

# 生成 Prisma Client
RUN cd packages/shared && pnpm exec prisma generate

# 构建所有应用（使用 turbo）
RUN pnpm build

# ===== Stage 3: API 服务 =====
FROM node:22-alpine AS api

RUN corepack enable && corepack prepare pnpm@9.15.1 --activate

WORKDIR /app

# 复制 package.json 和 lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# 只安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 复制构建产物
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/shared ./packages/shared

# 复制 Prisma schema（运行时需要）
COPY --from=builder /app/packages/shared/prisma ./packages/shared/prisma

# 生成 Prisma Client（生产环境）
RUN cd packages/shared && pnpm exec prisma generate

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "apps/api/dist/main.js"]

# ===== Stage 4: Worker 服务 =====
FROM node:22-alpine AS worker

RUN corepack enable && corepack prepare pnpm@9.15.1 --activate

WORKDIR /app

# 复制 package.json 和 lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY workers/media/package.json ./workers/media/
COPY packages/shared/package.json ./packages/shared/

# 只安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 复制构建产物
COPY --from=builder /app/workers/media/dist ./workers/media/dist
COPY --from=builder /app/packages/shared ./packages/shared

# 复制 Prisma schema（运行时需要）
COPY --from=builder /app/packages/shared/prisma ./packages/shared/prisma

# 生成 Prisma Client（生产环境）
RUN cd packages/shared && pnpm exec prisma generate

ENV NODE_ENV=production

CMD ["node", "workers/media/dist/index.js"]

# ===== Stage 5: Web 服务（Next.js） =====
FROM node:22-alpine AS web

RUN corepack enable && corepack prepare pnpm@9.15.1 --activate

WORKDIR /app

# Next.js standalone 模式会自动处理依赖
# 复制 standalone 输出
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
