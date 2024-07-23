const express = require('express');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');
const serverless = require('serverless-http');
const fs = require('fs');

dotenv.config();

const app = express();

// Logging für Debugging
console.log('Current directory:', __dirname);
console.log('Netlify function root:', process.env.LAMBDA_TASK_ROOT);

// Funktion zum Lesen von EJS-Dateien
function readEjsFile(filename) {
  return fs.readFileSync(path.join(process.env.LAMBDA_TASK_ROOT, 'src', 'views', filename), 'utf8');
}

// Einfache EJS-Rendering-Funktion
function renderEjs(template, data) {
  return template.replace(/<%=\s*([^%>]+)\s*%>/g, (match, p1) => {
    return data[p1.trim()] || '';
  }).replace(/<%-([\s\S]+?)%>/g, (match, p1) => {
    return eval(p1);
  });
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));
app.use(express.static(path.join(process.env.LAMBDA_TASK_ROOT, 'public')));

const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);

app.get('/profile/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const user = await getUserByName(username);
    if (!user) {
      return res.status(404).send('user not found');
    }
    const isOwner = req.session.profile && req.session.profile.address === user.address;
    const template = readEjsFile('profile.ejs');
    const html = renderEjs(template, { 
      title: `${user.name}'s Profile`, 
      user, 
      isOwner, 
      profile: req.session.profile, 
      currentPage: 'profile' 
    });
    res.send(html);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).send(error.message);
  }
});

app.get('/', (req, res) => {
  console.log('Attempting to render index view');
  try {
    const template = readEjsFile('index.ejs');
    const html = renderEjs(template, { 
      title: 'Home', 
      currentPage: 'home', 
      profile: req.session.profile 
    });
    console.log('Index view rendered successfully');
    res.send(html);
  } catch (err) {
    console.error('Error rendering index view:', err);
    res.status(500).send('Error rendering view: ' + err.message);
  }
});

app.get('/create', (req, res) => {
  const template = readEjsFile('create.ejs');
  const html = renderEjs(template, { title: 'create', currentPage: 'create', profile: req.session.profile });
  res.send(html);
});

app.get('/gallery', (req, res) => {
  const template = readEjsFile('gallery.ejs');
  const html = renderEjs(template, { title: 'gallery', currentPage: 'gallery', profile: req.session.profile });
  res.send(html);
});

app.get('/imprint', (req, res) => {
  const template = readEjsFile('imprint.ejs');
  const html = renderEjs(template, { title: 'imprint', currentPage: 'imprint', profile: req.session.profile });
  res.send(html);
});

app.get('/data-privacy', (req, res) => {
  const template = readEjsFile('data-privacy.ejs');
  const html = renderEjs(template, { title: 'data-privacy', currentPage: 'data-privacy', profile: req.session.profile });
  res.send(html);
});

async function getUserByName(name) {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('IMBA');
    const usersCollection = db.collection('users');
    return await usersCollection.findOne({ name });
  } finally {
    await client.close();
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).send("Sorry, that route doesn't exist.");
});

console.log('Loaded modules:', Object.keys(require.cache));

module.exports.handler = serverless(app);