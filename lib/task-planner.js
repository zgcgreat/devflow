#!/usr/bin/env node
/**
 * ForgeOS Task Planner — DAG 任务拆分 + Wave 计划
 *
 * 将功能需求拆分为可并行执行的 Wave 序列。
 * 替代了外部项目的 claude-task-master + get-shit-done 的任务分解能力。
 *
 * 用法: node lib/task-planner.js --describe "登录功能邮箱密码JWT"
 *       node lib/task-planner.js --file tasks.json
 *       node lib/task-planner.js --visualize
 */

const fs = require('fs');
const path = require('path');

class TaskPlanner {
  constructor() {
    this.tasks = [];
    this.waves = [];
  }

  /**
   * 从自然语言描述生成任务分解
   * 内置常见功能的模板匹配
   */
  generateFromDescription(description) {
    const lower = description.toLowerCase();
    let tasks = [];

    // 登录/认证
    if (lower.includes('登录') || lower.includes('login') || lower.includes('auth') || lower.includes('jwt')) {
      tasks = [
        { id: 'T1', name: 'User 数据模型与数据库', deps: [], wave: 1 },
        { id: 'T2', name: '密码加密与哈希存储', deps: ['T1'], wave: 1 },
        { id: 'T3', name: '邮箱密码认证路由', deps: ['T2'], wave: 2 },
        { id: 'T4', name: 'JWT Token 签发与验证', deps: ['T2'], wave: 2 },
        { id: 'T5', name: 'Token 刷新与过期处理', deps: ['T4'], wave: 3 },
        { id: 'T6', name: 'API 端点与中间件集成', deps: ['T3', 'T4'], wave: 3 },
        { id: 'T7', name: '测试覆盖 5 种场景', deps: ['T6'], wave: 4 },
        { id: 'T8', name: '安全审计与边界处理', deps: ['T6'], wave: 4 },
      ];
    }
    // CRUD / API
    else if (lower.includes('api') || lower.includes('crud') || lower.includes('rest')) {
      tasks = [
        { id: 'T1', name: '定义数据模型与 Schema', deps: [], wave: 1 },
        { id: 'T2', name: '创建数据库迁移', deps: ['T1'], wave: 1 },
        { id: 'T3', name: '实现 CRUD 路由', deps: ['T1', 'T2'], wave: 2 },
        { id: 'T4', name: '输入验证与错误处理', deps: ['T3'], wave: 3 },
        { id: 'T5', name: 'API 文档与测试', deps: ['T4'], wave: 3 },
      ];
    }
    // 前端/UI
    else if (lower.includes('ui') || lower.includes('前端') || lower.includes('页面') || lower.includes('component')) {
      tasks = [
        { id: 'T1', name: '组件树设计与布局', deps: [], wave: 1 },
        { id: 'T2', name: '核心组件实现', deps: ['T1'], wave: 2 },
        { id: 'T3', name: '状态管理与数据流', deps: ['T2'], wave: 2 },
        { id: 'T4', name: '样式与响应式适配', deps: ['T2'], wave: 3 },
        { id: 'T5', name: '交互效果与动画', deps: ['T3', 'T4'], wave: 3 },
      ];
    }
    // 默认: 通用
    else {
      tasks = [
        { id: 'T1', name: '需求分析与定义', deps: [], wave: 1 },
        { id: 'T2', name: '核心功能实现', deps: ['T1'], wave: 2 },
        { id: 'T3', name: '辅助功能与边界', deps: ['T2'], wave: 3 },
        { id: 'T4', name: '测试与验证', deps: ['T3'], wave: 3 },
      ];
    }

    this.tasks = tasks;
    this._assignWaves();
    return tasks;
  }

  _assignWaves() {
    const waveMap = {};
    this.tasks.forEach(t => {
      if (!waveMap[t.wave]) waveMap[t.wave] = [];
      waveMap[t.wave].push(t.id);
    });
    this.waves = Object.entries(waveMap)
      .sort(([a], [b]) => a - b)
      .map(([num, taskIds]) => ({
        wave: parseInt(num),
        tasks: taskIds,
        parallel: taskIds.length > 1,
        dependsOn: [],
      }));
  }

  /**
   * 生成可视化 DAG 图 (mermaid 格式)
   */
  toMermaid() {
    if (this.tasks.length === 0) return '无任务';

    const lines = ['graph TD;'];
    this.tasks.forEach(t => {
      lines.push(`  ${t.id}["${t.id}: ${t.name}"]`);
      (t.deps || []).forEach(d => {
        lines.push(`  ${d} --> ${t.id}`);
      });
    });

    // Wave 分组
    const waves = [...new Set(this.tasks.map(t => t.wave))].sort();
    waves.forEach(w => {
      const wTasks = this.tasks.filter(t => t.wave === w);
      if (wTasks.length > 0) {
        const ids = wTasks.map(t => t.id).join(',');
        lines.push(`  subgraph Wave${w}["Wave ${w}"]`);
        ids.split(',').forEach(id => lines.push(`    ${id}`));
        lines.push('  end');
      }
    });

    return lines.join('\n');
  }

  toJSON() {
    return {
      tasks: this.tasks,
      waves: this.waves,
      mermaid: this.toMermaid(),
      totalTasks: this.tasks.length,
      totalWaves: this.waves.length,
    };
  }

  loadFromFile(filePath) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    this.tasks = data.tasks || [];
    this._assignWaves();
    return this.tasks;
  }

  saveToFile(filePath) {
    fs.writeFileSync(filePath, JSON.stringify(this.toJSON(), null, 2));
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--describe') opts.describe = args[++i];
    else if (args[i] === '--file') opts.file = args[++i];
    else if (args[i] === '--visualize') opts.visualize = true;
    else if (args[i] === '--save') opts.save = args[++i];
    else if (args[i] === '--json') opts.json = true;
  }
  return opts;
}

function main() {
  const opts = parseArgs();
  const planner = new TaskPlanner();

  if (opts.describe) {
    // 修复: generate 必须在 --describe 时必跑(原逻辑只在 --save 时才生成)；
    // saveToFile 仅在提供 --save 时调用(原逻辑无条件调用 → saveToFile(undefined) 抛 TypeError)
    planner.generateFromDescription(opts.describe);
    if (opts.save) planner.saveToFile(opts.save);
    const result = planner.toJSON();
    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`Task Planner — "${opts.describe}"
  ${result.totalTasks} 个任务, ${result.totalWaves} 个 Wave

  任务列表:`);
      result.tasks.forEach(t => console.log(`    ${t.id.padEnd(6)} Wave ${t.wave}  ${t.name.padEnd(30)} 依赖: ${(t.deps || []).join(',') || '无'}`));
      if (opts.visualize) {
        console.log(`\n  DAG 图 (mermaid):\n${result.mermaid}`);
      }
    }
    return;
  }

  if (opts.file) {
    const tasks = planner.loadFromFile(opts.file);
    console.log(opts.json ? JSON.stringify(planner.toJSON(), null, 2) :
      `已加载 ${tasks.length} 个任务`);
    return;
  }

  console.log(`ForgeOS Task Planner — DAG 任务分解

用法:
  --describe "功能描述"          从描述生成任务 (支持: 登录/API/前端)
  --file tasks.json              从文件加载任务
  --visualize                    输出 mermaid DAG 图
  --save output.json             保存到文件
  --json                         JSON 格式输出`);
}

if (require.main === module) main();
module.exports = { TaskPlanner };
