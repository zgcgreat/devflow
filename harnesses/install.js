#!/usr/bin/env node
/**
 * DevFlow Installer — 把 DevFlow 安装到各 AI 编码运行时
 *
 * 用法:
 *   node harnesses/install.js                      安装到默认目标 (workbuddy)
 *   node harnesses/install.js --target <name>      指定目标
 *   node harnesses/install.js --dry-run            只打印计划，不做任何写入
 *   node harnesses/install.js --list               列出所有目标与安装状态
 *   node harnesses/install.js --status             读取安装状态文件
 *   node harnesses/install.js --uninstall          卸载当前目标
 *
 * ⚠️ 历史 bug (v3.3.0 及以前):
 *   1. TARGETS 只有 workbuddy，但 HELP/README/cli-reference 三处都宣称支持
 *      `--target cursor|claude` —— 传 cursor 会**静默**装到 WorkBuddy。
 *   2. 复制清单是硬编码的 19 个文件，**不含 lib/ bin/ layers/ references/
 *      personas/ rules/** —— 而 SKILL.md 明确要求 AI 按需加载
 *      `layers/L1-INTERACTION/phase-<N>/_SKILL.md` 与 `lib/phase-engine.js`。
 *      也就是说：旧版重跑一次会把一个可用的安装降级成残缺安装。
 *   现改为整目录复制（排除 .git/.devflow/node_modules 等），并把未实现的
 *   目标显式拒绝，而不是静默装错地方。
 *
 * 安全性:
 *   - 默认不删除任何目标目录。仅当目标目录内存在本安装器写入的 state 文件
 *     （证明"这是 DevFlow 装出来的"）时，才清理源中已不存在的陈旧文件。
 *   - 目标目录是符号链接/junction 时只删除链接本身，绝不递归删除其指向的真实内容。
 *   - 目标已存在且无 state 文件（来源不明）时拒绝安装，需显式 --force。
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const DEVFLOW_ROOT = path.resolve(__dirname, '..');
const HOME = os.homedir();

const VERSION = JSON.parse(fs.readFileSync(path.join(DEVFLOW_ROOT, 'package.json'), 'utf8')).version;

/** 安装状态文件名（写入目标目录的父目录，避免污染技能目录内容）。 */
const STATE_FILE = '.devflow-install-state.json';

/** 复制时排除的目录名（任意层级） */
const EXCLUDE_DIRS = new Set([
  '.git', '.devflow', 'node_modules', 'dist', 'build', 'coverage', 'sources', 'out', 'target', '.cache',
]);

/** 复制时排除的文件名（任意层级） */
const EXCLUDE_FILES = new Set([STATE_FILE, '.DS_Store', 'Thumbs.db']);

// ─── 目标定义 ───────────────────────────────────────────

/**
 * kind 语义:
 *   bundle   — 整目录复制整个 DevFlow 仓库（Skill 形态）
 *   junction — 建立指向本仓库的链接（源码改动实时生效，无需重装）
 *   manual   — 布局未经核实，拒绝自动安装并指向 adapters/<宿主>/install.md
 */
const TARGETS = {
  workbuddy: {
    label: 'WorkBuddy',
    kind: 'bundle',
    dir: () => path.join(HOME, '.workbuddy', 'skills', 'devflow'),
    note: 'WorkBuddy 用户级技能目录',
  },
  claude: {
    label: 'Claude Code',
    kind: 'bundle',
    dir: () => path.join(HOME, '.claude', 'skills', 'devflow'),
    note: 'Claude Code 用户级技能目录',
  },
  dsh: {
    label: 'DeepSeek Harness',
    kind: 'junction',
    aliases: ['deepseek-harness'],
    dir: () => path.join(HOME, '.agents', 'skills', 'devflow'),
    note: 'DSH 技能根 (rank 500)；链接到本仓库，源码改动实时生效',
    followUp: '门控插件需另行挂载：见 adapters/deepseek-harness/install.md 步骤 2',
  },
  cursor: { label: 'Cursor', kind: 'manual', adapter: 'cursor' },
  copilot: { label: 'GitHub Copilot', kind: 'manual', adapter: 'copilot' },
  codex: { label: 'OpenAI Codex', kind: 'manual', adapter: 'codex' },
  'gemini-cli': { label: 'Gemini CLI', kind: 'manual', adapter: 'gemini-cli' },
};

const DEFAULT_TARGET = 'workbuddy';

/** 解析目标名（含别名）。返回 { name, target } 或抛出可读错误。 */
function resolveTarget(name) {
  const key = String(name || '').toLowerCase();
  if (TARGETS[key]) return { name: key, target: TARGETS[key] };
  for (const [k, t] of Object.entries(TARGETS)) {
    if (Array.isArray(t.aliases) && t.aliases.includes(key)) return { name: k, target: t };
  }
  throw new Error(`未知目标: "${name}"。可用: ${Object.keys(TARGETS).join(', ')}`);
}

// ─── 源文件枚举 ─────────────────────────────────────────

/** 递归枚举仓库内可安装文件，返回相对路径数组（已排序，便于比对）。 */
function listSourceFiles(root = DEVFLOW_ROOT) {
  const out = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch { return; }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (EXCLUDE_DIRS.has(entry.name)) continue;
        walk(path.join(dir, entry.name));
      } else if (entry.isFile()) {
        if (EXCLUDE_FILES.has(entry.name)) continue;
        out.push(path.relative(root, path.join(dir, entry.name)));
      }
    }
  };
  walk(root);
  return out.sort();
}

// ─── 状态文件 ───────────────────────────────────────────

function statePathFor(targetDir) {
  return path.join(path.dirname(targetDir), STATE_FILE);
}

function readState(targetDir) {
  try {
    return JSON.parse(fs.readFileSync(statePathFor(targetDir), 'utf8'));
  } catch {
    return null;
  }
}

function writeState(targetDir, state, dryRun) {
  if (dryRun) return;
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  fs.writeFileSync(statePathFor(targetDir), JSON.stringify(state, null, 2));
}

function isLink(p) {
  try {
    return fs.lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
}

/** 读取链接目标；损坏链接（readlink 失败）显示为 <broken-link>，不抛错。 */
function readLinkSafe(p) {
  try {
    return fs.readlinkSync(p);
  } catch {
    return '<broken-link>';
  }
}

// ─── 安装动作 ───────────────────────────────────────────

/** bundle 目标：整目录复制 + 清理陈旧文件。 */
function installBundle(targetDir, dryRun, force) {
  const files = listSourceFiles();
  const existed = fs.existsSync(targetDir);
  const state = readState(targetDir);
  const actions = [];
  let written = 0;
  let removed = 0;

  if (isLink(targetDir)) {
    throw new Error(
      `目标 ${targetDir} 是符号链接/junction，bundle 安装会写穿链接。\n` +
      `请先移除链接（或改用 --target dsh 的 junction 模式）。`
    );
  }

  // 来源不明的既有目录：拒绝静默覆盖
  if (existed && !state && !force) {
    throw new Error(
      `目标已存在且没有 DevFlow 安装状态文件，来源不明，拒绝覆盖:\n  ${targetDir}\n` +
      `确认无误后加 --force 重试，或先手工备份该目录。`
    );
  }

  if (!dryRun) fs.mkdirSync(targetDir, { recursive: true });

  for (const rel of files) {
    const src = path.join(DEVFLOW_ROOT, rel);
    const dst = path.join(targetDir, rel);
    const dstDir = path.dirname(dst);
    if (!dryRun) {
      fs.mkdirSync(dstDir, { recursive: true });
      fs.copyFileSync(src, dst);
    }
    written++;
    if (actions.length < 8) actions.push(`  + ${rel}`);
  }
  if (files.length > 8) actions.push(`  … 其余 ${files.length - 8} 个文件`);

  // 仅当有 state 证明"这是 DevFlow 装出来的"时，才删除源中已不存在的陈旧文件
  let removedList = [];
  if (state && Array.isArray(state.files)) {
    const current = new Set(files);
    for (const rel of state.files) {
      if (current.has(rel)) continue;
      const dst = path.join(targetDir, rel);
      if (!fs.existsSync(dst)) continue;
      removedList.push(rel);
      if (!dryRun) {
        fs.rmSync(dst, { force: true });
        // best-effort: 一并清理因此变空的父目录（不删除目标根目录本身，失败静默跳过）
        let parent = path.dirname(dst);
        while (true) {
          const rel = path.relative(targetDir, parent);
          if (!rel || rel.startsWith('..')) break; // 已到达/越过目标根
          try {
            if (fs.readdirSync(parent).length > 0) break;
            fs.rmdirSync(parent);
          } catch { break; }
          parent = path.dirname(parent);
        }
      }
      removed++;
    }
  }

  writeState(targetDir, { version: VERSION, target: 'bundle', installedAt: new Date().toISOString(), files }, dryRun);

  return {
    summary: `${written} 个文件写入${removed ? `，${removed} 个陈旧文件清理` : ''}`,
    restoredFrom: existed && state ? `（覆盖 ${state.version} 的既有安装）` : '',
    details: [...actions, ...removedList.slice(0, 5).map(r => `  - ${r}`)],
  };
}

/** junction 目标：建立指向本仓库的链接，不做复制。 */
function installJunction(targetDir, dryRun) {
  if (fs.existsSync(targetDir) || isLink(targetDir)) {
    if (isLink(targetDir)) {
      const current = fs.readlinkSync(targetDir);
      if (path.resolve(current) === DEVFLOW_ROOT) {
        return { summary: '链接已存在且指向本仓库，无需改动', details: [`  = ${targetDir} -> ${DEVFLOW_ROOT}`] };
      }
      throw new Error(`目标 ${targetDir} 已是链接，但指向 ${current}（非本仓库）。请先移除后重试。`);
    }
    throw new Error(`目标 ${targetDir} 是真实目录。junction 模式不会覆盖它；请先手工移除或改用 --target workbuddy。`);
  }

  const type = process.platform === 'win32' ? 'junction' : 'dir';
  if (!dryRun) {
    fs.mkdirSync(path.dirname(targetDir), { recursive: true });
    fs.symlinkSync(DEVFLOW_ROOT, targetDir, type);
  }
  return {
    summary: `已建立链接（源码改动实时生效，无需重装）`,
    details: [`  ${targetDir} -> ${DEVFLOW_ROOT}`],
  };
}

/** manual 目标：布局未核实，拒绝自动安装并给出指引。 */
function refuseManual(name, target) {
  const adapterPath = path.join('adapters', target.adapter, 'install.md');
  const exists = fs.existsSync(path.join(DEVFLOW_ROOT, adapterPath));
  throw new Error(
    `${target.label} 的安装布局未经核实，本安装器不会猜测路径。\n` +
    (exists
      ? `请按 ${adapterPath} 手动拷贝适配器文件。`
      : `该宿主暂无适配器目录，参见 adapters/README.md。`)
  );
}

// ─── 卸载 ───────────────────────────────────────────────

function uninstallBundle(targetDir, dryRun) {
  const state = readState(targetDir);
  const kind = state?.target === 'junction' || isLink(targetDir) ? 'junction' : 'bundle';

  if (!fs.existsSync(targetDir) && !isLink(targetDir)) {
    return { summary: '目标不存在，无需卸载', details: [] };
  }

  if (kind === 'junction') {
    // 只删链接本身 —— 绝不递归删除指向的真实内容
    if (!dryRun) fs.unlinkSync(targetDir);
    return { summary: '已移除链接（未触碰其指向的真实目录）', details: [`  - ${targetDir}`] };
  }

  if (!state && !dryRun) {
    throw new Error(`目标 ${targetDir} 没有 DevFlow 安装状态文件，来源不明，拒绝自动删除。请手工处理。`);
  }
  if (!dryRun) fs.rmSync(targetDir, { recursive: true, force: true });

  const sp = statePathFor(targetDir);
  if (fs.existsSync(sp) && !dryRun) fs.rmSync(sp, { force: true });
  return { summary: `已删除安装目录${state ? `（${state.files?.length ?? 0} 个文件）` : ''}`, details: [`  - ${targetDir}`] };
}

// ─── CLI ────────────────────────────────────────────────

const HELP = `DevFlow 安装器 v${VERSION}

用法:
  node harnesses/install.js [--target <name>] [--dry-run] [--force]
  node harnesses/install.js --list
  node harnesses/install.js --status [--target <name>]
  node harnesses/install.js --uninstall [--target <name>] [--dry-run]

目标:
${Object.entries(TARGETS).map(([k, t]) => `  ${k.padEnd(12)} ${t.label.padEnd(18)} ${t.kind === 'manual' ? '手动安装（见 adapters/）' : t.note}`).join('\n')}

说明:
  bundle   整目录复制到目标技能目录（装完即冻结为副本）
  junction 建立指向本仓库的链接（源码改动实时生效）
  manual   布局未核实，本安装器拒绝猜测，仅给出适配器文档路径
`;

function parseArgs(argv) {
  const opts = { target: DEFAULT_TARGET, dryRun: false, force: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--target') opts.target = argv[++i];
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--force') opts.force = true;
    else if (a === '--list') opts.list = true;
    else if (a === '--status') opts.status = true;
    else if (a === '--uninstall') opts.uninstall = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else throw new Error(`未知参数: ${a}（用 --help 查看用法）`);
  }
  return opts;
}

function cmdList() {
  console.log(`DevFlow v${VERSION} 安装目标\n`);
  for (const [name, t] of Object.entries(TARGETS)) {
    if (t.kind === 'manual') {
      console.log(`  ${name.padEnd(12)} ${t.label.padEnd(18)} 手动安装 — adapters/${t.adapter}/install.md`);
      continue;
    }
    const dir = t.dir();
    const state = t.kind === 'bundle' || t.kind === 'junction' ? readState(dir) : null;
    let status;
    if (isLink(dir)) status = `已链接 -> ${readLinkSafe(dir)}`;
    else if (fs.existsSync(dir)) status = state ? `已安装 v${state.version}（${state.files?.length ?? '?'} 文件）` : '已存在（来源不明）';
    else status = '未安装';
    console.log(`  ${name.padEnd(12)} ${t.label.padEnd(18)} ${status}`);
    console.log(`  ${' '.repeat(12)} ${dir}`);
  }
}

function cmdStatus(name) {
  const { target } = resolveTarget(name);
  if (target.kind === 'manual') {
    console.log(`${target.label}: 手动安装 — adapters/${target.adapter}/install.md`);
    return;
  }
  const dir = target.dir();
  const state = readState(dir);
  console.log(`目标: ${target.label} (${name})`);
  console.log(`路径: ${dir}`);
  if (isLink(dir)) console.log(`链接: -> ${readLinkSafe(dir)}`);
  console.log(state ? `状态: ${JSON.stringify(state, null, 2)}` : '状态: 无安装记录');
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`❌ ${e.message}`);
    process.exit(1);
  }

  if (opts.help) { console.log(HELP); return; }
  if (opts.list) { cmdList(); return; }
  if (opts.status) {
    try { cmdStatus(opts.target); } catch (e) { console.error(`❌ ${e.message}`); process.exit(1); }
    return;
  }

  let name, target;
  try {
    ({ name, target } = resolveTarget(opts.target));
  } catch (e) {
    console.error(`❌ ${e.message}`);
    process.exit(1);
  }

  const verb = opts.uninstall ? '卸载' : '安装';
  console.log(`${opts.dryRun ? '[dry-run] ' : ''}${verb} DevFlow v${VERSION} → ${target.label} (${name})\n`);

  try {
    let result;
    if (target.kind === 'manual') {
      refuseManual(name, target);
    } else if (opts.uninstall) {
      result = uninstallBundle(target.dir(), opts.dryRun);
    } else if (target.kind === 'junction') {
      result = installJunction(target.dir(), opts.dryRun);
    } else {
      result = installBundle(target.dir(), opts.dryRun, opts.force);
    }

    console.log(`✅ ${result.summary}${result.restoredFrom || ''}`);
    (result.details || []).forEach(d => console.log(d));

    if (target.kind !== 'manual') console.log(`\n目标: ${target.dir()}`);
    if (!opts.uninstall && target.followUp) console.log(`后续: ${target.followUp}`);
    if (!opts.uninstall && name === 'workbuddy') {
      console.log(`\n下一步: 打开 WorkBuddy，在技能列表中重新加载（或重启）`);
    }
    if (opts.dryRun) console.log(`\n（dry-run：未写入任何文件）`);
  } catch (e) {
    console.error(`❌ ${e.message}`);
    process.exit(1);
  }
}

main();
