/**
 * Changelog 生成器核心模块
 * 整合所有功能模块，提供主要的生成逻辑
 */

const { getCurrentCommitId, getNewCommits, isGitRepository } = require('./gitOperations');
const { getPackageVersion, getLastCommitId, generateNewEntry, writeChangelog } = require('./fileOperations');
const { 
  loadConfig, 
  getChangelogPath, 
  formatTimestamp, 
  shouldIncludeCommit,
  categorizeCommit,
  formatCommitMessage,
  formatVersionHeader,
  validateConfig 
} = require('./config');

/**
 * 生成 changelog
 * @param {Object} options - 生成选项
 * @param {string} options.projectRoot - 项目根目录，默认为当前工作目录
 * @param {Object} options.config - 自定义配置，如果不提供则自动加载
 * @param {boolean} options.force - 是否强制生成（即使没有新提交）
 * @param {string} options.projectPath - 项目路径，用于 monorepo 架构下的项目筛选
 * @returns {Object} 生成结果
 */
async function generateChangelog(options = {}) {
  const {
    projectRoot = process.cwd(),
    config = null,
    force = false,
    projectPath = null
  } = options;

  try {
    console.log('🔍 当前工作目录：', projectRoot);

    // 检查是否在 Git 仓库中
    if (!isGitRepository()) {
      throw new Error('❌ 当前目录不是 Git 仓库！');
    }

    // 加载配置
    const cfg = config || loadConfig();
    if (!validateConfig(cfg)) {
      throw new Error('❌ 配置文件无效！');
    }

    // 获取版本号和时间戳
    const version = getPackageVersion(projectRoot);
    const timestamp = formatTimestamp(new Date(), cfg);
    const currentCommitId = getCurrentCommitId();

    // 获取 changelog 文件路径
    const path = require('path');
    const changelogPath = path.resolve(projectRoot, getChangelogPath(cfg));

    // 获取上次发布的提交 ID
    const lastCommitId = getLastCommitId(changelogPath);
    
    // 获取新提交
    const newCommits = getNewCommits(lastCommitId, { projectPath });

    if (newCommits.length === 0 && !force) {
      console.log('✅ 没有新的提交，无需更新 CHANGELOG。');
      return {
        success: true,
        updated: false,
        message: '没有新的提交',
        version,
        commitsCount: 0,
        changelogPath
      };
    }

    // 过滤提交记录
    const filteredCommits = newCommits.filter(commit => {
      // 检查是否包含 merge commits
      if (!cfg.git.includeMergeCommits && commit.message.toLowerCase().includes('merge')) {
        return false;
      }
      
      // 应用自定义过滤规则
      return shouldIncludeCommit(commit.message, cfg);
    });
    
    if (filteredCommits.length === 0 && !force) {
      return {
        success: true,
        updated: false,
        message: '没有符合条件的新提交需要添加到 changelog',
        version,
        commitsCount: 0,
        changelogPath
      };
    }
    
    // 生成新条目
    const newEntry = generateNewEntry(version, timestamp, filteredCommits, currentCommitId, cfg);

    // 写入 changelog 文件
    writeChangelog(changelogPath, newEntry);

    console.log(`✅ Changelog 已更新：${changelogPath}`);
    console.log(`版本：${version} | 新增 ${newCommits.length} 条提交 | 最新 commit: ${currentCommitId}`);

    return {
      success: true,
      updated: true,
      message: 'Changelog 更新成功',
      version,
      commitsCount: filteredCommits.length,
      changelogPath,
      currentCommitId,
      newCommits: filteredCommits
    };

  } catch (err) {
    console.error(err.message);
    return {
      success: false,
      updated: false,
      message: err.message,
      error: err
    };
  }
}

/**
 * 预览将要生成的 changelog 内容（不实际写入文件）
 * @param {Object} options - 预览选项
 * @returns {Object} 预览结果
 */
async function previewChangelog(options = {}) {
  const {
    projectRoot = process.cwd(),
    config = null,
    projectPath = null
  } = options;

  try {
    // 检查是否在 Git 仓库中
    if (!isGitRepository()) {
      throw new Error('❌ 当前目录不是 Git 仓库！');
    }

    // 加载配置
    const cfg = config || loadConfig();
    if (!validateConfig(cfg)) {
      throw new Error('❌ 配置文件无效！');
    }

    // 获取版本号和时间戳
    const version = getPackageVersion(projectRoot);
    const timestamp = formatTimestamp(new Date(), cfg);
    const currentCommitId = getCurrentCommitId();

    // 获取 changelog 文件路径
    const path = require('path');
    const changelogPath = path.resolve(projectRoot, getChangelogPath(cfg));

    // 获取上次发布的提交 ID
    const lastCommitId = getLastCommitId(changelogPath);
    
    // 获取新提交
    const newCommits = getNewCommits(lastCommitId, { projectPath });

    if (newCommits.length === 0) {
      return {
        success: true,
        hasNewCommits: false,
        message: '没有新的提交',
        version,
        commitsCount: 0
      };
    }

    // 过滤提交记录
    const filteredCommits = newCommits.filter(commit => {
      // 检查是否包含 merge commits
      if (!cfg.git.includeMergeCommits && commit.message.toLowerCase().includes('merge')) {
        return false;
      }
      
      // 应用自定义过滤规则
      return shouldIncludeCommit(commit.message, cfg);
    });
    
    // 生成预览内容
    const currentDate = new Date();
    const versionHeader = formatVersionHeader(version, currentDate, cfg);
    
    let previewContent = versionHeader;
    
    if (filteredCommits.length === 0) {
      previewContent += '\n\n没有符合条件的新提交';
    } else {
      // 如果启用了自定义分组
      if (cfg.customSections.enabled && cfg.customSections.sections.length > 0) {
        const categorizedCommits = {};
        const uncategorizedCommits = [];
        
        // 分类提交
        for (const commit of filteredCommits) {
          const category = categorizeCommit(commit.message, cfg);
          if (category) {
            if (!categorizedCommits[category.title]) {
              categorizedCommits[category.title] = [];
            }
            categorizedCommits[category.title].push(commit);
          } else {
            uncategorizedCommits.push(commit);
          }
        }
        
        // 添加分类的提交
        for (const [sectionTitle, commits] of Object.entries(categorizedCommits)) {
          previewContent += `\n\n### ${sectionTitle}\n`;
          for (const commit of commits) {
            previewContent += formatCommitMessage(commit, cfg) + cfg.format.commitSeparator;
          }
        }
        
        // 添加未分类的提交
        if (uncategorizedCommits.length > 0) {
          previewContent += `\n\n### 其他更改\n`;
          for (const commit of uncategorizedCommits) {
            previewContent += formatCommitMessage(commit, cfg) + cfg.format.commitSeparator;
          }
        }
      } else {
        // 不使用分组，直接列出所有提交
        previewContent += cfg.format.sectionSeparator;
        for (const commit of filteredCommits) {
          previewContent += formatCommitMessage(commit, cfg) + cfg.format.commitSeparator;
        }
      }
    }
    
    return {
      success: true,
      hasNewCommits: filteredCommits.length > 0,
      previewContent,
      version,
      commitsCount: filteredCommits.length,
      changelogPath,
      currentCommitId,
      newCommits: filteredCommits
    };

  } catch (err) {
    return {
      success: false,
      hasNewCommits: false,
      message: err.message,
      error: err
    };
  }
}

module.exports = {
  generateChangelog,
  previewChangelog
};