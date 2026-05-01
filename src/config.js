const path = require('path');

function parseList(value) {
  return (value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const config = {
  botName: process.env.BOT_NAME || 'WaBot',
  prefix: process.env.BOT_PREFIX || '!',
  ownerNumbers: parseList(process.env.OWNER_NUMBERS),
  sessionDir: path.resolve(process.env.SESSION_DIR || './auth_info_baileys'),
  dataDir: path.resolve(process.env.DATA_DIR || './data'),
  logLevel: process.env.LOG_LEVEL || 'info',
};

module.exports = config;
