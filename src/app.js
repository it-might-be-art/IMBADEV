require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('Starting server...');
console.log(`Environment variables: MONGODB_URI=${process.env.MONGODB_URI}, SESSION_SECRET=${process.env.SESSION_SECRET}`);

console.log(`Current directory: ${__dirname}`);
console.log(`View path: ${path.join(__dirname, 'views')}`);
console.log(`Public path: ${path.join(__dirname, '..', 'public')}`);

const viewsPath = path.join(__dirname, 'views');
const indexPath = path.join(viewsPath, 'index.ejs');
if (fs.existsSync(viewsPath)) {
  console.log('Views directory exists');
  if (fs.existsSync(indexPath)) {
    console.log('index.ejs exists');
  } else {
    console.log('index.ejs does not exist');
  }
} else {
  console.log('Views directory does not exist');
}

app.set('view engine', 'ejs');
app.set('views', viewsPath);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: true,
}));

app.use((req, res, next) => {
  console.log(`Received ${req.method} request for ${req.url}`);
  next();
});

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
  console.log('Serving home page');
  res.render('index', { title: 'Home', currentPage: 'home', profile: req.session.profile }, (err, html) => {
    if (err) {
      console.error('Error rendering index.ejs:', err);
      return res.status(500).send('Error rendering page');
    }
    console.log('Rendered index.ejs successfully');
    res.send(html);
  });
});

const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);

app.get('/profile/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const user = await getUserByName(username);
    if (!user) {
      console.log('User not found:', username);
      return res.status(404).send('User not found');
    }
    const isOwner = req.session.profile && req.session.profile.address === user.address;
    res.render('profile', { title: `${user.name}'s Profile`, user, isOwner, profile: req.session.profile, currentPage: 'profile' });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).send(error.message);
  }
});

app.get('/create', (req, res) => {
  console.log('Serving create page');
  res.render('create', { title: 'Create', currentPage: 'create', profile: req.session.profile });
});

app.get('/gallery', (req, res) => {
  console.log('Serving gallery page');
  res.render('gallery', { title: 'Gallery', currentPage: 'gallery', profile: req.session.profile });
});

app.get('/imprint', (req, res) => {
  console.log('Serving imprint page');
  res.render('imprint', { title: 'Imprint', currentPage: 'imprint', profile: req.session.profile });
});

app.get('/data-privacy', (req, res) => {
  console.log('Serving data privacy page');
  res.render('data-privacy', { title: 'Data Privacy', currentPage: 'data-privacy', profile: req.session.profile });
});

// Test route to check server functionality
app.get('/test', (req, res) => {
  console.log('Test route accessed');
  res.send('Test route is working');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

async function getUserByName(name) {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('IMBA');
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ name });
    return user;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  } finally {
    await client.close();
  }
}