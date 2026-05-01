const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  proto,
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const NodeCache = require('node-cache');

const config = require('../config');
const logger = require('../logger');
const { handleMessage } = require('./handler');

let reconnectAttempts = 0;

// Caches recommended by Baileys to reduce decrypt errors and speed up group sends.
const msgRetryCounterCache = new NodeCache();
const groupMetadataCache = new NodeCache({ stdTTL: 60 * 5, useClones: false });

// Tiny in-memory store of messages this bot has SENT, used by `getMessage` so
// Baileys can re-encrypt them when WhatsApp asks for a retry. Capped so we
// don't leak memory.
const SENT_LIMIT = 1000;
const sentMessages = new Map();
function rememberSent(key, message) {
  if (!key?.id || !message) return;
  sentMessages.set(key.id, message);
  if (sentMessages.size > SENT_LIMIT) {
    const firstKey = sentMessages.keys().next().value;
    sentMessages.delete(firstKey);
  }
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  logger.info({ version, isLatest }, 'Booting Baileys');

  const baileysLogger = logger.child({ scope: 'baileys' });

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, baileysLogger),
    },
    logger: baileysLogger,
    printQRInTerminal: false,
    markOnlineOnConnect: false,
    syncFullHistory: false,
    browser: ['Mac OS', 'Safari', '14'],
    msgRetryCounterCache,
    cachedGroupMetadata: async (jid) => groupMetadataCache.get(jid),
    getMessage: async (key) => {
      const cached = sentMessages.get(key.id);
      if (cached) return cached;
      return proto.Message.fromObject({});
    },
    patchMessageBeforeSending: (message) => {
      const requiresPatch = !!(
        message.buttonsMessage
        || message.templateMessage
        || message.listMessage
      );
      if (requiresPatch) {
        return {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadataVersion: 2,
                deviceListMetadata: {},
              },
              ...message,
            },
          },
        };
      }
      return message;
    },
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

  // Refresh cached group metadata when groups change.
  sock.ev.on('groups.update', async (updates) => {
    for (const update of updates) {
      if (!update.id) continue;
      try {
        const meta = await sock.groupMetadata(update.id);
        groupMetadataCache.set(update.id, meta);
      } catch (err) {
        logger.debug({ err, id: update.id }, 'Failed to refresh group metadata');
      }
    }
  });

  sock.ev.on('group-participants.update', async ({ id }) => {
    if (!id) return;
    try {
      const meta = await sock.groupMetadata(id);
      groupMetadataCache.set(id, meta);
    } catch (err) {
      logger.debug({ err, id }, 'Failed to refresh group metadata after participants update');
    }
  });

  sock.ev.on('messages.upsert', async (event) => {
    if (event.type !== 'notify') return;
    for (const msg of event.messages) {
      // remember messages WE sent (for retry receipts handled by Baileys)
      if (msg.key.fromMe && msg.message) {
        rememberSent(msg.key, msg.message);
      }
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
