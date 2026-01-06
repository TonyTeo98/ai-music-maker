# CQTAI Suno API 文档整理

> 来源: https://docs.cqtai.com
> 整理时间: 2025-01-06

## 通用信息

| 项 | 值 |
|---|---|
| Base URL | `https://api.cqtai.com` |
| 认证方式 | `Authorization: ApiKey sk-xxx` 或 `Bearer sk-xxx` |

---

## 1. suno生成 (Text-to-Music)

**用途**: 根据文本提示创建音乐，每个请求生成多个变体

### 端点

```
POST https://api.cqtai.com/api/cqt/suno/v1/generate
```

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| prompt | string | ✓ | 提示词/歌词 |
| style | string | ✓ | 风格 |
| title | string | ✓ | 歌曲标题 (≤80字符) |
| custom_mode | boolean | ✓ | 模式：true=自定义，false=简单 |
| instrumental | boolean | ✓ | 是否纯音乐 |
| model | string | ✓ | 模型版本 |
| vocal_gender | string | ✓ | 人声性别：m=男声，f=女声 |
| style_weight | number | ✓ | 风格遵循强度 |
| weirdness_constraint | number | ✓ | 创意/离散程度 |
| audio_weight | number | ✓ | 音频要素权重 |

### 模型版本

- `suno_v35` / `suno_v40`: prompt ≤3000字符, style ≤200字符
- `suno_v45` / `suno_v45_plus`: prompt ≤5000字符, style ≤1000字符
- `suno_v5`: prompt ≤5000字符, style ≤1000字符

### 自定义模式说明

**custom_mode: true**
- 如果 instrumental: true → 需提供 style 和 title
- 如果 instrumental: false → 需提供 style、prompt 和 title

**custom_mode: false**
- 仅需提供 prompt (≤400字符)
- 其他参数留空

### 回调阶段

1. `text` - 文本生成
2. `first` - 第一首完成
3. `complete` - 全部完成

### 请求示例

```json
{
  "prompt": "一首关于夏天的歌",
  "style": "pop, upbeat",
  "title": "夏日阳光",
  "custom_mode": true,
  "instrumental": false,
  "model": "suno_v45",
  "vocal_gender": "f",
  "style_weight": 50,
  "weirdness_constraint": 30,
  "audio_weight": 50
}
```

### 响应格式

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    // 任务信息，需要用获取结果接口轮询
  }
}
```

---

## 2. suno生成-从URL生成音乐 (Audio-to-Music) ⭐ 核心接口

**用途**: 从音频 URL 生成音乐（我们的核心功能）

### 端点

```
POST https://api.cqtai.com/api/cqt/suno/v1/generateFromAudioTask
```

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| audioFilePath | string | ✓ | 音频 URL 路径 ⭐ |
| gpt_description_prompt | string | ✓ | 简单模式提示词 |
| make_instrumental | boolean | ✓ | 是否纯音乐 |
| prompt | string | ✓ | 自定义模式提示词/歌词 |
| tags | string | ✓ | 自定义模式风格标签 |
| title | string | ✓ | 歌曲标题 |
| modelVersion | string | ✓ | 模型版本 |
| continue_at | integer | ✓ | 开始时间点（秒？毫秒？） |

### 模型版本

- `suno_v35`
- `suno_v40`
- `suno_v45`
- `suno_v45_plus`

### 请求示例

```json
{
  "audioFilePath": "https://your-bucket.s3.amazonaws.com/uploads/audio.mp3",
  "gpt_description_prompt": "把这段哼唱变成一首流行歌曲",
  "make_instrumental": false,
  "prompt": "夏天的风轻轻吹过",
  "tags": "pop, upbeat, summer",
  "title": "夏日微风",
  "modelVersion": "suno_v45",
  "continue_at": 0
}
```

### 响应格式

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": 58848438
  }
}
```

### ⚠️ 重要限制（实测）

`audioFilePath` 必须是**可直接下载的音频文件 URL**，不能是 streaming URL。

**错误示例**：
- ❌ `https://audiopipe.suno.ai/?item_id=xxx` (streaming，会超时)

**正确示例**：
- ✅ `https://your-bucket.s3.amazonaws.com/audio.mp3`
- ✅ `https://cdn.yourdomain.com/uploads/audio.wav`

**错误响应**：
```json
{
  "code": 500,
  "msg": "UPLOAD_AUDIO_FILE_FAILED3: timeout of 60000ms exceeded",
  "data": null
}
```

---

## 3. suno获取结果 (轮询状态) ⭐ 核心接口

**用途**: 查询生成任务的状态和结果

### 端点

```
GET https://api.cqtai.com/api/cqt/suno/v1/sunoInfo?taskId={taskId}
```

### 请求参数

| 参数 | 类型 | 位置 | 必填 | 说明 |
|------|------|------|------|------|
| taskId | string | query | ✓ | 任务 ID，如 "58847010" |

### 请求示例

```
GET https://api.cqtai.com/api/cqt/suno/v1/sunoInfo?taskId=58847010
Authorization: ApiKey sk-xxx
```

### 响应格式

**进行中状态：**
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "status": "running",
    "taskId": 58847010,
    "creatAt": null,
    "finishAt": null
  }
}
```

**完成状态（实测数据）：**
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "status": "success",
    "taskId": 58847010,
    "creatAt": "1767710307",
    "finishAt": "1767710335",
    "data": [
      {
        "status": "streaming",
        "id": "51afb105-47bd-4386-abb0-8de3c89723e5",
        "title": "代码人生",
        "audio_url": "https://audiopipe.suno.ai/?item_id=51afb105-47bd-4386-abb0-8de3c89723e5",
        "image_url": "https://cdn2.suno.ai/image_51afb105-47bd-4386-abb0-8de3c89723e5.jpeg",
        "image_large_url": "https://cdn2.suno.ai/image_large_51afb105-47bd-4386-abb0-8de3c89723e5.jpeg",
        "video_url": "",
        "major_model_version": "v4.5",
        "model_name": "chirp-auk",
        "metadata": {
          "tags": "electronic pop, synth wave...",
          "prompt": "【主歌】...",
          "make_instrumental": false,
          "control_sliders": {
            "audio_weight": 0.6,
            "style_weight": 0.7,
            "weirdness_constraint": 0.5
          }
        },
        "created_at": "2026-01-06T14:38:45.599Z",
        "batch_index": 0
      },
      {
        "id": "0c34ab3e-8d97-45d1-b3f5-ba673d430419",
        "audio_url": "https://audiopipe.suno.ai/?item_id=0c34ab3e-8d97-45d1-b3f5-ba673d430419",
        "batch_index": 1
      }
    ]
  }
}
```

### 关键字段说明

| 字段 | 说明 |
|------|------|
| `data.status` | 任务状态：`running` 进行中, `success` 完成 |
| `data.data[]` | 生成结果数组，通常包含 2 个变体（A/B） |
| `data.data[].id` | Suno 歌曲 ID (UUID) |
| `data.data[].audio_url` | 音频播放 URL |
| `data.data[].image_url` | 封面图 URL |
| `data.data[].batch_index` | 变体索引：0=A, 1=B |
| `data.data[].metadata` | 生成参数元数据 |

---

## 4. suno上传

**用途**: 上传音频文件

### 端点

```
POST https://api.cqtai.com/api/cqt/suno/v1/upload
```

> ⚠️ 待补充：需要用户提供文档

---

## 5. suno获取上传结果

**用途**: 获取上传任务的结果

### 端点

```
GET https://api.cqtai.com/api/cqt/suno/v1/upload-result/{taskId}
```

> ⚠️ 待补充：需要用户提供文档

---

## 与现有代码的对应关系

现有 Provider 实现: `workers/media/src/providers/suno.ts`

| 现有方法 | 对应 CQTAI 接口 | 状态 |
|---------|----------------|------|
| generate() | generateFromAudioTask | 待适配 |
| getResult() | sunoInfo | 待适配 |

---

## API 权限测试结果（2025-01-06）

| 接口 | 模型 | 权限状态 |
|------|------|---------|
| generate (Text-to-Music) | suno_v45 | ✅ 可用 |
| generate (Text-to-Music) | suno_v5 | ❌ 未配置 |
| generateFromAudioTask | suno_v45 | ✅ 可用（需可下载URL） |
| generateFromAudioIdTask | 所有版本 | ❌ 未配置 |
| uploadTask | - | ✅ 可用 |
| coverSongTask | - | ❌ 500错误 |

### 测试发现

1. **Text-to-Music** 完全正常，约30秒返回A/B两个版本
2. **Audio-to-Music (generateFromAudioTask)**
   - 需要可直接下载的URL，streaming URL会超时
   - 测试时出现 `gpt prompt error`，可能与音频内容有关
3. **generateFromAudioIdTask** 账号权限未配置
4. **coverSongTask** 需要已有Suno歌曲的clip_id，不适合用户上传音频场景

---

## 待确认问题

1. [x] Audio-to-Music 接口的具体参数 ✅
2. [x] 获取结果接口的响应格式 ✅
3. [x] 是否需要先上传音频再生成 → 可以直接传URL，但需可下载
4. [ ] 回调 webhook 是否支持，还是只能轮询
5. [x] `gpt prompt error` 的具体原因 → 测试音频是说话内容，需要哼唱/旋律音频
6. [ ] generateFromAudioIdTask 权限配置

---

## 用户待办

- [ ] 上传一个真正的**哼唱/旋律音频**（10-30秒）到 R2 存储桶
- [ ] 用新音频 URL 测试 `generateFromAudioTask` 接口
- [ ] （可选）联系 CQTAI 确认 `generateFromAudioIdTask` 权限配置
