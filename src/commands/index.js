const fs = require('fs');
const path = require('path');

const { register } = require('./registry');

const SKIP = new Set(['index.js', 'registry.js']);

for (const file of fs.readdirSync(__dirname)) {
  if (SKIP.has(file) || !file.endsWith('.js')) continue;
  const cmd = require(path.join(__dirname, file));
  register(cmd);
}

module.exports = require('./registry');
