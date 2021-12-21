const mongoose = require('mongoose');
const bodyParser = require('body-parser')
const config = require('config');
const express = require('express')
const app = express()
const server = require('http').Server(app);
const io = require('socket.io')(server);
const {v4: uuidv4} = require('uuid');
const session = require('express-session');
const flash = require('express-flash-messages')
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug: true
})

const auth = require('./routes/auth');
const user = require('./routes/users');
const search = require('./routes/search');
const friends = require('./routes/friends');
const authentication = require('./middleware/auth');

if(!config.get('jwtprivateket')) {
    console.log("NOdefine jwtprivateket");
    process.exit();
}

app.use(flash());
app.use(
    session({
        secret: "developer secret",
        resave: false,
        saveUninitialized: false,
    })
);

// Here we set the engine EJS template
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/peerjs', peerServer);

// Create connection with mongoose DB
mongoose.connect('mongodb://localhost/chat')
.then(() => console.log("Database connected"))
.catch(error => console.log("Database connected", error));
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.json());


// APIs
app.use('/api/auth', auth);
app.use('/api/register', user);
app.use('/api/search', search);
app.use('/friends', friends);



// View login Form
app.get('/', (req, res) => {
    if(!req.session.token) {
        res.render('login') // Here render template
    } else {
        res.redirect('/chat');
    }
})

// View Register Form
app.get('/register', (req, res) => {
    if(!req.session.token) {
        res.render('register') // Here render template
    } else {
        res.redirect('/chat');
    }
})

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
})

// Start create connection for chatting
app.get('/chat/', authentication, (req, res) => {
    res.render('chat', {roomId: req.user._id}) // Here render template
    // res.render('room') // Here render template
})

// Start create connection for chatting
app.get('/confrence/', authentication, (req, res) => {
    res.redirect(`/confrence/${uuidv4()}`);
    // res.render('room') // Here render template
})

app.get('/confrence/:room', authentication, (req, res) =>  {
    res.render('room', {roomId: req.params.room, loginname: req.user.name}) // Here render template
})

io.on('connection', socket => {
    // Room Chat 
    socket.loginname = socket.handshake.query.loginname;
    socket.on('confrence-join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.broadcast.to(roomId).emit('confrence-user-connected', userId);
        socket.broadcast.to(roomId).emit('confrence-user-connected-shared', userId);

        //receive message
        socket.on('confrence-message', message => {
            io.to(roomId).emit('confrence-createMessage', message, socket.loginname);
        })
    })
    
    // Send text messages and Audio Call and Video Call and List User and calls one to one user.
    socket.user = socket.handshake.query.name;
    if(socket.user) {
        console.log(socket.user, "Connected");
        socket.join(socket.user);
    }
    // For Send text message
    socket.on('new-user', data => {
        console.log("Received Send "+data);
        socket.to(data.user_id).emit('user-connecteds', {message: data.message, user_id: data.user_id });
    })
    socket.on('send-chat-message', data => {
        console.log("Message Send "+data);
        socket.to(data.user_id).emit('chat-message', {message: data.message, user_id: data.user_id });
    })
    socket.on('disconnect', function(){
        // remove saved socket from users object
        if(socket.loginname)
            delete socket.loginname;
        if(socket.user)
            delete socket.user;
    });

    // For call
    socket.on('call', (data) => {
        let callee = data.name;
        let isCallType = data.isCallType;
        let rtcMessage = data.rtcMessage;

        socket.to(callee).emit("newCall", {
            caller: socket.user,
            rtcMessage: rtcMessage,
            isCallType: isCallType
        })

    })

    socket.on('answerCall', (data) => {
        let caller = data.caller;
        rtcMessage = data.rtcMessage
        isCallType = data.isCallType

        socket.to(caller).emit("callAnswered", {
            callee: socket.user,
            rtcMessage: rtcMessage,
            isCallType: isCallType
        })

    })

    socket.on('ICEcandidate', (data) => {
        let otherUser = data.user;
        let rtcMessage = data.rtcMessage;
        let isCallType = data.isCallType;

        socket.to(otherUser).emit("ICEcandidate", {
            sender: socket.user,
            rtcMessage: rtcMessage,
            isCallType: isCallType
        })
    })
})
// End create connection for chatting

// Created the server
server.listen(3000)
