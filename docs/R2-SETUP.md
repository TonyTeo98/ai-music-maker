# Cloudflare R2 配置指南

本文档说明如何配置 Cloudflare R2 作为生产环境的对象存储。

## 为什么需要 R2？

开发环境使用 MinIO（本地 S3），但 CQTAI API 需要公开可访问的音频 URL。R2 提供：
- 公开访问能力（通过自定义域名）
- 全球 CDN 加速
- 零出口流量费用
- S3 兼容 API

## 配置步骤

### 1. 创建 R2 Bucket

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左侧菜单 → **R2** → **Create bucket**
3. 配置：
   - **Bucket name**: `aimm-assets`（或自定义）
   - **Location**: Automatic（推荐）
4. 点击 **Create bucket**

### 2. 获取 API Token

1. 在 R2 页面，点击右上角 **Manage R2 API Tokens**
2. 点击 **Create API Token**
3. 配置：
   - **Token name**: `aimm-production`
   - **Permissions**: ✓ Object Read & Write
   - **TTL**: Forever（或根据安全策略）
4. 点击 **Create API Token**
5. **立即保存**以下信息（只显示一次）：
   - Access Key ID
   - Secret Access Key
   - Endpoint URL（格式：`https://<account_id>.r2.cloudflarestorage.com`）

### 3. 配置自定义域名

#### 3.1 在 R2 中绑定域名

1. 进入 Bucket 详情页
2. **Settings** → **Public access** → **Connect domain**
3. 输入域名：`cdn.yourdomain.com`（替换为你的域名）
4. 点击 **Continue**

#### 3.2 配置 DNS

**如果域名在 Cloudflare**：
- Cloudflare 会自动添加 CNAME 记录，无需手动操作

**如果域名不在 Cloudflare**：
- 在你的 DNS 提供商添加 CNAME 记录：
  ```
  类型: CNAME
  名称: cdn
  目标: <bucket-name>.<account-id>.r2.cloudflarestorage.com
  TTL: 自动或 300
  ```

#### 3.3 验证域名

等待 DNS 生效（1-5 分钟），然后测试：

```bash
# 上传测试文件到 R2
curl -X PUT "https://<account_id>.r2.cloudflarestorage.com/aimm-assets/test.txt" \
  -H "Authorization: Bearer <access_key>:<secret_key>" \
  -d "Hello R2"

# 通过自定义域名访问
curl https://cdn.yourdomain.com/test.txt
# 应该返回: Hello R2
```

### 4. 配置环境变量

编辑 `.env.local`（或生产环境配置）：

```bash
# ===== S3/R2 配置 =====
S3_ENDPOINT="https://<account_id>.r2.cloudflarestorage.com"
S3_ACCESS_KEY="<R2 Access Key ID>"
S3_SECRET_KEY="<R2 Secret Access Key>"
S3_BUCKET="aimm-assets"
S3_REGION="auto"

# ===== R2 公开 URL =====
R2_PUBLIC_URL="https://cdn.yourdomain.com"
```

**重要说明**：
- `S3_ENDPOINT`: R2 的 API 端点（用于上传）
- `R2_PUBLIC_URL`: 自定义域名（用于生成公开访问 URL）
- 不要在 `R2_PUBLIC_URL` 末尾加 `/`

### 5. 重启服务

```bash
# 重启 API 服务
pnpm dev

# 或在生产环境
pm2 restart api
```

## 工作原理

### 开发环境（MinIO）

```
用户上传 → MinIO → 生成签名 URL（有效期 1 小时）
示例: http://localhost:9000/aimm-assets/uploads/xxx.mp3?signature=...
```

### 生产环境（R2）

```
用户上传 → R2 → 生成公开 URL（永久有效）
示例: https://cdn.yourdomain.com/uploads/xxx.mp3
```

### 代码逻辑

```typescript
// StorageService.getPublicUrl()
if (R2_PUBLIC_URL) {
  // 生产环境：返回公开 URL
  return `${R2_PUBLIC_URL}/${key}`
} else {
  // 开发环境：返回签名 URL
  return getPresignedDownloadUrl(key)
}
```

## 安全配置

### CORS 配置（必需）

由于前端直接上传文件到 R2，必须配置 CORS 规则。

#### 方法 1：通过 Cloudflare Dashboard

1. 进入 Bucket 详情页
2. **Settings** → **CORS Policy**
3. 添加以下规则：

```json
[
  {
    "AllowedOrigins": [
      "https://yourdomain.com",
      "https://www.yourdomain.com",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

**说明**：
- `AllowedOrigins`: 允许的前端域名（生产 + 开发环境）
- `AllowedMethods`:
  - `GET`: 播放音频（虽然 `<audio>` 不需要，但为未来功能预留）
  - `PUT`: 上传文件（必需）
  - `HEAD`: 检查文件是否存在
- `AllowedHeaders`: 允许所有请求头（包括 `Content-Type`）
- `ExposeHeaders`: 暴露 `ETag` 响应头（用于验证上传）
- `MaxAgeSeconds`: 预检请求缓存时间（1 小时）

#### 方法 2：通过 AWS CLI（推荐用于自动化）

创建 `cors.json`：

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "https://yourdomain.com",
        "https://www.yourdomain.com",
        "http://localhost:3000"
      ],
      "AllowedMethods": ["GET", "PUT", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

应用配置：

```bash
aws s3api put-bucket-cors \
  --bucket aimm-assets \
  --cors-configuration file://cors.json \
  --endpoint-url https://<account_id>.r2.cloudflarestorage.com
```

验证配置：

```bash
aws s3api get-bucket-cors \
  --bucket aimm-assets \
  --endpoint-url https://<account_id>.r2.cloudflarestorage.com
```

### Bucket 权限

R2 Bucket 默认是私有的，只有通过自定义域名才能公开访问。建议配置：

1. **生命周期规则**（自动清理临时文件）：
   ```json
   {
     "Rules": [
       {
         "Id": "delete-pending-uploads",
         "Prefix": "uploads/pending/",
         "Status": "Enabled",
         "Expiration": {
           "Days": 7
         }
       }
     ]
   }
   ```

### API Token 权限

建议为不同环境创建不同的 Token：
- **开发环境**: 限制为特定 Bucket，Read & Write
- **生产环境**: 限制为特定 Bucket，Read & Write
- **CI/CD**: 只读权限（如果需要）

## 成本估算

Cloudflare R2 定价（2026 年）：
- **存储**: $0.015/GB/月
- **Class A 操作**（写入）: $4.50/百万次
- **Class B 操作**（读取）: $0.36/百万次
- **出口流量**: 免费 ✨

示例成本（月活 1000 用户）：
- 存储 100GB 音频: $1.50
- 10 万次上传: $0.45
- 100 万次下载: $3.60
- 出口流量 1TB: $0
- **总计**: ~$6/月

## 故障排查

### 问题 1: 无法访问自定义域名

**症状**: `curl https://cdn.yourdomain.com/test.txt` 返回 404

**排查**:
```bash
# 1. 检查 DNS 是否生效
dig cdn.yourdomain.com

# 2. 检查 CNAME 记录
nslookup cdn.yourdomain.com

# 3. 检查文件是否存在
aws s3 ls s3://aimm-assets/ \
  --endpoint-url https://<account_id>.r2.cloudflarestorage.com
```

**解决**:
- 等待 DNS 传播（最多 24 小时）
- 检查 Cloudflare 中的域名绑定状态
- 确认文件已上传到 R2

### 问题 2: CQTAI API 仍然报错

**症状**: CQTAI 返回 "无法访问音频 URL"

**排查**:
```bash
# 测试 URL 是否公开可访问
curl -I https://cdn.yourdomain.com/uploads/xxx.mp3

# 应该返回 200 OK，而不是 403 Forbidden
```

**解决**:
- 确认 R2 Bucket 已启用公开访问
- 确认自定义域名已正确绑定
- 检查 `R2_PUBLIC_URL` 环境变量是否正确

### 问题 3: 上传失败

**症状**: API 返回 "Failed to upload"

**排查**:
```bash
# 检查 API Token 权限
aws s3 cp test.txt s3://aimm-assets/ \
  --endpoint-url https://<account_id>.r2.cloudflarestorage.com \
  --profile r2
```

**解决**:
- 检查 `S3_ACCESS_KEY` 和 `S3_SECRET_KEY` 是否正确
- 确认 API Token 有 Write 权限
- 检查 Bucket 名称是否正确

## 迁移现有数据

如果已有 MinIO 数据需要迁移到 R2：

```bash
# 使用 rclone 迁移
rclone sync minio:aimm-assets r2:aimm-assets \
  --progress \
  --transfers 10

# 或使用 AWS CLI
aws s3 sync s3://aimm-assets s3://aimm-assets \
  --source-endpoint-url http://localhost:9000 \
  --endpoint-url https://<account_id>.r2.cloudflarestorage.com
```

## 参考资料

- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [R2 定价](https://developers.cloudflare.com/r2/pricing/)
- [S3 API 兼容性](https://developers.cloudflare.com/r2/api/s3/api/)
