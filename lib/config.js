/**
 * 配置管理模块
 * 提供配置文件加载、默认配置等功能
 */

const fs = require('fs');
const findConfig = require('find-config');
const path = require('path');

// 默认配置
const defaultConfig = {
  changelog: {
    filename: 'CHANGELOG.md',
    outputPath: './',
    encoding: 'utf8',
    createIfNotExists: true
  },
  format: {
    dateFormat: 'YYYY-MM-DD',
    timezone: 'Asia/Shanghai',
    headerTemplate: '## [{version}] - {date}',
    commitTemplate: '- {message} ({hash})',
    sectionSeparator: '\n\n',
    commitSeparator: '\n'
  },
  git: {
    includeHash: true,
    hashLength: 7,
    includeMergeCommits: false,
    commitMessageFilters: {
      exclude: [
        '^Merge',
        '^merge',
        '^Update',
        '^update'
      ],
      include: []
    }
  },
  versioning: {
    autoDetectVersion: true,
    versionSource: 'package.json',
    fallbackVersion: '1.0.0',
    versionPrefix: 'v'
  },
  output: {
    prependToFile: true,
    addTimestamp: true,
    backupExisting: false,
    verbose: true
  },
  customSections: {
    enabled: false,
    sections: []
  }
};

/**
 * 查找并加载用户配置
 * @returns {Object} 合并后的配置对象
 */
function loadConfig() {
  // 查找用户配置文件
  const configPath = findConfig('changelog-config.json');
  
  let userConfig = {};
  
  if (configPath) {
    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      userConfig = JSON.parse(configContent);
      console.log(`已加载配置文件: ${configPath}`);
    } catch (error) {
      console.warn('配置文件解析错误，将使用默认配置:', error.message);
      userConfig = {};
    }
  } else {
    console.log('未找到配置文件，使用默认配置');
  }
  
  // 深度合并配置对象
  const mergedConfig = deepMerge(defaultConfig, userConfig);
  
  return mergedConfig;
}

/**
 * 深度合并两个对象
 * @param {Object} target - 目标对象
 * @param {Object} source - 源对象
 * @returns {Object} 合并后的对象
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}



/**
 * 格式化时间戳
 * @param {Date|string|number} date - 日期对象、时间戳或日期字符串
 * @param {Object} config - 配置对象
 * @returns {string} 格式化后的时间戳
 */
function formatTimestamp(date = new Date(), config = {}) {
  const formatConfig = config.format || defaultConfig.format;
  const dateFormat = formatConfig.dateFormat || 'YYYY-MM-DD';
  
  // 确保 date 是 Date 对象
  let dateObj;
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string' || typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    dateObj = new Date();
  }
  
  // 检查日期是否有效
  if (isNaN(dateObj.getTime())) {
    console.warn('警告: 无效的日期参数，使用当前时间');
    dateObj = new Date();
  }
  
  // 简单的日期格式化实现
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hour = String(dateObj.getHours()).padStart(2, '0');
  const minute = String(dateObj.getMinutes()).padStart(2, '0');
  const second = String(dateObj.getSeconds()).padStart(2, '0');
  
  return dateFormat
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second);
}

/**
 * 获取 changelog 文件的完整路径
 * @param {Object} config - 配置对象
 * @returns {string} changelog 文件的完整路径
 */
function getChangelogPath(config = {}) {
  const changelogConfig = config.changelog || defaultConfig.changelog;
  const outputPath = changelogConfig.outputPath || './';
  const filename = changelogConfig.filename || 'CHANGELOG.md';
  
  return path.resolve(outputPath, filename);
}

/**
 * 过滤提交消息
 * @param {string} message - 提交消息
 * @param {Object} config - 配置对象
 * @returns {boolean} 是否应该包含此提交
 */
function shouldIncludeCommit(message, config = {}) {
  const gitConfig = config.git || defaultConfig.git;
  const filters = gitConfig.commitMessageFilters || { exclude: [], include: [] };
  
  // 检查排除规则
  if (filters.exclude && filters.exclude.length > 0) {
    for (const pattern of filters.exclude) {
      if (new RegExp(pattern, 'i').test(message)) {
        return false;
      }
    }
  }
  
  // 检查包含规则（如果有的话）
  if (filters.include && filters.include.length > 0) {
    for (const pattern of filters.include) {
      if (new RegExp(pattern, 'i').test(message)) {
        return true;
      }
    }
    return false; // 如果有包含规则但都不匹配，则排除
  }
  
  return true; // 默认包含
}

/**
 * 根据提交消息分类到自定义分组
 * @param {string} message - 提交消息
 * @param {Object} config - 配置对象
 * @returns {Object|null} 匹配的分组信息，如果没有匹配则返回 null
 */
function categorizeCommit(message, config = {}) {
  const customSections = config.customSections || defaultConfig.customSections;
  
  if (!customSections.enabled || !customSections.sections) {
    return null;
  }
  
  for (const section of customSections.sections) {
    if (section.keywords && section.keywords.length > 0) {
      for (const keyword of section.keywords) {
        if (new RegExp(`\\b${keyword}\\b`, 'i').test(message)) {
          return section;
        }
      }
    }
  }
  
  return null;
}

/**
 * 格式化提交消息
 * @param {Object} commit - 提交对象 {hash, message}
 * @param {Object} config - 配置对象
 * @returns {string} 格式化后的提交消息
 */
function formatCommitMessage(commit, config = {}) {
  const formatConfig = config.format || defaultConfig.format;
  const gitConfig = config.git || defaultConfig.git;
  const template = formatConfig.commitTemplate || '- {message} ({hash})';
  
  let hash = commit.hash;
  if (gitConfig.includeHash && gitConfig.hashLength) {
    hash = hash.substring(0, gitConfig.hashLength);
  }
  
  return template
    .replace('{message}', commit.message)
    .replace('{hash}', hash);
}

/**
 * 格式化版本头部
 * @param {string} version - 版本号
 * @param {Date} date - 日期
 * @param {Object} config - 配置对象
 * @returns {string} 格式化后的版本头部
 */
function formatVersionHeader(version, date, config = {}) {
  const formatConfig = config.format || defaultConfig.format;
  const versioningConfig = config.versioning || defaultConfig.versioning;
  const template = formatConfig.headerTemplate || '## [{version}] - {date}';
  
  const formattedDate = formatTimestamp(date, config);
  const versionWithPrefix = versioningConfig.versionPrefix ? 
    `${versioningConfig.versionPrefix}${version}` : version;
  
  return template
    .replace('{version}', versionWithPrefix)
    .replace('{date}', formattedDate);
}

/**
 * 验证配置的有效性
 * @param {Object} config - 配置对象
 * @returns {boolean} 配置是否有效
 */
function validateConfig(config) {
  if (!config || typeof config !== 'object') {
    return false;
  }
  
  // 检查必要的配置项
  if (config.changelog && (!config.changelog.filename || typeof config.changelog.filename !== 'string')) {
    return false;
  }
  
  return true;
}

module.exports = {
  defaultConfig,
  loadConfig,
  getChangelogPath,
  formatTimestamp,
  validateConfig,
  deepMerge,
  shouldIncludeCommit,
  categorizeCommit,
  formatCommitMessage,
  formatVersionHeader
};