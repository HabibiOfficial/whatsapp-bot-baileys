# whatsapp-bot-baileys

WhatsApp bot ringan berbasis [**@whiskeysockets/baileys**](https://github.com/WhiskeySockets/Baileys) — multi-device, login lewat **QR code**, tanpa Selenium/Puppeteer/Chrome.

Stack: **Node.js (>=18) + Baileys + JSON file storage** (zero database, zero build step). Cocok di-deploy di VPS murah, Termux, atau di mana saja Node bisa hidup.

---

## Fitur

- **Login QR code** lewat terminal, sesi tersimpan di disk (auto reconnect dengan exponential backoff)
- **Command handler** dengan prefix konfigurable (default `!`) + auto-load dari folder `src/commands/`
- **Sticker maker**: gambar/video → sticker, sticker → gambar
- **Downloader**:
  - TikTok (tanpa watermark, via [tikwm.com](https://tikwm.com))
  - YouTube (mp4, video+audio, max ~50 MB via `@distube/ytdl-core`)
- **Group management**: `kick`, `promote`, `demote` (cek admin status & izin bot otomatis)
- **Anti-link**: toggle per group; pesan berisi link otomatis dihapus untuk non-admin (bot harus admin)
- **Auto-reply** rule based: `contains` / `exact` / `startsWith` / `regex` — disimpan di JSON, dikelola lewat command `!autoreply`

---

## Quick start

```bash
# 1. Clone & install
git clone https://github.com/HabibiOfficial/whatsapp-bot-baileys.git
cd whatsapp-bot-baileys
npm install

# 2. Konfigurasi
cp .env.example .env
# edit .env (minimal: OWNER_NUMBERS biar bisa kelola auto-reply)

# 3. Jalankan
npm start
```

Saat pertama kali jalan, bot akan menampilkan **QR code di terminal**. Buka WhatsApp di HP → **Settings → Linked Devices → Link a Device** → scan QR code.

Setelah connected, sesi disimpan di `./auth_info_baileys/` (folder ini di-`.gitignore`). Restart bot tidak perlu scan ulang selama sesi belum dihapus / logout dari HP.

---

## Konfigurasi `.env`

| Variable        | Default                  | Keterangan                                                                 |
|-----------------|--------------------------|----------------------------------------------------------------------------|
| `BOT_NAME`      | `WaBot`                  | Nama bot (muncul di menu, sticker pack, dll)                               |
| `BOT_PREFIX`    | `!`                      | Prefix command (boleh ganti jadi `.`, `/`, dll)                            |
| `OWNER_NUMBERS` | _(kosong)_               | Comma-separated nomor WA tanpa `+`, contoh: `6281234567890,6289876543210` |
| `SESSION_DIR`   | `./auth_info_baileys`    | Tempat menyimpan kredensial Baileys                                        |
| `DATA_DIR`      | `./data`                 | Tempat menyimpan settings (auto-reply, antilink) dalam JSON                |
| `LOG_LEVEL`     | `info`                   | `trace` / `debug` / `info` / `warn` / `error`                              |

> **OWNER_NUMBERS** wajib di-set kalau mau pakai command yang ditandai `ownerOnly` (saat ini: `!autoreply`).

---

## Commands (default prefix `!`)

| Category    | Command                         | Keterangan                                            |
|-------------|---------------------------------|-------------------------------------------------------|
| main        | `!menu` / `!help`               | Tampilkan daftar command                              |
| main        | `!ping`                         | Cek bot hidup & latency                               |
| main        | `!info`                         | Info bot, uptime, memory                              |
| media       | `!sticker` / `!s`               | Reply gambar/video atau kirim langsung jadi sticker   |
| media       | `!toimg`                        | Reply ke sticker → kembalikan sebagai gambar           |
| downloader  | `!tiktok <url>` / `!tt <url>`   | Download video TikTok tanpa watermark                 |
| downloader  | `!youtube <url>` / `!yt <url>`  | Download video YouTube (mp4, max ~50 MB)              |
| group       | `!kick @user`                   | Kick user dari group (admin only, bot harus admin)    |
| group       | `!promote @user`                | Promote user jadi admin                               |
| group       | `!demote @user`                 | Demote admin jadi member                              |
| group       | `!antilink on\|off`             | Toggle antilink di group ini (admin only)             |
| config      | `!autoreply list`               | List semua rule auto-reply                            |
| config      | `!autoreply add <type> <pat>\|<reply>` | Tambah rule. type = `contains`/`exact`/`startsWith`/`regex` |
| config      | `!autoreply del <n>`            | Hapus rule nomor ke-`n`                                |
| config      | `!autoreply clear`              | Hapus semua rule                                       |

### Contoh auto-reply

```
!autoreply add contains halo|Halo juga! Ada yang bisa dibantu?
!autoreply add exact ping|pong
!autoreply add startsWith /menu|Ketik !menu untuk lihat command
!autoreply add regex ^test\d+$|Test detected
```

---

## Catatan teknis

- **Sticker dari video** butuh **ffmpeg** ter-install di sistem (`apt install ffmpeg` / `brew install ffmpeg`). Sticker dari gambar tidak butuh ffmpeg.
- **YouTube downloader** memakai `@distube/ytdl-core`. Cap file 50 MB diset di kode untuk menghindari WhatsApp menolak file besar — kamu bisa naikkan di `src/commands/youtube.js`.
- **Anti-link** hanya menghapus pesan; user tidak otomatis di-kick. Kalau mau auto-kick juga, edit `src/features/antilink.js`.
- **Persistensi sesi**: jangan commit folder `auth_info_baileys/` — itu kredensial WhatsApp kamu.

---

## Struktur folder

```
src/
├── index.js                # entry point
├── config.js               # env loader
├── logger.js               # pino logger
├── bot/
│   ├── connection.js       # Baileys socket lifecycle (QR, reconnect)
│   └── handler.js          # message → command/feature dispatcher
├── commands/
│   ├── registry.js         # Map of registered commands
│   ├── index.js            # auto-loads all commands in this folder
│   ├── menu.js  ping.js  info.js
│   ├── sticker.js  toimg.js
│   ├── tiktok.js  youtube.js
│   ├── kick.js  promote.js  demote.js  antilink.js
│   └── autoreply.js
├── features/
│   ├── autoReply.js        # passive rule-based auto-reply
│   └── antilink.js         # passive link deletion
├── store/
│   └── settings.js         # JSON-backed group settings & auto-reply rules
└── utils/
    ├── parse.js            # message/command parsing helpers
    └── http.js             # axios client
```

### Bikin command baru

Buat file `src/commands/<nama>.js`:

```js
module.exports = {
  name: 'hello',
  aliases: ['halo'],
  description: 'Say hello',
  category: 'main',
  // groupOnly: true,   // (opsional)
  // ownerOnly: true,   // (opsional)
  async run({ sock, msg, args, sender, isGroup }) {
    await sock.sendMessage(msg.key.remoteJid, { text: 'Hello!' }, { quoted: msg });
  },
};
```

File otomatis di-load saat startup — tidak perlu daftar manual.

---

## Disclaimer

Project ini cuma untuk keperluan edukasi/personal. WhatsApp bisa kapan saja membatasi atau mem-banned akun yang dianggap melanggar [Terms of Service](https://www.whatsapp.com/legal/terms-of-service)-nya. **Pakai dengan hati-hati**, jangan untuk spam/broadcast massal, dan **gunakan nomor cadangan** kalau ragu.

## License

[MIT](LICENSE)
