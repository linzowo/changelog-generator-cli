/**
 * 文件操作相关模块
 * 提供 package.json 读取、changelog 文件处理等功能
 */

const { readFileSync, writeFileSync, existsSync } = require('fs');
const path = require('path');

/**
 * 读取 package.json 获取版本号
 * @param {string} projectRoot - 项目根目录路径
 * @returns {string} 版本号
 * @throws {Error} 当文件不存在或缺少版本字段时抛出错误
 */
function getPackageVersion(projectRoot = process.cwd()) {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    throw new Error(`❌ ${packageJsonPath} 文件不存在！`);
  }
  
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  if (!pkg.version) {
    throw new Error('❌ package.json 中缺少 version 字段！');
  }
  
  return pkg.version;
}

/**
 * 获取上次发布的最后提交 ID
 * @param {string} changelogPath - changelog 文件路径
 * @returns {string|null} 上次提交的 ID，如果文件不存在则返回 null
 */
function getLastCommitId(changelogPath) {
  if (!existsSync(changelogPath)) {
    console.log('📝 首次生成 CHANGELOG，包含所有提交。');
    return null;
  }

  const content = readFileSync(changelogPath, 'utf-8');
  const match = content.match(/最后提交的id：(.+)/);
  return match ? match[1].trim() : null;
}

/**
 * 生成新的 changelog 条目
 * @param {string} version - 版本号
 * @param {string} timestamp - 时间戳
 * @param {Array} commits - 提交记录数组
 * @param {string} lastCommitId - 最后提交ID
 * @param {Object} config - 配置对象
 * @returns {string} 格式化的 changelog 条目
 */
function generateNewEntry(version, timestamp, commits, lastCommitId, config = {}) {
  // 这个函数现在主要由 generator.js 中的新逻辑替代
  // 保留用于向后兼容
  const commitLines = commits.map(commit => {
    if (config.format && config.format.commitTemplate) {
      return config.format.commitTemplate
        .replace('{message}', commit.message)
        .replace('{hash}', commit.hash.substring(0, config.git?.hashLength || 7));
    }
    return `- ${commit.message} (${commit.hash.substring(0, 7)})`;
  });
  
  const header = config.format?.headerTemplate 
    ? config.format.headerTemplate
        .replace('{version}', version)
        .replace('{date}', timestamp)
    : `## [${version}] - ${timestamp}`;
  
  const separator = config.format?.sectionSeparator || '\n\n';
  const commitSeparator = config.format?.commitSeparator || '\n';
  
  return `${header}${separator}${commitLines.join(commitSeparator)}${separator}`;
}

/**
 * 写入 changelog 文件
 * @param {string} changelogPath - changelog 文件路径
 * @param {string} newEntry - 新的条目内容
 */
function writeChangelog(changelogPath, newEntry) {
  let oldContent = '';
  if (existsSync(changelogPath)) {
    oldContent = readFileSync(changelogPath, 'utf-8');
  }

  writeFileSync(changelogPath, newEntry + oldContent);
}

/**
 * 获取最新的 changelog 条目
 * @param {string} changelogPath - changelog 文件路径
 * @returns {Object} 最新的 changelog 信息
 */
function getLatestChangelog(changelogPath) {
  if (!existsSync(changelogPath)) {
    return {
      success: false,
      error: 'CHANGELOG_NOT_FOUND',
      message: `❌ CHANGELOG 文件不存在: ${changelogPath}`
    };
  }

  const content = readFileSync(changelogPath, 'utf-8');
  
  if (!content.trim()) {
    return {
      success: false,
      error: 'CHANGELOG_EMPTY',
      message: '❌ CHANGELOG 文件为空'
    };
  }

  // 匹配版本标题格式: ## [版本号] - 日期
  const versionHeaderRegex = /^##\s*\[([^\]]+)\]\s*-\s*(.+)$/gm;
  const matches = [...content.matchAll(versionHeaderRegex)];
  
  if (matches.length === 0) {
    return {
      success: false,
      error: 'NO_VERSION_FOUND',
      message: '❌ 未找到有效的版本信息，请检查 CHANGELOG 格式'
    };
  }

  // 获取第一个（最新的）版本信息
  const firstMatch = matches[0];
  const version = firstMatch[1].trim();
  const date = firstMatch[2].trim();
  const versionStartIndex = firstMatch.index;
  
  // 确定版本内容的结束位置
  let versionEndIndex = content.length;
  if (matches.length > 1) {
    versionEndIndex = matches[1].index;
  }
  
  // 提取版本内容
  const versionContent = content.substring(versionStartIndex, versionEndIndex).trim();
  
  // 提取版本内容（不包含标题）
  const contentLines = versionContent.split('\n');
  const contentWithoutHeader = contentLines.slice(1).join('\n').trim();
  
  return {
    success: true,
    version,
    date,
    content: contentWithoutHeader,
    fullContent: versionContent,
    raw: content
  };
}

/**
 * 检查文件是否存在
 * @param {string} filePath - 文件路径
 * @returns {boolean} 文件是否存在
 */
function fileExists(filePath) {
  return existsSync(filePath);
}

/**
 * 读取文件内容
 * @param {string} filePath - 文件路径
 * @param {string} encoding - 编码格式，默认为 utf-8
 * @returns {string} 文件内容
 */
function readFile(filePath, encoding = 'utf-8') {
  return readFileSync(filePath, encoding);
}

/**
 * 写入文件内容
 * @param {string} filePath - 文件路径
 * @param {string} content - 文件内容
 * @param {string} encoding - 编码格式，默认为 utf-8
 */
function writeFile(filePath, content, encoding = 'utf-8') {
  writeFileSync(filePath, content, encoding);
}

module.exports = {
  getPackageVersion,
  getLastCommitId,
  generateNewEntry,
  writeChangelog,
  getLatestChangelog,
  fileExists,
  readFile,
  writeFile
};