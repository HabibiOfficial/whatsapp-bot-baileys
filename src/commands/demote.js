const { getMentionedJids, requireGroupAdmin, requireBotAdmin } = require('../utils/parse');

module.exports = {
  name: 'demote',
  usage: '@user',
  description: 'Demote admin jadi member biasa (admin only)',
  category: 'group',
  groupOnly: true,
  async run({ sock, msg }) {
    const jid = msg.key.remoteJid;
    if (!(await requireGroupAdmin(sock, msg)).ok) return;
    if (!(await requireBotAdmin(sock, msg)).ok) return;

    const targets = getMentionedJids(msg);
    if (targets.length === 0) {
      await sock.sendMessage(
        jid,
        { text: 'Mention user yang mau di-demote. Contoh: !demote @user' },
        { quoted: msg },
      );
      return;
    }

    try {
      await sock.groupParticipantsUpdate(jid, targets, 'demote');
      await sock.sendMessage(
        jid,
        { text: `Demoted ${targets.length} user.` },
        { quoted: msg },
      );
    } catch (err) {
      await sock.sendMessage(
        jid,
        { text: `Gagal demote: ${err.message}` },
        { quoted: msg },
      );
    }
  },
};
