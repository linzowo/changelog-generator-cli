/**
 * 配置文件初始化模块
 * 提供创建默认配置文件的功能
 */

const fs = require('fs');
const path = require('path');

// 配置文件名
const CONFIG_FILE = 'changelog-config.json';
const EXAMPLE_CONFIG_FILE = 'changelog-config.example.json';

// 默认配置内容
const defaultConfigContent = {
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
    sections: [
      {
        title: '🚀 新功能',
        keywords: ['feat', 'feature', 'add']
      },
      {
        title: '🐛 修复',
        keywords: ['fix', 'bug', 'patch']
      },
      {
        title: '📝 文档',
        keywords: ['docs', 'doc', 'readme']
      },
      {
        title: '🎨 样式',
        keywords: ['style', 'format', 'ui']
      },
      {
        title: '♻️ 重构',
        keywords: ['refactor', 'refact']
      },
      {
        title: '⚡ 性能',
        keywords: ['perf', 'performance']
      },
      {
        title: '✅ 测试',
        keywords: ['test', 'spec']
      },
      {
        title: '🔧 构建',
        keywords: ['build', 'ci', 'deploy']
      }
    ]
  }
};

/**
 * 初始化配置文件
 * @param {boolean} force 是否强制覆盖已存在的配置文件
 * @returns {Promise<boolean>} 是否成功创建配置文件
 */
async function initConfig(force = false) {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  const exampleConfigPath = path.join(__dirname, '..', EXAMPLE_CONFIG_FILE);
  
  try {
    // 检查配置文件是否已存在
    if (fs.existsSync(configPath) && !force) {
      console.log(`配置文件已存在: ${configPath}`);
      console.log('如需重新创建，请使用 --force 参数');
      return false;
    }
    
    let configContent;
    
    // 优先使用示例配置文件的内容
    if (fs.existsSync(exampleConfigPath)) {
      try {
        const exampleContent = fs.readFileSync(exampleConfigPath, 'utf8');
        configContent = exampleContent;
        console.log('使用示例配置文件模板创建配置');
      } catch (error) {
        console.warn('读取示例配置文件失败，使用默认配置:', error.message);
        configContent = JSON.stringify(defaultConfigContent, null, 2);
      }
    } else {
      // 如果示例配置文件不存在，使用默认配置
      configContent = JSON.stringify(defaultConfigContent, null, 2);
      console.log('使用默认配置创建配置文件');
    }
    
    // 写入配置文件
    fs.writeFileSync(configPath, configContent, 'utf8');
    
    console.log(`✅ 配置文件创建成功: ${configPath}`);
    console.log('💡 请根据需要修改配置文件中的设置');
    
    return true;
    
  } catch (error) {
    console.error('❌ 创建配置文件失败:', error.message);
    throw error;
  }
}

/**
 * 检查配置文件是否存在
 * @returns {boolean} 配置文件是否存在
 */
function configExists() {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  return fs.existsSync(configPath);
}

/**
 * 获取配置文件路径
 * @returns {string} 配置文件的完整路径
 */
function getConfigPath() {
  return path.join(process.cwd(), CONFIG_FILE);
}

/**
 * 创建示例配置文件
 * @returns {Promise<boolean>} 是否成功创建示例配置文件
 */
async function createExampleConfig() {
  const exampleConfigPath = path.join(process.cwd(), EXAMPLE_CONFIG_FILE);
  
  try {
    const configContent = JSON.stringify(defaultConfigContent, null, 2);
    fs.writeFileSync(exampleConfigPath, configContent, 'utf8');
    
    console.log(`✅ 示例配置文件创建成功: ${exampleConfigPath}`);
    return true;
    
  } catch (error) {
    console.error('❌ 创建示例配置文件失败:', error.message);
    throw error;
  }
}

/**
 * 验证现有配置文件
 * @returns {Object} 验证结果
 */
function validateExistingConfig() {
  const configPath = getConfigPath();
  
  if (!fs.existsSync(configPath)) {
    return {
      valid: false,
      message: '配置文件不存在',
      path: configPath
    };
  }
  
  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);
    
    // 基本验证
    if (!config.changelogFile) {
      return {
        valid: false,
        message: '配置文件缺少 changelogFile 字段',
        path: configPath
      };
    }
    
    return {
      valid: true,
      message: '配置文件有效',
      path: configPath,
      config
    };
    
  } catch (error) {
    return {
      valid: false,
      message: `配置文件解析失败: ${error.message}`,
      path: configPath
    };
  }
}

module.exports = {
  initConfig,
  configExists,
  getConfigPath,
  createExampleConfig,
  validateExistingConfig,
  defaultConfigContent
};