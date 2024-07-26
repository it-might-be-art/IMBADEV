require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
const app = express();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function connectToDatabase() {
  if (!client.topology || !client.topology.isConnected()) {
    await client.connect();
  }
  return client.db('IMBA');
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const imagesCollection = db.collection('images');
    const images = await imagesCollection.aggregate([{ $sample: { size: 10 } }]).toArray();
    res.render('index', { title: 'Homepage', images });
  } catch (error) {
    console.error('Error fetching homepage images:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});