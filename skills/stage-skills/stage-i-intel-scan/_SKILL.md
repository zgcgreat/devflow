# devflow-kit Stage: I-Intel-Scan（项目扫描）

> **阶段定位**：新项目或大改动前的代码库扫描，生成上下文
> **前置条件**：无（首次执行或项目结构大变化时执行）
> **后置产物**：`.devflow-kit/CONTEXT.md`

## Skill元信息

```yaml
name: stage-i-intel-scan
version: 1.0.0
description: devflow-kit可选命令 - 项目入场扫描与上下文化
author: devflow-kit
dependencies:
  - writing-plans
```

## 输入

- 项目根目录
- `.git/`（如存在）
- `package.json` / `requirements.txt` / `go.mod` 等依赖文件
- `src/` 或主要源码目录

## 输出

- `.devflow-kit/CONTEXT.md`（新建或更新）

## 入口门禁

无（可选命令，随时可执行）

## 执行流程

### Step 1: 检测项目类型

**根据文件判断**：

| 文件 | 项目类型 |
|---|---------|
| package.json | Node.js/前端 |
| requirements.txt / pyproject.toml | Python |
| go.mod | Go |
| pom.xml / build.gradle | Java |
| Cargo.toml | Rust |
| Gemfile | Ruby |

**输出**：
```markdown
检测到项目类型: Node.js + React
技术栈: TypeScript, Next.js, PostgreSQL
```

### Step 2: 扫描目录结构

> **跨平台说明**：以下提供 PowerShell（Windows）和 Bash（Linux/macOS）两种命令，请根据实际环境选择使用。

**PowerShell（Windows）**
```powershell
# 列出顶层目录
Get-ChildItem -Force

# 列出src结构（深度2层）
Get-ChildItem -Path src/ -Directory -Depth 2

# 统计文件数
Get-ChildItem -Path src/ -Include *.ts,*.tsx -Recurse | Measure-Object | Select-Object -ExpandProperty Count
```

**Bash（Linux/macOS）**
```bash
# 列出顶层目录
ls -la

# 列出src结构（深度2层）
find src/ -maxdepth 2 -type d

# 统计文件数
find src/ -name "*.ts" -o -name "*.tsx" | wc -l
```

**记录**：
- 目录树（关键部分）
- 文件统计（按类型）
- 配置文件列表

### Step 3: 分析依赖

**读取依赖文件**：

**PowerShell（Windows）**
```powershell
# 读取dependencies和devDependencies
Get-Content package.json | ConvertFrom-Json | Select-Object -ExpandProperty dependencies
Get-Content package.json | ConvertFrom-Json | Select-Object -ExpandProperty devDependencies
```

**Bash（Linux/macOS）**
```bash
cat package.json | jq '.dependencies'
cat package.json | jq '.devDependencies'
```

**分类**：
- 核心框架（React, Vue, Spring等）
- 数据库驱动（pg, mysql等）
- 工具库（lodash, moment等）
- 开发工具（eslint, jest等）

**识别架构模式**：
- 是否有ORM（Prisma, TypeORM）→ 数据访问层
- 是否有状态管理（Redux, Zustand）→ 前端架构
- 是否有测试框架（Jest, pytest）→ 测试策略

### Step 4: 提取编码规范

**从配置文件提取**：

**PowerShell（Windows）**
```powershell
# ESLint配置
Get-Content .eslintrc.json | ConvertFrom-Json | Select-Object -ExpandProperty rules

# Prettier配置
Get-Content .prettierrc

# TypeScript配置
Get-Content tsconfig.json | ConvertFrom-Json | Select-Object -ExpandProperty compilerOptions
```

**Bash（Linux/macOS）**
```bash
# ESLint配置
cat .eslintrc.json | jq '.rules'

# Prettier配置
cat .prettierrc

# TypeScript配置
cat tsconfig.json | jq '.compilerOptions'
```

**记录**：
- 代码风格规则
- 命名约定
- 导入顺序
- 格式化要求

### Step 5: 扫描既有抽象

**查找关键模式**：

**PowerShell（Windows）**
```powershell
# 查找Service类
Get-ChildItem -Path src/ -Include *.ts -Recurse | Select-String -Pattern "class.*Service"

# 查找Repository
Get-ChildItem -Path src/ -Include *.ts -Recurse | Select-String -Pattern "class.*Repository"

# 查找Hook（React）
Get-ChildItem -Path src/ -Include *.ts -Recurse | Select-String -Pattern "export const use"

# 查找Utils
Get-ChildItem -Path src/utils/ -Force
```

**Bash（Linux/macOS）**
```bash
# 查找Service类
grep -r "class.*Service" src/ --include="*.ts"

# 查找Repository
grep -r "class.*Repository" src/ --include="*.ts"

# 查找Hook（React）
grep -r "export const use" src/ --include="*.ts"

# 查找Utils
ls src/utils/
```

**汇总**：
- 公共Service列表
- Repository模式使用情况
- 自定义Hook列表
- 工具函数分类

### Step 6: 分析测试策略

**PowerShell（Windows）**
```powershell
# 查找测试文件
Get-ChildItem -Include *.test.ts,*.spec.ts -Recurse | Select-Object -First 20 FullName

# 查看测试配置
Get-Content jest.config.js
# 或
Get-Content vitest.config.ts
```

**Bash（Linux/macOS）**
```bash
# 查找测试文件
find . -name "*.test.ts" -o -name "*.spec.ts" | head -20

# 查看测试配置
cat jest.config.js
# 或
cat vitest.config.ts
```

**记录**：
- 测试框架
- 测试目录结构
- Mock策略
- 覆盖率要求

### Step 7: 检查AI上下文文档

**查找现有文档**：

**PowerShell（Windows）**
```powershell
# 检查常见AI上下文文件
Get-ChildItem AGENTS.md, CLAUDE.md, GEMINI.md, .cursorrules -ErrorAction SilentlyContinue
```

**Bash（Linux/macOS）**
```bash
# 检查常见AI上下文文件
ls AGENTS.md CLAUDE.md GEMINI.md .cursorrules 2>/dev/null
```

**如存在**：
- 读取内容
- 提取关键规则
- 合并到CONTEXT.md

**如不存在**：
- 提示用户创建
- 提供模板建议

### Step 8: 读取模板并提取段落清单

**⚠️ 强制规则**：必须使用 `read_file` 工具读取模板文件。

```python
# 伪代码示例
read_file("templates/CONTEXT.md")
```

**从模板中提取必填段落清单**（模板 L14-30）：
```
□ 项目概要
□ 项目地图（多项目必填）
□ 项目结构
□ 结构说明表
□ 技术栈
□ 域语言（术语表）
□ 已锁决策
□ 默认偏好
□ 前端结构（如有）
□ 后端结构（如有）
□ 共享契约（如有）
□ 既有抽象索引
□ 禁动清单
□ 技术债（如有）
□ intel-scan 元数据
```

**注意**：
- "项目地图"、"前端结构"、"后端结构"、"共享契约"、"技术债"如无内容，应保留段落标题并填写"无"或"未发现"
- 不得因为"无内容"而删除段落

### Step 9: 生成产物并逐项核对

按模板生成 `.devflow-kit/CONTEXT.md`：
- **必须包含所有15个必填段落**（见 Step 8 提取的清单）
- **所有 `<...>` 占位符必须替换为实际值**
- **必须基于实际扫描结果**（禁止编造）
- **⚠️ 语言规范：全文统一使用中文**，技术术语可保留英文（如 Node.js、TypeScript），但描述性文字必须用中文

**生成后核对**：
```markdown
产物核对清单：
- ⏳ 项目概要 → 已包含（中文描述）
- ⏳ 项目地图 → 已包含（或标注"不适用"）
- ⏳ 项目结构 → 已包含（中文注释）
- ⏳ 结构说明表 → 已包含（中文描述）
- ⏳ 技术栈 → 已包含（中文描述）
- ⏳ 域语言（术语表） → 已包含（中文定义）
- ⏳ 已锁决策 → 已包含（或标注"暂无"）
- ⏳ 默认偏好 → 已包含（或标注"待补充"）
- ⏳ 前端结构 → 已包含（或标注"不适用"）
- ⏳ 后端结构 → 已包含（或标注"不适用"）
- ⏳ 共享契约 → 已包含（或标注"未发现"）
- ⏳ 既有抽象索引 → 已包含（中文描述）
- ⏳ 禁动清单 → 已包含（或标注"暂无"）
- ⏳ 技术债 → 已包含（或标注"未发现"）
- ⏳ intel-scan 元数据 → 已包含
```

**如果有缺失**：立即补齐，不得进入下一步。

**语言检查**：
- ✅ 描述性文字全部使用中文
- ✅ 技术术语保留英文原名（Node.js、TypeScript、React等）
- ❌ 禁止中英文混杂的描述句（如"这个module用于处理user请求"）

### Step 10: 用户Review

输出摘要：

```markdown
✅ 入场扫描完成

**项目类型**: Node.js + React
**扫描模块**: 15个
**既有抽象**: 
- Service: 2个
- Repository: 2个
- Hook: 2个
- Utils: 2个

**建议**:
1. 创建 AGENTS.md 固化AI规则
2. 补充部署流程文档

是否保存为 .devflow-kit/CONTEXT.md？
1. ✅ 是，保存
2. ✏️ 否，先修改
3. ↩️ 重新扫描
```

### Step 11: 根据用户选择执行

**选项1**：保存
- 写入 `.devflow-kit/CONTEXT.md`
- 更新 `.devflow-kit/STATE.md` 的 `ai_context_doc: CONTEXT.md`

**选项2**：修改
- 展示完整内容
- 等待用户编辑后保存

**选项3**：重扫
- 回到Step 1

## 自检清单

- ⏳ **已使用 read_file 读取模板**
- ⏳ **已提取15个必填段落清单**
- ⏳ **已按模板结构生成**（15个段落完整）
- ⏳ 项目类型识别准确
- ⏳ 目录结构完整
- ⏳ 依赖分析全面
- ⏳ 既有抽象已提取
- ⏳ 测试策略已记录
- ⏳ AI上下文文档已检查
- ⏳ **所有占位符已替换**
- ⏳ 用户已review并确认
- ⏳ **错误已记录到 KNOWN_FAILURES.md**（如有）

## 约束

- **禁止**编造不存在的文件/模块
- **必须**基于实际扫描结果
- **必须**让用户确认后再保存
- 扫描深度适中（避免过深浪费时间）

## 触发下一步

- 保存成功 → 返回主流程
- 重新扫描 → 重新执行本stage

## 错误处理

- 依赖文件缺失 → 提示用户手动补充
- 扫描超时 → 限制深度，只扫描关键目录
- 上下文冲突 → 提示用户选择保留哪个版本

### 错误记录

**⚠️ 强制规则**：如扫描过程中遇到错误，必须记录到 KNOWN_FAILURES.md。

**执行步骤**：

1. 检测到错误后，记录错误信息

2. 追加到 `.devflow-kit/memory/KNOWN_FAILURES.md`：

```markdown
## [YYYY-MM-DD] intel-scan 错误

**阶段**: Stage I (intel-scan)
**步骤**: <步骤名称>
**错误**: <错误信息>

**影响**: <对流程的影响>

**解决方案**: <如何绕过或修复>

**状态**: ⚠️ 已知问题 / ✅ 已修复
```

3. 继续流程（不阻塞）

