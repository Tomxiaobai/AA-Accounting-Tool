# UI 设计指南

> **设计类型**: App 设计（应用架构设计）
> **确认检查**: 本指南适用于可交互的应用/网站/工具。

> ℹ️ Section 1-2 为设计意图与决策上下文。Code agent 实现时以 Section 3 及之后的具体参数为准。

## 1. Design Archetype (设计原型)

### 1.1 内容理解

- **目标用户**: 追求精致体验的 iOS 用户，习惯苹果原生应用的交互逻辑，对视觉细节敏感，期望清晰、流畅、无干扰的记账体验。
- **核心目的**: 高效记录与管理 AA 账单，清晰展示分摊逻辑与统计结果，降低多人财务往来的认知负担。
- **期望情绪**: 轻松（记账不沉重）、清晰（数据一目了然）、信任（金额计算准确）、精致（符合高端审美）。
- **需避免的感受**: 杂乱（信息堆砌）、廉价（粗糙的 UI）、焦虑（复杂的操作）、困惑（不清楚谁欠谁）。

### 1.2 设计语言

- **Aesthetic Direction**: **"Digital Glass & Soft Depth" (数字玻璃与柔和深度)**。借鉴 Apple iOS 的设计哲学，利用大圆角、高斯模糊（Backdrop Blur）、分层阴影和半透明材质，营造轻盈通透的空间感。
- **Visual Signature**:
  1.  **大圆角卡片**: 统一使用 `rounded-3xl` (24px+)，模拟 iOS 小组件形态。
  2.  **毛玻璃层级**: 关键操作区（如底部导航、顶部标题栏）使用 `backdrop-blur-xl` + 半透明白/黑背景。
  3.  **柔和色彩**: 主色采用低饱和度的"苹果蓝"或"薄荷绿"，搭配纯白背景与浅灰分割线。
  4.  **超大标题**: 页面标题使用大号加粗字体 (`text-3xl` / `font-bold`)，强调内容层级。
- **Emotional Tone**: **Clear & Airy (清晰通透)** —— 让金钱往来显得轻松而非沉重，通过留白和光影建立秩序感。
- **Design Style**: **Rounded 圆润几何 (Apple Modern Variant)** — 专为移动端优化，极致圆角 + 毛玻璃质感 + 柔和阴影，复刻 iOS 原生体验。
- **Application Type**: Mobile-First Tool (移动优先工具类应用)。

## 2. Design Principles (设计理念)

1.  **Content First, Chrome Last**: 界面元素（边框、背景）应尽可能退后，让账单金额、分类图表成为视觉绝对重心。
2.  **Tactile Depth**: 通过阴影和模糊层建立 Z 轴深度，让用户感觉到按钮是"浮"在内容之上的，操作具有物理实感。
3.  **Forgiving Interaction**: 触控区域要大（最小 44x44pt），反馈要即时且柔和，避免误触带来的挫败感。
4.  **Semantic Color**: 颜色仅用于表达状态（支出/收入/警告）和引导行动，不使用装饰性渐变色块干扰数据阅读。

## 3. Color System (色彩系统)

> **配色设计理由**: 基于"苹果风格"推导，放弃高饱和度霓虹色，选择接近 iOS 系统色的清新色调。主色选用清新的"薄荷青"代表资金流动，既专业又不失活力；背景采用极浅的冷灰白，避免纯白的刺眼，提升长时间阅读的舒适度。

### 3.1 主题颜色

> **Color Token 语义速查**:
> - `primary` → 核心行动：新建账单、添加消费、确认邀请
> - `accent` → 交互反馈：列表项选中、按钮 Hover、骨架屏
> - `muted` → 次要信息：辅助说明、禁用态、时间戳

| 角色               | CSS 变量               | Tailwind Class            | HSL 值              | 设计说明                 |
| ------------------ | ---------------------- | ------------------------- | ------------------- | ------------------------ |
| bg                 | `--background`         | `bg-background`           | hsl(210 20% 98%)    | 极浅冷灰白，类似 iOS 设置页背景 |
| card               | `--card`               | `bg-card`                 | hsl(0 0% 100%)      | 纯白卡片，承载主要内容   |
| text               | `--foreground`         | `text-foreground`         | hsl(215 25% 15%)    | 深炭灰，非纯黑，柔和易读 |
| textMuted          | `--muted-foreground`   | `text-muted-foreground`   | hsl(215 15% 55%)    | 中灰色，用于次要文本     |
| primary            | `--primary`            | `bg-primary`              | hsl(165 70% 45%)    | **薄荷青**，清新且醒目的主行动色 |
| primary-foreground | `--primary-foreground` | `text-primary-foreground` | hsl(0 0% 100%)      | 白色文字                 |
| accent             | `--accent`             | `bg-accent`               | hsl(165 40% 94%)    | 极淡薄荷色，用于 Hover/选中态 |
| accent-foreground  | `--accent-foreground`  | `text-accent-foreground`  | hsl(165 80% 25%)    | 深色文字，确保对比度     |
| border             | `--border`             | `border-border`           | hsl(215 20% 88%)    | 浅灰边框，定义卡片边界   |
| destructive        | `--destructive`        | `bg-destructive`          | hsl(0 85% 60%)      | 柔和红，用于删除/负数    |

### 3.2 Sidebar 颜色

> 本应用为移动端优先，主要采用 Bottom Navigation 或 Top Bar 结构，**不使用 Sidebar**。此节跳过。

### 3.3 Topbar/Header 设计策略

> **定义时机**: 适用于所有页面的顶部导航区域。
> **设计原则**: 模拟 iOS 原生导航栏，强调通透感和内容的一体性。

**背景策略**:
- 使用 `bg-background/80` + `backdrop-blur-xl`。
- 滚动时内容在导航栏下模糊透出，营造层次感。
- 底部添加极细边框 `border-b border-border/50` 进行微弱分隔。

**文字与图标**:
- 默认态: `text-foreground` (标题), `text-muted-foreground` (返回/辅助图标)。
- 激活态/操作按钮: `text-primary` 或 实心 Primary 按钮。
- 标题样式: `text-lg font-semibold tracking-tight`，居中或左对齐（视具体页面而定）。

**边框与分隔**:
- 仅保留底部 0.5px 边框，颜色透明度设为 50%，避免视觉割裂。

### 3.4 语义颜色

> 用于账单状态、收支方向及统计图表。

| 用途       | 色相方向            | HSL 参考              | 应用场景                     |
| ---------- | ------------------- | --------------------- | ---------------------------- |
| 支出/减少  | 红色系 (Soft Red)   | hsl(350 80% 60%)      | 消费记录、负向金额           |
| 收入/增加  | 绿色系 (Soft Green) | hsl(145 60% 45%)      | 退款、正向金额               |
| 待支付     | 橙色系 (Soft Orange)| hsl(30 90% 60%)       | 未结清账单标记               |
| 已结清     | 蓝色系 (Soft Blue)  | hsl(210 90% 55%)      | 已完成状态                   |
| 图表系列 1 | Primary (薄荷青)    | hsl(165 70% 45%)      | 饼图最大占比部分             |
| 图表系列 2 | 互补蓝              | hsl(210 80% 55%)      | 饼图次大占比部分             |
| 图表系列 3 | 温暖黄              | hsl(45 90% 60%)       | 饼图第三部分                 |
| 图表系列 4 | 柔和紫              | hsl(260 60% 65%)      | 饼图第四部分                 |

## 4. Typography (字体排版)

- **Heading**: `system-ui` (优先调用 San Francisco), `-apple-system`, `BlinkMacSystemFont`, `Inter`, `sans-serif`
- **Body**: `system-ui`, `-apple-system`, `BlinkMacSystemFont`, `Inter`, `sans-serif`
- **Numbers**: `font-mono` (仅在展示精确金额时使用，确保数字对齐), 或 `tabular-nums` 类名
- **字体导入**: 无需额外导入，直接使用系统字体栈以获得最佳原生体验。

```css
/* 全局字体设置建议 */
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.font-money {
  font-feature-settings: "tnum"; /* 启用等宽数字 */
  letter-spacing: -0.02em; /* 轻微收紧，更显精致 */
}
```

## 5. Layout Strategy (布局策略)

### 5.1 结构方向

**导航策略**:
- **移动端**: 采用 **Bottom Tab Bar** (底部标签栏) 或 **Top Bar + 列表流**。
  - 理由：单手操作友好，符合 iOS 应用习惯。主要入口（列表、统计）置于底部，当前账单详情作为深层页面。
- **桌面/平板适配**: 自动转换为 **Sidebar + Top Bar** 布局，利用宽屏空间展示更多列数据。

**页面架构特征**:
- **单列流式布局**: 内容垂直排列，卡片宽度随屏幕自适应，最大宽度限制在 `max-w-md` (手机) 或 `max-w-2xl` (平板/桌面)，保持阅读舒适性。
- **安全区域**: 严格遵循 `safe-area-inset`，确保刘海屏/灵动岛内容不被遮挡。

### 5.2 响应式原则

**断点策略**:
- **Mobile (< 640px)**: 全屏卡片，按钮通栏，导航底置。
- **Tablet/Desktop (≥ 640px)**: 内容居中，两侧留白，导航侧置（可选），卡片并排展示（如统计页）。

**内容密度**:
- 移动端适当增大行高 (`leading-relaxed`) 和触控区 (`min-h-[44px]`)。
- 桌面端可适当紧凑，展示更多表格列。

## 6. Visual Language (视觉语言)

**形态特征**:
- **Super Rounded Corners**: 所有卡片、按钮、输入框统一使用 `rounded-3xl` (24px) 或 `rounded-full` (胶囊形)，消除锐利边缘。
- **Soft Shadows**: 使用多层阴影模拟自然光，`shadow-sm` (日常), `shadow-lg` (悬浮/模态), `shadow-xl` (重要操作)。
  - 示例阴影: `shadow-[0_8px_30px_rgb(0,0,0,0.04)]`
- **Glassmorphism**: 导航栏、浮动操作按钮 (FAB)、模态框背景使用 `bg-white/80 backdrop-blur-xl border border-white/20`。

**装饰策略**:
- **极简主义**: 去除所有不必要的分割线，利用间距 (`space-y-6`) 和背景色差区分区块。
- **微渐变**: 仅在 Primary 按钮或图表中使用极细微的线性渐变 (`from-primary to-primary/90`)，增加质感。
- **图标风格**: 使用线性图标 (Stroke Icons) 或 双色调图标 (Duotone)，线条圆润，端点圆形 (`round cap`)。

**动效原则**:
- **Spring Animation**: 按钮点击、模态框弹出使用弹性缓动 (`cubic-bezier(0.34, 1.56, 0.64, 1)`)，模仿 iOS 物理效果。
- **Duration**: 快速反馈 150ms，页面转场 300ms。
- **Hover**: 移动端忽略 Hover，桌面端 Hover 时卡片轻微上浮 (`-translate-y-1`) 且阴影加深。

**可及性保障**:
- 文字对比度严格遵循 WCAG AA (4.5:1)。
- 触摸目标最小尺寸 44x44 pt。
- 聚焦状态 (`focus-visible`) 使用清晰的 `ring-2 ring-primary ring-offset-2`。

## 7. Component Principles (组件原则)

**状态完整性**:
- **Button**: Default (实心/描边) -> Pressed (缩放至 95% + 亮度降低) -> Disabled (opacity-50 + cursor-not-allowed)。
- **Input**: Default (浅灰底) -> Focus (白底 + Primary Ring + 阴影) -> Error (红环 + 错误提示)。
- **Card**: 默认无边框或极细边框，Hover 时浮现阴影。

**层级清晰**:
- **Primary Button**: 全宽或大尺寸，实心填充，位于操作区最显眼位置（右下角或底部固定）。
- **Secondary Button**: 描边或浅色背景，用于"取消"、"稍后"等非核心操作。
- **Ghost Button**: 仅文字/图标，用于列表内的次要操作（如"编辑"）。

**一致性**:
- 所有金额显示统一右对齐，使用 `tabular-nums`。
- 所有头像/图标统一圆角风格。
- 弹窗 (Modal/Sheet) 必须从底部滑出 (Mobile) 或居中淡入 (Desktop)，并带有遮罩层。

## 8. Design Signature (设计签名)

**核心识别特征**:
1.  **"Floating Islands"**: 内容区块像一个个漂浮的白色岛屿，置于浅灰背景之上，拥有巨大的圆角和柔和的投影。
2.  **"Blur Barrier"**: 顶部导航和底部操作栏永远保持磨砂玻璃质感，内容滚动时在后方模糊掠过。
3.  **"Vibrant Data"**: 数据图表使用高明度、中饱和度的马卡龙色系，配合白色背景和深灰文字，既活泼又清晰。
4.  **"Human Touch"**: 按钮点击有明显的物理回弹感，交互反馈细腻，拒绝生硬的切换。

**应避免**:
- ❌ **过度拟物**: 不要使用厚重的纹理、高光或真实的皮革/纸张质感。
- ❌ **纯黑纯白**: 避免 `#000000` 和 `#FFFFFF` 的直接强烈对比，使用带有色相倾向的深灰和浅灰。
- ❌ **锐利直角**: 除非是特殊数据表格，否则避免 `rounded-none` 或 `rounded-sm`。
- ❌ **复杂渐变背景**: 整个页面背景应保持干净，渐变仅用于小面积点缀。