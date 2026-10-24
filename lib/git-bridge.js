#!/usr/bin/env node
/**
 * DevFlow Git Bridge — req-id ↔ 分支 ↔ 提交 的链路自动化
 *
 * 约定:
 *   分支名    devflow/<req-id>          （如 devflow/req-001）
 *   链路记录  .devflow/<req-id>/git.json（branch/base/startedAt）
 *   提交格式  devflow(<req-id>): <说明> [phase <N>]
 *
 * 安全边界: checkpoint 只 stage `.devflow/` 下的流程产物，
 * 绝不自动提交用户的源代码 —— 代码提交仍由 AI/用户显式操作。
 *
 * 用法:
 *   node lib/git-bridge.js start <req-id> [--from <base>]
 *   node lib/git-bridge.js status
 *   node lib/git-bridge.js checkpoint "<说明>"
 *   node lib/git-bridge.js verify
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const BRANCH_PREFIX = 'devflow/';

/** 本仓库根（hook 文件里引用的 bin/devflow.js 绝对路径来源；bundle 安装时即安装副本自身） */
const DEVFLOW_ROOT = path.resolve(__dirname, '..');

/** devflow 托管 git hook 的识别标记 */
const HOOK_MARKER = '# devflow-managed (installed by: devflow git install-hook)';

class GitBridge {
  /**
   * @param {string} [workspaceDir] 工作区根目录，默认 process.cwd()
   */
  constructor(workspaceDir = process.cwd()) {
    this.workspace = workspaceDir;
    this.devflowDir = path.join(workspaceDir, '.devflow');
  }

  /** 执行 git 命令；git 不存在或不在仓库内时抛出带指引的错误 */
  _git(args, { okCodes = [0] } = {}) {
    try {
      return execFileSync('git', args, { cwd: this.workspace, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    } catch (err) {
      // 容忍的退出码（如 rev-parse 探测不存在的分支返回 128）：返回可用 stdout（常为空串）
      if (err.status !== undefined && okCodes.includes(err.status)) {
        return String(err.stdout || '').trim();
      }
      if (err.code === 'ENOENT') {
        throw new Error('未找到 git 命令。请先安装 Git (https://git-scm.com)');
      }
      throw new Error(`git ${args[0]} 失败 (exit ${err.status}): ${String(err.stderr || err.message).split('\n')[0]}`);
    }
  }

  isRepo() {
    try { return this._git(['rev-parse', '--is-inside-work-tree']) === 'true'; }
    catch { return false; }
  }

  currentBranch() {
    return this._git(['rev-parse', '--abbrev-ref', 'HEAD']);
  }

  /** 读取 .devflow/<req-id>/git.json */
  readLink(reqId) {
    const p = path.join(this.devflowDir, reqId, 'git.json');
    try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
  }

  writeLink(reqId, link) {
    const dir = path.join(this.devflowDir, reqId);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'git.json'), JSON.stringify(link, null, 2));
  }

  /** 所有已建立链路的 req（扫描 .devflow 下各 req 目录的 git.json） */
  linkedReqs() {
    const out = [];
    try {
      for (const e of fs.readdirSync(this.devflowDir, { withFileTypes: true })) {
        if (!e.isDirectory()) continue;
        const link = this.readLink(e.name);
        if (link) out.push(link);
      }
    } catch { /* .devflow 不存在 */ }
    return out;
  }

  /** 从当前分支名解析 req-id（devflow/<req-id>），失败返回 null */
  reqFromBranch() {
    const branch = this.currentBranch();
    if (branch.startsWith(BRANCH_PREFIX)) return branch.slice(BRANCH_PREFIX.length);
    return null;
  }

  /**
   * 为 req 创建工作分支并记录链路。
   * @returns {{reqId:string, branch:string, base:string, created:boolean}}
   */
  start(reqId, { from } = {}) {
    if (!reqId || /[\/\s~^:?*\\]/.test(reqId)) throw new Error(`非法 req-id: ${reqId}（不能包含空白与 \\/~^:?*）`);
    if (!this.isRepo()) throw new Error('当前目录不是 git 仓库。先 git init 或在项目根运行');
    const branch = BRANCH_PREFIX + reqId;
    const existing = this.readLink(reqId);
    const base = from || (existing && existing.base) || this.currentBranch();

    const branchExists = this._git(['rev-parse', '--verify', `refs/heads/${branch}`], { okCodes: [0, 128] }) !== '';
    let created = false;
    if (this.currentBranch() !== branch) {
      const args = branchExists ? ['checkout', branch] : ['checkout', '-b', branch, ...(from ? [from] : [])];
      this._git(args);
      created = !branchExists;
    }
    this.writeLink(reqId, {
      reqId, branch, base, startedAt: (existing && existing.startedAt) || new Date().toISOString(),
    });
    return { reqId, branch, base, created };
  }

  /** 流程产物的工作区变更（.devflow/ 下的增删改） */
  artifactChanges() {
    const out = this._git(['status', '--porcelain', '--', '.devflow'], { okCodes: [0, 128] });
    return out ? out.split('\n').filter(Boolean) : [];
  }

  /** 当前分支相对 base 的提交数与最近一条提交 */
  branchCommits(reqId) {
    const link = this.readLink(reqId);
    if (!link) return null;
    const count = parseInt(this._git(['rev-list', '--count', `${link.base}..HEAD`], { okCodes: [0, 128] }) || '0', 10);
    const latest = this._git(['log', '-1', '--pretty=format:%h %s'], { okCodes: [0, 128] });
    return { count, latest: latest || null };
  }

  /**
   * 提交流程产物检查点（只 stage .devflow/，不碰源代码）。
   * @returns {{reqId:string, commit:string, staged:string[]}}
   */
  checkpoint(note) {
    if (!this.isRepo()) throw new Error('当前目录不是 git 仓库');
    const reqId = this.reqFromBranch()
      || this.linkedReqs().sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || ''))[0]?.reqId;
    if (!reqId) throw new Error('无法确定 req-id：不在 devflow/<req-id> 分支且无任何 git.json 链路记录');
    // 只 add 真实存在的路径（state.json 可能尚未生成；带不存在 pathspec 的 add 会整体失败）
    const addTargets = [path.join('.devflow', reqId), path.join('.devflow', 'state.json')]
      .filter(rel => fs.existsSync(path.join(this.workspace, rel)));
    if (addTargets.length > 0) {
      this._git(['add', '--', ...addTargets]);
    }
    // 无变更时 add 不报错但 commit 会失败 —— 先确认暂存区有内容
    const staged = this._git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean);
    if (staged.length === 0) return { reqId, commit: null, staged };

    const msg = `devflow(${reqId}): ${note || '流程产物检查点'}`;
    const commitArgs = ['commit', '-m', msg];
    try {
      this._git(commitArgs);
    } catch {
      // 常见失败：未配置 user.name/email —— 用本地身份兜底重试（仅本次提交）
      this._git(['-c', 'user.name=devflow', '-c', 'user.email=devflow@local', ...commitArgs]);
    }
    const commit = this._git(['rev-parse', '--short', 'HEAD']);
    return { reqId, commit, staged };
  }

  /** 链路健康检查 */
  verify() {
    const issues = [];
    const info = { isRepo: this.isRepo() };
    if (!info.isRepo) {
      return { pass: false, issues: ['当前目录不是 git 仓库'], ...info };
    }
    const branch = this.currentBranch();
    info.branch = branch;
    const reqId = this.reqFromBranch();
    if (!reqId) {
      issues.push(`当前分支 ${branch} 不符合 devflow/<req-id> 命名约定（建议 devflow git start <req-id>）`);
    } else {
      const link = this.readLink(reqId);
      if (!link) issues.push(`分支 ${branch} 无 .devflow/${reqId}/git.json 链路记录`);
      else if (link.branch !== branch) issues.push(`git.json 记录的分支 ${link.branch} 与当前分支 ${branch} 不一致`);
    }
    const changes = this.artifactChanges();
    if (changes.length > 0) {
      issues.push(`${changes.length} 个流程产物未提交（devflow git checkpoint "<说明>" 收口）: ${changes.slice(0, 3).join(' ')}${changes.length > 3 ? ' …' : ''}`);
    }
    info.uncommittedArtifacts = changes.length;
    return { pass: issues.length === 0, issues, ...info };
  }

  // ─── git hooks 兜底拦截（v3.6.0 通用方案）────────────────

  _hooksDir() {
    return path.join(this.workspace, '.git', 'hooks');
  }

  _hookBody(gitSubcommand, extraArgs = '') {
    const root = DEVFLOW_ROOT.replace(/\\/g, '/');
    return [
      '#!/bin/sh',
      HOOK_MARKER,
      `node "${root}/bin/devflow.js" git ${gitSubcommand}${extraArgs}`,
      '',
    ].join('\n');
  }

  /**
   * 安装 pre-commit + commit-msg 兜底拦截 hook。
   * 这是唯一不依赖宿主工具配合的拦截层：所有工具的提交都必经 git。
   * 已存在非 DevFlow 的同名 hook 时拒绝覆盖（防破坏 husky 等用户配置）。
   */
  installHook({ dryRun = false } = {}) {
    if (!this.isRepo()) throw new Error('当前目录不是 git 仓库。先 git init 或在项目根运行');
    if (!fs.existsSync(path.join(this.workspace, '.devflow'))) {
      throw new Error('项目未初始化 devflow（无 .devflow/）。先运行 devflow init');
    }
    fs.mkdirSync(this._hooksDir(), { recursive: true });
    const installed = [];
    for (const hook of [
      { name: 'pre-commit', call: 'pre-commit' },
      { name: 'commit-msg', call: 'commit-msg "$1"' },
    ]) {
      const p = path.join(this._hooksDir(), hook.name);
      let existing = null;
      try { existing = fs.readFileSync(p, 'utf-8'); } catch { /* 不存在 */ }
      if (existing && !existing.includes(HOOK_MARKER)) {
        throw new Error(
          `.git/hooks/${hook.name} 已存在且不是 DevFlow 托管 hook（可能是 husky 等用户配置），拒绝覆盖。\n` +
          `如需共存，请手工在该 hook 中加入: node "${DEVFLOW_ROOT.replace(/\\/g, '/')}/bin/devflow.js" git ${hook.call}`
        );
      }
      if (!dryRun) fs.writeFileSync(p, this._hookBody(hook.call), { mode: 0o755 });
      installed.push(`.git/hooks/${hook.name}`);
    }
    return { installed, summary: `已安装 ${installed.join(' + ')}（devflow git uninstall-hook 移除）` };
  }

  /** 移除 DevFlow 托管 hook（只删带标记的文件，不动用户自己的 hook）。 */
  uninstallHook({ dryRun = false } = {}) {
    const removed = [];
    for (const name of ['pre-commit', 'commit-msg']) {
      const p = path.join(this._hooksDir(), name);
      let existing = null;
      try { existing = fs.readFileSync(p, 'utf-8'); } catch { continue; }
      if (existing.includes(HOOK_MARKER)) {
        if (!dryRun) fs.rmSync(p, { force: true });
        removed.push(`.git/hooks/${name}`);
      }
    }
    return { removed, summary: removed.length ? `已移除 ${removed.join(' + ')}` : '无 DevFlow 托管 hook' };
  }

  /**
   * pre-commit 检查（git hook 调用；exit 非零 = 阻止提交）。
   * 检查：状态文件健康；devflow 分支必须有链路记录。
   */
  runPreCommit() {
    if (!fs.existsSync(this.devflowDir)) return { pass: true, note: '非 devflow 项目，放行' };
    let state = null;
    try { state = JSON.parse(fs.readFileSync(path.join(this.devflowDir, 'state.json'), 'utf-8')); } catch { state = null; }
    if (!state) {
      return { pass: false, reason: '.devflow/state.json 损坏或缺失 — 运行 devflow doctor 检查后再提交（防损坏状态被固化进历史）' };
    }
    const branch = this.isRepo() ? this.currentBranch() : null;
    if (branch && branch.startsWith(BRANCH_PREFIX)) {
      const reqId = branch.slice(BRANCH_PREFIX.length);
      if (!this.readLink(reqId)) {
        return {
          pass: false,
          reason: `分支 ${branch} 缺少链路记录 .devflow/${reqId}/git.json — ` +
            `运行 devflow git start ${reqId} 建立链路，或切回其他分支提交`,
        };
      }
    }
    return { pass: true, note: '状态健康，链路完整' };
  }

  /**
   * commit-msg 检查（git hook 调用，参数为 COMMIT_EDITMSG 路径）。
   * devflow/* 分支上的提交必须符合 devflow(<req-id>): <说明>；Merge 提交豁免。
   */
  runCommitMsg(msgFile) {
    if (!msgFile) throw new Error('用法: git commit-msg <COMMIT_EDITMSG 路径>');
    let msg = '';
    try { msg = fs.readFileSync(msgFile, 'utf-8'); } catch { /* 空消息按失败处理 */ }
    const firstLine = String(msg || '').split('\n')[0].trim();
    if (!firstLine) return { pass: false, reason: '提交说明为空' };
    if (firstLine.startsWith('Merge ')) return { pass: true, note: 'Merge 提交豁免格式检查' };
    const branch = this.isRepo() ? this.currentBranch() : null;
    if (branch && branch.startsWith(BRANCH_PREFIX)) {
      if (!/^devflow\([^)]+\)\s*:\s*\S/.test(firstLine)) {
        return {
          pass: false,
          reason: `提交说明不符合 devflow 分支约定: "${firstLine.slice(0, 60)}"\n` +
            `要求格式: devflow(${branch.slice(BRANCH_PREFIX.length)}): <说明>\n` +
            `推荐: devflow git checkpoint "<说明>"（自动带格式，只提交流程产物）`,
        };
      }
    }
    return { pass: true, note: '提交格式符合约定' };
  }
}

function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const bridge = new GitBridge();
  const arg = (flag) => { const i = rest.indexOf(flag); return i >= 0 ? rest[i + 1] : undefined; };

  try {
    if (cmd === 'start') {
      const reqId = rest[0];
      if (!reqId) throw new Error('用法: git-bridge.js start <req-id> [--from <base>]');
      const r = bridge.start(reqId, { from: arg('--from') });
      console.log(`${r.created ? '已创建' : '已切换到'}分支 ${r.branch} (基于 ${r.base})\n链路记录: .devflow/${r.reqId}/git.json`);
      return;
    }
    if (cmd === 'status') {
      if (!bridge.isRepo()) { console.log('当前目录不是 git 仓库'); process.exitCode = 1; return; }
      const branch = bridge.currentBranch();
      const linked = bridge.linkedReqs();
      const reqId = bridge.reqFromBranch();
      console.log(`DevFlow Git 链路\n  当前分支: ${branch}${reqId ? ` (req: ${reqId})` : ' (不符合 devflow/<req-id> 约定)'}`);
      if (linked.length > 0) console.log(`  已链路 req: ${linked.map(l => l.reqId).join(', ')}`);
      if (reqId) {
        const c = bridge.branchCommits(reqId);
        if (c) console.log(`  分支提交: ${c.count} 条${c.latest ? `，最近: ${c.latest}` : ''}`);
      }
      const changes = bridge.artifactChanges();
      console.log(`  未提交流程产物: ${changes.length} 个${changes.length > 0 ? '（devflow git checkpoint 收口）' : ''}`);
      return;
    }
    if (cmd === 'checkpoint') {
      const r = bridge.checkpoint(rest[0]);
      if (r.commit) console.log(`✅ 已提交 ${r.commit}: devflow(${r.reqId}) 流程产物`);
      else console.log('ℹ️ 无流程产物变更可提交');
      return;
    }
    if (cmd === 'verify') {
      const r = bridge.verify();
      console.log(`DevFlow Git 链路检查\n  ${r.pass ? '✅ 通过' : '❌ ' + r.issues.length + ' 个问题'}`);
      r.issues.forEach(i => console.log(`  - ${i}`));
      process.exitCode = r.pass ? 0 : 1;
      return;
    }
    console.log(`DevFlow Git Bridge — req-id ↔ 分支 ↔ 提交链路\n\n用法:\n  start <req-id> [--from <base>]   创建/切换 devflow/<req-id> 分支并记录链路\n  status                            当前链路状态\n  checkpoint "<说明>"               提交流程产物检查点（只 stage .devflow/）\n  verify                            链路健康检查`);
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) main();
module.exports = { GitBridge, BRANCH_PREFIX, HOOK_MARKER, DEVFLOW_ROOT };
