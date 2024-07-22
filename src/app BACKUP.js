require('dotenv').config();
const express = require('express');
const http = require('http');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const cors = require('cors');

console.log('Starting server initialization...');

// IONOS Deployment Test
const isIonosDeployment = process.env.IONOS_DEPLOYMENT_TEST === 'true';
console.log(`IONOS Deployment Test: ${isIonosDeployment ? 'Configuration detected' : 'Configuration not detected'}`);

const app = express();
const PORT = process.env.PORT || 3000;

console.log('Starting server...');
console.log(`Environment variables: MONGODB_URI=${process.env.MONGODB_URI ? 'set' : 'not set'}, SESSION_SECRET=${process.env.SESSION_SECRET ? 'set' : 'not set'}, IONOS_DEPLOYMENT_TEST=${process.env.IONOS_DEPLOYMENT_TEST ? 'set' : 'not set'}`);

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

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: true,
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve static files
const publicPath = path.join(__dirname, '..', 'public');
console.log(`Serving static files from: ${publicPath}`);
app.use(express.static(publicPath));

// Test route
app.get('/test', (req, res) => {
  console.log('Test route accessed');
  res.send('Server is running. IONOS Deployment Test: ' + (isIonosDeployment ? 'Detected' : 'Not Detected'));
});

// Routes
app.get('/', (req, res) => {
  console.log('Attempting to serve home page');
  res.render('index', { 
    title: 'Home', 
    currentPage: 'home', 
    profile: req.session.profile,
    ionosTest: isIonosDeployment ? 'IONOS config detected' : 'IONOS config not detected'
  }, (err, html) => {
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
  console.log(`Attempting to fetch profile for ${req.params.username}`);
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

app.get('/api/test', (req, res) => {
  console.log('API test route accessed');
  res.json({ message: 'API is working', ionosTest: isIonosDeployment ? 'IONOS config detected' : 'IONOS config not detected' });
});

// 404 handler
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).send('Not Found');
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Internal Server Error');
});

async function getUserByName(name) {
  console.log(`Attempting to fetch user: ${name}`);
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db('IMBA');
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ name });
    console.log(user ? `User found: ${name}` : `User not found: ${name}`);
    return user;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  } finally {
    await client.close();
    console.log('Closed MongoDB connection');
  }
}

// Server creation and start
const server = http.createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

// Error handling for server
server.on('error', (error) => {
  console.error('Server startup error:', error);
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

server.on('listening', () => {
  console.log('Server is now listening for incoming requests');
});

console.log('Server initialization complete.');