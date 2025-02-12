// src/utils/installer.js
const execa = require('execa');
const { detectPackageManager } = require('./helpers');
const { successLog, warnLog } = require('./logger');

// 不同技术栈的依赖映射表
const DEPENDENCY_MAP = {
  base: {
    vue: ['vue', 'vue-router'],
    react: ['react', 'react-dom', 'react-router-dom'],
  },
};

module.exports = async function installDependencies(projectPath, config) {
  const pm = detectPackageManager();
  const isYarnBerry = pm === 'yarn' && (await getYarnVersion(projectPath)) >= 2;

  // 合并依赖列表
  const { dependencies, devDependencies } = resolveDependencies(config);

  // 安装主依赖
  if (dependencies.length > 0) {
    await executeInstall(pm, dependencies, false, projectPath, isYarnBerry);
  }

  // 安装开发依赖
  if (devDependencies.length > 0) {
    await executeInstall(pm, devDependencies, true, projectPath, isYarnBerry);
  }

  successLog('依赖安装完成!');
};

// 解析用户选择的依赖
function resolveDependencies(config) {
  const result = { dependencies: [], devDependencies: [] };

  // 添加基础依赖
  result.dependencies.push(
    ...DEPENDENCY_MAP.base[config?.framework?.toLowerCase()]
  );

  // 添加功能依赖
//   config.features.forEach((feature) => {
//     const cfg = DEPENDENCY_MAP.features[feature];
//     if (!cfg) return;

//     const target = cfg.dev ? result.devDependencies : result.dependencies;
//     target.push(...cfg.deps);
//   });

  return result;
}

// 执行安装命令
async function executeInstall(pm, deps, isDev, cwd, isYarnBerry) {
  const args = [];

  if (pm === 'npm') {
    args.push('install', isDev ? '--save-dev' : '--save');
  } else if (pm === 'yarn') {
    args.push(isYarnBerry ? 'add' : 'add', isDev ? '-D' : '');
  } else if (pm === 'pnpm') {
    args.push('add', isDev ? '-D' : '');
  }

  args.push(...deps);

  try {
    await execa(pm, args.filter(Boolean), {
      cwd,
      stdio: 'inherit',
    });
  } catch (err) {
    warnLog(`依赖安装失败，请手动执行: ${pm} ${args.join(' ')}`);
  }
}

// 检测 Yarn Berry 版本
async function getYarnVersion(cwd) {
  try {
    const { stdout } = await execa('yarn', ['--version'], { cwd });
    return parseInt(stdout.split('.')[0], 10);
  } catch {
    return 1;
  }
}
