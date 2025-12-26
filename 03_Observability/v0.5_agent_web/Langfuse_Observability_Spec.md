# Agent 可观测规范（Langfuse，自建，Web）

适用：V0.5 Agent（选段推荐 + 参数编排 + A/B 选择助手）  
目标：可追踪、可复盘、可调优（避免黑盒）。

---

## 1) 统一约定
- trace_id = track_id
- 固定 steps：
  audio_check → audio_analyze → segment_pick → compose_params → music_generate → ab_eval（video_generate 可选）
- Langfuse 只存摘要与结构化工件，不存原始音频本体

---

## 2) Trace metadata（必填）
- product: ai_music_maker
- environment: dev/staging/prod
- platform: web
- device: mobile/desktop
- browser_family: Chrome/Safari/Edge/WeChatWebView（建议）
- agent_version
- app_version
- user_id_hash
- audio_source: record/upload

---

## 3) 关键工件（必须存档）
- compose_params.gen_params（最终生成请求参数）
- music_generate.request_id / error_code / latency
- segment_pick.chosen_segment + candidates Top3
- ab_eval 的指标与推荐（尽量模板化解释）

---

## 4) 最小 scores（V0.5）
- input_similarity（或 A/B）
- audio_quality（或 A/B）
- ab_diversity
- chosen_variant（用户选主版本 A/B）

---
