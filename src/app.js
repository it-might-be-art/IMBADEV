const express = require('express');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));

app.use(express.static(path.join(__dirname, '..', 'public')));

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
    res.render('profile', { title: `${user.name}'s Profile`, user, isOwner, profile: req.session.profile });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/', (req, res) => {
  res.render('index', { title: 'Home', currentPage: 'home', profile: req.session.profile });
});

app.get('/create', (req, res) => {
  res.render('create', { title: 'create', currentPage: 'gallery', profile: req.session.profile });
});

app.get('/gallery', (req, res) => {
  res.render('gallery', { title: 'gallery', currentPage: 'gallery', profile: req.session.profile });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

async function getUserByName(name) {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('IMBA');
  const usersCollection = db.collection('users');
  const user = await usersCollection.findOne({ name });
  await client.close();
  return user;
}
