# Docker 部署指南

## 快速开始

### 生产环境部署

1. **准备环境变量**
```bash
cp .env.docker .env
# 编辑 .env 填写实际的 API 密钥
```

2. **一键启动所有服务**
```bash
docker compose up -d
```

3. **查看服务状态**
```bash
docker compose ps
```

4. **查看日志**
```bash
# 所有服务
docker compose logs -f

# 特定服务
docker compose logs -f api
docker compose logs -f worker
docker compose logs -f web
```

5. **访问应用**
- Web 前端: http://localhost:3000
- API 后端: http://localhost:3001
- MinIO 控制台: http://localhost:9001 (minioadmin / minioadmin123)

### 开发环境（热重载）

```bash
# 使用开发配置启动
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 查看日志（开发模式会输出更多调试信息）
docker compose logs -f
```

## 服务架构

```
┌─────────────────────────────────────────────┐
│  Docker Network: aimm-network               │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │   Web   │  │   API   │  │ Worker  │    │
│  │  :3000  │─▶│  :3001  │◀─│         │    │
│  └─────────┘  └─────────┘  └─────────┘    │
│       │            │             │          │
│       │            ▼             ▼          │
│       │       ┌─────────┐  ┌─────────┐    │
│       │       │Postgres │  │  Redis  │    │
│       │       │  :5432  │  │  :6379  │    │
│       │       └─────────┘  └─────────┘    │
│       │                                     │
│       └──────────────────────────────────▶ │
│                                             │
│  外部服务:                                  │
│  - Cloudflare R2 (S3 兼容存储)             │
│  - CQTAI API (音乐生成)                    │
│  - Langfuse (可观测平台)                   │
└─────────────────────────────────────────────┘
```

## 多阶段构建说明

Dockerfile 使用多阶段构建优化镜像大小：

1. **base**: 安装所有依赖（包括 devDependencies）
2. **builder**: 构建所有应用（turbo build）
3. **api**: API 服务生产镜像（仅生产依赖）
4. **worker**: Worker 服务生产镜像（仅生产依赖）
5. **web**: Next.js 服务生产镜像（standalone 模式）

## 常用命令

### 重新构建镜像
```bash
# 重新构建所有服务
docker compose build

# 重新构建特定服务
docker compose build api
docker compose build worker
docker compose build web

# 不使用缓存重新构建
docker compose build --no-cache
```

### 停止和清理
```bash
# 停止所有服务
docker compose down

# 停止并删除数据卷（危险！会删除数据库数据）
docker compose down -v

# 停止并删除镜像
docker compose down --rmi all
```

### 数据库管理
```bash
# 进入 Postgres 容器
docker compose exec postgres psql -U aimm -d aimm

# 运行数据库迁移（在 API 容器中）
docker compose exec api sh -c "cd packages/shared && pnpm exec prisma migrate deploy"

# 查看数据库状态
docker compose exec api sh -c "cd packages/shared && pnpm exec prisma migrate status"
```

### 调试
```bash
# 进入容器 shell
docker compose exec api sh
docker compose exec worker sh
docker compose exec web sh

# 查看容器资源使用
docker stats

# 查看网络配置
docker network inspect aimm-network
```

## 环境变量说明

### 必填变量（需要在 .env 中配置）

- `S3_ACCESS_KEY`: Cloudflare R2 访问密钥
- `S3_SECRET_KEY`: Cloudflare R2 密钥
- `CQTAI_API_KEY`: CQTAI 音乐生成 API 密钥
- `LANGFUSE_PUBLIC_KEY`: Langfuse 公钥
- `LANGFUSE_SECRET_KEY`: Langfuse 密钥

### 自动配置变量（Docker 内部网络）

- `DATABASE_URL`: 自动指向 postgres:5432
- `REDIS_URL`: 自动指向 redis:6379

## 健康检查

所有服务都配置了健康检查：

- **postgres**: `pg_isready` 每 5 秒检查
- **redis**: `redis-cli ping` 每 5 秒检查
- **minio**: HTTP 健康端点每 10 秒检查
- **api**: `/health` 端点每 10 秒检查（启动后 30 秒开始）
- **web**: 根路径每 10 秒检查（启动后 30 秒开始）

服务依赖关系确保启动顺序：
```
postgres/redis → api → worker
                  ↓
                 web
```

## 故障排查

### 服务无法启动
```bash
# 查看详细日志
docker compose logs api

# 检查健康状态
docker compose ps

# 重启特定服��
docker compose restart api
```

### 数据库连接失败
```bash
# 检查 Postgres 是否健康
docker compose exec postgres pg_isready -U aimm

# 检查网络连接
docker compose exec api ping postgres
```

### 构建失败
```bash
# 清理 Docker 缓存
docker builder prune

# 完全重新构建
docker compose build --no-cache
```

## 生产部署建议

1. **使用外部数据库**: 生产环境建议使用托管数据库服务（如 AWS RDS、Supabase）
2. **配置反向代理**: 使用 Nginx/Caddy 作为反向代理，配置 HTTPS
3. **资源限制**: 在 docker-compose.yml 中添加 `deploy.resources` 限制
4. **日志管理**: 配置日志驱动（如 json-file 或 syslog）
5. **监控**: 集成 Prometheus + Grafana 监控容器指标
6. **备份**: 定期备份 `.docker-data/postgres` 目录

## 开发 vs 生产

| 特性 | 开发模式 | 生产模式 |
|------|---------|---------|
| 构建 Stage | base | api/worker/web |
| 源代码挂载 | ✅ | ❌ |
| 热重载 | ✅ | ❌ |
| 镜像大小 | 大 | 小 |
| 启动命令 | `pnpm dev` | `node dist/...` |
| NODE_ENV | development | production |

## 端口映射

| 服务 | 容器端口 | 主机端口 | 说明 |
|------|---------|---------|------|
| web | 3000 | 3000 | Next.js 前端 |
| api | 3001 | 3001 | NestJS API |
| postgres | 5432 | 5432 | PostgreSQL |
| redis | 6379 | 6379 | Redis |
| minio | 9000 | 9000 | MinIO S3 API |
| minio | 9001 | 9001 | MinIO 控制台 |
