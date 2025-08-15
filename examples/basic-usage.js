#!/usr/bin/env node

/**
 * 基础使用示例
 * 演示如何使用 changelog-generator-cli 的基本功能
 */

const { ChangelogGenerator, quickGenerate, quickPreview } = require('../index.js');
const path = require('path');

async function basicUsageExample() {
  console.log('=== Changelog Generator CLI 基础使用示例 ===\n');

  try {
    // 示例 1: 使用快速生成函数
    console.log('1. 使用快速生成函数:');
    const result1 = await quickGenerate({
      output: './examples/CHANGELOG-basic.md',
      version: '1.0.0',
      verbose: true
    });
    console.log('✅ 快速生成完成:', result1);
    console.log();

    // 示例 2: 使用预览功能
    console.log('2. 使用预览功能:');
    const preview = await quickPreview({
      version: '1.0.1',
      limit: 5
    });
    console.log('📋 预览内容:');
    console.log(preview);
    console.log();

    // 示例 3: 使用类实例
    console.log('3. 使用 ChangelogGenerator 类:');
    const generator = new ChangelogGenerator({
      configPath: path.join(__dirname, '../changelog-config.example.json')
    });

    // 获取配置信息
    const config = generator.getConfig();
    console.log('📝 当前配置:', {
      format: config.format,
      includeAuthor: config.changelog.includeAuthor,
      groupByType: config.changelog.groupByType
    });

    // 获取提交记录
    const commits = await generator.getCommits({ limit: 3 });
    console.log('📊 最近 3 条提交:');
    commits.forEach((commit, index) => {
      console.log(`  ${index + 1}. [${commit.type || 'other'}] ${commit.subject}`);
    });

    // 生成 changelog
    const result3 = await generator.generate({
      output: './examples/CHANGELOG-class.md',
      version: '1.0.2'
    });
    console.log('✅ 类方式生成完成:', result3);

  } catch (error) {
    console.error('❌ 示例执行失败:', error.message);
    if (error.code === 'ENOENT') {
      console.log('💡 提示: 请确保在 Git 仓库中运行此示例');
    }
  }
}

// 如果直接运行此文件
if (require.main === module) {
  basicUsageExample().catch(console.error);
}

module.exports = { basicUsageExample };