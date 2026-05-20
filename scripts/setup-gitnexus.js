#!/usr/bin/env node
/**
 * GitNexus 安装检测 + 友好引导脚本
 *
 * 用法: node scripts/setup-gitnexus.js [--check] [--install]
 *   --check   仅检测，不提示安装
 *   --install 强制安装（跳过确认）
 */

const { execSync } = require('child_process');
const { checkInstallation, checkIndex, getFallbackInfo, getInstallGuide, MIN_VERSION } = require('../layers/L3-ARCHITECTURE/gitnexus-bridge/gitnexus-check');

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const forceInstall = args.includes('--install');

// ─── 彩色输出 ───
const c = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`
};

function main() {
  console.log(`\n${c.bold('devflow GitNexus 环境检测')}`);
  console.log(c.dim('─'.repeat(40)));

  // Step 1: 检测安装
  const status = checkInstallation();

  if (status.installed) {
    console.log(c.green('  ✓ GitNexus 已安装'));
    console.log(`    版本: ${c.cyan(status.version)}`);
    console.log(`    路径: ${c.dim(status.path || 'unknown')}`);

    if (!status.meetsMinimum) {
      console.log(c.yellow(`  ⚠ 版本过低 (当前 ${status.version}, 最低 ${MIN_VERSION})`));
      if (!checkOnly) {
        console.log(c.yellow('  建议升级: npm update -g gitnexus'));
      }
    }
  } else {
    console.log(c.red('  ✗ GitNexus 未安装'));
    console.log(c.dim(`    原因: ${status.error}`));

    if (checkOnly) {
      // 仅检测模式，展示降级信息
      console.log(c.yellow('\n  降级到 regex 分析器：'));
      const fallback = getFallbackInfo();
      fallback.capabilities.forEach(cap => console.log(c.dim(`    • ${cap}`)));
      console.log(c.yellow('  限制：'));
      fallback.limitations.forEach(lim => console.log(c.dim(`    • ${lim}`)));
      return;
    }

    // Step 2: 交互引导
    if (forceInstall) {
      doInstall();
    } else {
      console.log(getInstallGuide());
      console.log(c.bold('  是否现在安装 GitNexus？'));
      console.log(`  ${c.green('[1]')} 是，请安装 ← 推荐`);
      console.log(`  ${c.yellow('[2]')} 否，暂时跳过（将使用 regex 降级模式）`);
      console.log();

      // 非交互模式下无法读取用户输入，直接提示
      console.log(c.cyan('  运行以下命令安装:'));
      console.log(c.bold('    npm install -g gitnexus'));
      console.log();
      console.log(c.dim('  或重新运行此脚本并添加 --install 参数:'));
      console.log(c.dim('    node scripts/setup-gitnexus.js --install'));
    }
    return;
  }

  // Step 3: 检测项目索引
  const projectDir = process.cwd();
  const indexStatus = checkIndex(projectDir);

  if (indexStatus.indexed) {
    console.log(c.green('  ✓ 当前项目已索引'));
    console.log(`    节点数: ${c.cyan(indexStatus.stats.nodeCount)}`);
    console.log(`    边数: ${c.cyan(indexStatus.stats.edgeCount)}`);
    if (indexStatus.stats.indexedAt) {
      console.log(`    索引时间: ${c.dim(indexStatus.stats.indexedAt)}`);
    }
  } else {
    console.log(c.yellow('  ⚠ 当前项目未索引'));
    if (!checkOnly) {
      console.log(c.cyan('  建立索引:'));
      console.log(c.bold('    gitnexus analyze'));
    }
  }

  console.log(c.dim('─'.repeat(40)));
  console.log(c.green('  环境检测完成\n'));
}

function doInstall() {
  console.log(c.cyan('\n  正在安装 GitNexus...'));
  console.log(c.dim('  npm install -g gitnexus\n'));
  try {
    execSync('npm install -g gitnexus', {
      stdio: 'inherit',
      timeout: 120000
    });
    console.log(c.green('\n  ✓ 安装成功！'));
    // 验证
    const verify = checkInstallation();
    if (verify.installed) {
      console.log(`  版本: ${c.cyan(verify.version)}`);
    }
    console.log(c.cyan('\n  下一步：为项目建立索引'));
    console.log(c.bold('    gitnexus analyze'));
  } catch (e) {
    console.log(c.red('\n  ✗ 安装失败'));
    console.log(c.dim(`  ${e.message.split('\n')[0]}`));
    console.log(c.cyan('\n  请手动安装:'));
    console.log(c.bold('    npm install -g gitnexus'));
  }
}

main();
