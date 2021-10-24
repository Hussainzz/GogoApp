const express = require('express');
const router = express.Router();
const moment = require('moment');
const multer = require('multer');
const  randomstring = require("randomstring");
const verifyToken = require('../middleware/verifyToken');
const User = require('../models/User');
const Room = require('../models/Room');
const Announcement = require('../models/Announcement');

/* const {promisify} = require('util'); */
const {createRoomValidation,createDiscussionValidation,getDiscussionValidation,createAnnouncementCommentValidation} = require('../validations');
const { inviteRoomParticipantsAndNotify,
    getUserRooms,
    createRoomDiscussion,
    getRoomDiscussionFromRedis, 
    getRoomByToken,
    getUserRoomInvitations,
    enrollToPrivateRoom,
    getUserEnrolledRooms,
    createAnnouncement,
    getRoomAnnouncements,
    getRoomAnnouncementsPaginate,
    createAnnouncementComment,
    getRoomAnnouncementsFromDB,
    deleteRoomById
} = require('../controllers/rooms');
const Redis = require('../helpers/Redis');
const { createNotification } = require('../controllers/notification');

//store files
const discussionFileStorage = multer.diskStorage({
    destination:(req, file, cb)=>{
      cb(null,'uploads/discussions')
    }, 
    filename:(req, file, cb)=>{
      cb(null, new Date().getTime().toString()+'-'+file.originalname)
    }
});

//filtering incoming attachments
const discussionFileFilter = (req, file, cb) => {
    console.log(file);
    if(file.mimetype === 'application/pdf' || file.mimetype === 'text/plain' || file.mimetype ==='image/png' || file.mimetype ==='image/jpg'|| file.mimetype ==='image/jpeg'){
      cb(null, true);
    }else{
      cb('only image and pdf allowed', false);
    }
}

const discussionFileUploader = multer({
    storage:discussionFileStorage,
    fileFilter:discussionFileFilter,
    limits : {fileSize : 8000000}
}).single('discussionFile')


router.post('/room',verifyToken, async (req,res,next) => {
    const redisClient = Redis.getConnection();
    var io = req.app.get('socketio');

    const { error } = createRoomValidation(req.body);
    
    if (error) {
      const err = new Error(error.details.map(x => x.message).join(', '));
      err.status = "failed";
      err.statusCode = 400;
      next(err);
      return;
    }
    try {
        const gogoUserId = req.user.userId;
        const gogoUserName = req.user.name;

        const roomLimit = process.env.PARTICIPANT_LIMIT
        const currentRoomsCount = await Room.countDocuments({roomOwner: gogoUserId})

        if((roomLimit != 0) && (currentRoomsCount > roomLimit)){
            const error = new Error(`Sorry only ${roomLimit} rooms can be created`);
            error.status = "failed";
            error.statusCode = 400;
            return next(error);
        }

        const {roomName, roomParticipants, isRoomPrivate} = req.body;
    
        const newRoom = new Room({
            roomName: roomName,
            roomOwner: gogoUserId,
            roomToken: randomstring.generate({
                length: 12,
                charset: 'alphabetic'
            }),
            isRoomPrivate:isRoomPrivate
        })
        const saveRoom = await newRoom.save();
        if(roomParticipants){
            if(isRoomPrivate){
                const addedParticipants = await inviteRoomParticipantsAndNotify(saveRoom._id,roomParticipants,gogoUserId,gogoUserName)
                //console.log(addedParticipants);
                if(addedParticipants.length){
                    const participantSockets = await getOnlineUserSocketIds(addedParticipants);
                    const notificationMessage = `${gogoUserName} invited you to their Room: ${saveRoom.roomToken}`;
                    const newNotification = await createNotification(gogoUserId,addedParticipants,notificationMessage)
                    //console.log(newNotification);
                    if(participantSockets.length){
                        participantSockets.forEach((socket) => {
                            io.to(socket).emit("invitedToRoom", JSON.stringify(newNotification));
                        })
                    }
                }
            }
        }
        redisClient.del(`userCreatedRooms:${gogoUserId}`);
        

        res.status(200).json({
            status: 'success',
            data:{
                roomName: saveRoom.roomName,
                roomToken: saveRoom.roomToken,
                createdAt: saveRoom.createdAt,
                roomParticipants: saveRoom.roomParticipants,
                isRoomPrivate: saveRoom.isRoomPrivate
            }
        })

    } catch (e) {
        console.log(e);
        const err = new Error("Create room failed");
        err.status = "error";
        next(err);
    }
});

router.get('/room/:roomToken',verifyToken, async (req, res, next) => {
    try {
        const response = {
            status: "failed",
            message: "Invalid room token",
            canJoin: false
        }
        const roomToken = req.params.roomToken;
        if(roomToken == null) return res.status(400).json(response)
        const roomData = await getRoomByToken(roomToken);
        if(roomData!=null) {
            response.status = 'success';
            response.message = 'room found';
            response.canJoin = true;
            let gogoUserId = req.user.userId;
            if((roomData.roomOwner != gogoUserId) && (roomData.isRoomPrivate)){
                if(!roomData.roomParticipants.includes(gogoUserId)){
                    response.canJoin = false
                }
            }
            return res.status(200).json(response);
        }else{
            res.status(400).json(response);
        }
    } catch (e) {
        console.log('here')
        const err = new Error("Fetching room failed");
        err.status = "error";
        next(err);
        return;
    }
});

router.get('/me',verifyToken, async (req,res,next) => {
    try {
        const rooms = await getUserRooms(req.user.userId);
        res.status(200).json({
            status: "success",
            data:rooms
        });
    } catch (e) {
        const err = new Error("Fetching rooms failed");
        err.status = "error";
        next(err);
    }
});

router.get('/invitations/me',verifyToken, async (req,res,next) => {
    try {
        const roomInvitations = await getUserRoomInvitations(req.user.userId);
        res.status(200).json({
            status: "success",
            data:roomInvitations
        });
    } catch (e) {
        const err = new Error("Fetching room invitations failed");
        err.status = "error";
        next(err);
    }
});

router.get('/enrolled-rooms',verifyToken, async (req, res, next) => {
    try {
        const rooms = await getUserEnrolledRooms(req.user.userId);
        res.status(200).json({
            status: "success",
            data:rooms
        });
    } catch (e) {
        const err = new Error("Fetching enrolled rooms failed");
        err.status = "error";
        next(err);
    }
});

router.post('/room/enroll',verifyToken, async (req,res,next) => {
    try {
        const roomToken = req.body.roomToken;
        const action = req.body.action;
        const enroll = await enrollToPrivateRoom(roomToken,req.user.userId,action);
        if(!enroll){
            return res.status(200).json({
                status: "failed",
                message: "Please check your room invitation"
            });
        }
        res.status(200).json({
            status: "success",
            message: `Enrolled to room ${roomToken} ${action}`
        });
    } catch (e) {
        const err = new Error("Enrollment failed");
        err.status = "error";
        next(err);
    }
});


router.post('/discussion',verifyToken, async (req, res, next) => {
    const { error } = createDiscussionValidation(req.body);
    
    if (error) {
      const err = new Error(error.details.map(x => x.message).join(', '));
      err.status = "failed";
      err.statusCode = 400;
      next(err);
      return;
    }

    try {
        const room = req.body.roomToken;
        const message = req.body.message;
        const gogoUser = req.user;

        const roomDiscussion = await createRoomDiscussion(room,message,gogoUser);
        if(roomDiscussion){
            res.status(200).json({
                status: "success",
                message: "Created Discussion"
            })
        }else{
            res.status(200).json({
                status: "failed",
                message: "Created Discussion Failed"
            })
        }
    } catch (e) {
        console.log(e);
        const err = new Error("Sending message failed");
        err.status = "error";
        next(err);
    }
});

//get discussion messages
router.get('/discussion/:roomToken',verifyToken, async (req, res, next) => {
    const roomToken = req.params.roomToken;
    const page = (req.query.page)? parseInt(req.query.page):1
    const limit = (req.query.limit)? parseInt(req.query.limit):10
    if(roomToken){
        try {
            const discussion = await getRoomDiscussionFromRedis(roomToken,page,limit);
            res.status(200).json({
                status : "success",
                hasMoreMessages : discussion['hasMoreMessages'],
                data:discussion['data']
            });
        } catch (e) {
            const err = new Error("Fetching discussion failed");
            err.status = "error";
            next(err);
        }
    }else{
        const err = new Error('No roomToken passed');
        err.status = "failed";
        err.statusCode = 400;
        next(err);
        return;
    }
});

//upload discussion file
router.post('/discussion/upload',verifyToken, async (req, res, next) => {
    try {
        discussionFileUploader(req, res, (err) => {
            if(err) {
              console.log(err);
              return res.status(400).json({
                  status:'failed',
                  message:err
              });
            }
            res.status(200).json({
                status:'success',
                message:'discussion file uploaded',
                data:(req.file.path)?req.file.path:''
            });
        });
    } catch (error) {
        const err = new Error('Something went wrong!');
        err.status = "error";
        next(err);
        return;
    }
});


router.get('/announcements/:roomToken',verifyToken, async(req, res, next) => {
   /*  try {
        const roomToken = req.params.roomToken;
        const roomAnnouncements = await getRoomAnnouncements(roomToken);
        res.status(200).json({
            status: "success",
            data:roomAnnouncements
        });
    } catch (e) {
        const err = new Error("Fetching room announcements failed");
        err.status = "error";
        next(err);
    } */

    const roomToken = req.params.roomToken;
    const page = (req.query.page)? parseInt(req.query.page):1
    const limit = (req.query.limit)? parseInt(req.query.limit):10
    if(roomToken){
        try {
            const announcements = await getRoomAnnouncementsPaginate(roomToken,page,limit);
            res.status(200).json({
                status : "success",
                hasMoreMessages : announcements['hasMoreMessages'],
                data:announcements['data']
            });
        } catch (e) {
            console.log(e);
            const err = new Error("Fetching announcements failed");
            err.status = "error";
            next(err);
        }
    }else{
        const err = new Error('No roomToken passed');
        err.status = "failed";
        err.statusCode = 400;
        next(err);
        return;
    }
});

router.post('/announcement',verifyToken, async(req, res, next) => {
   try {
       //add validations
        const response = {
            status: 'failed',
            message: 'Creating Announcement Failed',
            data: []
        }
        let roomSocket = req.app.get('roomSocket');
        const redisClient = Redis.getConnection();
        const gogoUserId =  req.user.userId;
        const {title, description, roomToken} = req.body;
        const attachment = (req.body.attachment)? req.body.attachment:'';

        const announceOn = (req.body.schedule)? new Date(req.body.schedule):null;

        let createNewAnnouncement = await createAnnouncement({
            title:title,
            description:description,
            attachment:attachment,
            announceOn: announceOn,
            posted:(announceOn != null)?false:true,
            announcementBy:gogoUserId,
        },roomToken);

        if(createNewAnnouncement){
            response.status = 'success';
            response.message = 'Announcement created successfully';
            if(announceOn != null){
                response.message = `Announcement Scheduled and will be posted on ${announceOn}`;
            }else{
              /*   await redisClient.get(`roomAnnouncements:${roomToken}`,(err ,data) =>{
                    if(err) return reject(err);
                    if(data !== null){
                        const allAnnouncements = JSON.parse(data);
                        allAnnouncements.push(createNewAnnouncement)
                        redisClient.set(`roomAnnouncements:${roomToken}`, JSON.stringify(allAnnouncements));
                    }else{
                        redisClient.set(`roomAnnouncements:${roomToken}`, JSON.stringify([createNewAnnouncement]));
                    }
                }); */

                const redisRoomAnnouncementsKey = `roomAnnouncements:${roomToken}`;
                const announcement = await new Promise( async (resolve, reject) =>{
                    await redisClient.exists(redisRoomAnnouncementsKey, (err, exists) => {
                        if(err) return reject(null);
                        if(exists){
                            redisClient.zcard(redisRoomAnnouncementsKey,(err, count) =>{
                                redisClient.zadd(redisRoomAnnouncementsKey, count, JSON.stringify(createNewAnnouncement))
                                redisClient.expire(redisRoomAnnouncementsKey,1500)
                                return resolve(createNewAnnouncement);
                            });
                        }else{
                            redisClient.zadd(redisRoomAnnouncementsKey, 0, JSON.stringify(createNewAnnouncement))
                            redisClient.expire(redisRoomAnnouncementsKey,1500)
                            return resolve(createNewAnnouncement);
                        }
                    }); 
                });
                response.data = [createNewAnnouncement];
                roomSocket.in(roomToken).emit('post-new-announcement', createNewAnnouncement);
            }
        }
        return res.status(200).json(response)

   } catch (error) {
    const err = new Error('Error Creating Announcement!');
    err.status = "error";
    next(err);
    return;
   }
   
})


router.get('/triggerFetchRoomAnnouncements/:roomToken/:aId', async (req,res,next) => {
    const roomToken = req.params.roomToken;
    const aId = req.params.aId;
    let roomSocket = req.app.get('roomSocket');

    const announcement = await Announcement.findById(aId).select("-__v").populate('announcementBy','name email');
    if(announcement != null) {
        let result = await announcement;
        result = result.toObject();
        result['comments'] = [];
        roomSocket.in(roomToken).emit('post-new-announcement', result);
    }else{
        roomSocket.in(roomToken).emit('fetch-announcements', 'fetch-announcements-now');
    }

    return res.status(200).json({status:'triggered'})
});

router.post('/comment',verifyToken, async (req, res, next) => {
    let roomSocket = req.app.get('roomSocket');
    const redisClient = Redis.getConnection();
    const { error } = createAnnouncementCommentValidation(req.body);
    
    if (error) {
      const err = new Error(error.details.map(x => x.message).join(', '));
      err.status = "failed";
      err.statusCode = 400;
      next(err);
      return;
    }

    try {
        const announcement = req.body.announcement;
        const message = req.body.message;
        const gogoUser = req.user.userId;
        const roomToken = req.body.roomToken;

        const announcementComment = await createAnnouncementComment(announcement,message,gogoUser);
        
        if(announcementComment !== null){
            roomSocket.to(roomToken).emit('update-new-comment', announcementComment);
            redisClient.del(`roomAnnouncements:${roomToken}`);
            getRoomAnnouncementsPaginate(roomToken,1,5);
            res.status(200).json({
                status: "success",
                message: "Created Comment",
                data: announcementComment
            });
        }else{
            res.status(200).json({
                status: "failed",
                message: "Created Comment Failed"
            });
        }
    } catch (e) {
        console.log(e);
        const err = new Error("Sending message failed");
        err.status = "error";
        next(err);
    }
});


router.delete('/room/:roomToken',verifyToken, async (req, res, next) => {
    const roomToken = req.params.roomToken;
    const gogoUserId =  req.user.userId;

    try {
        const room = await getRoomByToken(roomToken);
        if(room != null){
            if(room.roomOwner.toString() === gogoUserId){
                await deleteRoomById(room._id);
                //delete Room Cache Record
                Redis.deleteRecordFromCache(`userCreatedRooms:${gogoUserId}`,'roomToken',room.roomToken);
                Redis.deleteRecordFromCache(`userCreatedEnrolledRooms:${gogoUserId}`,'roomToken',room.roomToken);

                Redis.delRedisWithPattern('userCreatedEnrolledRooms:*');
                Redis.delRedisWithPattern('userRoomInvitations:*');

                return res.status(200).json({
                    status: "success",
                    message:'Room deleted'
                })
            }else{
                return res.status(404).json({
                    status: "failed",
                    message:'Action not allowed, Should be Owner'
                });
            }
        }else{
            return res.status(404).json({
                status: "failed",
                message:'Room not found'
            });
        }
    } catch (e) {
        const err = new Error('Error deleting room');
        err.status = "error";
        next(err);
        return;
    }
});

router.get('/test', async (req,res,next) => {
    const redisClient = Redis.getConnection();

    redisClient.del('roomAnnouncements:QoPlJklYbjsQ');

   getRoomAnnouncementsPaginate('QoPlJklYbjsQ',1,5);

    res.status(200).json({status:'success'})
    //console.log(announcements[0]);return;
  /*   const redisClient = Redis.getConnection();
    const page = (req.query.page)? parseInt(req.query.page):1
    const limit = (req.query.limit)? parseInt(req.query.limit):10
  
     const announcements = await getRoomAnnouncementsPaginate('jLFmyLNCqBMQ',page,limit);
     console.log(announcements); */
});

const getOnlineUserSocketIds = async(p) => {
    const redisClient = Redis.getConnection();
    let onlineUserSockets = [];
    for(const uid of p){
       let socketPromise  =  await new Promise( async (resolve, reject) => {
            await redisClient.get('onlineUsers',(err ,data) =>{
                if(err) return reject(err);
                if(data !== null){
                    const onlineUserData = JSON.parse(data).filter(u => u.userId == uid.user);
                    if(onlineUserData.length > 0){
                        return resolve(onlineUserData[0].socket)
                    }else{
                        return resolve(null);
                    }
                }
            })
       })
       if(socketPromise != null){
            onlineUserSockets.push(socketPromise);
       }
    }
   return onlineUserSockets;
} 

/* const cl = Redis.getConnection();
const getAsync = promisify(cl.get).bind(cl);
const doStuff = async (p) => {
  onlineUserSockets = [];
  for (const uid of p) {
    const data = await getAsync('onlineUsers');
    if (data) {
      const onlineUserData = JSON.parse(data).filter(({ userId }) => userId == uid);
      if (onlineUserData.length) {
        onlineUserSockets.push(onlineUserData[0].socket);
      }
    }
  }
  return onlineUserSockets;
} */


module.exports = router;