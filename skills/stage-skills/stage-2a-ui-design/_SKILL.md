# devflow-kit Stage: 2a-UI Design（UI设计）

> **阶段定位**：前端项目的视觉和交互设计
> **前置条件**：02-design.md 已完成，项目类型为前端
> **后置产物**：`.devflow-kit/<req-id>/02a-ui-design.md`

## Skill元信息

```yaml
name: stage-2a-ui-design
version: 1.0.0
description: devflow-kit工作流第2a阶段 - UI设计与交互规范
author: devflow-kit
dependencies:
  - frontend-ui-engineering
```

## 输入

- `.devflow-kit/<req-id>/00-requirements.md`
- `.devflow-kit/<req-id>/01-analysis.md`
- `.devflow-kit/<req-id>/02-design.md`（必读 `## 0` 段）
- `.devflow-kit/CONTEXT.md`
- `references/reference/ui-aesthetics.md`（按节读取）
- `references/reference/ui-anti-patterns.md`（75行可全读）

## 输出

- `.devflow-kit/<req-id>/02a-ui-design.md`
- 更新 `.devflow-kit/STATE.md`

## 入口门禁

```markdown
IF 缺 02-design.md:
  输出: "规则 R2.7 触发：2a-ui-design 缺少 02-design.md。本次先回到 2-design 补齐。"
  STOP

IF 项目类型非前端（纯后端/CLI/lib）:
  输出: "⚠️ 本项目非前端项目，跳过UI设计阶段。"
  路由到: 3-task
  STOP
```

## 执行流程

### Step 1: 读取参考文档

**ui-aesthetics.md**：
- grep "5维度" → 读取美学评估框架
- grep "给AI的模板" → 读取UI设计规范

**ui-anti-patterns.md**：
- 全读（75行），了解常见UI反模式

### Step 2: 定义UI组件树

根据需求和设计，列出所有UI组件：

```markdown
## UI组件树

```
App
├── Header
│   ├── Logo
│   ├── Navigation
│   └── UserMenu
├── MainContent
│   ├── NotificationList
│   │   ├── NotificationItem (xN)
│   │   └── EmptyState
│   └── Pagination
└── Footer
```

**组件职责**：
- NotificationList: 展示通知列表，处理分页
- NotificationItem: 单个通知项，显示标题/内容/时间
- EmptyState: 空状态提示
```

### Step 3: 交互状态设计

为每个关键组件定义状态：

```markdown
## 交互状态

### NotificationList

| 状态 | 说明 | UI表现 |
|---|------|---|
| Loading | 数据加载中 | 显示骨架屏 |
| Empty | 无数据 | 显示EmptyState + CTA按钮 |
| Error | 加载失败 | 显示错误提示 + 重试按钮 |
| Success | 正常展示 | 显示列表 + 分页 |

### NotificationItem

| 状态 | 说明 | UI表现 |
|---|------|---|
| Unread | 未读 | 蓝色背景 + 粗体标题 |
| Read | 已读 | 白色背景 + 普通字体 |
| Hover | 鼠标悬停 | 显示操作按钮（标记已读/删除） |
```

### Step 4: 响应式设计

定义断点和布局策略：

```markdown
## 响应式断点

| 断点 | 宽度 | 布局策略 |
|---|------|---|
| Mobile | < 768px | 单列，隐藏侧边栏 |
| Tablet | 768-1024px | 双列，压缩间距 |
| Desktop | > 1024px | 三列，完整布局 |

**Mobile适配**：
- 导航改为汉堡菜单
- 列表项垂直堆叠
- 触摸目标 ≥ 44px
```

### Step 5: 无障碍设计（WCAG 2.1 AA）

```markdown
## 无障碍要求

**颜色对比度**：
- 正文文本: ≥ 4.5:1
- 大文本: ≥ 3:1
- UI组件: ≥ 3:1

**键盘导航**：
- 所有交互元素可Tab聚焦
- 焦点可见（outline不为none）
- Escape关闭弹窗

**屏幕阅读器**：
- 语义化HTML（nav/main/article）
- ARIA标签（aria-label/aria-live）
- 图片alt文本

**示例**：
```tsx
<button 
  aria-label="标记为已读"
  onClick={markAsRead}
>
  ✓
</button>
```
```

### Step 6: 动画与过渡

```markdown
## 动画规范

**原则**：
- 持续时间: 150-300ms
- 缓动函数: ease-out
- 避免影响性能的动画（layout shift）

**关键动画**：
1. 通知出现: fade-in + slide-up (200ms)
2. 标记已读: background-color transition (150ms)
3. 删除通知: fade-out + collapse (200ms)

**性能优化**：
- 使用transform/opacity（GPU加速）
- 避免animate width/height
- will-change提示浏览器
```

### Step 7: 设计Token定义

```markdown
## 设计Token

**颜色**：
```css
:root {
  --color-primary: #3B82F6;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  
  --bg-primary: #FFFFFF;
  --bg-secondary: #F3F4F6;
  
  --text-primary: #111827;
  --text-secondary: #6B7280;
}
```

**间距**：
```css
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
}
```

**字体**：
```css
:root {
  --font-family: 'Inter', -apple-system, sans-serif;
  --font-size-sm: 14px;
  --font-size-md: 16px;
  --font-size-lg: 18px;
}
```
```

### Step 8: 反模式检查

对照 `ui-anti-patterns.md` 检查：

```markdown
## 反模式检查

- ⏳ ✅ 无自动播放音频/视频
- ⏳ ✅ 无无限滚动加载（有分页）
- ⏳ ✅ 表单有明确的错误提示
- ⏳ ✅ 无隐藏的功能（所有操作可见）
- ⏳ ✅ 加载状态有反馈
- ⏳ ✅ 无闪烁内容（FOUC）
```

### Step 9: 读取模板并提取段落清单

**⚠️ 强制规则**：必须使用 `read_file` 工具读取模板文件。

```python
# 伪代码示例
read_file("templates/02a-ui-design.md")
```

**从模板中提取必填段落清单**：
```
□ UI组件树
□ 交互状态定义
□ 响应式设计
□ 无障碍要求
□ 动画规范
□ 设计Token
□ 反模式检查结果
```

**注意**：
- 所有7个段落都必须包含，不得省略
- 每个段落必须有具体内容，不能为空

### Step 10: 生成产物并逐项核对

按模板生成 `.devflow-kit/<req-id>/02a-ui-design.md`：
- **必须包含模板所有7个段落**（见 Step 9 提取的清单）
- **所有 `<...>` 占位符必须替换为实际值**
- **反模式检查必须全部通过**

**生成后核对**：
```markdown
产物核对清单：
- ⏳ UI组件树 → 已包含
- ⏳ 交互状态定义 → 已包含（loading/error/empty/success）
- ⏳ 响应式设计 → 已包含（断点明确）
- ⏳ 无障碍要求 → 已包含（WCAG 2.1 AA）
- ⏳ 动画规范 → 已包含（性能考虑）
- ⏳ 设计Token → 已包含
- ⏳ 反模式检查结果 → 已包含（全部通过）
```

**如果有缺失**：立即补齐，不得进入下一步。

### Step 11: 更新项目状态

```markdown
当前阶段: ui-design
阶段状态: completed
上次完成阶段: ui-design
下一阶段: task
```

## 自检清单

- ⏳ **已使用 read_file 读取模板文件** `templates/02a-ui-design.md`
- ⏳ **已从模板提取必填段落清单**（7个段落）
- ⏳ UI组件树完整清晰
- ⏳ 所有关键组件有交互状态定义
- ⏳ 响应式断点明确
- ⏳ WCAG 2.1 AA要求覆盖
- ⏳ 动画有性能考虑
- ⏳ 设计Token已定义
- ⏳ 反模式检查通过
- ⏳ **产物包含模板所有7个段落**（见 Step 10 核对清单）
- ⏳ **生成后已逐项核对**（无缺失段落）
- ⏳ STATE.md已更新

## 约束

- **禁止**忽略无障碍设计
- **禁止**使用不符合对比度的颜色
- **必须**定义所有交互状态（loading/error/empty）
- **必须**通过反模式检查

## 触发下一步

加载 `skills/stage-skills/stage-3-task/_SKILL.md`

## 错误处理

- 设计冲突 → 回到2-design调整技术方案
- 无障碍不达标 → 修正颜色和对比度
- 性能问题 → 优化动画和渲染策略

