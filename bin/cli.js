#!/usr/bin/env node

const { program } = require('commander');
const { generateChangelog, previewChangelog } = require('../lib/generator');
const { initConfig, configExists, validateExistingConfig } = require('../lib/initConfig');
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
        console.log('=' * 50);
        console.log(result.previewContent);
        console.log('=' * 50);
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

// 解析命令行参数
program.parse(process.argv);

// 如果没有提供任何参数，显示帮助信息
if (process.argv.length === 2) {
  program.help();
}