#!/usr/bin/env node
/**
 * External Tool Adapter
 * 
 * 用途: 统一适配外部工具 (GitNexus, grep, etc.)
 * 用法: node bin/external-adapter.js <tool> <command> [args...]
 */

const { execSync } = require('child_process');
const path = require('path');

const c = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[36m',
  gray: '\x1b[90m',
  reset: '\x1b[0m'
};

function log(msg, color = 'reset') {
  console.log(`${c[color]}${msg}${c.reset}`);
}

function logError(msg) {
  console.error(`${c.red}ERROR: ${msg}${c.reset}`);
}

/**
 * 检测工具可用性
 */
function detectTool(tool) {
  try {
    switch (tool) {
      case 'gitnexus':
        execSync('gitnexus --version', { stdio: 'pipe' });
        return { available: true, name: 'GitNexus', version: 'detected' };
      
      case 'grep':
        execSync('grep --version', { stdio: 'pipe' });
        return { available: true, name: 'grep', version: 'detected' };
      
      case 'rg': // ripgrep
        execSync('rg --version', { stdio: 'pipe' });
        return { available: true, name: 'ripgrep', version: 'detected' };
      
      case 'git':
        execSync('git --version', { stdio: 'pipe' });
        return { available: true, name: 'git', version: 'detected' };
      
      case 'gh':
        execSync('gh --version', { stdio: 'pipe' });
        return { available: true, name: 'GitHub CLI', version: 'detected' };
      
      default:
        return { available: false, name: tool, version: null };
    }
  } catch (e) {
    return { available: false, name: tool, version: null };
  }
}

/**
 * GitNexus 调用
 */
function gitnexusQuery(query, projectDir) {
  try {
    // 优先使用 GitNexus
    const result = execSync(
      `gitnexus query "${query}"`,
      { cwd: projectDir, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
    );
    return { success: true, output: result, tool: 'gitnexus' };
  } catch (e) {
    // GitNexus 不可用，使用 fallback
    return gitnexusFallback(query, projectDir);
  }
}

/**
 * GitNexus 降级: 使用 grep 分析
 */
function gitnexusFallback(query, projectDir) {
  log('⚠️  GitNexus 不可用，使用 grep fallback', 'yellow');
  
  const { execSync } = require('child_process');
  const fs = require('fs');
  
  // 解析查询
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  
  // 获取所有代码文件
  const extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.java', '.cs', '.rb', '.php'];
  const files = [];
  
  function walkDir(dir) {
    if (dir.includes('node_modules') || dir.includes('.git')) return;
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (e) {}
  }
  
  walkDir(projectDir);
  
  // 简单 grep 搜索
  const results = [];
  
  for (const term of terms) {
    try {
      const result = execSync(
        `grep -rn "${term}" "${projectDir}" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" -l`,
        { encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 }
      );
      if (result) {
        results.push(...result.split('\n').filter(Boolean));
      }
    } catch (e) {}
  }
  
  // 去重
  const uniqueFiles = [...new Set(results)];
  
  return {
    success: true,
    output: `Found ${uniqueFiles.length} files matching: ${terms.join(', ')}\n${uniqueFiles.slice(0, 100).join('\n')}`,
    tool: 'grep-fallback',
    matchedFiles: uniqueFiles.length,
    warning: 'Limited functionality - install GitNexus for full features'
  };
}

/**
 * 符号搜索
 */
function searchSymbol(symbol, projectDir) {
  log(`\n搜索符号: ${symbol}`, 'blue');
  
  // 检测可用工具
  const gitnexus = detectTool('gitnexus');
  const rg = detectTool('rg');
  
  if (gitnexus.available) {
    return gitnexusQuery(`symbol:${symbol}`, projectDir);
  } else if (rg.available) {
    try {
      const result = execSync(
        `rg -n "${symbol}" "${projectDir}" -g "!node_modules" -g "!*.min.js"`,
        { encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 }
      );
      return { success: true, output: result, tool: 'ripgrep' };
    } catch (e) {
      return { success: false, output: `No results for: ${symbol}`, tool: 'ripgrep' };
    }
  } else {
    // 使用基础 grep
    try {
      const result = execSync(
        `grep -rn "${symbol}" "${projectDir}"`,
        { encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 }
      );
      return { success: true, output: result, tool: 'grep' };
    } catch (e) {
      return { success: false, output: `No results for: ${symbol}`, tool: 'grep' };
    }
  }
}

/**
 * 调用链分析
 */
function analyzeCallChain(functionName, projectDir) {
  log(`\n分析调用链: ${functionName}`, 'blue');
  
  const gitnexus = detectTool('gitnexus');
  
  if (gitnexus.available) {
    return gitnexusQuery(`call-chain:${functionName}`, projectDir);
  } else {
    // Fallback: 搜索函数定义和引用
    log('⚠️  GitNexus 不可用，使用降级分析', 'yellow');
    
    const { execSync } = require('child_process');
    
    try {
      // 查找函数定义
      const defResult = execSync(
        `grep -rn "function\\s*${functionName}\\|const\\s*${functionName}\\s*=\\|async\\s*function\\s*${functionName}" "${projectDir}"`,
        { encoding: 'utf8' }
      );
      
      // 查找函数调用
      const callResult = execSync(
        `grep -rn "${functionName}(" "${projectDir}" -l`,
        { encoding: 'utf8' }
      );
      
      return {
        success: true,
        output: `定义:\n${defResult}\n\n调用:\n${callResult}`,
        tool: 'grep-fallback',
        warning: 'Limited analysis - install GitNexus for full call chain'
      };
    } catch (e) {
      return { success: false, output: `No results for: ${functionName}`, tool: 'grep-fallback' };
    }
  }
}

/**
 * 依赖分析
 */
function analyzeDependencies(filePath, projectDir) {
  log(`\n分析依赖: ${filePath}`, 'blue');
  
  const gitnexus = detectTool('gitnexus');
  
  if (gitnexus.available) {
    return gitnexusQuery(`deps:${filePath}`, projectDir);
  } else {
    log('⚠️  GitNexus 不可用', 'yellow');
    return {
      success: false,
      output: 'Dependency analysis requires GitNexus',
      tool: 'none',
      recommendation: 'Install GitNexus: npm install -g gitnexus'
    };
  }
}

/**
 * 健康检查
 */
function healthCheck(projectDir) {
  log('\n外部工具健康检查:', 'blue');
  
  const tools = [
    { name: 'gitnexus', cmd: 'gitnexus --version' },
    { name: 'grep', cmd: 'grep --version' },
    { name: 'ripgrep', cmd: 'rg --version' },
    { name: 'git', cmd: 'git --version' },
    { name: 'npm', cmd: 'npm --version' },
    { name: 'node', cmd: 'node --version' }
  ];
  
  const results = [];
  
  for (const tool of tools) {
    const detected = detectTool(tool.name);
    if (detected.available) {
      log(`  ✅ ${tool.name}`, 'green');
      results.push({ ...detected, required: isRequired(tool.name) });
    } else {
      const req = isRequired(tool.name) ? ' (必需)' : ' (可选)';
      log(`  ❌ ${tool.name}${req}`, 'yellow');
      results.push({ ...detected, required: isRequired(tool.name) });
    }
  }
  
  return results;
}

function isRequired(tool) {
  return ['git', 'node'].includes(tool);
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
External Tool Adapter

用法: node bin/external-adapter.js <command> [args...]

命令:
  detect [tool]       检测工具是否可用
  search <symbol>     搜索符号
  call-chain <fn>     分析调用链
  deps <file>         分析文件依赖
  health              健康检查

示例:
  node bin/external-adapter.js detect gitnexus
  node bin/external-adapter.js search handleClick
  node bin/external-adapter.js call-chain processData
  node bin/external-adapter.js health
`);
    process.exit(0);
  }
  
  const command = args[0];
  const projectDir = process.cwd();
  let result;
  
  switch (command) {
    case 'detect':
      const tool = args[1] || 'all';
      if (tool === 'all') {
        healthCheck(projectDir);
      } else {
        const detected = detectTool(tool);
        if (detected.available) {
          log(`✅ ${detected.name} 可用`, 'green');
        } else {
          log(`❌ ${tool} 不可用`, 'red');
        }
      }
      break;
    
    case 'search':
      if (!args[1]) {
        logError('请提供要搜索的符号');
        process.exit(1);
      }
      result = searchSymbol(args[1], projectDir);
      console.log('\n' + result.output);
      if (result.warning) {
        log(`\n⚠️  ${result.warning}`, 'yellow');
      }
      break;
    
    case 'call-chain':
      if (!args[1]) {
        logError('请提供函数名');
        process.exit(1);
      }
      result = analyzeCallChain(args[1], projectDir);
      console.log('\n' + result.output);
      if (result.warning) {
        log(`\n⚠️  ${result.warning}`, 'yellow');
      }
      break;
    
    case 'deps':
      if (!args[1]) {
        logError('请提供文件路径');
        process.exit(1);
      }
      result = analyzeDependencies(args[1], projectDir);
      console.log('\n' + result.output);
      if (result.recommendation) {
        log(`\n💡 ${result.recommendation}`, 'blue');
      }
      break;
    
    case 'health':
      healthCheck(projectDir);
      break;
    
    default:
      logError(`未知命令: ${command}`);
      process.exit(1);
  }
}

main().catch(err => {
  console.error('执行失败:', err);
  process.exit(1);
});
