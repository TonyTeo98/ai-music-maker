# Product Requirements Document: 用户认证与登录系统

**Version**: 1.0  
**Date**: 2026-02-01  
**Author**: Sarah (Product Owner)  
**Quality Score**: 92/100  

---

## Executive Summary

AI Music Maker 目前依赖 `device_id` 实现匿名用户的软隔离，导致作品无法跨设备同步，也限制了后续用户增长与付费能力建设。本 PRD 定义 MVP 第一期的用户认证系统（邮箱密码 + Google OAuth），在保留匿名创作体验的前提下，实现登录后自动合并作品，并提供邮箱验证与密码重置等基础安全能力。

该功能将为 V0.7 的多端基础设施提供关键落点：统一 Identity 模型、AuthModule 重构，并通过 JWT + 全设备退出机制保证账号安全和会话可控，形成可扩展的登录体系，为后续高级功能和付费体系奠基。

---

## Problem Statement

**Current Situation**: 现有用户以匿名方式创作，作品仅绑定 `device_id`，无法跨设备同步，无法进行精细化用户运营与增长，也不具备付费账户体系基础。

**Proposed Solution**: 引入用户认证系统，支持邮箱密码与 Google OAuth 登录，保留匿名创作路径，并在用户完成登录时自动合并历史作品；提供邮箱验证、密码重置与全设备退出能力。

**Business Impact**: 实现跨设备同步提升留存与转化；为精准运营与付费功能提供账户基础；降低因设备更换导致的内容流失与用户流失。

---

## Success Metrics

**Primary KPIs:**
- **登录转化率**: 从匿名到登录的转化率 ≥ 20%（上线后 30 天内）
- **跨设备同步使用率**: 登录用户中有 ≥ 30% 在第二设备访问并同步成功
- **邮箱验证完成率**: 新注册用户 24 小时内验证率 ≥ 70%

**Validation**: 在上线后 2/4/8 周进行阶段性复盘，结合埋点数据（登录、验证、合并、跨设备访问）与客服反馈评估目标达成情况。

---

## User Personas

### Primary: 匿名创作者
- **Role**: 轻量创作者/新用户
- **Goals**: 快速生成音乐，不被复杂流程打断
- **Pain Points**: 换设备后作品丢失，无法同步
- **Technical Level**: Novice

### Secondary: 多设备进阶用户
- **Role**: 频繁创作与分享的活跃用户
- **Goals**: 多端随时访问、管理作品
- **Pain Points**: 账号体系缺失、无法跨设备
- **Technical Level**: Intermediate

---

## User Stories & Acceptance Criteria

### Story 1: 邮箱密码注册/登录

**As a** 匿名创作者  
**I want to** 使用邮箱和密码登录/注册  
**So that** 我能保存并跨设备访问我的作品  

**Acceptance Criteria:**
- [ ] 支持邮箱注册与登录，密码最少 8 位并包含字母+数字
- [ ] 登录成功后返回用户基础信息与会话状态
- [ ] 登录失败时展示明确错误（邮箱不存在/密码错误）

### Story 2: Google OAuth 登录

**As a** 多设备进阶用户  
**I want to** 使用 Google 账号一键登录  
**So that** 我能更快捷地进入系统  

**Acceptance Criteria:**
- [ ] 支持 Google OAuth 登录/注册
- [ ] 同一 Google 账号可重复登录且不产生重复账户
- [ ] OAuth 失败时提供可重试提示

### Story 3: 匿名作品合并

**As a** 匿名创作者  
**I want to** 登录后自动合并我之前的匿名作品  
**So that** 我不会丢失历史内容  

**Acceptance Criteria:**
- [ ] 登录成功后将当前 `device_id` 作品归属到用户账号
- [ ] 合并后作品数量与内容保持完整，不丢失
- [ ] 若发生命名/时间冲突，默认保留两份并标记来源

### Story 4: 邮箱验证

**As a** 新注册用户  
**I want to** 完成邮箱验证  
**So that** 我的账号更安全并可正常使用核心功能  

**Acceptance Criteria:**
- [ ] 注册后发送验证邮件，包含有效期链接
- [ ] 未验证账号可登录但提示验证，限制跨设备同步
- [ ] 验证成功后解除限制并记录验证时间

### Story 5: 密码重置

**As a** 忘记密码的用户  
**I want to** 通过邮箱重置密码  
**So that** 我能重新访问账号  

**Acceptance Criteria:**
- [ ] 支持密码重置邮件发送与有效期控制
- [ ] 新密码符合安全要求，重置后旧会话失效
- [ ] 失败/过期时提示重试流程

### Story 6: 全设备退出

**As a** 安全敏感用户  
**I want to** 一键退出所有设备  
**So that** 我能快速终止所有会话  

**Acceptance Criteria:**
- [ ] 账户设置中提供“全设备退出”入口
- [ ] 操作后所有已签发 JWT 失效
- [ ] 当前设备需重新登录

---

## Functional Requirements

### Core Features

**Feature 1: 邮箱密码认证**
- Description: 支持邮箱注册、登录、会话维持
- User flow: 入口（全局头部） → 登录/注册 → 校验 → 进入应用
- Edge cases: 邮箱已注册、弱密码、连续失败
- Error handling: 展示明确错误并限制暴力尝试

**Feature 2: Google OAuth 登录**
- Description: 通过 Google OAuth 获取身份并创建/绑定账号
- User flow: 登录页 → Google 登录 → 回调 → 成功进入
- Edge cases: 回调失败、账户已绑定其他邮箱
- Error handling: 提示重试或改用邮箱登录

**Feature 3: 匿名模式保留 + 自动合并**
- Description: 匿名创作默认可用；登录时将 `device_id` 作品归并到账号
- User flow: 匿名使用 → 登录 → 合并完成提示
- Edge cases: 同名作品、同步失败
- Error handling: 保留原始数据并支持重试合并

**Feature 4: 邮箱验证**
- Description: 注册后发送验证邮件并控制关键功能
- User flow: 注册 → 邮件 → 点击验证 → 状态更新
- Edge cases: 链接过期、重复验证
- Error handling: 允许重新发送验证邮件

**Feature 5: 密码重置**
- Description: 用户通过邮箱重置密码
- User flow: 忘记密码 → 邮件 → 设置新密码 → 登录
- Edge cases: 邮件未送达、链接过期
- Error handling: 允许重新发起重置

**Feature 6: 基础资料页**
- Description: 用户可编辑昵称、头像、简介
- User flow: 头像/设置入口 → 编辑 → 保存
- Edge cases: 头像上传失败、简介超长
- Error handling: 提示并保留草稿

**Feature 7: 全设备退出**
- Description: 后台支持强制失效所有会话
- User flow: 设置页 → 全设备退出 → 重新登录
- Edge cases: 部分设备未联网
- Error handling: 强制要求刷新 token 时失效

### Out of Scope
- MFA/二次验证
- Apple/微信等更多第三方登录
- 账户冻结/风控体系
- 付费与订阅模块

---

## Technical Constraints

### Performance
- 登录/注册 API 目标响应时间 < 300ms（P95）
- OAuth 回调处理 < 500ms（P95）

### Security
- 密码加密存储（bcrypt/argon2）
- JWT 访问令牌短期有效 + 刷新机制
- 全设备退出：通过 tokenVersion 或会话表实现全局失效
- 邮箱验证/重置链接需一次性且有时效（默认 24h）

### Integration
- **Next.js 15 (Web)**: 登录入口与资料页 UI
- **NestJS (API)**: 认证与会话管理
- **Prisma + PostgreSQL**: Identity 模型、会话/验证记录
- **邮件服务**: 发送验证与重置邮件
- **OAuth Provider**: Google OAuth 应用配置与回调

### Technology Stack
- Next.js 15 + NestJS + Prisma + PostgreSQL
- JWT 认证（支持全设备退出）
- 兼容移动端与桌面端的响应式体验

---

## MVP Scope & Phasing

### Phase 1: MVP (Required for Initial Launch)
- 邮箱密码登录/注册
- Google OAuth 登录
- 匿名模式保留与登录后自动合并
- 邮箱验证与密码重置
- 基础资料页（昵称、头像、简介）
- 全设备退出

**MVP Definition**: 在不破坏匿名体验的前提下，实现可靠登录/注册与跨设备同步的最低闭环。

### Phase 2: Enhancements (Post-Launch)
- MFA/二次验证
- 账号绑定与多 OAuth provider
- 会话管理 UI（查看已登录设备）

### Future Considerations
- 付费/订阅体系接入
- 风控与异常登录检测

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| 作品合并逻辑导致数据冲突或丢失 | Med | High | 使用原子事务 + 冲突保留策略 + 可重试机制 |
| 邮件送达率不稳定 | Med | Med | 选用可靠邮件服务 + 发送失败重试 |
| OAuth 回调配置错误或审核周期延迟 | Med | Med | 提前准备 Google OAuth 配置与测试环境 |
| JWT 全设备退出失效 | Low | High | 使用 tokenVersion 或会话表统一失效策略 |

---

## Dependencies

**Dependencies:**
- Identity 数据模型落地（V0.7 规划）
- AuthModule 重构与 API 接口设计
- 邮件发送服务（SMTP/第三方）配置
- Google OAuth 应用注册与凭证
- 全局头部导航栏入口设计

**Known Blockers:**
- 若 Identity 模型尚未定稿，将影响认证接口与数据结构

---

## Appendix

### Glossary
- **device_id**: 匿名用户在本地设备上的标识符
- **JWT**: JSON Web Token，用于用户身份认证
- **OAuth**: 第三方授权登录协议

### References
- V0.7 多端基础设施规划文档
- Identity 数据模型草案
- AuthModule 重构说明

---

*This PRD was created through interactive requirements gathering with quality scoring to ensure comprehensive coverage of business, functional, UX, and technical dimensions.*
