const config = require('../config');
const { getAll } = require('./registry');

module.exports = {
  name: 'menu',
  aliases: ['help', 'cmd'],
  description: 'Tampilkan daftar command',
  category: 'main',
  async run({ sock, msg }) {
    const all = getAll();
    const byCat = new Map();
    for (const cmd of all) {
      const cat = cmd.category || 'misc';
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat).push(cmd);
    }

    const lines = [`*${config.botName}* — Menu`, `Prefix: \`${config.prefix}\``, ''];
    for (const [cat, list] of [...byCat.entries()].sort()) {
      lines.push(`*${cat.toUpperCase()}*`);
      for (const cmd of list) {
        const usage = cmd.usage ? ` ${cmd.usage}` : '';
        const desc = cmd.description ? `\n   _${cmd.description}_` : '';
        lines.push(` • \`${config.prefix}${cmd.name}${usage}\`${desc}`);
      }
      lines.push('');
    }
    await sock.sendMessage(
      msg.key.remoteJid,
      { text: lines.join('\n').trim() },
      { quoted: msg },
    );
  },
};
