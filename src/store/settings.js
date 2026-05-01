const fs = require('fs');
const path = require('path');
const config = require('../config');

const file = path.join(config.dataDir, 'settings.json');

let data = { groups: {}, autoReplies: [] };

function load() {
  try {
    if (fs.existsSync(file)) {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
      data = {
        groups: parsed.groups || {},
        autoReplies: Array.isArray(parsed.autoReplies) ? parsed.autoReplies : [],
      };
    }
  } catch {
    data = { groups: {}, autoReplies: [] };
  }
}

function save() {
  fs.mkdirSync(config.dataDir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

load();

module.exports = {
  getGroup(jid) {
    return data.groups[jid] || { antilink: false };
  },
  async setGroup(jid, patch) {
    data.groups[jid] = { ...this.getGroup(jid), ...patch };
    save();
  },
  getAutoReplies() {
    return data.autoReplies;
  },
  async addAutoReply(rule) {
    data.autoReplies.push(rule);
    save();
  },
  async removeAutoReply(idx) {
    if (idx < 0 || idx >= data.autoReplies.length) return false;
    data.autoReplies.splice(idx, 1);
    save();
    return true;
  },
  async clearAutoReplies() {
    data.autoReplies = [];
    save();
  },
};
