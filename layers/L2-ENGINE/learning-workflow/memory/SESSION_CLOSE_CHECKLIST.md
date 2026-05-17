# 会话收尾检查清单

在声明一个记忆感知会话完成之前，使用此检查清单。

## 必需检查

- `CURRENT_STATE.md` 是否已更新以反映真实的停止点？
- 是否需要为此会话创建新的 `session-journal/` 条目？
- 是否有任何持久化事实、决策、失败模式、验证规则或团队偏好发生变化？
- 本次会话写入的所有持久化条目是否包含：
  - `id`
  - `status`
  - `confidence`
  - `source`
  - `last_updated`
  - `review_after`
- 如果有条目标记为 `confidence: verified`，它是否在 `source` 中包含真实证据？
- 如果替换了任何旧条目，是否将其标记为 `status: superseded`？

## 提升检查

- 如果待办候选是 `ready_for_promotion`，它是否有：
  - `evidence_count >= 2`
  - `repeated_times >= 2`
  - `source`
  - `review_after`
  - 链接的支持条目

## 最终验证

- 当记忆发生变化时，运行 `scripts/validate-superpowers-memory.ps1` 或 `scripts/validate-superpowers-memory.sh`
- 如果验证器刷新了 `memory-index.yaml`，请审查它
