const { getMentionedJids, requireGroupAdmin, requireBotAdmin } = require('../utils/parse');

module.exports = {
  name: 'promote',
  usage: '@user',
  description: 'Promote user jadi admin group (admin only)',
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
        { text: 'Mention user yang mau di-promote. Contoh: !promote @user' },
        { quoted: msg },
      );
      return;
    }

    try {
      await sock.groupParticipantsUpdate(jid, targets, 'promote');
      await sock.sendMessage(
        jid,
        { text: `Promoted ${targets.length} user.` },
        { quoted: msg },
      );
    } catch (err) {
      await sock.sendMessage(
        jid,
        { text: `Gagal promote: ${err.message}` },
        { quoted: msg },
      );
    }
  },
};
