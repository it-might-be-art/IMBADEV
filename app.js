const express = require('express');
const serverless = require('serverless-http');

const app = express();

app.get('/', (req, res) => {
  res.send('Hallo von der Hauptanwendung!');
});

module.exports.handler = serverless(app);