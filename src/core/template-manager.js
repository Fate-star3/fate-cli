const path = require('path');
const fs = require('fs-extra');
const ejs = require('ejs');
const globby = require('globby');
const { successLog } = require('../utils/logger');

class TemplateManager {
  constructor() {
    // 模板根目录路径（指向 templates/ 文件夹）
    this.templateRoot = path.resolve(__dirname, '../templates');
  }

  /**
   * 核心渲染方法
   * @param {Object} config - 用户配置（包含 framework/features 等字段）
   * @param {string} targetPath - 项目生成的目标路径
   */
  async render(config, targetPath) {
    // 1. 确定具体使用的模板目录（如 vue/react）
    const templateDir = path.join(
      this.templateRoot,
      config.framework.toLowerCase()
    );
    console.log('templateDir', templateDir, targetPath);

    // 2. 获取所有模板文件（包含 _shared 公共文件）
    const files = await this._getTemplateFiles(templateDir);

    // 3. 并行渲染所有文件
    await this._renderFiles(files, templateDir, targetPath, config);

    successLog(`成功生成 ${files.length} 个文件`);
  }

  /**
   * 获取需要渲染的文件列表（合并框架模板 + 公共模板）
   */
  async _getTemplateFiles(templateDir) {
    // 匹配规则：所有文件（包含隐藏文件），排除指定目录
    const patterns = [
      '**/*',
      '!_shared/node_modules', // 忽略示例中的测试目录
    ];

    // 使用 globby 进行智能文件匹配
    return await globby(patterns, {
      cwd: templateDir,
      dot: true, // 包含 .开头的文件
      absolute: false, // 返回相对路径
    });
  }

  /**
   * 执行实际的文件渲染操作
   */
  async _renderFiles(fileList, templateDir, targetPath, config) {
    // 合并用户配置与默认值
    const templateData = {
      ...config,
      currentYear: new Date().getFullYear(), // 注入额外变量
    };

    // 并行处理所有文件
    await Promise.all(
      fileList.map(async (relativePath) => {
        const sourcePath = path.join(templateDir, relativePath);
        const outputPath = this._getOutputPath(relativePath, targetPath);

        // 处理二进制文件（如图片）直接拷贝
        if (this._isBinaryFile(sourcePath)) {
          return fs.copy(sourcePath, outputPath);
        }

        // 渲染文本内容
        const content = await fs.readFile(sourcePath, 'utf-8');
        const rendered = await this._renderContent(content, templateData);

        await fs.outputFile(outputPath, rendered);
        successLog(`生成文件: ${path.relative(targetPath, outputPath)}`);
      })
    );
  }

  /**
   * 渲染模板内容（支持异步 EJS 标签）
   */
  async _renderContent(content, data) {
    try {
      return await ejs.render(content, data, {
        async: true, // 启用异步渲染
        escape: (text) => text, // 禁用 HTML 转义
      });
    } catch (err) {
      throw new Error(`模板渲染失败: ${err.message}`);
    }
  }

  /**
   * 处理输出路径（转换 .ejs 文件名）
   */
  _getOutputPath(relativePath, targetPath) {
    // 移除 .ejs 扩展名（如果存在）
    let outputName = relativePath.replace(/\.ejs$/, '');

    // 处理 Vue/React 条件文件名
    outputName = outputName.replace(
      /__if_([^.]+)\.(\w+)$/,
      (_, condition, ext) => {
        return this._shouldInclude(condition) ? `.${ext}` : '';
      }
    );

    return path.join(targetPath, outputName);
  }

  /**
   * 判断是否包含条件文件（例如 __if_eslint.js.ejs）
   */
  _shouldInclude(condition) {
    // 示例条件判断逻辑：
    // 文件名 __if_eslint.js.ejs → 检查 features 是否包含 eslint
    return this.config.features.includes(condition);
  }

  /**
   * 判断文件是否为二进制格式
   */
  _isBinaryFile(filePath) {
    const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp'];
    return binaryExtensions.includes(path.extname(filePath).toLowerCase());
  }
}

module.exports = TemplateManager;
