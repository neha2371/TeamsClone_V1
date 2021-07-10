

// Shortcuts to DOM Elements.

// Saves message on form submit.
messageFormElement.addEventListener('submit', onMessageFormSubmit);
signOutButtonElement.addEventListener('click', signOut);
signInButtonElement.addEventListener('click', signIn);

// Toggle for the button.
messageInputElement.addEventListener('keyup', toggleButton);
messageInputElement.addEventListener('change', toggleButton);

// Events for image upload.
imageButtonElement.addEventListener('click', function(e) {
  e.preventDefault();
  mediaCaptureElement.click();
});
mediaCaptureElement.addEventListener('change', onMediaFileSelected);

// initialize Firebase
initFirebaseAuth();

firebase.performance();

// We load currently existing chat messages and listen to new ones.

loadMessages(ROOM_ID);
document.getElementById("join").addEventListener('click', () => {
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            console.log(getUserName() + " logged in")
         window.location = ROOM_ID + "/videocall";
        }
      })    
})
document.getElementById('copy').addEventListener('click', () => {
    if (checkSignedInWithMessage()) {
        var text = window.location.href;
        navigator.clipboard.writeText(text).then(function () {
            console.log('Async: Copying to clipboard was successful!');
            var data = {
                message: 'Joining info copied to clipboard',
                timeout: 2000
            };
            signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
        }, function (err) {
            console.error('Async: Could not copy text: ', err);
        });
    }
   

})
const myVideo = document.createElement('video')
myVideo.muted = true;
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false

}).then(stream => {
    myVideo.srcObject = stream;
    myVideo.addEventListener('loadedmetadata', () => {
        myVideo.play()
    })
    document.getElementById('video-grid').append(myVideo)
})
