const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const logger = require('../logger');

module.exports = {
  name: 'toimg',
  aliases: ['toimage'],
  description: 'Convert sticker ke gambar (reply ke sticker)',
  category: 'media',
  async run({ sock, msg }) {
    const ctx = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!ctx?.stickerMessage) {
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: 'Reply ke sticker yang mau di-convert.' },
        { quoted: msg },
      );
      return;
    }
    try {
      const buffer = await downloadMediaMessage(
        { key: msg.key, message: ctx },
        'buffer',
        {},
      );
      await sock.sendMessage(
        msg.key.remoteJid,
        { image: buffer, caption: 'Sticker -> Image' },
        { quoted: msg },
      );
    } catch (err) {
      logger.error({ err }, 'toimg failed');
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: 'Gagal convert sticker.' },
        { quoted: msg },
      );
    }
  },
};
