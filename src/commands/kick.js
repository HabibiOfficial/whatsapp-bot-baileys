const { getMentionedJids, requireGroupAdmin, requireBotAdmin } = require('../utils/parse');

module.exports = {
  name: 'kick',
  usage: '@user',
  description: 'Kick user dari group (admin only)',
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
        { text: 'Mention user yang mau di-kick. Contoh: !kick @user' },
        { quoted: msg },
      );
      return;
    }

    try {
      await sock.groupParticipantsUpdate(jid, targets, 'remove');
      await sock.sendMessage(
        jid,
        { text: `Kicked ${targets.length} user.` },
        { quoted: msg },
      );
    } catch (err) {
      await sock.sendMessage(
        jid,
        { text: `Gagal kick: ${err.message}` },
        { quoted: msg },
      );
    }
  },
};
