---
name: manage-memory
description: 管理 DevFlow Kit 的记忆系统。用于初始化、更新、验证和清理 .superpowers-memory/ 目录中的记忆文件。
---

# Manage DevFlow Memory

管理项目的跨会话记忆系统，确保AI能够持续学习和保持上下文。

## 触发场景

- "初始化记忆系统"
- "更新项目记忆"
- "验证记忆质量"
- "清理会话记忆"
- "Use superpowers-learning workflow"
- "运行记忆收尾检查"

## 执行流程

### Step 1: 检测记忆系统状态

```markdown
🔍 检测记忆系统状态

检查项:
- [ ] .superpowers-memory/ 目录是否存在?
- [ ] PROJECT_CONTEXT.md 是否存在?
- [ ] CURRENT_STATE.md 是否存在?
- [ ] DECISIONS.md 是否存在?
- [ ] KNOWN_FAILURES.md 是否存在?
- [ ] session-journal/ 目录是否存在?
```

**如果不存在**:
```markdown
⚠️ 记忆系统未初始化

是否要初始化记忆系统? [Y/n]

初始化将创建:
- .superpowers-memory/
  ├── PROJECT_CONTEXT.md (项目背景)
  ├── CURRENT_STATE.md (当前状态)
  ├── DECISIONS.md (技术决策)
  ├── KNOWN_FAILURES.md (失败模式)
  ├── VERIFICATION_BASELINE.md (验证基线)
  ├── TEAM_PREFERENCES.md (团队偏好)
  ├── USER_PROFILE.md (用户画像)
  ├── AGENT_NOTES.md (AI笔记)
  └── session-journal/ (会话日志)
```

---

### Step 2: 根据用户意图执行操作

#### 场景A: 初始化记忆系统

**用户**: "初始化记忆系统"

**AI执行**:

```markdown
🚀 初始化记忆系统...

步骤1: 创建目录结构
- ✅ .superpowers-memory/
- ✅ .superpowers-memory/session-journal/

步骤2: 生成模板文件
- ✅ PROJECT_CONTEXT.md (项目背景)
- ✅ CURRENT_STATE.md (当前状态)
- ✅ DECISIONS.md (技术决策)
- ✅ KNOWN_FAILURES.md (已知失败模式)
- ✅ VERIFICATION_BASELINE.md (验证基线)
- ✅ TEAM_PREFERENCES.md (团队偏好)
- ✅ USER_PROFILE.md (用户画像)
- ✅ AGENT_NOTES.md (AI助手笔记)

步骤3: 自动填充项目信息

正在分析项目...
📊 提取的信息:

PROJECT_CONTEXT.md 已自动填充:

# Project Context

## 项目基本信息
- **项目名称**: <从package.json/pom.xml等提取>
- **项目类型**: <前端/后端/全栈>
- **检测到时间**: <当前日期>

## 技术栈
- <自动识别的框架和依赖>

## 项目结构
- <扫描的目录结构>

## 既有抽象
- <识别的既有封装>

✅ 记忆系统初始化完成!

💡 提示:
- 你可以编辑 .superpowers-memory/PROJECT_CONTEXT.md 补充更多信息
- 每次会话结束时，说 "Use superpowers-learning workflow" 更新记忆
```

---

#### 场景B: 更新记忆 (会话收尾)

**用户**: "Use superpowers-learning workflow" 或 "更新项目记忆"

**AI执行**:

```markdown
🧠 记忆系统收尾检查

检查项:
- [x] 是否有持久化事实变化? 
      → 是: <列出变化>
- [x] 当前工作状态是否变化?
      → 是: <描述变化>
- [x] 是否有重要决策?
      → 是: <列出决策>
- [x] 是否发现失败模式?
      → 是: <列出失败模式>
- [x] 是否有可复用经验?
      → 是: <列出经验>

---

正在更新记忆...

✅ 已更新:
- CURRENT_STATE.md: "<更新内容>"
- DECISIONS.md: "<新决策>"
- KNOWN_FAILURES.md: "<新失败模式>"
- session-journal/<date>-<topic>.md: 会话摘要

✅ 记忆更新完成

下次会话时，AI会自动读取这些记忆，避免重复沟通。
```

**具体操作**:

1. **读取当前会话的工作内容**
   - 分析了哪些文件?
   - 做了哪些修改?
   - 遇到了什么问题?
   - 做出了哪些决策?

2. **判断是否需要更新记忆**

   **应该更新的情况**:
   - ✅ 完成了重要功能
   - ✅ 改变了技术选型
   - ✅ 发现了系统性问题
   - ✅ 做出了架构决策
   - ✅ 学到了新的最佳实践

   **不应更新的情况**:
   - ❌ 修复typo或小bug
   - ❌ 临时实验性代码
   - ❌ 未经验证的假设
   - ❌ 会话中间状态

3. **更新对应文件**

   **CURRENT_STATE.md**:
   ```markdown
   **最后更新**: <日期>
   
   ## 当前焦点
   <正在进行的工作>
   
   ## 最近完成
   - ✅ <已完成的功能>
   
   ## 待解决问题
   - <待解决的问题>
   
   ## 下一步
   - <计划的工作>
   ```

   **DECISIONS.md**:
   ```markdown
   ## <日期>: <决策标题>
   
   **背景**: <为什么需要做这个决策>
   
   **选项**:
   - 选项A: <描述>
   - 选项B: <描述>
   
   **决策**: <最终选择>
   
   **理由**: <为什么选这个>
   
   **影响**: <对后续工作的影响>
   ```

   **KNOWN_FAILURES.md**:
   ```markdown
   ## <日期>: <失败模式标题>
   
   **现象**: <出现了什么问题>
   
   **根因**: <根本原因是什么>
   
   **解决方案**: <如何解决的>
   
   **预防措施**: <如何避免再次发生>
   
   **适用场景**: <在什么情况下可能发生>
   ```

4. **创建session-journal条目**

   ```markdown
   # Session Journal: <日期> - <主题>
   
   **会话时长**: <开始时间> - <结束时间>
   
   **工作内容**:
   - <任务1>
   - <任务2>
   
   **关键决策**:
   - <决策1>
   - <决策2>
   
   **遇到的问题**:
   - <问题1> → <解决方案>
   
   **学到的经验**:
   - <经验1>
   
   **下一步行动**:
   - <行动1>
   ```

---

#### 场景C: 验证记忆质量

**用户**: "验证记忆质量"

**AI执行**:

```markdown
🔍 验证记忆质量

检查项:

1. **完整性检查**
   - [x] PROJECT_CONTEXT.md 是否有内容?
   - [x] CURRENT_STATE.md 是否最新?
   - [x] DECISIONS.md 是否有记录?
   - [x] KNOWN_FAILURES.md 是否有内容?

2. **一致性检查**
   - [x] CURRENT_STATE.md 的日期是否合理?
   - [x] DECISIONS.md 的格式是否统一?
   - [x] KNOWN_FAILURES.md 是否有解决方案?

3. **实用性检查**
   - [x] PROJECT_CONTEXT.md 是否包含足够的技术背景?
   - [x] CURRENT_STATE.md 是否能帮助恢复工作?
   - [x] KNOWN_FAILURES.md 是否能避免重复踩坑?

---

✅ 验证结果:

**评分**: <X>/10

**优点**:
- <优点1>
- <优点2>

**改进建议**:
- <建议1>
- <建议2>

需要我帮你优化记忆吗? [Y/n]
```

---

#### 场景D: 清理过期记忆

**用户**: "清理过期记忆"

**AI执行**:

```markdown
🗑️ 清理过期记忆

分析记忆文件...

**PROJECT_CONTEXT.md**:
- 状态: ✅ 稳定，无需清理

**CURRENT_STATE.md**:
- 状态: ⚠️ 有过时的任务状态
- 建议: 更新为当前实际状态

**DECISIONS.md**:
- 状态: ✅ 所有决策仍然有效

**KNOWN_FAILURES.md**:
- 状态: ✅ 所有失败模式仍然相关

**session-journal/**:
- 状态: ⚠️ 有15个旧会话日志
- 建议: 保留最近10个，归档更早的

---

建议操作:
1. 更新 CURRENT_STATE.md
2. 归档旧的 session-journal (保留最近10个)

执行清理? [Y/n]
```

---

### Step 3: 输出总结

```markdown
✅ 记忆管理完成

当前状态:
- 记忆文件: <数量>个
- 会话日志: <数量>条
- 最后更新: <日期>

下次会话时，AI会自动读取这些记忆。

💡 提示:
- 每完成一个重要功能后，运行 "Use superpowers-learning workflow"
- 定期(每月)运行 "验证记忆质量" 确保记忆有效性
- 项目重大变更时，更新 PROJECT_CONTEXT.md
```

---

## 记忆文件详解

### PROJECT_CONTEXT.md (项目背景)
**用途**: 存储稳定的项目事实，很少变化  
**更新频率**: 每月或重大变更时  
**内容**: 技术栈、架构、编码规范、禁动清单

### CURRENT_STATE.md (当前状态)
**用途**: 跟踪当前工作状态，动态变化  
**更新频率**: 每次会话结束时  
**内容**: 当前焦点、最近完成、待解决问题、下一步

### DECISIONS.md (技术决策)
**用途**: 记录重要技术决策(ADR风格)  
**更新频率**: 做出重要决策时  
**内容**: 决策背景、选项、最终选择、理由、影响

### KNOWN_FAILURES.md (已知失败模式)
**用途**: 避免重复踩坑  
**更新频率**: 发现失败模式时  
**内容**: 现象、根因、解决方案、预防措施

### VERIFICATION_BASELINE.md (验证基线)
**用途**: 记录验证标准和基线  
**更新频率**: 建立新验证标准时  
**内容**: 性能指标、测试覆盖率、安全要求

### TEAM_PREFERENCES.md (团队偏好)
**用途**: 团队偏好和约定  
**更新频率**: 团队达成共识时  
**内容**: UI偏好、命名约定、工作流程

### USER_PROFILE.md (用户画像)
**用途**: 用户个人偏好  
**更新频率**: 用户提供反馈时  
**内容**: 沟通风格、工具偏好、学习进度

### AGENT_NOTES.md (AI助手笔记)
**用途**: AI助手的观察和建议  
**更新频率**: AI发现模式时  
**内容**: 代码模式、潜在问题、优化建议

### session-journal/
**用途**: 每次会话的详细记录  
**更新频率**: 每次会话结束时  
**内容**: 工作内容、决策、问题、经验、下一步

---

## 最佳实践

### 何时更新记忆?

✅ **应该更新**:
- 完成了重要功能(登录、支付、搜索)
- 改变了技术选型(换数据库、换UI框架)
- 发现了系统性问题(性能瓶颈、安全漏洞)
- 做出了架构决策(微服务拆分、缓存策略)
- 学到了新的最佳实践

❌ **不应更新**:
- 修复typo或小bug
- 临时实验性代码
- 未经验证的假设
- 会话中间状态

### 记忆 vs 产物

| 维度 | 记忆 (.superpowers-memory/) | 产物 (.specs/<req-id>/) |
|---|---------------------------|---|
| **作用域** | 整个项目生命周期 | 单个需求/功能 |
| **持久性** | 长期保留,跨会话有效 | 需求完成后归档 |
| **更新频率** | 低频(重要变化时) | 高频(每个阶段) |
| **内容类型** | 事实、决策、教训 | 需求、设计、代码 |
| **读者** | 所有后续会话的AI | 当前需求的开发者 |

### 维护建议

1. **每次会话结束**: 运行 "Use superpowers-learning workflow"
2. **每周**: 检查 CURRENT_STATE.md 是否准确
3. **每月**: 运行 "验证记忆质量"
4. **每季度**: 清理过期的 session-journal
5. **项目重大变更**: 更新 PROJECT_CONTEXT.md

---

## 常见问题

### Q1: 记忆系统会影响性能吗?

**A**: 不会。记忆文件很小(<1MB)，AI只在会话开始时读取必要的文件。

### Q2: 记忆太多会混乱吗?

**A**: 不会。每个文件有明确的职责，AI会根据需要读取相关文件。

### Q3: 可以不使用记忆系统吗?

**A**: 可以。记忆系统是可选的，但强烈建议使用，它能显著提升AI的理解能力。

### Q4: 记忆会被共享到其他项目吗?

**A**: 不会。记忆存储在项目的 `.superpowers-memory/` 目录中，只在当前项目内有效。

### Q5: 如何备份记忆?

**A**: 直接复制 `.superpowers-memory/` 目录即可。建议纳入Git版本控制(但不包括session-journal/)。

---

## 与其他Skill的关系

- **install-devflow**: 安装DevFlow Kit时可选择启用记忆系统
- **stage-7-integration**: 集成阶段会触发记忆更新
- **brainstorming**: 设计澄清时会参考 PROJECT_CONTEXT.md
- **systematic-debugging**: 调试时会查询 KNOWN_FAILURES.md

---

**记忆系统是DevFlow Kit的核心价值之一，它让AI真正"记住"你的项目！** 🧠✨
