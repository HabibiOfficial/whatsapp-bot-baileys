const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

const config = require('../config');
const logger = require('../logger');
const { handleMessage } = require('./handler');

let reconnectAttempts = 0;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  logger.info({ version, isLatest }, 'Booting Baileys');

  const sock = makeWASocket({
    version,
    auth: state,
    logger: logger.child({ scope: 'baileys' }),
    printQRInTerminal: false,
    markOnlineOnConnect: false,
    syncFullHistory: false,
    browser: ['Mac OS', 'Safari', '14'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\nScan this QR code with WhatsApp (Settings -> Linked Devices -> Link a Device):\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      reconnectAttempts = 0;
      logger.info({ user: sock.user?.id }, 'Connected to WhatsApp');
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      logger.warn({ code, shouldReconnect }, 'Connection closed');

      if (shouldReconnect) {
        const delay = Math.min(60_000, 1000 * 2 ** reconnectAttempts);
        reconnectAttempts += 1;
        logger.info({ delay }, 'Reconnecting');
        setTimeout(
          () => startBot().catch((err) => logger.error({ err }, 'Reconnect failed')),
          delay,
        );
      } else {
        logger.error('Logged out. Delete the session directory and re-pair to continue.');
        process.exit(1);
      }
    }
  });

  sock.ev.on('messages.upsert', async (event) => {
    if (event.type !== 'notify') return;
    for (const msg of event.messages) {
      try {
        await handleMessage(sock, msg);
      } catch (err) {
        logger.error({ err, key: msg.key }, 'Error handling message');
      }
    }
  });

  return sock;
}

module.exports = { startBot };
