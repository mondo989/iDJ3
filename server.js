// // SERVER_IDJ/server.js
// import express from 'express';
// import bodyParser from 'body-parser';
// import fetch from 'node-fetch';
// import dotenv from 'dotenv';

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 3000;

// app.use(express.static('public'));

// // Serve Firebase config securely
// app.get('/firebase-config', (req, res) => {
//     const firebaseConfig = {
//         apiKey: process.env.FIREBASE_API_KEY,
//         authDomain: process.env.FIREBASE_AUTH_DOMAIN,
//         databaseURL: process.env.FIREBASE_DATABASE_URL,
//         projectId: process.env.FIREBASE_PROJECT_ID,
//         storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
//         messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
//         appId: process.env.FIREBASE_APP_ID
//     };
//     res.json(firebaseConfig);
// });

// app.use(bodyParser.json());

// app.post('/add-song', async (req, res) => {
//   const { youtubeUrl, requester } = req.body;
//   const oEmbedUrl = `https://www.youtube.com/oembed?url=${youtubeUrl}&format=json`;

//   try {
//       const response = await fetch(oEmbedUrl);
//       if (!response.ok) {
//           throw new Error(`Failed to fetch video metadata: ${response.statusText}`);
//       }

//       const metadata = await response.json();
//       const { title, author_name } = metadata;
//       const songData = {
//           url: youtubeUrl,
//           title,
//           artist: author_name,
//           requester,
//           timestamp: new Date().toISOString()
//       };

//       const songsRef = ref(database, 'songs');
//       await push(songsRef, songData);

//       res.status(200).json({ message: 'Song added successfully with metadata and requester info', songData });
//   } catch (error) {
//       console.error('Error:', error);
//       res.status(500).json({ message: 'Failed to add song', error: error.message });
//   }
// });




// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });



// SERVER_IDJ/server.js
import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push } from 'firebase/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

// Firebase configuration
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

// Serve Firebase config securely
app.get('/firebase-config', (req, res) => {
    res.json(firebaseConfig);
});

app.use(bodyParser.json());

app.post('/add-song', async (req, res) => {
    const { youtubeUrl, requester } = req.body;
    const oEmbedUrl = `https://www.youtube.com/oembed?url=${youtubeUrl}&format=json`;

    try {
        const response = await fetch(oEmbedUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch video metadata: ${response.statusText}`);
        }

        const metadata = await response.json();
        const { title, author_name } = metadata;
        const songData = {
            url: youtubeUrl,
            title,
            artist: author_name,
            requester,
            timestamp: new Date().toISOString()
        };

        const songsRef = ref(database, 'songs');
        await push(songsRef, songData);

        res.status(200).json({ message: 'Song added successfully with metadata and requester info', songData });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Failed to add song', error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
