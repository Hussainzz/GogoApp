require("dotenv").config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
var cookieParser = require('cookie-parser')
const path = require('path');
const app = express();

/* app.use(cors({credentials:true, origin:[process.env.CLIENT_BASE_URL]}));
app.options('*', cors()); */

app.use(cors());

app.use(cookieParser())

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const RoomsRoutes = require('./routes/rooms');
const NotificationRoutes = require('./routes/notifications');
const { addOnlineUser,deleteOnlineUserBySocketId } = require("./controllers/users");
const { createRoomDataCache,getRoomDataFromRedis,deleteUserFromRoom, createRoomDiscussion } = require("./controllers/rooms");
const { moveDiscussionsToDBJob,postScheduledAnnouncementsJob } = require("./crons/CronJobs");


app.use(express.json());

/* const whitelist = ['*']
const corsOptions = {
  origin: (origin, callback) => {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error())
    }
  }
} */

app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/rooms', RoomsRoutes);
app.use('/api/notifications', NotificationRoutes);

console.log(process.env.NODE_ENV);
if(process.env.NODE_ENV === 'production'){
    app.use(express.static('client/build'));

    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
    });
}else{

    app.get('/', (req, res) =>{
        res.send('GoGo Api is running');
    });
}

app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    err.message = err.message || 'Something went wrong!';
    console.log(err);
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
});

connectDB(() => {
    var server = app.listen(process.env.PORT || 7000,() => {
        console.log(`Server Running at ${process.env.PORT || 7000}`)
    })

    const io = require('socket.io')(server,{
      transports: ['websocket', 'polling', 'flashsocket'],
      /* cors:{
          origin: process.env.CLIENT_BASE_URL,
          methods: ['GET', 'POST']
      } */
        cors: {
            origin: '*',
        }
    })

    const roomSocket = io.of("/rooms");
    const confRoomSocket = io.of("/gogo-conf-room");

    app.set('socketio', io);
    app.set('roomSocket', roomSocket);
    app.set('confRoomSocket', confRoomSocket);

    
    io.on('connection', socket => {
      console.log(`connected ${socket}`)

      socket.on('addOnlineUser',(data)=>{
          console.log(data);
          addOnlineUser(data.userId,socket.id)
      })
      
      socket.on("disconnect", () => {
        deleteOnlineUserBySocketId(socket.id);
        console.log('disconnected'); 
      })
    })


    //roomSocket
    roomSocket.on('connection', socket => {
        console.log(`connected to room socket ${socket.id}`)
    
        socket.on("join-room", async (roomData,cb)=>{
            const newRoomUser = await createRoomDataCache(roomData,socket.id);
            if(newRoomUser){
            socket.join(roomData.room);
            try {
                const roomInfo = await getRoomDataFromRedis(roomData.room)
                const currentParticipants = JSON.parse(roomInfo).joinedUsers.length;
                
                if(currentParticipants > process.env.PARTICIPANT_LIMIT){
                    socket.emit('room-full', 'room is full')
                }else{

                    roomSocket.to(roomData.room).emit('room-info', roomInfo)
                    roomSocket.to(socket.id).emit('fetch-announcements', roomInfo)
                    socket.emit('room-discussion-info', 'get')
    
                    roomSocket.in(roomData.room).emit('room-active','active');
                    socket.to(roomData.room).emit('user-joined-room',newRoomUser)
                }          
    
                cb('success');
            } catch (error) {
                console.log(error);
                cb('failed')
            }
            
            }else{
            cb('failed')
            }
        });

        socket.on('leaveRoom',()=>{
            socket.disconnect();
        });


        socket.on('new-discussion-message', async(roomToken,message,userData) => {
            console.log(message);
            
            const newMessage = await createRoomDiscussion(roomToken,message,userData);
            if(newMessage){
                roomSocket.in(roomToken).emit('receive-new-discussion-message',newMessage)
                socket.to(roomToken).emit('new-message','new-discussion-message');
            }
        });
    
        socket.on('disconnecting', async () => {
            const currentRooms = Array.from(socket.rooms);
            if(currentRooms[1] != null){
            console.log('room disconnecting')
            const remainingUsers = await deleteUserFromRoom(currentRooms[0], currentRooms[1])
            roomSocket.in(currentRooms[1]).emit('room-info', JSON.stringify(remainingUsers))
            }
            
        });
        socket.on("disconnect", () => {
            console.log('room disconnect')
            socket.broadcast.emit('user-left',socket.id)
        })
    
    });

   


    //confRoomSocket
    confRoomSocket.on('connection', socket => {
      console.log(`connected to gogo room socket ${socket.id}`)

      socket.on("join-room", async (roomData,cb)=>{
        const newRoomUser = await createRoomDataCache(roomData,socket.id);
            if(newRoomUser){
                socket.join(roomData.room);
                try {
                    const roomInfo = await getRoomDataFromRedis(roomData.room)
                    const currentParticipants = JSON.parse(roomInfo).joinedUsers.length;
                    
                    if(currentParticipants > process.env.PARTICIPANT_LIMIT){
                        socket.emit('room-full', 'room is full')
                    }else{
                        confRoomSocket.in(roomData.room).emit('room-info', roomInfo)
                        confRoomSocket.in(roomData.room).emit('room-active','active');
                    }           

                    cb('success');
                } catch (error) {
                    console.log(error);
                    cb('failed')
                }
            
            }else{
            cb('failed')
            }
        });



        socket.on("sending-signal", payload => {
        // console.log(payload);
        socket.to(payload.userToSignal).emit('user-joined', { signal: payload.signal, callerID: payload.callerID, name:payload.name });
        });

        socket.on("returning-signal", payload => {
        console.log("returning-signal");
        console.log(payload);
        socket.to(payload.callerID).emit('receiving-returned-signal', { signal: payload.signal, id: socket.id });
        });

        socket.on('disconnecting', async () => {
        const currentRooms = Array.from(socket.rooms);
        if(currentRooms[1] != null){
            console.log('room disconnecting')
            const remainingUsers = await deleteUserFromRoom(currentRooms[0], currentRooms[1])
            confRoomSocket.in(currentRooms[1]).emit('room-info', JSON.stringify(remainingUsers))
        }
        
        });
        socket.on("disconnect", () => {
            console.log('room disconnect')
            socket.broadcast.emit('user-left',socket.id)
        })

        socket.on('change', (payload) => {
            socket.broadcast.emit('change',payload)
        });

    });

    //start cron job
    moveDiscussionsToDBJob.start();
    postScheduledAnnouncementsJob.start();
});



