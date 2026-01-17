# 存储配置指南

本项目支持两种存储方案，可以根据环境灵活切换。

## 存储方案对比

| 特性 | MinIO（本地） | Cloudflare R2（云端） |
|------|--------------|---------------------|
| **速度** | 极快（本地网络） | 较快（CDN 加速） |
| **成本** | 免费 | 按量付费（$0.015/GB/月） |
| **网络** | 无需网络 | 需要网络连接 |
| **适用场景** | 开发、测试 | 生产、分享 |
| **数据持久化** | 本地磁盘 | 云端存储 |

## 配置方式

### 方案 1: MinIO（推荐用于开发）

**优点**：
- ✅ 快速：本地网络，上传/下载速度快
- ✅ 免费：无需付费，无流量限制
- ✅ 离线：不需要网络连接
- ��� 隔离：开发数据不会影响生产环境

**配置**（.env）：
```bash
USE_LOCAL_STORAGE=true
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin123"
S3_BUCKET="aimm-assets"
S3_REGION="us-east-1"
```

**启动 MinIO**：
```bash
docker compose up -d minio
```

**访问 MinIO 控制台**：
- URL: http://localhost:9001
- 用户名: minioadmin
- 密码: minioadmin123

---

### 方案 2: Cloudflare R2（推荐用于生产）

**优点**：
- ✅ 可靠：云端存储，数据持久化
- ✅ 全球 CDN：访问速度快
- ✅ 公开访问：支持分享链接
- ✅ 成本低：比 S3 便宜 10 倍

**配置**（.env）：
```bash
USE_LOCAL_STORAGE=false
S3_ENDPOINT="https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com"
S3_ACCESS_KEY="your_r2_access_key"
S3_SECRET_KEY="your_r2_secret_key"
S3_BUCKET="aimm"
S3_REGION="auto"
R2_PUBLIC_URL="https://your-public-domain.com"
```

**获取 R2 凭证**：
1. 登录 Cloudflare Dashboard
2. 进入 R2 → 创建 Bucket
3. 创建 API Token（读写权限）
4. 配置自定义域名（可选，用于公开访问）

---

## 切换存储方案

### 开发 → 生产切换

1. **备份 .env 文件**：
   ```bash
   cp .env .env.backup
   ```

2. **更新存储配置**：
   ```bash
   # 修改 .env 文件
   USE_LOCAL_STORAGE=false
   S3_ENDPOINT="https://xxx.r2.cloudflarestorage.com"
   # ... 其他 R2 配置
   ```

3. **重启服务**：
   ```bash
   docker compose restart api worker
   ```

### 数据迁移（可选）

如果需要将 MinIO 数据迁移到 R2：

```bash
# 使用 AWS CLI 或 rclone 工具
aws s3 sync s3://aimm-assets/ s3://your-r2-bucket/ \
  --endpoint-url http://localhost:9000 \
  --profile minio
```

---

## 混合使用（高级）

可以同时使用两种存储：
- **开发环境**：MinIO（快速迭代）
- **生产环境**：R2（真实数据）

通过环境变量控制：
```bash
# 开发环境
NODE_ENV=development USE_LOCAL_STORAGE=true

# 生产环境
NODE_ENV=production USE_LOCAL_STORAGE=false
```

---

## 故障排查

### MinIO 无法访问

```bash
# 检查 MinIO 容器状态
docker compose ps minio

# 查看 MinIO 日志
docker compose logs minio

# 重启 MinIO
docker compose restart minio
```

### R2 连接失败

1. 检查 API Token 是否有效
2. 确认 Bucket 名称正确
3. 验证网络连接
4. 检查 Endpoint URL 格式

```bash
# 测试 R2 连接
curl -I https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
```

---

## 成本估算

### MinIO
- **存储成本**: $0（本地磁盘）
- **流量成本**: $0
- **总成本**: **免费**

### Cloudflare R2
假设：1000 用户 × 10 首歌 × 2 变体 × 6.1MB = 122GB

- **存储成本**: 122GB × $0.015/GB/月 = **$1.83/月**
- **流量成本**: 前 10GB 免费，之后 $0.01/GB
- **总成本**: **约 $2-5/月**（取决于访问量）

---

## 推荐配置

| 环境 | 存储方案 | 理由 |
|------|---------|------|
| **本地开发** | MinIO | 快速、免费、离线 |
| **CI/CD 测试** | MinIO | 隔离、可重复 |
| **预发布环境** | R2 | 接近生产环境 |
| **生产环境** | R2 | 可靠、CDN、公开访问 |

---

## 总结

- ✅ **保留 MinIO**：作为本地开发的默认选项
- ✅ **使用 R2**：生产环境和需要分享的场景
- ✅ **灵活切换**：通过环境变量控制，无需修改代码
- ✅ **成本优化**：开发用 MinIO，生产用 R2

**建议**：开发阶段使用 MinIO，部署前切换到 R2。
