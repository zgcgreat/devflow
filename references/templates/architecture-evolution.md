# architecture-evolution · <YYYY-MM-DD>

## 元信息

| 字段 | 值 |
|---|---|
| 同步日期 | `<YYYY-MM-DD>` |
| 起始范围 | `<last_evolve_at 或首次全量>` |
| 扫描 req | `<N>` 个 |
| 目标文档 | `.devflow-kit/CONTEXT.md`、`.devflow-kit/system-architecture.md`（如存在） |
| 处理方式 | `<直接应用 / 暂存 patch / 部分应用 / 取消>` |

## 扫描范围

| Req ID | 路径 | 状态 | §9 结果 |
|---|---|---|---|
| `<req-id>` | `.devflow-kit/archive/<date>-<req-id>/02-design.md` | `<已扫描>` | `<有候选 / 无建议 / 跳过理由>` |

## 候选汇总

| 类别 | 候选数 | 接受 | 跳过 | 编辑后接受 | 冲突数 |
|---|---:|---:|---:|---:|---:|
| 新增可复用抽象 | `<N>` | `<N>` | `<N>` | `<N>` | `<N>` |
| 项目级技术决策 | `<N>` | `<N>` | `<N>` | `<N>` | `<N>` |
| 跨模块契约 | `<N>` | `<N>` | `<N>` | `<N>` | `<N>` |
| 依赖变动 | `<N>` | `<N>` | `<N>` | `<N>` | `<N>` |
| 禁动清单变动 | `<N>` | `<N>` | `<N>` | `<N>` | `<N>` |

## 新增可复用抽象

| 路径 | 能力 | 来源 req | 冲突检测 | 用户决定 | 处理 |
|---|---|---|---|---|---|
| `<src/lib/cache.ts>` | `<LRU 缓存>` | `<req-id>` | `<无 / 与 X 冲突>` | `<接受 / 跳过 / 编辑>` | `<append 到上下文 / N/A>` |

## 项目级技术决策

| 决策 | 取值 | 来源 req | 影响范围 | 与当前上下文冲突 | 用户决定 |
|---|---|---|---|---|---|
| `<缓存层选型>` | `<Redis>` | `<req-id>` | `<全栈>` | `<无 / 有>` | `<接受 / 跳过 / 编辑>` |

## 跨模块契约

### HTTP API

| 契约 | 来源 req | 目标文档 | 用户决定 |
|---|---|---|---|
| `<GET /api/cache/*>` | `<req-id>` | `<system-architecture.md §4.1>` | `<接受 / 跳过>` |

### 事件 / 消息

| 事件 | 来源 req | 生产者 | 消费者 | 用户决定 |
|---|---|---|---|---|
| `<events.cache.invalidated>` | `<req-id>` | `<module>` | `<module>` | `<接受 / 跳过>` |

### Schema

| Schema 变更 | 来源 req | 目标文档 | 用户决定 |
|---|---|---|---|
| `<cache_entries 表>` | `<req-id>` | `<system-architecture.md §4.3>` | `<接受 / 跳过>` |

## 依赖变动

| 包 / 依赖 | 版本变动 | 来源 req | 类型 | 用户决定 |
|---|---|---|---|---|
| `<ioredis>` | `<+5.4.0>` | `<req-id>` | `<新增 / 替换 / 移除>` | `<接受 / 跳过>` |

## 禁动清单变动

| 变动 | 路径 | 来源 req | 理由 | 用户决定 |
|---|---|---|---|---|
| `<新增禁动>` | `<src/lib/cache.ts>` | `<req-id>` | `<禁止绕过封装>` | `<接受 / 跳过>` |

## 应用 patch

### CONTEXT.md patch

```diff
+ <追加到既有抽象索引 / 技术栈 / 禁动清单 / 技术债的内容>
```

### system-architecture.md patch（如存在）

```diff
+ <追加到 ADR / 跨模块契约 / schema / 修订历史的内容>
```

## 跳过项与理由

| 候选 | 来源 req | 跳过理由 | 后续处理 |
|---|---|---|---|
| `<候选项>` | `<req-id>` | `<用户给出的原因>` | `<无 / 下次复查>` |

## 备份记录

| 文件 | 备份路径 | 状态 |
|---|---|---|
| `.devflow-kit/CONTEXT.md` | `.devflow-kit/CONTEXT.md.bak-<YYYY-MM-DD>` | `<已备份 / N/A>` |
| `.devflow-kit/system-architecture.md` | `.devflow-kit/system-architecture.md.bak-<YYYY-MM-DD>` | `<已备份 / N/A>` |

## 状态更新

```yaml
last_evolve_at: <YYYY-MM-DD>
last_evolve_promoted:
  - <req-id>
```

## 下次同步建议

- 建议时间：`<YYYY-MM-DD>`
- 触发条件：`<新增 ≥ 5 个 req / 60 天后 / A-architect 后>`
- 需要升级到 A-architect 的事项：`<列表或无>`
