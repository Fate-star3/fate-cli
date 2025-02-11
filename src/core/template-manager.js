const fs = require('fs-extra');
const path = require('path');
const ejs = require('ejs');
const globby = require('globby');

class TemplateManager {
  constructor(templateType) {
    this.templateRoot = path.join(__dirname, `../../templates/${templateType}`);
    console.log('this.templateRoot', this.templateRoot, templateType);
  }

  async render(config, targetPath) {
    // 1. 获取模板文件
    const files = await globby(['**/*'], {
      cwd: this.templateRoot,
      dot: true, // 包含隐藏文件
    });

    // 2. 动态渲染
    await Promise.all(
      files.map(async (file) => {
        const absPath = path.join(this.templateRoot, file);
        const content = await fs.readFile(absPath, 'utf-8');
        const rendered = ejs.render(content, config);
        // 处理特殊文件名
        const destPath = file.replace(/\.ejs$/, '');
        await fs.outputFile(path.join(targetPath, destPath), rendered);
      })
    );
  }
}
module.exports = TemplateManager;
