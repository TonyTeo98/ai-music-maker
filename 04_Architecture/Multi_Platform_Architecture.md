# AI Music Maker 多端通用架构设计

> 适用版本：V0.x（Web 先行）→ V1.x（小程序/多端）
> 目标：后端一次设计，支持 Web、微信小程序、未来 App 等多端接入
> 状态：设计稿

---

## 0. TL;DR

当前 Web 架构（NestJS + BullMQ + PostgreSQL + S3）已经是前后端分离，**后端 90% 可直接复用**。

**需要增强的 4 个模块：**
1. **用户身份**：从 `device_id` 抽象为 `Identity Provider` 多端绑定
2. **音频上传**：增加后端代理上传通道（小程序无法直传任意域名）
3. **分享机制**：支持 URL + 小程序码 + Scheme 跳转
4. **平台适配**：Header 传递 `X-Platform`，端差异在客户端处理

---

## 1. 架构总览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              客户端层                                    │
├─────────────────────┬─────────────────────┬─────────────────────────────┤
│     Web (Next.js)   │   微信小程序         │   未来：App / H5           │
│   ┌─────────────┐   │   ┌─────────────┐   │                             │
│   │ MediaRecorder│   │   │RecorderMgr │   │                             │
│   │ Web Audio   │   │   │InnerAudio  │   │                             │
│   └──────┬──────┘   │   └──────┬──────┘   │                             │
└──────────┼──────────┴──────────┼──────────┴─────────────────────────────┘
           │                     │
           │  HTTPS / JSON       │
           ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          API Gateway / BFF                              │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      NestJS API Server                             │ │
│  ├────────────┬────────────┬────────────┬────────────┬───────────────┤ │
│  │ AuthModule │ TrackModule│ AssetModule│ ShareModule│ JobModule     │ │
│  │            │            │            │            │               │ │
│  │ ·web auth  │ ·create    │ ·presign   │ ·link生成  │ ·status查询  │ │
│  │ ·wx login  │ ·list      │ ·proxy上传 │ ·小程序码  │ ·轮询/SSE    │ │
│  │ ·identity  │ ·choose    │ ·transcode │ ·scheme    │               │ │
│  │  绑定      │  variant   │  触发      │            │               │ │
│  └─────┬──────┴─────┬──────┴─────┬──────┴─────┬──────┴───────┬───────┘ │
└────────┼────────────┼────────────┼────────────┼──────────────┼─────────┘
         │            │            │            │              │
         ▼            ▼            ▼            ▼              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            数据 & 队列层                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐  │
│  │  PostgreSQL  │  │    Redis     │  │      S3 兼容存储              │  │
│  │              │  │              │  │      (Cloudflare R2)         │  │
│  │ ·User        │  │ ·BullMQ队列  │  │                              │  │
│  │ ·Identity    │  │ ·Session     │  │ ·/raw/    原始音频           │  │
│  │ ·Track       │  │ ·Rate Limit  │  │ ·/audio/  转码后音频         │  │
│  │ ·Variant     │  │              │  │ ·/cover/  封面图             │  │
│  │ ·Job         │  │              │  │ ·/video/  MV视频             │  │
│  │ ·Share       │  │              │  │ ·/qrcode/ 小程序码           │  │
│  └──────────────┘  └───────┬──────┘  └──────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Worker 层                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │  Media Worker   │  │  Music Worker   │  │   Share Worker          │  │
│  │                 │  │                 │  │                         │  │
│  │ ·FFmpeg转码     │  │ ·audio_check    │  │ ·生成分享链接           │  │
│  │ ·格式标准化     │  │ ·audio_analyze  │  │ ·生成小程序码           │  │
│  │ ·音频切片       │  │ ·segment_pick   │  │ ·短链服务               │  │
│  │                 │  │ ·compose_params │  │                         │  │
│  │                 │  │ ·music_generate │  │                         │  │
│  │                 │  │ ·ab_eval        │  │                         │  │
│  └─────────────────┘  └────────┬────────┘  └─────────────────────────┘  │
└────────────────────────────────┼────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        外部服务层                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │  Suno API    │  │ Minimax API  │  │   Langfuse   │  │ 微信开放平台 │  │
│  │  (V0 主力)   │  │  (V1 备选)   │  │   可观测     │  │ ·wx.login   │  │
│  │              │  │              │  │              │  │ ·小程序码   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 用户身份体系（多端统一）

### 2.1 数据模型

```
User (用户主体)
├── user_id: UUID (主键)
├── created_at: timestamp
└── updated_at: timestamp

Identity (身份绑定，1 User : N Identity)
├── identity_id: UUID
├── user_id: UUID (FK → User)
├── provider: enum('web', 'wechat', 'apple', 'phone')
├── provider_id: string (device_id / openid / apple_id / phone_number)
├── provider_meta: jsonb (额外信息，如 unionid、session_key 等)
├── created_at: timestamp
└── updated_at: timestamp

UNIQUE(provider, provider_id)  -- 同一渠道同一标识只能绑定一个用户
```

### 2.2 认证流程

**Web 端（V0 匿名）：**
```
1. 前端生成/读取 localStorage 的 device_id
2. POST /api/v1/auth/anonymous { provider: 'web', provider_id: device_id }
3. 后端：查找或创建 User + Identity，返回 access_token
4. 后续请求 Header: Authorization: Bearer {token}
```

**微信小程序：**
```
1. wx.login() 获取 code
2. POST /api/v1/auth/wechat { code }
3. 后端：调用微信 code2session 换取 openid/unionid
4. 查找或创建 User + Identity，返回 access_token
5. 后续请求 Header: Authorization: Bearer {token}
```

### 2.3 多端绑定

用户可以在设置页绑定多个身份（如：小程序用户绑定手机号后，Web 端用手机号登录可关联同一账号）。

```
POST /api/v1/auth/bindIdentity
{
  "provider": "phone",
  "provider_id": "+8613800138000",
  "verification_code": "123456"
}
```

---

## 3. 音频上传（双通道）

### 3.1 问题

- **Web**：可以直传任意 S3 域名（presigned URL）
- **小程序**：`wx.uploadFile` 只能传到已备案域名，无法直传 S3

### 3.2 解决方案

```
┌─────────────┐     presigned URL      ┌─────────────┐
│   Web 端    │ ─────────────────────► │     S3      │
└─────────────┘                        └─────────────┘

┌─────────────┐     multipart/form     ┌─────────────┐     stream     ┌─────────────┐
│  小程序端   │ ─────────────────────► │  API Server │ ────────────► │     S3      │
└─────────────┘                        └─────────────┘                └─────────────┘
```

### 3.3 API 设计

```
# 通道一：直传（Web 优先）
POST /api/v1/assets/audio/presign
Request:  { filename, content_type, size_bytes }
Response: { asset_id, upload_url, headers, expires_at }

# 通道二：代理上传（小程序使用）
POST /api/v1/assets/audio/upload
Content-Type: multipart/form-data
Body: file (binary)
Response: { asset_id, storage_key, duration_sec }
```

### 3.4 后端处理统一

无论哪个通道上传，后端都会：
1. 触发 Media Worker 转码（统一输出格式：mp3/44.1kHz/128kbps）
2. 更新 Asset 记录为 `ready` 状态
3. 生成 CDN 可访问 URL

---

## 4. 分享机制（多态）

### 4.1 分享类型

| 类型 | 用途 | 生成方式 |
|------|------|---------|
| URL 链接 | Web/浏览器分享 | `https://domain.com/s/{share_code}` |
| 小程序码 | 微信生态分享 | 调用微信 API 生成，存储到 S3 |
| Scheme | App 跳转 | `weixin://dl/business/?t={share_code}` |

### 4.2 数据模型扩展

```sql
ALTER TABLE Share ADD COLUMN share_type enum('link', 'wxcode', 'scheme') DEFAULT 'link';
ALTER TABLE Share ADD COLUMN qrcode_asset_id UUID REFERENCES Asset(asset_id);
ALTER TABLE Share ADD COLUMN scheme_url text;
```

### 4.3 API 设计

```
POST /api/v1/tracks/{track_id}/share
Request: {
  "share_types": ["link", "wxcode"]  // 可同时生成多种
}
Response: {
  "share_code": "abc123",
  "link_url": "https://domain.com/s/abc123",
  "wxcode_url": "https://cdn.domain.com/qrcode/abc123.png",  // 小程序码图片
  "scheme_url": "weixin://dl/business/?t=abc123"
}
```

### 4.4 分享页路由

```
# Web 分享页
GET /s/{share_code} → Next.js SSR 页面

# 小程序分享页
pages/share/index?code={share_code} → 小程序原生页面

# 环境判断
分享链接统一用 https://domain.com/s/{share_code}
页面内 JS 判断 UA，微信环境引导打开小程序
```

---

## 5. API 设计原则

### 5.1 平台标识

所有请求通过 Header 传递平台信息，**不在 URL 或 Body 中区分端**：

```
X-Platform: web | wxmp | ios | android
X-App-Version: 1.0.0
X-Device-Id: uuid (可选，用于匿名追踪)
```

### 5.2 响应统一

所有端返回相同结构，端差异在客户端处理：

```json
{
  "code": 0,
  "data": { ... },
  "message": "success",
  "trace_id": "track_xxx"
}
```

### 5.3 错误码统一

```typescript
// packages/shared/src/errors.ts
export enum ErrorCode {
  // 通用
  SUCCESS = 0,
  UNKNOWN_ERROR = 10000,
  PARAM_INVALID = 10001,

  // 认证
  AUTH_REQUIRED = 20001,
  AUTH_EXPIRED = 20002,
  AUTH_PROVIDER_ERROR = 20003,  // 微信 code 无效等

  // 上传
  UPLOAD_TOO_LARGE = 30001,
  UPLOAD_FORMAT_INVALID = 30002,
  UPLOAD_DURATION_INVALID = 30003,

  // 生成
  GENERATE_BUSY = 40001,
  GENERATE_PROVIDER_ERROR = 40002,

  // 分享
  SHARE_NOT_FOUND = 50001,
  SHARE_REVOKED = 50002,
}
```

---

## 6. 端差异对照表

| 功能 | Web | 微信小程序 | 备注 |
|------|-----|-----------|------|
| 录音 | MediaRecorder | RecorderManager | 输出格式不同，后端统一转码 |
| 播放 | HTML5 Audio | InnerAudioContext | 互斥逻辑各端实现 |
| 上传 | S3 presign 直传 | API 代理上传 | 小程序域名限制 |
| 登录 | device_id 匿名 | wx.login openid | 统一 Identity 模型 |
| 分享 | URL 链接 | 小程序码 + onShareAppMessage | API 同时返回多种 |
| 推送 | 轮询 / SSE | 轮询（后台限制） | V0 统一轮询 |
| 支付 | - | 微信支付（V2） | V1 规划 |

---

## 7. 小程序特有限制与应对

### 7.1 录音限制

```javascript
// 小程序 RecorderManager 配置
const recorderManager = wx.getRecorderManager()
recorderManager.start({
  duration: 180000,      // 最长 3 分钟
  sampleRate: 44100,
  numberOfChannels: 1,
  encodeBitRate: 128000,
  format: 'mp3'          // 直接输出 mp3，减少转码
})
```

**应对**：后端 FFmpeg 兜底转码，无论输入什么格式都输出标准 mp3。

### 7.2 文件大小限制

```
wx.uploadFile 默认限制 10MB
```

**应对**：
- 录音时长限制 3 分钟（约 3-5MB）
- 上传前压缩（如需要）
- 超大文件提示用户使用 Web 端

### 7.3 后台限制

```
小程序切后台后，网络请求可能被系统杀掉
```

**应对**：
- 生成任务入队后立即返回 job_id
- 用户可离开，完成后在作品库可见
- 不依赖长连接

### 7.4 审核要求

```
小程序需要软著、ICP 备案、类目资质
AI 生成内容需要内容安全审核
```

**应对**：
- 后端集成内容安全 API（腾讯云/阿里云）
- 生成结果先过审再入库
- 违规内容标记不可分享

---

## 8. 迁移路径

### Phase 1：Web V0 完成（当前）
- device_id 认证
- S3 直传
- URL 分享

### Phase 2：后端多端适配（V0.7）
- Identity 模型上线
- 代理上传接口
- 微信登录 API
- 小程序码生成

### Phase 3：小程序 V1
- 小程序前端开发
- 联调测试
- 提审上线

---

## 9. 验收标准

- [ ] 同一用户 Web + 小程序登录后，作品库数据互通
- [ ] 小程序录音上传 → 生成 → 播放全链路跑通
- [ ] Web 生成的作品可通过小程序码分享，小程序可打开播放
- [ ] Langfuse trace 能区分 platform=web / platform=wxmp
- [ ] 错误码在两端表现一致

---

## 更新日志

| 日期 | 变更 |
|------|------|
| 2025-01-06 | 初始化多端架构设计文档 |
