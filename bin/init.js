#!/usr/bin/env node
/**
 * Ultimate Workflow Init Script
 * 
 * 用途: 零配置初始化项目工作流
 * 用法: node bin/init.js [--project-dir <path>] [--mode <fast|standard|strict>]
 */

const fs = require('fs');
const path = require('path');

const WORKFLOW_DIR = '.ultimate-workflow';
const STATE_FILE = `${WORKFLOW_DIR}/STATE.md`;
const CONFIG_FILE = `${WORKFLOW_DIR}/config.yaml`;
const MEMORY_DIR = `${WORKFLOW_DIR}/memory`;
const REQS_DIR = `${WORKFLOW_DIR}/reqs`;

// ANSI 颜色
const c = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[36m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
  reset: '\x1b[0m'
};

function log(msg, color = 'reset') {
  console.log(`${c[color]}${msg}${c.reset}`);
}

function logStep(num, msg) {
  log(`\n[${num}] ${msg}`, 'blue');
}

function logSuccess(msg) {
  log(`  ✅ ${msg}`, 'green');
}

function logSkip(msg) {
  log(`  ⏭️  ${msg}`, 'gray');
}

function logError(msg) {
  log(`  ❌ ${msg}`, 'red');
}

/**
 * 创建目录结构
 */
function createDirectories(projectDir) {
  logStep(1, '创建目录结构');
  
  const dirs = [
    WORKFLOW_DIR,
    MEMORY_DIR,
    REQS_DIR,
    `${WORKFLOW_DIR}/hooks`,
    `${WORKFLOW_DIR}/templates`
  ];
  
  for (const dir of dirs) {
    const fullPath = path.join(projectDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      logSuccess(`创建: ${dir}/`);
    } else {
      logSkip(`已存在: ${dir}/`);
    }
  }
}

/**
 * 创建配置文件
 */
function createConfig(projectDir, mode = 'standard') {
  logStep(2, '创建配置文件');
  
  const config = {
    version: '3.0',
    mode: mode,
    project: {
      name: path.basename(projectDir),
      path: projectDir,
      created: new Date().toISOString()
    },
    defaults: {
      mode: mode,
      tokenBudget: 4000,
      sessionBudget: 30000,
      autoCompress: true,
      compressThreshold: 0.7
    },
    features: {
      dagRouting: true,
      waveParallel: true,
      providerRouting: true,
      learningWorkflow: true,
      canaryDeploy: false,
      designShotgun: false,
      threeLayerReview: true
    },
    tools: {
      gitnexus: {
        required: false,
        fallback: 'grep'
      }
    }
  };
  
  const configPath = path.join(projectDir, CONFIG_FILE);
  fs.writeFileSync(configPath, `# Ultimate Workflow Config
# Mode: ${mode}

${JSON.stringify(config, null, 2)}`);
  
  logSuccess(`创建: ${CONFIG_FILE}`);
}

/**
 * 创建 STATE.md
 */
function createState(projectDir, mode = 'standard') {
  logStep(3, '创建状态文件');
  
  const stateContent = `# Ultimate Workflow State

## 基本信息

当前阶段: 0-confirm
阶段状态: not_started
模式: ${mode.charAt(0).toUpperCase() + mode.slice(1)}
当前Req: (未设置)
当前Task: (未设置)

## 阶段进度

- [ ] Phase 0: 战略评估 (0-confirm)
- [ ] Phase 1: 需求分析 (1-analysis)
- [ ] Phase 2: 方案设计 (2-design)
- [ ] Phase 2a: UI设计 (2a-ui-design)
- [ ] Phase 3: 任务拆分 (3-task)
- [ ] Phase 4: 实施开发 (4-dev)
- [ ] Phase 5: 测试验证 (5-test)
- [ ] Phase 6: 代码审查 (6-review)
- [ ] Phase 7: 集成发布 (7-integration)
- [ ] Phase 8: 知识归档 (8-archive)

## 最近更新

更新时间: ${new Date().toISOString()}
`;

  const statePath = path.join(projectDir, STATE_FILE);
  fs.writeFileSync(statePath, stateContent);
  
  logSuccess(`创建: ${STATE_FILE}`);
}

/**
 * 创建记忆文件
 */
function createMemoryFiles(projectDir) {
  logStep(4, '创建记忆文件');
  
  const memoryFiles = {
    'PROJECT_CONTEXT.md': `# 项目背景

## 基本信息
- 项目名称: (待设置)
- 创建时间: ${new Date().toISOString()}
- 技术栈: (待设置)
- 团队: (待设置)

## 项目描述
(在此添加项目描述)

## 约束条件
- 时间: (待设置)
- 预算: (待设置)
- 技术限制: (待设置)

## 利益相关者
- 负责人: (待设置)
- 产品经理: (待设置)
- 技术负责人: (待设置)
`,

    'DECISIONS.md': `# 架构决策记录 (ADR)

## 记录格式
每条决策包含:
- 日期
- 决策内容
- 背景
- 决策者
- 状态

---

## 示例条目
\`\`\`
## ADR-001: 选择 React 作为前端框架

**日期**: ${new Date().toISOString().split('T')[0]}
**状态**: 已接受

### 背景
需要选择一个前端框架来构建用户界面。

### 决策
选择 React 作为主要前端框架。

### 理由
- 生态成熟
- 社区活跃
- 学习曲线适中
- 组件化开发模式适合团队

### 后果
- 正面: 开发效率提升
- 负面: 需要培训团队
\`\`\`
`,

    'KNOWN_FAILURES.md': `# 已知失败模式

## 记录格式
每条记录包含:
- 问题描述
- 根因分析
- 解决方案
- 预防措施

---

## 示例条目
\`\`\`
## FAIL-001: 数据库连接池耗尽

### 问题
高并发时数据库连接池耗尽，导致服务不可用。

### 根因
连接池大小配置过小，未考虑峰值负载。

### 解决方案
增加连接池大小，添加连接池监控。

### 预防措施
- 添加连接池监控告警
- 压力测试纳入 CI/CD
- 上线前检查连接池配置
\`\`\`
`,

    'LESSONS.md': `# 经验教训

## 记录格式
每条教训包含:
- 时间
- 情境
- 学到的教训
- 应用场景

---

## 示例条目
\`\`\`
## LESSON-001: 自动化测试的重要性

**时间**: ${new Date().toISOString().split('T')[0]}

### 情境
手动测试导致上线延迟，错过了发布时间窗口。

### 学到的教训
自动化测试是持续交付的基础，必须从项目开始就建立。

### 应用场景
- 所有项目必须有 CI/CD
- 测试覆盖率 > 80%
- 回归测试自动化
\`\`\`
`,

    'VERIFICATION_BASELINE.md': `# 验证基线

## 代码质量基线
- 测试覆盖率: >= 80%
- 代码风格: ESLint 通过
- 安全扫描: 无高危漏洞
- 性能基准: (待设置)

## 部署基线
- 构建成功: true
- 单元测试: 通过
- 集成测试: 通过
- E2E测试: 通过
- 安全扫描: 通过
`,

    'TEAM_PREFERENCES.md': `# 团队偏好

## 代码风格
- 缩进: 2空格
- 分号: 否
- 引号: 单引号
- 行长度: 100字符

## 沟通方式
- 日常: Slack
- 文档: Notion
- 代码审查: GitHub PR

## 工作时间
- 时区: Asia/Shanghai
- 核心时间: 10:00-18:00
`,

    'USER_PROFILE.md': `# 用户画像

## 角色定义
- 角色名称: (待设置)
- 技术水平: (待设置)
- 使用频率: (待设置)

## 需求特点
(待设置)

## 痛点
(待设置)

## 目标
(待设置)
`,

    'SESSION_CLOSE_CHECKLIST.md': `# 会话关闭检查清单

## 必做项
- [ ] STATE.md 已更新
- [ ] 所有产物已保存
- [ ] 记忆文件已更新
- [ ] 下一步骤已记录

## 可选项
- [ ] LESSONS.md 已更新
- [ ] 风险已记录
- [ ] 决策已记录

## 状态摘要
(会话结束时填写)
`,

    'CURRENT_STATE.md': `# 当前状态快照

## 会话信息
- 会话ID: (自动生成)
- 开始时间: ${new Date().toISOString()}
- 当前阶段: 0-confirm

## 上下文摘要
(简要记录当前上下文)
`
  };
  
  for (const [filename, content] of Object.entries(memoryFiles)) {
    const filePath = path.join(projectDir, MEMORY_DIR, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content);
      logSuccess(`创建: memory/${filename}`);
    } else {
      logSkip(`已存在: memory/${filename}`);
    }
  }
}

/**
 * 创建 .gitignore
 */
function createGitignore(projectDir) {
  logStep(5, '创建 .gitignore');
  
  const gitignorePath = path.join(projectDir, '.gitignore');
  const gitignoreContent = `# Ultimate Workflow
.ultimate-workflow/

# 环境变量
.env
.env.local
.env.production

# 依赖
node_modules/

# 构建产物
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# 日志
*.log
npm-debug.log*

# 临时文件
*.tmp
*.temp
`;

  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, gitignoreContent);
    logSuccess('创建: .gitignore');
  } else {
    // 追加内容
    const existing = fs.readFileSync(gitignorePath, 'utf8');
    if (!existing.includes('.ultimate-workflow/')) {
      fs.appendFileSync(gitignorePath, '\n# Ultimate Workflow\n.ultimate-workflow/\n');
      logSuccess('追加: .ultimate-workflow/ 到 .gitignore');
    } else {
      logSkip('.gitignore 已包含 .ultimate-workflow/');
    }
  }
}

/**
 * 创建 README
 */
function createReadme(projectDir) {
  logStep(6, '创建项目 README');
  
  const readmePath = path.join(projectDir, 'README.md');
  const readmeContent = `# ${path.basename(projectDir)}

> 使用 Ultimate Workflow v3.0 管理

## 快速开始

\`\`\`bash
# 查看状态
node bin/statusline.js

# 开始新需求
# (在 AI 对话中输入您的需求)

# 继续工作
# (在 AI 对话中输入"继续")
\`\`\`

## 工作流

1. **Phase 0**: 战略评估 - 决定做还是不做
2. **Phase 1**: 需求分析 - 明确要做什么
3. **Phase 2**: 方案设计 - 制定技术方案
4. **Phase 3**: 任务拆分 - 分解为可执行任务
5. **Phase 4**: 实施开发 - 编码实现
6. **Phase 5**: 测试验证 - 确保质量
7. **Phase 6**: 代码审查 - 三层对抗审查
8. **Phase 7**: 集成发布 - Canary 灰度发布
9. **Phase 8**: 知识归档 - 经验沉淀

## 目录结构

\`\`\`
.ultimate-workflow/
├── STATE.md          # 跨会话状态
├── config.yaml       # 配置
├── memory/           # 记忆文件
│   ├── PROJECT_CONTEXT.md
│   ├── DECISIONS.md
│   ├── KNOWN_FAILURES.md
│   └── LESSONS.md
└── reqs/            # 需求目录
    └── <req-id>/
        ├── 00-requirements.md
        ├── 01-analysis.md
        ├── 02-design.md
        └── 03-tasks.md
\`\`\`

## 文档

- [Ultimate Workflow SKILL.md](${path.join(path.dirname(require.main.filename), '..', 'SKILL.md')})
- [架构设计](../V3-ARCHITECTURE.md)
- [路由入口](../GO.md)
`;

  if (!fs.existsSync(readmePath)) {
    fs.writeFileSync(readmePath, readmeContent);
    logSuccess('创建: README.md');
  } else {
    logSkip('README.md 已存在');
  }
}

/**
 * 验证安装
 */
function verifyInstall(projectDir) {
  logStep(7, '验证安装');
  
  const checks = [
    { name: 'WORKFLOW_DIR', path: path.join(projectDir, WORKFLOW_DIR) },
    { name: 'STATE_FILE', path: path.join(projectDir, STATE_FILE) },
    { name: 'CONFIG_FILE', path: path.join(projectDir, CONFIG_FILE) },
    { name: 'MEMORY_DIR', path: path.join(projectDir, MEMORY_DIR) }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    if (fs.existsSync(check.path)) {
      logSuccess(check.name);
    } else {
      logError(`${check.name} - 缺失`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

/**
 * 显示欢迎信息
 */
function showWelcome(projectDir, mode) {
  console.log('\n' + '='.repeat(60));
  log('  Ultimate Workflow v3.0 初始化完成!', 'green');
  console.log('='.repeat(60));
  
  console.log(`
📁 项目目录: ${projectDir}
⚙️  模式: ${mode}

📋 下一步:

1. 启动 AI 对话
2. 输入您的需求
3. 工作流将自动引导您完成

💡 示例:
   "帮我做一个用户登录功能"

📚 文档:
   - SKILL.md: ${path.join(path.dirname(require.main.filename), '..', 'SKILL.md')}
   - GO.md: ${path.join(path.dirname(require.main.filename), '..', 'GO.md')}

🔧 命令:
   - node bin/statusline.js --mini   # 查看状态(单行)
   - node bin/statusline.js          # 查看状态(完整)
   - node hooks/session-start.js     # 会话开始检查
`);
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  
  let projectDir = process.cwd();
  let mode = 'standard';
  
  // 解析参数
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--project-dir' && args[i + 1]) {
      projectDir = args[i + 1];
    }
    if (args[i] === '--mode' && args[i + 1]) {
      mode = args[i + 1].toLowerCase();
    }
    if (args[i] === '--help') {
      console.log(`
Ultimate Workflow Init Script

用法: node bin/init.js [选项]

选项:
  --project-dir <path>    项目目录 (默认: 当前目录)
  --mode <mode>          模式: fast | standard | strict (默认: standard)
  --help                  显示帮助

示例:
  node bin/init.js
  node bin/init.js --mode strict --project-dir /path/to/project
`);
      process.exit(0);
    }
  }
  
  // 验证模式
  if (!['fast', 'standard', 'strict'].includes(mode)) {
    logError(`无效模式: ${mode}`);
    log('有效模式: fast, standard, strict');
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(60));
  log('  Ultimate Workflow v3.0 初始化', 'blue');
  console.log('='.repeat(60));
  console.log(`\n📁 项目目录: ${projectDir}`);
  console.log(`⚙️  模式: ${mode}`);
  
  // 执行初始化步骤
  createDirectories(projectDir);
  createConfig(projectDir, mode);
  createState(projectDir, mode);
  createMemoryFiles(projectDir);
  createGitignore(projectDir);
  createReadme(projectDir);
  
  // 验证
  const valid = verifyInstall(projectDir);
  
  if (valid) {
    showWelcome(projectDir, mode);
  } else {
    logError('初始化完成但有警告，请检查');
    process.exit(1);
  }
  
  return { projectDir, mode, valid };
}

// 执行
main().catch(err => {
  console.error('初始化失败:', err);
  process.exit(1);
});
