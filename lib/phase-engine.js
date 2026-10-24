#!/usr/bin/env node
/**
 * DevFlow Phase Engine — 8 阶段门控管线执行器
 *
 * DevFlow 核心执行引擎 — Phase 管线 + Gate 门控 + 三级运行时
 * 零外部依赖，完整自包含。
 *
 * 用法: node lib/phase-engine.js --phase 0 --mode standard
 *       node lib/phase-engine.js --status
 *       node lib/phase-engine.js --list
 *       node lib/phase-engine.js --detect --files 3 --lines 120 --brownfield
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = process.cwd();
const DEVFLOW_DIR = path.join(WORKSPACE, '.devflow');
const MEMORY_FILE = path.join(DEVFLOW_DIR, 'state.json');

/** 由工作区目录派生状态文件路径（供实例隔离使用，避免测试污染真实 .devflow/） */
function pathsFor(workspaceDir) {
  const devflowDir = path.join(workspaceDir, '.devflow');
  return { devflowDir, memoryFile: path.join(devflowDir, 'state.json') };
}

/**
 * DevFlow Phase Engine — 完整门控管线
 *
 * 门控体系 (与 references/gate-rules.md 对齐):
 *   G0: Strategy Gate      — Phase 0 产出后
 *   G1: Analysis Gate      — Phase 1 5Whys 完成后 (auto)
 *   G2: Architecture Gate  — Phase 1 需求范围确认 (manual)
 *   G2.5: Discussion Gate  — Phase 1b/决策捕获
 *   G3: Design Gate        — Phase 2 设计完成后
 *   G3.5: Shotgun Gate     — Phase 2a 变体选择
 *   G4: Task Plan Gate     — Phase 3 任务拆分后
 *   G5: Build Gate         — Phase 4 构建前（需人工确认）
 *   G6: Test Gate          — Phase 5 测试达标
 *   G7: Review Gate        — Phase 6 审查完成
 *   G7.5: Canary Gate      — Phase 7 灰度发布前
 *   G8: Archive Gate       — Phase 8 归档完成后
 *
 * 共 12 个门控: G0-G8 + G2/G2.5/G3.5/G7.5
 */

const PHASES = [
  // ===== 战略分析阶段 (standard/strict 必须) =====
  { id: 0, name: 'YC六问战略评估', gate: 'G0', output: '00-strategy.md', modes: ['standard', 'strict'], skip: ['fast', 'lean'] },
  { id: 1, name: '5 Whys需求追问', gate: 'G1', output: '01-analysis.md', modes: ['standard', 'strict'], skip: ['fast', 'lean'], extraGates: ['G2'] },

  // ===== Phase 1b: 决策捕获讨论 (文档称 Phase 1b / G2.5, id=1.5用于排序) =====
  { id: 1.5, name: '决策捕获讨论 (Phase 1b)', gate: 'G2.5', output: '01b-context.md', modes: ['standard', 'strict'], skip: ['fast', 'lean'] },

  // ===== 方案设计阶段 =====
  // Lean: 轻量方案设计; Fast: 跳过 (直接 Phase 4)
  { id: 2, name: '方案设计', gate: 'G3', output: '02-design.md', modes: ['lean', 'standard', 'strict'], skip: ['fast'] },
  { id: 2.5, name: '设计枪战变体 (Phase 2a)', gate: 'G3.5', output: '02a-variants.md', modes: ['standard', 'strict'], skip: ['fast', 'lean'] },

  // ===== 任务规划阶段 (仅 strict 必须) =====
  // Standard 跳过 Phase 3, Phase 4 可无 03-tasks.md 产物 (Fast/Lean 同理)
  { id: 3, name: 'DAG任务拆分', gate: 'G4', output: '03-tasks.md', modes: ['strict'], skip: ['fast', 'lean', 'standard'] },

  // ===== 构建实施阶段 =====
  { id: 4, name: '实施 Wave并行', gate: 'G5', output: '04-wave-logs.md', modes: ['fast', 'lean', 'standard', 'strict'], skip: [] },

  // ===== 测试验证阶段 =====
  { id: 5, name: '测试验证', gate: 'G6', output: '05-test-report.md', modes: ['fast', 'lean', 'standard', 'strict'], skip: [] },

  // ===== 审查阶段 =====
  // Fast/Lean: 自检清单; Standard/Strict: 三层对抗审查
  { id: 6, name: '审查 (自检/三层对抗)', gate: 'G7', output: '06-review.md', modes: ['fast', 'lean', 'standard', 'strict'], skip: [] },

  // ===== Phase 7: 灰度发布 =====
  { id: 7, name: 'Canary灰度发布', gate: 'G7.5', output: '07-canary.md', modes: ['standard', 'strict'], skip: ['fast', 'lean'] },

  // ===== Phase 8: 归档阶段 =====
  // Fast: 简要归档; Lean: 归档到 LESSONS; Standard/Strict: 完整 Canary+归档
  { id: 8, name: '归档与经验沉淀', gate: 'G8', output: '08-archive.md', modes: ['lean', 'standard', 'strict'], skip: ['fast'] },
];

/**
 * 门控定义 — 与 references/gate-rules.md 完全对齐
 */
const GATES = [
  { id: 'G0', name: 'Strategy Gate', phaseAfter: 0, type: 'auto' },
  { id: 'G1', name: 'Analysis Gate (5Whys)', phaseAfter: 1, type: 'auto', reason: '5Whys 根因分析完成' },
  { id: 'G2', name: 'Architecture Gate', phaseAfter: 1, type: 'manual', reason: '需求范围最终确认' },
  { id: 'G2.5', name: 'Discussion Gate (Phase 1b)', phaseAfter: 1.5, type: 'manual', reason: '决策覆盖率确认' },
  { id: 'G3', name: 'Design Gate', phaseAfter: 2, type: 'manual', reason: '技术栈/架构方向锁定' },
  { id: 'G3.5', name: 'Shotgun Gate (Phase 2a)', phaseAfter: 2.5, type: 'manual', reason: '设计变体选择' },
  { id: 'G4', name: 'Task Plan Gate', phaseAfter: 3, type: 'auto' },
  { id: 'G5', name: 'Build Gate', phaseAfter: 4, type: 'manual', reason: '新依赖/schema/迁移/删除文件需人工确认' },
  { id: 'G6', name: 'Test Gate', phaseAfter: 5, type: 'auto', reason: 'AC覆盖率 ≥ 90%' },
  { id: 'G7', name: 'Review Gate', phaseAfter: 6, type: 'manual', reason: '接受 Critical review 发现而不修复需确认' },
  { id: 'G7.5', name: 'Canary Gate', phaseAfter: 7, type: 'manual', reason: 'CI/CD、部署、生产发布、不可逆操作' },
  { id: 'G8', name: 'Archive Gate', phaseAfter: 8, type: 'auto' },
];

class PhaseEngine {
  /**
   * @param {string} [workspaceDir] 工作区根目录，默认 process.cwd()。
   *   显式传入可将状态隔离到独立目录 —— 测试必须传临时目录，
   *   否则会覆写用户真实的 .devflow/state.json。
   */
  constructor(workspaceDir = WORKSPACE) {
    this.workspace = workspaceDir;
    const { devflowDir, memoryFile } = pathsFor(workspaceDir);
    this.devflowDir = devflowDir;
    this.memoryFile = memoryFile;
    fs.mkdirSync(devflowDir, { recursive: true });
    this.state = this._loadState();
  }

  _loadState() {
    let raw;
    try {
      raw = fs.readFileSync(this.memoryFile, 'utf-8');
    } catch {
      // 文件不存在 → 全新状态
      return { currentPhase: 0, gates: {}, outputs: {}, mode: null, skips: [], createdAt: new Date().toISOString() };
    }
    try {
      const parsed = JSON.parse(raw);
      // 合并默认字段，确保旧状态兼容
      return {
        currentPhase: parsed.currentPhase ?? parsed.phase ?? 0,
        gates: parsed.gates || {},
        outputs: parsed.outputs || {},
        mode: parsed.mode || null,
        skips: Array.isArray(parsed.skips) ? parsed.skips : [],
        createdAt: parsed.createdAt || parsed.initializedAt || new Date().toISOString(),
      };
    } catch (e) {
      // 状态损坏：先备份原文件再重建，绝不静默清零（已过门控历史可从备份追溯）
      const backup = `${this.memoryFile}.corrupt-${Date.now()}`;
      try { fs.copyFileSync(this.memoryFile, backup); } catch { /* 备份失败不阻断重建 */ }
      console.error(`⚠️ .devflow/state.json 损坏 (${e.message})。已备份到 ${path.basename(backup)}，状态将重新初始化。`);
      return { currentPhase: 0, gates: {}, outputs: {}, mode: null, skips: [], createdAt: new Date().toISOString() };
    }
  }

  _saveState() {
    this.state.updatedAt = new Date().toISOString();
    // 原子写：先写临时文件再 rename，避免并发/中断产生截断 JSON（损坏会被 _loadState 备份重建）
    const tmp = `${this.memoryFile}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.state, null, 2));
    fs.renameSync(tmp, this.memoryFile);
  }

  setMode(mode) {
    if (!['fast', 'lean', 'standard', 'strict'].includes(mode)) {
      throw new Error(`无效模式: ${mode}。使用 fast/lean/standard/strict`);
    }
    this.state.mode = mode;
    // Fast: Phase 4; Lean: Phase 2; Standard/Strict: Phase 0
    const startPhaseMap = { fast: 4, lean: 2, standard: 0, strict: 0 };
    this.state.currentPhase = startPhaseMap[mode];
    this._saveState();
    return { mode, startPhase: this.state.currentPhase };
  }

  canSkip(phaseId, mode) {
    const phase = PHASES.find(p => p.id === phaseId);
    if (!phase) return false;
    return phase.skip.includes(mode);
  }

  /**
   * 自动门控护卫 — 验证当前 Phase 的门控是否已通过
   * 若 gate 未通过、返回 blocked 状态（绕过需 user 确认）
   */
  _verifyCurrentGate() {
    const phase = this.current();
    // 当前 Phase 在本模式下被跳过时（模式切换残留 / force 落点），其门控不适用，不拦截推进
    if (this.canSkip(phase.id, this.mode)) return { passed: true, reason: `Phase ${phase.id} 在 ${this.mode} 模式下被跳过` };
    const gatesForPhase = [phase.gate, ...(phase.extraGates || [])];
    const missed = gatesForPhase.filter(gid => !this.state.gates[gid]);
    if (missed.length === 0) return { passed: true };

    const names = missed.map(gid => {
      const g = GATES.find(x => x.id === gid);
      return g ? `${gid} (${g.name})` : gid;
    });
    return {
      passed: false,
      reason: `Phase ${phase.id} 门控未通过: ${names.join(', ')}. 请先调用 outputWritten()/gatePassed() 通过门控后再推进。`,
      missed,
    };
  }

  /** 归一化模式：未设置时按 standard，与 activePhases()/status() 保持同一口径 */
  get mode() {
    return this.state.mode || 'standard';
  }

  nextPhase({ force } = {}) {
    // 历史 bug: 此处直取 this.state.mode，null 时 canSkip 全 false → 走 strict 的 11 相，
    // 而 activePhases()/status() 默认 standard 的 10 相，导致进度分母与导航错位。
    const mode = this.mode;
    const current = this.state.currentPhase;

    // === 自动门控守卫（除非 force=true）===
    if (!force) {
      const gateCheck = this._verifyCurrentGate();
      if (!gateCheck.passed) {
        return { blocked: true, reason: gateCheck.reason, currentPhase: current };
      }
    }
    // =================================

    const ordered = PHASES.filter(p => !this.canSkip(p.id, mode)).sort((a, b) => a.id - b.id);

    const idx = ordered.findIndex(p => p.id === current);
    if (idx < 0 && ordered.length > 0) {
      this.state.currentPhase = ordered[0].id;
    } else if (idx >= 0 && idx < ordered.length - 1) {
      this.state.currentPhase = ordered[idx + 1].id;
    }
    // else stay at last phase

    this._saveState();
    return this.current();
  }

  current() {
    const phase = PHASES.find(p => p.id === this.state.currentPhase);
    if (!phase) return PHASES[0]; // default to Phase 0 (strategy first)
    return phase;
  }

  activePhases() {
    return PHASES.filter(p => !this.canSkip(p.id, this.mode));
  }

  /**
   * 切换到指定 Phase。
   *
   * 门控强制（与 SKILL.md R5 对齐）：
   *   - 后向跳跃（回看已完成阶段）自由；
   *   - 前向跳跃必须校验途经所有 Phase 的门控（current 不含 → target 不含），
   *     任一未通过即拒绝 —— 防止用 --set 绕过整个门控体系直达实施阶段；
   *   - `--force` 是显式逃生阀（对应用户显式确认/R6），每次强制跳过都会
   *     记录到 state.skips（from/to/at），供 [COMPLIANCE] 声明与审计追溯。
   */
  setPhase(phaseId, { force } = {}) {
    const target = typeof phaseId === 'string' ? parseFloat(phaseId) : phaseId;
    const phase = PHASES.find(p => p.id === target);
    if (!phase) {
      const valid = PHASES.map(p => p.id).join(', ');
      throw new Error(`未知 Phase: ${phaseId}（有效值: ${valid}）`);
    }

    const mode = this.mode;
    if (this.canSkip(target, mode) && !force) {
      throw new Error(`Phase ${target} (${phase.name}) 在 ${mode.toUpperCase()} 模式下被跳过。加 --force 可强制切换。`);
    }

    // 前向门控校验：途经任一门控未通过则拒绝（除非 force）
    const ordered = PHASES.filter(p => !this.canSkip(p.id, mode)).sort((a, b) => a.id - b.id);
    const idxCur = ordered.findIndex(p => p.id === this.state.currentPhase);
    const idxTgt = ordered.findIndex(p => p.id === target);
    let missed = [];
    if (idxTgt > idxCur) {
      for (let i = Math.max(idxCur, 0); i < idxTgt; i++) {
        for (const gid of [ordered[i].gate, ...(ordered[i].extraGates || [])]) {
          if (!this.state.gates[gid]) missed.push(gid);
        }
      }
    }
    if (missed.length > 0 && !force) {
      throw new Error(`前向跳跃被门控拦截: ${missed.join(', ')} 未通过。请按序推进（--next），或经用户确认后用 --force 显式跳过（将记录到 state.skips）。`);
    }

    // 审计记录：跨模式跳过 或 越过未过门控 的强制切换
    const crossedSkippedPhase = this.canSkip(target, mode);
    if (force && (crossedSkippedPhase || missed.length > 0)) {
      this.state.skips = this.state.skips || [];
      this.state.skips.push({
        from: this.state.currentPhase, to: target, at: new Date().toISOString(),
        crossedGates: missed, crossedSkippedPhase,
      });
    }

    this.state.currentPhase = target;
    this._saveState();
    return { phase: target, name: phase.name, mode, output: phase.output };
  }

  gatePassed(gateId) {
    const gate = GATES.find(g => g.id === gateId);
    if (!gate) throw new Error(`未知门控: ${gateId}`);
    this.state.gates[gateId] = { passed: true, at: new Date().toISOString(), type: gate.type };
    this._saveState();
  }

  /**
   * 检查当前阶段后的门控是否已全部关闭（通过）
   *
   * 注意: 一个 Phase 可能挂多个门控（Phase 1 同时挂 G1 + G2），
   * 必须用 filter 全量校验 —— 历史实现用 find 只取首个，G2 被永久漏检。
   */
  currentGateClosed() {
    const phase = this.current();
    const gatesAfter = GATES.filter(g => g.phaseAfter === phase.id);
    if (gatesAfter.length === 0) return true; // 最后一个 phase，无后续门控
    return gatesAfter.every(g => !!this.state.gates[g.id]);
  }

  /**
   * 检查是否有剩余人工确认门控
   *
   * 必须按当前模式过滤：fast 模式下 Phase 1/7 等被跳过，
   * 其门控（G2/G7.5）永远不可能通过，否则会恒定误报。
   */
  hasPendingManualGates() {
    const mode = this.mode;
    const activeIds = this.activePhases().map(p => p.id);
    for (const gate of GATES) {
      if (gate.type !== 'manual') continue;
      if (!activeIds.includes(gate.phaseAfter)) continue; // 该门控所属 Phase 在本模式被跳过
      if (!this.state.gates[gate.id]) return gate;
    }
    return null; // 无剩余人工门控
  }

  /**
   * 记录 Phase 产物并通过其主门控。
   *
   * CONSTITUTION 原则 #1（产物先于声称）在此硬校验：
   *   - filePath 必填（不允许无产物空过门控）；
   *   - 文件必须真实存在且是普通文件（目录/软链不存在均拒绝）；
   *   - 文件名必须等于该 Phase 的预期产物名（basename === phase.output），
   *     拿 README.md 冒充 02-design.md 无法通过（防伪造产物名）。
   * 人工门控（如 G2/G3/G5）不依赖产物，仍走 gatePassed() 显式标记。
   */
  outputWritten(phaseId, filePath) {
    const phase = PHASES.find(p => p.id === phaseId);
    if (!phase) {
      throw new Error(`未知 Phase: ${phaseId}（有效值: ${PHASES.map(p => p.id).join(', ')}）`);
    }
    if (!filePath) {
      throw new Error(`缺少产物路径。Phase ${phase.id} 需要产出 ${phase.output} 后才能过 ${phase.gate}（CONSTITUTION: 产物先于声称）。`);
    }
    const resolved = path.resolve(String(filePath));
    if (!fs.existsSync(resolved)) {
      throw new Error(`产物文件不存在: ${resolved}。请先创建该产物，再标记门控通过（CONSTITUTION: 产物先于声称）。`);
    }
    if (!fs.statSync(resolved).isFile()) {
      throw new Error(`产物路径不是文件: ${resolved}`);
    }
    const base = path.basename(resolved);
    if (base !== phase.output) {
      throw new Error(`产物文件名不符: Phase ${phase.id} 期望 ${phase.output}，实际 ${base}。产物名是门控链的单一来源，不可替代。`);
    }
    this.state.outputs[phase.output] = { path: resolved, at: new Date().toISOString() };
    this.gatePassed(phase.gate);
  }

  status() {
    const mode = this.state.mode || '未设置';
    const current = this.current();
    const active = this.activePhases();

    // 找出剩余人工门控
    const pendingGate = this.hasPendingManualGates();
    // 检查当前门控状态
    const gateCheck = this._verifyCurrentGate();

    const idx = active.findIndex(p => p.id === current.id);
    return {
      mode,
      currentPhase: current.id,
      currentName: current.name,
      progress: `${idx < 0 ? '-' : idx + 1}/${active.length}`,
      gates: this.state.gates,
      outputs: this.state.outputs,
      skips: this.state.skips || [],
      pendingManualGate: pendingGate ? { id: pendingGate.id, name: pendingGate.name, reason: pendingGate.reason } : null,
      gateCompliant: gateCheck.passed,
      gateStatus: gateCheck.passed ? '✅ 当前门控已通过' : `⛔ ${gateCheck.reason}`,
    };
  }

  listPhases(mode) {
    const m = mode || this.mode;
    return PHASES.map(p => ({
      ...p,
      active: !this.canSkip(p.id, m),
    }));
  }

  /**
   * 列出所有门控定义（含类型、通过状态）
   */
  listGates() {
    const statusList = GATES.map(g => ({
      id: g.id,
      name: g.name,
      phaseAfter: g.phaseAfter,
      type: g.type,
      reason: g.reason || null,
      passed: !!this.state.gates[g.id],
    }));
    return statusList;
  }

  /**
   * 获取门控详情（含通过条件）
   */
  gateInfo(gateId) {
    const gate = GATES.find(g => g.id === gateId);
    if (!gate) throw new Error(`未知门控: ${gateId}`);
    return {
      ...gate,
      passed: !!this.state.gates[gateId],
      phaseOutput: PHASES.find(p => p.id === gate.phaseAfter)?.output || null,
    };
  }
}

/** 模式判定阈值 —— 与 SKILL.md Step 1.5 / GO.md Step 0.5 的表格保持单一来源 */
const MODE_THRESHOLDS = {
  fast:     { maxFiles: 2,  maxLines: 50,  requiresBrownfield: false },
  lean:     { maxFiles: 5,  maxLines: 300, requiresBrownfield: true  },
  standard: { maxFiles: 10, maxLines: 500, requiresBrownfield: false },
  strict:   { maxModules: 3 },
};

/**
 * 模式自动判定 —— 实现 SKILL.md Step 1.5 与 GO.md Step 0.5 声明的四档阈值。
 *
 * ⚠️ 历史 bug: 文档公开宣称了阈值表格，但全项目无任何 detectMode 实现，
 * 模式只能手工 setMode()。现补齐实现，使文档与代码一致。
 *
 * @param {object} s 规模与风险信号
 * @param {number} s.files                改动文件数
 * @param {number} s.lines                改动行数
 * @param {number} s.modules              涉及模块数
 * @param {string} s.risk                 low | medium | high
 * @param {boolean} s.brownfield          已有代码库（Lean 的前提）
 * @param {boolean} s.architectureChange 架构变更 → Strict
 * @param {boolean} s.dataModelChange    数据模型变更 → Strict
 * @returns {{mode: string, reason: string, matched: string}}
 */
function detectMode(s = {}) {
  const files = s.files, lines = s.lines, modules = s.modules;
  const risk = (s.risk || '').toLowerCase();

  // 1) Strict 优先：结构性/高风险变更，与规模无关
  if (s.architectureChange) return { mode: 'strict', reason: '架构变更', matched: 'architectureChange' };
  if (s.dataModelChange) return { mode: 'strict', reason: '数据模型变更', matched: 'dataModelChange' };
  if (risk === 'high') return { mode: 'strict', reason: '高风险', matched: 'risk=high' };
  const T0 = MODE_THRESHOLDS;
  if (typeof modules === 'number' && modules > T0.strict.maxModules) {
    return { mode: 'strict', reason: `涉及 ${modules} 个模块 (>${T0.strict.maxModules})`, matched: `modules>${T0.strict.maxModules}` };
  }

  const hasScale = typeof files === 'number' || typeof lines === 'number';
  if (hasScale) {
    const f = typeof files === 'number' ? files : Infinity;
    const l = typeof lines === 'number' ? lines : Infinity;
    const T = MODE_THRESHOLDS;

    // 2) Greenfield：全新空项目（非 brownfield 且无既有代码）→ 必跑 Phase 0，
    //    与 GO.md 路由表 "'我想做一个XX'从零开始 → 必跑 Phase 0" 对齐。
    //    （阈值表衡量的是"改动规模"，0 文件 0 行的空目录不能据此判 Fast。）
    if (s.brownfield === false && f === 0 && l === 0) {
      return { mode: 'standard', reason: '全新空项目（greenfield）— 从零开始必跑 Phase 0', matched: 'greenfield' };
    }

    // 3) Fast: ≤2 文件 且 <50 行
    if (f <= T.fast.maxFiles && l < T.fast.maxLines) {
      return { mode: 'fast', reason: `${f} 文件 / ${l} 行`, matched: `files<=${T.fast.maxFiles} && lines<${T.fast.maxLines}` };
    }
    // 4) Lean: ≤5 文件 且 <300 行 且 brownfield（阈值表声明的其他条件在此生效）
    if (f <= T.lean.maxFiles && l < T.lean.maxLines && (!T.lean.requiresBrownfield || s.brownfield)) {
      return { mode: 'lean', reason: `${f} 文件 / ${l} 行${s.brownfield ? ' / brownfield' : ''}`, matched: `files<=${T.lean.maxFiles} && lines<${T.lean.maxLines}${T.lean.requiresBrownfield ? ' && brownfield' : ''}` };
    }
    // 5) Standard: ≤10 文件 且 <500 行
    if (f <= T.standard.maxFiles && l < T.standard.maxLines) {
      return { mode: 'standard', reason: `${f} 文件 / ${l} 行`, matched: `files<=${T.standard.maxFiles} && lines<${T.standard.maxLines}` };
    }
    // 6) 超规模 → Strict
    return { mode: 'strict', reason: `超出 Standard 规模 (${f} 文件 / ${l} 行)`, matched: 'scale>standard' };
  }

  // 无规模信号时按风险降级判定
  if (risk === 'low') return { mode: 'fast', reason: '低风险且未提供规模信号', matched: 'risk=low' };
  return { mode: 'standard', reason: '默认（规模与风险信号不足）', matched: 'default' };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--phase') opts.phase = parseFloat(args[++i]);
    else if (args[i] === '--mode') opts.mode = args[++i];
    else if (args[i] === '--status') opts.status = true;
    else if (args[i] === '--list') opts.list = true;
    else if (args[i] === '--next') opts.next = true;
    else if (args[i] === '--force-next') opts.next = true, opts.forceNext = true;
    else if (args[i] === '--gate') opts.gate = args[++i];
    else if (args[i] === '--output') opts.output = args[++i];
    else if (args[i] === '--json') opts.json = true;
    else if (args[i] === '--force') opts.force = true;
    // detectMode 信号
    else if (args[i] === '--detect') opts.detect = true;
    else if (args[i] === '--files') opts.files = parseInt(args[++i], 10);
    else if (args[i] === '--lines') opts.lines = parseInt(args[++i], 10);
    else if (args[i] === '--modules') opts.modules = parseInt(args[++i], 10);
    else if (args[i] === '--risk') opts.risk = args[++i];
    else if (args[i] === '--brownfield') opts.brownfield = true;
    else if (args[i] === '--arch-change') opts.architectureChange = true;
    else if (args[i] === '--data-change') opts.dataModelChange = true;
    else if (args[i] === '--dir') opts.dir = args[++i];
  }
  return opts;
}

function main() {
  const opts = parseArgs();
  const engine = new PhaseEngine(opts.dir ? path.resolve(opts.dir) : WORKSPACE);

  if (opts.status) {
    const s = engine.status();
    const output = opts.json ? JSON.stringify(s, null, 2) : formatStatus(s);
    console.log(output);
    return;
  }

  if (opts.list) {
    const displayMode = opts.mode || engine.mode;
    const phases = engine.listPhases(opts.mode);
    const output = opts.json ? JSON.stringify(phases, null, 2) : formatPhaseList(phases, displayMode);
    console.log(output);
    return;
  }

  if (opts.next) {
    const phase = engine.nextPhase({ force: !!opts.forceNext });
    if (phase.blocked) {
      console.log(`⛔ 阻止推进: ${phase.reason}`);
      process.exit(1);
    }
    console.log(opts.json ? JSON.stringify(phase, null, 2) : `下一阶段: Phase ${phase.id} — ${phase.name}`);
    return;
  }

  // --detect: 依据规模/风险信号自动判定模式（SKILL.md Step 1.5 / GO.md Step 0.5）
  if (opts.detect) {
    const d = detectMode({
      files: opts.files,
      lines: opts.lines,
      modules: opts.modules,
      risk: opts.risk,
      brownfield: opts.brownfield,
      architectureChange: opts.architectureChange,
      dataModelChange: opts.dataModelChange,
    });
    if (opts.json) { console.log(JSON.stringify(d, null, 2)); return; }
    console.log(`🎯 建议模式: ${d.mode.toUpperCase()}`);
    console.log(`   理由: ${d.reason}`);
    console.log(`   命中规则: ${d.matched}`);
    return;
  }

  // --mode 与 --phase 可组合：先设模式（会重置起始 Phase），再切 Phase
  if (opts.mode || opts.phase !== undefined) {
    const parts = [];
    if (opts.mode) {
      const result = engine.setMode(opts.mode);
      parts.push(`模式设为: ${opts.mode.toUpperCase()}, 起始 Phase ${result.startPhase}`);
    }
    if (opts.phase !== undefined) {
      try {
        const r = engine.setPhase(opts.phase, { force: !!opts.force });
        parts.push(`当前 Phase: ${r.phase} — ${r.name}（产物: ${r.output}）`);
      } catch (e) {
        console.error(`❌ ${e.message}`);
        process.exit(1);
      }
    }
    console.log(opts.json ? JSON.stringify(engine.status(), null, 2) : parts.join('\n'));
    return;
  }

  if (opts.gate) {
    engine.gatePassed(opts.gate);
    console.log(`门控 ${opts.gate} 已标记通过`);
    return;
  }

  if (opts.output) {
    const filePath = path.resolve(opts.output);
    const phase = engine.current();
    try {
      engine.outputWritten(phase.id, filePath);
    } catch (e) {
      console.error(`❌ ${e.message}`);
      process.exit(1);
    }
    // 产出后自动验证门控
    const afterCheck = engine._verifyCurrentGate();
    if (afterCheck.passed) {
      console.log(`Phase ${phase.id} 产出已记录: ${filePath}`);
      console.log(`Phase ${phase.id} 门控已通过 ✅`);
    } else {
      console.log(`Phase ${phase.id} 产出已记录: ${filePath}`);
      console.log(`⚠️ 仍有门控未通过: ${afterCheck.reason}`);
    }
    return;
  }

  // Default: show current status
  console.log(formatStatus(engine.status()));
}

function formatStatus(s) {
  const lines = [
    `DevFlow Phase 状态`,
    `  模式: ${s.mode}`,
    `  当前: Phase ${s.currentPhase} — ${s.currentName}`,
    `  进度: ${s.progress}`,
    `  门控: ${Object.keys(s.gates).length} 个已通过`,
    `  产出: ${Object.keys(s.outputs).length} 个已记录`,
  ];
  if ((s.skips || []).length > 0) {
    lines.push(`  跳过审计: ${s.skips.length} 次 --force 强制跳过（详见 state.json skips）`);
  }
  lines.push(`  门控合规: ${s.gateCompliant ? '✅' : '⛔ ' + s.gateStatus}`);
  return lines.join('\n');
}

function formatPhaseList(phases, mode) {
  const lines = [`DevFlow Phase 管线 (模式: ${mode || '未设置'})`];
  phases.forEach(p => {
    const status = p.active ? '' : ' [跳过]';
    lines.push(`  Phase ${p.id} ${p.name.padEnd(20)} ${p.gate.padEnd(6)} ${p.output.padEnd(20)}${status}`);
  });
  return lines.join('\n');
}

if (require.main === module) main();
module.exports = { PhaseEngine, PHASES, GATES, detectMode, MODE_THRESHOLDS };
