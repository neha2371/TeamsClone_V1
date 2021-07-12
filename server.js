
// var admin = require('firebase-admin');
// admin.initializeApp({
//     credential: admin.credential.applicationDefault(),
//     databaseURL: 'https://teamsclone-d6c8b.firebaseio.com'
// });
// const defaultApp = admin.initializeApp(defaultAppConfig);

// console.log(defaultApp.name);

const express = require('express')
const app = express()

const server = require('http').Server(app)
const io = require('socket.io')(server)
const {
    ExpressPeerServer
} = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug: true
});
const {
    v4: uuidV4
} = require('uuid')

app.use('/peerjs', peerServer);
app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.redirect(`/${uuidV4()}`)

})

app.get('/:homepage', (req, res) => {
    var roomId = req.params.homepage;
    res.render('homepage', {
        roomId
    })
})
app.get('/:room/videocall', (req, res) => {
    var roomId = req.params.room;
    console.log(roomId);
    res.render('videoCallRoom', {
        roomId
    })
})
const participants = {};
io.on('connection', socket => {

    socket.on('join-room', (roomId, userId) => {

        socket.join(roomId)
        socket.broadcast.to(roomId).emit('user-connected', userId);
        socket.on('participant', (userName) => {
            console.log("1 thing done")
            participants[userId] = userName;
            io.emit('add-participant-list', participants);
        })
        // socket.on('message', (message) => {
            
        //     socket.broadcast.to(roomId).emit('createMessage', message)
        // });

        socket.on('disconnect', () => {
            delete participants[userId];
            io.emit('add-participant-list', participants);
            socket.to(roomId).emit('user-disconnected', userId)
        })
    })
})

server.listen(process.env.PORT || 3030)