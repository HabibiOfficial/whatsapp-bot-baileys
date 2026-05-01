const axios = require('axios');

const http = axios.create({
  timeout: 30_000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36',
  },
});

module.exports = http;
