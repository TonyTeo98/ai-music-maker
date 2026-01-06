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
| 本地启动验证通过 | ✅ | 2025-12-28 验证通过 |

---

## V0.2 上传音频 + S3 直传

**目标**：音频能上传到 R2，Asset 入库

| 任务 | 状态 | 备注 |
|------|------|------|
| R2 配置 + presign URL 接口 | ✅ | POST /assets/presign |
| Web 上传组件（直传 S3） | ✅ | AudioUpload 组件 + /create 页面 |
| 上传完成回调 + Asset 状态更新 | ✅ | POST /assets/:id/confirm |
| 端到端验证 | ✅ | 2025-12-28 验证通过 |

---

## V0.3 生成链路（Suno 单 Provider）

**目标**：提交生成 → 轮询 → 拿到 A/B 结果

| 任务 | 状态 | 备注 |
|------|------|------|
| BullMQ 队列配置 | ✅ | QueueService + media-jobs 队列 |
| Suno Provider 封装 | ✅ | Mock 模式支持开发测试 |
| Worker: music_generate 任务 | ✅ | 6 步骤流程完整 |
| API: POST /tracks/{id}/generate | ✅ | TracksController |
| API: GET /jobs/{id} 轮询 | ✅ | JobsController |
| Web 生成页 + 轮询逻辑 | ✅ | /create 页面完整流程 |
| 端到端验证 | ✅ | 2025-12-28 验证通过 |

---

## V0.4 A/B 播放 + 选主版本

**目标**：双版本播放、互斥控制、选主版本

| 任务 | 状态 | 备注 |
|------|------|------|
| Web 双轨播放器组件 | ✅ | ABPlayer 组件，播 A 自动停 B |
| API: POST /tracks/{id}/primary | ✅ | V0.3 已实现 |
| 选主版本交互 | ✅ | 集成到 /create 页面 |
| 端到端验证 | ✅ | 2025-12-28 验证通过 |

---

## V0.5 分享页 + CDN 播放

**目标**：生成分享链接，他人可播放

| 任务 | 状态 | 备注 |
|------|------|------|
| API: POST /tracks/{id}/share | ✅ | SharesController |
| 分享页 SSR/静态渲染 | ✅ | /s/[token] 页面 + OG 元数据 |
| Cloudflare CDN 配置（Range 支持） | ✅ | 本地 MinIO 已支持，生产配置待部署 |
| 端到端验证 | ✅ | 2025-12-28 验证通过 |

---

## V0.6 Langfuse 可观测接入

**目标**：全链路 trace 可查，失败可定位

| 任务 | 状态 | 备注 |
|------|------|------|
| Langfuse 自托管/云端配置 | ✅ | us.cloud.langfuse.com |
| Worker 各 step 上报 | ✅ | audio_check, compose_params, music_generate, ab_eval |
| Scores 上报（similarity/quality/diversity） | ✅ | input_similarity, audio_quality, ab_diversity, chosen_variant |
| 错误码标准化 | ✅ | packages/shared/src/errors.ts |
| 验收：任意 track_id 可复盘 | ✅ | 通过 jobId 作为 traceId 查询 |

---

## V0.7 作品库 + 设备隔离

**目标**：用户可查看、管理自己的作品，设备级软隔离

| 任务 | 状态 | 备注 |
|------|------|------|
| Web: deviceId 持久化 | ✅ | localStorage 存储，useDeviceId hook |
| API: GET /tracks 作品列表 | ✅ | 按 deviceId 过滤，分页，按创建时间倒序 |
| API: DELETE /tracks/:id 软删除 | ✅ | 设置 deletedAt，不物理删除 |
| Web: /library 作品库页面 | ✅ | 列表展示：标题/风格/日期/播放按钮 |
| Web: 作品详情交互 | ✅ | 播放、复制分享链接、删除确认弹窗 |
| Web: 首页入口 | ✅ | 添加"我的作品"入口链接 |
| 端到端验证 | ✅ | 2025-12-28 验证通过 |

---

## V0.8 Create 页增强

**目标**：完善创作页输入项，提升用户体验

| 任务 | 状态 | 备注 |
|------|------|------|
| 风格自定义输入 | ✅ | 标签选择 + 自定义文本输入 |
| 歌词/主题文本框 | ✅ | 可选多行文本输入 |
| API: generate 接口扩展 | ✅ | 支持 lyrics 参数 |
| 未选主版本弹窗拦截 | ✅ | 点击分享时弹窗提示选择 |
| "再来一组"按钮 | ✅ | Result 页支持重新生成 |
| 端到端验证 | ✅ | 2025-12-28 验证通过 |

---

## V0.9 响应式布局 + Share 页优化

**目标**：适配移动端，优化分享页转化

| 任务 | 状态 | 备注 |
|------|------|------|
| Mobile 响应式（≤768px） | ✅ | 单列滚动布局，触控友好 |
| Desktop 响应式（>768px） | ✅ | 保持原有布局，间距优化 |
| Share 页 CTA 按钮 | ✅ | "我也要创作"链接回到 /create |
| Share 页样式优化 | ✅ | 播放器 + 标题 + 风格标签展示 |
| 录音组件移动端适配 | ✅ | 按钮尺寸、间距优化 |
| 端到端验证 | ✅ | 2025-12-28 验证通过 |

---

## V0.10 重点片段 + 高级设置（可选）

**目标**：支持用户选择音频片段，提供高级参数控制

| 任务 | 状态 | 备注 |
|------|------|------|
| Web: 音频波形组件 | ✅ | wavesurfer.js 可视化，支持拖拽选择片段 |
| Web: 片段选择交互 | ✅ | 起止时间选择，推荐 10-30 秒 |
| API: generate 接口扩展 | ✅ | 支持 segmentStartMs/segmentEndMs 参数 |
| 高级设置折叠面板 | ✅ | 不想要的风格（exclude） |
| 高级设置：成品形态 | ✅ | 女声/男声/纯伴奏选项 |
| 高级设置：文本模式 | ✅ | 按我写的来 / 系统帮我整理 |
| 高级设置：滑杆控制 | ✅ | 创作张力、风格锁定（0-100） |
| 端到端验证 | ✅ | 2025-12-28 验证通过 |

---

## V0.11 历史版本管理

**目标**：保留所有生成记录，支持查看历史版本

| 任务 | 状态 | 备注 |
|------|------|------|
| Prisma: TrackVariant 添加 batchIndex | ✅ | 按批次分组，唯一约束 [trackId, variant, batchIndex] |
| Worker: 保留历史版本 | ✅ | 不删除旧 variants，计算新 batchIndex |
| API: GET /tracks/:id/history | ✅ | 返回按批次分组的历史记录 |
| Web: /tracks/[id] 详情页 | ✅ | 展示所有生成批次，支持展开/折叠、播放、设为主版本 |
| Web: Library 页链接详情 | ✅ | 点击作品进入详情页 |
| Web: Create 页历史入口 | ✅ | 结果区添加"查看所有历史版本"链接 |
| 端到端验证 | ✅ | 2025-12-28 验证通过 |

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
| 2025-12-28 | V0.1 本地启动验证通过 |
| 2025-12-28 | V0.2 上传功能完成（Presign URL + Web 上传组件 + 确认回调） |
| 2025-12-28 | V0.3 生成链路完成（BullMQ + Suno Provider + Worker + API + Web 轮询） |
| 2025-12-28 | V0.4 A/B 播放完成（ABPlayer 组件 + 选主版本交互） |
| 2025-12-28 | V0.5 分享功能完成（分享 API + SSR 分享页 + OG 元数据） |
| 2025-12-28 | V0.6 Langfuse 可观测完成（云端配置 + Worker step 上报 + Scores 上报） |
| 2025-12-28 | V0.7 作品库完成（deviceId 持久化 + 列表/删除 API + /library 页面） |
| 2025-12-28 | V0.8 Create 页增强完成（风格自定义 + 歌词输入 + 弹窗拦截 + 再来一组） |
| 2025-12-28 | V0.9 响应式布局完成（Mobile/Desktop 适配 + Share 页 CTA + 录音组件优化） |
| 2025-12-28 | V0.10 重点片段+高级设置完成（波形组件 + 片段选择 + 高级参数控制） |
| 2025-12-28 | V0.11 历史版本功能完成（batchIndex + 详情页 + 历史记录查看） |
| 2025-12-28 | 供应商策略确定：Minimax（Text-to-Music）+ Suno（Audio-to-Music 待确认） |
| 2025-01-06 | 新增 V0.7 多端基础设施、V1.0-wxmp 小程序里程碑 |
