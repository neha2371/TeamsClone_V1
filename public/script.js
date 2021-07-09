const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {

    path: '/peerjs',
    host: '/',
    port: '443'
})
timer();
let temp;
let myVideoStream;let screenStream; 
//let myScreenStream;
var activeSreen = "";
const myVideo = document.createElement('video')
myVideo.muted = true;
const peers = {}
const peerscall = {}
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream, "self")
    myPeer.on('connection', function(conn) {
        var uniId = conn.peer
        peers[uniId] = conn;
        conn.on('close', () => {

            console.log("conn close event 1");
            handlePeerDisconnect(document.getElementById(uniId));
            conn.peerConnection.close();


        })

    });

    myPeer.on('call', call => {
        peerscall[call.peer] = call;
        call.answer(stream)
        var video = document.createElement('video')
        call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream, call.peer)
                /*document.getElementById("incVideo").addEventListener("click", () => {
                    videoOnOff(video, userVideoStream);
                })*/
        });
        /*if(call.stream.getVideoTracks()[0].enabled == true) console.log("yay");
        else console.log(":(");*/
    });
    
    document.getElementById("shareScreen").addEventListener('click', (e) => {
        let enabled = document.getElementById("shareScreen").classList.contains("active-btn");
        if (enabled) {
    //         var tracks = screenStream.getTracks();
    // for( var i = 0 ; i < tracks.length ; i++ ) tracks[i].stop();
            //    
            if (screenStream.readyState != "ended")
            screenStream.readyState = "ended";
             
            shareUnshare();
            stopStreamedVideo()     
            stopScreenShare();
        }
        else {
              navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always'
                },
                audio: {
                    echoCancellation: true,
                    noiseSupprission: true
                }
              }).then(stream => {
                  screenStream = stream;
                shareUnshare();
                let videoTrack = stream.getVideoTracks()[0];
                  videoTrack.onended = function () {
                //    var tracks = stream.getTracks();
                //     for( var i = 0 ; i < tracks.length ; i++ ) tracks[i].stop();
                      if (stream.readyState != "ended")
                          stream.readyState = "ended";
                      
                      shareUnshare();
                      stopStreamedVideo();
                        stopScreenShare();
                    
                }
                Object.keys(peerscall).forEach(function (x) {
                    let sender = peerscall[x].peerConnection.getSenders().find(function (s) {
                        return s.track.kind == videoTrack.kind;
                    })
                    sender.replaceTrack(videoTrack);
                })
            }).catch((err) => {
                console.log("unable to get display media" + err)
            })

        }

    });
    document.getElementById("altStop").addEventListener('click', (e)=> {
    shareUnshare();
    stopScreenShare();
    })
    socket.on('user-connected', userId => {
            connectToNewUser(userId, stream)
    })
    

    let text = $("input");

    $('html').keydown(function(e) {
        if (e.which == 13 && text.val().length !== 0) {
            $(".messages").append(`<li class="message user_message"><b>Me</b><br/>${text.val()}</li>`);
            scrollToBottom()
            socket.emit('message', text.val()); 
            text.val('')
        }
    });
    socket.on("createMessage", message => {
        $(".messages").append(`<li class="message"><b>Anonymous</b><br/>${message}</li>`);
        scrollToBottom()
    })
})
socket.on('user-disconnected', userId => {
    var video = document.getElementById(userId);
    if(video){
        handlePeerDisconnect(video);
    }
    
})
function stopStreamedVideo() {

  const tracks = screenStream.getTracks();

  tracks.forEach(function(track) {
    track.stop();
  });

  //videoElem.srcObject = null;
}
function stopScreenShare() {

        let videoTrack = myVideoStream.getVideoTracks()[0];
        Object.keys(peerscall).forEach(function(x) {
            let sender = peerscall[x].peerConnection.getSenders().find(function(s) {
                return s.track.kind == videoTrack.kind;
            })
            sender.replaceTrack(videoTrack);
        })
    }

myPeer.on('open', id => {
    temp = id;
    socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
    const conn = myPeer.connect(userId, {
        metadata: {
            uniId: temp
        }
    });
    const call = myPeer.call(userId, stream)
    var video = document.createElement('video')
    call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream, userId)
        
        /*document.getElementById("incVideo").addEventListener("click", () => {
                videoOnOff(video, userVideoStream);
            })*/
    })

    conn.on('close', () => {
        console.log("conn close event 2");
        handlePeerDisconnect(video);
        conn.close();
    });
    peerscall[userId] = call;
    peers[userId] = conn;

}

function addVideoStream(video, stream, userId) {
    console.log("I am ad video Stream");
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    video.id = userId
    video.addClass ="otherVideos"
    videoGrid.append(video)

}




const scrollToBottom = () => {
    var d = $('.main__chat_window');
    d.scrollTop(d.prop("scrollHeight"));
}
document.getElementById("incAudio").addEventListener('click', (e) => {
    let enabled = document.getElementById("incAudio").classList.contains("active-btn")
    if(enabled)
    {
        document.getElementById("incAudio").classList.remove("active-btn")
        document.getElementById("incAudio").innerHTML = `<i class="fas fa-volume-mute"></i> Stop Incoming Audio`
         var elems = document.querySelectorAll("video, audio");

        [].forEach.call(elems, function (elem) {
           if(elem.id !="self")
    elem.muted = false;
        });
    }
    else
    {
        document.getElementById("incAudio").classList.add("active-btn")
        document.getElementById("incAudio").innerHTML = `<i class="fas fa-volume-up"></i> Play Incoming audio`
        var elems = document.querySelectorAll("video, audio");

        [].forEach.call(elems, function (elem) {
            elem.muted = true;
        });
    }
})
document.getElementById("incVideo").addEventListener('click', function() {
    let enabled = document.getElementById("incVideo").classList.contains("active-btn");
                if(enabled)
                {
                    console.log("I was triggered too")
                    document.getElementById("incVideo").classList.remove("active-btn");
                    document.getElementById("incVideo").innerHTML=`<i class="fas fa-video-slash"></i>Stop Incoming Video`
                    // for(let x in peerscall) {
                    //    console.log(x);
                    // //    console.log(peerscall[x]);
                    // //   peerscall[x].stream.getVideoTracks()[0].enabled = true;
                    // }
                    
                    var elems = document.querySelectorAll("video");
                    [].forEach.call(elems, function (elem) {
                         
                        if (elem.id != "self") {
                            playStreamedVideo(elem);
                        }
                            //
                        }
                    )   
                   
                }
                else
                {
                    document.getElementById("incVideo").classList.add("active-btn");
                    document.getElementById("incVideo").innerHTML = `<i class="fas fa-video"></i>Play Incoming Video`
                    /*for(let x in peerscall) {
                       peerscall[x].stream.getVideoTracks()[0].enabled = false;
                    }*/
                    // Object.keys(peerscall).forEach(function(x) {
                    //    peerscall[x].stream.getVideoTracks()[0].enabled = false;
                    // })
                    var elems = document.querySelectorAll("video");
                    [].forEach.call(elems, function (elem) {
                         
                            if (elem.id != "self") {
                                stopStreamedVideo(elem);
                                }
                            //
                        
                    });
                    // elem.forEach(function (vidEl) {
                    //     console.log(vidEl.id)
                        
                    //     if(vidEl.id != "self")
                    //     stopStreamedVideo(vidEl);
                    // })
                }
})

function stopStreamedVideo(videoElem) {
    const stream = videoElem.srcObject;
    const tracks = stream.getVideoTracks();
  
    tracks.forEach(function(track) {
      track.enabled=false;
    });
    videoElem.classList.add("invisible")
  
  }
function playStreamedVideo(videoElem) {
    const stream = videoElem.srcObject;
    const tracks = stream.getVideoTracks();
  
    tracks.forEach(function(track) {
        track.enabled=true;
        
    });
    videoElem.classList.remove("invisible")
  
  }


const shareUnshare = () => {
    let enabled = document.getElementById("shareScreen").classList.contains("active-btn");
    if (enabled) {
        //myScreenStream.getVideoTracks()[0].enabled = false;
        document.querySelector('.main__screen_button').innerHTML = `<i class="fas fa-arrow-alt-circle-up"></i>`
        document.querySelector('.main__screen_button').setAttribute("title", "Present Screen")
        document.getElementById("shareScreen").classList.remove("active-btn");
        document.getElementById("screenShareReminder").classList.add("screen-hide");

    } else {
        document.getElementById("screenShareReminder").classList.remove("screen-hide");
        document.querySelector('.main__screen_button').innerHTML = `<i class="fas fa-arrow-circle-down"></i>`
        document.querySelector('.main__screen_button').setAttribute("title", "Stop Presenting");
        document.getElementById("shareScreen").classList.add("active-btn");
        //myScreenStream.getVideoTracks()[0].enabled = true;
    }
}
const muteUnmute = () => {
    let enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        document.querySelector('.main__mute_button').innerHTML = `<i class="unmute fas fa-microphone-slash"></i>`
        document.querySelector('.main__mute_button').setAttribute("title", "Unmute");
        
    } else {
        document.querySelector('.main__mute_button').innerHTML =  `<i class="fas fa-microphone"></i>`
        document.querySelector('.main__mute_button').setAttribute("title", "Mute");
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
}

const playStop = () => {

    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        document.querySelector('.main__video_button').innerHTML = `<i class="stop fas fa-video-slash"></i>`
        document.querySelector('.main__video_button').setAttribute("title", "Play Video");
    } else {
        document.querySelector('.main__video_button').innerHTML=`<i class="fas fa-video"></i>`
        myVideoStream.getVideoTracks()[0].enabled = true;
        document.querySelector('.main__video_button').setAttribute("title", "Stop Video");
    }
}

const leaveMeeting = () => {

    location.href = "http://www.google.com";
}

const isHidden = (screen) => screen.classList.contains("screen-hide");

const handleScreen = (screen) => {
    const left_container = document.querySelector(".main__left");
    const right_container = document.querySelector(".main__right");
    const chatScreen = document.getElementById("chat-screen");
    const usersScreen = document.getElementById("users-screen");

    if (screen.id === "chats") {
        handleActive("chat-btn");
        if (activeSreen === "") {
            chatScreen.classList.remove("screen-hide");
            activeSreen = "chats";
        } else if (activeSreen === "chats") {
            chatScreen.classList.add("screen-hide");
            activeSreen = "";
        } else {
            chatScreen.classList.remove("screen-hide");
            usersScreen.classList.add("screen-hide");
            activeSreen = "chats";
            handleActive("users-btn");
        }
    } else {
        handleActive("users-btn");
        if (activeSreen === "") {
            usersScreen.classList.remove("screen-hide");
            activeSreen = "users";
        } else if (activeSreen === "users") {
            usersScreen.classList.add("screen-hide");
            activeSreen = "";
        } else {
            usersScreen.classList.remove("screen-hide");
            chatScreen.classList.add("screen-hide");
            activeSreen = "users";
            handleActive("chat-btn");
        }
    }

    if (isHidden(right_container)) {
        right_container.classList.remove("screen-hide");
        left_container.classList.remove("screen-full");
    } else if (activeSreen === "") {
        right_container.classList.add("screen-hide");
        left_container.classList.add("screen-full");
    }
};

const handleActive = (buttonClass) => {
    const button = document.querySelector(`.${buttonClass}`);
    const active = button.classList.contains("active-btn");

    if (active) button.classList.remove("active-btn");
    else button.classList.add("active-btn");
};

function handlePeerDisconnect(video) {

    video.srcObject = null;
    console.log("left " + video.id);
    video.remove();

}
function timer()
{
    document.getElementById("time").innerHTML = new Date().toLocaleTimeString()+" | "+ new Date().toLocaleDateString()
    setTimeout("timer()",1000)
    
}
document.getElementsByClassName("copy-btn")[0].addEventListener('click', (e) => {
    var text = window.location.href;
    navigator.clipboard.writeText(text).then(function() {
    console.log('Async: Copying to clipboard was successful!');
    }, function(err) {
    console.error('Async: Could not copy text: ', err);
});
})


/////////////////////////////////////////////////////////////////////////////
/*
function signIn() {
    // Sign into Firebase using popup auth & Google as the identity provider.
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
  }
  
  // Signs-out of Friendly Chat.
  function signOut() {
    // Sign out of Firebase.
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
  
  // Saves a new message on the Firebase DB.
  // Saves a new message to your Cloud Firestore database.
  function saveMessage(messageText) {
    // Add a new message entry to the database.
    return firebase.firestore().collection('messages').add({
      name: getUserName(),
      text: messageText,
      profilePicUrl: getProfilePicUrl(),
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function(error) {
      console.error('Error writing new message to database', error);
    });
  }
  
  // Loads chat messages history and listens for upcoming ones.
  function loadMessages() {
    // Create the query to load the last 12 messages and listen for new ones.
    var query = firebase.firestore()
                    .collection('messages')
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
                         message.text, message.profilePicUrl, message.imageUrl);
        }
      });
    });
  }
  
  // Saves a new message containing an image in Firebase.
  // This first saves the image in Firebase storage.
  function saveImageMessage(file) {
    // 1 - We add a message with a loading icon that will get updated with the shared image.
    firebase.firestore().collection('messages').add({
      name: getUserName(),
      imageUrl: LOADING_IMAGE_URL,
      profilePicUrl: getProfilePicUrl(),
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
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
            .set({uid: firebase.auth().currentUser.uid});
      } else {
        // Need to request permissions to show notifications.
        requestNotificationsPermissions();
      }
    }).catch(function(error){
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
      saveImageMessage(file);
    }
  }
  
  // Triggered when the send new message form is submitted.
  function onMessageFormSubmit(e) {
    e.preventDefault();
    // Check that the user entered a message and is signed in.
    if (messageInputElement.value && checkSignedInWithMessage()) {
      saveMessage(messageInputElement.value).then(function() {
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
    // https://stackoverflow.com/a/47781432/4816918
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
  function displayMessage(id, timestamp, name, text, picUrl, imageUrl) {
    var div = document.getElementById(id) || createAndInsertMessage(id, timestamp);
  
    // profile picture
    if (picUrl) {
      div.querySelector('.pic').style.backgroundImage = 'url(' + addSizeToGoogleProfilePic(picUrl) + ')';
    }
  
    div.querySelector('.name').textContent = name;
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
      image.src = imageUrl + '&' + new Date().getTime();
      messageElement.innerHTML = '';
      messageElement.appendChild(image);
    }
    // Show the card fading-in and scroll to view the new message.
    setTimeout(function() {div.classList.add('visible')}, 1);
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
  
  // Checks that the Firebase SDK has been correctly setup and configured.
  function checkSetup() {
    if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
      window.alert('You have not configured and imported the Firebase SDK. ' +
          'Make sure you go through the codelab setup instructions and make ' +
          'sure you are running the codelab using `firebase serve`');
    }
  }
  
  // Checks that Firebase has been imported.
  checkSetup();
  
  // Shortcuts to DOM Elements.
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
  loadMessages();
  */