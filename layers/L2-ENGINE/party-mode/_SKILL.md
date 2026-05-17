# PartyMode — 多Agent共识机制

> 当复杂决策需要多角度审视时，触发 PartyMode 共识协议。
> **增强版**: 支持自定义Agent阵容、自动摘要、跨Session辩论历史追踪

---

## 配置文件

### Agent阵容配置

**位置**: `.ultimate-workflow/config/party-agents.yaml`

```yaml
# PartyMode Agent阵容配置
agents:
  - name: CEO
    weight: 2.0
    specialty: "战略视角、商业可行性"
    personality: "挑战现状，关注ROI和市场机会"
  
  - name: CFO
    weight: 1.8
    specialty: "成本评估、ROI分析"
    personality: "谨慎保守，关注预算和资源分配"
  
  - name: CTO
    weight: 1.5
    specialty: "技术架构、可行性"
    personality: "务实创新，平衡技术债务与交付速度"
  
  - name: Designer
    weight: 1.3
    specialty: "UX/UI、用户体验"
    personality: "用户至上，关注可用性和美观度"
  
  - name: Security
    weight: 1.5
    specialty: "安全审查、威胁建模"
    personality: "零信任原则，关注攻击面和数据保护"
  
  - name: QA
    weight: 1.2
    specialty: "测试覆盖、质量保障"
    personality: "怀疑论者，寻找边界情况和失败模式"

discussion_rules:
  max_rounds: 5                    # 最大讨论轮次
  context_summary_threshold: 400   # 上下文摘要阈值（词）
  auto_summarize_every: 3          # 每N轮自动摘要
  confidence_threshold: 75         # 共识信心阈值（%）
  escalation_threshold: 60         # 升级人工决策阈值（%）
```

### 默认Agent池（无配置时使用）

| 角色 | 专长 | 权重 |
|------|------|------|
| **Architect** | 技术架构 | 1.5x |
| **Security-Auditor** | 安全审查 | 1.5x |
| **Performance-Auditor** | 性能分析 | 1.3x |
| **QA-Lead** | 测试覆盖 | 1.2x |
| **Dev-Reviewer** | 代码质量 | 1.0x |

---

## 触发条件

**自动触发**（满足任一）：
- 复杂任务涉及多个专业领域
- Agent 信心指数 < 70%
- 用户明确要求"讨论"或"评审"

**手动触发**：
```
/party <问题描述>
```

---

## 共识流程

```
1. 问题陈述 → 所有 Agent 读题
2. 独立分析 → 各 Agent 不讨论
3. 观点发表 → 按专家顺序
4. 交叉质疑 → 问答轮
5. 自动摘要 → 每3轮更新上下文（<400词）
6. 共识形成 → 或升级处理
```

### 自动摘要机制

**触发条件**: 每3轮讨论后

**摘要内容**:
- 当前讨论的核心议题
- 各Agent的立场和关键论点
- 已达成共识的点
- 仍存在的分歧
- 用户倾向性（如有）

**摘要格式**:
```markdown
## Discussion Context (Round 3 Summary)

**核心议题**: WebSocket消息系统的重连策略

**Agent立场**:
- CTO: 支持指数退避，关注稳定性
- Security: 要求速率限制，防止DDoS
- QA: 需要可观测性，便于调试

**已达成共识**:
- 最大重试次数: 3次
- 基础延迟: 1秒

**待决问题**:
- 是否添加Jitter（随机抖动）？
- 失败后的降级策略？

**用户倾向**: 偏向CTO方案，但认可Security的担忧
```

**好处**:
- 避免上下文膨胀（保持<400词）
- 新加入的Agent快速理解历史
- 跨Session辩论时可恢复状态

---

## Agent 角色池

| 角色 | 专长 | 权重 |
|------|------|------|
| **Architect** | 技术架构 | 1.5x |
| **Security-Auditor** | 安全审查 | 1.5x |
| **Performance-Auditor** | 性能分析 | 1.3x |
| **QA-Lead** | 测试覆盖 | 1.2x |
| **Dev-Reviewer** | 代码质量 | 1.0x |

---

## 共识判定

### 通过条件
- **多数一致**：≥70% Agent 同意
- **信心指数**：加权平均 ≥ 75%

### 升级条件（需人工决策）
- 信心指数 < 60%
- 超过 3 轮无共识
- 涉及安全/架构关键决策

---

## 输出格式

```markdown
## PartyMode 共识结果

**问题**: <问题描述>
**耗时**: <轮次> 轮
**共识度**: <百分比>
**参与Agent**: <角色列表>

### 结论
<共识内容>

### Agent观点摘要
| Agent | 立场 | 关键论点 |
|-------|------|----------|
| CTO | ✅ 支持 | 技术可行性高，架构清晰 |
| Security | ⚠️ 保留 | 需要加强速率限制 |
| QA | ✅ 支持 | 测试覆盖完整 |

### 保留意见
<不同意的Agent及理由>

### 辩论历史
<自动摘要链接或内嵌摘要>

### 升级标记
<是否需要人工介入>
```

---

## 实施检查清单

- [ ] 问题清晰陈述
- [ ] 所有相关专家参与（根据配置或默认池）
- [ ] 每轮记录信心指数
- [ ] 少数意见被充分倾听
- [ ] 每3轮自动摘要上下文
- [ ] 共识或升级结论明确
- [ ] 辩论历史可追溯
