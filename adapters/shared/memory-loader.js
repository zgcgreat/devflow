#!/usr/bin/env node
/**
 * DevFlow Memory Loader — 运行时无关的记忆系统加载器
 *
 * 加载 .devflow/memory/ 下的所有模板文件和项目状态。
 * 支持增量加载（按 Phase 需要加载特定记忆）。
 */

const fs = require('fs');
const path = require('path');
const { findProjectDir, DEVFLOW_DIR } = require('./core-bridge');

const MEMORY_DIR = 'memory';
const LESSONS_FILE = 'LESSONS.md';
const STATE_FILE = 'state.json';
const CONTEXT_FILE = 'CONTEXT.md';

// ─── 加载函数 ───────────────────────────────────────────

function loadAll(projectDir) {
  const result = {
    state: null,
    context: null,
    lessons: null,
    domainSkills: [],
  };

  // state.json
  const statePath = path.join(projectDir, DEVFLOW_DIR, STATE_FILE);
  if (fs.existsSync(statePath)) {
    result.state = fs.readFileSync(statePath, 'utf8');
  }

  // CONTEXT.md
  const contextPath = path.join(projectDir, DEVFLOW_DIR, CONTEXT_FILE);
  if (fs.existsSync(contextPath)) {
    result.context = fs.readFileSync(contextPath, 'utf8');
  }

  // LESSONS.md
  const memoryDir = path.join(projectDir, DEVFLOW_DIR, MEMORY_DIR);
  const lessonsPath = path.join(memoryDir, LESSONS_FILE);
  if (fs.existsSync(lessonsPath)) {
    result.lessons = fs.readFileSync(lessonsPath, 'utf8');
  }

  // Domain Skills
  if (fs.existsSync(memoryDir)) {
    try {
      const entries = fs.readdirSync(memoryDir);
      result.domainSkills = entries
        .filter(f => f.endsWith('.md') && f !== LESSONS_FILE)
        .map(f => ({
          name: f.replace('.md', ''),
          content: fs.readFileSync(path.join(memoryDir, f), 'utf8'),
        }));
    } catch (e) { /* ignore */ }
  }

  return result;
}

function loadForPhase(projectDir, phase) {
  // 根据 Phase 选择性加载记忆
  const all = loadAll(projectDir);
  const result = { state: all.state };

  // Phase 0-1: 只需要 state
  if (phase <= 1) return result;

  // Phase 1b-2: 需要 context
  result.context = all.context;

  // Phase 3+: 需要 lessons
  if (phase >= 3) {
    result.lessons = all.lessons;
  }

  // Phase 4+: 需要 domain skills (按技术栈过滤)
  if (phase >= 4 && all.domainSkills.length > 0) {
    // 简单过滤: 只加载与当前技术栈匹配的 skills
    result.domainSkills = all.domainSkills; // 全量加载, 适配器按需裁剪
  }

  return result;
}

function loadLessonsOnly(projectDir) {
  const memoryDir = path.join(projectDir, DEVFLOW_DIR, MEMORY_DIR);
  const lessonsPath = path.join(memoryDir, LESSONS_FILE);

  if (!fs.existsSync(lessonsPath)) return null;
  return fs.readFileSync(lessonsPath, 'utf8');
}

// ─── Token 预算估算 ─────────────────────────────────────

function estimateTokenSize(content) {
  // 粗略估算: 1 token ≈ 4 chars for English, ≈ 2 chars for Chinese
  const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
  const otherChars = content.length - chineseChars;
  return Math.ceil(chineseChars / 2 + otherChars / 4);
}

function getMemoryTokenBudget(projectDir, maxTokens = 20000) {
  const all = loadAll(projectDir);
  let totalTokens = 0;
  const budget = {};

  if (all.state) {
    budget.state = estimateTokenSize(all.state);
    totalTokens += budget.state;
  }
  if (all.context) {
    budget.context = estimateTokenSize(all.context);
    totalTokens += budget.context;
  }
  if (all.lessons) {
    const lessonsTokens = estimateTokenSize(all.lessons);
    // Lessons 可能很大, 截断到 50% 预算
    const maxLessonsTokens = Math.floor(maxTokens * 0.5);
    budget.lessons = Math.min(lessonsTokens, maxLessonsTokens);
    totalTokens += budget.lessons;
  }

  budget.total = totalTokens;
  budget.overBudget = totalTokens > maxTokens;
  return budget;
}

// ─── CLI 入口 ───────────────────────────────────────────

if (require.main === module) {
  const command = process.argv[2];
  const projectDir = findProjectDir() || process.cwd();

  switch (command) {
    case 'load': {
      const phase = parseInt(process.argv[3]) || 0;
      const result = loadForPhase(projectDir, phase);
      console.log(JSON.stringify({
        hasState: !!result.state,
        hasContext: !!result.context,
        hasLessons: !!result.lessons,
        domainSkillCount: result.domainSkills?.length || 0,
      }, null, 2));
      break;
    }
    case 'budget': {
      const budget = getMemoryTokenBudget(projectDir);
      console.log(JSON.stringify(budget, null, 2));
      break;
    }
    case 'lessons': {
      const lessons = loadLessonsOnly(projectDir);
      if (lessons) {
        console.log(lessons.substring(0, 2000));
        if (lessons.length > 2000) console.log(`\n... (${lessons.length - 2000} more chars)`);
      } else {
        console.log('No LESSONS.md found');
      }
      break;
    }
    default:
      console.log('DevFlow Memory Loader');
      console.log('Commands: load [phase] | budget | lessons');
  }
}

module.exports = { loadAll, loadForPhase, loadLessonsOnly, estimateTokenSize, getMemoryTokenBudget };
