
const express = require('express');
const serverless = require('serverless-http');
const path = require('path');
const ejs = require('ejs');

const app = express();

app.engine('ejs', ejs.renderFile);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', '..', 'src', 'views'));

app.use(express.static(path.join(__dirname, '..', '..', 'public')));

// Add your routes here
app.get('/', (req, res) => {
  res.render('index', { title: 'Home', currentPage: 'home', profile: {} });
});

// Add other routes as needed

module.exports.handler = serverless(app);
