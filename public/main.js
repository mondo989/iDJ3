import { djIntros, enjoyTexts } from './config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getDatabase, ref, query, orderByKey, startAfter, limitToFirst, onValue } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

let app, database, currentSongKey;
let player;
let isFirstPlay = true;
const backgroundMusic = new Audio('audio/background-music.mp3'); // Set the correct path to your background music file
backgroundMusic.volume = 0.2; // Initial volume at 20%
backgroundMusic.loop = true;

fetch('/firebase-config')
    .then(response => response.json())
    .then(config => {
        app = initializeApp(config);
        database = getDatabase(app);
        loadInitialSong();
    })
    .catch(error => console.error('Error loading Firebase config:', error));

function loadInitialSong() {
    const lastSongQuery = query(ref(database, 'songs'), orderByKey(), limitToFirst(1));
    onValue(lastSongQuery, snapshot => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const [firstKey] = Object.keys(data);
            currentSongKey = firstKey;
            const firstSong = data[firstKey];
            updateCurrentSongDisplay(firstSong);

            const djIntro = djIntros[Math.floor(Math.random() * djIntros.length)];
            const introText = `${djIntro} Here is the next song for you. Enjoy!`;

            if (isFirstPlay) {
                playRadioStationIntroduction(introText, firstSong.url);
                isFirstPlay = false;
            } else {
                generateTTSAndPlayVideo(introText, firstSong.url);
            }
        } else {
            console.log('No data available');
        }
    });
}

function playRadioStationIntroduction(introText, youtubeURL) {
    const djIntro = djIntros[Math.floor(Math.random() * djIntros.length)];
    const enjoyText = enjoyTexts[Math.floor(Math.random() * enjoyTexts.length)];
    const introductionText = `${djIntro} Welcome to the iDJ radio station. ${enjoyText}`;

    generateTTS(introductionText)
        .then(() => {
            fadeInBackgroundMusic(() => {
                generateTTSAndPlayVideo(introText, youtubeURL);
            });
        });
}

function fadeInBackgroundMusic(callback) {
    backgroundMusic.volume = 0;
    backgroundMusic.play();

    let fadeInInterval = setInterval(() => {
        if (backgroundMusic.volume < 0.2) {
            backgroundMusic.volume = Math.min(backgroundMusic.volume + 0.01, 0.2); // Fade to 20%
        } else {
            clearInterval(fadeInInterval);
            if (callback) callback();
        }
    }, 100); // Increase volume every 100ms
}

function fadeOutBackgroundMusic() {
    let fadeOutInterval = setInterval(() => {
        if (backgroundMusic.volume > 0) {
            backgroundMusic.volume = Math.max(backgroundMusic.volume - 0.004, 0); // Fade out over 5s
        } else {
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0;
            clearInterval(fadeOutInterval);
        }
    }, 100); // Decrease volume every 100ms
}

function updateCurrentSongDisplay(song) {
    document.getElementById('currentSong').textContent = `${song.title} - ${song.artist}`;
    document.getElementById('requestedBy').textContent = `Requested By ${song.requester}`;
}

function onYouTubeIframeAPIReady() {
    // This function will be called automatically by the YouTube API
}

function loadYouTubeVideo(url) {
    const videoId = extractVideoId(url);
    const playerDiv = document.getElementById('player');
    playerDiv.innerHTML = ''; // Clear the existing player div

    const newPlayerDiv = document.createElement('div');
    newPlayerDiv.id = 'yt-player';
    playerDiv.appendChild(newPlayerDiv);

    player = new YT.Player('yt-player', {
        height: '390',
        width: '640',
        videoId: videoId,
        playerVars: {
            'autoplay': 0,  // Do not autoplay the video
            'mute': 0       // Unmute the video
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function extractVideoId(url) {
    const urlParams = new URLSearchParams(new URL(url).search);
    return urlParams.get('v');
}

function onPlayerReady(event) {
    // No auto-play to ensure TTS plays first
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED) {
        playBackgroundMusicBeforeDJ();
    }
}

function playBackgroundMusicBeforeDJ() {
    backgroundMusic.play();
    setTimeout(() => {
        skipToNextSong();
    }, 3000); // Play background music for 3 seconds before DJ speaks
}

document.getElementById('skipSong').addEventListener('click', skipToNextSong);

function skipToNextSong() {
    const nextSongQuery = query(ref(database, 'songs'), orderByKey(), startAfter(currentSongKey), limitToFirst(1));
    onValue(nextSongQuery, snapshot => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const [nextKey] = Object.keys(data);
            currentSongKey = nextKey;
            const nextSong = data[nextKey];
            updateCurrentSongDisplay(nextSong);

            const djIntro = djIntros[Math.floor(Math.random() * djIntros.length)];
            const enjoyText = enjoyTexts[Math.floor(Math.random() * enjoyTexts.length)];
            const introText = `${djIntro} This is ${nextSong.title}, by ${nextSong.artist}. Requested by ${nextSong.requester}, ${enjoyText}`;

            destroyIframe();
            loadYouTubeVideo(nextSong.url); // Load the next iframe first
            fadeInBackgroundMusic(() => {
                generateTTSAndPlayVideo(introText);
            });
        } else {
            alert('No more songs in the queue.');
        }
    });
}

function destroyIframe() {
    const playerDiv = document.getElementById('player');
    playerDiv.innerHTML = ''; // Clear the existing player div
}

function generateTTSAndPlayVideo(introText, youtubeURL) {
    fetch('/generate-speech', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: introText })
    })
    .then(response => response.json())
    .then(data => {
        const timestamp = new Date().getTime(); // Generate a timestamp to bust cache
        const audio = new Audio(`${data.filePath}?t=${timestamp}`); // Append timestamp to file path
        fadeInBackgroundMusic(() => {
            audio.play().then(() => {
                audio.onended = () => {
                    fadeOutBackgroundMusic();
                    if (player && player.playVideo) {
                        player.playVideo();
                    }
                };
            }).catch(error => {
                console.error('Error playing audio:', error);
                // Fallback to play video if audio fails
                fadeOutBackgroundMusic();
                if (player && player.playVideo) {
                    player.playVideo();
                }
            });
        });
    })
    .catch(error => console.error('Error generating TTS:', error));
}

function generateTTS(text) {
    return fetch('/generate-speech', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: text })
    })
    .then(response => response.json())
    .then(data => {
        const timestamp = new Date().getTime(); // Generate a timestamp to bust cache
        const audio = new Audio(`${data.filePath}?t=${timestamp}`); // Append timestamp to file path
        return audio.play();
    })
    .catch(error => {
        console.error('Error generating TTS:', error);
        throw error;
    });
}
