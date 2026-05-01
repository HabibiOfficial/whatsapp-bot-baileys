const settings = require('../store/settings');
const logger = require('../logger');
const { isGroupAdmin, getBotJidInGroup } = require('../utils/parse');

const LINK_RE = /(https?:\/\/\S+|chat\.whatsapp\.com\/\S+|wa\.me\/\S+)/i;

module.exports = async function antilink(sock, msg, text) {
  const jid = msg.key.remoteJid;
  if (!jid?.endsWith('@g.us')) return false;

  const groupSettings = settings.getGroup(jid);
  if (!groupSettings.antilink) return false;
  if (!LINK_RE.test(text)) return false;

  const sender = msg.key.participant;
  if (!sender) return false;

  // ignore admins
  if (await isGroupAdmin(sock, jid, sender)) return false;

  // bot needs to be admin to delete
  const meJid = getBotJidInGroup(sock);
  if (!meJid || !(await isGroupAdmin(sock, jid, meJid))) return false;

  try {
    await sock.sendMessage(jid, { delete: msg.key });
    await sock.sendMessage(jid, {
      text: `@${sender.split('@')[0]} link tidak diizinkan di group ini.`,
      mentions: [sender],
    });
  } catch (err) {
    logger.warn({ err }, 'Failed to enforce antilink');
  }
  return true;
};
