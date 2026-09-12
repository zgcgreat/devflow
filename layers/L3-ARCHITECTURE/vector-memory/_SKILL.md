---
name: vector-memory
preamble-tier: 1
version: 1.0.0
layer: L3-ARCHITECTURE
gate: internal
implementation: code
requires: [learning-workflow]
provides: [semantic-search, hybrid-retrieval, lesson-embedding, memory-lifecycle]
description: |
  向量记忆系统 — 基于 SQLite + HNSW 的语义检索引擎。
  替代 LESSONS.md 纯文本全文匹配，提供混合检索（BM25 + Vector + RRF 融合），
  准确率提升 3x+，延迟 < 100ms。支持 4 层记忆架构（Working → Episodic → Semantic → Procedural）。
  参考: Ruflo AgentDB HNSW + agentmemory 三流混合检索。
source: CHANGELOG v1.2.0 — Ruflo AgentDB + agentmemory vector retrieval
dependencies:
  - learning-workflow (LESSONS 数据源)
  - provider-gateway (嵌入 API 调用)
  - agent-isolation (向量索引在隔离上下文中加载)
triggers:
  - Phase 4 Wave 开始（搜索相关经验）
  - Phase 6 审查（搜索相关教训）
  - Phase 8 归档（去重检查 + 聚类）
  - 手动搜索: /memory search <query>
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
external-inputs: [lessons-data, execution-observations]
---

# Vector Memory — 向量记忆系统

> **核心问题**: LESSONS.md 是纯文本，缺乏语义搜索能力，只能全文匹配，无法做相似性匹配和自动去重。
> **解决方案**: 向量记忆系统在 Markdown 兼容层下增加 HNSW 向量索引，提供混合检索（BM25 + Vector + RRF），保持 LESSONS.md 人类可读的同时大幅提升机器检索准确率。

---

## 1. 架构设计

### 1.1 整体架构

```
向量记忆系统架构:

┌──────────────────────────────────────────────┐
│  Vector Memory Manager                        │
│                                               │
│  ┌──────────────┐  ┌───────────────────────┐  │
│  │ Markdown     │  │ Vector Index          │  │
│  │ Interface    │  │ (HNSW)                │  │
│  │ (兼容层)     │  │                       │  │
│  │              │  │ ┌───────────────────┐ │  │
│  │ 读取 LESSONS │  │ │ Embedding Engine  │ │  │
│  │ 写入 LESSONS │  │ │ (Local/API dual)  │ │  │
│  │              │  │ └───────────────────┘ │  │
│  └──────┬───────┘  └──────────┬────────────┘  │
│         │                     │                │
│  ┌──────┴─────────────────────┴────────────┐   │
│  │  Storage Layer                           │   │
│  │  ┌──────────┐  ┌──────────────────────┐ │   │
│  │  │ LESSONS  │  │ vector_memory.db     │ │   │
│  │  │ .md      │  │ (SQLite + vec)       │ │   │
│  │  │ (人类可读)│  │ (机器检索加速)        │ │   │
│  │  └──────────┘  └──────────────────────┘ │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │  Retrieval Engine                         │   │
│  │  ┌─────┐ ┌────────┐ ┌─────────────────┐ │   │
│  │  │BM25 │ │ Vector │ │ RRF Fusion      │ │   │
│  │  │全文 │ │ HNSW   │ │ Reciprocal Rank │ │   │
│  │  └─────┘ └────────┘ └─────────────────┘ │   │
│  └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

### 1.2 四层记忆架构

参考 agentmemory 的 4 层记忆整合，升级 LearningWorkflow：

| 层级 | 名称 | 类比 | 存储内容 | 生命周期 | ForgeOS 对应 |
|------|------|------|---------|---------|---------------|
| **L1** | Working | 短期记忆 | Phase 4 Wave 执行中的原始工具调用观察 | 5min 去重窗口，会话结束前 | `.forgeos/<req-id>/observations/` |
| **L2** | Episodic | "发生了什么" | Wave 完成后的压缩摘要 | 跨会话保留，Ebbinghaus 衰减 | LESSONS.md `[EPISODIC]` 段 |
| **L3** | Semantic | "我知道什么" | 跨会话提取的事实和模式 | 长期保留，高频率强化 | LESSONS.md `[SEMANTIC]` 段 + vector_memory.db |
| **L4** | Procedural | "怎么做" | 工作流和决策模式（Crystallize 晶体） | 长期保留，可被未来会话复用 | `domain-skills/` + `crystals/` |

### 1.3 关键设计决策

1. **Markdown 兼容接口**: 保留 LESSONS.md 作为人类可读的接口，向量索引作为机器检索的加速层
2. **双模嵌入**: 本地嵌入（ONNX Runtime + all-MiniLM-L6-v2）+ API 嵌入（OpenAI/Voyage/Gemini）
3. **存储引擎**: SQLite + vec 扩展（轻量级，无需额外服务，单文件部署）
4. **检索模式**: 混合检索（BM25 全文 + HNSW 向量 + RRF 融合），R@5 目标 ≥ 90%
5. **双写保证**: 写入同时更新 LESSONS.md 和 vector_memory.db，保证一致性

---

## 2. 数据模型

### 2.1 SQLite Schema

```sql
-- vector_memory.db

-- L1 Working: 原始观察
CREATE TABLE IF NOT EXISTS observations (
  id TEXT PRIMARY KEY,              -- SHA-256 前 12 位
  req_id TEXT NOT NULL,             -- 需求 ID
  wave INTEGER,                     -- Wave 编号
  task_id TEXT,                     -- Task ID
  tool_name TEXT NOT NULL,          -- 工具名称
  tool_input TEXT,                  -- 工具输入 (JSON)
  tool_output_summary TEXT,         -- 工具输出摘要
  session_id TEXT,                  -- 会话 ID
  created_at TEXT NOT NULL,         -- ISO 8601
  dedup_hash TEXT,                  -- SHA-256 去重哈希
  privacy_filtered INTEGER DEFAULT 0 -- 是否经过隐私过滤
);

CREATE INDEX IF NOT EXISTS idx_observations_req ON observations(req_id);
CREATE INDEX IF NOT EXISTS idx_observations_wave ON observations(req_id, wave);
CREATE INDEX IF NOT EXISTS idx_observations_dedup ON observations(dedup_hash);

-- L2+L3: 经验条目（EPISODIC + SEMANTIC）
CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,              -- lesson slug (e.g., "L-042-token-refresh-retry")
  lesson_number INTEGER UNIQUE,     -- L-XXX 编号
  title TEXT NOT NULL,              -- 简短标题
  content TEXT NOT NULL,            -- 完整 Markdown 内容
  summary TEXT,                     -- 一句话摘要（用于嵌入）
  category TEXT NOT NULL,           -- FAILURE/SUCCESS/INSIGHT/PATTERN
  memory_layer TEXT NOT NULL,       -- EPISODIC / SEMANTIC
  tags TEXT,                        -- JSON 数组标签
  frequency INTEGER DEFAULT 1,      -- 出现频率
  importance REAL DEFAULT 0.5,      -- 重要性 0-1
  access_count INTEGER DEFAULT 0,   -- 访问计数
  severity TEXT,                    -- LOW/MEDIUM/HIGH/CRITICAL
  confidence TEXT,                  -- HIGH/MEDIUM/LOW
  applicability TEXT,               -- 适用场景描述
  root_cause TEXT,                  -- 根因
  prevention TEXT,                  -- 预防措施 (JSON 数组)
  source_phase TEXT,                -- 来源 Phase
  source_wave INTEGER,              -- 来源 Wave
  source_task TEXT,                 -- 来源 Task
  related_lessons TEXT,             -- JSON 数组关联 L-XXX
  superseded_by TEXT,               -- 被 L-XXX 替代
  status TEXT DEFAULT 'active',     -- active/inactive/deprecated/superseded
  half_life_days INTEGER DEFAULT 30,-- Ebbinghaus 半衰期（天）
  last_accessed_at TEXT,            -- 最后访问时间
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lessons_category ON lessons(category);
CREATE INDEX IF NOT EXISTS idx_lessons_layer ON lessons(memory_layer);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);
CREATE INDEX IF NOT EXISTS idx_lessons_frequency ON lessons(frequency DESC);

-- L4: Procedural 记忆（Domain Skills + Crystals）
CREATE TABLE IF NOT EXISTS domain_skills (
  id TEXT PRIMARY KEY,              -- skill slug
  name TEXT NOT NULL,
  content TEXT NOT NULL,            -- 完整 SKILL.md 内容
  summary TEXT,                     -- 摘要（用于嵌入）
  trigger_patterns TEXT,            -- JSON 数组触发模式
  frequency INTEGER DEFAULT 1,
  maturity TEXT DEFAULT 'emerging', -- emerging/established/deprecated
  source_lessons TEXT,              -- JSON 数组来源 L-XXX
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 向量索引（SQLite vec 扩展）
-- 注意: vec0 是 SQLite vec 扩展的虚拟表
-- 如果 vec 扩展不可用，降级为纯 BM25 检索
CREATE VIRTUAL TABLE IF NOT EXISTS lessons_vec USING vec0(
  id TEXT,
  embedding float[384]              -- all-MiniLM-L6-v2 输出维度
);

CREATE VIRTUAL TABLE IF NOT EXISTS domain_skills_vec USING vec0(
  id TEXT,
  embedding float[384]
);

-- 向量索引配置
CREATE TABLE IF NOT EXISTS vector_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 默认配置
INSERT OR IGNORE INTO vector_config (key, value) VALUES
  ('embedding_model', 'all-MiniLM-L6-v2'),
  ('embedding_dim', '384'),
  ('embedding_mode', 'local'),       -- local/api
  ('retrieval_mode', 'hybrid'),      -- bm25/vector/hybrid
  ('rrf_k', '60'),                   -- RRF 融合常数
  ('similarity_threshold', '0.7'),
  ('max_results', '5'),
  ('token_budget', '2000'),          -- 注入时 token 预算
  ('version', '1.0.0');
```

### 2.2 数据流

```
写入流程（双写保证）:

1. LearningWorkflow 提取新 Lesson
   │
   ├─→ 写入 LESSONS.md (Markdown, 人类可读)
   │   └─ 格式: ## L-XXX [CATEGORY] Title ...
   │
   ├─→ 写入 lessons 表 (SQLite, 机器可检索)
   │   └─ INSERT INTO lessons (...)
   │
   └─→ 写入 lessons_vec 表 (向量索引)
       └─ 生成 summary → embed → INSERT INTO lessons_vec

检索流程:

1. 用户/Agent 发起搜索: "JWT token 刷新"
   │
   ├─→ BM25 全文搜索
   │   └─ SELECT * FROM lessons WHERE content LIKE '%jwt%' OR tags LIKE '%jwt%'
   │
   ├─→ Vector 向量搜索
   │   └─ embed("JWT token 刷新") → SELECT id, distance FROM lessons_vec WHERE ...
   │
   └─→ RRF 融合
       └─ 融合 BM25 和 Vector 的排名，输出 top-K 结果
```

---

## 3. 嵌入引擎

### 3.1 双模嵌入

| 模式 | 引擎 | 延迟 | 质量 | 依赖 | 适用场景 |
|------|------|------|------|------|---------|
| **local** | ONNX Runtime + all-MiniLM-L6-v2 | ~5ms | R@5 ~85% | onnxruntime-node | 离线/内网/低延迟 |
| **api** | OpenAI text-embedding-3-small | ~50ms | R@5 ~92% | API Key + 网络 | 云端/高质量 |

### 3.2 嵌入生成逻辑

```javascript
// 嵌入生成伪代码
async function generateEmbedding(text, mode = 'local') {
  if (mode === 'local') {
    // 本地 ONNX Runtime
    // 使用 all-MiniLM-L6-v2 模型
    // 输入: text (max 256 tokens)
    // 输出: float[384] 向量
    return await localEmbed(text);
  }

  if (mode === 'api') {
    // API 嵌入
    // 支持: OpenAI / Voyage / Gemini
    return await apiEmbed(text);
  }

  throw new Error(`Unknown embedding mode: ${mode}`);
}
```

### 3.3 降级策略

```
嵌入降级链:

1. 尝试 local (ONNX Runtime)
   ├─ 成功 → 使用本地嵌入
   └─ 失败 → 继续

2. 尝试 api (OpenAI/Voyage/Gemini)
   ├─ 成功 → 使用 API 嵌入
   └─ 失败 → 继续

3. 降级为纯 BM25 全文检索
   └─ 无向量索引，仅关键词匹配
   └─ 检索质量下降但仍可用

4. 降级为 LESSONS.md 全文搜索
   └─ 无 SQLite，回退到纯 Markdown
```

---

## 4. 混合检索引擎

### 4.1 三流检索

| 检索流 | 机制 | 触发条件 | 权重 |
|--------|------|---------|------|
| **BM25** | 词干关键词匹配 + 停用词过滤 | 始终开启 | 0.4 |
| **Vector** | 余弦相似度（HNSW 近邻搜索） | 嵌入引擎可用时 | 0.5 |
| **Graph** | 实体匹配 + 关联遍历（related_lessons） | 查询中包含实体时 | 0.1 |

### 4.2 RRF 融合算法

```
Reciprocal Rank Fusion (RRF):

score(doc) = Σ_{r∈rankings} 1 / (k + rank_r(doc))

其中:
  k = 60 (RRF 常数，抑制高频文档的排名优势)
  rankings = [bm25_ranking, vector_ranking, graph_ranking]

示例:
  BM25: [L-042(1), L-038(2), L-029(3)]
  Vector: [L-029(1), L-042(2), L-021(3)]

  score(L-042) = 1/(60+1) + 1/(60+2) = 0.0164 + 0.0159 = 0.0323
  score(L-029) = 1/(60+3) + 1/(60+1) = 0.0159 + 0.0164 = 0.0323
  score(L-038) = 1/(60+2) + 0          = 0.0159
  score(L-021) = 0          + 1/(60+3) = 0.0159

  最终排序: L-042 ≈ L-029 > L-038 ≈ L-021
```

### 4.3 检索 API

```markdown
# 向量记忆检索接口

## search_lessons
search_lessons(query: string, top_k: int = 5, threshold: float = 0.7,
               layer: str = None, category: str = None) → List[LessonResult]

参数:
  - query: 搜索查询文本
  - top_k: 返回最多 K 条结果
  - threshold: 最低相似度阈值 (0-1)
  - layer: 按记忆层过滤 (EPISODIC/SEMANTIC)
  - category: 按类别过滤 (FAILURE/SUCCESS/INSIGHT/PATTERN)

返回:
  LessonResult {
    id: str           -- L-XXX 编号
    title: str        -- 标题
    summary: str      -- 摘要
    category: str     -- 类别
    score: float      -- RRF 融合得分
    source: str       -- 来源 Phase/Wave
    content: str      -- 完整内容 (可选加载)
  }

## 使用场景
- Phase 4 Wave 开始: 搜索与当前任务相关的历史经验
- Phase 6 审查: 搜索与审查发现相关的历史教训
- Phase 8 归档: 去重检查，避免重复记录
- Domain Skill 匹配: 搜索与当前上下文匹配的领域技能

## 性能目标
- 检索延迟: < 100ms (本地模式)
- 检索准确率: R@5 ≥ 90% (hybrid), R@5 ≥ 70% (BM25-only)
- Token 预算: 单次注入 ≤ 2000 tokens
```

---

## 5. 记忆生命周期管理

### 5.1 Ebbinghaus 衰减曲线

```
记忆重要性随时间衰减:

importance(t) = importance_0 × 2^(-t / half_life)

其中:
  importance_0: 初始重要性 (0-1)
  half_life: 半衰期 (默认 30 天)
  t: 距离上次访问的天数

半衰期策略:
  - CRITICAL 严重度: half_life = 90 天
  - HIGH 严重度: half_life = 60 天
  - MEDIUM 严重度: half_life = 30 天
  - LOW 严重度: half_life = 14 天

访问强化:
  每次被检索命中 → access_count += 1 → half_life × 1.5 (最多 180 天)
```

### 5.2 生命周期状态机

```
active (活跃)
  │
  ├─ 半衰期衰减 importance < 0.1 → inactive (不活跃)
  │                                  │
  │                                  ├─ 30 天无访问 → deprecated (弃用)
  │                                  └─ 被检索命中 → active (重新激活)
  │
  ├─ 被新 Lesson 替代 → superseded (已替代)
  │                        │
  │                        └─ 保留 90 天后删除
  │
  └─ 矛盾检测发现冲突 → conflicting (冲突)
                            │
                            └─ 标记供人工审查
```

### 5.3 矛盾检测

```markdown
## 矛盾检测规则

当新 Lesson 与现有 Lesson 矛盾时:

1. 语义相似度 > 0.85 但结论相反
   → 标记为 conflicting
   → 新 Lesson 添加 superseded_by 指向旧 Lesson
   → 人工审查决定保留哪个

2. 新 Lesson 是旧 Lesson 的升级版
   → 旧 Lesson 状态改为 superseded
   → 新 Lesson 的 superseded_by 为空
   → 旧 Lesson 的 superseded_by 指向新 Lesson

3. Jaccard 相似度 > 0.7 且非升级关系
   → 自动合并为 UPDATE
   → 保留两者但标记关联
```

### 5.4 隐私过滤

```markdown
## 写入前隐私过滤

在写入 observations 和 lessons 前，自动剥离:

1. API Key / Secret / Token 模式:
   - /sk-[a-zA-Z0-9]{20,}/ → [API_KEY_REDACTED]
   - /Bearer\s+[a-zA-Z0-9\-._~+/]+=*/ → [BEARER_TOKEN_REDACTED]
   - /password\s*[=:]\s*\S+/i → [PASSWORD_REDACTED]

2. 连接字符串:
   - /mongodb(\+srv)?:\/\/[^\s]+/ → [DB_CONNECTION_REDACTED]
   - /postgres(ql)?:\/\/[^\s]+/ → [DB_CONNECTION_REDACTED]

3. <private> 标签内容:
   - /<private>[\s\S]*?<\/private>/ → [PRIVATE_CONTENT_REDACTED]

4. 环境变量值:
   - /=([A-Z_]+)\s*=\s*["'][^"']+["']/ → $1=[REDACTED]
```

---

## 6. Crystallize 动作链压缩

### 6.1 概念

将 Phase 4 中重复出现的多步操作序列自动压缩为可复用的"晶体"（Procedural Memory）。

```
检测重复操作序列:

Phase 4 Wave 执行轨迹:
  Wave 1: [read_file, edit_file, bash:test, edit_file, bash:test]
  Wave 2: [read_file, edit_file, bash:test, edit_file, bash:test]
  Wave 3: [read_file, edit_file, bash:test, edit_file, bash:test]

→ 检测到重复模式: "TDD 循环"
→ Crystallize 为晶体:
  trigger: "实现新功能", "添加 API", "编写代码"
  steps:
    1. read_file — 读取当前文件
    2. edit_file — 实现功能
    3. bash:test — 运行测试
    4. edit_file — 修复失败
    5. bash:test — 确认通过
  notes: 先写测试再实现可减少步骤
```

### 6.2 晶体存储

```sql
-- L4 Procedural: Crystals (动作链晶体)
CREATE TABLE IF NOT EXISTS crystals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  trigger_patterns TEXT NOT NULL,    -- JSON 数组触发模式
  steps TEXT NOT NULL,               -- JSON 数组步骤描述
  notes TEXT,                        -- 注意事项
  source_observations TEXT,          -- JSON 数组来源观察 ID
  frequency INTEGER DEFAULT 1,       -- 出现频率
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS crystals_vec USING vec0(
  id TEXT,
  embedding float[384]
);
```

### 6.3 晶体模板

```markdown
# Crystal: {name}

**触发条件**: {trigger_patterns}
**频率**: {frequency} 次

## 步骤

1. {step_1_description}
2. {step_2_description}
...

## 注意事项

- {note_1}
- {note_2}

## 来源

- 观察: {observation_ids}
- 相关 LESSONS: {related_lessons}

## 演化历史

- v1.0 ({date}): 从 Wave {N} 执行轨迹中提取
```

---

## 7. 迁移指南

### 7.1 LESSONS.md → 向量记忆迁移

```bash
# 迁移步骤

1. 读取现有 LESSONS.md
   cat memory/LESSONS.md

2. 解析每个条目
   - 按 "## L-XXX" 标题分割
   - 提取: 编号、标题、内容、类别、日期

3. 为每个条目生成摘要
   - 提取第一段描述性文本
   - 限制在 100 tokens 以内

4. 计算嵌入向量
   - 使用 local 或 api 模式
   - 输入: summary + title + tags

5. 写入 vector_memory.db
   - INSERT INTO lessons (...)
   - INSERT INTO lessons_vec (...)

6. 验证迁移
   - 对比 LESSONS.md 条目数 vs lessons 表行数
   - 随机抽样 5 条，验证语义检索正确性

7. 保留 LESSONS.md 作为备份
   - 不删除原始文件
   - 后续写入双写 LESSONS.md + vector_memory.db
```

### 7.2 迁移脚本接口

```javascript
// migrate-lessons.js
async function migrateFromMarkdown(lessonsPath, dbPath) {
  // 1. 解析 LESSONS.md
  const entries = parseLessonsMarkdown(lessonsPath);

  // 2. 为每个条目生成嵌入
  for (const entry of entries) {
    const summary = generateSummary(entry);
    const embedding = await generateEmbedding(summary);

    // 3. 写入数据库
    await db.insertLesson(entry, summary, embedding);
  }

  // 4. 验证
  const dbCount = await db.getLessonCount();
  const mdCount = entries.length;

  return {
    migrated: dbCount,
    total: mdCount,
    success: dbCount === mdCount,
  };
}
```

---

## 8. 与 LearningWorkflow 集成

### 8.1 LearningWorkflow 修改点

```
LearningWorkflow 现有流程 (不变):
  Step 0: 数据分类 → Durable/Temporary/Session State
  Step 1: Wave 日志扫描 → Lesson 提取
  Step 2: LESSONS.md 写入协议
  Step 2.5: 提名 → 注入日志映射
  Step 3: Domain Skills 晋升
  Step 4: 跨波注入
  Step 5: Phase 转换毕业

新增步骤:
  Step 1.5: ⭐ 向量索引同步 (新增)
    ├─ 新 Lesson 写入 lessons 表
    ├─ 生成 summary + embedding
    └─ 写入 lessons_vec 表

  Step 3.5: ⭐ Crystallize 动作链压缩 (新增)
    ├─ 从 Phase 4 执行轨迹检测重复操作序列
    ├─ 自动压缩为晶体
    └─ 写入 crystals + crystals_vec 表

  Step 4 增强: ⭐ 向量检索注入 (替代关键词匹配)
    ├─ 旧: grep 关键词匹配 domain-skills
    └─ 新: search_lessons(query, top_k=5) 混合检索

  Step 5 增强: ⭐ 衰减和去重 (新增)
    ├─ 计算每个 Lesson 的衰减重要性
    ├─ 标记低重要性 Lesson 为 inactive
    └─ 检测矛盾并标记
```

### 8.2 Phase 4/6/8 集成点

| Phase | 向量记忆使用 | 说明 |
|-------|------------|------|
| **Phase 4** Wave 开始 | `search_lessons(task_context, top_k=3)` | 搜索与当前任务相关的历史经验 |
| **Phase 4** Post-ToolUse | 写入 observations 表 | 自动采集工具调用观察 |
| **Phase 4** Wave 完成 | Crystallize 检测 | 检测重复操作序列 |
| **Phase 6** 审查 | `search_lessons(review_finding, top_k=5)` | 搜索与审查发现相关的历史教训 |
| **Phase 8** 归档 | 去重 + 聚类 + 衰减 | 维护记忆生命周期 |

---

## 9. 降级策略

| 场景 | 降级行为 | 检索质量影响 |
|------|---------|-------------|
| SQLite vec 扩展不可用 | 纯 BM25 全文检索 | R@5 从 ~90% 降至 ~70% |
| 嵌入模型不可用 | 跳过向量索引构建 | 无法语义搜索 |
| 完全无 SQLite | 回退到 LESSONS.md 全文搜索 | R@5 ~50% |
| vector_memory.db 损坏 | 从 LESSONS.md 重建索引 | 需要迁移时间 |
| API 嵌入限流 | 降级到本地嵌入 | 嵌入质量略降 |
| Token 预算不足 | 仅注入 summary，不加载完整内容 | 信息密度降低 |

---

## 10. 配置

默认配置（可通过 vector_config 表或环境变量覆盖）:

```json
{
  "embedding_model": "all-MiniLM-L6-v2",
  "embedding_dim": 384,
  "embedding_mode": "local",
  "retrieval_mode": "hybrid",
  "rrf_k": 60,
  "similarity_threshold": 0.7,
  "max_results": 5,
  "token_budget": 2000,
  "half_life_days": 30,
  "privacy_filter_enabled": true,
  "crystallize_min_frequency": 3,
  "version": "1.0.0"
}
```

环境变量覆盖:

```
FORGEOS_VECTOR_MEMORY_MODE=local|api|bm25-only
FORGEOS_VECTOR_MEMORY_DB=path/to/vector_memory.db
FORGEOS_EMBEDDING_API_KEY=sk-...
FORGEOS_EMBEDDING_API_PROVIDER=openai|voyage|gemini
```

---

## 11. 性能基准

| 指标 | 目标 | 测量方法 |
|------|------|---------|
| 检索延迟 (local) | < 100ms | 1000 次检索 P95 |
| 检索延迟 (api) | < 500ms | 100 次检索 P95 |
| 检索准确率 (hybrid) | R@5 ≥ 90% | LongMemEval-S 标准测试 |
| 检索准确率 (BM25-only) | R@5 ≥ 70% | 同上 |
| 嵌入生成延迟 (local) | < 10ms/条 | 批量 100 条平均 |
| 迁移速度 | < 1s/条 | 1000 条 LESSONS 迁移 |
| 数据库大小 | < 10MB/1000 条 | 含向量索引 |
| Token 节省 | ≥ 80% vs 全文加载 | 注入 5 条 vs 完整 LESSONS.md |

---

## 12. 与其他模块协作

### L3 ↔ L2 协作

| L3 组件 | L2 协作模块 | 协作点 |
|---------|-----------|--------|
| Vector Memory | LearningWorkflow | Lesson 提取 → 向量索引同步 |
| Vector Memory | Wave Executor | Wave 开始 → 经验注入 |
| Vector Memory | Agent Comms | 观察采集 → 消息板关联 |
| Vector Memory | Token Monitor | 注入量 ≤ token_budget |

### L3 ↔ L1 协作

| L3 组件 | L1 对应 Phase | 协作方式 |
|---------|-------------|---------|
| Vector Memory | Phase 4 | Wave 开始搜索 + Post-ToolUse 观察 |
| Vector Memory | Phase 6 | 审查发现搜索相关教训 |
| Vector Memory | Phase 8 | 去重 + 聚类 + 衰减 + 归档 |
