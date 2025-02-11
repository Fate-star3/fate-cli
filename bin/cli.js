#!/usr/bin/env node
const { program } = require('commander');
const checkUpdate = require('update-notifier');
const pkg = require('../package.json') ;

// 检查更新
checkUpdate({ pkg }).notify();

program
  .version(pkg.version)
  .command('create <project-name>')
  .description('创建新项目')
  .action((name) => {
    require('../src/commands/create')(name);
  });

program.parse();
