# AI Music Maker 文档入口（Web：PC+移动自适应）

> 本目录是项目的“单一真相来源”（SSOT）：产品定义、交互线框、可观测规范与校验 schema 都在这里。
>
> 当前版本：
>
> - 产品：V0
> - Agent 可观测：V0.5（Langfuse）

---

## 快速入口

- PRD：AI_Music_Maker_V0_Web_PRD.md
- PRD 附录包：AI_Music_Maker_V0_Web_PRD_Appendix_Pack.md
- 线框规格：AI_Music_Maker_V0_Web_Wire_Spec.md
- Langfuse 可观测规范：AI_Music_Maker_Agent_Observability_Spec_Langfuse_Web.md
- 接入排期：AI_Music_Maker_Langfuse_Integration_Checklist_Weekly_Web.md
- Schemas（Web）：
  - ai_music_maker_gen_params.web.schema.json
  - ai_music_maker_trace_metadata.web.schema.json
  - ai_music_maker_langfuse_score.web.schema.json


## 版本与变更约定（建议遵守）

- PRD：按 `01_PRD/vX/` 归档；V0 稳定后再开 V1 目录
- 可观测：以 `agent_version` 为核心版本；schema 变更必须同步升级 agent_version
- 历史/废弃：放入 `99_Archive/`，不要覆盖旧文件
