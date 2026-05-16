# devflow-kit Stage: 1-Analysis（需求分析）

> **阶段定位**：将模糊需求转化为明确的验收标准
> **前置条件**：00-requirements.md 已完成
> **后置产物**：`.devflow-kit/<req-id>/01-analysis.md`

## Skill元信息

```yaml
name: stage-1-analysis
version: 1.0.0
description: devflow-kit工作流第1阶段 - 需求分析与AC拆解
author: devflow-kit
dependencies:
  - executing-plans
```

## 输入

- `.devflow-kit/<req-id>/00-requirements.md`
- `.devflow-kit/CONTEXT.md`
- `.devflow-kit/lessons-learned.md`（如存在）
- `.devflow-kit/requirements-baseline.md`（如存在·Delta模式）

## 输出

- `.devflow-kit/<req-id>/01-analysis.md`（或Delta版）
- 更新 `.devflow-kit/STATE.md`

## 入口门禁

```markdown
IF 缺 00-requirements.md:
  输出: "规则 R2.7 触发：1-analysis 缺少 00-requirements.md。本次先回到 0-confirm 补齐。"
  STOP
```

## 执行流程

### Step 1: 扫描可用前置产物

**⚠️ 强制规则**：必须先扫描所有可能的前置产物，根据实际存在情况决定读取策略。

#### 1.1 扫描主流程产物

| 产物文件 | 存在性 | 优先级 | 提取内容 |
|---|--------|---|----------|
| 00-requirements.md | ✅/❌ | 🔴 必须 | 需求概述、目标用户、核心功能、约束条件、模式判定 |
| CONTEXT.md | ✅/❌ | 🟡 建议 | 技术栈、编码规范、禁动清单 |
| lessons-learned.md | ✅/❌ | 🟡 建议 | AC拆解教训、非功能需求遗漏案例 |
| requirements-baseline.md | ✅/❌ | 🟢 可选 | Delta模式基线（如存在则启用Delta） |
| STATE.md | ✅/❌ | 🟢 可选 | 当前进度、中断任务 |

**扫描结果输出**：
```markdown
✅ 检测到 00-requirements.md → 提取模式判定：Standard
✅ 检测到 CONTEXT.md → 提取技术栈：Vue3 + TypeScript
✅ 检测到 lessons-learned.md → 提取AC相关教训：2条
❌ 未检测到 requirements-baseline.md → 使用完整模式
```

#### 1.2 分级读取策略

**🔴 必须读取**（缺失会阻塞流程）：
- **00-requirements.md**：提供需求基础和模式判定
  - 如果缺失 → 报错并引导回stage-0-confirm

**🟡 建议读取**（缺失采用降级策略）：
- **CONTEXT.md**：提供项目技术背景
  - 如果缺失 → 使用通用技术栈假设，在设计中明确说明
- **lessons-learned.md**：提供历史教训
  - 如果缺失 → 使用通用最佳实践，建议在完成后补充经验

**🟢 可选读取**（补充信息）：
- **requirements-baseline.md**：Delta模式触发
  - 如果存在 → 启用Delta模式
  - 如果缺失 → 使用完整模式
- **STATE.md**：进度跟踪
  - 如果存在 → 从断点续传
  - 如果缺失 → 从头开始

#### 1.3 降级策略

**如果某个产物不存在**：

1. **CONTEXT.md 缺失**：
   ```
   ⚠️ 警告：缺少CONTEXT.md，无法获取项目技术背景
   → 降级方案：在01-需求分析中增加"技术假设"章节
   → 询问用户："是否需要先运行 I-intel-scan 生成上下文？"
   ```

2. **lessons-learned.md 缺失**：
   ```
   ⚠️ 警告：缺少lessons-learned.md，无法参考历史教训
   → 降级方案：使用通用AC拆解最佳实践
   → 提醒：建议在完成后将本次经验追加到lessons-learned.md
   ```

3. **requirements-baseline.md 缺失**：
   ```
   ℹ️ 提示：未检测到requirements-baseline，使用完整模式
   → 如需Delta模式，请先建立requirements-baseline
   ```

#### 1.4 信息提取摘要

**输出格式**：
```markdown
### Step 1 输出：前置信息摘要

**已提取的关键信息**：

1. **需求层面**（来自00-需求确认）：
   - 核心目标：<提取内容>
   - 目标用户：<提取内容>
   - 核心功能：<提取内容>
   - 模式判定：<Fast/Standard/Strict>

2. **技术层面**（来自上下文，如存在）：
   - 技术栈：<提取内容>
   - 编码规范：<提取内容>
   - 禁动清单：<提取内容>

3. **经验层面**（来自lessons-learned，如存在）：
   - 教训1：<提取内容>
   - 教训2：<提取内容>

**下一步**：基于上述信息生成本阶段产物
```

### Step 2: 判断是否Delta模式

**Delta模式触发条件**（必须同时满足）：
- ✅ `.devflow-kit/requirements-baseline.md` 已存在（Step 1.1扫描结果）
- ✅ 本次需求是修改/扩展已有功能，而非全新功能
- ✅ 用户明确说明是增量需求

**输出**：
```markdown
检测到requirements-baseline存在，本次为增量需求 → 启用Delta模式
产物将保存为: 01-analysis-delta.md
```

否则使用完整模式，产物为 `01-analysis.md`。

### Step 3: AC拆解

将每个核心功能拆解为可测试的验收标准（AC）。

**AC格式要求**：
```markdown
**AC-1: <简短描述>**
- Given: <前置条件>
- When: <操作>
- Then: <预期结果>
```

**示例**：
```markdown
**AC-1: 用户能成功发送通知**
- Given: 用户已登录，有未读消息
- When: 用户点击"发送通知"按钮
- Then: 
  - 通知成功创建并保存到数据库
  - 用户收到201 Created响应
  - 通知出现在收件箱列表中
```

**禁止模糊AC**：
- ❌ "用户体验好"
- ❌ "性能优秀"
- ✅ "P95响应时间 < 200ms"
- ✅ "加载状态在100ms内显示"

### Step 4: 非功能需求分析

分析以下维度：

| 维度 | 问题 | 要求 |
|---|------|---|
| 性能 | QPS/响应时间要求？ | P95 < xxx ms |
| 安全 | 鉴权/加密要求？ | JWT + HTTPS |
| 兼容 | 浏览器/设备要求？ | Chrome/Firefox/Safari最新2版 |
| 可访问性 | WCAG等级？ | AA级 |
| 国际化 | 多语言支持？ | 中文/英文 |

### Step 5: 依赖与约束

列出：
- **外部依赖**：第三方API、SDK、服务
- **内部依赖**：需要其他团队配合的模块
- **技术约束**：必须使用的技术栈、禁止使用的技术
- **业务约束**：合规要求、数据隐私限制

### Step 6: 风险识别

识别潜在风险：

| 风险项 | 概率 | 影响 | 缓解措施 |
|---|------|---|---------|
| 第三方API限流 | 中 | 高 | 实现本地缓存降级 |
| 数据迁移失败 | 低 | 高 | 备份+灰度发布 |

### Step 7: Delta模式特殊处理

如果是Delta模式：

1. **读取requirements-baseline**：`.devflow-kit/requirements-baseline.md`
2. **对比差异**：
   - 新增AC：列出本次新增的验收标准
   - 修改AC：列出本次修改的验收标准（标注变更内容）
   - 删除AC：列出本次废弃的验收标准
3. **生成Delta文档**：只写变更部分，引用基线

**Delta文档格式**：
```markdown
# 01-analysis-delta: <req-id>

**基线版本**: <基线req-id>
**变更类型**: 新增 / 修改 / 删除

## 新增AC

**AC-N: <描述>**
- Given: ...
- When: ...
- Then: ...

## 修改AC

**AC-3** (原: <原描述>)
- 变更: <说明变更内容>
- 新内容: ...

## 删除AC

- ~~AC-5: <原描述>~~ （理由: <删除原因>）
```

### Step 8: 完整性自检

**检查是否充分利用了前置产物**：

- ⏳ 是否读取了所有存在的必需产物（00-需求确认）？
- ⏳ 是否从00-需求确认中提取了模式判定结果？
- ⏳ 是否参考了CONTEXT.md中的技术约束（如存在）？
- ⏳ 是否参考了lessons-learned.md中的AC相关教训（如存在）？
- ⏳ 对于缺失的产物，是否采用了合理的降级策略？
- ⏳ AC拆解是否符合模式判定的粒度要求？
  - Fast：粗粒度AC（3-5个）
  - Standard：中等粒度AC（5-8个）
  - Strict：细粒度AC（8-12个）

**如果发现遗漏**：
→ 回到Step 1重新读取
→ 或在本阶段产物中注明"因缺少XX产物，采用YY假设"

### Step 9: 读取模板并提取段落清单

**⚠️ 强制规则**：必须使用 `read_file` 工具读取模板文件。

```python
# 伪代码示例
read_file("templates/01-analysis.md")
```

**从模板中提取必填段落清单**（模板 L13-22）：
```
□ 用户故事
□ 验收准则（AC）
□ 范围切分（v1/v2/out）
□ 非功能性需求
□ 术语表
□ 依赖与风险
□ 阶段完成声明
```

**注意**：
- 所有7个段落都必须包含，不得省略
- "术语表"即使只有1-2个术语也必须保留
- "阶段完成声明"必须包含完成总结和下一阶段指引

### Step 10: 生成产物并逐项核对

按模板生成 `.devflow-kit/<req-id>/01-analysis.md`（或Delta版）：
- **必须包含模板所有7个段落**（见 Step 9 提取的清单）
- **所有 `<...>` 占位符必须替换为实际值**
- **AC列表必须完整**（编号连续，Given/When/Then结构）

**生成后核对**：
```markdown
产物核对清单：
- ⏳ 用户故事 → 已包含（X条US）
- ⏳ 验收准则（AC） → 已包含（X条AC，Given/When/Then格式）
- ⏳ 范围切分（v1/v2/out） → 已包含
- ⏳ 非功能性需求 → 已包含（X个维度）
- ⏳ 术语表 → 已包含（X个术语）
- ⏳ 依赖与假设 → 已包含
- ⏳ 阶段完成声明 → 已包含
```

**如果有缺失**：立即补齐，不得进入下一步。

### Step 11: 更新项目状态

```markdown
当前阶段: analysis
阶段状态: completed
上次完成阶段: analysis
下一阶段: design
```

## 自检清单

- ⏳ **已使用 read_file 读取模板文件** `templates/01-analysis.md`
- ⏳ **已从模板提取必填段落清单**（7个段落）
- ⏳ **已读取所有前置产物**（00-需求确认 + 上下文 + lessons-learned）
- ⏳ **已提取模式判定结果**（影响AC拆解粒度）
- ⏳ **已识别技术约束**（从CONTEXT.md）
- ⏳ **已提取AC相关经验**（从lessons-learned.md）
- ⏳ 每个AC都有Given/When/Then结构
- ⏳ AC描述明确、可测试（无模糊词）
- ⏳ AC编号连续
- ⏳ **产物包含模板所有7个段落**（见 Step 10 核对清单）
- ⏳ **所有占位符已替换**
- ⏳ **生成后已逐项核对**（无缺失段落）
- ⏳ 非功能需求已分析（性能/安全/兼容等）
- ⏳ 依赖与约束已列出
- ⏳ 至少识别2个风险
- ⏳ Delta模式下正确对比基线
- ⏳ STATE.md已更新

## 约束

- **禁止**AC描述模糊（如"体验好"、"性能优"）
- **禁止**跳过非功能需求分析
- **必须**每个AC都可独立测试
- Delta模式**必须**对比基线，不能凭空生成

## 触发下一步

加载 `skills/stage-skills/stage-2-design/_SKILL.md`

## 错误处理

- AC过于模糊 → 反问用户澄清成功标准
- 缺少关键信息 → 回到0-confirm补充
- Delta模式但无基线 → 提示先建立基线或改用完整模式

