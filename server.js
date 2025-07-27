// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

const DB_DIR = path.join(__dirname, 'db');

app.use(bodyParser.json());
app.use(express.static('public'));

// Helper load/save
const load = (filename) => JSON.parse(fs.readFileSync(path.join(DB_DIR, filename), 'utf8'));
const save = (filename, data) => fs.writeFileSync(path.join(DB_DIR, filename), JSON.stringify(data, null, 2));

// ================= LOGIN ===================
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const accounts = load('accounts.json');
  const found = accounts.find(a => a.username === username && a.password === password);
  if (found) {
    res.sendStatus(200);
  } else {
    res.status(401).send("Login gagal");
  }
});

app.post('/api/account/register', (req, res) => {
  const { username, password } = req.body;
  const accounts = load('accounts.json');
  if (accounts.find(a => a.username === username)) {
    return res.status(409).send("Username sudah ada");
  }
  accounts.push({ username, password });
  save('accounts.json', accounts);
  res.send("Akun berhasil dibuat");
});

app.post('/api/account/password', (req, res) => {
  const { username, password } = req.body;
  const accounts = load('accounts.json');
  const user = accounts.find(a => a.username === username);
  if (!user) return res.status(404).send("Akun tidak ditemukan");
  user.password = password;
  save('accounts.json', accounts);
  res.send("Password berhasil diganti");
});

// ================ USER LIST =================
app.get('/api/:type', (req, res) => {
  const file = `${req.params.type}.json`;
  try {
    const data = load(file);
    res.json(data);
  } catch {
    res.status(404).send("Tipe tidak ditemukan");
  }
});

// ================ ADD USER ==================
app.post('/api/add', (req, res) => {
  const { id, type } = req.body;
  try {
    const file = `${type}.json`;
    const list = load(file);
    if (!list.includes(Number(id))) {
      list.push(Number(id));
      save(file, list);
      res.send("✅ Ditambahkan!");
    } else {
      res.send("⚠️ Sudah ada sebelumnya.");
    }
  } catch {
    res.status(500).send("❌ Tipe tidak dikenali");
  }
});

// ================ SETTINGS ==================
app.get('/api/settings', (req, res) => {
  const settings = load('settings.json');
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  const { cooldownTime, whatsappStatus } = req.body;
  const newSettings = { cooldownTime: cooldownTime * 60, whatsappStatus: whatsappStatus === 'true' };
  save('settings.json', newSettings);
  res.send("✅ Pengaturan diperbarui");
});

// ================ LOGS =======================
app.get('/api/logs', (req, res) => {
  res.sendFile(path.join(DB_DIR, 'logs.txt'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Web panel aktif di http://localhost:${PORT}`));