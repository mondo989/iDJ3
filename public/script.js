// SERVER_IDJ/public/script.js
// document.getElementById('#skipSong').addEventListener('click', getNextSong);

function updateCurrentSongDisplay(song) {
    document.getElementById('currentSong').textContent = `${song.title} - ${song.artist}`;
    document.getElementById('requestedBy').textContent = `Requested By ${song.requester}`;
}

function getNextSong() {
    const songRef = database.ref('songs').limitToLast(1);
    songRef.on('value', snapshot => {
        const data = snapshot.val();
        if (data) {
            const lastKey = Object.keys(data)[0];
            const lastSong = data[lastKey];
            updateCurrentSongDisplay(lastSong);
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
  const submitBtn = document.getElementById('submitRequest');
  if (submitBtn) {
      submitBtn.addEventListener('click', requestSong);
  } else {
      console.error('Submit button not found');
  }
});

function requestSong() {
  const youtubeUrl = document.getElementById('youtubeUrl').value;
  const requesterName = document.getElementById('requesterName').value;
  const messageElement = document.getElementById('message');

  if (!youtubeUrl || !requesterName) {
      messageElement.textContent = 'Please fill in all fields.';
      messageElement.style.color = 'red';
      return;
  }

  fetch('/add-song', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ youtubeUrl, requester: requesterName })
  })
  .then(response => response.json())
  .then(data => {
      if (data.message) {
          messageElement.textContent = data.message;
          messageElement.style.color = 'green';
      }
  })
  .catch(error => {
      messageElement.textContent = 'Error requesting song: ' + error.message;
      messageElement.style.color = 'red';
  });
}




// function requestSong() {
//   const youtubeUrl = document.getElementById('youtubeUrl').value;
//   const requesterName = document.getElementById('requesterName').value;
//   const messageElement = document.getElementById('message');

//   if (!youtubeUrl || !requesterName) {
//       messageElement.textContent = 'Please fill in all fields.';
//       messageElement.style.color = 'red';
//       return;
//   }

//   fetch('/add-song', {
//       method: 'POST',
//       headers: {
//           'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({ youtubeUrl, requester: requesterName })
//   })
//   .then(response => response.json())
//   .then(data => {
//       if (data.message) {
//           messageElement.textContent = data.message;
//           messageElement.style.color = 'green';
//       }
//   })
//   .catch(error => {
//       messageElement.textContent = 'Error requesting song: ' + error.message;
//       messageElement.style.color = 'red';
//   });
// }