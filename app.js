const express = require('express');
const serverless = require('serverless-http');
const path = require('path');
const ejs = require('ejs');

const app = express();

// Setzen Sie EJS als View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'src', 'views'));

// Statische Dateien einbinden
app.use(express.static(path.join(process.cwd(), 'public')));

// Route für die Startseite
app.get('/', (req, res) => {
  res.render('index', { title: 'Startseite' });
});

// Einfache API-Route zum Testen
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hallo von der API!' });
});

// Fehlerbehandlung
app.use((err, req, res, next) => {
  console.error('Fehler aufgetreten:', err);
  res.status(500).send('Ein Fehler ist aufgetreten: ' + err.message);
});

module.exports.handler = serverless(app);