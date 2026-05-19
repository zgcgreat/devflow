# Surface Budget 运行时控制指南

> **来源**: supercorp-ultimate  
> **集成位置**: Phase 0战略评估 + 全局Token监控  
> **核心价值**: 在会话开始时设定预算上限，防止意外超支

---

## 🎯 Surface Budget概念

**Surface Budget** = 用户主动设定的Token使用上限（而非被动监控）

### 传统方式 vs Surface Budget

| 维度 | 传统Token监控 | Surface Budget |
|------|--------------|----------------|
| 触发时机 | 达到阈值后警告 | 开始前主动设定 |
| 用户控制 | 被动接受 | 主动选择 |
| 灵活性 | 固定阈值 | 动态调整 |
| 透明度 | 仅显示已用 | 显示预算+剩余 |

---

## 🔧 配置方式

### 方式1: 命令行参数

```bash
/unified new "项目名称" --budget 500K
/unified new "电商平台" --budget 1M --mode Strict
```

### 方式2: 配置文件

**位置**: `.devflow/config/budget.yaml`

```yaml
# Token预算管理配置
default_budget: 300K          # 默认预算
max_budget: 2M                # 最大允许预算

budget_presets:
  small:
    limit: 100K
    description: "小型功能/Bug修复"
    recommended_for: ["bugfix", "minor-feature"]
  
  medium:
    limit: 300K
    description: "常规功能开发"
    recommended_for: ["feature", "refactor"]
  
  large:
    limit: 1M
    description: "复杂系统/架构重构"
    recommended_for: ["architecture", "migration"]
  
  enterprise:
    limit: 2M
    description: "企业级项目"
    recommended_for: ["platform", "microservices"]

alert_thresholds:
  warning: 70%      # 达到70%时警告
  critical: 90%     # 达到90%时严重警告
  emergency: 95%    # 达到95%时紧急停止

auto_adjustment:
  enabled: true
  increase_step: 50K   # 自动增加步长
  max_increase: 200K   # 最大自动增加量
```

### 方式3: 交互式设置

**Phase 0战略评估时自动提示**:

```markdown
## 💰 Token预算设置

根据您的需求复杂度，推荐以下预算方案：

| 方案 | 预算 | 适用场景 | 预估耗时 |
|------|------|---------|---------|
| **Small** | 100K | Bug修复、文案调整 | ~30分钟 |
| **Medium** ⭐ | 300K | 常规功能开发 | ~2小时 |
| **Large** | 1M | 复杂系统、架构重构 | ~6小时 |
| **Custom** | 自定义 | 特殊需求 | - |

**您的选择?** 
- [S] Small (100K)
- [M] Medium (300K) ← 推荐
- [L] Large (1M)
- [C] Custom (请输入具体数值)

> 💡 提示: 可随时通过 `/budget adjust +50K` 增加预算
```

---

## 📊 运行时监控

### 状态栏显示

**格式**: `[Budget: 45K/300K (15%)]`

**颜色编码**:
- 🟢 <70%: 绿色（正常）
- 🟡 70%-90%: 黄色（警告）
- 🔴 >90%: 红色（严重）

### 自动提醒机制

| 阈值 | 动作 | 消息示例 |
|------|------|---------|
| 70% | Warning | ⚠️ 已使用70%预算 (210K/300K)，建议优化或增加预算 |
| 90% | Critical | 🔴 已使用90%预算 (270K/300K)，即将耗尽！ |
| 95% | Emergency | 🚨 已使用95%预算 (285K/300K)，立即停止非关键任务 |
| 100% | Stop | ❌ 预算耗尽，执行中止。请使用 `/budget add` 增加预算 |

### 详细报告命令

```bash
/budget status              # 查看当前预算状态
/budget breakdown           # 查看各阶段消耗明细
/budget predict             # 预测剩余任务所需预算
```

**输出示例**:

```markdown
## Token预算状态

**总预算**: 300K  
**已使用**: 185K (62%)  
**剩余**: 115K  

### 阶段消耗明细
| Stage | 已用 | 占比 | 说明 |
|-------|------|------|------|
| Phase 0-1 | 45K | 15% | 需求分析 |
| Phase 2-2a | 60K | 20% | 方案设计 |
| Phase 3 | 30K | 10% | 任务拆分 |
| Phase 4 | 50K | 17% | 实施（进行中） |

### 预测
- 剩余任务预计需要: 80K
- 预算充足度: ✅ 足够（剩余115K > 预计80K）
- 风险等级: 🟢 低

### 建议
- 当前消耗速率正常
- 无需调整预算
- 继续执行即可
```

---

## 🔄 动态调整

### 手动调整

```bash
/budget add 50K            # 增加50K预算
/budget set 500K           # 重新设定为500K
/budget reset              # 重置预算（谨慎使用）
```

### 自动调整

**触发条件**:
- 检测到Phase 4实施阶段任务复杂度超预期
- LearningWorkflow提取到新经验，可优化后续Wave

**调整策略**:
```yaml
auto_adjustment:
  conditions:
    - task_complexity > expected * 1.5
    - wave_failure_rate > 30%
    - user_explicitly_requests_more
  
  actions:
    - increase: 50K
    - notify_user: true
    - log_reason: "Task complexity exceeded expectations"
  
  limits:
    max_auto_increase: 200K
    require_approval_above: 100K
```

**用户确认对话框**:

```markdown
## 💰 预算调整建议

**检测到**: Phase 4 Wave 3任务复杂度超预期（实际60K vs 预计30K）

**建议**: 自动增加50K预算
- 当前预算: 300K
- 已使用: 250K (83%)
- 调整后: 350K
- 新剩余: 100K

**原因**: 
- Wave 3涉及数据库迁移，比预期复杂
- 需要额外的测试用例覆盖边界情况

**您的决定?**
- [Y] 同意增加50K
- [N] 拒绝，我将优化代码
- [C] 自定义增加量（请输入）
```

---

## 📈 预算优化技巧

### 1. 使用压缩级别

```bash
/compress lite      # 轻度压缩（节省~30%）
/compress full      # 标准压缩（节省~50%）
/compress extreme   # 极限压缩（节省~70%，慎用）
```

### 2. 跳过非必要阶段

```bash
/skip phase 2a      # 跳过设计枪战（简单任务）
/skip phase 6       # 跳过对抗审查（低风险任务）
```

### 3. 并行Wave优化

```markdown
Wave计划优化:
- Wave 1: Task A + Task B（并行，节省50%时间）
- Wave 2: Task C（依赖A完成后开始）
- Wave 3: Task D + E + F（并行）

预期节省: ~40% Token（相比串行执行）
```

### 4. 复用LESSONS经验

```markdown
LearningWorkflow检测到:
- 上次类似任务失败原因: API超时未处理
- 本次Wave自动应用: retry策略 + 超时监控

预期节省: ~20% Token（避免重复错误）
```

---

## 🚨 应急处理

### 预算即将耗尽

**应对策略**:

1. **立即压缩上下文**
   ```bash
   /compress extreme
   ```

2. **暂停非关键任务**
   ```bash
   /pause non-critical
   ```

3. **请求增加预算**
   ```bash
   /budget add 100K
   ```

4. **切换到Fast模式**
   ```bash
   /mode Fast
   ```

### 预算已耗尽

**自动动作**:
1. 保存当前进度到checkpoint
2. 生成部分产物（已完成的部分）
3. 输出详细消耗报告
4. 等待用户增加预算或终止

**用户选项**:
```markdown
## ❌ 预算耗尽

**总预算**: 300K  
**已使用**: 300K (100%)  
**剩余**: 0K  

**当前状态**: Phase 4 Wave 2 进行中（50%完成）

**您的选择?**
- [A] 增加100K预算，继续执行
- [B] 增加50K预算，仅完成当前Wave
- [C] 终止会话，保存当前进度
- [D] 查看消耗报告，分析优化点
```

---

## 📊 历史数据分析

### 预算使用趋势

```bash
/budget history --last 10    # 查看最近10次会话
/budget analytics            # 查看详细分析报告
```

**输出示例**:

```markdown
## 预算使用分析（过去30天）

**总会话数**: 25  
**平均预算**: 280K  
**平均消耗**: 245K (87%)  
**超支次数**: 2次 (8%)  

### 按项目类型
| 类型 | 平均预算 | 平均消耗 | 利用率 |
|------|---------|---------|--------|
| Bug修复 | 80K | 65K | 81% |
| 功能开发 | 320K | 290K | 91% |
| 架构重构 | 1.2M | 1.1M | 92% |

### 优化建议
- Bug修复预算可适当降低至60K
- 功能开发预算合理，保持300K
- 架构重构建议增加至1.5M以避免超支
```

---

## 🔗 与其他系统集成

### 与Provider路由集成

```yaml
provider_budget_mapping:
  high_creativity:
    model: "Claude 3 Opus"
    cost_multiplier: 1.5x
    budget_impact: "高"
  
  high_code:
    model: "GPT-4 Turbo"
    cost_multiplier: 1.2x
    budget_impact: "中"
  
  standard:
    model: "Claude 3 Sonnet"
    cost_multiplier: 1.0x
    budget_impact: "低"
```

**智能提示**:
```markdown
⚠️ 检测到Phase 2需要高创造力模型（Claude 3 Opus）
预计成本: 1.5x标准模型
建议: 增加20%预算或切换到GPT-4 Turbo（1.2x）
```

### 与LearningWorkflow集成

```markdown
LearningWorkflow优化预算:
- 检测到重复错误模式 → 自动应用LESSONS
- 预计节省: 15% Token
- 自动调整预算预测: 从300K降至255K
```

---

## 📖 最佳实践

1. **开始前设定预算**: 避免无限制消耗
2. **定期监控**: 每完成一个Stage检查预算
3. **预留缓冲**: 预算设为预期的120%
4. **善用压缩**: 非关键阶段使用lite/full压缩
5. **分析历史**: 根据过往数据调整预算策略
6. **动态调整**: 根据实际情况灵活增减

---

## 🎯 总结

**Surface Budget核心价值**:
- ✅ 用户主动控制，而非被动接受
- ✅ 实时监控，透明度高
- ✅ 动态调整，灵活性强
- ✅ 历史分析，持续优化

**与传统监控对比**:
- 传统: "你已经用了90%，小心！"
- Surface: "我建议设300K预算，够用吗？"
