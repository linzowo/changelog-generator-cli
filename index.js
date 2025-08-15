#!/usr/bin/env node

/**
 * Changelog Generator - 主入口文件
 * 提供模块化 API 供其他项目使用
 * 
 * @author changelogCli
 * @version 1.0.0
 */

const { generateChangelog, previewChangelog } = require('./lib/generator');
const { loadConfig, getDefaultConfig } = require('./lib/config');
const { initializeConfig, configExists, getConfigPath } = require('./lib/initConfig');
const { getCommitsSinceLastTag, getCurrentVersion } = require('./lib/gitOperations');
const { readChangelogFile, writeChangelogFile, backupFile } = require('./lib/fileOperations');

/**
 * Changelog Generator API
 * 提供完整的 changelog 生成功能
 */
class ChangelogGenerator {
  constructor(options = {}) {
    this.config = null;
    this.options = {
      configPath: options.configPath || null,
      force: options.force || false,
      preview: options.preview || false,
      verbose: options.verbose || false,
      ...options
    };
  }

  /**
   * 初始化配置
   * @param {Object} customConfig - 自定义配置
   * @returns {Promise<Object>} 配置对象
   */
  async init(customConfig = {}) {
    try {
      this.config = await loadConfig(this.options.configPath);
      
      // 合并自定义配置
      if (Object.keys(customConfig).length > 0) {
        this.config = { ...this.config, ...customConfig };
      }
      
      return this.config;
    } catch (error) {
      if (this.options.verbose) {
        console.error('配置初始化失败:', error.message);
      }
      throw error;
    }
  }

  /**
   * 生成 changelog
   * @param {Object} options - 生成选项
   * @returns {Promise<Object>} 生成结果
   */
  async generate(options = {}) {
    if (!this.config) {
      await this.init();
    }

    const generateOptions = {
      force: options.force || this.options.force,
      preview: options.preview || this.options.preview,
      ...options
    };

    try {
      if (generateOptions.preview) {
        return await previewChangelog(this.config, generateOptions);
      } else {
        return await generateChangelog(this.config, generateOptions);
      }
    } catch (error) {
      if (this.options.verbose) {
        console.error('Changelog 生成失败:', error.message);
      }
      throw error;
    }
  }

  /**
   * 预览 changelog
   * @param {Object} options - 预览选项
   * @returns {Promise<Object>} 预览结果
   */
  async preview(options = {}) {
    return await this.generate({ ...options, preview: true });
  }

  /**
   * 获取当前配置
   * @returns {Object} 当前配置
   */
  getConfig() {
    return this.config;
  }

  /**
   * 更新配置
   * @param {Object} newConfig - 新配置
   * @returns {Object} 更新后的配置
   */
  updateConfig(newConfig) {
    if (!this.config) {
      this.config = getDefaultConfig();
    }
    this.config = { ...this.config, ...newConfig };
    return this.config;
  }

  /**
   * 获取 Git 提交记录
   * @param {Object} options - 选项
   * @returns {Promise<Array>} 提交记录数组
   */
  async getCommits(options = {}) {
    if (!this.config) {
      await this.init();
    }

    try {
      return await getCommitsSinceLastTag(this.config, options);
    } catch (error) {
      if (this.options.verbose) {
        console.error('获取提交记录失败:', error.message);
      }
      throw error;
    }
  }

  /**
   * 获取当前版本
   * @returns {Promise<string>} 当前版本号
   */
  async getVersion() {
    if (!this.config) {
      await this.init();
    }

    try {
      return await getCurrentVersion(this.config);
    } catch (error) {
      if (this.options.verbose) {
        console.error('获取版本号失败:', error.message);
      }
      throw error;
    }
  }
}

/**
 * 快速生成 changelog 的便捷函数
 * @param {Object} options - 生成选项
 * @returns {Promise<Object>} 生成结果
 */
async function quickGenerate(options = {}) {
  const generator = new ChangelogGenerator(options);
  await generator.init();
  return await generator.generate(options);
}

/**
 * 快速预览 changelog 的便捷函数
 * @param {Object} options - 预览选项
 * @returns {Promise<Object>} 预览结果
 */
async function quickPreview(options = {}) {
  const generator = new ChangelogGenerator(options);
  await generator.init();
  return await generator.preview(options);
}

/**
 * 初始化配置文件的便捷函数
 * @param {Object} options - 初始化选项
 * @returns {Promise<Object>} 初始化结果
 */
async function quickInit(options = {}) {
  try {
    return await initializeConfig(options);
  } catch (error) {
    if (options.verbose) {
      console.error('配置初始化失败:', error.message);
    }
    throw error;
  }
}

// 导出主要 API
module.exports = {
  // 主类
  ChangelogGenerator,
  
  // 便捷函数
  quickGenerate,
  quickPreview,
  quickInit,
  
  // 核心模块
  generator: { generateChangelog, previewChangelog },
  config: { loadConfig, getDefaultConfig },
  initConfig: { initializeConfig, configExists, getConfigPath },
  gitOperations: { getCommitsSinceLastTag, getCurrentVersion },
  fileOperations: { readChangelogFile, writeChangelogFile, backupFile },
  
  // 工具函数
  utils: {
    configExists,
    getConfigPath,
    loadConfig: (path) => loadConfig(path),
    getDefaultConfig
  }
};

// 如果直接运行此文件，显示使用说明
if (require.main === module) {
  console.log('\n📝 Changelog Generator - 模块化 API');
  console.log('\n使用方式:');
  console.log('const { ChangelogGenerator, quickGenerate } = require(\'changelog-cli\');');
  console.log('\n示例:');
  console.log('// 使用类方式');
  console.log('const generator = new ChangelogGenerator();');
  console.log('await generator.init();');
  console.log('const result = await generator.generate();');
  console.log('\n// 使用便捷函数');
  console.log('const result = await quickGenerate({ preview: true });');
  console.log('\n更多信息请查看 README.md\n');
}