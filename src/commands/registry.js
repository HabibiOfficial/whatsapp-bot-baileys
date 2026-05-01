const commands = new Map();

function register(cmd) {
  if (!cmd || !cmd.name) return;
  commands.set(cmd.name.toLowerCase(), cmd);
  for (const alias of cmd.aliases || []) {
    commands.set(alias.toLowerCase(), cmd);
  }
}

function getAll() {
  return [...new Set(commands.values())];
}

module.exports = { commands, register, getAll };
