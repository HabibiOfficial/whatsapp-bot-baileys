const http = require('../utils/http');
const logger = require('../logger');

module.exports = {
  name: 'tiktok',
  aliases: ['tt'],
  usage: '<url>',
  description: 'Download video TikTok tanpa watermark',
  category: 'downloader',
  async run({ sock, msg, args }) {
    const url = args[0];
    if (!url || !/^https?:\/\//i.test(url)) {
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: 'Format: !tiktok <url>' },
        { quoted: msg },
      );
      return;
    }

    try {
      const { data } = await http.get('https://www.tikwm.com/api/', {
        params: { url, hd: 1 },
      });
      if (data.code !== 0 || !data.data?.play) {
        throw new Error(data.msg || 'no data');
      }
      const videoUrl = data.data.hdplay || data.data.play;
      const videoResp = await http.get(videoUrl, { responseType: 'arraybuffer' });
      const caption = [
        `*${data.data.title || 'TikTok'}*`,
        data.data.author?.nickname ? `By: ${data.data.author.nickname}` : null,
      ]
        .filter(Boolean)
        .join('\n');
      await sock.sendMessage(
        msg.key.remoteJid,
        { video: Buffer.from(videoResp.data), caption },
        { quoted: msg },
      );
    } catch (err) {
      logger.error({ err }, 'tiktok download failed');
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: `Gagal download TikTok: ${err.message}` },
        { quoted: msg },
      );
    }
  },
};
