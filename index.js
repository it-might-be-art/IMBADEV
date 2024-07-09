require('dotenv').config();
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");
    const database = client.db('IMBA');
    const collection = database.collection('users');
    
    // Beispiel: Einfügen eines Dokuments
    const result = await collection.insertOne({ name: "Alice", address: "Wonderland" });
    console.log(`New document created with the following id: ${result.insertedId}`);
    
    // Beispiel: Abrufen aller Dokumente
    const documents = await collection.find().toArray();
    console.log('Documents:', documents);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);