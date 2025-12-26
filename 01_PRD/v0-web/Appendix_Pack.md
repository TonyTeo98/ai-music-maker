# AI Music Maker（V0-Web）PRD 附录包

用于研发落地：字段、接口、状态机、埋点与验收清单。端：Web（PC+移动自适应）。

---

## A. 页面字段（Web）
### WEB-Create
- audio_source：record/upload（二选一）
- user_segment（可选强推荐）：start_sec/end_sec
- style_text（必填）
- text_prompt（可选）
- exclude_style（可选，高级）
- vocal_mode（可选，高级）：female/male/instrumental
- text_mode（可选，高级）：manual/assist
- creativity_level（可选，高级）：0-100
- style_lock（可选，高级）：0-100

### WEB-Result
- primary_variant（必选）：A/B
- share_token（生成后获得）

---

## B. 数据模型（建议）
### Track
- track_id, owner_id_hash
- status: draft/generating/ready/failed/deleted
- primary_variant: A/B（ready 后必有）
- created_at/updated_at

### TrackVariant
- variant_id, track_id, label(A/B)
- audio_asset_id, duration_sec

### Job
- job_id, track_id, type(generate/video)
- status: queued/running/succeeded/failed/canceled
- provider_request_id, error_code, created_at/updated_at

### Asset
- asset_id, type(audio/image/video), storage_key, mime, size_bytes

### Share
- share_id, track_id, share_token, revoked, created_at

---

## C. 接口契约（V0-Web）
建议所有响应携带 trace_id（=track_id）。

- POST /api/v1/tracks
- POST /api/v1/assets/audio
- POST /api/v1/tracks/{track_id}/segment
- POST /api/v1/tracks/{track_id}/generate   (body: gen_params)
- GET  /api/v1/jobs/{job_id}
- GET  /api/v1/tracks/{track_id}
- POST /api/v1/tracks/{track_id}/primary
- POST /api/v1/tracks/{track_id}/share
- GET  /s/{share_token}                     (分享页)
- GET  /api/v1/share/{share_token}          (分享页取数)
- DELETE /api/v1/tracks/{track_id}

---

## D. Job 状态机与重试（建议）
generate：queued → running → succeeded/failed  
- 可重试：网络超时、5xx、限流（退避）  
- 不可重试：参数校验失败（SCHEMA_INVALID）、内容拦截

---

## E. 埋点（V0 最小）
- create_view（device/browser_family）
- audio_upload_success（duration_sec/size）
- segment_selected（start/end/source）
- generate_submit（has_user_segment/style_len/text_len）
- generate_succeeded / generate_failed（error_code）
- choose_primary（variant）
- share_create / share_open
- regen_submit

---

## F. QA 边界场景（必测）
- iOS Safari 录音权限拒绝/多次拒绝
- 微信内置浏览器录音不可用 → 引导上传
- 上传大文件失败重试
- 生成中刷新/关闭 → 状态恢复
- 分享撤销与不可播降级

