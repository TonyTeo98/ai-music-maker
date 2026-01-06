# AI Music Maker V0 开发里程碑

> 创建时间：2025-12-26
> 状态标记：⬜ 未开始 | 🔄 进行中 | ✅ 完成 | ❌ 阻塞

---

## 技术决策摘要

| 项 | 决定 |
|---|---|
| 部署方式 | ARM 服务器 + Docker 容器化 |
| Redis | 容器自建（≥5.0） |
| 对象存储 | Cloudflare R2 |
| CDN | Cloudflare |
| 认证 | V0 匿名软隔离（device_id），V1 再上登录 |
| 音乐 Provider | Suno API（预留多供应商扩展） |

---

## V0.1 本地环境跑通

**目标**：Docker 一键启动，空壳服务能访问

| 任务 | 状态 | 备注 |
|------|------|------|
| Monorepo 初始化（pnpm + turborepo） | ✅ | package.json, turbo.json, pnpm-workspace.yaml |
| docker-compose.yml（Postgres + Redis + MinIO） | ✅ | 含 minio-init 自动创建 bucket |
| NestJS API 空壳 + 健康检查 | ✅ | /health, /docs (Swagger) |
| Next.js Web 空壳 + 首页 | ✅ | Tailwind 已配置 |
| packages/shared 基础结构 | ✅ | types, constants, errors |
| Worker 空壳（BullMQ） | ✅ | workers/media |
| Prisma Schema（全表） | ✅ | Device, Track, TrackVariant, Job, Asset, Share |
| 本地启动验证通过 | ⬜ | 待 pnpm install |

---

## V0.2 上传音频 + S3 直传

**目标**：音频能上传到 R2，Asset 入库

| 任务 | 状态 | 备注 |
|------|------|------|
| R2 配置 + presign URL 接口 | ⬜ | |
| Web 上传组件（直传 S3） | ⬜ | |
| 上传完成回调 + Asset 状态更新 | ⬜ | |
| 端到端验证 | ⬜ | |

---

## V0.3 生成链路（Suno 单 Provider）

**目标**：提交生成 → 轮询 → 拿到 A/B 结果

| 任务 | 状态 | 备注 |
|------|------|------|
| BullMQ 队列配置 | ⬜ | |
| Suno Provider 封装 | ⬜ | |
| Worker: music_generate 任务 | ⬜ | |
| API: POST /tracks/{id}/generate | ⬜ | |
| API: GET /jobs/{id} 轮询 | ⬜ | |
| Web 生成页 + 轮询逻辑 | ⬜ | |
| 端到端验证 | ⬜ | |

---

## V0.4 A/B 播放 + 选主版本

**目标**：双版本播放、互斥控制、选主版本

| 任务 | 状态 | 备注 |
|------|------|------|
| Web 双轨播放器组件 | ⬜ | 播 A 停 B |
| API: POST /tracks/{id}/primary | ⬜ | |
| 选主版本交互 | ⬜ | |
| 端到端验证 | ⬜ | |

---

## V0.5 分享页 + CDN 播放

**目标**：生成分享链接，他人可播放

| 任务 | 状态 | 备注 |
|------|------|------|
| API: POST /tracks/{id}/share | ⬜ | |
| 分享页 SSR/静态渲染 | ⬜ | |
| Cloudflare CDN 配置（Range 支持） | ⬜ | |
| 端到端验证 | ⬜ | |

---

## V0.6 Langfuse 可观测接入

**目标**：全链路 trace 可查，失败可定位

| 任务 | 状态 | 备注 |
|------|------|------|
| Langfuse 自托管/云端配置 | ⬜ | |
| Worker 各 step 上报 | ⬜ | |
| Scores 上报（similarity/quality/diversity） | ⬜ | |
| 错误码标准化 | ✅ | packages/shared/src/errors.ts |
| 验收：任意 track_id 可复盘 | ⬜ | |

---

## V0.7 多端基础设施

**目标**：后端支持多端接入，为小程序做准备

| 任务 | 状态 | 备注 |
|------|------|------|
| Identity 数据模型（User + Identity 表） | ⬜ | 详见 multi_platform_tasks.md |
| device_id → Identity 迁移脚本 | ⬜ | |
| AuthModule 重构（多 provider） | ⬜ | |
| 微信登录 API | ⬜ | |
| 音频代理上传 API | ⬜ | 小程序无法直传 S3 |
| 分享机制扩展（小程序码） | ⬜ | |
| 平台标识中间件 | ⬜ | X-Platform Header |
| Web 端登录流程适配 | ⬜ | |

---

## V1.0 规划（V0 完成后）

- [ ] 用户认证体系（device_id → user_id 迁移） ✅ 已移至 V0.7
- [ ] 多 Provider 支持（Minimax 等）
- [ ] SSE 实时推送替代轮询
- [ ] 视频生成功能

---

## V1.0-wxmp 微信小程序

**目标**：微信小程序上线

| 任务 | 状态 | 备注 |
|------|------|------|
| 小程序项目搭建 | ⬜ | |
| 核心页面开发（创作/生成/结果/库） | ⬜ | |
| 录音组件 | ⬜ | RecorderManager |
| A/B 播放器 | ⬜ | InnerAudioContext |
| 分享功能 | ⬜ | onShareAppMessage |
| 联调测试 | ⬜ | |
| 备案与资质 | ⬜ | |
| 提审上线 | ⬜ | |

> 详细任务分解见：`05_DevPlan/multi_platform_tasks.md`

---

## 更新日志

| 日期 | 变更 |
|------|------|
| 2025-12-26 | 初始化里程碑文档 |
| 2025-12-26 | V0.1 脚手架完成（Monorepo + Docker + API + Web + Worker + Shared + Prisma Schema） |
| 2025-01-06 | 新增 V0.7 多端基础设施、V1.0-wxmp 小程序里程碑 |
