import { djIntros, enjoyTexts, applicationIntros, skipSongTexts } from './config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getDatabase, ref, query, orderByKey, startAfter, limitToFirst, onValue } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

let app, database, currentSongKey;
let player;
const backgroundMusic = new Audio('audio/background-music.mp3');
const djIntroA = new Audio('audio/lets-make-noise.mp3');
const skipSoundEffect = new Audio('audio/lets-make-noise.mp3');
skipSoundEffect.onerror = function () {
    console.error('Error loading skip sound effect');
};
djIntroA.volume = 0.05;
backgroundMusic.volume = 0.02; // Initial volume at 2%
backgroundMusic.loop = true;

document.getElementById('startApp').addEventListener('click', () => {
    document.getElementById('startApp').style.display = 'none';
    document.getElementById('songInfo').style.display = 'block';
    document.getElementById('skipSong').disabled = false;

    const applicationIntro = applicationIntros[Math.floor(Math.random() * applicationIntros.length)];
    backgroundMusic.play();
    djIntroA.play();

    // Add a timeout only for the initial play of the TTS
    setTimeout(() => {
        generateTTSAndPlay(applicationIntro).catch(error => {
            console.error('Error playing initial TTS:', error);
        });
    }, 5000);  // Delay of 5000 milliseconds (5 seconds)
});

fetch('/firebase-config')
    .then(response => response.json())
    .then(config => {
        app = initializeApp(config);
        database = getDatabase(app);
        loadInitialSong(false); // Ensure this is correctly placed to be called after Firebase is initialized
    })
    .catch(error => console.error('Error loading Firebase config:', error));

function playApplicationIntro() {
    const applicationIntro = applicationIntros[Math.floor(Math.random() * applicationIntros.length)];
    backgroundMusic.play();
    generateTTSAndPlay(applicationIntro).then(() => {
        fadeOutBackgroundMusic();
        loadInitialSong(true); // Pass true to autoplay the initial song
    });
}

function loadInitialSong(autoplay = false) {
    const firstSongQuery = query(ref(database, 'songs'), orderByKey(), limitToFirst(1));
    onValue(firstSongQuery, snapshot => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const [firstKey] = Object.keys(data);
            currentSongKey = firstKey;
            console.log('Current song key set:', currentSongKey); // Log the key to ensure it's being set
            const firstSong = data[firstKey];
            updateCurrentSongDisplay(firstSong);
            loadYouTubeVideo(firstSong.url, autoplay); // Load the YouTube video with the autoplay parameter
        } else {
            console.log('No data available');
        }
    });
}

function getRandomSkipSongText() {
    return skipSongTexts[Math.floor(Math.random() * skipSongTexts.length)];
}

function skipToNextSong() {
    if (typeof currentSongKey === 'undefined') {
        console.error('Current song key is undefined, cannot proceed to next song.');
        return;
    }

    // Update the UI to indicate skipping
    document.getElementById('currentSong').textContent = 'Skipping Song...';
    document.getElementById('requestedBy').style.display = 'none';

    console.log('Playing skip sound effect...');
    skipSoundEffect.play().then(() => {
        console.log('Skip sound effect played, destroying iframe...');
        destroyIframe(); // Destroy the current song YouTube iframe

        setTimeout(() => {
            let skipText = getRandomSkipSongText(); // Get random text from skip texts
            console.log('Playing skip text TTS:', skipText);
            generateTTSAndPlay(skipText).then(() => {
                console.log('Skip text TTS played, querying next song...');
                const nextSongQuery = query(ref(database, 'songs'), orderByKey(), startAfter(currentSongKey), limitToFirst(1));
                onValue(nextSongQuery, snapshot => {
                    if (snapshot.exists()) {
                        const data = snapshot.val();
                        const [nextKey] = Object.keys(data);
                        currentSongKey = nextKey;
                        const nextSong = data[nextKey];

                        // Load the next song YouTube iframe (but do not start it)
                        console.log('Loading next song YouTube iframe...');
                        loadYouTubeVideo(nextSong.url, false);

                        // Prepare up next song text
                        let upNextSongText = `Up Next we have the tunes of ${nextSong.title} by ${nextSong.artist}, this song was requested by ${nextSong.requester}.`;
                        console.log('Playing up next song text TTS:', upNextSongText);
                        generateTTSAndPlay(upNextSongText).then(() => {
                            // Only update the song information after the YouTube video starts playing
                            player.addEventListener('onStateChange', function (event) {
                                if (event.data === YT.PlayerState.PLAYING) {
                                    updateCurrentSongDisplay(nextSong);
                                    document.getElementById('requestedBy').style.display = 'block';
                                }
                            });

                            // Start the YouTube video
                            console.log('Starting YouTube video...');
                            if (player && typeof player.playVideo === 'function') {
                                player.playVideo();
                            }
                        });
                    } else {
                        alert('No more songs in the queue.');
                    }
                });
            });
        }, 1000); // 1 second timeout before playing next TTS
    }).catch(error => {
        console.error('Error playing skip sound effect:', error);
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

function loadYouTubeVideo(url, autoplay = false) {
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
            'autoplay': autoplay ? 1 : 0,  // Autoplay based on the parameter
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

function destroyIframe() {
    const playerDiv = document.getElementById('player');
    playerDiv.innerHTML = ''; // Clear the existing player div
}


function generateTTSAndPlay(introText) {
    return new Promise((resolve, reject) => {
        fetch('http://localhost:59126/api/tts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: introText })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.blob(); // Assuming the response is a binary blob (audio file)
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob); // Create a URL for the blob object
            const audio = new Audio(url);
            audio.play().then(() => {
                window.URL.revokeObjectURL(url); // Clean up the object URL after playing
                audio.onended = () => {
                    resolve();
                    if (player && typeof player.playVideo === 'function') {
                        player.playVideo(); // Ensure the YouTube video plays after TTS
                    }
                };
            }).catch(error => {
                console.error('Error playing audio:', error);
                reject(error);
            });
        })
        .catch(error => {
            console.error('Error generating TTS:', error);
            reject(error); // Rethrow after logging
        });
    });
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
