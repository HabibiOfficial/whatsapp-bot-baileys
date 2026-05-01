const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

const config = require('../config');
const logger = require('../logger');

function pickMedia(msg) {
  const m = msg.message;
  if (m?.imageMessage) return { key: msg.key, message: m };
  if (m?.videoMessage) return { key: msg.key, message: m };
  const ctx = m?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (ctx?.imageMessage || ctx?.videoMessage) {
    return { key: msg.key, message: ctx };
  }
  return null;
}

module.exports = {
  name: 'sticker',
  aliases: ['s', 'stiker'],
  description: 'Convert gambar/video ke sticker (reply atau kirim langsung)',
  category: 'media',
  async run({ sock, msg }) {
    const media = pickMedia(msg);
    if (!media) {
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: `Reply gambar/video atau kirim dengan caption \`${config.prefix}sticker\`.` },
        { quoted: msg },
      );
      return;
    }

    try {
      const buffer = await downloadMediaMessage(media, 'buffer', {});
      const sticker = new Sticker(buffer, {
        pack: config.botName,
        author: 'Bot',
        type: StickerTypes.FULL,
        quality: 70,
      });
      const stickerBuffer = await sticker.toBuffer();
      await sock.sendMessage(
        msg.key.remoteJid,
        { sticker: stickerBuffer },
        { quoted: msg },
      );
    } catch (err) {
      logger.error({ err }, 'Sticker creation failed');
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: 'Gagal bikin sticker. Pastikan ffmpeg ter-install untuk video sticker.' },
        { quoted: msg },
      );
    }
  },
};
