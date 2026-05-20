/**
 * GitNexus 安装检测 + 智能降级模块
 *
 * 职责：
 * 1. 检测 GitNexus 是否安装及版本
 * 2. 检测项目是否已索引
 * 3. 提供降级信息（fallback 到 regex 分析器）
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const MIN_VERSION = '1.6.0';
const GITNEXUS_BIN = 'gitnexus';

/**
 * 检测 GitNexus 安装状态
 * @returns {{ installed: boolean, version: string|null, path: string|null, error: string|null }}
 */
function checkInstallation() {
  try {
    const versionOutput = execSync(`${GITNEXUS_BIN} --version`, {
      encoding: 'utf8',
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    // 输出格式: "1.6.3" 或 "gitnexus/1.6.3"
    const version = versionOutput.replace(/^gitnexus\/?/, '').trim();
    const binPath = execSync(`which ${GITNEXUS_BIN} 2>/dev/null || where ${GITNEXUS_BIN} 2>nul`, {
      encoding: 'utf8', timeout: 3000
    }).trim().split('\n')[0];

    return {
      installed: true,
      version,
      path: binPath || null,
      meetsMinimum: compareVersions(version, MIN_VERSION) >= 0,
      error: null
    };
  } catch (e) {
    return {
      installed: false,
      version: null,
      path: null,
      meetsMinimum: false,
      error: e.message.split('\n')[0]
    };
  }
}

/**
 * 检测项目是否已建立 GitNexus 索引
 * @param {string} projectDir
 * @returns {{ indexed: boolean, stats: object|null }}
 */
function checkIndex(projectDir) {
  const metaPath = path.join(projectDir, '.gitnexus', 'meta.json');
  if (!fs.existsSync(metaPath)) {
    return { indexed: false, stats: null };
  }
  try {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    return {
      indexed: true,
      stats: {
        lastCommit: meta.lastCommit || null,
        indexedAt: meta.indexedAt || null,
        nodeCount: meta.stats?.nodes || 0,
        edgeCount: meta.stats?.edges || 0
      }
    };
  } catch {
    return { indexed: false, stats: null };
  }
}

/**
 * 获取降级信息（当 GitNexus 不可用时）
 * @returns {{ fallback: string, capabilities: string[], limitations: string[] }}
 */
function getFallbackInfo() {
  return {
    fallback: 'code-intelligence (regex-based)',
    capabilities: [
      '依赖图构建（基于 import/require 正则匹配）',
      'blast radius 分析（基于依赖图遍历）',
      '代码结构提取（函数/类/接口识别）'
    ],
    limitations: [
      '无 git-diff 感知（无法自动关联变更与受影响符号）',
      '无语义搜索（仅支持关键词匹配）',
      '无社区检测/进程追踪',
      'Python 等无大括号语言的 callee 追踪可能不准确',
      '无跨仓库分析'
    ]
  };
}

/**
 * 安装引导提示
 * @returns {string} 友好的安装指引文本
 */
function getInstallGuide() {
  return [
    '',
    '╔══════════════════════════════════════════════════════════╗',
    '║         GitNexus 深度代码分析引擎 — 安装指引            ║',
    '╠══════════════════════════════════════════════════════════╣',
    '║                                                          ║',
    '║  GitNexus 为 devflow 提供：                              ║',
    '║  • git-diff → 变更影响分析 (Phase 5)                    ║',
    '║  • blast radius + 置信度评分 (Phase 4)                  ║',
    '║  • 语义搜索 + 社区检测 (Phase 6)                        ║',
    '║  • 跨仓库 contracts (Phase 3)                           ║',
    '║                                                          ║',
    '║  最低要求: Node.js >= 22                                 ║',
    '║                                                          ║',
    '║  安装命令:                                               ║',
    '║    npm install -g gitnexus                               ║',
    '║                                                          ║',
    '║  安装后验证:                                             ║',
    '║    gitnexus --version                                    ║',
    '║                                                          ║',
    '║  首次使用需为项目建立索引:                               ║',
    '║    cd <your-project> && gitnexus analyze                 ║',
    '║                                                          ║',
    '╚══════════════════════════════════════════════════════════╝',
    ''
  ].join('\n');
}

// 版本比较工具
function compareVersions(a, b) {
  const pa = (a || '0').split('.').map(Number);
  const pb = (b || '0').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }
  return 0;
}

module.exports = {
  checkInstallation,
  checkIndex,
  getFallbackInfo,
  getInstallGuide,
  MIN_VERSION,
  GITNEXUS_BIN
};
