# Changelog Generator CLI

一个强大且灵活的命令行工具，用于自动化生成项目更新日志（changelog）。

## 目录

- [Changelog Generator CLI](#changelog-generator-cli)
  - [目录](#目录)
  - [特性](#特性)
  - [安装](#安装)
    - [全局安装（推荐）](#全局安装推荐)
    - [本地项目安装](#本地项目安装)
    - [验证安装](#验证安装)
  - [快速开始](#快速开始)
    - [1. 初始化配置](#1-初始化配置)
    - [2. 生成 Changelog](#2-生成-changelog)
    - [3. 管理配置](#3-管理配置)
  - [配置文件](#配置文件)
  - [命令行选项](#命令行选项)
    - [主命令](#主命令)
    - [生成命令](#生成命令)
    - [初始化命令](#初始化命令)
    - [配置命令](#配置命令)
    - [最新版本查询命令](#最新版本查询命令)
  - [使用示例](#使用示例)
    - [基础使用](#基础使用)
    - [高级使用](#高级使用)
    - [npm scripts 集成](#npm-scripts-集成)
  - [Monorepo 架构支持](#monorepo-架构支持)
    - [基本用法](#基本用法)
    - [工作原理](#工作原理)
    - [Monorepo 最佳实践](#monorepo-最佳实践)
  - [模块化 API](#模块化-api)
    - [类式 API](#类式-api)
    - [函数式 API](#函数式-api)
    - [模块导入](#模块导入)
  - [自定义分组](#自定义分组)
  - [过滤规则](#过滤规则)
  - [模板系统](#模板系统)
  - [AI 工作规则集](#ai-工作规则集)
  - [故障排除](#故障排除)
    - [常见问题](#常见问题)
    - [调试模式](#调试模式)
  - [系统要求](#系统要求)
  - [支持的操作系统](#支持的操作系统)
  - [许可证](#许可证)
  - [贡献](#贡献)
  - [更新日志](#更新日志)
  - [作者](#作者)
  - [相关项目](#相关项目)

## 特性

- 🚀 简单易用的命令行界面
- 📝 支持多种 changelog 格式和模板
- ⚙️ 灵活的配置文件支持
- 🔍 智能的 Git 提交分析和分类
- 📊 支持自定义分组和过滤规则
- 🎨 丰富的格式化选项
- 🔒 安全的文件备份机制
- 📦 提供模块化 API 供其他项目使用
- 🏗️ **Monorepo 架构支持** - 支持项目路径筛选，适用于多包项目
- 📋 **最新版本查询** - 快速获取最新 changelog 条目，支持多种输出格式
- 🎯 **智能版本检测** - 自动从 package.json 读取版本信息
- 🔄 **增量更新** - 只处理自上次发布以来的新提交

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
    "dateFormat": "YYYY-MM-DD HH:mm:ss",
    "timezone": "Asia/Shanghai",
    "headerTemplate": "## [{version}] - {date} - {lastCommitId}",
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
changelog-gen [options] [project-path]

选项：
  -p, --preview              预览 changelog 内容（不写入文件）
  -f, --force                强制生成（即使没有新提交）
  --project-path <path>      monorepo 中的项目路径，用于筛选特定项目的提交
  -v, --version              显示版本号
  -h, --help                 显示帮助信息
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
```

### 最新版本查询命令

```bash
changelog-gen latest [options]

选项：
  -f, --format <type>        输出格式 (json|text|markdown)，默认: text
  -o, --output <file>        输出到文件
  --version-only             仅显示版本号
  --content-only             仅显示内容（不含版本信息）
  --changelog-path <path>    指定 CHANGELOG.md 文件路径
  -q, --quiet                静默模式，减少输出信息（适合脚本使用）
  --raw                      原始输出，无格式化（适合脚本处理）
```

## 使用示例

### 基础使用

```bash
# 1. 初始化配置
changelog-gen init

# 2. 预览生成内容
changelog-gen --preview

# 3. 生成 changelog
changelog-gen

# 4. 查看最新版本信息
changelog-gen latest
```

### 高级使用

```bash
# 强制生成（即使没有新提交）
changelog-gen --force

# Monorepo 项目：筛选特定包的提交
changelog-gen --project-path packages/my-package

# 预览特定项目的 changelog
changelog-gen --preview --project-path packages/my-package

# 检查配置并显示内容
changelog-gen config --check --show

# 获取最新版本的 JSON 格式输出
changelog-gen latest --format json

# 仅获取版本号（适合脚本使用）
changelog-gen latest --version-only --quiet

# 将最新 changelog 输出到文件
changelog-gen latest --output latest-changes.md --format markdown
```

### npm scripts 集成

在 `package.json` 中添加：

```json
{
  "scripts": {
    "changelog:init": "changelog-gen init",
    "changelog:preview": "changelog-gen --preview",
    "changelog:generate": "changelog-gen",
    "changelog:force": "changelog-gen --force",
    "changelog:latest": "changelog-gen latest",
    "version:check": "changelog-gen latest --version-only --quiet"
  }
}
```

然后使用：

```bash
npm run changelog:preview
npm run changelog:generate
npm run changelog:latest
npm run version:check
```

## Monorepo 架构支持

本工具专门针对 Monorepo 架构进行了优化，支持在多包项目中筛选特定项目的提交记录：

### 基本用法

```bash
# 为特定包生成 changelog
changelog-gen --project-path packages/ui-components

# 预览特定包的 changelog
changelog-gen --preview --project-path packages/api-client

# 强制为特定包生成 changelog
changelog-gen --force --project-path packages/utils
```

### 工作原理

当指定 `--project-path` 参数时，工具会：

1. **路径过滤**：只包含影响指定路径的提交记录
2. **智能识别**：自动识别与该路径相关的文件变更
3. **独立版本**：每个包可以有独立的版本管理
4. **配置隔离**：支持每个包使用独立的配置文件

### Monorepo 最佳实践

```bash
# 项目结构示例
my-monorepo/
├── packages/
│   ├── ui-components/
│   │   ├── package.json
│   │   └── changelog-config.json
│   ├── api-client/
│   │   ├── package.json
│   │   └── changelog-config.json
│   └── utils/
│       ├── package.json
│       └── changelog-config.json
└── package.json

# 为每个包生成独立的 changelog
cd packages/ui-components && changelog-gen
cd packages/api-client && changelog-gen
cd packages/utils && changelog-gen

# 或者在根目录统一管理
changelog-gen --project-path packages/ui-components
changelog-gen --project-path packages/api-client
changelog-gen --project-path packages/utils
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
    "headerTemplate": "## [{version}] - {date} - {lastCommitId}",
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

## AI 工作规则集

为了帮助 AI 助手更好地使用本工具生成标准的 changelog，我们提供了详细的工作规则集文档：

📖 **[AI Changelog 生成工作规则集](./AI-CHANGELOG-GUIDE.md)**

该文档包含：
- 🤖 完整的 AI 工作流程
- 🔧 核心工具命令详解
- 📝 提交记录处理规则
- 🎯 输出格式标准
- ⚠️ 常见问题处理方案
- 📊 质量检查清单

适用于：
- AI 助手自动化生成 changelog
- 开发团队标准化发版流程
- CI/CD 集成自动化文档生成

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

5. **Monorepo 项目路径问题**
   - 确保 `--project-path` 参数指向正确的包路径
   - 检查指定路径下是否有相关的提交记录
   - 验证包路径下是否存在 `package.json` 文件

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