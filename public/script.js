const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {

    path: '/peerjs',
    host: '/',
    port: '443'
})
let temp;
let myVideoStream;
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
        });


    });
    document.getElementById("shareScreen").addEventListener('click', (e) => {
        let enabled = document.getElementById("shareScreen").classList.contains("active-btn");
        if (enabled) {
            shareUnshare();
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
                 // myScreenStream = stream;
                shareUnshare();
                let videoTrack = stream.getVideoTracks()[0];
                videoTrack.onended = function () {
                     document.getElementById("shareScreen").classList.remove("active-btn");
                    shareUnshare();
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
    console.log("I am ");
    console.log(temp);
    console.log("calling ");
    console.log(userId);
    const conn = myPeer.connect(userId, {
        metadata: {
            uniId: temp
        }
    });
    const call = myPeer.call(userId, stream)
    var video = document.createElement('video')
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream, userId)
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
    videoGrid.append(video)

}




const scrollToBottom = () => {
    var d = $('.main__chat_window');
    d.scrollTop(d.prop("scrollHeight"));
}

const shareUnshare = () => {
    let enabled = document.getElementById("shareScreen").classList.contains("active-btn");
    if (enabled) {
        //myScreenStream.getVideoTracks()[0].enabled = false;
        document.querySelector('.main__screen_button').innerHTML = `<i class="fas fa-arrow-alt-circle-up"></i>`
        document.querySelector('.main__screen_button').setAttribute("title", "Present Screen")
        document.getElementById("shareScreen").classList.remove("active-btn");
    } else {
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
        
    } else {
        document.querySelector('.main__mute_button').innerHTML =  `<i class="fas fa-microphone"></i>`
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
}

const playStop = () => {

    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        document.querySelector('.main__video_button').innerHTML = `<i class="stop fas fa-video-slash"></i>`
    } else {
        document.querySelector('.main__video_button').innerHTML=`<i class="fas fa-video"></i>`
        myVideoStream.getVideoTracks()[0].enabled = true;
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