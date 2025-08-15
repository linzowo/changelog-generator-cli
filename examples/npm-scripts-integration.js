#!/usr/bin/env node

/**
 * NPM Scripts 集成示例
 * 演示如何在 package.json scripts 中集成 changelog 生成
 */

const { ChangelogGenerator, quickGenerate } = require('../index.js');
const fs = require('fs');
const path = require('path');

/**
 * 发布前自动生成 changelog
 */
async function preReleaseScript() {
  console.log('🚀 执行发布前脚本...');
  
  try {
    // 读取当前 package.json 获取版本
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const currentVersion = packageJson.version;
    
    console.log(`📦 当前版本: ${currentVersion}`);
    
    // 生成 changelog
    const result = await quickGenerate({
      version: currentVersion,
      output: './CHANGELOG.md',
      verbose: true
    });
    
    console.log('✅ Changelog 生成完成:', result.file);
    console.log(`📝 包含 ${result.commitsCount} 条提交记录`);
    
    return result;
  } catch (error) {
    console.error('❌ 发布前脚本失败:', error.message);
    process.exit(1);
  }
}

/**
 * 版本发布后脚本
 */
async function postReleaseScript() {
  console.log('🎉 执行发布后脚本...');
  
  try {
    // 创建发布总结
    const generator = new ChangelogGenerator();
    const commits = await generator.getCommits({ limit: 10 });
    
    const summary = {
      timestamp: new Date().toISOString(),
      commitsIncluded: commits.length,
      types: [...new Set(commits.map(c => c.type || 'other'))],
      authors: [...new Set(commits.map(c => c.author))]
    };
    
    console.log('📊 发布总结:', summary);
    
    // 保存发布总结
    const summaryPath = './release-summary.json';
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log('💾 发布总结已保存:', summaryPath);
    
    return summary;
  } catch (error) {
    console.error('❌ 发布后脚本失败:', error.message);
    // 发布后脚本失败不应该阻止发布流程
  }
}

/**
 * 开发环境 changelog 预览
 */
async function devPreviewScript() {
  console.log('👀 开发环境 changelog 预览...');
  
  try {
    const generator = new ChangelogGenerator();
    
    // 获取未发布的提交
    const commits = await generator.getCommits({ 
      since: 'HEAD~10',  // 最近 10 次提交
      limit: 20 
    });
    
    if (commits.length === 0) {
      console.log('📭 没有新的提交记录');
      return;
    }
    
    console.log(`📋 预览 ${commits.length} 条未发布的提交:`);
    
    // 按类型分组
    const grouped = commits.reduce((acc, commit) => {
      const type = commit.type || 'other';
      if (!acc[type]) acc[type] = [];
      acc[type].push(commit);
      return acc;
    }, {});
    
    Object.entries(grouped).forEach(([type, typeCommits]) => {
      console.log(`\n  ${getTypeEmoji(type)} ${type.toUpperCase()}:`);
      typeCommits.forEach(commit => {
        const scope = commit.scope ? `(${commit.scope})` : '';
        console.log(`    - ${commit.subject}${scope}`);
      });
    });
    
    // 生成预览文件
    const previewResult = await generator.preview({
      version: 'unreleased',
      output: './CHANGELOG-preview.md'
    });
    
    console.log('\n📄 预览文件已生成:', previewResult.file);
    
  } catch (error) {
    console.error('❌ 预览脚本失败:', error.message);
  }
}

/**
 * 获取提交类型对应的 emoji
 */
function getTypeEmoji(type) {
  const emojiMap = {
    feat: '✨',
    fix: '🐛',
    docs: '📚',
    style: '💄',
    refactor: '♻️',
    perf: '⚡',
    test: '✅',
    chore: '🔧',
    security: '🔒',
    other: '📝'
  };
  return emojiMap[type] || '📝';
}

/**
 * 示例 package.json scripts 配置
 */
function showExampleScripts() {
  const exampleScripts = {
    "scripts": {
      "changelog:preview": "node examples/npm-scripts-integration.js preview",
      "changelog:generate": "node examples/npm-scripts-integration.js generate",
      "preversion": "npm run test && npm run changelog:generate",
      "version": "git add CHANGELOG.md",
      "postversion": "git push && git push --tags && node examples/npm-scripts-integration.js post-release",
      "release:patch": "npm version patch",
      "release:minor": "npm version minor",
      "release:major": "npm version major",
      "dev:changelog": "node examples/npm-scripts-integration.js preview"
    }
  };
  
  console.log('📋 建议的 package.json scripts 配置:');
  console.log(JSON.stringify(exampleScripts, null, 2));
}

// 命令行接口
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'preview':
      await devPreviewScript();
      break;
    case 'generate':
      await preReleaseScript();
      break;
    case 'post-release':
      await postReleaseScript();
      break;
    case 'show-scripts':
      showExampleScripts();
      break;
    default:
      console.log('=== NPM Scripts 集成示例 ===\n');
      console.log('可用命令:');
      console.log('  preview      - 开发环境预览');
      console.log('  generate     - 生成 changelog');
      console.log('  post-release - 发布后处理');
      console.log('  show-scripts - 显示示例配置');
      console.log('\n使用方法:');
      console.log('  node examples/npm-scripts-integration.js <command>');
      break;
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  preReleaseScript,
  postReleaseScript,
  devPreviewScript,
  showExampleScripts
};