const os = require('os');
const config = require('../config');

function formatUptime(s) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${d}d ${h}h ${m}m ${sec}s`;
}

module.exports = {
  name: 'info',
  aliases: ['botinfo'],
  description: 'Info bot & uptime',
  category: 'main',
  async run({ sock, msg }) {
    const text = [
      `*${config.botName}*`,
      `Uptime: ${formatUptime(process.uptime())}`,
      `Node: ${process.version}`,
      `Platform: ${os.platform()} ${os.arch()}`,
      `Memory: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(1)} MB`,
      `Owners: ${config.ownerNumbers.length || '(none configured)'}`,
    ].join('\n');
    await sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
  },
};
