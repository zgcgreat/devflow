#!/usr/bin/env node
/**
 * DevFlow Party Arbiter — BMAD 风格的多专家评分仲裁器
 *
 * 独立的评分引擎，给 Party Mode 提供量化决策支持。
 * 用法: node lib/party-arbiter.js --role architect "模块化方案" --role dev "快速方案" --role security "安全方案"
 *       node lib/party-arbiter.js --scenario "登录方案设计"
 */

// 评分维度
const DIMS = [
  { name: 'Cost', label: '成本', weight: 0.25 },
  { name: 'Performance', label: '性能', weight: 0.25 },
  { name: 'Maintainability', label: '可维护', weight: 0.30 },
  { name: 'Security', label: '安全', weight: 0.20 },
];

const ROLE_COLORS = {
  architect: { color: '#378ADD', defaultScores: { cost: 2, performance: 2, maintainability: 4, security: 3 } },
  dev: { color: '#1D9E75', defaultScores: { cost: 4, performance: 3, maintainability: 3, security: 2 } },
  security: { color: '#E24B4A', defaultScores: { cost: 1, performance: 2, maintainability: 3, security: 5 } },
  qa: { color: '#D85A30', defaultScores: { cost: 2, performance: 2, maintainability: 2, security: 3 } },
  pm: { color: '#7F77DD', defaultScores: { cost: 3, performance: 2, maintainability: 3, security: 2 } },
  designer: { color: '#D4537E', defaultScores: { cost: 2, performance: 3, maintainability: 3, security: 2 } },
};

class PartyArbiter {
  constructor() {
    this.proposals = [];
  }

  addProposal(role, summary, scores) {
    const roleConfig = ROLE_COLORS[role] || ROLE_COLORS.dev;
    const finalScores = scores || roleConfig.defaultScores;
    // 显式 0 分是有效输入，仅缺失/非法维度回退 3 分；星级渲染需 0-5 区间（负数会让 repeat 抛错）
    const dimScore = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(5, v)) : 3);
    const weighted = DIMS.reduce((acc, dim) => {
      const dimKey = dim.name.toLowerCase();
      const score = dimScore(finalScores[dimKey]);
      return acc + score * dim.weight / 5;
    }, 0);

    this.proposals.push({
      role,
      summary: summary || `${role}方案`,
      rawScores: finalScores,
      weightedScore: parseFloat(weighted.toFixed(3)),
      color: roleConfig.color,
    });
    return this;
  }

  arbitrate() {
    // 按加权总分排序
    const ranked = [...this.proposals].sort((a, b) => b.weightedScore - a.weightedScore);

    // 生成对比表
    const table = {
      ranking: ranked,
      winner: ranked[0] || null,
      recommendation: ranked.length > 0
        ? `推荐方案: ${ranked[0].role} 的 "${ranked[0].summary}" (总分: ${ranked[0].weightedScore})`
        : '无方案',
      dimensions: DIMS.map(d => d.label),
    };

    return table;
  }

  tableText() {
    const result = this.arbitrate();
    const lines = ['Party Mode 仲裁结果\n'];

    // 表头
    const header = `| 方案 | 角色 | ${DIMS.map(d => d.label).join(' | ')} | 总分 |`;
    const separator = `|${'---|'.repeat(DIMS.length + 3)}`;
    lines.push(header);
    lines.push(separator);

    result.ranking.forEach(p => {
      const star = (v) => '⭐'.repeat(typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(5, v)) : 1);
      const scores = DIMS.map(d => star(p.rawScores[d.name.toLowerCase()])).join(' | ');
      lines.push(`| ${p.role} | ${String(p.summary).slice(0, 20)} | ${scores} | ${p.weightedScore} |`);
    });

    lines.push(`\n${result.recommendation}`);
    return lines.join('\n');
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { roles: [], summaries: [], scenario: '' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--role') {
      opts.roles.push(args[++i]);
      opts.summaries.push(args[++i] || '');
    }
    if (args[i] === '--scenario') opts.scenario = args[++i];
    if (args[i] === '--json') opts.json = true;
  }
  return opts;
}

function main() {
  const opts = parseArgs();
  const arbiter = new PartyArbiter();

  if (opts.roles.length > 0) {
    opts.roles.forEach((role, i) => {
      arbiter.addProposal(role, opts.summaries[i] || `${role}方案`);
    });
    console.log(opts.json ? JSON.stringify(arbiter.arbitrate(), null, 2) : arbiter.tableText());
    return;
  }

  // Demo: 登录方案
  if (opts.scenario) {
    console.log(`\n  Party Mode: "${opts.scenario}"\n`);
    arbiter
      .addProposal('architect', '模块化Auth服务,抽象Provider接口', { cost: 2, performance: 2, maintainability: 4, security: 3 })
      .addProposal('dev', 'passport.js+JWT中间件,最快实现', { cost: 4, performance: 3, maintainability: 3, security: 2 })
      .addProposal('security', '自带RateLimit+CSRF+密码策略', { cost: 1, performance: 2, maintainability: 3, security: 5 });
    console.log(opts.json ? JSON.stringify(arbiter.arbitrate(), null, 2) : arbiter.tableText());
    return;
  }

  console.log(`DevFlow Party Arbiter — 多专家评分仲裁

用法:
  --role <角色> "<方案>" [--role ...]  添加角色方案 (支持: architect/dev/security/qa/pm/designer)
  --scenario "<场景>"                   演示 (内置示例)
  --json                                 JSON 输出

示例:
  node lib/party-arbiter.js --role architect "模块化方案" --role dev "快速交付" --role security "安全优先"`);
}

if (require.main === module) main();
module.exports = { PartyArbiter, DIMS };
