const express = require('express');
const serverless = require('serverless-http');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', '..', 'src', 'views'));

app.get('/', (req, res) => {
  res.render('index', { title: 'Home', currentPage: 'home' });
});

app.use(express.static(path.join(__dirname, '..', '..', 'public')));

module.exports.handler = serverless(app);
