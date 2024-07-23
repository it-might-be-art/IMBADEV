const express = require('express');
const serverless = require('serverless-http');
const path = require('path');
const ejs = require('ejs');

const app = express();

app.engine('ejs', ejs.renderFile);
app.set('view engine', 'ejs');

// Logging für Debugging
console.log('Current directory:', __dirname);
console.log('Attempting to set views directory to:', path.join(__dirname, '..', '..', 'src', 'views'));

// Setzen Sie den Pfad zu den Views
app.set('views', path.join(__dirname, '..', '..', 'src', 'views'));

// Statische Dateien
app.use(express.static(path.join(__dirname, '..', '..', 'public')));

// Routen
app.get('/', (req, res) => {
  console.log('Attempting to render index view');
  res.render('index', { 
    title: 'Home', 
    currentPage: 'home', 
    profile: {} 
  }, (err, html) => {
    if (err) {
      console.error('Error rendering index view:', err);
      return res.status(500).send('Error rendering view');
    }
    res.send(html);
  });
});

// Weitere Routen hier hinzufügen

// 404 Handler
app.use((req, res) => {
  res.status(404).send('404 Not Found');
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Internal Server Error');
});

module.exports.handler = serverless(app);