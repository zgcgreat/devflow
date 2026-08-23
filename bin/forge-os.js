#!/usr/bin/env node
/**
 * forge-os — CLI 入口
 *
 * 核心 Phase → layers/L1-INTERACTION/ + references/ (来自 ForgeOS)
 * 扩展 → lib/ + domains/ (forge-os 自建)
 *
 * 用法: forge-os init [--mode standard]
 *       forge-os task --describe "登录功能"
 *       forge-os mem --save "决策内容"
 *       forge-os party --scenario "方案名"
 *       forge-os code --symbol "login"
 *       forge-os caveman --file README.md
 *       forge-os status
 */

const fs = require('fs');
const path = require('path');

const FORGE_OS_HOME = path.resolve(__dirname, '..');
const FORGEOS_SKILL = path.join(FORGE_OS_HOME, 'SKILL.md');
const FORGEOS_GO = path.join(FORGE_OS_HOME, 'GO.md');
const FORGEOS_LAYERS = path.join(FORGE_OS_HOME, 'layers');
const FORGEOS_REFS = path.join(FORGE_OS_HOME, 'references');

const HELP = `ForgeOS v3.2.2 — AI 开发操作系统

核心: layers/ (Phase 管线) + references/ (Gate 规则)
扩展: lib/ (记忆/仲裁/规划) + domains/ (代码/压缩/钩子)

用法:
  forge-os init [--mode fast|lean|standard|strict]   初始化 Phase 管线
  forge-os status                                     当前 Phase 状态
  forge-os task --describe <描述> [--visualize]       任务分解 (DAG)
  forge-os mem --save <内容> [--tags a,b]             保存记忆
  forge-os mem --search <关键词>                       搜索记忆
  forge-os mem --stats                                 记忆统计
  forge-os party --scenario <场景>                     Party 评分仲裁
  forge-os party --role <角色> <方案> [--role ...]    手动评分
  forge-os code --symbol <名称>                        代码符号查询
  forge-os code --scan <目录>                          代码扫描
  forge-os caveman --file <路径> [--level lite|full|ultra|wenyan]  压缩
  forge-os caveman --compress <文本>                   压缩文本
  forge-os gates --phase <N>                           门控检查
  forge-os install [--target workbuddy|cursor|claude]  安装
  forge-os doctor                                       健康检查
  forge-os help                                        帮助`;

const CMDS = {
  init: (args) => {
    const mode = args.includes('--mode') ? args[args.indexOf('--mode') + 1] : 'standard';
    const forgeosDir = path.resolve('.forgeos');

    // 使用 ForgeOS Phase 引擎
    if (fs.existsSync(path.join(FORGE_OS_HOME, 'layers', 'L1-INTERACTION'))) {
      console.log(`ForgeOS 已初始化
  模式: ${mode.toUpperCase()}
  目录: ${forgeosDir}
  核心: GO.md (Step 1-12) + layers/L1-INTERACTION/ (Phase 0-8)`);

      // 创建 .forgeos 状态
      fs.mkdirSync(path.resolve(forgeosDir, 'memory'), { recursive: true });
      fs.mkdirSync(path.resolve(forgeosDir, 'outputs'), { recursive: true });
      fs.writeFileSync(path.resolve(forgeosDir, 'state.json'), JSON.stringify({
        mode, currentPhase: 0, gates: {}, outputs: {}, createdAt: new Date().toISOString()
      }, null, 2));
    } else {
      // 回退到 forge-os 自建引擎
      const engine = require('../lib/phase-engine');
      const e = new engine.PhaseEngine();
      e.setMode(mode);
      console.log(`ForgeOS 已初始化 (回退模式: Phase 引擎未找到)`);
    }

    // 创建 GO.md Step 1 期望的记忆骨架 + 项目宪法 (单轨一致, 幂等)
    const memDir = path.join(forgeosDir, 'memory');
    fs.mkdirSync(memDir, { recursive: true });
    const memSkeleton = {
      'PROJECT_CONTEXT.md': '# 项目背景\n\n> 由 forge-os init 生成\n',
      'DECISIONS.md': '# 历史决策\n\n> 由 forge-os init 生成\n',
      'KNOWN_FAILURES.md': '# 已知失败\n\n> 由 forge-os init 生成\n',
      'LESSONS.md': '# 经验教训库\n\n> 由 forge-os init 生成\n',
    };
    for (const [f, c] of Object.entries(memSkeleton)) {
      const fp = path.join(memDir, f);
      if (!fs.existsSync(fp)) fs.writeFileSync(fp, c);
    }
    const constitutionPath = path.join(forgeosDir, 'PROJECT_CONSTITUTION.md');
    if (!fs.existsSync(constitutionPath)) {
      fs.writeFileSync(constitutionPath, '# 项目宪法\n\n> 冲突时优先级: 项目宪法 > CONSTITUTION.md\n');
    }
  },

  status: () => {
    if (fs.existsSync(FORGEOS_GO)) {
      const statePath = path.resolve('.forgeos', 'state.json');
      let state = { mode: 'unknown', currentPhase: 0, gates: {}, outputs: {} };
      try { state = JSON.parse(fs.readFileSync(statePath, 'utf-8')); } catch {}

      const gateStats = state.gates ? Object.keys(state.gates).length : 0;
      console.log(`ForgeOS 状态
  模式: ${(state.mode || 'unknown').toUpperCase()}
  当前: Phase ${state.currentPhase || 0}
  核心: GO.md (Step 1-12 详细流程)
  Phase 管线: layers/L1-INTERACTION/
  门控规则: references/gate-rules.md
  门控通过: ${gateStats} 个`);
    } else {
      const engine = require('../lib/phase-engine');
      const e = new engine.PhaseEngine();
      const s = e.status();
      console.log(`ForgeOS 状态 (回退模式)
  模式: ${s.mode}
  当前: Phase ${s.currentPhase}`);
    }

    // 永远显示扩展信息
    const memStats = fs.existsSync(path.resolve('.forgeos', 'memory'))
      ? fs.readdirSync(path.resolve('.forgeos', 'memory')).length : 0;
    console.log(`  记忆条目: ${memStats}`);
  },

  phase: (args) => {
    const engine = require('../lib/phase-engine');
    const e = new engine.PhaseEngine();
    if (args.includes('--next')) {
      const p = e.nextPhase();
      console.log(`下一阶段: Phase ${p.id} — ${p.name}`);
    } else if (args.includes('--gate')) {
      const gate = args[args.indexOf('--gate') + 1];
      e.gatePassed(gate);
      console.log(`门控 ${gate} 通过`);
    } else {
      console.log(e.current());
    }
  },

  task: (args) => {
    const planner = require('../lib/task-planner');
    const p = new planner.TaskPlanner();
    if (args.includes('--describe')) {
      const desc = args[args.indexOf('--describe') + 1];
      p.generateFromDescription(desc);
      const result = p.toJSON();
      console.log(`任务分解: "${desc}"
  ${result.totalTasks} 个任务, ${result.totalWaves} 个 Wave`);
      result.tasks.forEach(t => console.log(`  ${t.id}  Wave ${t.wave}  ${t.name}`));
      if (args.includes('--visualize')) console.log(`\nDAG:\n${result.mermaid}`);
    }
  },

  mem: (args) => {
    const mem = require('../lib/memory');
    const m = new mem.ForgeMemory();
    if (args.includes('--save')) {
      const content = args[args.indexOf('--save') + 1];
      const tags = args.includes('--tags') ? args[args.indexOf('--tags') + 1].split(',') : [];
      const entry = m.save(content, tags);
      console.log(`记忆已保存: ${entry.id}`);
    } else if (args.includes('--search')) {
      const query = args[args.indexOf('--search') + 1];
      const results = m.search(query);
      results.forEach(r => console.log(`[${r.layer}] ${r.content.slice(0, 80)} (${r.score})`));
    } else if (args.includes('--stats')) {
      const s = m.stats();
      console.log(`记忆统计: ${s.total} 条 (短期:${s.short} / 长期:${s.long} / 归档:${s.archive})`);
    } else if (args.includes('--forget')) {
      const older = args.includes('--older') ? parseInt(args[args.indexOf('--older') + 1]) : 7;
      const r = m.forget(older);
      console.log(`已遗忘 ${r.forgotten} 条，剩余 ${r.remaining} 条`);
    }
  },

  party: (args) => {
    const arbiter = require('../lib/party-arbiter');
    const a = new arbiter.PartyArbiter();
    if (args.includes('--scenario')) {
      // Demo: 内置登录方案示例
      a.addProposal('architect', '模块化Auth服务,抽象Provider接口', { cost: 2, performance: 2, maintainability: 4, security: 3 })
       .addProposal('dev', 'passport.js+JWT中间件,最快实现', { cost: 4, performance: 3, maintainability: 3, security: 2 })
       .addProposal('security', '自带RateLimit+CSRF+密码策略', { cost: 1, performance: 2, maintainability: 3, security: 5 });
      console.log(`\n  Party Mode: "${args[args.indexOf('--scenario') + 1]}"\n`);
      console.log(a.tableText());
    } else if (args.includes('--role')) {
      const roles = [];
      const summaries = [];
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '--role') {
          roles.push(args[++i]);
          summaries.push(args[++i] || '');
        }
      }
      roles.forEach((r, i) => a.addProposal(r, summaries[i]));
      console.log(a.tableText());
    }
  },

  code: (args) => {
    // 直接调用 code-explorer
    const child = require('child_process');
    const explorer = path.join(FORGE_OS_HOME, 'domains', 'code-intel', 'code-explorer.js');
    const passArgs = process.argv.slice(process.argv.indexOf('code') + 1);
    const result = child.execSync(`node "${explorer}" ${passArgs.join(' ')}`, { encoding: 'utf-8' });
    console.log(result);
  },

  caveman: (args) => {
    const child = require('child_process');
    const caveman = path.join(FORGE_OS_HOME, 'domains', 'memory', 'caveman.js');
    const passArgs = process.argv.slice(process.argv.indexOf('caveman') + 1);
    const result = child.execSync(`node "${caveman}" ${passArgs.join(' ')}`, { encoding: 'utf-8' });
    console.log(result);
  },

  gates: (args) => {
    const child = require('child_process');
    const gateCheck = path.join(FORGE_OS_HOME, 'domains', 'hooks', 'gate-check.js');
    const passArgs = process.argv.slice(process.argv.indexOf('gates') + 1);
    try {
      const result = child.execSync(`node "${gateCheck}" ${passArgs.join(' ')}`, { encoding: 'utf-8' });
      console.log(result);
    } catch (err) {
      // gate-check 在门控未通过时返回非零退出码 (预期行为)，仍打印其输出而非抛异常
      if (err.stdout) console.log(err.stdout);
      if (err.stderr) console.error(err.stderr);
      process.exitCode = 1;
    }
  },

  install: (args) => {
    const child = require('child_process');
    const installer = path.join(FORGE_OS_HOME, 'harnesses', 'install.js');
    child.execSync(`node "${installer}" ${args.join(' ')}`, { stdio: 'inherit' });
  },

  doctor: () => {
    console.log('ForgeOS 健康检查\n');
    const checks = [
      { name: 'GO.md (执行流程)', check: () => fs.existsSync(FORGEOS_GO) },
      { name: 'layers/ (Phase 管线)', check: () => fs.existsSync(FORGEOS_LAYERS) },
      { name: 'references/ (门控规则)', check: () => fs.existsSync(FORGEOS_REFS) },
      { name: '记忆系统', check: () => fs.existsSync(path.join(FORGE_OS_HOME, 'lib/memory.js')) },
      { name: '任务规划', check: () => fs.existsSync(path.join(FORGE_OS_HOME, 'lib/task-planner.js')) },
      { name: 'Party 仲裁', check: () => fs.existsSync(path.join(FORGE_OS_HOME, 'lib/party-arbiter.js')) },
      { name: '代码解析', check: () => fs.existsSync(path.join(FORGE_OS_HOME, 'domains/code-intel/code-explorer.js')) },
      { name: '压缩引擎', check: () => fs.existsSync(path.join(FORGE_OS_HOME, 'domains/memory/caveman.js')) },
      { name: '门控检查', check: () => fs.existsSync(path.join(FORGE_OS_HOME, 'domains/hooks/gate-check.js')) },
      { name: '.forgeos 目录', check: () => fs.existsSync(path.resolve('.forgeos')) },
    ];
    checks.forEach(c => console.log(`  ${c.check() ? 'OK' : '  '} ${c.name}`));
  },

  help: () => console.log(HELP),
};

function stateGuard() {
  const statePath = path.resolve('.forgeos', 'state.json');
  if (!fs.existsSync(statePath)) {
    console.warn('⚠️ .forgeos/state.json 不存在。请先运行 forge-os init');
    return null;
  }
  try {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    // 验证必需字段
    const required = ['mode', 'currentPhase'];
    const missing = required.filter(k => state[k] === undefined || state[k] === null);
    if (missing.length > 0) {
      console.warn(`⚠️ .forgeos/state.json 缺少字段: ${missing.join(', ')}。建议重新初始化。`);
      return null;
    }
    // 验证模式值
    if (!['fast', 'lean', 'standard', 'strict', null].includes(state.mode)) {
      console.warn(`⚠️ .forgeos/state.json 模式值无效: "${state.mode}"。建议重新初始化。`);
      return null;
    }
    return state;
  } catch (e) {
    console.warn(`⚠️ .forgeos/state.json 解析错误: ${e.message}`);
    return null;
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log(HELP);
    return;
  }

  const cmd = args[0];
  const cmdArgs = args.slice(1);

  // 状态守卫：除 init/help/doctor 外，所有命令先验证状态
  if (!['init', 'help', 'doctor'].includes(cmd)) {
    const state = stateGuard();
    if (!state) {
      // 非阻塞：仅警告，让用户自己决定是否继续
      console.warn('  执行继续，但建议先运行 forge-os init 初始化。');
    }
  }

  if (CMDS[cmd]) {
    try {
      CMDS[cmd](cmdArgs);
    } catch (err) {
      console.error(`错误: ${err.message}`);
      process.exit(1);
    }
  } else {
    console.log(`未知命令: ${cmd}\n`);
    console.log(HELP);
    process.exit(1);
  }
}

main();
