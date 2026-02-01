# 匿名作品自动合并 - Development Plan

## 概述
登录成功后自动检测当前设备关联的匿名作品（userId 为 null），静默合并至用户账户，保留原有元数据。

## 任务分解

### Task 1: 扩展认证 DTO 接收 deviceId
- **ID**: task-1
- **type**: default
- **描述**: 在 LoginDto、RegisterDto 中添加可选 `deviceId` 字段，并在控制器中从请求体读取 deviceId（Google OAuth 从 `x-device-id` header 读取）
- **文件范围**:
  - apps/api/src/auth/dto/login.dto.ts
  - apps/api/src/auth/dto/register.dto.ts
  - apps/api/src/auth/auth.controller.ts
- **依赖**: None
- **测试命令**: `pnpm -C apps/api test -- --testPathPattern=dto --coverage --coveragePathIgnorePatterns="/node_modules/"`
- **测试重点**:
  - LoginDto 接受可选 deviceId 字段（UUID 格式校验）
  - RegisterDto 接受可选 deviceId 字段
  - 控制器正确传递 deviceId 至 service 方法
  - Google OAuth callback 从 header 读取 x-device-id

### Task 2: 实现合并辅助方法（事务 + 日志）
- **ID**: task-2
- **type**: default
- **描述**: 在 AuthService 中添加私有方法 `mergeAnonymousTracks(userId: string, deviceId?: string)` 实现事务化合并逻辑，失败仅记录日志不抛出异常
- **文件范围**: apps/api/src/auth/auth.service.ts
- **依赖**: None
- **测试命令**: `pnpm -C apps/api test -- --testPathPattern=auth.service --coverage --coveragePathIgnorePatterns="/node_modules/"`
- **测试重点**:
  - 仅更新 `userId: null` 且 `deviceId` 匹配的作品
  - 已有 userId 的作品不受影响
  - 使用 `prisma.$transaction` 保证原子性
  - 未匹配到任何作品时正常返回
  - 失败场景（如 Prisma 异常）捕获并静默记录

### Task 3: 接入合并逻辑到认证流程
- **ID**: task-3
- **type**: default
- **描述**: 在 `login()`、`register()`、`loginWithGoogle()` 方法签名中接收 deviceId，认证成功后调用 `mergeAnonymousTracks()`
- **文件范围**: apps/api/src/auth/auth.service.ts
- **依赖**: task-1, task-2
- **测试命令**: `pnpm -C apps/api test -- --testPathPattern=auth.service --coverage --coveragePathIgnorePatterns="/node_modules/"`
- **测试重点**:
  - login 成功后调用合并方法
  - register 成功后调用合并方法
  - loginWithGoogle 成功后调用合并方法
  - 合并失败不影响登录/注册主流程（仍返回 token）
  - 无 deviceId 时不调用合并或合并方法安全跳过

### Task 4: 扩展测试覆盖合并行为
- **ID**: task-4
- **type**: default
- **描述**: 在 auth.service.spec.ts 中新增测试套件覆盖合并场景（包括成功、空集、失败）
- **文件范围**: apps/api/src/auth/auth.service.spec.ts
- **依赖**: task-2, task-3
- **测试命令**: `pnpm -C apps/api test:cov -- --testPathPattern=auth.service.spec --coverageThreshold='{"global":{"branches":90,"functions":90,"lines":90,"statements":90}}'`
- **测试重点**:
  - 合并场景：更新匹配的匿名作品 userId
  - 不匹配场景：已有 userId 的作品保持不变
  - 无作品场景：合并方法安全返回
  - 失败场景：Prisma 错误被捕获并记录
  - 集成场景：login/register/google 流程调用合并并继续成功

## 验收标准
- [ ] LoginDto、RegisterDto 支持可选 deviceId 字段
- [ ] Google OAuth callback 正确读取 x-device-id header
- [ ] 合并逻辑仅更新 userId 为 null 的作品
- [ ] 合并使用事务保证原子性
- [ ] 合并失败不影响登录/注册主流程
- [ ] 所有单元测试通过
- [ ] 代码覆盖率 ≥90%

## 技术要点
- **deviceId 校验**: 可选字符串字段，建议使用 `IsOptional()` + `IsUUID()` 装饰器（class-validator）
- **事务隔离**: 使用 `prisma.$transaction()` 确保 updateMany 原子性
- **日志记录**: 失败时使用 `console.error` 记录（当前无全局 Logger）
- **Prisma 更新条件**: `{ where: { deviceId, userId: null }, data: { userId } }`
- **Google OAuth 特殊处理**: GET 回调无法从 body 读取，需改用 header `x-device-id`
