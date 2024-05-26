import express from 'express';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Endpoint to serve Firebase configuration
app.get('/firebase-config', (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  });
});

app.post('/generate-speech', async (req, res) => {
  const text = req.body.text || 'Here is the next song for you. Enjoy!';
  const voice = 'en_US/cmu-arctic_low';

  try {
    const params = new URLSearchParams({
      INPUT_TEXT: text,
      VOICE: voice,
      INPUT_TYPE: 'TEXT',
      OUTPUT_TYPE: 'AUDIO',
      AUDIO: 'WAVE'
    }).toString();

    const response = await fetch('http://localhost:59125/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error from Mimic3: ${errorText}`);
      throw new Error(`Failed to generate speech: ${response.status} - ${response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const outputDir = path.join(__dirname, 'public', 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, 'speech.wav');
    fs.writeFileSync(filePath, Buffer.from(audioBuffer));
    res.status(200).json({
      message: 'Speech generation succeeded',
      filePath: `/output/speech.wav`
    });
  } catch (error) {
    console.error(`Error generating speech on server: ${error}`);
    res.status(500).json({
      message: 'Error generating speech',
      error: error.toString()
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Server is healthy');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
