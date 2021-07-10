const socket = io('/')
const videoGrid = document.getElementById('video-grid')
let myName
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
      console.log(getUserName() + " logged in")
    myName = getUserName();
    socket.emit('participant', myName);
    $("#users").append(`<li c><b>`+myName+`</b><br/></li>`);
  }
})   
//  if(!isUserSignedIn())
//  {
//    signIn();
//  }
//  firebase.auth().onAuthStateChanged((user) => {
//    if(user)
//    {
//     initFirebaseAuth();     
//    }
//  })
// initialize Firebase

//firebase.performance();
//  $( document ).ready(function() {
//         console.log( "testing.." );
//         var user = firebase.auth().currentUser;
//         console.log(user);
//     });
// while(!firebase.auth().currentUser)
// {
  
// }
// void AuthStateChanged(object sender, System.EventArgs eventArgs) {
//   if (auth.CurrentUser != user) {
//     bool signedIn = user != auth.CurrentUser && auth.CurrentUser != null;
//     if (!signedIn && user != null) {
//       Debug.Log("Signed out " + user.UserId);
//     }
//     user = auth.CurrentUser;
//     if (signedIn) {
//       Debug.Log("Signed in " + user.UserId);
//     }
//   }
// })
//myName = getUserName();

const myPeer = new Peer(undefined, {

    path: '/peerjs',
    host: '/',
    port: '443'
})
timer();
let temp;
let myVideoStream;
let screenStream;
console.log(myName + " did it!!");
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
  // if (isUserSignedIn())
  // {
  //   myName = getUserName();
  //   console.log(myName);
  //   }
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
            
        });
        
    });

    document.getElementById("shareScreen").addEventListener('click', (e) => {
        let enabled = document.getElementById("shareScreen").classList.contains("active-btn");
      if (enabled) {
          
            shareUnshare();
            stopStreamedVideo()
            stopScreenShare();
        } else {
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
                videoTrack.onended = function() {
                       if (stream.readyState != "ended")
                        stream.readyState = "ended";

                    shareUnshare();
                    stopStreamedVideo();
                    stopScreenShare();

                }
                Object.keys(peerscall).forEach(function(x) {
                    let sender = peerscall[x].peerConnection.getSenders().find(function(s) {
                        return s.track.kind == videoTrack.kind;
                    })
                    sender.replaceTrack(videoTrack);
                })
            }).catch((err) => {
                console.log("unable to get display media" + err)
            })

        }

    });
    document.getElementById("altStop").addEventListener('click', (e) => {
        shareUnshare();
        stopScreenShare();
    })
    socket.on('user-connected', userId => {
        connectToNewUser(userId, stream)
    })


   
})
messageFormElement.addEventListener('submit', onMessageFormSubmit);

// Toggle for the button.
messageInputElement.addEventListener('keyup', toggleButton);
messageInputElement.addEventListener('change', toggleButton);

// Events for image upload.
imageButtonElement.addEventListener('click', function(e) {
  e.preventDefault();
  mediaCaptureElement.click();
});
mediaCaptureElement.addEventListener('change', onMediaFileSelected);



// We load currently existing chat messages and listen to new ones.
loadMessages(ROOM_ID);

socket.on('add-participant-list', participants => {
  for(parName in participants)
  {
    console.log(parName + "is in the meeting")
    $("#users").append(`<li c><b>`+parName+`</b><br/></li>`);
  }
})
socket.on('add-participant', userName => {
  $("#users").append(`<li c><b>`+userName+`</b><br/></li>`);
})
  
socket.on('user-disconnected', userId => {
    var video = document.getElementById(userId);
    if (video) {
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
    
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    video.id = userId
  //  video.addClass = "otherVideos"
    videoGrid.append(video)
}




const scrollToBottom = () => {
    var d = $('.main__chat_window');
    d.scrollTop(d.prop("scrollHeight"));
}
document.getElementById("incAudio").addEventListener('click', () => {
    let enabled = document.getElementById("incAudio").classList.contains("active-btn")
    if (enabled) {
        document.getElementById("incAudio").classList.remove("active-btn")
        document.getElementById("incAudio").innerHTML = `<i class="fas fa-volume-mute"></i> Stop Incoming Audio`
        var elems = document.querySelectorAll("video, audio");

        [].forEach.call(elems, function(elem) {
            if (elem.id != "self")
                elem.muted = false;
        });
    } else {
        document.getElementById("incAudio").classList.add("active-btn")
        document.getElementById("incAudio").innerHTML = `<i class="fas fa-volume-up"></i> Play Incoming audio`
        var elems = document.querySelectorAll("video, audio");

        [].forEach.call(elems, function(elem) {
            elem.muted = true;
        });
    }
})
document.getElementById("incVideo").addEventListener('click', function() {
    let enabled = document.getElementById("incVideo").classList.contains("active-btn");
    if (enabled) {
        console.log("I was triggered too")
        document.getElementById("incVideo").classList.remove("active-btn");
        document.getElementById("incVideo").innerHTML = `<i class="fas fa-video-slash"></i>Stop Incoming Video`
        // for(let x in peerscall) {
        //    console.log(x);
        // //    console.log(peerscall[x]);
        // //   peerscall[x].stream.getVideoTracks()[0].enabled = true;
        // }

        var elems = document.querySelectorAll("video");
        [].forEach.call(elems, function(elem) {

            if (elem.id != "self") {
                playStreamedVideo(elem);
            }
            //
        })

    } else {
        document.getElementById("incVideo").classList.add("active-btn");
        document.getElementById("incVideo").innerHTML = `<i class="fas fa-video"></i>Play Incoming Video`
        /*for(let x in peerscall) {
           peerscall[x].stream.getVideoTracks()[0].enabled = false;
        }*/
        // Object.keys(peerscall).forEach(function(x) {
        //    peerscall[x].stream.getVideoTracks()[0].enabled = false;
        // })
        var elems = document.querySelectorAll("video");
        [].forEach.call(elems, function(elem) {

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
        track.enabled = false;
    });
    videoElem.classList.add("invisible")

}

function playStreamedVideo(videoElem) {
    const stream = videoElem.srcObject;
    const tracks = stream.getVideoTracks();

    tracks.forEach(function(track) {
        track.enabled = true;

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
        document.querySelector('.main__mute_button').innerHTML = `<i class="fas fa-microphone"></i>`
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
        document.querySelector('.main__video_button').innerHTML = `<i class="fas fa-video"></i>`
        myVideoStream.getVideoTracks()[0].enabled = true;
        document.querySelector('.main__video_button').setAttribute("title", "Stop Video");
    }
}

function leaveMeeting(){

    location.href = "/"+ROOM_ID;
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
function copyJoiningInfo() {
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

function timer() {
    document.getElementById("time").innerHTML = new Date().toLocaleTimeString() + " | " + new Date().toLocaleDateString()
    setTimeout("timer()", 1000)

}
document.getElementsByClassName("copy-btn")[0].addEventListener('click', copyJoiningInfo)
