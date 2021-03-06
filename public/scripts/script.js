//This is the client side of the videoCall Room
const socket = io('/')
const videoGrid = document.getElementById('video-grid')
var myName, myVideoStream, screenStream, activeSreen = "";
const myVideo = document.createElement('video')
myVideo.muted = true;
const peers = {} //Save all peer connections
const peerscall = {} //Save all peer Calls

//detects if the user is authenticated
firebase.auth().onAuthStateChanged(function(user) {

    if (user) {
        myName = getUserName();
        $("#users").append(`<li c><b>` + myName + `</b><br/></li>`);
        socket.emit('participant', myName)
    } else
        location.href = "/" + ROOM_ID; //redirects unauthenticated users to the chat-room 

})

const myPeer = new Peer(undefined, {

    path: '/peerjs',
    host: '/',
    port: '443'

})

//adds new video element to your page
function addVideoStream(video, stream, userId) {

    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    video.id = userId
    videoGrid.append(video)

}

//call a peer with their userId
function connectToNewUser(userId, stream) {

    const conn = myPeer.connect(userId); //establish a peer connection with the other user
    const call = myPeer.call(userId, stream) //establish a call connection with other user
    var video = document.createElement('video')
    peerscall[userId] = call;
    peers[userId] = conn;
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream, userId) // add other user's video on your page
        socket.emit('participant', myName);
        changeGridSize(peerscall)

    })

    //Triggered when other user is disconnected
    conn.on('close', () => {
        handlePeerDisconnect(video);
        conn.close();
        delete peers[userId]
        delete peerscall[userId]
        changeGridSize(peerscall);
    });

}


function changeGridSize(peerscall) {
    let peer = [];
    peer.push("self");
    for (let key in peerscall) {
        console.log(key);
        peer.push(key);
    }
    var frac = (document.querySelector(".main__left").classList.contains("screen-full")?0.8:0.6);
    let width = frac * window.innerWidth
    let height = 0.85 * window.innerHeight
    let len = peer.length;
    let s = Math.ceil(Math.sqrt(len));
    let width1 = Math.floor(width / s);
    width1 = width1.toString();
    width1 = width1 + "px";
    let height1 = Math.ceil(height / (Math.floor(((len - 1) / s + 1))));
    height1 = height1.toString();
    height1 = height1 + "px";
    for (let i = 0; i < len; i++) {
        document.getElementById(peer[i]).style.width = width1;
        document.getElementById(peer[i]).style.height = height1;
    }
}


function timer() {

    document.getElementById("time").innerHTML = new Date().toLocaleTimeString() + " | " + new Date().toLocaleDateString()
    setTimeout("timer()", 1000)

}

//disable or enable sending user's audio to other users
function muteUnmute() {

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

//disable or enable sending user's video to other users
function playStop() {

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

//changes only the html and css of shareScreen button
function shareUnshare() {

    let enabled = document.getElementById("shareScreen").classList.contains("active-btn");
    if (enabled) {

        document.querySelector('.main__screen_button').innerHTML = `<i class="fas fa-arrow-alt-circle-up"></i>`
        document.querySelector('.main__screen_button').setAttribute("title", "Present Screen")
        document.getElementById("shareScreen").classList.remove("active-btn");
        document.getElementById("screenShareReminder").classList.add("screen-hide");

    } else {
        document.getElementById("screenShareReminder").classList.remove("screen-hide");
        document.querySelector('.main__screen_button').innerHTML = `<i class="fas fa-arrow-circle-down"></i>`
        document.querySelector('.main__screen_button').setAttribute("title", "Stop Presenting");
        document.getElementById("shareScreen").classList.add("active-btn");
    }

}

//Replaces Screen stream with user video stream
function stopScreenShare() {

    var tracks = screenStream.getTracks();
    tracks.forEach(function(track) {
        track.stop();
    });
    let videoTrack = myVideoStream.getVideoTracks()[0];
    Object.keys(peerscall).forEach(function(x) {
        let sender = peerscall[x].peerConnection.getSenders().find(function(s) {
            return s.track.kind == videoTrack.kind;
        })
        sender.replaceTrack(videoTrack);
    })

}

//disable all audio on page
function incomingAudio() {

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

}

//stops incoming stream of a particular video
function stopStreamedVideo(videoElem) {

    const stream = videoElem.srcObject;
    const tracks = stream.getVideoTracks();

    tracks.forEach(function(track) {
        track.enabled = false;
    });
    videoElem.classList.add("invisible")

}

//resumes incoming stream of a particular video
function playStreamedVideo(videoElem) {

    const stream = videoElem.srcObject;
    const tracks = stream.getVideoTracks();

    tracks.forEach(function(track) {
        track.enabled = true;

    });
    videoElem.classList.remove("invisible")

}

// stop or resume incoming video from every user
function incomingVideo() {

    let enabled = document.getElementById("incVideo").classList.contains("active-btn");
    if (enabled) {
        document.getElementById("incVideo").classList.remove("active-btn");
        document.getElementById("incVideo").innerHTML = `<i class="fas fa-video-slash"></i>Stop Incoming Video`
        var elems = document.querySelectorAll("video");
        [].forEach.call(elems, function(elem) {

            if (elem.id != "self") {
                playStreamedVideo(elem);
            }

        })

    } else {
        document.getElementById("incVideo").classList.add("active-btn");
        document.getElementById("incVideo").innerHTML = `<i class="fas fa-video"></i>Play Incoming Video`
        var elems = document.querySelectorAll("video");
        [].forEach.call(elems, function(elem) {
            if (elem.id != "self") {
                stopStreamedVideo(elem);
            }
        });
    }

}

// when another user disconnects, remove their video
function handlePeerDisconnect(video) {

    video.srcObject = null;
    console.log("left " + video.id);
    video.remove();
    //changeGridSize(peerscall);
}

// redirect you to homepage after leaving videoCall room
function leaveMeeting() {

    location.href = "/";
}

//copies the room link to clipboard
function copyJoiningInfo() {

    var text = window.location.href;
    let len = text.length;
    text = text.substr(0, len - 10);
    text
    navigator.clipboard.writeText(text).then(function() {
        console.log('Async: Copying to clipboard was successful!');
        var data = {
            message: 'Joining info copied to clipboard',
            timeout: 2000
        };
        var copySnackbarElement = document.getElementById("copy-snackbar")
        copySnackbarElement.MaterialSnackbar.showSnackbar(data);
    }, function(err) {
        console.error('Async: Could not copy text: ', err);
    });

}

const isHidden = (screen) => screen.classList.contains("screen-hide");

//change css of button class
function handleActive(buttonClass) {

    const button = document.querySelector(`.${buttonClass}`);
    const active = button.classList.contains("active-btn");

    if (active) button.classList.remove("active-btn");
    else button.classList.add("active-btn");

};

//hide or show chatScreen/Participants list
function handleScreen(screen) {

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
    changeGridSize(peerscall);
};
//display current date and time
timer();

//connnecting to other  existing users in videoCall room
navigator.mediaDevices.getUserMedia({ //get user media
    video: true,
    audio: true
}).then(stream => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream, "self") //add user's local video stream on page
    changeGridSize(peerscall);
    socket.emit('participant', myName);
    //answer to peer connection established by another users 
    myPeer.on('connection', function(conn) {
        var uniId = conn.peer
        peers[uniId] = conn;
        //if any other user leaves the videoCall Room
        conn.on('close', () => {

            handlePeerDisconnect(document.getElementById(uniId));
            delete peers[uniId];
            delete peerscall[uniId];
            changeGridSize(peerscall)

        })

    });

    myPeer.on('call', call => {
        peerscall[call.peer] = call;
        //answer to peer call established by another users with user's local video stream
        call.answer(stream)
        var video = document.createElement('video')
        call.on('stream', userVideoStream => {
            //add other user's video, in user's own page
            addVideoStream(video, userVideoStream, call.peer)
            socket.emit('participant', myName);
            changeGridSize(peerscall)

        });

    });

    document.getElementById("shareScreen").addEventListener('click', () => {
        let enabled = document.getElementById("shareScreen").classList.contains("active-btn");
        if (enabled) {

            shareUnshare();
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
                //executed when screen is stopped by closing the window/ tab directly etc
                videoTrack.onended = function() {

                    shareUnshare();
                    stopScreenShare();
                }
                //replace user video stream with user screen stream
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

    //when a new user is connected to room
    socket.on('user-connected', userId => {
        connectToNewUser(userId, stream)
    })

})

// We load currently existing chat messages and listen to new ones.
loadMessages(ROOM_ID);
myPeer.on('open', id => {
    // on joining room, user sends its peer id to server to connect with other users
    socket.emit('join-room', ROOM_ID, id)
})


document.getElementById("incAudio").addEventListener('click', incomingAudio)
document.getElementById("incVideo").addEventListener('click', incomingVideo)
document.getElementsByClassName("copy-btn")[0].addEventListener('click', copyJoiningInfo)

//listen to update on participant list on server side 
socket.on('add-participant-list', (participants) => {

    //update participant list on client side
    console.log("2 thing done" + participants.length)
    $("#users").empty()
    Object.keys(participants).forEach(function(x) {

        $("#users").append(`<li c><b>` + participants[x] + `</b><br/></li>`);
    })

})

// When user sends a  message in chat
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

//listen to server in case any other user in room gets disconnected
socket.on('user-disconnected', userId => {

    var video = document.getElementById(userId);
    if (video) {
        handlePeerDisconnect(video);
        delete peers[userId];
        delete peerscall[userId]
    }
    changeGridSize(peerscall);
})