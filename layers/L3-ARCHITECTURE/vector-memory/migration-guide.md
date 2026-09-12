# LESSONS.md → 向量记忆迁移指南

> 本指南帮助将现有 LESSONS.md 纯文本经验库迁移到向量记忆系统。

---

## 1. 迁移前检查

### 1.1 环境检查

```bash
# 检查 Node.js 版本 (需要 >= 18)
node --version

# 检查 SQLite 支持
node -e "const Database = require('better-sqlite3'); const db = new Database(':memory:'); console.log('SQLite OK');"

# 检查 vec 扩展 (可选)
node -e "const Database = require('better-sqlite3'); const db = new Database(':memory:'); db.exec('SELECT vec_version()'); console.log('vec OK');" 2>/dev/null || echo "vec not available, will use BM25-only"

# 检查嵌入模型 (可选)
node -e "require('onnxruntime-node'); console.log('ONNX Runtime OK');" 2>/dev/null || echo "ONNX not available, will use API embedding or BM25-only"
```

### 1.2 数据评估

```bash
# 统计现有 LESSONS 条目数
grep -c "^## L-" memory/LESSONS.md

# 估算迁移时间 (约 1s/条 for local, 0.1s/条 for api)
# 100 条 ≈ 100s (local) ≈ 10s (api)
```

---

## 2. 迁移步骤

### Step 1: 备份

```bash
# 备份原始 LESSONS.md
cp memory/LESSONS.md memory/LESSONS.md.backup.$(date +%Y%m%d)
```

### Step 2: 初始化数据库

```bash
# 创建向量记忆数据库
node -e "
  const Database = require('better-sqlite3');
  const db = new Database('.devflow/vector_memory.db');
  // 执行 _SKILL.md 中的 SQL Schema
  // ... (参考 _SKILL.md §2.1)
  console.log('Database initialized');
"
```

### Step 3: 解析 LESSONS.md

```bash
# 解析每个 ## L-XXX 条目
# 提取: 编号、标题、类别、内容、根因、预防措施、适用场景
```

解析规则:
1. 按 `## L-XXX` 标题分割
2. 提取 L-XXX 编号
3. 提取类别: FAILURE/SUCCESS/INSIGHT/PATTERN
4. 提取标题: `## L-XXX [CATEGORY] Title` 中的 Title 部分
5. 提取字段: Context, Root Cause, Impact, Solution, Applicability 等
6. 生成 summary: 取第一段描述性文本，限制 100 tokens

### Step 4: 生成嵌入

```bash
# 为每个条目生成嵌入向量
# 输入: summary + " " + title + " " + tags
# 输出: float[384] 向量

# 批量生成 (推荐 batch size = 32)
# 减少嵌入模型加载开销
```

### Step 5: 写入数据库

```sql
-- 写入 lessons 表
INSERT INTO lessons (id, lesson_number, title, content, summary, category,
                     memory_layer, tags, frequency, importance, severity,
                     confidence, applicability, root_cause, prevention,
                     source_phase, source_wave, status, half_life_days,
                     created_at, updated_at)
VALUES ('L-042-token-refresh-retry', 42, 'Token Refresh Retry', ...);

-- 写入 lessons_vec 表 (如果 vec 扩展可用)
INSERT INTO lessons_vec (id, embedding)
VALUES ('L-042-token-refresh-retry', :embedding_blob);
```

### Step 6: 验证

```bash
# 验证 1: 条目数量一致
SELECT COUNT(*) FROM lessons;  -- 应等于 LESSONS.md 中的条目数

# 验证 2: 随机抽样检索
-- 搜索 "token refresh"
SELECT id, title, summary FROM lessons
WHERE content LIKE '%token%' AND content LIKE '%refresh%';

# 验证 3: 向量检索 (如果可用)
-- 搜索 "JWT 认证失败"
-- 应返回与认证相关的 L-XXX 条目
```

---

## 3. 迁移后操作

### 3.1 双写模式

迁移完成后，所有新的 Lesson 写入必须双写:

```javascript
// 写入 LESSONS.md (Markdown)
appendToLessonsMarkdown(lesson);

// 写入 vector_memory.db (SQLite)
db.insertLesson(lesson, summary, embedding);
```

### 3.2 降级兼容

如果向量记忆系统不可用，自动降级:

```javascript
// 检索优先使用向量记忆
let results;
try {
  results = await vectorMemory.search(query, topK);
} catch {
  // 降级到 LESSONS.md 全文搜索
  results = await searchLessonsMarkdown(query, topK);
}
```

### 3.3 定期索引维护

```bash
# 每周执行一次索引维护
# 1. 重新计算衰减重要性
# 2. 标记低重要性条目为 inactive
# 3. 检测矛盾
# 4. 重建索引碎片
```

---

## 4. 回滚方案

如果向量记忆系统出现问题:

```bash
# 回滚到纯 LESSONS.md 模式

1. 禁用向量记忆:
   设置环境变量 DEVFLOW_VECTOR_MEMORY_MODE=bm25-only

2. 恢复备份 (如果 LESSONS.md 损坏):
   cp memory/LESSONS.md.backup.YYYYMMDD memory/LESSONS.md

3. 完全禁用 (如果 SQLite 不可用):
   设置环境变量 DEVFLOW_VECTOR_MEMORY_MODE=disabled
   → 所有检索回退到 LESSONS.md 全文搜索

4. 重建索引 (如果数据库损坏):
   删除 .devflow/vector_memory.db
   重新执行迁移步骤
```

---

## 5. 常见问题

### Q1: 迁移后 LESSONS.md 是否还需要?
**A**: 需要。LESSONS.md 是人类可读的接口，向量索引是机器检索的加速层。双写保证两者一致。

### Q2: 向量检索比全文搜索好多少?
**A**: 混合检索 (BM25 + Vector + RRF) 准确率 R@5 ~90%，纯 BM25 ~70%，纯全文搜索 ~50%。语义相似但用词不同的查询差距更大。

### Q3: 没有嵌入模型怎么办?
**A**: 自动降级为 BM25 全文检索。仍比纯 LESSONS.md 搜索快，因为 SQLite 索引比 Markdown grep 高效。

### Q4: 迁移需要多长时间?
**A**: 100 条 LESSONS: local ~100s, api ~10s。首次迁移后增量更新 < 1s/条。

### Q5: 数据库文件多大?
**A**: 1000 条含 384 维向量 ≈ 3-5MB。远小于 typical 项目大小。
