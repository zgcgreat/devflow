# GitNexus 可选检测协议 (v3新增)

## 概述

GitNexus 提供增强代码理解能力（调用链分析、依赖影响追踪），但在 v3.0 中为**完全可选**。未安装时自动降级到 grep fallback，不影响完整流程。

## 触发时机

- **首次启动**: Step 3 (入场检测后)
- **Phase 1 (分析)**: 读取代码结构时
- **Phase 6 (审查)**: 依赖影响追踪时

## 检测协议

### Step 1: 版本检测

```bash
gitnexus --version
```

| 返回码 | 结果 | 下一步 |
|--------|------|--------|
| 0 | ✅ GitNexus已安装 | 输出 `GitNexus vX.X.X ✓` → 继续使用 |
| 127 / 非零 | ❌ 未安装 | Step 2 → 提示用户 |

### Step 2: 用户提示 (一次性)

```
┌─────────────────────────────────────────────┐
│ ⚠️ GitNexus 未检测到                        │
│                                             │
│ GitNexus 提供增强代码理解能力：              │
│   • 调用链分析: "哪些函数调用了 auth.verify()?" |
│   • 依赖影响追踪: "修改 user.ts 会影响哪些模块?" |
│   • 语义导入解析: AST级别的import关系          │
│                                             │
│ v3.0 工作流不依赖 GitNexus 也能完整运行。    │
│                                             │
│ [1] 现在安装 GitNexus (推荐)                 │
│ [2] 跳过本次会话，使用 grep 降级             │
│ [3] 永久跳过，记录到配置中                   │
└─────────────────────────────────────────────┘

请回复 1/2/3。
```

### Step 3: 用户选择处理

#### 选择 [1]: 安装引导

```bash
# macOS/Linux
brew install gitnexus
# 或
npm install -g gitnexus

# Windows (winget)
winget install GitNexus

# 手动安装
git clone https://github.com/GitNexus/gitnexus.git
cd gitnexus && npm install && npm run build
```

安装后回到 Step 1 重新检测。

#### 选择 [2]: Grep Fallback (本次会话)

输出降级声明：

```
┌─────────────────────────────────────────────┐
│ 🔧 Grep Fallback Mode Active                │
│                                             │
│ ✅ 文件搜索: glob + grep                    │
│ ⚠️ 调用链分析: grep -rn (可能不全)           │
│ 🟡 依赖影响追踪: grep + 静态启发式           │
│ 🟡 语义导入解析: regex import匹配             │
│                                             │
│ 精度损失: ~20-30% vs GitNexus               │
└─────────────────────────────────────────────┘
```

#### 选择 [3]: 永久跳过

写入 STATE.md：

```yaml
gitnexus:
  detected: false
  persistent_off: true
  fallback: grep
  last_checked: "2026-05-17T05:38:00Z"
```

下次启动直接跳过检测，使用 grep fallback。

## Grep Fallback 实现

### 文件搜索

```bash
# GitNexus等效: find all TypeScript files in src/
find . -path '*/src/*' -name '*.ts' -o -path '*/src/*' -name '*.tsx'

# v3 grep fallback: same command, no index cache
find . -path '*/src/*' \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' \)
```

### 调用链分析

```bash
# GitNexus等效: "who calls auth.verify()?"
# v3 grep fallback:
grep -rn '\.verify(' --include='*.ts' --include='*.tsx' src/ | grep -v 'test\|spec\|\.d\.ts'
```

### 依赖影响追踪

```bash
# GitNexus等效: "what depends on auth.ts?"
# v3 grep fallback:
grep -rn 'from.*auth\|import.*auth\|require.*auth' --include='*.ts' --include='*.tsx' src/ | sort -u
```

### 语义导入解析

```bash
# GitNexus等效: AST-level import resolution
# v3 grep fallback: regex-based (less precise)
grep -rn '^import\|^export\|^from ' --include='*.ts' --include='*.tsx' src/ | head -100
```

## 精度对比

| 能力 | GitNexus | Grep Fallback | 损失 |
|------|----------|---------------|------|
| 文件搜索 | 精确索引，毫秒级 | glob+find，秒级 | 低 (功能完整) |
| 调用链分析 | AST精确匹配 | grep -rn 正则 | 中 (~15%漏报) |
| 依赖影响追踪 | 图遍历 | grep + 静态启发式 | 中 (~25%漏报) |
| 语义导入解析 | AST级别 | regex匹配 | 中高 (~30%模糊) |

## 降级声明模板 (Phase 1/6 输出时必带)

```markdown
📊 分析精度: Grep Fallback 模式
⚠️ 部分依赖追踪可能不完整，建议安装 GitNexus 获得精确分析。
✅ 当前精度已足够完成 Phase {N} 目标。
```
