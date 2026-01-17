# 测试指南

## 快速开始

### 1. Provider Mock 测试（无需 API Key）

测试 CQTAI Provider 的 mock 模式，验证基础逻辑：

```bash
pnpm test:provider
```

**预期输出**：
- ✅ 提交任务成功（返回 mock task ID）
- ✅ 状态轮询正常（pending → processing → completed）
- ✅ 返回 2 个 A/B 变体

---

### 2. R2 配置测试（验证存储配置）

测试 Cloudflare R2 或 MinIO 配置是否正确：

```bash
pnpm test:r2
```

**测试内容**：
- ✅ 环境变量检查
- ✅ S3 连接测试
- ✅ 文件上传测试
- ✅ 文件下载测试
- ✅ 公开 URL 访问测试（如果配置了 R2_PUBLIC_URL）

**前置条件**：
- 开发环境：启动 MinIO（`pnpm docker:up`）
- 生产环境：配置 R2（参考 [R2 配置指南](../docs/R2-SETUP.md)）

---

### 3. 端到端测试（需要真实环境）

测试完整流程：API + Worker + Database + CQTAI

#### 前置条件

1. **启动基础设施**：
   ```bash
   pnpm docker:up
   ```
   这会启动：PostgreSQL、Redis、MinIO

2. **配置环境变量**（`.env`）：
   ```bash
   # 必需
   DATABASE_URL="postgresql://aimm:aimm_dev_password@localhost:5432/aimm?schema=public"
   REDIS_URL="redis://localhost:6379"
   S3_ENDPOINT="http://localhost:9000"
   S3_ACCESS_KEY="minioadmin"
   S3_SECRET_KEY="minioadmin123"
   S3_BUCKET="aimm-assets"

   # CQTAI API Key（必需）
   CQTAI_API_KEY="your_api_key_here"
   CQTAI_API_BASE_URL="https://api.cqtai.com"
   ```

3. **运行数据库迁移**：
   ```bash
   cd apps/api
   npx prisma migrate dev
   ```

4. **启动服务**：
   ```bash
   # 终端 1：启动 API + Web
   pnpm dev

   # 终端 2：启动 Worker
   cd workers/media
   pnpm dev
   ```

#### 运行测试

```bash
pnpm test:e2e
```

**测试流程**：
1. ✅ 健康检查
2. ✅ 创建 Track
3. ✅ 创建 Asset（获取预签名 URL）
4. ✅ 确认上传完成
5. ✅ 提交生成任务
6. ✅ 轮询任务状态（最多 5 分钟）
7. ✅ 验证 A/B 变体
8. ✅ 获取 Track 详情

**预期结果**：
- 任务状态：`succeeded`
- 变体数量：2（A 和 B）
- Track 状态：`ready`

---

## 故障排查

### Provider Mock 测试失败

**问题**：`Cannot find module '../workers/media/src/providers/cqtai'`

**解决**：
```bash
cd workers/media
pnpm install
pnpm build
```

---

### E2E 测试失败

#### 1. API 未启动

**错误**：`❌ API 未启动，请先运行 pnpm dev`

**解决**：
```bash
pnpm dev
```

#### 2. Worker 未启动

**错误**：任务一直处于 `queued` 状态

**解决**：
```bash
cd workers/media
pnpm dev
```

#### 3. CQTAI API Key 未配置

**错误**：`[CQTAIProvider] No API key, using mock mode`

**解决**：在 `.env` 中配置 `CQTAI_API_KEY`

#### 4. 任务失败

**错误**：`❌ 任务失败: GEN_PROVIDER_ERROR`

**排查步骤**：
1. 检查 Worker 日志：
   ```bash
   cd workers/media
   pnpm dev
   ```
2. 检查 CQTAI API 响应：
   - 查看 Worker 日志中的 API 请求/响应
   - 验证 API Key 是否有效
   - 检查音频 URL 是否可访问

#### 5. 数据库连接失败

**错误**：`Can't reach database server`

**解决**：
```bash
pnpm docker:up
# 等待 PostgreSQL 启动完成（约 10 秒）
```

---

## 手动测试

如果自动化测试失败，可以手动测试：

### 1. 测试 API

```bash
# 健康检查
curl http://localhost:3001/health

# 创建 Track
curl -X POST http://localhost:3001/tracks \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test_device","title":"Test Track"}'
```

### 2. 测试 Worker

```bash
cd workers/media
pnpm dev

# 观察日志，确认 Worker 正常连接到 Redis
```

### 3. 测试 CQTAI Provider

```bash
# 进入 Node REPL
cd workers/media
node --loader ts-node/esm

# 测试 Provider
import { cqtaiProvider } from './src/providers/cqtai.js'
const result = await cqtaiProvider.submitGenerate({
  audioUrl: 'https://example.com/test.mp3',
  style: 'Pop',
  lyrics: 'Test'
})
console.log(result)
```

---

## 下一步

测试通过后：

1. **访问 Web 界面**：http://localhost:3000
2. **上传音频并生成**
3. **播放 A/B 变体**
4. **选择主版本并分享**

---

## 性能基准

**预期时间**（使用 CQTAI）：
- 任务提交：< 1s
- 音乐生成：60-120s（取决于 CQTAI 队列）
- 总耗时：约 2 分钟

**Mock 模式**：
- 任务提交：< 100ms
- 模拟生成：10s
- 总耗时：约 10 秒
