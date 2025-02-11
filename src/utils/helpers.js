const path = require('path');
const fs = require('fs-extra');
const execa = require('execa');
const which = require('which');
/**
 * 检测当前环境使用的包管理器
 * 优先级：lock文件 > 环境变量 > 全局命令存在性
 */
const detectPackageManager = (targetPath = process.cwd()) => {
  // 通过 lock 文件检测
  const lockFiles = {
    'pnpm-lock.yaml': 'pnpm',
    'yarn.lock': 'yarn',
    'package-lock.json': 'npm',
  };

  for (const [file, manager] of Object.entries(lockFiles)) {
    if (fs.existsSync(path.join(targetPath, file))) {
      return manager;
    }
  }

  // 通过环境变量检测（兼容 CI 环境）
  const userAgent = process.env.npm_config_user_agent || '';
  if (userAgent.includes('yarn')) return 'yarn';
  if (userAgent.includes('pnpm')) return 'pnpm';

  // 通过全局命令存在性检测
  try {
    which.sync('pnpm');
    return 'pnpm';
  } catch {
    try {
      which.sync('yarn');
      return 'yarn';
    } catch {
      return 'npm'; // 默认回退
    }
  }
};

/**
 * 验证项目名称合法性
 */
const validateProjectName = (name) => {
  const INVALID_NAME_REGEX = /[^a-z0-9\-_]/g;
  const RESERVED_NAMES = ['node_modules', 'favicon.ico'];

  if (RESERVED_NAMES.includes(name)) {
    return `项目名不能使用保留名称 ${name}`;
  }

  if (INVALID_NAME_REGEX.test(name)) {
    return '项目名只能包含小写字母、数字、中划线和下划线';
  }

  return true;
};

/**
 * 清除控制台（跨平台兼容）
 */
const clearConsole = () => {
  process.stdout.write(
    process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H'
  );
};

/**
 * 检查网络连通性
 */
const checkNetwork = async () => {
  try {
    await execa('ping', ['-c', '1', '8.8.8.8']);
    return true;
  } catch {
    return false;
  }
};

module.exports = {
  detectPackageManager,
  validateProjectName,
  clearConsole,
  checkNetwork,
};
