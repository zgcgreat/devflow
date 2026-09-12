#!/usr/bin/env node
/**
 * DevFlow Installer — 安装到 WorkBuddy / Cursor / Claude Code
 *
 * 安装方式:
 *   方式 A (推荐): node harnesses/install.js
 *   方式 B: npm install -g devflow && devflow install
 *
 * WorkBuddy 安装路径: ~/.workbuddy/skills/devflow/
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const DEVFLOW_ROOT = path.resolve(__dirname, '..');
const HOME = os.homedir();
const WB_TARGET = path.join(HOME, '.workbuddy', 'skills', 'devflow');

// 需要复制到 WorkBuddy 的核心文件和目录
const TARGETS = {
  workbuddy: {
    label: 'WorkBuddy',
    dir: () => WB_TARGET,
    install: (targetDir) => {
      fs.mkdirSync(targetDir, { recursive: true });
      fs.mkdirSync(path.join(targetDir, 'domains', 'code-intel'), { recursive: true });
      fs.mkdirSync(path.join(targetDir, 'domains', 'execution'), { recursive: true });
      fs.mkdirSync(path.join(targetDir, 'domains', 'expertise'), { recursive: true });
      fs.mkdirSync(path.join(targetDir, 'domains', 'hooks'), { recursive: true });
      fs.mkdirSync(path.join(targetDir, 'domains', 'memory'), { recursive: true });
      fs.mkdirSync(path.join(targetDir, 'domains', 'specification', 'templates'), { recursive: true });

      const cmds = [];

      // 核心入口文件
      cmds.push(`cp "${path.join(DEVFLOW_ROOT, 'SKILL.md')}" "${path.join(targetDir, 'SKILL.md')}"`);
      cmds.push(`cp "${path.join(DEVFLOW_ROOT, 'CONSTITUTION.md')}" "${path.join(targetDir, 'CONSTITUTION.md')}"`);
      cmds.push(`cp "${path.join(DEVFLOW_ROOT, 'GO.md')}" "${path.join(targetDir, 'GO.md')}"`);

      // 6 个域的 _SKILL.md
      for (const d of ['code-intel', 'execution', 'expertise', 'hooks', 'memory', 'specification']) {
        cmds.push(`cp "${path.join(DEVFLOW_ROOT, 'domains', d, '_SKILL.md')}" "${path.join(targetDir, 'domains', d, '_SKILL.md')}"`);
      }

      // 域特有文件
      cmds.push(`cp -r "${path.join(DEVFLOW_ROOT, 'domains', 'code-intel', 'code-explorer.js')}" "${path.join(targetDir, 'domains', 'code-intel', 'code-explorer.js')}"`);
      cmds.push(`cp -r "${path.join(DEVFLOW_ROOT, 'domains', 'expertise', 'party-mode.md')}" "${path.join(targetDir, 'domains', 'expertise', 'party-mode.md')}"`);
      cmds.push(`cp -r "${path.join(DEVFLOW_ROOT, 'domains', 'memory', 'caveman.js')}" "${path.join(targetDir, 'domains', 'memory', 'caveman.js')}"`);
      for (const h of ['gate-check.js', 'context-rot-monitor.js', 'token-monitor.js']) {
        cmds.push(`cp "${path.join(DEVFLOW_ROOT, 'domains', 'hooks', h)}" "${path.join(targetDir, 'domains', 'hooks', h)}"`);
      }
      for (const t of ['00-strategy.md', '01-analysis.md', '02-design.md', '06-review.md']) {
        cmds.push(`cp "${path.join(DEVFLOW_ROOT, 'domains', 'specification', 'templates', t)}" "${path.join(targetDir, 'domains', 'specification', 'templates', t)}"`);
      }

      return cmds;
    },
    uninstall: () => {
      return [`rm -rf "${WB_TARGET}"`];
    },
  },
};

const HELP = `DevFlow 安装器

用法:
  node harnesses/install.js             安装到 WorkBuddy (默认)
  node harnesses/install.js --uninstall 卸载
  node harnesses/install.js --list      列出安装目标
  node harnesses/install.js --status    检查状态

安装后:
  1. 打开 WorkBuddy → 重新加载技能
  2. 在任意对话中说 "Use devflow" 即可启动
`;

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { list: false, uninstall: false, status: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--list') opts.list = true;
    else if (args[i] === '--uninstall') opts.uninstall = true;
    else if (args[i] === '--status') opts.status = true;
  }
  return opts;
}

function main() {
  const opts = parseArgs();
  const target = TARGETS.workbuddy;

  if (opts.list) {
    const exists = fs.existsSync(target.dir());
    console.log(`DevFlow ${exists ? '已安装' : '未安装'} 到 ${target.dir()}`);
    return;
  }

  if (opts.status) {
    const exists = fs.existsSync(target.dir());
    if (!exists) { console.log('未安装'); return; }
    const files = fs.readdirSync(target.dir());
    console.log(`已安装到 ${target.dir()}`);
    console.log(`文件数: ${files.length}`);
    return;
  }

  if (opts.uninstall) {
    console.log('卸载 DevFlow...');
    target.uninstall().forEach(cmd => execSync(cmd, { stdio: 'inherit' }));
    console.log('已卸载。重新加载 WorkBuddy 技能即可。');
    return;
  }

  const targetDir = target.dir();
  console.log(`安装 DevFlow 到 WorkBuddy...`);
  console.log(`目标: ${targetDir}\n`);

  const cmds = target.install(targetDir);
  cmds.forEach(cmd => {
    console.log(cmd);
    execSync(cmd, { stdio: 'inherit', cwd: DEVFLOW_ROOT });
  });

  console.log(`\n✅ 安装完成`);
  console.log(`\n现在可以: `);
  console.log(`  1. 打开 WorkBuddy`);
  console.log(`  2. 在左侧技能列表中重新加载 (或重启)`);
  console.log(`  3. 在任意对话中说 "Use devflow" 启动`);
  console.log(`\n  或使用 CLI (已安装 npm 包):`);
  console.log(`  devflow init --mode standard`);
  console.log(`  devflow status`);
}

main();
