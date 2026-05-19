# 插件系统规范

> **来源**: unified-platform  
> **集成位置**: `.devflow/plugins/`  
> **核心价值**: 可扩展Phase、Gate、Agent、Template、Command，沙箱隔离，签名验证

---

## 🎯 核心概念

### 插件类型

| 类型 | 用途 | 示例 |
|------|------|------|
| **Phase扩展** | 添加新Phase | Phase 9: 用户反馈收集 |
| **Gate增强** | 增强质量门控 | Gate 6: 安全审计 |
| **Agent扩展** | 添加新角色 | Accessibility-Auditor |
| **Template包** | 添加新模板 | GraphQL API模板 |
| **Command工具** | 添加新命令 | /deploy, /monitor |

### 插件结构

```
plugins/<plugin-name>/
├── plugin.json              # 插件元数据（必需）
├── README.md                # 使用说明
├── SKILL.md                 # 插件技能定义
├── hooks/                   # 钩子脚本（可选）
│   ├── pre-phase-9.js
│   └── post-gate-6.js
├── templates/               # 模板文件（可选）
│   └── graphql-api.md
├── commands/                # 命令脚本（可选）
│   └── deploy.js
└── tests/                   # 测试文件（可选）
    └── plugin.test.js
```

---

## 📋 plugin.json标准

```json
{
  "name": "custom-phase-9",
  "version": "1.0.0",
  "description": "添加Phase 9: 用户反馈收集与分析",
  "type": "phase-extension",
  "author": {
    "name": "张三",
    "email": "zhangsan@example.com",
    "url": "https://github.com/zhangsan"
  },
  "extends": {
    "phase": 9,
    "insert_after": 8,
    "dependencies": ["phase-8"]
  },
  "permissions": {
    "read_files": ["*.md", ".devflow/state.md"],
    "write_files": [".devflow/plugins/custom-phase-9/output/*"],
    "execute_commands": ["npm test", "git log"],
    "network_access": false
  },
  "config_schema": {
    "feedback_channels": {
      "type": "array",
      "items": {"type": "string"},
      "default": ["email", "in-app"],
      "description": "反馈收集渠道"
    },
    "analysis_depth": {
      "type": "string",
      "enum": ["basic", "detailed", "comprehensive"],
      "default": "detailed",
      "description": "分析深度"
    }
  },
  "keywords": ["feedback", "user-research", "analytics"],
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/zhangsan/custom-phase-9"
  },
  "signature": "sha256:abc123...",
  "created_at": "2026-05-17T10:00:00Z",
  "updated_at": "2026-05-17T14:30:00Z"
}
```

---

## 🔧 插件生命周期

### 1. 发现 (Discovery)

**本地插件目录**: `.devflow/plugins/`

**远程插件市场**（未来）:
```bash
/unified plugins search "feedback"
/unified plugins browse --category phase-extension
```

### 2. 安装 (Installation)

**从本地安装**:
```bash
/unified plugins install ./path/to/plugin
```

**从Git安装**:
```bash
/unified plugins install git+https://github.com/user/plugin.git
```

**执行流程**:
1. 验证 `plugin.json` 格式
2. 检查权限声明合理性
3. 验证签名（如有）
4. 复制到 `.devflow/plugins/<plugin-name>/`
5. 注册到插件索引
6. 加载插件配置

**输出**:
```markdown
## ✅ 插件安装成功

**插件名称**: custom-phase-9  
**版本**: 1.0.0  
**类型**: Phase扩展  
**作者**: 张三  

**已安装文件**:
- ✅ `plugin.json`
- ✅ `SKILL.md`
- ✅ `hooks/pre-phase-9.js`
- ✅ `templates/feedback-form.md`

**权限授予**:
- ✅ 读取: *.md, state.md
- ✅ 写入: plugins/custom-phase-9/output/*
- ✅ 执行: npm test, git log
- ❌ 网络访问: 禁止

**下一步**: 
- `/unified plugins enable custom-phase-9` 启用插件
- 或重启会话自动加载
```

### 3. 启用/禁用 (Enable/Disable)

**启用插件**:
```bash
/unified plugins enable custom-phase-9
```

**禁用插件**:
```bash
/unified plugins disable custom-phase-9
```

**查看已启用插件**:
```bash
/unified plugins list --enabled
```

**输出**:
```markdown
## 已启用插件列表

| 插件名 | 类型 | 版本 | 状态 |
|--------|------|------|------|
| custom-phase-9 | Phase扩展 | 1.0.0 | 🟢 Active |
| security-gate | Gate增强 | 0.9.0 | 🟢 Active |
| accessibility-agent | Agent扩展 | 1.2.0 | 🟡 Warning |

**总计**: 3个插件 (2正常, 1警告)

**警告详情**:
- accessibility-agent: 需要更新到v1.3.0以兼容最新API
```

### 4. 更新 (Update)

**检查更新**:
```bash
/unified plugins check-updates
```

**更新插件**:
```bash
/unified plugins update custom-phase-9
```

**自动更新配置**:
```yaml
# .devflow/config.yaml
plugins:
  auto_update: true
  update_frequency: "weekly"  # daily | weekly | monthly
  backup_before_update: true
```

### 5. 卸载 (Uninstall)

```bash
/unified plugins uninstall custom-phase-9
```

**执行流程**:
1. 禁用插件
2. 备份插件数据（可选）
3. 删除插件文件
4. 从插件索引移除
5. 清理钩子注册

---

## 🔒 沙箱隔离机制

### 权限模型

**最小权限原则**: 插件只能访问声明的资源

**权限类型**:
```json
{
  "permissions": {
    "read_files": ["*.md"],           // 读取文件通配符
    "write_files": ["output/*"],       // 写入文件路径
    "execute_commands": ["npm test"],  // 允许执行的命令
    "network_access": false,           // 是否允许网络访问
    "env_vars": ["NODE_ENV"],          // 可访问的环境变量
    "max_execution_time": 300          // 最大执行时间（秒）
  }
}
```

### 沙箱实现

**文件系统隔离**:
- 插件只能访问白名单路径
- 写入操作限制在 `plugins/<name>/output/`
- 禁止访问父目录 (`../`)

**命令执行隔离**:
- 仅允许白名单命令
- 超时自动终止
- 资源限制（CPU/内存）

**网络隔离**:
- 默认禁止网络访问
- 如需访问，需显式声明并用户确认

---

## ✍️ 签名验证

### 生成签名

**开发者工具**:
```bash
/unified plugins sign ./my-plugin --private-key ~/.keys/private.pem
```

**签名内容**:
- plugin.json 哈希
- 所有源文件哈希
- 时间戳

### 验证签名

**安装时自动验证**:
```bash
/unified plugins install ./plugin --verify-signature
```

**验证失败处理**:
```markdown
## ❌ 签名验证失败

**插件**: custom-phase-9  
**原因**: 签名不匹配，文件可能被篡改  

**建议**:
1. 从官方渠道重新下载
2. 联系插件作者确认
3. 使用 `--skip-verification` 跳过（不安全）
```

---

## 📝 审核流程

### 官方插件市场审核

**提交插件**:
```bash
/unified plugins submit ./my-plugin
```

**审核步骤**:
1. **自动化检查**:
   - 格式验证
   - 安全检查（恶意代码扫描）
   - 依赖冲突检测

2. **人工审核**:
   - 功能合理性
   - 文档完整性
   - 用户体验

3. **测试验证**:
   - 单元测试通过
   - 集成测试通过
   - 性能测试达标

4. **发布**:
   - 添加到插件市场
   - 通知订阅用户
   - 更新索引

### 审核标准

| 检查项 | 要求 |
|--------|------|
| 代码质量 | ESLint无错误，测试覆盖率≥80% |
| 安全性 | 无已知漏洞，权限声明合理 |
| 文档 | README完整，使用示例清晰 |
| 兼容性 | 支持v3.0+ API |
| 性能 | 加载时间<1s，内存占用<50MB |

---

## 🔌 插件开发指南

### 创建Phase扩展插件

**步骤1: 初始化插件**
```bash
/unified plugins create my-phase --type phase-extension
```

**步骤2: 编写plugin.json**
```json
{
  "name": "my-phase",
  "version": "1.0.0",
  "type": "phase-extension",
  "extends": {
    "phase": 9,
    "insert_after": 8
  }
}
```

**步骤3: 编写SKILL.md**
```markdown
# Phase 9: 用户反馈收集

## 触发条件
- Phase 8完成后自动触发
- 或手动 `/phase 9`

## 执行流程
1. 收集用户反馈（邮件/应用内）
2. 分类整理（功能请求/Bug报告/改进建议）
3. 优先级排序
4. 生成反馈报告

## 输出
- `.devflow/plugins/my-phase/feedback-report.md`
```

**步骤4: 添加钩子（可选）**
```javascript
// hooks/pre-phase-9.js
module.exports = async function(context) {
  console.log('准备收集用户反馈...');
  // 预处理逻辑
};
```

**步骤5: 测试插件**
```bash
/unified plugins test ./my-phase
```

**步骤6: 打包发布**
```bash
/unified plugins package ./my-phase
/unified plugins publish ./my-phase-v1.0.0.zip
```

---

## 📊 插件监控

### 性能监控

**指标**:
- 加载时间
- 内存占用
- CPU使用率
- 执行次数

**命令**:
```bash
/unified plugins monitor
```

**输出**:
```markdown
## 插件性能监控

| 插件 | 加载时间 | 内存 | CPU | 调用次数 |
|------|---------|------|-----|---------|
| custom-phase-9 | 0.3s | 12MB | 2% | 15 |
| security-gate | 0.5s | 18MB | 5% | 23 |
| accessibility-agent | 0.8s | 25MB | 8% | 8 |

**总资源占用**: 55MB内存, 15% CPU
```

### 错误日志

**查看日志**:
```bash
/unified plugins logs custom-phase-9 --tail 50
```

**错误追踪**:
```markdown
## 插件错误日志

**插件**: custom-phase-9  
**时间**: 2026-05-17T14:30:00Z  
**错误**: TypeError: Cannot read property 'feedback' of undefined  
**堆栈**: 
  at collectFeedback (SKILL.md:45)
  at executePhase (engine.js:123)

**建议**: 检查输入数据结构是否正确
```

---

## 🎯 最佳实践

### 1. 插件设计原则

- **单一职责**: 一个插件只做一件事
- **最小权限**: 只申请必要的权限
- **向后兼容**: 避免破坏性变更
- **良好文档**: README + 示例 + API文档
- **充分测试**: 单元测试 + 集成测试

### 2. 权限管理

- 明确声明所有需要的权限
- 解释为什么需要这些权限
- 提供降级方案（权限被拒绝时）

### 3. 错误处理

- 捕获所有异常
- 提供清晰的错误消息
- 记录详细日志
- 优雅降级

### 4. 性能优化

- 懒加载非必要模块
- 缓存频繁访问的数据
- 避免阻塞主线程
- 定期清理临时文件

---

## 🔗 参考文件

- `docs/PLUGIN-SYSTEM.md` (详细规范)
- `templates/plugin-template/` (插件模板)
- `examples/` (示例插件)
