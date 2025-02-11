// utils/logger.js
const signale = require('signale');

module.exports = {
  debug: signale.debug,
  successLog: (msg) => signale.success(`✅ ${msg}`),
  errorLog: (msg) => signale.error(`🚨 ${msg}`),
  warnLog: (msg) => signale.warn(`⚠️  ${msg}`),
};
