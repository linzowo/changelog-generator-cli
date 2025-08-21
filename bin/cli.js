#!/usr/bin/env node

const { program } = require('commander');
const { generateChangelog, previewChangelog } = require('../lib/generator');
const { initConfig, configExists, validateExistingConfig } = require('../lib/initConfig');
const { getLatestChangelog } = require('../lib/fileOperations');
const { getChangelogPath, loadConfig } = require('../lib/config');
const packageJson = require('../package.json');

// 设置程序基本信息
program
  .name('changelog-gen')
  .version(packageJson.version, '-v, --version', '显示版本号')
  .description('自动化生成项目更新日志（changelog）的命令行工具');

// 默认命令：生成 changelog
program
  .argument('[project-path]', '项目路径，默认为当前目录')
  .option('-f, --force', '强制生成，即使没有新提交')
  .option('-p, --preview', '预览模式，不实际写入文件')
  .option('--project-path <path>', 'monorepo 中的项目路径，用于筛选特定项目的提交')
  .action(async (projectPath, options) => {
    const projectRoot = projectPath || process.cwd();
    const filterProjectPath = options.projectPath;
    
    try {
      if (options.preview) {
        // 预览模式
        console.log('🔍 预览模式：生成 changelog 内容预览...');
        if (filterProjectPath) {
          console.log(`📁 筛选项目路径：${filterProjectPath}`);
        }
        const result = await previewChangelog({ 
          projectRoot, 
          projectPath: filterProjectPath 
        });
        
        if (!result.success) {
          console.error('❌ 预览失败:', result.message);
          process.exit(1);
        }
        
        if (!result.hasNewCommits) {
          console.log('✅ 没有新的提交需要添加到 changelog');
          return;
        }
        
        console.log('📋 预览内容：');
        console.log('='.repeat(50));
        console.log(result.previewContent);
        console.log('='.repeat(50));
        console.log(`版本：${result.version} | 新增 ${result.commitsCount} 条提交`);
        
      } else {
        // 正常生成模式
        console.log('📝 开始生成 changelog...');
        if (filterProjectPath) {
          console.log(`📁 筛选项目路径：${filterProjectPath}`);
        }
        const result = await generateChangelog({ 
          projectRoot, 
          force: options.force,
          projectPath: filterProjectPath
        });
        
        if (!result.success) {
          console.error('❌ 生成失败:', result.message);
          process.exit(1);
        }
        
        if (result.updated) {
          console.log('✅ Changelog 生成成功！');
        } else {
          console.log('✅ 无需更新 changelog');
        }
      }
      
    } catch (error) {
      console.error('❌ 执行失败:', error.message);
      process.exit(1);
    }
  });

// init 命令：初始化配置文件
program
  .command('init')
  .description('创建默认配置文件')
  .option('-f, --force', '强制覆盖已存在的配置文件')
  .action(async (options) => {
    try {
      const success = await initConfig(options.force);
      if (!success && !options.force) {
        console.log('💡 提示: 使用 --force 参数可以强制覆盖现有配置文件');
      }
    } catch (error) {
      console.error('❌ 初始化配置文件失败:', error.message);
      process.exit(1);
    }
  });

// config 命令：配置管理
program
  .command('config')
  .description('配置文件管理')
  .option('-c, --check', '检查配置文件是否存在和有效')
  .option('-s, --show', '显示当前配置内容')
  .action(async (options) => {
    try {
      if (options.check) {
        // 检查配置文件
        const validation = validateExistingConfig();
        
        if (validation.valid) {
          console.log('✅ 配置文件有效');
          console.log(`📁 配置文件路径: ${validation.path}`);
        } else {
          console.log('❌ 配置文件无效');
          console.log(`📁 配置文件路径: ${validation.path}`);
          console.log(`❗ 错误信息: ${validation.message}`);
          
          if (!configExists()) {
            console.log('💡 提示: 使用 "changelog-gen init" 创建配置文件');
          }
        }
        
      } else if (options.show) {
        // 显示配置内容
        const validation = validateExistingConfig();
        
        if (validation.valid) {
          console.log('📋 当前配置内容：');
          console.log(JSON.stringify(validation.config, null, 2));
        } else {
          console.log('❌ 无法显示配置:', validation.message);
        }
        
      } else {
        // 默认显示配置状态
        const exists = configExists();
        
        if (exists) {
          const validation = validateExistingConfig();
          console.log(`✅ 配置文件存在: ${validation.path}`);
          console.log(`📊 配置状态: ${validation.valid ? '有效' : '无效'}`);
          
          if (!validation.valid) {
            console.log(`❗ 错误信息: ${validation.message}`);
          }
        } else {
          console.log('❌ 配置文件不存在');
          console.log('💡 提示: 使用 "changelog-gen init" 创建配置文件');
        }
      }
      
    } catch (error) {
      console.error('❌ 配置管理失败:', error.message);
      process.exit(1);
    }
  });

// 帮助信息
program.on('--help', () => {
  console.log('');
  console.log('示例:');
  console.log('  $ changelog-gen                    # 在当前目录生成 changelog');
  console.log('  $ changelog-gen /path/to/project   # 在指定目录生成 changelog');
  console.log('  $ changelog-gen --preview          # 预览模式，不实际写入文件');
  console.log('  $ changelog-gen --force            # 强制生成，即使没有新提交');
  console.log('  $ changelog-gen init               # 创建配置文件');
  console.log('  $ changelog-gen config --check     # 检查配置文件');
  console.log('  $ changelog-gen config --show      # 显示配置内容');
  console.log('');
});

// latest 命令：获取最新的 changelog 条目
program
  .command('latest')
  .description('获取最新的 changelog 条目')
  .option('-f, --format <type>', '输出格式 (json|text|markdown)', 'text')
  .option('-o, --output <file>', '输出到文件')
  .option('--version-only', '仅显示版本号')
  .option('--content-only', '仅显示内容（不含版本信息）')
  .option('--changelog-path <path>', '指定 CHANGELOG.md 文件路径')
  .option('-q, --quiet', '静默模式，减少输出信息（适合脚本使用）')
  .option('--raw', '原始输出，无格式化（适合脚本处理）')
  .action(async (options) => {
    try {
      // 获取配置和 changelog 路径
      const config = configExists() ? loadConfig(options.quiet || options.raw) : {};
      const changelogPath = options.changelogPath || getChangelogPath(config);
      
         
      // 获取最新 changelog
      const result = await getLatestChangelog(changelogPath);
      
      if (!result.success) {
        if (!options.quiet) {
          console.error('❌ 获取最新 changelog 失败:', result.error);
          if (result.error.includes('文件不存在')) {
            console.log('💡 提示: 请确保 CHANGELOG.md 文件存在，或使用 --changelog-path 指定正确路径');
            console.log(`   当前查找路径: ${changelogPath}`);
          } else if (result.error.includes('未找到版本信息')) {
            console.log('💡 提示: CHANGELOG.md 文件可能为空或格式不正确');
            console.log('   请确保文件包含类似 "## [v1.0.0] - 2025-01-01" 的版本标题');
          }
        } else {
          // 静默模式下仅输出错误到 stderr
          console.error(result.error);
        }
        process.exit(1);
      }
      
      // 处理输出选项
      let output = '';
      
      if (options.raw) {
        // 原始输出模式：仅输出纯内容，无任何格式化
        if (options.versionOnly) {
          output = result.version;
        } else if (options.contentOnly) {
          output = result.content;
        } else {
          // 原始模式下默认输出完整内容
          output = result.fullContent;
        }
      } else if (options.versionOnly) {
        output = result.version;
      } else if (options.contentOnly) {
        output = result.content;
      } else {
        // 根据格式输出
        switch (options.format) {
          case 'json':
            output = JSON.stringify({
              version: result.version,
              date: result.date,
              content: result.content
            }, null, 2);
            break;
          case 'markdown':
            output = result.fullContent;
            break;
          case 'text':
          default:
            if (options.quiet) {
              // 静默模式下简化输出格式
              output = `${result.version}\n${result.date}\n\n${result.content}`;
            } else {
              output = `版本: ${result.version}\n日期: ${result.date}\n\n${result.content}`;
            }
            break;
        }
      }
      
      // 输出结果
      if (options.output) {
        const fs = require('fs');
        const path = require('path');
        
        // 确保输出目录存在
        const outputDir = path.dirname(options.output);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        fs.writeFileSync(options.output, output, 'utf8');
        if (!options.quiet) {
          console.log(`✅ 最新 changelog 已保存到: ${options.output}`);
        }
      } else {
        console.log(output);
      }
      
    } catch (error) {
      console.error('❌ 执行失败:', error.message);
      process.exit(1);
    }
  });

// 解析命令行参数
program.parse(process.argv);