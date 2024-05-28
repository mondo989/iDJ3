# iDJ3

iDJ3 is a dynamic music player application that integrates Firebase for song management and Mimic3 for text-to-speech (TTS) capabilities. This application allows users to skip songs, receive vocal announcements, and play YouTube videos seamlessly. ^GPT TEXT.  also I really don't like ads from yt app

## Features

- Play and manage songs using Firebase.
- Text-to-Speech announcements using Mimic3.
- Dynamic YouTube video loading and autoplay.
- Background music with fade-in and fade-out effects.
- Skip song functionality with sound effects and TTS song announcements.

## Setup and Installation

### Prerequisites

- Node.js
- Docker (for Mimic3 server)
- Firebase project configuration
- YouTube API Key

### Mimic3 Setup

1. **Download and Install Mimic3**
    ```bash
    git clone https://github.com/MycroftAI/mimic3.git
    cd mimic3
    ./install.sh
    ```

2. **Run Mimic3 Docker Container**
    ```bash
    mkdir -p "${HOME}/.local/share/mycroft/mimic3"
    chmod a+rwx "${HOME}/.local/share/mycroft/mimic3"
    docker run -it -p 59126:59126 -v "${HOME}/.local/share/mycroft/mimic3:/home/mimic3/.local/share/mycroft/mimic3" mycroftai/mimic3
    ```

3. **Verify Available Voices**
    ```bash
    ls /System/Volumes/Data/Users/m/.local/share/mycroft/mimic3/voices
    ```

### Firebase Setup

1. **Create a Firebase Project**
    - Go to the Firebase Console: https://console.firebase.google.com/
    - Create a new project and add a Realtime Database.

2. **Firebase Configuration**
    - Copy the Firebase configuration and save it in a file named `firebase-config.json`.

3. **Update Firebase Rules**
    Ensure your Firebase Realtime Database rules allow read/write access as needed.

### Application Setup

1. **Clone the Repository**
    ```bash
    git clone https://github.com/mondo989/iDJ3.git
    cd iDJ3
    ```

2. **Install Dependencies**
    ```bash
    npm install
    ```

3. **Run the Application**
    ```bash
    npm start
    ```

## Configuration

### Firebase Configuration

Ensure the `firebase-config.json` file is placed in the public directory. This file should contain your Firebase configuration details.

### Config File

Update the `config.js` file with your desired text arrays for DJ intros, enjoy texts, application intros, and skip song texts.

```javascript
export const djIntros = [
  "Let's get this party started! ",
  "You're going to love this one! ",
  "Next up is a great track! "
];

export const enjoyTexts = [
  "Enjoy the music!",
  "Hope you like it!",
  "Get ready to dance!"
];

export const applicationIntros = [
  "Hello World, you're rocking to the Tunes of DJ Intergalactic Bunz your friendly DJ! We have quite a show for you today. Sit back grab a seat and we'll get start shortly."
];

export const skipSongTexts = [
  "Alright, let's skip to the next track!",
  "Moving on to the next song!",
  "Next song coming up!"
];
