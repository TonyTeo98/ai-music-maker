# AI Music Maker（Web：PC+移动自适应）技术架构方案（TS 全栈）

> 适用版本：V0（先跑通） + V0.5（Agent/可观测）  
> 决策已确认：**TypeScript 全栈** + **对象存储（S3 兼容）** + **先轮询（Polling）**  
> 目的：让团队对“怎么实现、怎么拆分、怎么排期、怎么验收”达成一致，避免边做边改架构。

---

## 0. TL;DR（给团队 2 分钟读完版）

我们要做的是一个典型的“**慢任务编排（生成/转码/评估）** + **大文件资产管理（音频/视频）** + **可观测调优（Langfuse）**”系统。

**选型结论**
- 前端：**Next.js（TypeScript）**，PC+移动响应式
- 后端 API/BFF：**NestJS（TypeScript）**
- 异步任务：**BullMQ（Redis）+ Worker**
- 数据库：**PostgreSQL + Prisma**
- 对象存储：**S3 兼容（AWS S3 / Cloudflare R2 / MinIO 等）+ CDN（需 Range）**
- 音频处理：**FFmpeg（跑在 Worker）**
- 可观测：**Langfuse（trace/score）+ Sentry（前后端错误）**
- V0 推送：**轮询 job 状态**（最稳、最低复杂度）；V1 再按需要升级 **SSE**，WebSocket 放更后

---

## 1. 关键决策与理由

### 1.1 为什么 TypeScript 全栈
- Web 端迭代快、同构逻辑多（校验、类型、枚举、错误码）
- 招人容易，工程效率高
- 与队列/Schema 校验/观测的生态成熟（AJV、OpenAPI、Sentry 等）

### 1.2 对象存储是不是 S3？
是。更准确说是 **S3 API 兼容对象存储**（不锁死 AWS）：
- 你可以用 AWS S3，也可以用 Cloudflare R2、阿里/腾讯的 S3 兼容网关，或自建 MinIO。
- 核心点是：后端/前端都按 S3 协议做 **直传/签名链接/权限控制**。

### 1.3 V0 用轮询，V1 升 SSE/WebSocket 会不会太早？
不早——但也**不必预先做复杂**。
- **V0：轮询最适合**（实现简单、失败模式清晰、对移动端最稳）
- **V1：优先 SSE**（单向推送足够用，部署与心智成本低）
- WebSocket 通常用于更复杂的双向实时场景（聊天、协作编辑），我们这里“生成完成通知”用 SSE 就够。

> 建议触发升级的客观条件：  
> - 生成耗时显著变长（>60s）、轮询导致成本/压力高  
> - 或用户生成页停留率高，需要更丝滑的进度与回传

---

## 2. 系统架构总览

### 2.1 架构图（文本版）
```
[Web(Next.js)]  ->  [API/BFF(NestJS)]  ->  [Job Queue(BullMQ/Redis)]  ->  [Workers]
      |                   |                         |                    |
      |                   |                         |                    +--> FFmpeg 转码/裁剪/特征
      |                   |                         |                    +--> Provider 生成调用
      |                   |                         |                    +--> A/B 评估 & 推荐
      |                   |
      |                   +--> [Postgres]  Track/Job/Asset/Share
      |                   +--> [S3 Object Storage] 音频/封面/视频
      |                   +--> [CDN] 播放/Range
      |
      +--> [Langfuse] trace/step/score (观测/调优)
      +--> [Sentry] 前后端异常/性能（可选）
```

### 2.2 “编排层”与“执行层”分离
- **API/BFF**：负责权限、状态机、签名上传、创建任务、聚合数据返回
- **Workers**：负责耗时任务（音频处理、生成、评估、视频）

这是为了：**稳定性（不阻塞）+ 可扩展（水平扩）+ 成本可控（独立扩容）**

---

## 3. 代码与仓库结构（Monorepo 推荐）

使用 `pnpm + turborepo`（或 nx）：
```
repo/
  apps/web/                 # Next.js (UI + 分享页 + 轮询)
  apps/api/                 # NestJS (REST/OpenAPI)
  workers/media/            # BullMQ Worker：ffmpeg + provider + eval
  packages/shared/          # 共享 types/enum/schema/错误码/step 名称
  packages/schemas/         # JSON Schemas（gen_params/score/metadata）
```

**关键原则**
- `packages/shared` 里放：step 名称、score 名称、error_code 枚举、DTO 类型
- Schema 在 `packages/schemas` 里单独版本管理（并在 CI 校验）

---

## 4. 核心数据模型（V0 最小）
- Track：作品（包含主版本选择）
- TrackVariant：A/B 变体
- Job：异步任务（generate/video）
- Asset：音频/封面/视频资产引用（对象存储 key）
- Share：分享 token 与访问控制

**状态机**
- Track.status：draft → generating → ready / failed → deleted(软删)
- Job.status：queued → running → succeeded / failed / canceled

---

## 5. 核心流程（V0 必须跑通）

### 5.1 上传音频（推荐：直传对象存储）
1) Web 请求 API：`POST /assets/audio/presign`
2) API 返回：`upload_url + headers + asset_id`
3) Web 直传 S3（PUT/Multipart）
4) Web 通知 API：`POST /assets/{asset_id}/complete`（可选）
5) API 写入 Asset 记录，进入可用状态

### 5.2 提交生成（一次产出 A/B）
1) Web：`POST /tracks/{track_id}/generate`（body: gen_params）
2) API：校验 gen_params schema（AJV）→ 创建 Job → 入队 BullMQ → 返回 job_id
3) Web：轮询 `GET /jobs/{job_id}`（2s 起步，退避到 5s）
4) succeeded：Web 拉 `GET /tracks/{track_id}` 展示 A/B
5) 选主版本：`POST /tracks/{track_id}/primary`

### 5.3 分享
- `POST /tracks/{track_id}/share` 创建 share_token
- `GET /s/{share_token}` 分享页（SSR/静态均可）
- 音频经 CDN 播放（要求 Range）

---

## 6. Worker 任务拆分（建议）
1) audio_check（格式/时长/静音/音量）
2) audio_analyze（VAD/能量摘要/节奏粗特征）
3) segment_pick（用户没选段时自动选段）
4) compose_params（可选：LLM 整理与参数映射）
5) music_generate（调用 provider，生成 A/B）
6) ab_eval（相似度/可听性/差异度 + 推荐）
7) persist（写 TrackVariant、更新 Track 状态）

> 每一步都写入 Langfuse observation（trace_id=track_id），失败要带 error_code。

---

## 7. 可观测与调优（非黑盒）
- trace_id = track_id
- steps 固定：audio_check/audio_analyze/segment_pick/compose_params/music_generate/ab_eval
- scores 固定：input_similarity/audio_quality/ab_diversity/chosen_variant
- 元数据分桶：platform=web，device=mobile/desktop，browser_family

---

## 8. 端侧（Web）工程注意点
- 录音不可用/权限拒绝：必须降级到上传路径
- 分享页不要依赖自动播放
- CDN 必须支持 Range，否则拖动进度条会卡

---

## 9. V0 → V1 实时化升级建议
- V0：轮询（最稳）
- V1：优先 SSE（单向推送足够）
- WebSocket：更后（仅在需要双向实时/高并发订阅时）

---

## 10. Definition of Done（验收）
- 任意 track_id 能在 Langfuse 复盘全链路 steps（含 gen_params）
- 任意失败 case 能定位到具体 step + error_code
- A/B 可播、可选主版本、可生成分享链接
- 分享页可稳定播放（Range OK）
- Schema 校验上线（至少 gen_params & score）

