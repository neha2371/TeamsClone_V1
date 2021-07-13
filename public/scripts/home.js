function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

function createRoom() {
    ROOM_ID = makeid(10);
    console.log(ROOM_ID);
    window.location.href = "/" + ROOM_ID;
}

function enterRoom(e) {
    e.preventDefault();
    console.log("Room Id: " + roomInputElement.value)
    if (roomInputElement.value) {
        var str = roomInputElement.value.split("/");
        roomInputElement.value = null;
        window.location.href = "/" + str[str.length - 1];
    }
}

var roomInputElement = document.getElementById("roomIdInput");
document.getElementById('create').addEventListener('click', createRoom);
document.getElementById('enter').addEventListener('click', enterRoom);
roomInputElement.addEventListener("keyup", function(event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        document.getElementById("enter").click();
    }
});