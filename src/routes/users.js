const express = require('express');
const router = express.Router();
const { MongoClient, ObjectId } = require('mongodb');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multerS3 = require('multer-s3');

// Dynamically determine the base path
const basePath = path.join(__dirname, '..');

console.log('Users.js - Base path:', basePath);

// Determine utils path
const utilsPath = path.join(basePath, 'utils');
console.log('Utils path:', utilsPath);

let checkIfUserHasNFT;
const nftUtilsPath = path.join(utilsPath, 'nftUtils.js');
if (fs.existsSync(nftUtilsPath)) {
  console.log('nftUtils.js found');
  ({ checkIfUserHasNFT } = require(nftUtilsPath));
} else {
  console.error('nftUtils.js not found');
  checkIfUserHasNFT = () => false; // Fallback function
}

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function connectToDatabase() {
  if (!client.topology || !client.topology.isConnected()) {
    await client.connect();
  }
  return client.db('IMBA');
}

// AWS S3 Configuration
const s3 = new S3Client({ 
  region: process.env.AWS_REGION, 
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const bucketName = process.env.AWS_S3_BUCKET;

router.get('/check-env', (req, res) => {
  res.json({
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
    MONGODB_URI: process.env.MONGODB_URI,
    SESSION_SECRET: process.env.SESSION_SECRET
  });
});

if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET) {
  console.error('Missing one or more required AWS environment variables: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET');
} else {
  console.log('AWS environment variables set correctly');
}

// Multer S3 Storage Configuration
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: bucketName,
    key: function (req, file, cb) {
      let ext = path.extname(file.originalname);
      cb(null, `${Date.now()}${ext}`);
    }
  })
});

// Authentication and NFT check
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

// Authentication middleware
function ensureAuthenticated(req, res, next) {
  if (req.session.profile) {
    return next();
  } else {
    res.status(403).json({ success: false, message: 'Forbidden' });
  }
}

// Route to fetch submissions images
router.get('/submissions', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const imagesCollection = db.collection('images');
    const usersCollection = db.collection('users');

    const images = await imagesCollection.find().sort({ createdAt: -1 }).toArray();

    const imagesWithCreatorNames = await Promise.all(images.map(async (image) => {
      const user = await usersCollection.findOne({ address: image.address });
      return {
        ...image,
        creatorName: user ? user.name : 'Unknown',
        imageUrl: image.imagePath
      };
    }));

    res.json({ success: true, images: imagesWithCreatorNames });
  } catch (error) {
    console.error('Error fetching submissions images:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route to fetch user images
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

    const images = await imagesCollection.find({ address: user.address }).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, images });
  } catch (error) {
    console.error('Error fetching user images:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route to vote for an image
router.post('/vote', async (req, res) => {
  const { address, imageId } = req.body;
  try {
    const db = await connectToDatabase();
    const votesCollection = db.collection('votes');
    const usersCollection = db.collection('users');
    const imagesCollection = db.collection('images');

    const user = await authenticateUser(address);

    if (!await checkIfUserHasNFT(address)) {
      return res.status(403).json({ success: false, message: 'You must own a PunkApepen NFT to vote.' });
    }

    const existingVote = await votesCollection.findOne({ address, imageId: new ObjectId(imageId) });
    if (existingVote) {
      return res.status(400).json({ success: false, message: 'You have already voted for this image.' });
    }

    await votesCollection.insertOne({ address, imageId: new ObjectId(imageId), createdAt: new Date() });

    // Increment the votesCount in the images collection
    const result = await imagesCollection.updateOne(
      { _id: new ObjectId(imageId) },
      { $inc: { votesCount: 1 } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    const votesCount = await votesCollection.countDocuments({ imageId: new ObjectId(imageId) });

    // Update the user's vote count
    await usersCollection.updateOne({ address }, { $inc: { votes: 1 } });

    res.json({ success: true, votesCount, message: 'Vote recorded successfully.' });
  } catch (error) {
    console.error('Error saving vote:', error);
    res.status(500).json({ success: false, message: 'Error saving vote. Please try again later.' });
  }
});

// Route to fetch votes for an image
router.get('/votes/:imageId', async (req, res) => {
  const { imageId } = req.params;
  try {
    const db = await connectToDatabase();
    const imagesCollection = db.collection('images');

    if (!ObjectId.isValid(imageId)) {
      return res.status(400).json({ success: false, message: 'Invalid imageId' });
    }

    const image = await imagesCollection.findOne({ _id: new ObjectId(imageId) }, { projection: { votesCount: 1 } });

    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    res.json({ success: true, votesCount: image.votesCount || 0 });
  } catch (error) {
    console.error('Error retrieving votes:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route to check if a user has voted for an image
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
    console.error('Error checking username:', error);
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
      const hasNFT = await checkIfUserHasNFT(address);
      user = {
        address,
        createdAt: new Date(),
        name: `user${Date.now()}`,
        profilePicture: '',
        hasNFT,
      };
      await usersCollection.insertOne(user);
    } else {
      const hasNFT = await checkIfUserHasNFT(address);
      await usersCollection.updateOne({ address }, { $set: { hasNFT } });
      user.hasNFT = hasNFT;
    }
    req.session.profile = user;
    res.json({ success: true, profile: user });
  } catch (error) {
    console.error('Error authenticating user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route to fetch user profile data
router.get('/profile-data/:username', async (req, res) => {
  const username = req.params.username;

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const imagesCollection = db.collection('images');
    const votesCollection = db.collection('votes');

    const user = await usersCollection.findOne({ name: username });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const images = await imagesCollection.find({ address: user.address }).toArray();

    const imagesWithVotes = await Promise.all(images.map(async (image) => {
      const votesCount = await votesCollection.countDocuments({ imageId: image._id });
      return {
        ...image,
        votesCount
      };
    }));

    user.social = user.social || {};

    // Check if the profile picture is a complete URL or needs the S3 bucket URL prepended
    if (user.profilePicture && !user.profilePicture.startsWith('http')) {
      user.profilePicture = `https://imba-bucket.s3.eu-north-1.amazonaws.com/${user.profilePicture}`;
    }

    const isOwner = req.session.profile && req.session.profile.address === user.address;

    res.json({ success: true, user, images: imagesWithVotes, isOwner });
  } catch (error) {
    console.error('Error fetching user profile data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route to fetch user profile
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
    const images = await imagesCollection.find({ address: user.address }).toArray();

    user.social = user.social || {};

    const hasNFT = user.hasNFT;

    res.render('profile', { 
      title: 'Profile', 
      user, 
      isOwner, 
      images: images.map(image => ({
        ...image,
        imageUrl: image.imagePath
      })), 
      hasNFT, 
      profile, 
      currentPage: 'profile' 
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route to fetch user profile
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
    const images = await imagesCollection.find({ address: user.address }).toArray();

    user.social = user.social || {};

    const hasNFT = user.hasNFT;

    res.render('profile', { 
      title: 'Profile', 
      user, 
      isOwner, 
      images: images.map(image => ({
        ...image,
        imageUrl: image.imagePath
      })), 
      hasNFT, 
      profile, 
      currentPage: 'profile' 
    });
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

  const { name, bio, xUsername, warpcastUsername, lensUsername, instagramUsername } = req.body;
  const profilePicture = req.file ? req.file.location : null; // Use .location for S3 URL

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    const updateData = {
      name,
      bio,
      social: {
        x: xUsername,
        warpcast: warpcastUsername,
        lens: lensUsername,
        instagram: instagramUsername,
      },
    };
    if (profilePicture) {
      updateData.profilePicture = profilePicture;
    }

    // Aktualisieren Sie das hasNFT-Feld jedes Mal, wenn das Profil aktualisiert wird
    const hasNFT = await checkIfUserHasNFT(address);
    updateData.hasNFT = hasNFT;

    const result = await usersCollection.updateOne({ address }, { $set: updateData });

    if (result.modifiedCount > 0) {
      const updatedProfile = await usersCollection.findOne({ address });
      res.json({ success: true, profile: updatedProfile }); // Return the updated profile
    } else {
      res.json({ success: false, message: 'Failed to update profile.' });
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route to upload an image (with authentication middleware)
router.post('/upload-image', ensureAuthenticated, upload.fields([{ name: 'image' }, { name: 'imba' }]), async (req, res) => {
  const { address, title, description } = req.body;
  const profile = req.session.profile;

  if (!profile || profile.address !== address) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const imageFile = req.files.image[0];
  const imbaFile = req.files.imba[0];

  try {
    const db = await connectToDatabase();
    const imagesCollection = db.collection('images');
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ address });

    if (!user) {
      throw new Error(`User not found for address: ${address}`);
    }

    const newImage = {
      address,
      title,
      description,
      imagePath: imageFile.location,
      imbaPath: imbaFile.location,
      creator: user.address,
      creatorName: user.name,
      createdAt: new Date(),
    };

    await imagesCollection.insertOne(newImage);
    res.json({ success: true });

  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ success: false, message: 'Error uploading image. Please try again later.' });
  }
});

// Route to fetch random images
router.get('/random-images', async (req, res) => {
  const count = parseInt(req.query.count) || 8;
  try {
    const db = await connectToDatabase();
    const imagesCollection = db.collection('images');
    const images = await imagesCollection.aggregate([{ $sample: { size: count } }]).toArray();

    // Make sure each image has its full S3 URL
    const imagesWithUrls = images.map(image => ({
      ...image,
      imagePath: image.imagePath // Assuming imagePath already has the full S3 URL
    }));

    res.json({ success: true, images: imagesWithUrls });
  } catch (error) {
    console.error('Error fetching random images:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route to delete an image
router.delete('/delete-image', async (req, res) => {
  const { address, imageId } = req.body;

  try {
    const db = await connectToDatabase();
    const imagesCollection = db.collection('images');

    const result = await imagesCollection.deleteOne({ _id: new ObjectId(imageId), address });

    if (result.deletedCount === 1) {
      res.json({ success: true, message: 'Image deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Image not found' });
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ success: false, message: 'Failed to delete image' });
  }
});

module.exports = router;