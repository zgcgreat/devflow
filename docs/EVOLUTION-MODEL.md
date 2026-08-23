# ForgeOS 统一进化模型

> 版本: 1.0.0 | 融合: ForgeOS 知识驱动 + ECC 数据驱动 + v2.0 交叉验证

---

## 统一进化数据模型

### 知识层 (ForgeOS 继承)

- **LESSONS.md** → L-XXX编号体系、Jaccard聚类、Domain Skills毕业
- **domain-skills/** → 频率>=3自动毕业、成熟度分级

### 数据层 (ECC 增强)

- **session-log.jsonl** → 每次Provider调用的性能数据(延迟/Token/成本/成功率)
- **evolution-metrics.json** → 进化效果度量(LESSONS引用次数、Domain Skill命中率)

### 融合层 (v2.0 新增)

Phase 8 归档时执行统一进化引擎:
1. **LearningWorkflow提取LESSONS** (知识驱动)
   - 从 Wave SUMMARY 中提取成功/失败/部分经验
   - 使用 Jaccard相似度聚类去重
   - 写入 LESSONS.md (L-XXX编号体系)

2. **evaluate-session评估Session数据** (数据驱动)
   - 分析 Provider 调用延迟、Token消耗、成本
   - 分析 成功率和错误模式
   - 写入 session-log.jsonl 和 evolution-metrics.json

3. **交叉验证**
   - LESSONS命中率 vs 实际Session效果 → 高命中率LESSONS权重提升
   - Session高频模式 vs LESSONS未覆盖 → 新LESSONS候选
   - Domain Skill命中率 < 50% → 降级标记
   - 新模式发现 → 创建候选 Domain Skill

4. **输出统一进化报告**
   - 知识层健康度评分
   - 数据层效率评分
   - 交叉验证一致性评分
   - 优化建议列表

---

## 进化周期

| 周期 | 触发 | 动作 |
|------|------|------|
| Per-Wave | Wave完成 | LESSONS提名+Domain Skill计数 |
| Per-Phase | Phase完成 | LESSONS去重+Skill权重更新 |
| Per-Session | P8归档 | 统一进化引擎全量执行 |
| Per-Milestone | 里程碑完成 | Domain Skill毕业+进化报告 |

---

## 交叉验证算法

```
交叉验证一致性 = Jaccard(LESSONS覆盖集, Session高频集)

一致性 > 0.6 → 进化引擎健康，两个通道互相验证
一致性 < 0.3 → 进化引擎偏离，需人工审查
一致性 0.3-0.6 → 进化引擎学习期，自动调整权重

权重调整:
  高命中率LESSONS → 权重+0.1 (上限1.0)
  低命中率LESSONS → 权重-0.1 (下限0.1, <0.1标记降级)
  新发现模式 → 创建候选LESSONS (权重0.5)
  命中率<50% Domain Skill → 降级标记(需3次连续<50%才移除)
```
