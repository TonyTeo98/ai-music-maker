# 日志系统使用指南

## 概述

项目已集成 **Langfuse** 可观测平台，用于追踪和分析音乐生成流程。同时使用 **console.log** 进行实时日志输出。

## 日志系统架构

### 1. Langfuse（可观测平台）

**用途**：结构化追踪、性能分析、用户行为分析

**配置**（`.env`）：
```bash
LANGFUSE_PUBLIC_KEY="pk-lf-58cd0e7c-eec9-4679-8842-da304c98a91f"
LANGFUSE_SECRET_KEY="sk-lf-a7f6e2bb-6f51-4d57-bf90-8ed1ba8fd4fd"
LANGFUSE_HOST="https://us.cloud.langfuse.com"
```

**访问地址**：https://us.cloud.langfuse.com

**追踪内容**：
- 每个生成任务的完整生命周期
- 各步骤的耗时（audio_check、compose_params、music_generate、ab_eval）
- 输入参数（style、lyrics、voiceType 等）
- 输出结果（variants、audioUrl、duration）
- 用户选择（chosen_variant: A/B）
- 自动评分（input_similarity、audio_quality、ab_diversity）

### 2. Console 日志（实时输出）

**用途**：开发调试、实时监控

**查看方式**：
```bash
# API 日志
tail -f /tmp/aimm-dev.log | grep "api"

# Worker 日志
tail -f /tmp/aimm-dev.log | grep "Worker"

# 所有日志
tail -f /tmp/aimm-dev.log
```

## 日志追踪流程

### 完整生成流程的日志

```
[Worker] Processing job cmki441s5000papnyciu3lu87, type: generate
[GenerateHandler] Starting job cmki441s5000papnyciu3lu87 for track cmki43yxy000lapny7z55qltq
[Langfuse] Created trace: cmki441s5000papnyciu3lu87
[GenerateHandler] Step: audio_check
[GenerateHandler] Step: compose_params
[GenerateHandler] Step: music_generate
[GenerateHandler] Provider task submitted: mock_task_1768642551677
[GenerateHandler] Step: ab_eval
[Langfuse] Created span: audio_check for trace cmki441s5000papnyciu3lu87
[Langfuse] Created span: compose_params for trace cmki441s5000papnyciu3lu87
[Langfuse] Created span: music_generate for trace cmki441s5000papnyciu3lu87
[Langfuse] Created span: ab_eval for trace cmki441s5000papnyciu3lu87
[GenerateHandler] Job cmki441s5000papnyciu3lu87 completed successfully
[Worker] Job cmki441s5000papnyciu3lu87 completed
```

### 关键日志标识

| 标识 | 含义 | 示例 |
|------|------|------|
| `[Worker]` | Worker 进程日志 | `[Worker] Processing job xxx` |
| `[GenerateHandler]` | 生成处理器日志 | `[GenerateHandler] Step: music_generate` |
| `[CQTAIProvider]` | CQTAI API 调用 | `[CQTAIProvider] No API key, using mock mode` |
| `[Langfuse]` | 可观测追踪 | `[Langfuse] Created trace: xxx` |
| `[API]` | API 服务日志 | `API running on http://localhost:3001` |

## 问题回溯方法

### 方法 1：通过 Job ID 追踪

**场景**：用户报告生成失败

**步骤**：

1. **获取 Job ID**（前端显示或数据库查询）：
   ```bash
   # 从数据库获取最近的失败任务
   psql -d aimm -c "SELECT id, status, \"errorMsg\" FROM \"Job\" WHERE status='failed' ORDER BY \"createdAt\" DESC LIMIT 5;"
   ```

2. **查看 Console 日志**：
   ```bash
   # 搜索特定 Job ID 的所有日志
   grep "cmki441s5000papnyciu3lu87" /tmp/aimm-dev.log
   ```

3. **查看 Langfuse Trace**：
   - 访问 https://us.cloud.langfuse.com
   - 搜索 Trace ID（等于 Job ID）
   - 查看完整的执行流程和耗时

### 方法 2：通过 Track ID 追踪

**场景**：用户报告某个作品有问题

**步骤**：

1. **获取 Track ID**（从 URL 或数据库）：
   ```bash
   # 查询 Track 的所有 Job
   psql -d aimm -c "SELECT id, status, progress, \"errorMsg\" FROM \"Job\" WHERE \"trackId\"='cmki43yxy000lapny7z55qltq' ORDER BY \"createdAt\" DESC;"
   ```

2. **查看相关日志**：
   ```bash
   grep "cmki43yxy000lapny7z55qltq" /tmp/aimm-dev.log
   ```

### 方法 3：通过时间范围追踪

**场景**：某个时间段出现大量失败

**步骤**：

1. **查询时间范围内的任务**：
   ```bash
   psql -d aimm -c "SELECT id, status, \"errorMsg\", \"createdAt\" FROM \"Job\" WHERE \"createdAt\" BETWEEN '2026-01-17 09:00:00' AND '2026-01-17 10:00:00' AND status='failed';"
   ```

2. **查看日志**：
   ```bash
   # 查看特定时间段的日志
   grep "2026-01-17 09:" /tmp/aimm-dev.log | grep "ERROR\|failed"
   ```

3. **Langfuse 分析**：
   - 使用 Langfuse 的时间过滤器
   - 查看该时间段的 Trace 列表
   - 分析失败模式

### 方法 4：通过错误类型追踪

**场景**：特定类型的错误频繁出现

**步骤**：

1. **统计错误类型**：
   ```bash
   psql -d aimm -c "SELECT \"errorMsg\", COUNT(*) as count FROM \"Job\" WHERE status='failed' GROUP BY \"errorMsg\" ORDER BY count DESC;"
   ```

2. **查找相关日志**：
   ```bash
   # 搜索特定错误
   grep "DOWNLOAD_SOURCE_FAILED" /tmp/aimm-dev.log
   ```

3. **Langfuse 过滤**：
   - 使用 Langfuse 的 Metadata 过滤
   - 查看所有包含该错误的 Trace

## 常见问题诊断

### 问题 1：音频上传失败

**日志关键词**：`Upload failed`、`S3`、`presign`

**查看位置**：
- API 日志：`/assets/presign` 端点
- 浏览器 Network 面板

**诊断命令**：
```bash
# 测试 R2 连接
pnpm test:r2

# 查看上传相关日志
grep "presign\|Upload" /tmp/aimm-dev.log
```

### 问题 2：CQTAI API 调用失败

**日志关键词**：`CQTAI API error`、`DOWNLOAD_SOURCE_FAILED`

**查看位置**：
- Worker 日志：`[CQTAIProvider]`
- Langfuse Trace：`music_generate` span

**诊断命令**：
```bash
# 查看 CQTAI 相关日志
grep "CQTAI" /tmp/aimm-dev.log

# 测试音频 URL 可访问性
curl -I "https://aimmcdn.mxzt.de/uploads/xxx.wav"
```

### 问题 3：生成超时

**日志关键词**：`GEN_PROVIDER_TIMEOUT`、`timeout`

**查看位置**：
- Worker 日志：`[GenerateHandler]`
- Langfuse Trace：查看 `music_generate` span 的耗时

**诊断命令**：
```bash
# 查看超时任务
psql -d aimm -c "SELECT id, progress, \"errorMsg\" FROM \"Job\" WHERE \"errorMsg\" LIKE '%TIMEOUT%';"

# 查看 Provider 轮询日志
grep "Provider.*poll\|timeout" /tmp/aimm-dev.log
```

### 问题 4：数据库连接问题

**日志关键词**：`Prisma`、`database`、`connection`

**查看位置**：
- API/Worker 启动日志

**诊断命令**：
```bash
# 测试数据库连接
psql -d aimm -c "SELECT 1;"

# 查看 Prisma 日志
grep "Prisma" /tmp/aimm-dev.log
```

## Langfuse 使用技巧

### 1. 查看单个任务的完整流程

1. 访问 https://us.cloud.langfuse.com
2. 点击 **Traces**
3. 搜索 Job ID（Trace ID）
4. 查看：
   - 总耗时
   - 各步骤耗时（Spans）
   - 输入参数（Input）
   - 输出结果（Output）
   - 评分（Scores）

### 2. 分析性能瓶颈

1. 点击 **Traces** → **Filter by duration**
2. 查看耗时最长的任务
3. 展开 Spans，找到最慢的步骤
4. 分析原因（通常是 `music_generate` 步骤）

### 3. 用户行为分析

1. 点击 **Scores**
2. 查看 `chosen_variant` 分布（A vs B）
3. 分析用户偏好

### 4. 错误率监控

1. 点击 **Traces** → **Filter by status**
2. 选择 **Error**
3. 查看错误分布和趋势

## 日志保留策略

### Console 日志

**当前**：输出到 `/tmp/aimm-dev.log`（开发环境）

**生产环境建议**：
```bash
# 使用 PM2 管理日志
pm2 start pnpm --name "aimm-api" -- dev --log /var/log/aimm/api.log

# 日志轮转
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 7
```

### Langfuse 数据

**保留期限**：根据 Langfuse 计划
- Free Plan: 30 天
- Pro Plan: 90 天
- Enterprise: 自定义

**导出数据**：
```bash
# 通过 Langfuse API 导出
curl -X GET "https://us.cloud.langfuse.com/api/public/traces" \
  -H "Authorization: Bearer $LANGFUSE_PUBLIC_KEY"
```

## 实时监控命令

### 开发环境

```bash
# 实时查看所有日志
tail -f /tmp/aimm-dev.log

# 只看错误
tail -f /tmp/aimm-dev.log | grep "ERROR\|failed\|error"

# 只看 Worker
tail -f /tmp/aimm-dev.log | grep "Worker"

# 只看 CQTAI
tail -f /tmp/aimm-dev.log | grep "CQTAI"
```

### 生产环境

```bash
# PM2 日志
pm2 logs aimm-api --lines 100

# 实时监控
pm2 monit

# 查看错误
pm2 logs aimm-api --err
```

## 测试时的日志追踪

### 运行测试并保存日志

```bash
# 前端流程测试（保存日志）
pnpm test:frontend 2>&1 | tee /tmp/frontend-test-$(date +%Y%m%d-%H%M%S).log

# R2 配置测试
pnpm test:r2 2>&1 | tee /tmp/r2-test-$(date +%Y%m%d-%H%M%S).log
```

### 分析测试日志

```bash
# 查看失败的步骤
grep "❌" /tmp/frontend-test-*.log

# 查看进度
grep "📊" /tmp/frontend-test-*.log

# 查看 HTTP 请求
grep "📡" /tmp/frontend-test-*.log
```

## 快速诊断清单

遇到问题时，按以下顺序检查：

1. ✅ **服务状态**：`curl http://localhost:3001/health`
2. ✅ **数据库连接**：`psql -d aimm -c "SELECT 1;"`
3. ✅ **Redis 连接**：`redis-cli ping`
4. ✅ **R2 配置**：`pnpm test:r2`
5. ✅ **查看最近错误**：`psql -d aimm -c "SELECT * FROM \"Job\" WHERE status='failed' ORDER BY \"createdAt\" DESC LIMIT 5;"`
6. ✅ **查看日志**：`tail -100 /tmp/aimm-dev.log | grep "ERROR"`
7. ✅ **Langfuse Trace**：访问 https://us.cloud.langfuse.com

## 联系支持

如果问题无法解决，提供以下信息：

1. **Job ID** 或 **Track ID**
2. **错误信息**（从数据库或日志）
3. **Langfuse Trace URL**（如果可用）
4. **相关日志片段**（最近 50 行）
5. **复现步骤**

---

**提示**：开发时建议打开两个终端窗口，一个运行服务（`pnpm dev`），另一个实时查看日志（`tail -f /tmp/aimm-dev.log`）。
