const settings = require('../store/settings');
const { requireGroupAdmin } = require('../utils/parse');

module.exports = {
  name: 'antilink',
  usage: 'on|off',
  description: 'Toggle antilink untuk group ini (admin only)',
  category: 'group',
  groupOnly: true,
  async run({ sock, msg, args }) {
    const jid = msg.key.remoteJid;
    if (!(await requireGroupAdmin(sock, msg)).ok) return;

    const mode = (args[0] || '').toLowerCase();
    if (!['on', 'off'].includes(mode)) {
      const current = settings.getGroup(jid).antilink ? 'on' : 'off';
      await sock.sendMessage(
        jid,
        { text: `Antilink saat ini: *${current}*\nUsage: !antilink on|off` },
        { quoted: msg },
      );
      return;
    }

    await settings.setGroup(jid, { antilink: mode === 'on' });
    await sock.sendMessage(
      jid,
      { text: `Antilink di-set: *${mode}*` },
      { quoted: msg },
    );
  },
};
