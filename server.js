import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

app.get('/firebase-config', (req, res) => {
    res.json(firebaseConfig);
});

app.post('/generate-speech', async (req, res) => {
    const text = req.body.text || 'Here is the next song for you. Enjoy!';
    const voice = 'en_US/cmu-arctic_low'; // Specify your preferred voice for Mimic3
    const youtubeURL = req.body.youtubeURL || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Placeholder YouTube URL

    try {
        const response = await fetch('http://localhost:59125/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                INPUT_TEXT: text,
                VOICE: voice,
                INPUT_TYPE: 'TEXT',
                OUTPUT_TYPE: 'AUDIO',
                AUDIO: 'WAVE'
            }).toString()
        });

        if (!response.ok) {
            const responseText = await response.text(); // Read the response text for logging
            console.error('Error response text:', responseText);
            throw new Error(`Failed to generate speech: ${response.status} - ${response.statusText}`);
        }

        const audioBuffer = await response.arrayBuffer(); // Only read the response body once
        const outputDir = path.join(__dirname, 'public', 'output');
        const filePath = path.join(outputDir, 'speech.wav');

        // Ensure the output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(filePath, Buffer.from(audioBuffer));

        // Return the YouTube URL and file path to the front end
        res.status(200).json({ message: 'Speech generation succeeded', filePath: '/output/speech.wav', youtubeURL: youtubeURL });
    } catch (error) {
        console.error('Error generating speech:', error);
        res.status(500).json({ message: 'Error generating speech', error: error.toString() });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
