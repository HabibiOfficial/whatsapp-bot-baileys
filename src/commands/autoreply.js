const settings = require('../store/settings');

const HELP = [
  'Usage:',
  '  !autoreply list',
  '  !autoreply add <contains|exact|startsWith|regex> <pattern>|<reply>',
  '  !autoreply del <nomor>',
  '  !autoreply clear',
].join('\n');

const VALID_MATCHES = ['contains', 'exact', 'startswith', 'regex'];

module.exports = {
  name: 'autoreply',
  aliases: ['ar'],
  usage: 'add|list|del|clear',
  description: 'Kelola auto-reply rules (owner only)',
  category: 'config',
  ownerOnly: true,
  async run({ sock, msg, args }) {
    const jid = msg.key.remoteJid;
    const sub = (args[0] || '').toLowerCase();

    if (sub === 'list') {
      const rules = settings.getAutoReplies();
      if (rules.length === 0) {
        await sock.sendMessage(jid, { text: 'Belum ada rule.' }, { quoted: msg });
        return;
      }
      const text = rules
        .map((r, i) => `${i + 1}. [${r.match}] "${r.pattern}" -> "${r.reply}"`)
        .join('\n');
      await sock.sendMessage(jid, { text }, { quoted: msg });
      return;
    }

    if (sub === 'add') {
      const matchType = (args[1] || '').toLowerCase();
      if (!VALID_MATCHES.includes(matchType)) {
        await sock.sendMessage(jid, { text: HELP }, { quoted: msg });
        return;
      }
      const rest = args.slice(2).join(' ');
      const sepIdx = rest.indexOf('|');
      if (sepIdx === -1) {
        await sock.sendMessage(jid, { text: HELP }, { quoted: msg });
        return;
      }
      const pattern = rest.slice(0, sepIdx).trim();
      const reply = rest.slice(sepIdx + 1).trim();
      if (!pattern || !reply) {
        await sock.sendMessage(jid, { text: HELP }, { quoted: msg });
        return;
      }
      // canonicalize match name
      const canonical = matchType === 'startswith' ? 'startsWith' : matchType;
      await settings.addAutoReply({ match: canonical, pattern, reply });
      await sock.sendMessage(jid, { text: 'Rule ditambah.' }, { quoted: msg });
      return;
    }

    if (sub === 'del') {
      const idx = parseInt(args[1], 10);
      if (Number.isNaN(idx) || idx < 1) {
        await sock.sendMessage(jid, { text: 'Usage: !autoreply del <nomor>' }, { quoted: msg });
        return;
      }
      const removed = await settings.removeAutoReply(idx - 1);
      await sock.sendMessage(
        jid,
        { text: removed ? `Rule #${idx} dihapus.` : `Rule #${idx} tidak ditemukan.` },
        { quoted: msg },
      );
      return;
    }

    if (sub === 'clear') {
      await settings.clearAutoReplies();
      await sock.sendMessage(jid, { text: 'Semua rule dihapus.' }, { quoted: msg });
      return;
    }

    await sock.sendMessage(jid, { text: HELP }, { quoted: msg });
  },
};
