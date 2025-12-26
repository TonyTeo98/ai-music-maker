# Langfuse 接入 Checklist（按周分工）— V0.5 Agent（Web）

端：Web（PC+移动自适应）。目标：3 周跑通“观测→调优”闭环。

---

## Week 0：冻结规范
- 冻结 steps 命名与 trace_id=track_id
- 冻结 scores 口径（最小集合）
- 冻结 metadata：platform=web，device/browser_family 分桶
- 明确 masking/retention 策略（prod 必须）

DoD：Schema 与命名不再改。

---

## Week 1：Trace + Steps 跑通
后端
- 创建 trace（trace_id=track_id）与 6 steps
- compose_params 存档 gen_params（先 schema 校验）
- music_generate 记录 request_id/latency/error_code

前端（Web）
- track_id 串：Create→Generating→Result→Library→Share（URL/本地存储）
- Result 选择 A/B 后上报（后端写 chosen_variant score）

QA
- 10 条冒烟（成功/失败/刷新恢复）

DoD：抽 10 个 track_id 都能在 Langfuse 复盘 steps；至少 1 个失败 case 有 error_code。

---

## Week 2：Artifacts + Scores + 脱敏
- 补齐 audio_analyze/segment_pick/ab_eval 的结构化输出
- 上报 scores：input_similarity/audio_quality/ab_diversity/chosen_variant
- prod 开 masking + retention

DoD：每个 trace 至少 4 个 scores 可见，且类型/范围正确。

---

## Week 3：Replay + 看板 + 版本对比
- 内部 Replay 最小版：track_id → 导出 steps/artifacts JSON
- 固化看板：质量/链路/转化（按 device 与 agent_version 分桶）
- 跑通一次 agent_version 升级对比流程（样本可小）

DoD：Replay 可用；对比流程跑通。

