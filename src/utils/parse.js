function extractText(msg) {
  const m = msg.message;
  if (!m) return null;
  return (
    m.conversation
    || m.extendedTextMessage?.text
    || m.imageMessage?.caption
    || m.videoMessage?.caption
    || null
  );
}

function extractCommand(text, prefix) {
  if (!text || !text.startsWith(prefix)) return null;
  const without = text.slice(prefix.length).trim();
  if (!without) return null;
  const [name, ...args] = without.split(/\s+/);
  return { name: name.toLowerCase(), args };
}

function getMentionedJids(msg) {
  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  return ctx?.mentionedJid || [];
}

function getBotJidInGroup(sock) {
  const raw = sock.user?.id;
  if (!raw) return null;
  const num = raw.split(':')[0].split('@')[0];
  return `${num}@s.whatsapp.net`;
}

async function isGroupAdmin(sock, jid, userJid) {
  if (!jid?.endsWith('@g.us') || !userJid) return false;
  try {
    const meta = await sock.groupMetadata(jid);
    const p = meta.participants.find((x) => x.id === userJid);
    return !!p && (p.admin === 'admin' || p.admin === 'superadmin');
  } catch {
    return false;
  }
}

async function requireGroupAdmin(sock, msg) {
  const jid = msg.key.remoteJid;
  if (!jid?.endsWith('@g.us')) {
    await sock.sendMessage(jid, { text: 'Command ini hanya untuk group.' }, { quoted: msg });
    return { ok: false };
  }
  const sender = msg.key.participant;
  if (!sender || !(await isGroupAdmin(sock, jid, sender))) {
    await sock.sendMessage(jid, { text: 'Khusus admin group.' }, { quoted: msg });
    return { ok: false };
  }
  return { ok: true };
}

async function requireBotAdmin(sock, msg) {
  const jid = msg.key.remoteJid;
  const meJid = getBotJidInGroup(sock);
  if (!meJid || !(await isGroupAdmin(sock, jid, meJid))) {
    await sock.sendMessage(
      jid,
      { text: 'Bot harus jadi admin group dulu untuk pakai command ini.' },
      { quoted: msg },
    );
    return { ok: false };
  }
  return { ok: true };
}

module.exports = {
  extractText,
  extractCommand,
  getMentionedJids,
  getBotJidInGroup,
  isGroupAdmin,
  requireGroupAdmin,
  requireBotAdmin,
};
