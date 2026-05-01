const settings = require('../store/settings');
const logger = require('../logger');

function matches(rule, text) {
  const lc = text.toLowerCase();
  const pat = (rule.pattern || '').toLowerCase();
  switch (rule.match) {
    case 'contains':
      return lc.includes(pat);
    case 'exact':
      return lc === pat;
    case 'startsWith':
      return lc.startsWith(pat);
    case 'regex':
      try {
        return new RegExp(rule.pattern, 'i').test(text);
      } catch (err) {
        logger.warn({ err, rule }, 'Invalid regex in auto-reply rule');
        return false;
      }
    default:
      return false;
  }
}

module.exports = async function autoReply(sock, msg, text) {
  const rules = settings.getAutoReplies();
  for (const rule of rules) {
    if (matches(rule, text)) {
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: rule.reply },
        { quoted: msg },
      );
      return true;
    }
  }
  return false;
};
