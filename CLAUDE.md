# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

AI Music Maker 是一个 Web 应用（PC+移动自适应），核心功能是将用户的哼唱/清唱音频转化为可分享的成品音乐。当前为文档阶段，尚无代码实现。

**核心链路**：录音/上传音频 → 选重点片段（推荐）→ 填风格（必填）→ 一次生成 A/B 两版本 → 选主版本入库 → 分享

## 文档结构

```
01_PRD/v0-web/              # 产品需求文档
02_Design/v0-web/           # 低保真线框规格
03_Observability/
  v0.5_agent_web/           # Agent 可观测规范（Langfuse）
  schemas/                  # JSON Schema 校验文件（Web）
```

## 版本约定

- PRD 按 `01_PRD/vX/` 归档，V0 稳定后再开 V1
- `agent_version` 为可观测核心版本，schema 变更必须同步升级
- 废弃文档放入 `99_Archive/`，不覆盖旧文件

## 响应式断点

- Mobile: ≤768px（单列滚动）
- Desktop: >768px（两列：左输入/右预览）

## Agent 可观测要点

**Trace 标准步骤**：
`audio_check` → `audio_analyze` → `segment_pick` → `compose_params` → `music_generate` → `ab_eval`

**必须上报的 Scores**：
- 自动评估：`input_similarity`、`audio_quality`、`ab_diversity`（0-1）
- 用户行为：`chosen_variant`（A/B）

**gen_params Schema**：`03_Observability/schemas/ai_music_maker_gen_params.web.schema.json`

## 产品关键约束

- A/B 版本单实例播放（播 A 自动停 B）
- 未选主版本时，分享/视频按钮需弹窗拦截并引导选择
- 重点片段为"推荐"非必选，不选走后端自动选段
- 生成中可离开页面，完成后在作品库可见
- V0 不承诺保留用户原声，UI 禁止出现"保留我的人声"

## 浏览器兼容

- 主流支持：Chrome/Edge/Safari
- 录音降级：不支持录音的环境隐藏录音 Tab，仅保留上传
- 分享页：默认点击播放（规避自动播放限制）
- 录音输出：建议后端 FFmpeg 转码兜底
