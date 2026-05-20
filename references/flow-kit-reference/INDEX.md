# flow-kit/reference 参考文件索引

> 来源: `flow-kit/reference/` 目录，已复制到 devflow 作为自引用参考。
> 每个文件有明确的触发条件和使用阶段，AI 按任务类型自动判定加载。

> **DEDUP NOTICE**: 以下 5 个文件同时存在于 `references/reference/` 目录（规范位置）。
> 两份内容目前一致，但 `references/reference/` 为规范源。后续更新请只修改 `references/reference/` 中的版本，
> 并同步到本目录。长期计划：本目录副本替换为符号链接或删除。
> - frontend-engineer-rules.md
> - tech-stacks.md
> - test-pyramid.md
> - ui-aesthetics.md
> - ui-anti-patterns.md

---

## 文件清单

| 文件 | 触发条件 | 对应 devflow 阶段 | 定位 |
|------|----------|-------------------|------|
| [tech-stacks.md](tech-stacks.md) | Phase 2 做技术选型前 | Phase 2 方案设计 | 10 张完整工程模板卡片 |
| [ui-aesthetics.md](ui-aesthetics.md) | 前端项目 + UI 设计 | Phase 2a / Phase 2 | 9 种调性卡片 + 美学决策框架 |
| [frontend-engineer-rules.md](frontend-engineer-rules.md) | 任务涉及 HTML/CSS/JS/React | Phase 4 实施开发 | 11 节完整规范（React+Babel 硬规则 / CSS 硬规则 / 文件管理 / 动画分层 / Tweaks 面板 / 输出类型指引 / 交付前清单等） |
| [ui-anti-patterns.md](ui-anti-patterns.md) | Phase 4 实现前 + Phase 6 review 前 | Phase 4 / Phase 6 | grep 自检清单 |
| [test-pyramid.md](test-pyramid.md) | Phase 5 需要执行测试时 | Phase 5 测试验证 | 5 轮测试的操作手册 + 适用矩阵 |

---

## 使用方式

### tech-stacks.md — 技术栈预选

**何时触发**: Phase 2 在 ADR / 架构图前，需要选定一个完整工程模板。

**怎么使用**:
1. 读取 REQUIREMENT.md 的 AC + 非功能性需求 + CONTEXT.md 团队画像
2. 从 10 张卡片中挑 4~6 张最匹配的展示给用户（不是全列）
3. 必须给 **1 首选 + 1 备选 + 1~2 不推荐项**，每项有结合项目特征的理由
4. 用户选定后写入 `DESIGN.md` 的 `## 0. 技术栈选定` 段
5. 后续所有 ADR / 数据流 / 架构图 / 测试工具链都基于这个栈展开

**特殊规则**:
- 国内项目优先 7️⃣ Spring Boot 中后台
- 库 / SDK / CLI → 跳过本步，直接选语言
- 用户已有强偏好 → 跳过卡片直接锁定

### ui-aesthetics.md — UI 美学决策

**何时触发**: 识别为前端项目后，0-change 阶段必须展示调性卡片给用户选。

**怎么使用**:
1. 显式回答"4 个问题"：目的 / 调性 / 约束 / 差异化
2. 展示 9 种调性卡片（编辑式/极简/工业/玩具/奢华/有机/复古未来/粗野/极繁）
3. 必须给 1 首选 + 1 备选，不允许"任选都行"
4. 显式排除明显不合适的调性
5. 用户已有强偏好（"参考 Notion"）→ 直接锁定

**实施层 5 维度**: 字体 / 颜色 / 动效 / 空间布局 / 背景与质感

**外部扩展降级路径**:
- `ui-ux-pro-max` 装了 → 调性卡片源 / 调色板 / 字体配对走它
- `impeccable` 装了 → 视觉决策深化 / anti-pattern 检测走它
- 都没装 → 用本文件 9 调性卡片（够用）

### frontend-engineer-rules.md — 前端硬规则

**何时触发**: 任务 files 含 `.html/.jsx/.tsx/.css/.scss/.vue/.svelte` 或 action 含 UI/组件/页面/动画 等。

**怎么使用**:
1. **必读三条硬规则**:
   - 禁止用 `const styles = {...}` 作全局变量名
   - 跨文件组件必须 `Object.assign(window, {...})`
   - 禁用 `scrollIntoView`
2. **CSS 规则**: 颜色来自 UI-DESIGN.md / Grid+Flexbox 主布局 / 字体硬禁 Inter/Roboto 等
3. **动画分层**: CSS transitions → React state → 自定义 useTime → Popmotion（从轻到重）
4. **交付前清单**: 11 项逐项过（console 无错误/响应式/状态覆盖/颜色一致性等）

### ui-anti-patterns.md — UI 反模式清单

**何时触发**: Phase 4 实现前 grep / Phase 6 review 前比对。

**怎么使用**:
1. **实现前**: 用任务关键词（颜色/字体/卡片/按钮/动画/布局/边框/阴影）grep 本文件
2. 把命中的禁忌逐条声明："已知 X 是禁忌，本任务不涉及/本任务采用 Y 替代"
3. **实现后**: self-review 再扫一遍
4. **Review 阶段**: 把 diff 与本清单逐条比对，命中即标 🔴 Critical

**强制禁忌类别**: 字体类 / 颜色类 / 阴影类 / 边框类 / 动效类 / 布局类 / 文案类 / 组件类

### test-pyramid.md — 测试金字塔

**何时触发**: Phase 5 需要确定做哪几轮测试时。

**怎么使用**:
1. 按项目类型从"适用矩阵"确定走哪几轮（5 轮）
2. **第 1 轮·功能测试**: 每条 AC 有自动化覆盖/可执行 UAT，按技术栈选工具
3. **第 2 轮·性能测试**: 可量化/有基线/有预算，前端看 Lighthouse/后端看 k6/wrk
4. **第 3 轮·安全测试**: 依赖/代码/秘钥/输入/鉴权五道防线
5. **第 4 轮·兼容性测试**: 跨浏览器/跨设备/跨版本/数据迁移
6. **第 5 轮·可观测性验证**: 日志/指标/链路追踪/告警/健康检查

**适用矩阵**: 前端 SaaS / 后端 API / 全栈 web / 移动 app / CLI / 库 SDK / 内部工具，各轮有必跑/推荐/不适用三态。

**`5-test.md` 规则**: 阶段开始时必须显式声明走哪几轮 + 跳过哪些 + 跳过理由。

---

## 与外部扩展的协作关系

| 扩展 | flow-kit 对应文件 | 作用 |
|------|-------------------|------|
| `ui-ux-pro-max` | ui-aesthetics.md | 67 styles + 161 palettes + 57 font pairings，装了则调性/调色板/字体走它 |
| `impeccable` | ui-aesthetics.md + ui-anti-patterns.md | 23 个细粒度 UI 命令 + detect，装了则视觉决策深化/anti-pattern 检测走它 |
| `playwright-cli` | test-pyramid.md | 跨浏览器 e2e 测试执行 |

---

## 整合日期

2026-05-19 — 从 flow-kit/reference/ 复制到 devflow/references/flow-kit-reference/，建立索引并更新对应 Phase 引用。
