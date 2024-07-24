const express = require('express');
const serverless = require('serverless-http');
const path = require('path');

let ejs;
try {
  ejs = require('ejs');
} catch (error) {
  console.error('Fehler beim Laden von EJS:', error);
}

const app = express();

if (ejs) {
  app.set('view engine', 'ejs');
  app.set('views', path.join(process.cwd(), 'src', 'views'));
} else {
  console.warn('EJS konnte nicht geladen werden. Template-Rendering deaktiviert.');
}

// Statische Dateien einbinden
app.use(express.static(path.join(process.cwd(), 'public')));

// Route für die Startseite
app.get('/', (req, res) => {
  if (ejs) {
    res.render('index', { title: 'Startseite' });
  } else {
    res.send('Willkommen auf der Startseite (EJS nicht verfügbar)');
  }
});

// Fehlerbehandlung
app.use((err, req, res, next) => {
  console.error('Fehler aufgetreten:', err);
  res.status(500).send('Ein Fehler ist aufgetreten: ' + err.message);
});

module.exports.handler = serverless(app);