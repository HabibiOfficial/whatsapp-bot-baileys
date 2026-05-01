const ytdl = require('@distube/ytdl-core');

const logger = require('../logger');

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    stream.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BYTES) {
        stream.destroy(new Error('File terlalu besar (>50MB)'));
        return;
      }
      chunks.push(chunk);
    });
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

module.exports = {
  name: 'youtube',
  aliases: ['yt', 'ytmp4'],
  usage: '<url>',
  description: 'Download video YouTube (max ~50MB)',
  category: 'downloader',
  async run({ sock, msg, args }) {
    const url = args[0];
    if (!url || !ytdl.validateURL(url)) {
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: 'Format: !yt <url-youtube>' },
        { quoted: msg },
      );
      return;
    }
    try {
      const info = await ytdl.getInfo(url);
      const title = info.videoDetails.title;
      const format = ytdl.chooseFormat(info.formats, {
        quality: 'lowest',
        filter: (f) => f.container === 'mp4' && f.hasVideo && f.hasAudio,
      });
      if (!format) {
        throw new Error('Tidak ada format mp4 (video+audio) yang cocok');
      }
      const buffer = await streamToBuffer(ytdl(url, { format }));
      await sock.sendMessage(
        msg.key.remoteJid,
        { video: buffer, caption: title },
        { quoted: msg },
      );
    } catch (err) {
      logger.error({ err }, 'youtube download failed');
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: `Gagal download YouTube: ${err.message}` },
        { quoted: msg },
      );
    }
  },
};
