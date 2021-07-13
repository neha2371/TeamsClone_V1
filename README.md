# Microsoft Teams Clone
 Use this web-app by [clicking here](https://microsoftteams2.herokuapp.com/)
## Abstract:
Videotelephony, sometimes also referred to as video teleconference or video-call comprises the technologies for the reception and transmission of audio-video signals by users in different geographical locations, for communication between people in real time. My project is a user-friendly, simple web based application that allows users to create rooms where two or more users can connect over video call and chat.

## Introduction:
Recently there has been a great upsurge in the demand for video conferencing platforms due to the Covid-19 Global Pandemic.  The goal of my project is to build an online video chatting tool that enables users to join real-time streaming video chat rooms where users can share their video with multiple users. Users can send instant messages- before, during and after the video call and can be accessed any time in future. The web app is user friendly with a simple UI and a lot other features.

## Problem Statement:
“Build a Microsoft Teams clone”
Solution should be a fully functional prototype with at least one mandatory functionality - a minimum of two participants should be able connect with each other using your product to have a video conversation.

## KeyWords:
Room - A central place where people can chat, call and stay connected with each  other.
Room ID – Every room is identified with its own unique id which will be referred as Room ID.
Further there are two divisions in every room-
    1) Chat Room – This enables the participants of every room to communicate with each other through text messages and images.
    2) Video Call Room  – Using this, the users can connect with each other through videocall as well as chat.
NOTE – both these division exist in the same room and therefore have the same Room ID.

# Basic Workflow

![Workflow](/images/Workflow.png)

# Software Architecture
## Getting started: Accessing the Home Page
**Create a new room**
When a  new room is created, a unique Room ID is generated using UUID and user is directed to a Chat Room with this Room ID..
**Join an existing room**
When a user joins the meeting through a shared link of the room, they are directed to the same Chat Room.
Express is used to read the GET requests made to the server.

## Authentication
Even after accessing the chat Room, the user cannot use any of the functionalities or even read the Chat messages until authentication is done. 
This ensures no unauthorized user can read the messages.
Authentication is done using Google ID and the implementation is done using FirebaseUI.

![Authorization](/images/Authorization.png)


## Chat
### 1) Authorization
 As the user logs in, all the messages stored in the FireStore Database, mapping to the given Room ID are loaded and become visible to the user.
### 2) Instant Messaging
 When a non-empty message is sent by the user then text is stored as data along with information such as user google ID, profile picture and timestamp mapped to the given Room ID.
 As soon as an addition is made to the Database, every other participant in the room can also see the change in their respective windows along with who sent the message and when.
### 3) Accessibility
 Since, the messages are stored in a database, they can be accessed anytime in future. Moreover, all the messages in  a particular room are mapped to a single Room ID. 
 This implies if a user sends a message in Chat Room, it will also be displayed in chat-box of Video Call Room and vice-versa. Therefore, your in-call messages are never lost.
### 4) Supported formats
 Chat feature supports texts and images allowing the users to express themselves in an easier and more expressive manner.

## Video Call Room
 Following features are supported for the user during the video call
 * Connect to two or more people through video call.
 * Dynamic Video Resizing depending on the number of participants to give user a good experience.
 * Disable audio or video from the sending end.
 * Live stream entire screen or a particular window or tab.
 * Stop receiving the incoming video from all other users.
 * Disable all the audio coming from all other users.
 * Copy Joining Info
 * Instant Messaging with other users along with all the features mentioned earlier in the document.
 * Participants List: A user can anytime find out the name of all the people who are connected in videocall by simply clicking on this feature.
 * Get redirected to the Home Page on leaving the room.

![connection](/images/connection.png)


# Agile Methodology Implementation
## Project Management:
   Trello, GitHub
## Dependencies:
   PeerJS, Socket.io , FirebaseUIAuth, Firestore Database
## Deployment:
   Heroku
   
# References
   * [Clever Programmers Zoom Clone](https://github.com/CleverProgrammers/nodejs-zoom-clone)
   * [Socket.io](https://socket.io/docs/v4/index.html)
   * [peerjs](https://peerjs.com/docs.html)
   * [Firebase UIAuth](https://firebase.google.com/docs/auth)
   * [Firestore Chat](https://firebase.google.com/codelabs/firebase-web)
