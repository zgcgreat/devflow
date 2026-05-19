#!/usr/bin/env node
/**
 * Hook Manager
 * 
 * 用途: 统一管理 Hook 脚本
 * 用法: node bin/hook-manager.js <hook> [args...]
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

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

function logSection(title) {
  console.log(`\n${'='.repeat(60)}`);
  log(`  ${title}`, 'blue');
  console.log('='.repeat(60));
}

// Hook 定义
const HOOKS = {
  'session-start': {
    name: 'Session Start Hook',
    file: 'session-start.js',
    desc: '会话开始时执行',
    checkItems: [
      '检查 .devflow 目录',
      '检查 STATE.md 状态文件',
      '检测外部工具 (gitnexus, git, npm)',
      '加载 Phase 相关规则',
      '读取 LESSONS.md 历史教训'
    ]
  },
  'user-prompt': {
    name: 'User Prompt Hook',
    file: 'user-prompt.js',
    desc: '用户提交提示词前执行',
    checkItems: [
      '检测横向命令 (/status, /grill, etc.)',
      '检查紧急关键词 (emergency, urgent)',
      '检查 Gate 条件门控',
      '检查 Token 使用率',
      '检查敏感文件访问',
      '检查上下文连续性'
    ]
  },
  'statusline': {
    name: 'Statusline Hook',
    file: 'statusline.js',
    desc: '更新状态栏显示',
    checkItems: [
      '读取当前 Phase 状态',
      '显示进度条',
      '显示阶段清单',
      '验证产物文件完整性',
      '显示最近决策/教训'
    ]
  }
};

/**
 * 获取 Hook 目录
 */
function getHookDir() {
  const possiblePaths = [
    path.join(__dirname, '..', 'hooks'),
    path.join(__dirname, '..', '..', 'hooks'),
    '.devflow/hooks'
  ];
  
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  
  return possiblePaths[0]; // 返回第一个作为默认值
}

/**
 * 运行 Hook
 */
function runHook(hookName, projectDir, dryRun = false) {
  const hook = HOOKS[hookName];
  
  if (!hook) {
    log(`未知 Hook: ${hookName}`, 'red');
    log('可用 Hook: ' + Object.keys(HOOKS).join(', '));
    return false;
  }
  
  const hookDir = getHookDir();
  const hookPath = path.join(hookDir, hook.file);
  
  if (!fs.existsSync(hookPath)) {
    log(`Hook 文件不存在: ${hook.file}`, 'red');
    return false;
  }
  
  log(`\n运行 ${hook.name}...`, 'blue');
  log(`Hook 文件: ${hookPath}`, 'gray');
  
  if (dryRun) {
    log('\n🔍 Dry Run 模式 - 不执行', 'yellow');
    return true;
  }
  
  try {
    execSync(`node "${hookPath}" --project-dir "${projectDir}"`, {
      cwd: projectDir,
      stdio: 'inherit'
    });
    return true;
  } catch (e) {
    log(`Hook 执行失败: ${e.message}`, 'red');
    return false;
  }
}

/**
 * 列出所有 Hook
 */
function listHooks() {
  logSection('可用 Hooks');
  
  for (const [name, hook] of Object.entries(HOOKS)) {
    log(`\n📌 ${name}`, 'cyan');
    log(`   名称: ${hook.name}`, 'gray');
    log(`   描述: ${hook.desc}`, 'gray');
    log(`   文件: ${hook.file}`, 'gray');
    log(`   检查项:`, 'gray');
    
    for (const item of hook.checkItems) {
      log(`     • ${item}`, 'gray');
    }
  }
}

/**
 * 显示 Hook 状态
 */
function showHookStatus(projectDir) {
  logSection('Hook 状态检查');
  
  const hookDir = getHookDir();
  log(`\nHook 目录: ${hookDir}`, 'gray');
  
  if (!fs.existsSync(hookDir)) {
    log('Hook 目录不存在', 'yellow');
    log('提示: 从 SKILL 目录链接或复制 hooks/', 'gray');
    return;
  }
  
  for (const [name, hook] of Object.entries(HOOKS)) {
    const hookPath = path.join(hookDir, hook.file);
    const exists = fs.existsSync(hookPath);
    
    if (exists) {
      const stats = fs.statSync(hookPath);
      log(`\n✅ ${name}`, 'green');
      log(`   文件: ${hook.file}`, 'gray');
      log(`   大小: ${stats.size} bytes`, 'gray');
      log(`   修改: ${stats.mtime.toLocaleString()}`, 'gray');
    } else {
      log(`\n❌ ${name}`, 'red');
      log(`   文件: ${hook.file} (缺失)`, 'gray');
    }
  }
}

/**
 * 创建 Hook 链接
 */
function createHookLinks(projectDir, force = false) {
  logSection('创建 Hook 链接');
  
  const skillHookDir = path.join(__dirname, '..', 'hooks');
  const projectHookDir = path.join(projectDir, '.devflow', 'hooks');
  
  // 确保目标目录存在
  if (!fs.existsSync(projectHookDir)) {
    fs.mkdirSync(projectHookDir, { recursive: true });
  }
  
  for (const [name, hook] of Object.entries(HOOKS)) {
    const sourcePath = path.join(skillHookDir, hook.file);
    const targetPath = path.join(projectHookDir, hook.file);
    
    if (!fs.existsSync(sourcePath)) {
      log(`❌ 源文件不存在: ${sourcePath}`, 'red');
      continue;
    }
    
    if (fs.existsSync(targetPath) && !force) {
      log(`⏭️  ${name}: 已存在 (跳过)`, 'gray');
      continue;
    }
    
    // 复制文件（而非链接，因为 Windows 不支持 symlink）
    fs.copyFileSync(sourcePath, targetPath);
    log(`✅ ${name}: 已复制`, 'green');
  }
  
  log('\n💡 如需自动运行 Hooks，请添加到您的 AI 配置中', 'cyan');
}

/**
 * 测试 Hook
 */
function testHook(hookName, projectDir) {
  log(`\n测试 Hook: ${hookName}`, 'blue');
  
  const hook = HOOKS[hookName];
  if (!hook) {
    log(`未知 Hook: ${hookName}`, 'red');
    return false;
  }
  
  const hookDir = getHookDir();
  const hookPath = path.join(hookDir, hook.file);
  
  if (!fs.existsSync(hookPath)) {
    log(`Hook 文件不存在: ${hook.file}`, 'red');
    return false;
  }
  
  try {
    log('执行中...\n', 'gray');
    execSync(`node "${hookPath}" --project-dir "${projectDir}" --dry-run`, {
      cwd: projectDir,
      stdio: 'inherit'
    });
    log('\n✅ 测试通过', 'green');
    return true;
  } catch (e) {
    log(`\n❌ 测试失败: ${e.message}`, 'red');
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
Hook Manager

用法: node bin/hook-manager.js <command> [args...]

命令:
  list                      列出所有 Hook
  status                    显示 Hook 状态
  run <hook>                运行指定 Hook
  test <hook>               测试指定 Hook
  link [--force]            创建 Hook 链接
  check <hook>              显示 Hook 检查项

示例:
  node bin/hook-manager.js list
  node bin/hook-manager.js status
  node bin/hook-manager.js run session-start
  node bin/hook-manager.js test statusline
  node bin/hook-manager.js link --force
`);
    listHooks();
    process.exit(0);
  }
  
  const command = args[0];
  const projectDir = process.cwd();
  
  switch (command) {
    case 'list':
      listHooks();
      break;
    
    case 'status':
      showHookStatus(projectDir);
      break;
    
    case 'run':
      if (!args[1]) {
        log('请指定 Hook 名称', 'red');
        log('可用: ' + Object.keys(HOOKS).join(', '));
        process.exit(1);
      }
      runHook(args[1], projectDir);
      break;
    
    case 'test':
      if (!args[1]) {
        log('请指定 Hook 名称', 'red');
        process.exit(1);
      }
      testHook(args[1], projectDir);
      break;
    
    case 'link':
      const force = args.includes('--force');
      createHookLinks(projectDir, force);
      break;
    
    case 'check':
      if (!args[1]) {
        log('请指定 Hook 名称', 'red');
        process.exit(1);
      }
      const hook = HOOKS[args[1]];
      if (!hook) {
        log(`未知 Hook: ${args[1]}`, 'red');
        process.exit(1);
      }
      logSection(`Hook 检查项: ${args[1]}`);
      for (const item of hook.checkItems) {
        log(`  • ${item}`, 'cyan');
      }
      break;
    
    default:
      log(`未知命令: ${command}`, 'red');
      process.exit(1);
  }
}

main().catch(err => {
  console.error('执行失败:', err);
  process.exit(1);
});
