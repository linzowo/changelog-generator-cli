#!/usr/bin/env node

/**
 * 高级使用示例
 * 演示自定义配置、过滤规则、模板系统等高级功能
 */

const { ChangelogGenerator } = require('../index.js');
const path = require('path');
const fs = require('fs');

async function advancedUsageExample() {
  console.log('=== Changelog Generator CLI 高级使用示例 ===\n');

  try {
    // 创建自定义配置
    const customConfig = {
      format: 'markdown',
      changelog: {
        includeAuthor: true,
        includeDate: true,
        includeHash: true,
        groupByType: true,
        sortBy: 'date',
        template: {
          header: '# 📋 更新日志\n\n本文档记录了项目的所有重要变更。\n',
          versionHeader: '## [{version}] - {date}\n',
          commitGroup: '### {type}\n',
          commitItem: '- **{scope}**: {subject} ([{hash}]({repoUrl}/commit/{hash})) - {author}\n'
        }
      },
      git: {
        repoUrl: 'https://github.com/linzowo/changelog-generator-cli',
        branch: 'main',
        since: null,
        until: 'HEAD'
      },
      versioning: {
        autoIncrement: true,
        tagPrefix: 'v',
        prerelease: false
      },
      output: {
        file: './examples/CHANGELOG-advanced.md',
        encoding: 'utf8',
        backup: true
      },
      customSections: {
        breaking: {
          title: '💥 破坏性变更',
          filter: (commit) => commit.notes && commit.notes.some(note => note.title === 'BREAKING CHANGE')
        },
        security: {
          title: '🔒 安全修复',
          filter: (commit) => commit.type === 'security' || /security|vulnerability/i.test(commit.subject)
        },
        performance: {
          title: '⚡ 性能优化',
          filter: (commit) => commit.type === 'perf' || /performance|optimize/i.test(commit.subject)
        }
      },
      filters: {
        includeCommits: (commit) => {
          // 排除合并提交和版本标签提交
          if (commit.subject.startsWith('Merge ') || commit.subject.startsWith('v\d')) {
            return false;
          }
          // 只包含有意义的提交类型
          const meaningfulTypes = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'security'];
          return !commit.type || meaningfulTypes.includes(commit.type);
        },
        excludeScopes: ['temp', 'wip', 'debug'],
        includeAuthors: ['linzowo', 'bot'],
        minSubjectLength: 10
      }
    };

    // 保存自定义配置到临时文件
    const configPath = path.join(__dirname, 'custom-config.json');
    fs.writeFileSync(configPath, JSON.stringify(customConfig, null, 2));
    console.log('📝 创建自定义配置文件:', configPath);

    // 使用自定义配置创建生成器
    const generator = new ChangelogGenerator({ configPath });

    console.log('\n1. 获取过滤后的提交记录:');
    const commits = await generator.getCommits({ limit: 10 });
    console.log(`📊 找到 ${commits.length} 条符合条件的提交`);
    
    // 按类型分组显示
    const groupedCommits = {};
    commits.forEach(commit => {
      const type = commit.type || 'other';
      if (!groupedCommits[type]) {
        groupedCommits[type] = [];
      }
      groupedCommits[type].push(commit);
    });

    Object.entries(groupedCommits).forEach(([type, typeCommits]) => {
      console.log(`  ${type}: ${typeCommits.length} 条`);
      typeCommits.slice(0, 2).forEach(commit => {
        console.log(`    - ${commit.subject.substring(0, 50)}...`);
      });
    });

    console.log('\n2. 生成带自定义分组的 changelog:');
    const result = await generator.generate({
      version: '2.0.0',
      verbose: true
    });
    console.log('✅ 高级生成完成:', result);

    console.log('\n3. 演示配置更新:');
    // 动态更新配置
    generator.updateConfig({
      changelog: {
        ...generator.getConfig().changelog,
        includeAuthor: false,
        template: {
          ...generator.getConfig().changelog.template,
          commitItem: '- {subject} `{hash}`\n'
        }
      }
    });
    console.log('📝 配置已更新: 移除作者信息，简化提交格式');

    console.log('\n4. 使用更新后的配置生成简化版本:');
    const simpleResult = await generator.generate({
      output: './examples/CHANGELOG-simple.md',
      version: '2.0.1'
    });
    console.log('✅ 简化版生成完成:', simpleResult);

    console.log('\n5. 演示版本管理:');
    const currentVersion = generator.getVersion();
    console.log('📋 当前版本:', currentVersion);
    
    // 清理临时文件
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
      console.log('🧹 清理临时配置文件');
    }

  } catch (error) {
    console.error('❌ 高级示例执行失败:', error.message);
    console.error('详细错误:', error.stack);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  advancedUsageExample().catch(console.error);
}

module.exports = { advancedUsageExample };