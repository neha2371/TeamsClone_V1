

// Shortcuts to DOM Elements.

// Saves message on form submit.
var myUserName
messageFormElement.addEventListener('submit', onMessageFormSubmit);
signOutButtonElement.addEventListener('click', signOut);
signInButtonElement.addEventListener('click', signIn);

// Toggle for the button.
messageInputElement.addEventListener('keyup', toggleButton);
messageInputElement.addEventListener('change', toggleButton);
var inviteFormElement = document.getElementById('invite-form');
var inviteButtonElement = document.getElementById('submit-invite');
var inviteInputElement = document.getElementById('invite');
inviteFormElement.addEventListener('submit', sendInviteMail);
inviteInputElement.addEventListener('keyup', toggleInviteButton);
inviteInputElement.addEventListener('change', toggleInviteButton);
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
 firebase.auth().onAuthStateChanged(function (user) {
     if (user) {
         loadMessages(ROOM_ID);
         myUserName = getUserName();
     }
 })
    

document.getElementById("join").addEventListener('click', () => {
    if (checkSignedInWithMessage()) {
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                console.log(getUserName() + " logged in")
                window.location = ROOM_ID + "/videocall";
            }
        })
    }
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
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        sendEmail(user)
    }
  })
  function sendEmail(user) {
	Email.send({
	Host: "smtp.gmail.com",
	Username : "teams.clone.manager@gmail.com",
	Password : "noob@1234",
	To : user.email,
	From : "teams.clone.manager@gmail.com",
	Subject : "Thank you for registering on Teams Clone!",
	Body : "Hi " + (user.displayName.split(' '))[0] + "! We are happy to see you here. Your room link is " + window.location.href,
	}).then(
		console.log("mail sent successfully")
	);
}
  function sendInviteMail(e) {
      e.preventDefault();
      console.log("hey")
    // Check that the user entered a message and is signed in.
    if (inviteInputElement.value && checkSignedInWithMessage()) {
      inviteUser(inviteInputElement.value)
        // Clear message text field and re-enable the SEND button.
        resetMaterialTextfield(inviteInputElement);
        toggleInviteButton();
    }
  }

  function inviteUser(emailId){
    Email.send({
        Host: "smtp.gmail.com",
        Username : "teams.clone.manager@gmail.com",
        Password : "noob@1234",
        To : emailId,
        From : "teams.clone.manager@gmail.com",
        Subject : "Teams Clone Invite",
        Body : "Hey there! You have been invited to a Teams Clone Room by " + myUserName + "! We will be happy to see you there. Your room link is " + window.location.href,
        })
        console.log("invite-mail sent successfully")
  }

  function toggleInviteButton() {
    if (inviteInputElement.value) {
      inviteButtonElement.removeAttribute('disabled');
      //console.log("hey")
    } else {
      inviteButtonElement.setAttribute('disabled', 'true');
    }
  }