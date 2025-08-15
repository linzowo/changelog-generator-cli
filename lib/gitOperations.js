/**
 * Git 操作相关模块
 * 提供 Git 命令执行、提交信息获取等功能
 */

const { execSync } = require('child_process');

/**
 * 执行 git 命令
 * @param {string} command - Git 命令
 * @returns {string} 命令执行结果
 * @throws {Error} 当命令执行失败时抛出错误
 */
function execGit(command) {
  try {
    return execSync(command, { encoding: 'utf-8' }).trim();
  } catch (err) {
    throw new Error(`❌ Git 命令执行失败: ${command}\n${err.message}`);
  }
}

/**
 * 获取当前 commit ID
 * @returns {string} 当前提交的完整 hash
 */
function getCurrentCommitId() {
  return execGit('git rev-parse HEAD');
}

/**
 * 获取新提交记录
 * @param {string|null} sinceCommit - 起始提交 ID，如果为 null 则获取所有提交
 * @param {Object} options - 选项配置
 * @param {string} options.projectPath - 项目路径，用于 monorepo 架构下的项目筛选
 * @returns {Array} 提交记录数组，每个元素包含 hash 和 message
 */
function getNewCommits(sinceCommit, options = {}) {
  let range = 'HEAD';
  if (sinceCommit) {
    range = `${sinceCommit}..HEAD`;
  }

  // 构建 git log 命令
  let gitCommand = `git log ${range} --pretty=format:"%H%n%h%n%s%n%b" --reverse`;
  
  // 如果指定了项目路径，添加路径过滤
  if (options.projectPath) {
    gitCommand += ` -- ${options.projectPath}`;
  }

  // 执行 git log 命令
  const logOutput = execGit(gitCommand);

  if (!logOutput) return [];

  const lines = logOutput.split('\n');
  const commits = [];
  let i = 0;

  while (i < lines.length) {
    const fullHash = lines[i++]?.trim() || '';
    const shortHash = lines[i++]?.trim() || '';
    const subject = lines[i++]?.trim() || '';
    
    // 收集 body：直到遇到下一个 commit 的 %H 或结束
    const bodyLines = [];
    while (i < lines.length && !lines[i].match(/^[a-f0-9]{40}$/)) {
      const line = lines[i++].trim();
      if (line) bodyLines.push(line); // 只保留非空行
    }

    const body = bodyLines.length > 0 ? bodyLines.join('\n') : '';

    // 构建提交信息
    let message = subject;
    if (body) {
      message += `\n${body}`;
    }

    commits.push({ 
      hash: shortHash, 
      message: message 
    });
  }

  return commits;
}

/**
 * 获取当前版本号
 * @param {Object} config - 配置对象
 * @returns {string} 当前版本号
 */
function getCurrentVersion(config = {}) {
  const { getPackageVersion } = require('./fileOperations');
  const versioningConfig = config.versioning || {};
  
  if (versioningConfig.autoDetectVersion !== false) {
    try {
      return getPackageVersion();
    } catch (error) {
      console.warn('无法从 package.json 获取版本号，使用回退版本');
      return versioningConfig.fallbackVersion || '1.0.0';
    }
  }
  
  return versioningConfig.fallbackVersion || '1.0.0';
}

/**
 * 获取自上次标签以来的提交
 * @param {Object} options - 选项
 * @returns {Array} 提交记录数组
 */
function getCommitsSinceLastTag(options = {}) {
  try {
    // 获取最新的标签
    const latestTag = execGit('git describe --tags --abbrev=0');
    return getNewCommits(latestTag);
  } catch (error) {
    // 如果没有标签，返回所有提交
    return getNewCommits(null);
  }
}

/**
 * 检查是否在 Git 仓库中
 * @returns {boolean} 是否在 Git 仓库中
 */
function isGitRepository() {
  try {
    execGit('git rev-parse --git-dir');
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  execGit,
  getCurrentCommitId,
  getNewCommits,
  getCurrentVersion,
  getCommitsSinceLastTag,
  isGitRepository
};