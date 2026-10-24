#!/usr/bin/env node
/**
 * devflow — CLI 入口
 *
 * 核心 Phase → layers/L1-INTERACTION/ + references/ (来自 DevFlow)
 * 扩展 → lib/ + domains/ (devflow 自建)
 *
 * 用法: devflow init [--mode standard]
 *       devflow task --describe "登录功能"
 *       devflow mem --save "决策内容"
 *       devflow party --scenario "方案名"
 *       devflow code --symbol "login"
 *       devflow caveman --file README.md
 *       devflow status
 */

const fs = require('fs');
const path = require('path');

const DEVFLOW_HOME = path.resolve(__dirname, '..');
const DEVFLOW_SKILL = path.join(DEVFLOW_HOME, 'SKILL.md');
const DEVFLOW_GO = path.join(DEVFLOW_HOME, 'GO.md');
const DEVFLOW_LAYERS = path.join(DEVFLOW_HOME, 'layers');
const DEVFLOW_REFS = path.join(DEVFLOW_HOME, 'references');

const HELP = `DevFlow v${JSON.parse(fs.readFileSync(path.join(DEVFLOW_HOME, 'package.json'), 'utf8')).version} — AI 开发操作系统

核心: layers/ (Phase 管线) + references/ (Gate 规则)
扩展: lib/ (记忆/仲裁/规划) + domains/ (代码/压缩/钩子)

用法:
  devflow init [--mode fast|lean|standard|strict]   初始化 Phase 管线 (未指定 --mode 时按项目规模自动判定)
  devflow status                                     当前 Phase 状态
  devflow phase --status                             Phase 详情 (进度/门控/产出)
  devflow phase --list                               Phase 管线总览
  devflow phase --mode <fast|lean|standard|strict>   设置模式 (重置起始 Phase)
  devflow phase --set <N> [--force]                  切换到指定 Phase (0/1/1.5/2/2.5/3-8)
  devflow phase --next [--force]                     推进到下一阶段 (受门控护卫)
  devflow phase --gate <G3> [--note <用户确认>]      标记门控通过 (人工门必须携带确认凭证)
  devflow phase --output <文件> [--note <确认>]      记录产物并通过门控 (manual 主门控需 --note)
  devflow phase --journal                            事件日志 (状态变更审计时间线)
  devflow detect [--files N] [--lines N] [--modules N] 按规模/风险自动判定模式
                  [--risk low|medium|high] [--brownfield]
                  [--arch-change] [--data-change]
  devflow task --describe <描述> [--visualize]       任务分解 (DAG)
  devflow mem --save <内容> [--tags a,b]             保存记忆
  devflow mem --search <关键词>                       搜索记忆
  devflow mem --recent                                最近记忆
  devflow mem --stats                                 记忆统计
  devflow party --scenario <场景>                     Party 评分仲裁
  devflow party --role <角色> <方案> [--role ...]    手动评分
  devflow code --symbol <名称>                        代码符号查询
  devflow code --scan <目录>                          代码扫描
  devflow caveman --file <路径> [--level lite|full|ultra|wenyan]  压缩
  devflow caveman --compress <文本>                   压缩文本
  devflow gates --phase <N>                           门控检查 (含内容级: 模板段落 + G6 AC 覆盖率)
  devflow gates --ac <目录>                           AC 覆盖率报告 (.devflow 或 .devflow/<req-id>)
  devflow gates --template <文件>                     模板内容校验 (必填段落 + 占位符)
  devflow git start <req-id> [--from <base>]          创建 devflow/<req-id> 分支并记录链路
  devflow git status                                  req-id ↔ 分支 ↔ 提交链路状态
  devflow git checkpoint "<说明>"                     提交流程产物检查点 (只 stage .devflow/)
  devflow git verify                                  链路健康检查
  devflow install [--target <name>] [--dry-run]       安装到运行时 (--list 查看目标)
  devflow install --target claude                     安装并注册写入守卫到 ~/.claude/settings.json (PreToolUse 真实拦截)
  devflow install --list                              列出安装目标与状态
  devflow install --uninstall [--target <name>]       卸载
  devflow doctor                                       健康检查
  devflow help                                        帮助`;

const CMDS = {
  init: (args) => {
    // 用 Phase 引擎初始化，确保 currentPhase 与模式匹配 (fast=4 / lean=2 / standard|strict=0)
    const engine = require('../lib/phase-engine');

    // 模式判定：显式 --mode 优先；否则按当前项目规模/风险自动判定 (GO.md Step 0.5)
    let mode;
    if (args.includes('--mode')) {
      mode = args[args.indexOf('--mode') + 1];
    } else {
      const scale = scanProjectScale(process.cwd());
      const d = engine.detectMode({ files: scale.files, lines: scale.lines, brownfield: scale.files > 0 });
      mode = d.mode;
      console.log(`🔍 自动判定模式: ${mode.toUpperCase()} — ${d.reason}`);
    }

    const devflowDir = path.resolve('.devflow');
    // 产物目录约定：GO.md 规定产物落 .devflow/<req-id>/（由 gate-check.js 递归定位），
    // 不预建 outputs/ 以免误导。此处只建记忆系统骨架。
    fs.mkdirSync(path.resolve(devflowDir, 'memory', 'domain-skills'), { recursive: true });
    const e = new engine.PhaseEngine();
    const r = e.setMode(mode);

    console.log(`DevFlow 已初始化
  模式: ${mode.toUpperCase()}
  起始 Phase: ${r.startPhase}
  目录: ${devflowDir}
  核心: GO.md (Step 1-12) + layers/L1-INTERACTION/ (Phase 0-8)`);

    // 创建 GO.md Step 1 期望的记忆骨架 + 项目宪法 (单轨一致, 幂等)
    const memDir = path.join(devflowDir, 'memory');
    fs.mkdirSync(memDir, { recursive: true });
    const memSkeleton = {
      'PROJECT_CONTEXT.md': '# 项目背景\n\n> 由 devflow init 生成\n',
      'DECISIONS.md': '# 历史决策\n\n> 由 devflow init 生成\n',
      'KNOWN_FAILURES.md': '# 已知失败\n\n> 由 devflow init 生成\n',
      'LESSONS.md': '# 经验教训库\n\n> 由 devflow init 生成\n',
    };
    for (const [f, c] of Object.entries(memSkeleton)) {
      const fp = path.join(memDir, f);
      if (!fs.existsSync(fp)) fs.writeFileSync(fp, c);
    }
    // GO.md Step 1 记忆骨架的第 5 项：领域技能沉淀目录
    const domainSkillsDir = path.join(memDir, 'domain-skills');
    fs.mkdirSync(domainSkillsDir, { recursive: true });
    const domainSkillsReadme = path.join(domainSkillsDir, 'README.md');
    if (!fs.existsSync(domainSkillsReadme)) {
      fs.writeFileSync(domainSkillsReadme, '# 领域技能沉淀\n\n> Phase 8 归档时，把可复用的领域经验以独立 .md 沉淀到此目录。\n');
    }
    const constitutionPath = path.join(devflowDir, 'PROJECT_CONSTITUTION.md');
    if (!fs.existsSync(constitutionPath)) {
      fs.writeFileSync(constitutionPath, '# 项目宪法\n\n> 冲突时优先级: 项目宪法 > CONSTITUTION.md\n');
    }
  },

  status: () => {
    if (fs.existsSync(DEVFLOW_GO)) {
      const statePath = path.resolve('.devflow', 'state.json');
      let state = { mode: 'unknown', currentPhase: 0, gates: {}, outputs: {} };
      try { state = JSON.parse(fs.readFileSync(statePath, 'utf-8')); } catch {}

      const gateStats = state.gates ? Object.keys(state.gates).length : 0;
      console.log(`DevFlow 状态
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
      console.log(`DevFlow 状态 (回退模式)
  模式: ${s.mode}
  当前: Phase ${s.currentPhase}`);
    }

    // 永远显示扩展信息
    const memStats = fs.existsSync(path.resolve('.devflow', 'memory'))
      ? fs.readdirSync(path.resolve('.devflow', 'memory')).length : 0;
    console.log(`  记忆条目: ${memStats}`);
  },

  phase: (args) => {
    const engine = require('../lib/phase-engine');
    const e = new engine.PhaseEngine();
    if (args.includes('--mode')) {
      const mode = args[args.indexOf('--mode') + 1];
      const r = e.setMode(mode);
      console.log(`模式设为: ${mode.toUpperCase()}, 从 Phase ${r.startPhase} 开始`);
      return;
    }
    if (args.includes('--next')) {
      const force = args.includes('--force');
      const p = e.nextPhase({ force });
      if (p.blocked) {
        console.log(`⛔ 阻止推进: ${p.reason}`);
        process.exit(1);
      }
      console.log(`下一阶段: Phase ${p.id} — ${p.name}`);
      return;
    }
    const argVal = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
    if (args.includes('--output')) {
      const filePath = args[args.indexOf('--output') + 1];
      const phase = e.current();
      try {
        e.outputWritten(phase.id, path.resolve(filePath), { note: argVal('--note') });
      } catch (err) {
        console.error(`❌ ${err.message}`);
        process.exit(1);
      }
      const after = e._verifyCurrentGate();
      if (after.passed) {
        console.log(`Phase ${phase.id} 产物已记录: ${filePath}`);
        console.log(`Phase ${phase.id} 门控已通过 ✅`);
      } else {
        console.log(`Phase ${phase.id} 产物已记录: ${filePath}`);
        console.log(`⚠️ 仍有门控未通过: ${after.reason}`);
      }
      return;
    }
    if (args.includes('--gate')) {
      const gate = args[args.indexOf('--gate') + 1];
      try {
        e.gatePassed(gate, { note: argVal('--note') });
      } catch (err) {
        console.error(`❌ ${err.message}`);
        process.exit(1);
      }
      const approved = e.state.approvals && e.state.approvals[gate];
      console.log(`门控 ${gate} 已通过${approved ? `（凭证哈希 ${approved.noteHash}）` : ''}`);
      return;
    }
    if (args.includes('--journal')) {
      const journalFile = path.join(path.resolve('.devflow'), 'state-events.jsonl');
      try {
        const lines = fs.readFileSync(journalFile, 'utf-8').trim().split('\n').filter(Boolean);
        console.log(`DevFlow 事件日志（共 ${lines.length} 条，最近 20 条）\n`);
        for (const line of lines.slice(-20)) console.log(`  ${line}`);
      } catch {
        console.log('事件日志为空（尚无状态变更记录）');
      }
      return;
    }
    if (args.includes('--status')) {
      const s = e.status();
      console.log(`DevFlow Phase 状态
  模式: ${s.mode}
  当前: Phase ${s.currentPhase} — ${s.currentName}
  进度: ${s.progress}
  门控: ${Object.keys(s.gates).length} 个已通过
  产出: ${Object.keys(s.outputs).length} 个已记录${(s.skips || []).length > 0 ? `\n  跳过审计: ${s.skips.length} 次 --force 强制跳过（详见 state.json skips）` : ''}
  门控合规: ${s.gateCompliant ? '✅' : '⛔ ' + s.gateStatus}`);
      return;
    }
    if (args.includes('--list')) {
      const displayMode = e.state.mode || 'standard';
      const phases = e.listPhases(displayMode);
      console.log(`DevFlow Phase 管线 (模式: ${displayMode})`);
      phases.forEach(p => {
        const status = p.active ? '' : ' [跳过]';
        console.log(`  Phase ${p.id} ${p.name.padEnd(20)} ${p.gate.padEnd(6)} ${p.output.padEnd(20)}${status}`);
      });
      return;
    }
    if (args.includes('--set')) {
      const target = parseFloat(args[args.indexOf('--set') + 1]);
      try {
        const r = e.setPhase(target, { force: args.includes('--force') });
        console.log(`当前 Phase: ${r.phase} — ${r.name}（产物: ${r.output}）`);
      } catch (err) {
        console.error(`❌ ${err.message}`);
        process.exit(1);
      }
      return;
    }
    // default: 当前 Phase 状态摘要（而非原始对象 dump）
    const s = e.status();
    console.log(`DevFlow Phase 状态
  模式: ${s.mode}
  当前: Phase ${s.currentPhase} — ${s.currentName}
  进度: ${s.progress}
  门控合规: ${s.gateCompliant ? '✅' : '⛔ ' + s.gateStatus}
提示: devflow phase --status 查看详情, --list 查看管线`);
  },

  detect: (args) => {
    const { detectMode } = require('../lib/phase-engine');
    const num = (flag) => (args.includes(flag) ? parseInt(args[args.indexOf(flag) + 1], 10) : undefined);
    const d = detectMode({
      files: num('--files'),
      lines: num('--lines'),
      modules: num('--modules'),
      risk: args.includes('--risk') ? args[args.indexOf('--risk') + 1] : undefined,
      brownfield: args.includes('--brownfield'),
      architectureChange: args.includes('--arch-change'),
      dataModelChange: args.includes('--data-change'),
    });
    console.log(`🎯 建议模式: ${d.mode.toUpperCase()}`);
    console.log(`   理由: ${d.reason}`);
    console.log(`   命中规则: ${d.matched}`);
    console.log(`\n   应用该模式: devflow phase --mode ${d.mode}`);
  },

  task: (args) => {
    const planner = require('../lib/task-planner');
    const p = new planner.TaskPlanner();
    if (args.includes('--file')) {
      const fp = args[args.indexOf('--file') + 1];
      try {
        p.loadFromFile(path.resolve(fp));
      } catch (err) {
        console.error(`❌ 加载失败: ${err.message}`);
        process.exit(1);
      }
    } else if (args.includes('--describe')) {
      const desc = args[args.indexOf('--describe') + 1];
      p.generateFromDescription(desc);
    } else {
      console.log(`用法: devflow task --describe "<功能描述>" [--visualize] [--json] [--save <文件>]
      devflow task --file <tasks.json> [--json]     加载并校验已有任务计划（环检测/拓扑排序）`);
      return;
    }
    if (args.includes('--save')) p.saveToFile(path.resolve(args[args.indexOf('--save') + 1]));
    const result = p.toJSON();
    if (args.includes('--json')) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    console.log(`任务分解: ${result.totalTasks} 个任务, ${result.totalWaves} 个 Wave`);
    result.tasks.forEach(t => console.log(`  ${t.id}  Wave ${t.wave}  ${t.name}  依赖: ${(t.deps || []).join(',') || '无'}`));
    if (args.includes('--visualize')) console.log(`\nDAG:\n${result.mermaid}`);
  },

  mem: (args) => {
    const mem = require('../lib/memory');
    const m = new mem.DevFlowMemory();
    if (args.includes('--save')) {
      const content = args[args.indexOf('--save') + 1];
      const tags = args.includes('--tags') ? args[args.indexOf('--tags') + 1].split(',') : [];
      const entry = m.save(content, tags);
      console.log(`记忆已保存: ${entry.id}`);
    } else if (args.includes('--search')) {
      const query = args[args.indexOf('--search') + 1];
      const results = m.search(query);
      results.forEach(r => console.log(`[${r.layer}] ${r.content.slice(0, 80)} (${r.score})`));
    } else if (args.includes('--recent')) {
      const results = m.recent();
      results.forEach(r => console.log(`[${r.layer}] ${r.content.slice(0, 80)}`));
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
          const role = args[++i];
          if (!role) { console.error('❌ --role 后缺少角色名'); process.exit(1); }
          roles.push(role);
          summaries.push(args[++i] || ''); // 方案摘要在行尾可省略，仲裁表自动回退为 "<角色>方案"
        }
      }
      roles.forEach((r, i) => a.addProposal(r, summaries[i] || `${r}方案`));
      console.log(a.tableText());
    }
  },

  code: (args) => {
    // 直接调用 code-explorer
    // execFileSync + 参数数组（不经 shell），避免多词参数/含空格路径被拆词截断
    const child = require('child_process');
    const explorer = path.join(DEVFLOW_HOME, 'domains', 'code-intel', 'code-explorer.js');
    const passArgs = process.argv.slice(process.argv.indexOf('code') + 1);
    child.execFileSync(process.execPath, [explorer, ...passArgs], { stdio: 'inherit' });
  },

  caveman: (args) => {
    const child = require('child_process');
    const caveman = path.join(DEVFLOW_HOME, 'domains', 'memory', 'caveman.js');
    const passArgs = process.argv.slice(process.argv.indexOf('caveman') + 1);
    child.execFileSync(process.execPath, [caveman, ...passArgs], { stdio: 'inherit' });
  },

  gates: (args) => {
    // --ac <目录>: 独立 AC 覆盖率报告（G6 度量）
    if (args.includes('--ac')) {
      const target = args[args.indexOf('--ac') + 1] || '.devflow';
      const { checkACCoverage } = require('../lib/ac-coverage');
      const r = checkACCoverage(path.resolve(target));
      // formatReport 未导出时本地渲染
      const lines = r.applicable
        ? [`AC 覆盖率: ${r.coveredPct}% (${r.covered.length}/${r.total})，阈值 ${r.threshold}%`,
           r.uncovered.length > 0 ? `  ⚠️ 未覆盖: ${r.uncovered.join(', ')}` : '  ✅ 全部 AC 已有用例映射',
           ...(r.failing.length > 0 ? [`  ❌ 失败用例覆盖: ${r.failing.join(', ')}`] : []),
           r.pass ? '✅ PASS' : '❌ FAIL']
        : [`ℹ️ ${r.reason}`];
      console.log(lines.join('\n'));
      process.exitCode = r.pass ? 0 : 1;
      return;
    }
    // --template <文件>: 独立模板内容校验（R13.11 机器化）
    if (args.includes('--template')) {
      const target = args[args.indexOf('--template') + 1];
      if (!target) { console.error('用法: devflow gates --template <产物文件>'); process.exit(1); }
      const { checkTemplate } = require('../lib/template-check');
      const abs = path.resolve(target);
      if (!fs.existsSync(abs)) { console.error(`❌ 文件不存在: ${abs}`); process.exit(1); }
      const r = checkTemplate(abs);
      console.log(`模板内容校验: ${path.basename(abs)}\n  ${r.reason}\n${r.pass ? '✅' : '❌'} ${r.pass ? 'PASS' : 'FAIL'}`);
      process.exitCode = r.pass ? 0 : 1;
      return;
    }
    const child = require('child_process');
    const gateCheck = path.join(DEVFLOW_HOME, 'domains', 'hooks', 'gate-check.js');
    const passArgs = process.argv.slice(process.argv.indexOf('gates') + 1);
    try {
      child.execFileSync(process.execPath, [gateCheck, ...passArgs], { stdio: 'inherit' });
    } catch (err) {
      // gate-check 在门控未通过时返回非零退出码 (预期行为)，输出已通过 stdio inherit 打印
      process.exitCode = err.status || 1;
    }
  },

  git: (args) => {
    const { GitBridge } = require('../lib/git-bridge');
    const bridge = new GitBridge(process.cwd());
    const [sub, ...rest] = args;
    const val = (flag) => { const i = rest.indexOf(flag); return i >= 0 ? rest[i + 1] : undefined; };
    try {
      if (sub === 'start') {
        if (!rest[0]) throw new Error('用法: devflow git start <req-id> [--from <base>]');
        const r = bridge.start(rest[0], { from: val('--from') });
        console.log(`${r.created ? '已创建' : '已切换到'}分支 ${r.branch} (基于 ${r.base})`);
        console.log(`链路记录: .devflow/${r.reqId}/git.json`);
        return;
      }
      if (sub === 'status') {
        if (!bridge.isRepo()) { console.log('当前目录不是 git 仓库'); process.exitCode = 1; return; }
        const reqId = bridge.reqFromBranch();
        console.log(`DevFlow Git 链路\n  当前分支: ${bridge.currentBranch()}${reqId ? ` (req: ${reqId})` : ' (不符合 devflow/<req-id> 约定)'}`);
        const linked = bridge.linkedReqs();
        if (linked.length > 0) console.log(`  已链路 req: ${linked.map(l => l.reqId).join(', ')}`);
        if (reqId) {
          const c = bridge.branchCommits(reqId);
          if (c) console.log(`  分支提交: ${c.count} 条${c.latest ? `，最近: ${c.latest}` : ''}`);
        }
        const changes = bridge.artifactChanges();
        console.log(`  未提交流程产物: ${changes.length} 个${changes.length > 0 ? '（devflow git checkpoint "<说明>" 收口）' : ''}`);
        return;
      }
      if (sub === 'checkpoint') {
        const r = bridge.checkpoint(rest[0]);
        if (r.commit) console.log(`✅ 已提交 ${r.commit}: devflow(${r.reqId}) 流程产物`);
        else console.log('ℹ️ 无流程产物变更可提交');
        return;
      }
      if (sub === 'verify') {
        const r = bridge.verify();
        console.log(`DevFlow Git 链路检查\n  ${r.pass ? '✅ 通过' : `❌ ${r.issues.length} 个问题`}`);
        r.issues.forEach(i => console.log(`  - ${i}`));
        process.exitCode = r.pass ? 0 : 1;
        return;
      }
      console.log(`用法: devflow git start <req-id> [--from <base>] | status | checkpoint "<说明>" | verify`);
    } catch (err) {
      console.error(`❌ ${err.message}`);
      process.exit(1);
    }
  },

  install: (args) => {
    // execFileSync + 参数数组（不经 shell）：避免含空格/引号的参数被拆词
    // 历史 bug: 曾用 execSync 拼接字符串，且把 --target 静默丢弃
    const child = require('child_process');
    const installer = path.join(DEVFLOW_HOME, 'harnesses', 'install.js');
    try {
      child.execFileSync(process.execPath, [installer, ...args], { stdio: 'inherit' });
    } catch (err) {
      // 安装器以非零退出码报告失败（未知目标/来源不明目录等），原样透传
      process.exitCode = err.status || 1;
    }
  },

  doctor: () => {
    console.log('DevFlow 健康检查\n');
    // JS 模块必须「可被加载」，仅 existsSync 无法发现语法错误/缺失依赖
    const loadable = (rel) => {
      const p = path.join(DEVFLOW_HOME, rel);
      if (!fs.existsSync(p)) return { ok: false, note: '文件不存在' };
      try { require(p); return { ok: true, note: '可加载' }; }
      catch (e) { return { ok: false, note: `不可加载: ${e.message.split('\n')[0]}` }; }
    };
    const present = (p) => {
      const abs = path.isAbsolute(p) ? p : path.join(DEVFLOW_HOME, p);
      return fs.existsSync(abs) ? { ok: true, note: '' } : { ok: false, note: '文件不存在' };
    };
    // Node 运行时版本校验: 对照 package.json engines.node (支持 ">=X" / ">=X.Y")
    const checkNode = () => {
      const actual = process.versions.node; // doctor 本身由 Node 执行, 能跑到这里即说明 Node 存在
      let required = null;
      try {
        required = (JSON.parse(fs.readFileSync(path.join(DEVFLOW_HOME, 'package.json'), 'utf8')).engines || {}).node || null;
      } catch { /* package.json 不可读时跳过比对 */ }
      if (!required) return { ok: true, note: `v${actual} (未声明版本要求)` };
      const m = String(required).match(/>=\s*(\d+)(?:\.(\d+))?/);
      if (!m) return { ok: true, note: `v${actual} (要求表达式 "${required}" 无法解析, 跳过比对)` };
      const [aM, aN] = actual.split('.').map(Number);
      const rM = +m[1], rN = m[2] ? +m[2] : 0;
      const ok = aM > rM || (aM === rM && aN >= rN);
      return ok
        ? { ok: true, note: `v${actual} (要求 ${required})` }
        : { ok: false, note: `当前 v${actual} 低于要求 ${required} — 请升级 Node.js (https://nodejs.org)` };
    };

    const checks = [
      { name: 'Node 运行时', run: () => checkNode() },
      { name: 'GO.md (执行流程)', run: () => present(DEVFLOW_GO) },
      { name: 'layers/ (Phase 管线)', run: () => present(DEVFLOW_LAYERS) },
      { name: 'references/ (门控规则)', run: () => present(DEVFLOW_REFS) },
      { name: '记忆系统', run: () => loadable('lib/memory.js') },
      { name: '任务规划', run: () => loadable('lib/task-planner.js') },
      { name: 'Party 仲裁', run: () => loadable('lib/party-arbiter.js') },
      { name: '代码解析', run: () => loadable('domains/code-intel/code-explorer.js') },
      { name: '压缩引擎', run: () => loadable('domains/memory/caveman.js') },
      { name: '门控检查', run: () => loadable('domains/hooks/gate-check.js') },
      { name: 'Phase 引擎', run: () => loadable('lib/phase-engine.js') },
      { name: 'AC 覆盖检查器', run: () => loadable('lib/ac-coverage.js') },
      { name: '模板内容校验', run: () => loadable('lib/template-check.js') },
      { name: 'Git 链路桥接', run: () => loadable('lib/git-bridge.js') },
      { name: '写入守卫', run: () => loadable('lib/write-guard.js') },
      {
        // 借鉴 AI-DLC doctor：验证 hook 在宿主侧真的注册了（未注册为可选提示，不算失败）
        name: 'Claude 写入守卫注册',
        run: () => {
          const { checkClaudeHooks } = require('../lib/claude-hooks');
          const r = checkClaudeHooks(require('os').homedir());
          if (!r.scriptExists) return { ok: false, note: '守卫脚本缺失 hooks/scripts/phase-write-guard.js' };
          return r.registered
            ? { ok: true, note: '已注册到 ~/.claude/settings.json（PreToolUse/Stop）' }
            : { ok: true, note: '未注册（可选增强: devflow install --target claude 注册后获得真实拦截）' };
        },
      },
      { name: '.devflow 目录', run: () => present(path.resolve('.devflow')) },
    ];

    let failed = 0;
    for (const c of checks) {
      let res;
      try { res = c.run(); } catch (e) { res = { ok: false, note: e.message }; }
      if (res.ok) {
        console.log(`  ✅ ${c.name}${res.note ? ' — ' + res.note : ''}`);
      } else {
        failed++;
        // 历史 bug: 失败渲染为两个空格，与 ✅ 等宽，失败项看起来像缩进空白
        console.log(`  ❌ ${c.name} — ${res.note}`);
      }
    }

    console.log(`\n  ${checks.length - failed}/${checks.length} 项通过`);
    if (failed > 0) {
      console.log(`  ⚠️ 有 ${failed} 项未通过，DevFlow 可能无法正常执行`);
      process.exitCode = 1;
    }
  },

  help: () => console.log(HELP),
};

function scanProjectScale(root) {
  // 估算当前项目的规模信号（文件数 / 行数），供 init 自动判定模式使用
  const SKIP = new Set(['node_modules', '.git', '.devflow', 'sources', 'dist', 'build', 'vendor', '.next', 'coverage', 'out', 'target']);
  const EXTS = new Set(['.js', '.ts', '.tsx', '.jsx', '.py', '.go', '.java', '.rs', '.c', '.cpp', '.h', '.hpp', '.cs', '.rb', '.php', '.vue', '.md', '.json', '.yaml', '.yml', '.sql', '.sh', '.swift', '.kt', '.m', '.mm', '.r', '.scala', '.dart']);
  const MAX_DEPTH = 6;
  let files = 0, lines = 0;
  const walk = (dir, depth) => {
    if (depth > MAX_DEPTH) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name.startsWith('.')) continue; // 跳过所有隐藏文件/目录（含 .git/.devflow）
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (SKIP.has(e.name)) continue;
        walk(full, depth + 1);
      } else if (e.isFile()) {
        if (!EXTS.has(path.extname(e.name).toLowerCase())) continue;
        files++;
        try {
          const buf = fs.readFileSync(full, { encoding: 'utf8' });
          const sample = buf.length > 200 * 1024 ? buf.slice(0, 200 * 1024) : buf; // 单文件至多估 200KB
          lines += (sample.match(/\n/g) || []).length + (sample.length > 0 && !sample.endsWith('\n') ? 1 : 0);
        } catch { /* 跳过不可读文件 */ }
      }
    }
  };
  walk(root, 0);
  return { files, lines };
}

function stateGuard() {
  const statePath = path.resolve('.devflow', 'state.json');
  if (!fs.existsSync(statePath)) {
    console.warn('⚠️ .devflow/state.json 不存在。请先运行 devflow init');
    return null;
  }
  try {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    // 验证必需字段
    const required = ['mode', 'currentPhase'];
    const missing = required.filter(k => state[k] === undefined || state[k] === null);
    if (missing.length > 0) {
      console.warn(`⚠️ .devflow/state.json 缺少字段: ${missing.join(', ')}。建议重新初始化。`);
      return null;
    }
    // 验证模式值
    if (!['fast', 'lean', 'standard', 'strict', null].includes(state.mode)) {
      console.warn(`⚠️ .devflow/state.json 模式值无效: "${state.mode}"。建议重新初始化。`);
      return null;
    }
    return state;
  } catch (e) {
    console.warn(`⚠️ .devflow/state.json 解析错误: ${e.message}`);
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

  // 通用旗标：--version/-v 与 --help/-h 不走"未知命令"分支
  if (cmd === '--version' || cmd === '-v') {
    console.log(JSON.parse(fs.readFileSync(path.join(DEVFLOW_HOME, 'package.json'), 'utf8')).version);
    return;
  }
  if (cmd === '--help' || cmd === '-h') {
    console.log(HELP);
    return;
  }

  // 状态守卫：除 init/help/doctor/git 外，所有命令先验证状态
  // （git 链路只依赖 .devflow/<req-id>/git.json，不需要 state.json）
  if (!['init', 'help', 'doctor', 'git'].includes(cmd)) {
    const state = stateGuard();
    if (!state) {
      // 非阻塞：仅警告，让用户自己决定是否继续
      console.warn('  执行继续，但建议先运行 devflow init 初始化。');
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
