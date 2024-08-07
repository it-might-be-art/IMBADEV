require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const ejs = require('ejs');
const http = require('http');
const MongoStore = require('connect-mongo');
const app = express();
const PORT = process.env.PORT || 3000;

// Corrected utils directory path
const utilsDir = path.join(__dirname, 'src', 'utils');
const nftUtilsPath = path.join(utilsDir, 'nftUtils.js');

if (fs.existsSync(nftUtilsPath)) {
  const nftUtils = require(nftUtilsPath);
}

const viewsPath = path.join(__dirname, 'src', 'views');

app.set('view engine', 'ejs');
app.set('views', viewsPath);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    useNewUrlParser: true,
    useUnifiedTopology: true,
    tls: true,
    tlsAllowInvalidCertificates: true // Set this to false in production
  })
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.get('/', (req, res) => {
  res.render('index', { 
    title: 'it might be art - Home', 
    currentPage: 'home', 
    profile: req.session.profile,
  }, (err, html) => {
    if (err) {
      return res.status(500).send('Error rendering page');
    }
    res.send(html);
  });
});

// Debug route to check environment variables
app.get('/env', (req, res) => {
  res.json({
    MONGODB_URI: process.env.MONGODB_URI,
    SESSION_SECRET: process.env.SESSION_SECRET
  });
});

const usersRouter = require('./src/routes/users');
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
    res.status(500).send(error.message);
  }
});

app.get('/create', (req, res) => {
  res.render('create', { title: 'it might be art - create', currentPage: 'create', profile: req.session.profile });
});

app.get('/submissions', (req, res) => {
  res.render('submissions', { title: 'it might be art - submissions', currentPage: 'submissions', profile: req.session.profile });
});

app.get('/imprint', (req, res) => {
  res.render('imprint', { title: 'it might be art - imprint', currentPage: 'imprint', profile: req.session.profile });
});

app.get('/data-privacy', (req, res) => {
  res.render('data-privacy', { title: 'it might be art - data privacy', currentPage: 'data-privacy', profile: req.session.profile });
});

app.use((err, req, res, next) => {
  res.status(500).send('Something broke!');
});

app.use((req, res, next) => {
  res.status(404).send("Sorry, that route doesn't exist.");
});

async function getUserByName(name) {
  const client = new MongoClient(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    tls: true,
    tlsAllowInvalidCertificates: true // Set this to false in production
  });
  try {
    await client.connect();
    const db = client.db('IMBA');
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ name });
    return user;
  } catch (error) {
    throw error;
  } finally {
    await client.close();
  }
}

const server = http.createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string'
    ? 'Pipe ' + PORT
    : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});

module.exports = server;
