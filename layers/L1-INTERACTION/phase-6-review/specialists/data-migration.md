# Data Migration Specialist — Phase 6+ 技术专家审查层

> **来源**: mega-workflow / supercorp-ultimate 融合  
> **层级**: L1-INTERACTION (Phase 6之上第二层)

## 触发条件

```yaml
triggers:
  - SCOPE_MIGRATIONS=true in task metadata
  - or diff contains SQL/dictionary changes
  - or database model modifications detected
```

## 审查焦点

1. **可逆性** (Reversibility): Migration是否提供down/undo路径？数据丢失风险评估
2. **数据丢失风险** (Data Loss Risk): ALTER COLUMN类型变更、DROP列、ENUM值移除的回退方案
3. **锁持续时间** (Lock Duration): 大表DDL的锁竞争影响，是否使用online方式
4. **多阶段安全** (Multi-Phase Safety): deploy→migrate→rollback的阶段性安全保障

## 输出 Schema (JSON)

```json
{
  "specialist": "data-migration",
  "severity": "CRITICAL|HIGH|MEDIUM|LOW",
  "finding": {
    "title": "简述发现",
    "migration_file": "文件名",
    "description": "数据迁移风险描述",
    "reversibility": "可逆/半可逆/不可逆",
    "estimated_affected_rows": 数字,
    "lock_duration_estimate": "时长估计",
    "fix_suggestion": "修复建议",
    "canary_safe": true|false
  }
}
```

## 与现有双阶段审查的关系

- **Stage A**: 检查迁移需求文档中的AC是否覆盖回退测试
- **Stage B**: 作为并行agent审查migration code diff
- **G3门控**: Irreversible + Large table → G3 FAIL until rollback plan added

## 组合策略

| 变更规模 | 触发的专家 |
|---------|-----------|
| Small (<50行) | Maintainability (if dead model references) |
| Medium (50-200行) | Data Migration + Testing + API Contract |
| Large (>200行) | Data Migration + Security + Red Team + Performance |
