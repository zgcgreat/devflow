#!/usr/bin/env node
/**
 * ForgeOS Memory — 4 层持久记忆系统
 *
 * 纯 JSON 文件存储，零外部依赖。支持 4 层生命周期 + 简化 BM25 搜索。
 *
 * 用法: node lib/memory.js --save "决策: JWT认证方案" --tags auth,session
 *       node lib/memory.js --search "JWT"
 *       node lib/memory.js --recent
 *       node lib/memory.js --stats
 *       node lib/memory.js --forget --older 7    (遗忘 >7 天的)
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(process.cwd(), '.forgeos', 'memory');
const SHORT_FILE = path.join(MEMORY_DIR, 'short-term.json');
const LONG_FILE = path.join(MEMORY_DIR, 'long-term.json');
const ARCHIVE_FILE = path.join(MEMORY_DIR, 'archive.json');

const MAX_SHORT = 50;   // 短期最多 50 条
const MAX_LONG = 200;   // 长期最多 200 条
const DECAY_DAYS = { short: 2, long: 7, archive: 30 };

class ForgeMemory {
  constructor() {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
    this.short = this._load(SHORT_FILE);
    this.long = this._load(LONG_FILE);
    this.archive = this._load(ARCHIVE_FILE);
  }

  _load(fp) {
    try { return JSON.parse(fs.readFileSync(fp, 'utf-8')); }
    catch { return []; }
  }

  _save(fp, data) {
    fs.writeFileSync(fp, JSON.stringify(data, null, 2));
  }

  _timestamp() {
    return new Date().toISOString();
  }

  _simpleBM25(query, texts) {
    if (!query) return texts.slice(0, 10);
    const terms = query.toLowerCase().split(/\s+/);
    return texts
      .map(t => {
        const text = (t.content || t.note || '').toLowerCase();
        const score = terms.reduce((s, term) => {
          // 转义正则元字符，避免 "C++"、"a.b" 等查询词抛异常或误匹配
          const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const count = (text.match(new RegExp(esc, 'g')) || []).length;
          return s + count / (Math.log(text.length + 1) + 1);
        }, 0);
        return { ...t, _score: score };
      })
      .filter(t => t._score > 0)
      .sort((a, b) => b._score - a._score);
  }

  save(content, tags = []) {
    const entry = {
      id: `mem-${Date.now()}`,
      content,
      tags: Array.isArray(tags) ? tags : [tags],
      created: this._timestamp(),
      accessed: this._timestamp(),
      accessCount: 1,
      layer: 'short',
    };

    this.short.unshift(entry);
    if (this.short.length > MAX_SHORT) {
      // 移出最旧的到长期
      const moved = this.short.pop();
      if (moved) {
        moved.layer = 'long';
        this.long.unshift(moved);
      }
    }
    if (this.long.length > MAX_LONG) {
      const archived = this.long.pop();
      if (archived) {
        archived.layer = 'archive';
        this.archive.unshift(archived);
      }
    }

    this._save(SHORT_FILE, this.short);
    this._save(LONG_FILE, this.long);
    this._save(ARCHIVE_FILE, this.archive);
    return entry;
  }

  search(query, limit = 10) {
    const all = [...this.short, ...this.long, ...this.archive];
    const results = this._simpleBM25(query, all).slice(0, limit);
    // 更新访问计数
    results.forEach(r => {
      r.accessCount = (r.accessCount || 0) + 1;
      r.accessed = this._timestamp();
    });
    this._save(SHORT_FILE, this.short);
    this._save(LONG_FILE, this.long);
    return results.map(({ _score, ...rest }) => ({ ...rest, score: _score.toFixed(3) }));
  }

  recent(limit = 10) {
    const all = [...this.short, ...this.long, ...this.archive];
    return all.slice(0, limit).map(({ _score, ...rest }) => rest);
  }

  stats() {
    const decay = (list, days) => {
      const cutoff = Date.now() - days * 86400000;
      return list.filter(e => new Date(e.created).getTime() < cutoff).length;
    };
    return {
      short: this.short.length,
      long: this.long.length,
      archive: this.archive.length,
      total: this.short.length + this.long.length + this.archive.length,
      decayReady: decay(this.short, DECAY_DAYS.short) + decay(this.long, DECAY_DAYS.long),
      tags: [...new Set([...this.short, ...this.long, ...this.archive].flatMap(e => e.tags || []))],
    };
  }

  forget(olderThanDays = 7) {
    const cutoff = Date.now() - olderThanDays * 86400000;
    const filterOld = list => list.filter(e => new Date(e.created).getTime() >= cutoff);
    const count = this.short.length + this.long.length - filterOld(this.short).length - filterOld(this.long).length;
    this.short = filterOld(this.short);
    this.long = filterOld(this.long);
    this._save(SHORT_FILE, this.short);
    this._save(LONG_FILE, this.long);
    return { forgotten: count, remaining: this.short.length + this.long.length + this.archive.length };
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--save') opts.save = args[++i];
    else if (args[i] === '--tags') opts.tags = args[++i].split(',');
    else if (args[i] === '--search') opts.search = args[++i];
    else if (args[i] === '--recent') opts.recent = true;
    else if (args[i] === '--stats') opts.stats = true;
    else if (args[i] === '--forget') opts.forget = true;
    else if (args[i] === '--older') opts.older = parseInt(args[++i]);
    else if (args[i] === '--json') opts.json = true;
  }
  return opts;
}

function main() {
  const opts = parseArgs();
  const mem = new ForgeMemory();

  if (opts.save) {
    const entry = mem.save(opts.save, opts.tags || []);
    console.log(opts.json ? JSON.stringify(entry, null, 2) : `已保存: ${entry.id}`);
    return;
  }

  if (opts.search) {
    const results = mem.search(opts.search);
    const output = opts.json ? JSON.stringify(results, null, 2) : results.map(r =>
      `[${r.layer}] ${r.content.slice(0, 100)} (score: ${r.score})`).join('\n');
    console.log(output || '无匹配结果');
    return;
  }

  if (opts.recent) {
    const results = mem.recent();
    const output = opts.json ? JSON.stringify(results, null, 2) : results.map(r =>
      `[${r.layer}] ${r.content.slice(0, 100)}`).join('\n');
    console.log(output);
    return;
  }

  if (opts.stats) {
    const s = mem.stats();
    const output = opts.json ? JSON.stringify(s, null, 2) :
      `ForgeOS Memory Stats
  短期: ${s.short} 条
  长期: ${s.long} 条
  归档: ${s.archive} 条
  总计: ${s.total} 条
  待衰减: ${s.decayReady} 条
  标签: ${s.tags.slice(0, 10).join(', ')}`;
    console.log(output);
    return;
  }

  if (opts.forget) {
    const result = mem.forget(opts.older || 7);
    console.log(opts.json ? JSON.stringify(result, null, 2) :
      `已遗忘 ${result.forgotten} 条，剩余 ${result.remaining} 条`);
    return;
  }

  console.log(`ForgeOS Memory — 持久记忆系统

用法:
  --save <内容> [--tags tag1,tag2]   保存一条记忆
  --search <关键词>                  搜索记忆
  --recent                           最近记忆
  --stats                            统计
  --forget [--older 7]              遗忘旧记忆`);
}

if (require.main === module) main();
module.exports = { ForgeMemory };
