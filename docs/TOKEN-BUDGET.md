# DevFlow Token 预算策略

> 版本: 1.0.0 | 基于: DevFlow v3.2.3 Standard 模式实测 + v2.0 增量估算

---

## 基线测量方法

- 在 DevFlow 原版中运行 Standard 模式完整流程，记录各 Phase Token 消耗
- DevFlow 增量 = Persona + Hook桥接 + 安全增强

---

## 各 Phase Token 消耗估算

| Phase | DevFlow基线 | Persona增量 | Hook增量 | 安全增量 | DevFlow Standard总计 |
|-------|-----------|------------|---------|---------|----------------------|
| P0 | ~5K | +2K(planner) | +1K(Markdown) | 0 | ~8K |
| P1 | ~8K | +2K(planner) | +1K | 0 | ~11K |
| P1b | ~4K | +4K(planner+architect) | +1K | 0 | ~9K |
| P2 | ~12K | +4K(architect+explorer) | +1K | +1K | ~18K |
| P3 | ~8K | +2K(planner) | +1K | 0 | ~11K |
| P4 | ~15K | +2K(build-error) | +3K(Markdown+JS) | +1K | ~21K |
| P5 | ~10K | +4K(tdd+security) | +3K | +2K | ~19K |
| P6 | ~12K | +6K(3core) | +3K | +2K | ~23K |
| P7 | ~3K | 0 | +1K | 0 | ~4K |
| P8 | ~5K | 0 | +1K | 0 | ~6K |

**DevFlow Standard基线总计**: ~84K
**DevFlow Standard总计**: ~132K
**增幅**: ~48K / ~57% → 需实测验证后优化

---

## Scale x TechStack 联合加载增量表

| Scale x TechStack | 单语言 | 双语言 | 三语言+ | 无识别 |
|-------------------|--------|--------|---------|--------|
| Lite | +5% | +10% | +15% | +0% |
| Standard | +10% | +15% | +20% | +5% |
| Enhanced | +15% | +20% | +25% | +10% |
| Advanced | +20% | +25% | +30% | +15% |

Token增幅 = 基线 + Scale增幅% + TechStack增幅%

---

## 五档模式 Token 预算

| 模式 | Persona加载 | Hook级别 | Token预算 |
|------|-----------|---------|----------|
| Fast | 无 | markdown-only | ~84K (与DevFlow基线持平) |
| Lean | 核心7 | markdown-only | ~98K (+14K) |
| Standard | 核心7+按需 | markdown+js可选 | ~132K (+48K) |
| Strict | 核心7+按需+安全 | markdown+js全量 | ~160K (+76K) |
| Audit | 全量 | markdown+js全量+安全Hook | ~200K (+116K) |

**硬性约束**: DevFlow Standard 基线增幅 <= DevFlow 原版的 30%
**当前估算**: ~57% → 需通过 caveman-shrink 和 surface-switch 优化至 <=30%

---

## 优化策略

1. **caveman-shrink**: Persona指令压缩 70-76%，可节省 ~10K
2. **surface-switch**: 运行时技能簇切换，按Phase加载而非全量
3. **按需Persona**: 扩展Persona仅在检测到技术栈时加载
4. **安全规则分层**: common+1语言 vs 全量多语言

优化后预估 Standard 增幅: ~25-28% (满足硬性约束)
