const express = require('express');
const router = express.Router();
const { MongoClient, ObjectId } = require('mongodb');
const multer = require('multer');
const path = require('path');
const { checkIfUserHasNFT } = require('../../utils/nftUtils');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function connectToDatabase() {
  if (!client.topology || !client.topology.isConnected()) {
    await client.connect();
  }
  return client.db('IMBA');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    let ext = '';
    if (file.fieldname === 'image') {
      ext = '.png';
    } else if (file.fieldname === 'imba') {
      ext = '.imba';
    }
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// Authentifizierung und NFT-Überprüfung
async function authenticateUser(address) {
  const db = await connectToDatabase();
  const usersCollection = db.collection('users');

  let user = await usersCollection.findOne({ address });
  if (!user) {
    user = { address, createdAt: new Date(), votes: 0 };
    await usersCollection.insertOne(user);
  }
  return user;
}
// Middleware zur Authentifizierung
function ensureAuthenticated(req, res, next) {
  if (req.session.profile) {
    return next();
  } else {
    res.status(403).json({ success: false, message: 'Forbidden' });
  }
}

// Route zum Abrufen der Galerie-Bilder
router.get('/gallery', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const imagesCollection = db.collection('images');
    const usersCollection = db.collection('users');

    const images = await imagesCollection.find().toArray();

    const imagesWithCreatorNames = await Promise.all(images.map(async (image) => {
      const user = await usersCollection.findOne({ address: image.address });
      return {
        ...image,
        creatorName: user ? user.name : 'Unknown'
      };
    }));

    res.json({ success: true, images: imagesWithCreatorNames });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route zum Abrufen der Benutzerbilder
router.get('/images', async (req, res) => {
  const username = req.query.username;
  try {
    const db = await connectToDatabase();
    const imagesCollection = db.collection('images');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ name: username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const images = await imagesCollection.find({ address: user.address }).toArray();
    res.json({ success: true, images });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route zum Voten
router.post('/vote', async (req, res) => {
  const { address, imageId } = req.body;
  try {
    const db = await connectToDatabase();
    const votesCollection = db.collection('votes');
    const usersCollection = db.collection('users');
    const imagesCollection = db.collection('images');

    const user = await authenticateUser(address);

    // Überprüfen, ob der Benutzer ein PunkApepen-NFT besitzt
    if (!await checkIfUserHasNFT(address)) {
      return res.status(403).json({ success: false, message: 'You must own a PunkApepen NFT to vote.' });
    }

    // Prüfen, ob der Benutzer bereits für das Bild abgestimmt hat
    const existingVote = await votesCollection.findOne({ address, imageId: new ObjectId(imageId) });
    if (existingVote) {
      return res.status(400).json({ success: false, message: 'You have already voted for this image.' });
    }

    // Stimme speichern
    await votesCollection.insertOne({ address, imageId: new ObjectId(imageId), createdAt: new Date() });

    // Anzahl der Stimmen für das Bild abrufen
    const votesCount = await votesCollection.countDocuments({ imageId: new ObjectId(imageId) });

    // Erhöhen der Stimmenzahl des Benutzers
    await usersCollection.updateOne({ address }, { $inc: { votes: 1 } });

    res.json({ success: true, votesCount });
  } catch (error) {
    console.error('Error saving vote:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route zum Abrufen der Stimmen
router.get('/votes/:imageId', async (req, res) => {
  const { imageId } = req.params;
  try {
    const db = await connectToDatabase();
    const votesCollection = db.collection('votes');

    if (!ObjectId.isValid(imageId)) {
      return res.status(400).json({ success: false, message: 'Invalid imageId' });
    }

    const votesCount = await votesCollection.countDocuments({ imageId: new ObjectId(imageId) });

    res.json({ success: true, votesCount });
  } catch (error) {
    console.error('Error retrieving votes:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route zum Überprüfen, ob ein Benutzer für ein Bild abgestimmt hat
router.get('/has-voted', async (req, res) => {
  const { address, imageId } = req.query;
  try {
    const db = await connectToDatabase();
    const votesCollection = db.collection('votes');

    const existingVote = await votesCollection.findOne({ address, imageId: new ObjectId(imageId) });

    res.json({ success: true, hasVoted: !!existingVote });
  } catch (error) {
    console.error('Error checking vote:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/check-username', async (req, res) => {
  const { username } = req.query;
  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ name: username });

    if (user) {
      return res.json({ available: false });
    } else {
      return res.json({ available: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/authenticate', async (req, res) => {
  const { address } = req.body;
  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    let user = await usersCollection.findOne({ address });
    if (!user) {
      user = { address, createdAt: new Date(), name: `user${Date.now()}`, profilePicture: '' };
      await usersCollection.insertOne(user);
    }

    req.session.profile = user;
    res.json({ success: true, profile: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route zum Abrufen des Benutzerprofils
router.get('/profile/:username', async (req, res) => {
  const username = req.params.username;
  const profile = req.session.profile;

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const imagesCollection = db.collection('images');
    const user = await usersCollection.findOne({ name: username });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isOwner = profile && profile.address === user.address;

    // Bilder des Benutzers abrufen
    const images = await imagesCollection.find({ address: user.address }).toArray();

    res.json({ success: true, user, isOwner, images });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// Route zum Aktualisieren des Benutzerprofils
router.post('/update-profile', upload.single('profilePicture'), async (req, res) => {
  const address = req.query.address;
  const profile = req.session.profile;

  if (!profile || profile.address !== address) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const { name, bio } = req.body;
  const profilePicture = req.file ? req.file.filename : null;

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    const updateData = { name, bio };
    if (profilePicture) {
      updateData.profilePicture = profilePicture;
    }

    const result = await usersCollection.updateOne(
      { address },
      { $set: updateData }
    );

    if (result.modifiedCount > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'Failed to update profile.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route zum Hochladen eines Bildes (mit Authentifizierungsmiddleware)
router.post('/upload-image', ensureAuthenticated, upload.fields([{ name: 'image' }, { name: 'imba' }]), async (req, res) => {
  const { address, title, description } = req.body;
  const profile = req.session.profile;

  if (!profile || profile.address !== address) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const imagePath = req.files.image[0].filename;
  const imbaPath = req.files.imba[0].filename;

  try {
    const db = await connectToDatabase();
    const imagesCollection = db.collection('images');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ address });

    const newImage = {
      address,
      title,
      description,
      imagePath,
      imbaPath,
      creator: user.address,
      creatorName: user.name,
      createdAt: new Date(),
    };

    await imagesCollection.insertOne(newImage);
    res.json({ success: true });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route zum Löschen eines Bildes
router.delete('/delete-image', async (req, res) => {
  const { address, imageId } = req.body;
  const profile = req.session.profile;

  if (!profile || profile.address !== address) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  try {
    const db = await connectToDatabase();
    const imagesCollection = db.collection('images');

    const result = await imagesCollection.deleteOne({ _id: new ObjectId(imageId), address });

    if (result.deletedCount > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'Failed to delete image.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/check-nft', async (req, res) => {
  const { address } = req.query;

  try {
    const hasNFT = await checkIfUserHasNFT(address);
    res.json({ hasNFT });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
