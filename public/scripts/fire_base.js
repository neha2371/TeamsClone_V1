'use strict';

function signIn() {
    // Sign into Firebase using popup auth & Google as the identity provider.
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);

}

// Signs-out.
function signOut() {
    // Sign out
    firebase.auth().signOut();

}

// Initiate Firebase Auth.
function initFirebaseAuth() {
    // Listen to auth state changes.
    firebase.auth().onAuthStateChanged(authStateObserver);
}

// Returns the signed-in user's profile Pic URL.
function getProfilePicUrl() {
    return firebase.auth().currentUser.photoURL || '/images/profile_placeholder.png';
}

// Returns the signed-in user's display name.
function getUserName() {
    return firebase.auth().currentUser.displayName;
}

// Returns true if a user is signed-in.
function isUserSignedIn() {
    return !!firebase.auth().currentUser;
}

// Saves a new message to your Cloud Firestore database.
function saveMessage(messageText, roomid) {

    // Add a new message entry to the database.
    return firebase.firestore().collection(roomid).add({
        name: getUserName(),
        text: messageText,
        profilePicUrl: getProfilePicUrl(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        curTime: time(),
    }).catch(function(error) {
        console.error('Error writing new message to database', error);
    });
}

function time() {
    var timestamp = new Date();
    var hour = timestamp.getHours().toString();
    var minute = timestamp.getMinutes().toString();
    var afternoon = (hour >= 12) ? "PM" : "AM"

    if (hour >= 12)
        hour -= 12;
    if (hour == 0)
        hour = "12";
    else if (hour < 10)
        hour = "0" + hour.toString();
    else
        hour = toString();

    if (minute < 10)
        minute = "0" + minute.toString();
    else
        minute = minute.toString();

    var stamp = hour + ":" + minute + " " + afternoon;
    return stamp;
}
// Loads chat messages history and listens for upcoming ones.
function loadMessages(roomid) {
    // Create the query to load the last 12 messages and listen for new ones.
    var query = firebase.firestore()
        .collection(roomid)
        .orderBy('timestamp', 'desc')
        .limit(12);

    // Start listening to the query.
    query.onSnapshot(function(snapshot) {
        snapshot.docChanges().forEach(function(change) {
            if (change.type === 'removed') {
                deleteMessage(change.doc.id);
            } else {
                var message = change.doc.data();
                displayMessage(change.doc.id, message.timestamp, message.name,
                    message.text, message.profilePicUrl, message.imageUrl, message.curTime);
            }
        });
    });
}

// This first saves the image in Firebase storage.
function saveImageMessage(file, roomId) {
    // 1 - We add a message with a loading icon that will get updated with the shared image.
    firebase.firestore().collection(roomId).add({
        name: getUserName(),
        imageUrl: LOADING_IMAGE_URL,
        profilePicUrl: getProfilePicUrl(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        curTime: time()
    }).then(function(messageRef) {
        // 2 - Upload the image to Cloud Storage.
        var filePath = firebase.auth().currentUser.uid + '/' + messageRef.id + '/' + file.name;
        return firebase.storage().ref(filePath).put(file).then(function(fileSnapshot) {
            // 3 - Generate a public URL for the file.
            return fileSnapshot.ref.getDownloadURL().then((url) => {
                // 4 - Update the chat message placeholder with the image's URL.
                return messageRef.update({
                    imageUrl: url,
                    storageUri: fileSnapshot.metadata.fullPath
                });
            });
        });
    }).catch(function(error) {
        console.error('There was an error uploading a file to Cloud Storage:', error);
    });
}

// Saves the messaging device token to the datastore.
function saveMessagingDeviceToken() {
    firebase.messaging().getToken().then(function(currentToken) {
        if (currentToken) {
            console.log('Got FCM device token:', currentToken);
            // Saving the Device Token to the datastore.
            firebase.firestore().collection('fcmTokens').doc(currentToken)
                .set({
                    uid: firebase.auth().currentUser.uid
                });
        } else {
            // Need to request permissions to show notifications.
            requestNotificationsPermissions();
        }
    }).catch(function(error) {
        console.error('Unable to get messaging token.', error);
    });
}

// Requests permission to show notifications.
function requestNotificationsPermissions() {
    console.log('Requesting notifications permission...');
    firebase.messaging().requestPermission().then(function() {
        // Notification permission granted.
        saveMessagingDeviceToken();
    }).catch(function(error) {
        console.error('Unable to get permission to notify.', error);
    });
}


// Triggered when a file is selected via the media picker.
function onMediaFileSelected(event) {
    event.preventDefault();
    var file = event.target.files[0];

    // Clear the selection in the file picker input.
    imageFormElement.reset();

    // Check if the file is an image.
    if (!file.type.match('image.*')) {
        var data = {
            message: 'You can only share images',
            timeout: 2000
        };
        signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
        return;
    }
    // Check if the user is signed-in
    if (checkSignedInWithMessage()) {
        saveImageMessage(file, ROOM_ID);
    }
}

// Triggered when the send new message form is submitted.
function onMessageFormSubmit(e) {
    e.preventDefault();
    // Check that the user entered a message and is signed in.
    if (messageInputElement.value && checkSignedInWithMessage()) {
        saveMessage(messageInputElement.value, ROOM_ID).then(function() {
            // Clear message text field and re-enable the SEND button.
            resetMaterialTextfield(messageInputElement);
            toggleButton();
        });
    }
}

// Triggers when the auth state change for instance when the user signs-in or signs-out.
function authStateObserver(user) {
    if (user) { // User is signed in!
        // Get the signed-in user's profile pic and name.
        var profilePicUrl = getProfilePicUrl();
        var userName = getUserName();

        // Set the user's profile pic and name.
        userPicElement.style.backgroundImage = 'url(' + addSizeToGoogleProfilePic(profilePicUrl) + ')';
        userNameElement.textContent = userName;

        // Show user's profile and sign-out button.
        userNameElement.removeAttribute('hidden');
        userPicElement.removeAttribute('hidden');
        signOutButtonElement.removeAttribute('hidden');

        // Hide sign-in button.
        signInButtonElement.setAttribute('hidden', 'true');

        // We save the Firebase Messaging Device token and enable notifications.
        saveMessagingDeviceToken();
    } else { // User is signed out!
        // Hide user's profile and sign-out button.
        userNameElement.setAttribute('hidden', 'true');
        userPicElement.setAttribute('hidden', 'true');
        signOutButtonElement.setAttribute('hidden', 'true');

        // Show sign-in button.
        signInButtonElement.removeAttribute('hidden');
    }
}

// Returns true if user is signed-in. Otherwise false and displays a message.
function checkSignedInWithMessage() {
    // Return true if the user is signed in Firebase
    if (isUserSignedIn()) {
        return true;
    }

    // Display a message to the user using a Toast.
    var data = {
        message: 'You must sign-in first',
        timeout: 2000
    };
    signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
    return false;
}

// Resets the given MaterialTextField.
function resetMaterialTextfield(element) {
    element.value = '';
    element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
}

// Template for messages.
var MESSAGE_TEMPLATE =
    '<div class="message-container">' +
    '<div class="spacing"><div class="pic"></div></div>' +
    '<div class="message"></div>' +
    '<div class="name"></div>' +
    '</div>';

// Adds a size to Google Profile pics URLs.
function addSizeToGoogleProfilePic(url) {
    if (url.indexOf('googleusercontent.com') !== -1 && url.indexOf('?') === -1) {
        return url + '?sz=150';
    }
    return url;
}

// A loading image URL.
var LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif?a';

// Delete a Message from the UI.
function deleteMessage(id) {
    var div = document.getElementById(id);
    // If an element for that message exists we delete it.
    if (div) {
        div.parentNode.removeChild(div);
    }
}

function createAndInsertMessage(id, timestamp) {
    const container = document.createElement('div');
    container.innerHTML = MESSAGE_TEMPLATE;
    const div = container.firstChild;
    div.setAttribute('id', id);

    // If timestamp is null, assume we've gotten a brand new message.
    timestamp = timestamp ? timestamp.toMillis() : Date.now();
    div.setAttribute('timestamp', timestamp);

    // figure out where to insert new message
    const existingMessages = messageListElement.children;
    if (existingMessages.length === 0) {
        messageListElement.appendChild(div);
    } else {
        let messageListNode = existingMessages[0];

        while (messageListNode) {
            const messageListNodeTime = messageListNode.getAttribute('timestamp');

            if (!messageListNodeTime) {
                throw new Error(
                    `Child ${messageListNode.id} has no 'timestamp' attribute`
                );
            }

            if (messageListNodeTime > timestamp) {
                break;
            }

            messageListNode = messageListNode.nextSibling;
        }

        messageListElement.insertBefore(div, messageListNode);
    }

    return div;
}

// Displays a Message in the UI.
function displayMessage(id, timestamp, name, text, picUrl, imageUrl, curTime) {
    var div = document.getElementById(id) || createAndInsertMessage(id, timestamp);

    // profile picture
    if (picUrl) {
        div.querySelector('.pic').style.backgroundImage = 'url(' + addSizeToGoogleProfilePic(picUrl) + ')';
    }

    div.querySelector('.name').textContent = name + " " + curTime;
    var messageElement = div.querySelector('.message');

    if (text) { // If the message is text.
        messageElement.textContent = text;
        // Replace all line breaks by <br>.
        messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
    } else if (imageUrl) { // If the message is an image.
        var image = document.createElement('img');
        image.addEventListener('load', function() {
            messageListElement.scrollTop = messageListElement.scrollHeight;
        });
        image.src = imageUrl + '&' + new Date();
        messageElement.innerHTML = '';
        messageElement.appendChild(image);
    }
    // Show the card fading-in and scroll to view the new message.
    setTimeout(function() {
        div.classList.add('visible')
    }, 1);
    messageListElement.scrollTop = messageListElement.scrollHeight;
    messageInputElement.focus();
}

// Enables or disables the submit button depending on the values of the input
// fields.
function toggleButton() {
    if (messageInputElement.value) {
        submitButtonElement.removeAttribute('disabled');
    } else {
        submitButtonElement.setAttribute('disabled', 'true');
    }
}
var messageListElement = document.getElementById('messages');
var messageFormElement = document.getElementById('message-form');
var messageInputElement = document.getElementById('message');
var submitButtonElement = document.getElementById('submit');
var imageButtonElement = document.getElementById('submitImage');
var imageFormElement = document.getElementById('image-form');
var mediaCaptureElement = document.getElementById('mediaCapture');
var userPicElement = document.getElementById('user-pic');
var userNameElement = document.getElementById('user-name');
var signInButtonElement = document.getElementById('sign-in');
var signOutButtonElement = document.getElementById('sign-out');
var signInSnackbarElement = document.getElementById('must-signin-snackbar');