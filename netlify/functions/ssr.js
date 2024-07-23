const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');
const serverless = require('serverless-http');
const ejs = require('ejs');
const fs = require('fs');

dotenv.config();

const app = express();

console.log('Starting ssr.js');
console.log('Current directory:', __dirname);
console.log('Files in current directory:', fs.readdirSync(__dirname));
console.log('Files in src directory:', fs.readdirSync(path.join(__dirname, 'src')));
console.log('Files in views directory:', fs.readdirSync(path.join(__dirname, 'src', 'views')));
console.log('node_modules directory:', fs.readdirSync(path.join(__dirname, 'node_modules')));
console.log('EJS module path:', require.resolve('ejs'));

// EJS Setup
app.engine('ejs', ejs.renderFile);
app.set('view engine', 'ejs');
app.set('views', path.join(process.env.LAMBDA_TASK_ROOT, 'src', 'views'));

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
      return res.status(404).send('User not found');
    }
    const isOwner = req.session.profile && req.session.profile.address === user.address;
    res.render('profile', { title: `${user.name}'s Profile`, user, isOwner, profile: req.session.profile, currentPage: 'profile' });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).send(error.message);
  }
});

app.get('/', (req, res) => {
  console.log('Attempting to render index view');
  res.render('index', {
    title: 'Home',
    currentPage: 'home',
    profile: req.session.profile
  }, (err, html) => {
    if (err) {
      console.error('Error rendering index view:', err);
      return res.status(500).send('Error rendering view: ' + err.message);
    }
    console.log('Index view rendered successfully');
    res.send(html);
  });
});

app.get('/create', (req, res) => {
  res.render('create', { title: 'Create', currentPage: 'create', profile: req.session.profile });
});

app.get('/gallery', (req, res) => {
  res.render('gallery', { title: 'Gallery', currentPage: 'gallery', profile: req.session.profile });
});

app.get('/imprint', (req, res) => {
  res.render('imprint', { title: 'Imprint', currentPage: 'imprint', profile: req.session.profile });
});

app.get('/data-privacy', (req, res) => {
  res.render('data-privacy', { title: 'Data Privacy', currentPage: 'data-privacy', profile: req.session.profile });
});

// Database function
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