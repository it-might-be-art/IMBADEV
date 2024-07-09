const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

async function clearDatabase() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('IMBA');
    const imagesCollection = db.collection('images');
    await imagesCollection.deleteMany({});
    console.log('All image entries have been deleted.');
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    await client.close();
  }
}

clearDatabase();
