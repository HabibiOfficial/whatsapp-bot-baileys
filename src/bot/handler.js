const config = require('../config');
const logger = require('../logger');
const { commands } = require('../commands/registry');
const autoReplyFeature = require('../features/autoReply');
const antilinkFeature = require('../features/antilink');
const { extractText, extractCommand } = require('../utils/parse');

function getSenderJid(msg) {
  if (msg.key.remoteJid?.endsWith('@g.us')) return msg.key.participant;
  return msg.key.remoteJid;
}

function jidToNumber(jid) {
  if (!jid) return null;
  return jid.split('@')[0]?.split(':')[0] || null;
}

async function handleMessage(sock, msg) {
  if (!msg.message || msg.key.fromMe) return;

  const text = extractText(msg);
  if (text == null) return;

  const isGroup = msg.key.remoteJid.endsWith('@g.us');
  const sender = getSenderJid(msg);

  // anti-link runs first so links get deleted even if they look like commands
  if (await antilinkFeature(sock, msg, text)) return;

  const parsed = extractCommand(text, config.prefix);
  if (parsed) {
    const command = commands.get(parsed.name);
    if (!command) return;

    if (command.groupOnly && !isGroup) {
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: 'Command ini hanya bisa dipakai di group.' },
        { quoted: msg },
      );
      return;
    }

    if (command.ownerOnly) {
      const senderNum = jidToNumber(sender);
      if (!senderNum || !config.ownerNumbers.includes(senderNum)) {
        await sock.sendMessage(
          msg.key.remoteJid,
          { text: 'Command ini khusus owner.' },
          { quoted: msg },
        );
        return;
      }
    }

    logger.info(
      { cmd: parsed.name, from: msg.key.remoteJid, sender },
      'Running command',
    );
    await command.run({
      sock,
      msg,
      args: parsed.args,
      raw: text,
      sender,
      isGroup,
    });
    return;
  }

  await autoReplyFeature(sock, msg, text);
}

module.exports = { handleMessage };
