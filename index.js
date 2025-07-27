const express = require('express');
const fs = require('fs');
const path = require('path');
const session = require('express-session');

const app = express();
const port = 3000;
const dbPath = path.join(__dirname, 'db');
const loadJSON = (file) => JSON.parse(fs.readFileSync(path.join(dbPath, file)));
const saveJSON = (file, data) => fs.writeFileSync(path.join(dbPath, file), JSON.stringify(data, null, 2));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: 'evourth_secret_key', resave: false, saveUninitialized: true }));
app.use(express.static(path.join(__dirname, 'public')));

function checkAuth(req, res, next) {
  if (req.session.loggedIn) return next();
  res.redirect('/login.html');
}

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const login = loadJSON('login.json');
  if (username === login.username && password === login.password) {
    req.session.loggedIn = true;
    res.redirect('/');
  } else res.send('Login gagal!');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login.html');
});

app.use(checkAuth);

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/api/:type', (req, res) => res.json(loadJSON(`${req.params.type}.json`)));

app.post('/api/add', (req, res) => {
  const { type, id } = req.body;
  const valid = ['owner', 'admin', 'reseller', 'premium'];
  if (!valid.includes(type)) return res.status(400).send('Invalid type');
  const data = loadJSON(`${type}.json`);
  const uid = parseInt(id);
  if (!data.includes(uid)) {
    data.push(uid);
    saveJSON(`${type}.json`, data);
    res.send(`✅ Ditambahkan ke ${type}: ${uid}`);
  } else {
    res.send(`⚠️ Sudah ada di ${type}`);
  }
});

app.post('/api/delete', (req, res) => {
  const { type, id } = req.body;
  const data = loadJSON(`${type}.json`);
  const uid = parseInt(id);
  if (data.includes(uid)) {
    const updated = data.filter(i => i !== uid);
    saveJSON(`${type}.json`, updated);
    res.send(`🗑️ Dihapus dari ${type}: ${uid}`);
  } else {
    res.send(`❌ ID tidak ditemukan`);
  }
});

app.post('/api/settings', (req, res) => {
  const cooldownTime = parseInt(req.body.cooldownTime);
  const whatsappStatus = req.body.whatsappStatus === 'true';
  saveJSON('settings.json', { cooldownTime, whatsappStatus });
  res.send('✅ Pengaturan berhasil diperbarui.');
});

app.get('/api/logs', (req, res) => {
  const logPath = path.join(dbPath, 'bot-usage.log');
  if (fs.existsSync(logPath)) {
    res.download(logPath);
  } else {
    res.status(404).send('Log tidak ditemukan.');
  }
});

app.listen(port, () => console.log(`🌐 Evourth Panel running at http://localhost:${port}`));