require('dotenv').config();

const logger = require('./logger');
const { startBot } = require('./bot/connection');

// Load command modules so they register themselves with the registry.
require('./commands');

(async () => {
  try {
    await startBot();
  } catch (err) {
    logger.error({ err }, 'Failed to start bot');
    process.exit(1);
  }
})();

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception');
});
