---
name: browser-qa
preamble-tier: 2
version: 1.0.0
layer: L2-ENGINE
gate: G6.5
requires: [wave-executor]
provides: [playwright-test-generation, browser-test-execution, bug-report, visual-regression]
description: |
  浏览器 QA — Phase 5 浏览器测试子阶段。基于 Playwright 自动生成和执行 E2E 测试，
  截图对比，自动生成 Bug 报告（含截图+分级）。仅前端/UI 项目启用。
  参考: gstack /qa 真实浏览器测试 + Playwright。
source: CHANGELOG v1.2.0 — gstack /qa + Playwright
dependencies:
  - wave-executor (Phase 5 触发)
  - real-time-review (审查结果参考)
  - token-monitor (测试执行受 Token 预算控制)
triggers:
  - Phase 5 代码级测试通过后自动触发
  - 手动触发: /qa browser
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
external-inputs: [design-spec, user-flows]
---

# Browser QA — 浏览器 QA

> **核心问题**: 当前仅代码级测试，无浏览器端 E2E 测试，UI Bug 检出率低。
> **解决方案**: Phase 5 增加浏览器 QA 子阶段，基于 Playwright 自动生成和执行 E2E 测试，截图对比，自动生成分级 Bug 报告。

---

## 1. Phase 5 浏览器 QA 子阶段

### 1.1 流程概览

```
Phase 5 测试验证
  │
  ├─ Step 1: 代码级测试 (现有)
  │   ├─ 单元测试
  │   ├─ 集成测试
  │   └─ G6 Gate
  │
  └─ Step 2: 浏览器 QA (新增) ← 仅前端/UI 项目
      ├─ 2.1 自动生成 Playwright 测试
      │   ├─ 基于设计文档生成测试用例
      │   ├─ 基于用户流程生成 E2E 场景
      │   └─ 输出: e2e/<feature>.spec.ts
      │
      ├─ 2.2 执行浏览器测试
      │   ├─ 启动 Playwright
      │   ├─ 执行测试用例
      │   ├─ 截图对比
      │   └─ 输出: test-results/
      │
      ├─ 2.3 Bug 报告
      │   ├─ 自动生成 Bug 报告（含截图）
      │   ├─ 分级: P0(崩溃)/P1(功能异常)/P2(UI瑕疵)
      │   └─ 输出: .forgeos/<req-id>/browser-qa-report.md
      │
      └─ 2.4 G6.5 Gate (浏览器 QA 门控)
          ├─ P0 Bug → Gate FAIL
          ├─ P1 Bug → Gate WARN (用户确认)
          └─ P2 Bug → Gate PASS (记录)
```

### 1.2 启用条件

```yaml
browser_qa_enabled:
  # 必须同时满足以下条件
  conditions:
    - is_frontend_project: true    # 检测到前端技术栈
    - playwright_available: true    # Playwright 已安装
    - dev_server_running: true      # 开发服务器可访问
    - user_consent: true           # 用户未禁用浏览器 QA

  # 前端项目检测规则
  frontend_indicators:
    - "package.json contains react/vue/svelte/angular/next/nuxt"
    - "src/ contains .tsx/.jsx/.vue/.svelte files"
    - "public/ or static/ directory exists"
    - "HTML entry point exists"
```

---

## 2. Playwright 测试自动生成

### 2.1 生成策略

| 来源 | 生成内容 | 优先级 |
|------|---------|--------|
| 设计文档 (02-design.md) | 页面交互测试用例 | HIGH |
| 用户流程 (user stories) | 端到端场景测试 | HIGH |
| API 文档 | 表单提交和数据展示测试 | MEDIUM |
| 项目宪法 | 可访问性和响应式测试 | LOW |

### 2.2 测试用例模板

```typescript
// e2e/<feature>.spec.ts — 由 ForgeOS Browser QA 自动生成
import { test, expect } from '@playwright/test';

test.describe('<Feature Name>', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/<route>');
  });

  test('should display <element> correctly', async ({ page }) => {
    // Arrange — 确保页面加载完成
    await page.waitForSelector('<selector>');

    // Act — 执行操作
    await page.locator('<button-selector>').click();

    // Assert — 验证结果
    await expect(page.locator('<result-selector>')).toBeVisible();
    await expect(page).toHaveScreenshot('<feature>-<state>.png');
  });

  test('should handle <error-case> gracefully', async ({ page }) => {
    // 错误处理测试
    await page.route('**/api/<endpoint>', route =>
      route.fulfill({ status: 500, body: 'Server Error' })
    );

    await page.locator('<trigger-selector>').click();
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('should be accessible', async ({ page }) => {
    // 可访问性测试
    const accessibilityResults = await page.accessibility.snapshot();
    // 验证 aria 标签、键盘导航等
  });
});
```

### 2.3 生成规则

```yaml
test_generation_rules:
  # 每个用户流程至少生成 3 个测试
  min_tests_per_flow: 3

  # 测试类型覆盖
  required_test_types:
    - happy_path: true          # 正常流程
    - error_handling: true      # 错误处理
    - edge_case: true           # 边界条件

  # 截图对比
  screenshot_comparison:
    enabled: true
    max_diff_percentage: 0.5    # 允许 0.5% 像素差异
    threshold: 0.2              # 差异阈值

  # 可访问性
  accessibility:
    check_aria_labels: true
    check_color_contrast: true
    check_keyboard_nav: true

  # 响应式
  responsive:
    viewports:
      - name: mobile
        width: 375
        height: 667
      - name: tablet
        width: 768
        height: 1024
      - name: desktop
        width: 1280
        height: 720
```

---

## 3. 测试执行

### 3.1 执行流程

```bash
# 1. 启动开发服务器（如果未运行）
npm run dev &

# 2. 安装 Playwright 浏览器（如果未安装）
npx playwright install chromium

# 3. 执行 Playwright 测试
npx playwright test --reporter=html,json

# 4. 收集测试结果
# - test-results/ 目录
# - screenshots/ 目录
# - playwright-report/ 目录
```

### 3.2 执行配置

```typescript
// playwright.config.ts — Browser QA 自动生成
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
```

### 3.3 超时和重试策略

| 场景 | 超时 | 重试 | 说明 |
|------|------|------|------|
| 页面加载 | 10s | 1 | 网络不稳定容忍 |
| 元素等待 | 5s | 0 | 元素不存在是 Bug |
| 测试执行 | 30s | 1 | Flaky test 容忍 |
| 截图对比 | 10s | 0 | 差异即问题 |

---

## 4. Bug 报告

### 4.1 Bug 分级标准

| 级别 | 定义 | 示例 | G6.5 决策 |
|------|------|------|----------|
| **P0** | 崩溃/白屏/核心功能完全不可用 | 页面 500 错误、JS 崩溃、白屏 | Gate FAIL |
| **P1** | 功能异常/数据错误/交互失效 | 表单提交无响应、数据展示错误、路由 404 | Gate WARN |
| **P2** | UI 瑕疵/样式偏差/体验问题 | 字体大小不一致、间距偏差、动画卡顿 | Gate PASS |

### 4.2 Bug 报告模板

```markdown
# Browser QA Report — {feature}

**日期**: {YYYY-MM-DD}
**测试用例数**: {total}
**通过**: {passed}
**失败**: {failed}
**跳过**: {skipped}

## Bug 列表

### 🔴 P0: {Bug 标题}

**测试用例**: `<feature>.spec.ts > should <behavior>`
**截图**: ![P0 Bug](screenshots/p0-bug-1.png)
**环境**: Chromium, Desktop (1280x720)
**复现步骤**:
1. 访问 /{route}
2. 点击 {button}
3. 页面白屏，控制台报错: `{error_message}`
**期望行为**: 页面应正常显示 {expected_result}
**实际行为**: {actual_result}

---

### 🟡 P1: {Bug 标题}

**测试用例**: `<feature>.spec.ts > should <behavior>`
**截图**: ![P1 Bug](screenshots/p1-bug-1.png)
**环境**: Chromium, Mobile (375x667)
**复现步骤**:
1. 访问 /{route}
2. 点击 {button}
3. 无响应，请求超时
**期望行为**: {expected_result}
**实际行为**: {actual_result}

---

### 🟢 P2: {Bug 标题}

**测试用例**: `<feature>.spec.ts > should <behavior>`
**截图**: ![P2 Bug](screenshots/p2-bug-1.png)
**环境**: Chromium, Desktop
**差异**: 按钮间距 16px (期望 12px)
**建议**: 调整间距到 12px
```

### 4.3 截图对比报告

```markdown
## Visual Regression Report

| 测试 | 基线 | 当前 | 差异% | 状态 |
|------|------|------|-------|------|
| login-page | baseline.png | current.png | 0.2% | ✅ PASS |
| dashboard | baseline.png | current.png | 2.1% | ⚠️ DIFF |
| settings | baseline.png | current.png | 0.0% | ✅ PASS |

> 差异 > 0.5% 标记为 ⚠️ DIFF，需人工确认
```

---

## 5. Gate G6.5 定义

```
Gate G6.5: Phase 5 浏览器 QA 门控

位置: 代码级测试 G6 通过后 → 浏览器 QA 完成后
检查: 浏览器 QA Bug 报告

规则:
  P0 Bug 存在 → Gate FAIL (必须修复)
  P1 Bug 存在 → Gate WARN (用户确认是否继续)
  仅 P2 Bug → Gate PASS (记录，Phase 6 审查)
  无 Bug → Gate PASS

模式:
  Strict/Audit: G6.5 强制 (P1 也阻断)
  Standard: G6.5 advisory (仅 P0 阻断)
  Fast: 跳过 G6.5

降级:
  Playwright 不可用 → 跳过浏览器 QA，G6.5 自动 PASS
  非前端项目 → 自动跳过，G6.5 不适用
```

---

## 6. 降级策略

| 环境 | 浏览器 QA 能力 | 降级说明 |
|------|--------------|---------|
| Node.js + Playwright 安装 | 完整浏览器 QA | 全功能 |
| Node.js 无 Playwright | 提示安装 `npx playwright install` | 等待安装 |
| 无 Node.js | 跳过浏览器 QA | 仅代码级测试 |
| 非前端项目 | 自动跳过 | 无需浏览器 QA |
| 开发服务器未运行 | 尝试自动启动 | 失败则跳过 |
| Token 预算不足 | 仅执行高优先级测试 | 减少测试用例数 |

---

## 7. 配置

```json
{
  "browser_qa": {
    "enabled": true,
    "auto_detect_frontend": true,
    "playwright": {
      "browser": "chromium",
      "base_url": "http://localhost:3000",
      "timeout": 30000,
      "retries": 1,
      "screenshot": "only-on-failure",
      "video": "retain-on-failure"
    },
    "test_generation": {
      "min_tests_per_flow": 3,
      "screenshot_comparison": true,
      "accessibility_checks": true,
      "responsive_viewports": ["mobile", "tablet", "desktop"]
    },
    "bug_severity": {
      "p0": "crash_or_white_screen",
      "p1": "functionality_broken",
      "p2": "ui_cosmetic"
    },
    "gate_g65": {
      "strict_mode": "p0_and_p1_block",
      "standard_mode": "p0_block_only",
      "fast_mode": "skip"
    }
  }
}
```

---

## 8. 与其他模块协作

| 模块 | 协作方式 |
|------|---------|
| Wave Executor | Phase 5 代码级测试通过后触发浏览器 QA |
| Real-time Review | 审查结果中标记的 UI 问题作为测试重点 |
| Token Monitor | 测试执行受 Token 预算控制 |
| Agent Comms | Bug 发现通过消息板通知其他 Agent |
| Vector Memory | 搜索历史 UI Bug 模式辅助测试生成 |
| Phase 6 Review | 浏览器 QA Bug 报告作为 Phase 6 输入 |
