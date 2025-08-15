# Changelog Generator CLI

一个强大且灵活的命令行工具，用于自动化生成项目更新日志（changelog）。

## 特性

- 🚀 简单易用的命令行界面
- 📝 支持多种 changelog 格式和模板
- ⚙️ 灵活的配置文件支持
- 🔍 智能的 Git 提交分析和分类
- 📊 支持自定义分组和过滤规则
- 🎨 丰富的格式化选项
- 🔒 安全的文件备份机制
- 📦 提供模块化 API 供其他项目使用

## 安装

### 全局安装（推荐）

从 npm 仓库安装：

```bash
# 全局安装
npm install -g changelog-generator-cli

# 验证安装
changelog-gen --version
```

从 GitHub 源码安装：

```bash
# 克隆仓库
git clone https://github.com/linzowo/changelog-generator-cli.git
cd changelog-generator-cli

# 安装依赖
npm install

# 全局链接
npm link
```

### 本地项目安装

```bash
npm install changelog-generator-cli
```

### 验证安装

```bash
# 查看版本
changelog-gen --version

# 查看帮助
changelog-gen --help
```

## 快速开始

### 1. 初始化配置

使用 `init` 命令快速创建配置文件：

```bash
# 创建默认配置文件
changelog-gen init

# 强制覆盖已存在的配置文件
changelog-gen init --force
```

### 2. 生成 Changelog

```bash
# 生成 changelog
changelog-gen generate

# 预览 changelog（不写入文件）
changelog-gen generate --preview

# 强制生成（即使没有新提交）
changelog-gen generate --force

# Monorepo 支持：筛选特定项目的提交
changelog-gen generate --project-path packages/my-package

# 预览特定项目的 changelog
changelog-gen generate --preview --project-path packages/my-package
```

### 3. 管理配置

```bash
# 检查配置文件
changelog-gen config --check

# 显示当前配置
changelog-gen config --show
```

## 配置文件

配置文件 `changelog-config.json` 支持丰富的自定义选项：

```json
{
  "changelog": {
    "filename": "CHANGELOG.md",
    "outputPath": "./",
    "encoding": "utf8",
    "createIfNotExists": true
  },
  "format": {
    "dateFormat": "YYYY-MM-DD",
    "timezone": "Asia/Shanghai",
    "headerTemplate": "## [{version}] - {date}",
    "commitTemplate": "- {message} ({hash})",
    "sectionSeparator": "\n\n",
    "commitSeparator": "\n"
  },
  "git": {
    "includeHash": true,
    "hashLength": 7,
    "includeMergeCommits": false,
    "commitMessageFilters": {
      "exclude": ["^Merge", "^merge"],
      "include": []
    }
  },
  "versioning": {
    "autoDetectVersion": true,
    "versionSource": "package.json",
    "fallbackVersion": "1.0.0",
    "versionPrefix": "v"
  },
  "output": {
    "prependToFile": true,
    "addTimestamp": false,
    "backupExisting": true,
    "verbose": false
  },
  "customSections": {
    "enabled": true,
    "sections": [
      {
        "title": "🚀 新功能",
        "keywords": ["feat", "feature", "add"]
      },
      {
        "title": "🐛 修复",
        "keywords": ["fix", "bug", "patch"]
      },
      {
        "title": "📝 文档",
        "keywords": ["docs", "doc", "readme"]
      }
    ]
  }
}
```

## 命令行选项

### 主命令

```bash
changelog-gen [command] [options]
```

### 生成命令

```bash
changelog-gen generate [options]

选项：
  -p, --preview     预览 changelog 内容（不写入文件）
  -f, --force       强制生成（即使没有新提交）
  -v, --verbose     显示详细输出
  -c, --config <path>  指定配置文件路径
```

### 初始化命令

```bash
changelog-gen init [options]

选项：
  -f, --force       强制覆盖已存在的配置文件
  -v, --verbose     显示详细输出
```

### 配置命令

```bash
changelog-gen config [options]

选项：
  --check           检查配置文件是否存在
  --show            显示当前配置内容
  -v, --verbose     显示详细输出
```

## 使用示例

### 基础使用

```bash
# 1. 初始化配置
changelog-gen init

# 2. 预览生成内容
changelog-gen generate --preview

# 3. 生成 changelog
changelog-gen generate
```

### 高级使用

```bash
# 使用自定义配置文件
changelog-gen generate --config ./my-config.json

# 强制生成并显示详细信息
changelog-gen generate --force --verbose

# 检查配置并显示内容
changelog-gen config --check --show
```

### npm scripts 集成

在 `package.json` 中添加：

```json
{
  "scripts": {
    "changelog:init": "changelog-gen init",
    "changelog:preview": "changelog-gen generate --preview",
    "changelog:generate": "changelog-gen generate",
    "changelog:force": "changelog-gen generate --force"
  }
}
```

然后使用：

```bash
npm run changelog:preview
npm run changelog:generate
```

## 模块化 API

除了命令行工具，还提供了模块化 API 供其他项目使用：

### 类式 API

```javascript
const { ChangelogGenerator } = require('changelog-generator-cli');

// 创建实例
const generator = new ChangelogGenerator({
  configPath: './my-config.json',
  verbose: true
});

// 初始化配置
await generator.init();

// 生成 changelog
const result = await generator.generate();
console.log('生成结果:', result);

// 预览 changelog
const preview = await generator.preview();
console.log('预览内容:', preview.content);
```

### 函数式 API

```javascript
const { quickGenerate, quickPreview, quickInit } = require('changelog-generator-cli');

// 快速生成
const result = await quickGenerate({ force: true });

// 快速预览
const preview = await quickPreview();

// 快速初始化
const initResult = await quickInit({ force: true });
```

### 模块导入

```javascript
const { 
  generator,
  config,
  gitOperations,
  fileOperations 
} = require('changelog-generator-cli');

// 使用特定模块
const commits = await gitOperations.getCommitsSinceLastTag();
const currentConfig = await config.loadConfig();
```

## 自定义分组

支持根据提交消息关键词自动分组：

```json
{
  "customSections": {
    "enabled": true,
    "sections": [
      {
        "title": "🚀 新功能",
        "keywords": ["feat", "feature", "add"]
      },
      {
        "title": "🐛 修复",
        "keywords": ["fix", "bug", "patch"]
      },
      {
        "title": "📝 文档",
        "keywords": ["docs", "doc", "readme"]
      },
      {
        "title": "🎨 样式",
        "keywords": ["style", "css", "ui"]
      },
      {
        "title": "♻️ 重构",
        "keywords": ["refactor", "refact"]
      },
      {
        "title": "⚡ 性能",
        "keywords": ["perf", "performance"]
      },
      {
        "title": "✅ 测试",
        "keywords": ["test", "spec"]
      },
      {
        "title": "🔧 其他",
        "keywords": []
      }
    ]
  }
}
```

## 过滤规则

支持灵活的提交消息过滤：

```json
{
  "git": {
    "commitMessageFilters": {
      "exclude": [
        "^Merge",
        "^merge",
        "^WIP",
        "^temp"
      ],
      "include": [
        "^feat",
        "^fix",
        "^docs"
      ]
    }
  }
}
```

## 模板系统

支持自定义模板格式：

```json
{
  "format": {
    "headerTemplate": "## [{version}] - {date}",
    "commitTemplate": "- {message} ({hash})",
    "sectionSeparator": "\n\n",
    "commitSeparator": "\n"
  }
}
```

可用变量：
- `{version}` - 版本号
- `{date}` - 日期
- `{message}` - 提交消息
- `{hash}` - 提交哈希

## 故障排除

### 常见问题

1. **命令未找到**
   ```bash
   # 确保全局安装
   npm install -g changelog-generator-cli
   
   # 或使用 npx
   npx changelog-generator-cli --version
   ```

2. **配置文件未找到**
   ```bash
   # 初始化配置文件
   changelog-gen init
   ```

3. **没有 Git 仓库**
   ```bash
   # 确保在 Git 仓库中运行
   git init
   git add .
   git commit -m "Initial commit"
   ```

4. **没有新提交**
   ```bash
   # 使用强制模式
   changelog-gen generate --force
   ```

### 调试模式

使用 `--verbose` 选项获取详细输出：

```bash
changelog-gen generate --verbose
```

## 系统要求

- Node.js >= 14.0.0
- npm >= 6.0.0
- Git（用于获取提交记录）

## 支持的操作系统

- Windows
- macOS
- Linux

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解版本更新历史。

## 作者

- **linzowo** - [linzowo@outlook.com](mailto:linzowo@outlook.com)

## 相关项目

- [dingtalk-notify-cli](https://github.com/linzowo/dingtalk-notify-cli) - 钉钉通知 CLI 工具

---

如果这个工具对你有帮助，请给个 ⭐ Star 支持一下！