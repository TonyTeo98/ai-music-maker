# AI Music Maker 前端重构计划

> 版本: 1.0
> 日期: 2025-12-29
> 状态: 规划中

---

## 1. 执行摘要

### 1.1 重构目标

将 AI Music Maker 前端从通用 AI 生成风格升级为**高端音乐创作工具**的视觉体验，建立可扩展的设计系统，提升用户感知价值。

### 1.2 核心问题

| 问题类别 | 现状 | 影响 |
|---------|------|------|
| 配色方案 | 天蓝色 (#0ea5e9) 主色调 | 典型 AI 生成风格，缺乏品牌辨识度 |
| 字体系统 | 系统默认字体 | 缺乏专业感和一致性 |
| 组件设计 | 基础 Tailwind 样式 | 视觉层次扁平，交互反馈弱 |
| 动效系统 | 无统一动效 | 界面生硬，缺乏流畅感 |
| 设计语言 | 无设计系统 | 样式分散，维护成本高 |

### 1.3 设计方向

**定位**: 专业音乐创作工具 × 温暖人文气质

**关键词**: 高级感、温暖、专业、克制

**差异化**: 避免冷调科技蓝，采用暖色系 + 深紫主色，传递创意与专业并重的品牌调性。

---

## 2. 设计系统规范

### 2.1 色彩系统

#### 主色 (Primary) - 深紫色

选择理由：紫色代表创意、高端、神秘，与音乐创作的艺术属性契合，同时避开 AI 工具常用的蓝色系。

```
primary-50:  #faf5ff  (背景高亮)
primary-100: #f3e8ff  (悬停背景)
primary-200: #e9d5ff  (边框)
primary-300: #d8b4fe  (禁用态)
primary-400: #c084fc  (次要文字)
primary-500: #a855f7  (图标)
primary-600: #9333ea  ← 主色
primary-700: #7e22ce  (悬停态)
primary-800: #6b21a8  (按下态)
primary-900: #581c87  (深色文字)
```

#### 强调色 (Accent) - 琥珀色

选择理由：暖色调平衡紫色的冷感，传递音乐的温度和能量。

```
accent-50:  #fffbeb
accent-100: #fef3c7
accent-200: #fde68a
accent-300: #fcd34d
accent-400: #fbbf24
accent-500: #f59e0b  ← 强调色
accent-600: #d97706
accent-700: #b45309
accent-800: #92400e
accent-900: #78350f
```

#### 中性色 (Neutral) - 暖灰色

```
neutral-50:  #fafaf9  (页面背景)
neutral-100: #f5f5f4  (卡片背景)
neutral-200: #e7e5e4  (分割线)
neutral-300: #d6d3d1  (禁用边框)
neutral-400: #a8a29e  (占位符文字)
neutral-500: #78716c  (次要文字)
neutral-600: #57534e  (正文)
neutral-700: #44403c  (标题)
neutral-800: #292524  (强调文字)
neutral-900: #1c1917  (最深文字)
```

#### 语义色

```css
/* 成功 */
success-500: #22c55e
success-50:  #f0fdf4

/* 警告 */
warning-500: #f59e0b
warning-50:  #fffbeb

/* 错误 */
error-500: #ef4444
error-50:  #fef2f2

/* 信息 */
info-500: #3b82f6
info-50:  #eff6ff
```

### 2.2 字体系统

#### 字体家族

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-display: 'Cal Sans', 'Inter', sans-serif;  /* 标题展示 */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;  /* 代码/数字 */
```

#### 字体规格

| 用途 | 字号 | 字重 | 行高 | 字间距 |
|-----|------|------|------|--------|
| H1 | 36px / 2.25rem | 700 | 1.2 | -0.02em |
| H2 | 24px / 1.5rem | 600 | 1.3 | -0.01em |
| H3 | 20px / 1.25rem | 600 | 1.4 | 0 |
| Body | 16px / 1rem | 400 | 1.5 | 0 |
| Small | 14px / 0.875rem | 400 | 1.5 | 0 |
| Caption | 12px / 0.75rem | 500 | 1.4 | 0.02em |

### 2.3 间距系统

基于 4px 网格：

```
space-0:  0
space-1:  4px   (0.25rem)
space-2:  8px   (0.5rem)
space-3:  12px  (0.75rem)
space-4:  16px  (1rem)
space-5:  20px  (1.25rem)
space-6:  24px  (1.5rem)
space-8:  32px  (2rem)
space-10: 40px  (2.5rem)
space-12: 48px  (3rem)
space-16: 64px  (4rem)
```

### 2.4 圆角系统

```
radius-sm:   4px   (小元素：标签、徽章)
radius-md:   8px   (按钮、输入框)
radius-lg:   12px  (卡片)
radius-xl:   16px  (大卡片、模态框)
radius-2xl:  24px  (特殊容器)
radius-full: 9999px (圆形)
```

### 2.5 阴影系统

采用柔和阴影，避免生硬边缘：

```css
/* 柔和阴影 */
shadow-soft-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
shadow-soft-sm: 0 2px 4px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
shadow-soft:    0 4px 8px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.02);
shadow-soft-md: 0 8px 16px rgba(0, 0, 0, 0.06), 0 4px 8px rgba(0, 0, 0, 0.03);
shadow-soft-lg: 0 16px 32px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.04);
shadow-soft-xl: 0 24px 48px rgba(0, 0, 0, 0.1), 0 12px 24px rgba(0, 0, 0, 0.05);

/* 发光效果 */
shadow-glow-primary: 0 0 20px rgba(147, 51, 234, 0.3);
shadow-glow-accent:  0 0 20px rgba(245, 158, 11, 0.3);
```

### 2.6 动效系统

#### 时长规范

```
duration-fast:   150ms  (微交互：hover、focus)
duration-normal: 200ms  (状态切换)
duration-slow:   300ms  (展开/收起)
duration-slower: 500ms  (页面过渡)
```

#### 缓动函数

```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);      /* 主要动效 */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);  /* 对称动效 */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* 弹性效果 */
```

#### 预设动画

```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes recording-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

## 3. 组件设计规范

### 3.1 按钮 (Button)

#### 变体

| 变体 | 用途 | 样式 |
|-----|------|------|
| Primary | 主要操作 | 紫色渐变背景，白色文字，悬停发光 |
| Secondary | 次要操作 | 白色背景，灰色边框，悬停背景变灰 |
| Accent | 强调操作 | 琥珀色渐变背景，深色文字 |
| Ghost | 低优先级 | 透明背景，悬停显示背景 |
| Danger | 危险操作 | 红色背景 |

#### 尺寸

| 尺寸 | 高度 | 内边距 | 字号 |
|-----|------|--------|------|
| sm | 32px | 12px 16px | 14px |
| md | 40px | 12px 20px | 14px |
| lg | 48px | 16px 24px | 16px |

#### 状态

```
Default  → Hover (+opacity, +shadow) → Active (scale 0.98) → Disabled (opacity 0.5)
```

### 3.2 卡片 (Card)

#### 变体

| 变体 | 用途 | 样式 |
|-----|------|------|
| Default | 普通容器 | 白色背景，细边框，柔和阴影 |
| Elevated | 突出内容 | 白色背景，无边框，中等阴影 |
| Interactive | 可点击 | 悬停上移 + 阴影加深 |
| Glass | 特殊效果 | 半透明背景，模糊效果 |

#### 规格

```css
.card {
  background: white;
  border: 1px solid var(--neutral-200);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-soft-sm);
}

.card-elevated {
  border: none;
  box-shadow: var(--shadow-soft-md);
}

.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-soft-lg);
}
```

### 3.3 输入框 (Input)

#### 状态样式

| 状态 | 边框 | 背景 | 阴影 |
|-----|------|------|------|
| Default | neutral-300 | white | none |
| Hover | neutral-400 | white | none |
| Focus | primary-500 | white | ring-2 primary-500/20 |
| Error | error-500 | error-50 | ring-2 error-500/20 |
| Disabled | neutral-200 | neutral-100 | none |

### 3.4 标签 (Tag)

#### 变体

```css
.tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 9999px;
}

.tag-primary {
  background: var(--primary-100);
  color: var(--primary-700);
}

.tag-accent {
  background: var(--accent-100);
  color: var(--accent-700);
}

.tag-neutral {
  background: var(--neutral-100);
  color: var(--neutral-600);
}
```

### 3.5 进度条 (Progress)

```css
.progress-bar {
  height: 6px;
  background: var(--neutral-200);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-500), var(--primary-600));
  border-radius: 9999px;
  transition: width 0.3s ease-out;
}
```

---

## 4. 页面重构方案

### 4.1 首页 (/) - 已完成

**设计目标**: 品牌展示 + 视觉冲击 + 快速引导

**关键改动**:
- 渐变背景装饰（暖色调，非蓝紫）
- 浮动音符动画元素
- 文字渐变效果（"哼唱"高亮）
- 特性卡片玻璃态效果
- CTA 按钮发光效果

### 4.2 创作页 (/create) - 待重构

**设计目标**: 流程清晰 + 专注体验 + 状态反馈

#### 布局结构

```
┌─────────────────────────────────────────────┐
│  Header: 步骤指示器                          │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │         主内容区域                   │   │
│  │         (根据步骤切换)               │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│  Footer: 操作按钮                           │
└─────────────────────────────────────────────┘
```

#### 步骤指示器设计

```
○───────●───────○───────○───────○
上传     片段     风格     生成     结果
         ↑
       当前步骤
```

- 已完成: 实心圆 + 主色
- 当前: 实心圆 + 主色 + 发光
- 未完成: 空心圆 + 灰色
- 连接线: 已完成段主色，未完成段灰色

#### 各步骤设计

**Step 1: 上传**
- 大面积拖拽区域
- 录音/上传 Tab 切换（药丸式）
- 录音状态：声波可视化 + 脉冲动画
- 上传状态：进度条 + 文件信息

**Step 2: 片段选择**
- 波形可视化组件
- 可拖拽选区（主色高亮）
- 时间标注
- 跳过选项（次要按钮）

**Step 3: 风格选择**
- 风格网格（2×4 或 3×3）
- 选中态：边框 + 背景 + 勾选图标
- 自定义输入框
- 歌词文本域
- 高级设置折叠面板

**Step 4: 生成中**
- 居中布局
- 大型进度环（渐变描边）
- 百分比数字（大字号）
- 当前步骤文字
- 预计时间提示

**Step 5: 结果**
- A/B 播放器并排
- 主版本标记（星标 + 发光边框）
- 分享链接生成
- 操作按钮组

### 4.3 作品库 (/library) - 待重构

**设计目标**: 高效浏览 + 快速操作

#### 布局

```
┌─────────────────────────────────────────────┐
│  Header: 标题 + 筛选/排序                    │
├─────────────────────────────────────────────┤
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐       │
│  │     │  │     │  │     │  │     │       │
│  │ 卡片 │  │ 卡片 │  │ 卡片 │  │ 卡片 │       │
│  │     │  │     │  │     │  │     │       │
│  └─────┘  └─────┘  └─────┘  └─────┘       │
│                                             │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐       │
│  │     │  │     │  │     │  │     │       │
│  │ 卡片 │  │ 卡片 │  │ 卡片 │  │ 卡片 │       │
│  │     │  │     │  │     │  │     │       │
│  └─────┘  └─────┘  └─────┘  └─────┘       │
└─────────────────────────────────────────────┘
```

#### 卡片设计

```
┌─────────────────────────┐
│  ┌───────────────────┐  │
│  │                   │  │
│  │   封面/波形图      │  │
│  │                   │  │
│  │      ▶ 播放       │  │
│  └───────────────────┘  │
│                         │
│  风格标签    时长        │
│  创建时间               │
│                         │
│  [分享] [删除]          │
└─────────────────────────┘
```

- 悬停显示播放按钮
- 主版本角标
- 操作按钮悬停显示

### 4.4 分享页 (/s/[token]) - 待重构

**设计目标**: 沉浸播放 + 品牌露出

#### 布局

```
┌─────────────────────────────────────────────┐
│                                             │
│              品牌 Logo                       │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│         ┌─────────────────────┐            │
│         │                     │            │
│         │    大型播放器        │            │
│         │    封面 + 波形       │            │
│         │                     │            │
│         │      ▶ 播放         │            │
│         │                     │            │
│         │   进度条 + 时间      │            │
│         │                     │            │
│         └─────────────────────┘            │
│                                             │
│              风格 · 时长                     │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│         [创建你的音乐] CTA                   │
│                                             │
└─────────────────────────────────────────────┘
```

- 深色/浅色主题切换
- 大型居中播放器
- 简洁信息展示
- 品牌引导 CTA

---

## 5. 重构进度

### 5.1 已完成

| 任务 | 文件 | 状态 |
|-----|------|------|
| 设计系统 - Tailwind 配置 | `tailwind.config.js` | ✅ |
| 全局样式 - CSS 变量 | `globals.css` | ✅ |
| 布局 - 字体/元数据 | `layout.tsx` | ✅ |
| 首页 - 品牌展示 | `page.tsx` | ✅ |
| 音频输入组件 | `AudioInput.tsx` | ✅ |
| 录音组件 | `AudioRecorder.tsx` | ✅ |
| A/B 播放器 | `ABPlayer.tsx` | ✅ |
| 高级设置 | `AdvancedSettings.tsx` | ✅ |

### 5.2 待完成

| 任务 | 文件 | 优先级 |
|-----|------|--------|
| 创作页 | `create/page.tsx` | P0 |
| 作品库 | `library/page.tsx` | P1 |
| 分享页 | `s/[token]/page.tsx` | P1 |
| 详情页 | `tracks/[id]/page.tsx` | P2 |
| 波形组件 | `AudioWaveform.tsx` | P2 |

---

## 6. 技术实现要点

### 6.1 CSS 架构

```
globals.css
├── CSS Variables (设计 Token)
├── Base Layer (重置 + 基础样式)
├── Components Layer (可复用组件类)
└── Utilities Layer (工具类扩展)
```

### 6.2 组件模式

```tsx
// 推荐：组合 Tailwind 类 + 设计系统类
<button className="btn btn-primary">
  主要按钮
</button>

// 状态变体使用条件类
<div className={cn(
  "card",
  isActive && "ring-2 ring-primary-500"
)}>
```

### 6.3 动画实现

```tsx
// 使用 Tailwind 动画类
<div className="animate-fade-in">

// 复杂动画使用 CSS Modules 或内联
<div style={{ animation: 'float 3s ease-in-out infinite' }}>
```

### 6.4 响应式策略

```
Mobile First:
- 默认样式为移动端
- md: (768px+) 平板/桌面适配
- lg: (1024px+) 大屏优化
```

---

## 7. 质量检查清单

### 7.1 视觉一致性

- [ ] 所有颜色使用设计 Token
- [ ] 间距遵循 4px 网格
- [ ] 圆角使用预设值
- [ ] 阴影使用柔和系列
- [ ] 字体规格符合规范

### 7.2 交互体验

- [ ] 所有可点击元素有 hover 状态
- [ ] 焦点状态清晰可见
- [ ] 加载状态有反馈
- [ ] 错误状态有提示
- [ ] 动画流畅不卡顿

### 7.3 可访问性

- [ ] 颜色对比度 ≥ 4.5:1
- [ ] 可聚焦元素有焦点样式
- [ ] 图标有 aria-label
- [ ] 表单有关联 label

### 7.4 性能

- [ ] 字体使用 next/font 优化
- [ ] 图片使用 next/image
- [ ] 动画使用 transform/opacity
- [ ] 避免布局抖动

---

## 8. 附录

### 8.1 设计参考

- Linear (产品设计)
- Stripe (细节打磨)
- Vercel (简洁克制)
- Spotify (音乐氛围)

### 8.2 工具链

- Tailwind CSS 3.x
- Next.js 14 App Router
- Inter 字体 (Google Fonts)
- Lucide Icons

### 8.3 文件清单

```
apps/web/
├── tailwind.config.js      # 设计系统配置
├── src/
│   ├── app/
│   │   ├── globals.css     # 全局样式
│   │   ├── layout.tsx      # 根布局
│   │   ├── page.tsx        # 首页
│   │   ├── create/
│   │   │   └── page.tsx    # 创作页
│   │   ├── library/
│   │   │   └── page.tsx    # 作品库
│   │   ├── s/
│   │   │   └── [token]/
│   │   │       └── page.tsx # 分享页
│   │   └── tracks/
│   │       └── [id]/
│   │           └── page.tsx # 详情页
│   └── components/
│       ├── AudioInput.tsx
│       ├── AudioRecorder.tsx
│       ├── AudioWaveform.tsx
│       ├── ABPlayer.tsx
│       └── AdvancedSettings.tsx
```

---

*文档结束*
