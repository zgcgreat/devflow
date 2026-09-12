# HNSW 索引适配器

> 向量记忆系统的 HNSW (Hierarchical Navigable Small World) 索引适配层。
> 封装不同 HNSW 实现的细节，提供统一的索引构建和查询接口。

---

## 1. 适配器接口

### 1.1 统一接口定义

```typescript
interface HNSWAdapter {
  // 索引管理
  initialize(dim: number, maxElements: number): Promise<void>;
  loadIndex(path: string): Promise<void>;
  saveIndex(path: string): Promise<void>;

  // 向量操作
  addItem(id: string, vector: number[]): Promise<void>;
  addItems(items: Array<{id: string, vector: number[]}>): Promise<void>;
  deleteItem(id: string): Promise<void>;

  // 查询
  query(vector: number[], topK: number): Promise<Array<{id: string, score: number}>>;
  queryById(id: string, topK: number): Promise<Array<{id: string, score: number}>>;

  // 元信息
  getItemCount(): number;
  getDimension(): number;
  isInitialized(): boolean;
}
```

### 1.2 配置参数

```typescript
interface HNSWConfig {
  dim: number;               // 向量维度 (默认 384)
  maxElements: number;       // 最大元素数 (默认 10000)
  m: number;                 // 每个节点的连接数 (默认 16)
  efConstruction: number;    // 构建时搜索宽度 (默认 200)
  efSearch: number;          // 查询时搜索宽度 (默认 50)
  metric: 'cosine' | 'l2';  // 距离度量 (默认 cosine)
}
```

---

## 2. 实现选项

### 2.1 SQLite vec 扩展 (推荐)

**优势**: 无额外依赖，单文件部署，与 SQLite 事务一致

```sql
-- 使用 vec0 虚拟表
CREATE VIRTUAL TABLE lessons_vec USING vec0(
  id TEXT,
  embedding float[384]
);

-- 插入向量
INSERT INTO lessons_vec (id, embedding)
VALUES ('L-042', :embedding_blob);

-- 查询最近邻
SELECT id, distance
FROM lessons_vec
WHERE embedding MATCH :query_vector
ORDER BY distance
LIMIT 5;
```

**加载条件**:
```javascript
// 检测 SQLite vec 扩展是否可用
function isVecAvailable(db) {
  try {
    db.exec("SELECT vec_version()");
    return true;
  } catch {
    return false;
  }
}
```

### 2.2 hnswlib-node (高性能)

**优势**: 原生 C++ 实现，最快检索速度

```javascript
const hnswlib = require('hnswlib-node');

const index = new hnswlib.HierarchicalNSW('cosine', 384);
index.initIndex(10000, 16, 200);
index.addItem(vector, id);
index.queryVector(queryVector, 5);
```

**加载条件**:
```javascript
try {
  require('hnswlib-node');
  // 可用
} catch {
  // 降级到 SQLite vec
}
```

### 2.3 纯 JavaScript 回退 (降级)

**优势**: 零依赖，任何环境都能运行

```javascript
// 暴力搜索 + 余弦相似度
// 仅适用于小数据集 (< 1000 条)
function bruteForceSearch(vectors, query, topK) {
  const scores = vectors.map((v, i) => ({
    id: v.id,
    score: cosineSimilarity(v.vector, query),
  }));
  return scores.sort((a, b) => b.score - a.score).slice(0, topK);
}
```

---

## 3. 适配器选择逻辑

```
初始化 HNSW 适配器:

1. 检测 SQLite vec 扩展
   ├─ 可用 → 使用 SQLiteVecAdapter
   └─ 不可用 → 继续

2. 检测 hnswlib-node 包
   ├─ 可用 → 使用 HnswlibAdapter
   └─ 不可用 → 继续

3. 使用 BruteForceAdapter (降级)
   └─ 数据量 > 1000 条时输出警告
```

---

## 4. 索引生命周期

```
索引构建:

Phase 8 归档 / 首次迁移:
  1. 读取所有 lessons
  2. 批量生成嵌入 (batch size = 32)
  3. 写入 HNSW 索引
  4. 保存索引到 .devflow/vector_memory.db

增量更新:

LearningWorkflow Step 1.5 (每个新 Lesson):
  1. 生成新 Lesson 的嵌入
  2. addItem(id, vector) 增量添加
  3. 保存索引

索引重建:

  触发条件:
    - 索引损坏
    - 嵌入模型更换
    - 数据量增长 50%+
  
  操作:
    - 从 lessons 表全量读取
    - 重新生成嵌入
    - 重建索引
```

---

## 5. 性能参考

| 实现 | 构建速度 (1K 条) | 查询延迟 (P95) | 内存占用 (1K 条) | 磁盘占用 (1K 条) |
|------|-----------------|---------------|----------------|-----------------|
| SQLite vec | ~2s | ~15ms | ~5MB | ~3MB |
| hnswlib-node | ~0.5s | ~5ms | ~8MB | ~2MB |
| Brute-force | N/A | ~50ms | ~2MB | N/A |

> 注: 以上为 384 维 float 向量的参考数据，实际性能取决于硬件。
