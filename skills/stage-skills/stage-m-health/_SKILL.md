# devflow-kit Stage: M-Health（健康检查）

> **阶段定位**：定期检查项目代码健康和架构一致性
> **前置条件**：无（可随时执行）
> **后置产物**：`.devflow-kit/health/YYYY-MM-DD.md`

## Skill元信息

```yaml
name: stage-m-health
version: 1.0.0
description: devflow-kit可选命令 - 项目健康检查
author: devflow-kit
dependencies:
  - verification-before-completion
  - security-and-performance
```

## 输入

- `.devflow-kit/CONTEXT.md`
- `.devflow-kit/lessons-learned.md`
- 最近1份 `.devflow-kit/health/*.md`（如有，做对比基线）
- `src/` 抽样5个最近改动频繁的模块
- 抽样5个测试文件
- 最近30天 git log

## 输出

- `.devflow-kit/health/YYYY-MM-DD.md`

## 入口门禁

无（可选命令，随时可执行）

## 执行流程

### Step 1: 读取上次健康报告

如存在历史报告，读取最近一份作为基线：

```bash
ls -lt .devflow-kit/health/ | head -1
```

**对比维度**：
- 代码质量指标变化
- 新增技术债
- 已修复问题

### Step 2: 代码质量扫描

#### 2.1 静态分析

```bash
# ESLint（前端）
npm run lint -- --max-warnings=0

# Pylint（Python）
pylint src/ --fail-under=8.0

# golangci-lint（Go）
golangci-lint run
```

**记录**：
- 错误数
- 警告数
- 复杂度超标函数

#### 2.2 重复代码检测

```bash
# SonarQube / CPD
sonar-scanner
# 或
jscpd src/ --min-tokens 50
```

**记录**：
- 重复率
- 重复代码块位置

#### 2.3 测试覆盖率

```bash
npm test -- --coverage
```

**记录**：
- 语句覆盖率
- 分支覆盖率
- 函数覆盖率
- 未覆盖的关键文件

### Step 3: 安全扫描

#### 3.1 依赖漏洞

```bash
npm audit
# 或
pip-audit
# 或
govulncheck
```

**记录**：
- 🔴 High/Critical漏洞数
- 🟡 Medium漏洞数
- 🟢 Low漏洞数

#### 3.2 SAST静态分析

```bash
# Semgrep
semgrep scan --config auto

# 或 SonarQube
sonar-scanner
```

**记录**：
- SQL注入风险
- XSS风险
- 硬编码密钥

### Step 4: 性能基准

#### 4.1 构建性能

```bash
# 记录构建时间
time npm run build
```

**对比基线**：
- 上次构建时间
- 变化幅度

#### 4.2 关键路径性能

```bash
# Lighthouse（前端）
lighthouse http://localhost:3000 --output=json

# 或 API性能测试
ab -n 1000 -c 10 http://localhost:3000/api/health
```

**记录**：
- P50/P95/P99响应时间
- QPS
- 错误率

### Step 5: 架构一致性检查

#### 5.1 模块依赖验证

**检查循环依赖**：
```bash
# madge（JavaScript）
npx madge src/index.ts --circular

# 或 depcruise
depcruise src/ --config .dependency-cruiser.js
```

**记录**：
- 🔴 循环依赖
- 🟡 违反分层规则

#### 5.2 ADR合规检查

对照 `.devflow-kit/system-architecture.md` 的ADR列表，检查当前代码是否遵循：

**示例**：
```markdown
ADR-001: 使用PostgreSQL
✅ 检查通过: package.json中有pg依赖

ADR-003: Redis缓存策略
⚠️ 部分违规: 发现3处缓存未设TTL
```

### Step 6: 技术债识别

从以下维度识别技术债：

**代码层面**：
- TODO/FIXME注释
- 复杂度过高的函数（>10）
- 超长文件（>500行）
- 未使用的导入/变量

**架构层面**：
- 临时方案未重构
- 缺失的公共抽象
- 不一致的实现模式

**测试层面**：
- 覆盖率低于阈值的模块
- 缺失的边界测试
- 过时的测试用例

**输出表格**：
| 类型 | 位置 | 描述 | 等级 | 建议 |
|---|------|---|------|---|
| 代码 | src/utils/helper.ts:45 | 复杂度过高(15) | 🟡 | 拆分函数 |
| 架构 | user-service | 临时缓存方案 | 🔴 | 实现完整缓存层 |
| 测试 | src/api/*.test.ts | 覆盖率60% | 🟡 | 补充测试 |

### Step 7: 生成健康报告

**⚠️ 强制规则**：输出前必须先读取模板文件 `templates/健康报告.md`（如存在）。

按模板生成 `.devflow-kit/health/YYYY-MM-DD.md`：
- **必须包含模板所有段落**（不得省略或改写）
- **所有 `<...>` 占位符必须替换为实际值**
- **必须包含以下核心章节**：
  - 概览（整体评分+关键指标）
  - 代码质量（静态分析/重复代码/测试覆盖率）
  - 安全性（依赖漏洞/SAST扫描）
  - 性能（构建时间/API性能）
  - 架构一致性（循环依赖/ADR合规）
  - 技术债（分级列出🔴🟡🟢）
  - 对比上次（改进/退化）
  - 建议行动（立即处理/本周处理/后续优化）

**自检**：输出前逐项核对模板强制规则（R13.9 / R13.10）

```markdown
# 健康报告: YYYY-MM-DD

## 概览

**整体评分**: 85/100（较上次 +5）

**关键指标**:
- 代码质量: 90/100
- 安全性: 80/100
- 性能: 85/100
- 架构一致性: 85/100

## 代码质量

**静态分析**:
- 错误: 0
- 警告: 5
- 复杂度超标: 2个函数

**重复代码**:
- 重复率: 2.5%（达标 <3%）

**测试覆盖率**:
- 语句: 85%
- 分支: 82%
- 函数: 88%

## 安全性

**依赖漏洞**:
- 🔴 High: 0
- 🟡 Medium: 2
- 🟢 Low: 5

**SAST扫描**:
- SQL注入: 0
- XSS: 0
- 硬编码密钥: 1（🟡）

## 性能

**构建时间**: 45s（较上次 -5s）

**API性能**:
- P50: 80ms
- P95: 180ms
- P99: 250ms

## 架构一致性

**循环依赖**: 0（✅）

**ADR合规**:
- 已检查: 5个ADR
- 合规: 4个
- 部分违规: 1个（ADR-003缓存TTL）

## 技术债

**🔴 Critical**: 1个
1. 临时缓存方案需重构

**🟡 Major**: 3个
1. 2个函数复杂度过高
2. 1处硬编码密钥
3. 测试覆盖率待提升

**🟢 Minor**: 5个
...

## 对比上次

**改进**:
- ✅ 修复了2个High漏洞
- ✅ 构建时间优化5s
- ✅ 消除了1个循环依赖

**退化**:
- ⚠️ 新增1个Medium漏洞
- ⚠️ 测试覆盖率下降2%

## 建议行动

**立即处理**（🔴）:
1. 重构临时缓存方案

**本周处理**（🟡）:
1. 拆分高复杂度函数
2. 轮换硬编码密钥
3. 补充缺失测试

**后续优化**（🟢）:
...
```

### Step 8: 用户Review

输出报告摘要和建议行动。

**询问**：
```markdown
✅ 健康检查完成

**整体评分**: 85/100

**需要处理**:
- 🔴 Critical: 1个
- 🟡 Major: 3个

是否创建需求修复？
1. ✅ 是，创建需求修复Critical问题
2. ⚠️ 只记录，稍后处理
3. ↩️ 查看详细报告
```

### Step 9: 根据用户选择执行

**选项1**：创建需求
- 路由到 0-confirm
- 需求描述："修复健康检查Critical问题：<具体问题>"

**选项2**：仅记录
- 保存报告到 `.devflow-kit/health/YYYY-MM-DD.md`
- 结束

**选项3**：查看详情
- 展示完整报告

## 自检清单

- ⏳ **已读取模板文件** `templates/健康报告.md`（如存在）
- ⏳ 代码质量扫描完成（静态分析/重复代码/覆盖率）
- ⏳ 安全扫描完成（依赖漏洞/SAST）
- ⏳ 性能基准测试完成
- ⏳ 架构一致性检查完成（循环依赖/ADR合规）
- ⏳ 技术债已识别并分级
- ⏳ 与上次报告对比
- ⏳ **产物包含模板所有段落**
- ⏳ **所有占位符已替换**
- ⏳ 用户已review并确认

## 约束

- **禁止**跳过任何扫描维度
- **必须**与上次报告对比
- 技术债**必须**分级（🔴🟡🟢）
- **必须**提供可执行的建议行动

## 触发下一步

- 用户选择修复 → 加载 `skills/stage-skills/stage-0-confirm/_SKILL.md`
- 用户选择记录 → 结束，返回主流程

## 错误处理

- 扫描工具未安装 → 提示安装或使用替代方案
- 无法获取基线 → 跳过对比，仅生成本次报告
- 报告过大 → 精简为关键指标

