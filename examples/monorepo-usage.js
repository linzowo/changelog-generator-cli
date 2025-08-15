/**
 * Monorepo 架构使用示例
 * 演示如何在 monorepo 项目中为特定子项目生成 changelog
 */

const { generateChangelog, previewChangelog } = require('../index');
const path = require('path');

/**
 * 为 monorepo 中的特定项目生成 changelog
 */
async function generateMonorepoChangelog() {
  try {
    console.log('🏗️  Monorepo Changelog 生成示例');
    console.log('=' * 50);
    
    // 示例：为 packages/ui-components 项目生成 changelog
    const result = await generateChangelog({
      projectRoot: process.cwd(), // monorepo 根目录
      projectPath: 'packages/ui-components', // 特定项目路径
      force: false
    });
    
    if (result.success) {
      if (result.updated) {
        console.log('✅ UI Components 项目 changelog 生成成功！');
        console.log(`📁 文件路径: ${result.changelogPath}`);
        console.log(`📦 版本: ${result.version}`);
        console.log(`📝 新增提交: ${result.commitsCount} 条`);
      } else {
        console.log('ℹ️  UI Components 项目没有新的提交需要更新');
      }
    } else {
      console.error('❌ 生成失败:', result.message);
    }
    
  } catch (error) {
    console.error('❌ 执行出错:', error.message);
  }
}

/**
 * 预览多个子项目的 changelog
 */
async function previewMultipleProjects() {
  const projects = [
    'packages/ui-components',
    'packages/utils',
    'packages/api-client'
  ];
  
  console.log('\n🔍 预览多个项目的 changelog');
  console.log('=' * 50);
  
  for (const projectPath of projects) {
    try {
      console.log(`\n📁 项目: ${projectPath}`);
      console.log('-' * 30);
      
      const result = await previewChangelog({
        projectRoot: process.cwd(),
        projectPath: projectPath
      });
      
      if (result.success) {
        if (result.hasNewCommits) {
          console.log(`📦 版本: ${result.version}`);
          console.log(`📝 新增提交: ${result.commitsCount} 条`);
          console.log('预览内容:');
          console.log(result.previewContent);
        } else {
          console.log('ℹ️  没有新的提交');
        }
      } else {
        console.log('❌ 预览失败:', result.message);
      }
      
    } catch (error) {
      console.log('❌ 预览出错:', error.message);
    }
  }
}

/**
 * 批量生成所有子项目的 changelog
 */
async function batchGenerateChangelogs() {
  const projects = [
    { path: 'packages/ui-components', name: 'UI Components' },
    { path: 'packages/utils', name: 'Utils' },
    { path: 'packages/api-client', name: 'API Client' }
  ];
  
  console.log('\n🚀 批量生成 changelog');
  console.log('=' * 50);
  
  const results = [];
  
  for (const project of projects) {
    try {
      console.log(`\n📁 处理项目: ${project.name} (${project.path})`);
      
      const result = await generateChangelog({
        projectRoot: process.cwd(),
        projectPath: project.path,
        force: false
      });
      
      results.push({
        project: project.name,
        path: project.path,
        success: result.success,
        updated: result.updated,
        commitsCount: result.commitsCount || 0,
        message: result.message
      });
      
      if (result.success && result.updated) {
        console.log(`✅ ${project.name} 更新成功 (${result.commitsCount} 条提交)`);
      } else {
        console.log(`ℹ️  ${project.name} ${result.message}`);
      }
      
    } catch (error) {
      console.log(`❌ ${project.name} 处理失败:`, error.message);
      results.push({
        project: project.name,
        path: project.path,
        success: false,
        error: error.message
      });
    }
  }
  
  // 输出汇总报告
  console.log('\n📊 批量处理汇总报告');
  console.log('=' * 50);
  
  const successful = results.filter(r => r.success && r.updated);
  const skipped = results.filter(r => r.success && !r.updated);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ 成功更新: ${successful.length} 个项目`);
  successful.forEach(r => {
    console.log(`   - ${r.project}: ${r.commitsCount} 条提交`);
  });
  
  console.log(`ℹ️  跳过更新: ${skipped.length} 个项目`);
  skipped.forEach(r => {
    console.log(`   - ${r.project}: ${r.message}`);
  });
  
  if (failed.length > 0) {
    console.log(`❌ 处理失败: ${failed.length} 个项目`);
    failed.forEach(r => {
      console.log(`   - ${r.project}: ${r.error || r.message}`);
    });
  }
}

/**
 * 主函数：演示不同的使用场景
 */
async function main() {
  console.log('🎯 Monorepo Changelog 工具使用演示');
  console.log('=' * 60);
  
  // 场景1：为单个项目生成 changelog
  await generateMonorepoChangelog();
  
  // 场景2：预览多个项目的 changelog
  await previewMultipleProjects();
  
  // 场景3：批量生成所有项目的 changelog
  await batchGenerateChangelogs();
  
  console.log('\n🎉 演示完成！');
}

// 如果直接运行此文件，则执行演示
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  generateMonorepoChangelog,
  previewMultipleProjects,
  batchGenerateChangelogs
};