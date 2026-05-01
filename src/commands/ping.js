module.exports = {
  name: 'ping',
  description: 'Cek bot hidup & latency',
  category: 'main',
  async run({ sock, msg }) {
    const start = Date.now();
    const sent = await sock.sendMessage(
      msg.key.remoteJid,
      { text: 'Pinging...' },
      { quoted: msg },
    );
    const ms = Date.now() - start;
    await sock.sendMessage(
      msg.key.remoteJid,
      { text: `Pong! ${ms}ms`, edit: sent.key },
    );
  },
};
