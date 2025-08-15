// scripts/generate-changelog.js

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// ✅ 使用 process.cwd() 获取项目根目录（推荐）
const PROJECT_ROOT = process.cwd();
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');
const CHANGELOG_PATH = path.join(PROJECT_ROOT, 'CHANGELOG.txt');

// 如果你坚持用 import.meta.url，也可以这样兼容处理（复杂，不推荐）：
// const __dirname = path.dirname(new URL(import.meta.url).pathname);
// 但在 Windows 上仍可能出问题，所以 process.cwd() 更好

// 读取 package.json 获取版本号
function getPackageVersion() {
  if (!existsSync(PACKAGE_JSON_PATH)) {
    throw new Error(`❌ ${PACKAGE_JSON_PATH} 文件不存在！`);
  }
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
  if (!pkg.version) {
    throw new Error('❌ package.json 中缺少 version 字段！');
  }
  return pkg.version;
}

// 执行 git 命令
function execGit(command) {
  try {
    return execSync(command, { encoding: 'utf-8' }).trim();
  } catch (err) {
    throw new Error(`❌ Git 命令执行失败: ${command}\n${err.message}`);
  }
}

// 获取上次发布的最后提交 ID
function getLastCommitId() {
  if (!existsSync(CHANGELOG_PATH)) {
    console.log('📝 首次生成 CHANGELOG，包含所有提交。');
    return null;
  }

  const content = readFileSync(CHANGELOG_PATH, 'utf-8');
  const match = content.match(/最后提交的id：(.+)/);
  return match ? match[1].trim() : null;
}

// 获取新提交
function getNewCommits(sinceCommit) {
  let range = 'HEAD';
  if (sinceCommit) {
    range = `${sinceCommit}..HEAD`;
  }

  // ✅ 使用 %s 获取 subject，%b 获取 body（可能为空），%n 换行分隔
  const logFormat = '%H%n%h%n%s%n%b';
  const logOutput = execGit(`git log ${range} --pretty=format:"${logFormat}" --reverse`);

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

// 获取当前 commit ID
function getCurrentCommitId() {
  return execGit('git rev-parse HEAD');
}

// 生成新条目
function generateNewEntry(version, timestamp, commits, lastCommitId) {
  let content = `版本号：${version}\n`;
  content += `发版时间：${timestamp}\n`;
  content += `提交记录：\n`;
  content += `最后提交的id：${lastCommitId}\n`;

  commits.forEach(commit => {
    content += `提交id：${commit.hash} - ${commit.message}\n`;
  });

  content += '\n---\n\n';
  return content;
}

// 主函数
function main() {
  try {
    console.log('🔍 当前工作目录：', PROJECT_ROOT);

    const version = getPackageVersion();
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const currentCommitId = getCurrentCommitId();

    const lastCommitId = getLastCommitId();
    const newCommits = getNewCommits(lastCommitId);

    if (newCommits.length === 0) {
      console.log('✅ 没有新的提交，无需更新 CHANGELOG。');
      return;
    }

    const newEntry = generateNewEntry(version, timestamp, newCommits, currentCommitId);

    let oldContent = '';
    if (existsSync(CHANGELOG_PATH)) {
      oldContent = readFileSync(CHANGELOG_PATH, 'utf-8');
    }

    writeFileSync(CHANGELOG_PATH, newEntry + oldContent);

    console.log(`✅ Changelog 已更新：${CHANGELOG_PATH}`);
    console.log(`版本：${version} | 新增 ${newCommits.length} 条提交 | 最新 commit: ${currentCommitId}`);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

main();