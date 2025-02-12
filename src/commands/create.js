const path = require('path');
const fs = require('fs-extra');
const { select, Separator } = require('@inquirer/prompts');
const ora = require('ora');
const { successLog, errorLog } = require('../utils/logger');
const TemplateManager = require('../core/template-manager');
const installDependencies = require('../utils/installer');

module.exports = async (projectName) => {
  const spinner = ora();
  try {
    // 1. 获取用户配置
    const answers = await select({
      message: '选择技术栈',
      choices: [
        {
          name: 'Vue',
          value: 'vue',
          description: 'Vue is the most popular language',
        },
        {
          name: 'React',
          value: 'react',
          description: 'React is an awesome language',
        },
        //   new Separator(),
      ],
    });
    console.log('answers', answers);
    const config = {
      framework: answers,
      features: [],
      projectName: projectName || 'my-app',
    };

    // 2. 创建项目目录
    const projectPath = path.resolve(path.dirname(process.cwd()), projectName);
    await fs.ensureDir(projectPath);
    console.log('projectPath', projectPath);

    // 3. 处理模板
    const templateManager = new TemplateManager();
    await templateManager.render(config, projectPath);

    // 4. 安装依赖
    await installDependencies(projectPath, config);

    spinner.succeed('项目创建成功!');
    successLog(`cd ${projectName} && npm run dev`);
  } catch (error) {
    spinner.fail('创建失败');
    errorLog(error.message);
    process.exit(1);
  }
};
