#!/usr/bin/env node
const { program } = require('commander');
const path = require('path');
const checkUpdate = require('update-notifier');
const pkg = require('../package.json');
const create = require(path.resolve(__dirname, '../src/commands/create'));

// 检查更新
checkUpdate({ pkg }).notify();

program
  .version(pkg.version)
  .command('create <project-name>')
  .description('创建新项目')
  .action((name) => {
    create(name);
  });

program.parse();
