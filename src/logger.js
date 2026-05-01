const pino = require('pino');
const config = require('./config');

const logger = pino({
  level: config.logLevel,
  transport: process.stdout.isTTY
    ? {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
      }
    : undefined,
});

module.exports = logger;
