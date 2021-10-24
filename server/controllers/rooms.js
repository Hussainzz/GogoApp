const mongoose = require('mongoose');
const moment = require('moment');
//const request = require('request');
const axios = require('axios');
const randomstring = require("randomstring");
const User = require("../models/User");
const Room = require("../models/Room");
const Redis  = require("../helpers/Redis");
const RoomDiscussionMessages = require("../models/RoomDiscussionMessages");
const RoomDiscussion = require("../models/RoomDiscussion");
const RoomInvitation = require('../models/RoomInvitation');
const Announcement = require('../models/Announcement');
const AnnouncementComment = require('../models/AnnouncementComment');
module.exports = {
  getUserRooms,
  inviteRoomParticipantsAndNotify,
  createRoomDataRedis,
  getRoomDataFromRedis,
  deleteUserFromRoom,
  createConfRoomDataRedis,
  getConfRoomDataFromRedis,
  deleteUserFromGogoConfRoom,
  createRoomDiscussion,
  getRoomDiscussionFromRedis,
  moveDiscussionsToDB,
  getRoomByToken,
  getUserRoomInvitations,
  enrollToPrivateRoom,
  getUserEnrolledRooms,
  createAnnouncement,
  postScheduledAnnouncements,
  getRoomAnnouncements,
  getRoomAnnouncementsPaginate,
  createAnnouncementComment,
  getRoomAnnouncementsFromDB,
  deleteRoomById
};

async function inviteRoomParticipantsAndNotify(roomId, participants) {
  const redisClient = Redis.getConnection();
  let userRoomInvites = [];
  let participantsNotification = [];
  const room = await Room.findById(roomId);
  if (room && participants.length > 0 ) {
    const p = [...new Set(participants)];
    for (const participant of p) {
      if (participant !== "") {
        const user = await User.findOne({ email: participant });
        if (user) {
          userRoomInvites.push({
            room:roomId,
            to:user._id
          });
          participantsNotification.push({
            user:user._id,
            read:false
          })
          redisClient.del(`notifications:${user._id}`);
          redisClient.del(`userRoomInvitations:${user._id}`);
        }
      }
    }
    if (userRoomInvites.length > 0) {
      //room.roomParticipants = userIds;
      //await room.save();
      await RoomInvitation.insertMany(userRoomInvites)
    }
  }
  return participantsNotification;
}

async function getUserRooms(userId) {
    const rooms = await Redis.getOrSetCache(`userCreatedRooms:${userId}`,3600,async () => {
        const roomData = await getUserRoomsFromDB(userId);
        return roomData;
    })
    return rooms;
}

async function getUserRoomsFromDB(userId){
    const rooms = await Room.find({ roomOwner: userId }).select("-__v -_id").populate('roomParticipants','email');
    return rooms;
}

async function getUserEnrolledRooms(userId) {
  const rooms = await Redis.getOrSetCache(`userCreatedEnrolledRooms:${userId}`,3600,async () => {
      const roomData = await getUserEnrolledRoomsFromDB(userId);
      return roomData;
  })
  return rooms;
}

async function getUserEnrolledRoomsFromDB(userId){
  const rooms = await Room.find({ isRoomPrivate:true, 'roomParticipants': {$in:userId} }).select("-__v").populate('roomOwner','email name');
  return rooms;
}

async function createRoomDataRedis(roomData,socketId){
    try {
      const redisClient = Redis.getConnection();
      const newUserData = {
          userId: roomData.userId,
          socketId: socketId,
          name:roomData.name
      }
      const newInsertedUser = await new Promise(async (resolve, reject) => {
          await redisClient.get(`room:${roomData.room}`, async (err, data) =>{
            if(err) return reject(null);
            
            if(data != null){
              const currentJoinedUsers = JSON.parse(data).joinedUsers.filter(u => u.userId !== roomData.userId);
              const newJoinedUsers = [
                  ...currentJoinedUsers,
                  newUserData
              ];
              const newRoomData = {
                  joinedUsers: newJoinedUsers,
              }
              redisClient.set(`room:${roomData.room}`, JSON.stringify(newRoomData));
              return resolve(newUserData);
            }else{
               redisClient.set(`room:${roomData.room}`, JSON.stringify({
                joinedUsers: [newUserData],
              }));
              return resolve(JSON.stringify({
                joinedUsers: [newUserData],
              }));
            }
          });
      })
      return newInsertedUser;
    }catch(e){
      return null;
    }
    
}

async function getRoomDataFromRedis(room){
    const redisClient = Redis.getConnection();

    const roomData = await new Promise( async (resolve, reject) =>{
        await redisClient.get(`room:${room}`, (err, data) =>{
          if(err) return reject(null); 
                  
          if(data != null){
              return resolve(data);
          }else{
            return reject(null);
          }
        });
    })
    return roomData;
}

async function deleteUserFromRoom(socket, room){
    const redisClient = Redis.getConnection();

    const roomData = await new Promise( async (resolve, reject) =>{
        await redisClient.get(`room:${room}`, (err, data) =>{
          if(err) return reject(null);
          
          if(data != null){
              const joinedUsers = JSON.parse(data).joinedUsers.filter(u => u.socketId !== socket);
              const newRoomData = {
                joinedUsers: joinedUsers,
              }
              redisClient.set(`room:${room}`, JSON.stringify(newRoomData));
              return resolve(newRoomData);
          }else{
            return reject(null);
          }
        });
    })
    return roomData;
}

async function createConfRoomDataRedis(roomData,socketId){
  try {
    const redisClient = Redis.getConnection();
    const newUserData = {
        userId: /* roomData.userId */socketId,
        socketId: socketId,
        name:roomData.name
    }
    const newInsertedUser = await new Promise(async (resolve, reject) => {
        await redisClient.get(`gogoConf:${roomData.room}`, async (err, data) =>{
          if(err) return reject(null);
          
          if(data != null){
            const currentJoinedUsers = JSON.parse(data).joinedUsers.filter(u => u.userId !== roomData.userId);
            const newJoinedUsers = [
                ...currentJoinedUsers,
                newUserData
            ];
            const newRoomData = {
                joinedUsers: newJoinedUsers,
            }
            redisClient.set(`gogoConf:${roomData.room}`, JSON.stringify(newRoomData));
            return resolve(newUserData);
          }else{
             redisClient.set(`gogoConf:${roomData.room}`, JSON.stringify({
              joinedUsers: [newUserData],
            }));
            return resolve(JSON.stringify({
              joinedUsers: [newUserData],
            }));
          }
        });
    })
    return newInsertedUser;
  }catch(e){
    return null;
  }
  
}

async function getRoomByToken(roomToken){
  try{
    const roomData = await Room.findOne({roomToken:roomToken});
    return roomData;
  }catch(e){
    return null;
  }
}

async function getConfRoomDataFromRedis(room){
  const redisClient = Redis.getConnection();

  const roomData = await new Promise( async (resolve, reject) =>{
      await redisClient.get(`gogoConf:${room}`, (err, data) =>{
        if(err) return reject(null); 
                
        if(data != null){
            return resolve(data);
        }else{
          return reject(null);
        }
      });
  })
  return roomData;
}

async function deleteUserFromGogoConfRoom(socket, room){
  const redisClient = Redis.getConnection();

  const roomData = await new Promise( async (resolve, reject) =>{
      await redisClient.get(`gogoConf:${room}`, (err, data) =>{
        if(err) return reject(null);
        
        if(data != null){
            const joinedUsers = JSON.parse(data).joinedUsers.filter(u => u.userId !== socket);

            const newRoomData = {
              joinedUsers: joinedUsers,
            }
            redisClient.set(`gogoConf:${room}`, JSON.stringify(newRoomData));
            return resolve(newRoomData);
        }else{
          return reject(null);
        }
      });
  })
  return roomData;
}

async function createRoomDiscussion(room,message,user){
    const redisClient = Redis.getConnection();
    const roomData = await Room.findOne({roomToken:room});
    const random = randomstring.generate({
      length: 5,
      charset: 'alphabetic'
    });
    // console.log(mongoose.isValidObjectId(user.userId));return;
    if(roomData){
        const redisDiscussionKey = `discussion:${room}`;
        const redisDiscussionStoreKey = `discussionStore`;
        const now = Date.now();
        const today = new Date(now);
        let newMessage = {
            sender: user.userId,
            name: user.name,
            message:message,
            sentOn: today.toISOString(),
            cuid:random
        }
       const discussion = await new Promise( async (resolve, reject) =>{

          await redisClient.exists(redisDiscussionKey, (err, exists) => {
              if(err) return reject(null);
              if(exists){
                  redisClient.zcard(redisDiscussionKey,(err, count) =>{
                      redisClient.zadd(redisDiscussionKey, count, JSON.stringify(newMessage))
                      redisClient.expire(redisDiscussionKey,900)
                      return resolve(newMessage);
                  });
              }else{
                  redisClient.zadd(redisDiscussionKey, 0, JSON.stringify(newMessage))
                  redisClient.expire(redisDiscussionKey,900)
                  return resolve(newMessage);
              }
          }); 
        });
          /*   await redisClient.get(redisDiscussionKey,(err, data) =>{
              if(err) return reject(null);
            
              if(data){
                  const d = JSON.parse(data);
                  d.push(newMessage);
                  redisClient.setex(redisDiscussionKey,900, JSON.stringify(d));
                  return resolve(newMessage);
              }else{
                  redisClient.setex(redisDiscussionKey,900, JSON.stringify([newMessage]));
                  return resolve(newMessage);
              }
          }) */

       //create discussion store
       const result = await discussion;
       if(result !== null){
          const newDiscussionStore = await new Promise( async (resolve, reject) =>{
              await redisClient.get(redisDiscussionStoreKey,(err, data) =>{
                  if(err) return reject(null);
                  newMessage['roomId'] = roomData._id;
                  if(data){
                      const d = JSON.parse(data);
                      if(d[room]){
                        d[room] = [...d[room], newMessage];
                      }else{
                        d[room] = [newMessage];
                      }
                      redisClient.set(redisDiscussionStoreKey, JSON.stringify(d));
                      return resolve(newMessage);
                  }else{
                      const initDiscussionStore = {};
                      initDiscussionStore[room] = [newMessage];
                      redisClient.set(redisDiscussionStoreKey, JSON.stringify(initDiscussionStore));
                      return resolve(newMessage);
                  }
              })
          })
          const msg = await newDiscussionStore;
          if(msg !== null){
              return msg;
          }
         return false;
       }
    }
    return false;
}

async function getRoomDiscussionFromRedis(room, page, limit){
  const redisClient = Redis.getConnection();

  const roomData = await Room.find({roomToken:room});
  const startIndex = (page - 1) * limit;
  let endIndex = page * limit;
  
  const discussionData = {
    hasMoreMessages:false,
    data : []
  };
  if(roomData){
    const redisDiscussionKey = `discussion:${room}`;

    const isDiscussionInRedis = await redisClient.zcard(redisDiscussionKey, async(err, exists) => {
      if(err) return false;
      if(exists) {
        if(endIndex < exists){
          discussionData['hasMoreMessages'] = true;
        }

        if(endIndex > exists){
          endIndex = exists;
        }
        return true
      }else{
        return false
      }
    });
    //console.log(startIndex, endIndex);
    if(isDiscussionInRedis){
      const discussion = await new Promise( async (resolve, reject) =>{
        await redisClient.zrevrange([redisDiscussionKey, startIndex, endIndex-1], (err, data) => {
              if(err) return reject([]);
              if(data){
                const discussionMessagesCache = [];
                data.forEach((m) => {
                  discussionMessagesCache.push(JSON.parse(m))
                });
                return resolve(discussionMessagesCache.reverse());
              }
              return reject([]);
        });
      });
      discussionData['data'] = await discussion;
    }
    //get data from db
    if(!discussionData['data'].length){
        const discussionDB = await new Promise(async (resolve, reject) => {
          const discussion = await RoomDiscussion.findOne({roomToken:room});
          if(discussion){
            const discussionMessages = await RoomDiscussionMessages.find({discussionId:discussion._id}).populate('sender','name');
            const discussionMessagesDB = [];
            if(discussionMessages){
                if(endIndex < discussionMessages.length){
                  discussionData['hasMoreMessages'] = true;
                }
                discussionMessages.forEach((m,i) => {
                  let nM = {
                    sender: m.sender._id,
                    name: m.sender.name,
                    message:m.message,
                    sentOn:m.sentOn,
                    cuid:randomstring.generate({
                      length: 5,
                      charset: 'alphabetic'
                    })
                  };
                  discussionMessagesDB.push(nM)
                  redisClient.zadd(redisDiscussionKey, i, JSON.stringify(nM))
                  redisClient.expire(redisDiscussionKey,900)
                });
                return resolve(discussionMessagesDB.reverse().slice(startIndex, endIndex).reverse());
            }
          }
          return resolve([]);
        });
        discussionData['data'] = await discussionDB;
    }
  }
  return discussionData;
}

async function moveDiscussionsToDB(){
  const redisClient = Redis.getConnection();
  const redisDiscussionStoreKey = `discussionStore`;

  const discussion = await new Promise( async (resolve, reject) =>{
    await redisClient.get(redisDiscussionStoreKey,(err, data) =>{
        if(err) return reject([]);
        if(data){
            const d = JSON.parse(data);
            return resolve(d);
        }
        return resolve([]);
    })
  })
  const discussionData = await discussion;

  if(Object.keys(discussionData).length){
    for(let d of Object.keys(discussionData)){
      let discussionMessagesToInsert = [];
      let data = discussionData[d];
      let rId = data[0]['roomId']
      let discussionId = null;
      const roomDiscussion = await RoomDiscussion.findOne({room:rId});
      
      if(roomDiscussion !== null){
        discussionId = roomDiscussion._id
      }else{
        const newRoomDiscussion = new RoomDiscussion({
          room: mongoose.Types.ObjectId(rId),
          roomToken: d
        });
        const newRoomDiscussionRecord = await newRoomDiscussion.save();
        discussionId = newRoomDiscussionRecord._id;
      }

      if(discussionId != null){
        data.forEach(async (r) => {
            discussionMessagesToInsert.push({
              discussionId: discussionId,
              sender: r.sender,
              message: r.message,
              sentOn : r.sentOn,
            })
        });
      }
      let insertingMessages = await RoomDiscussionMessages.insertMany(discussionMessagesToInsert);
    }
    redisClient.del(redisDiscussionStoreKey);
    console.log('Discussion Data To DB Moved');
  }else{
    console.log('No Discussion Data To Move to DB');
  }
}


async function getUserRoomInvitations(userId) {
  const roomInvitations = await Redis.getOrSetCache(`userRoomInvitations:${userId}`,3600,async () => {
      const roomInvitationData = await getUserRoomInvitationsFromDB(userId);
      return roomInvitationData;
  })
  return roomInvitations;
}

async function getUserRoomInvitationsFromDB(userId){
  const rooms = await RoomInvitation.find({ to: userId, enrolled:0 }).select("-__v -_id").populate('room');
  return rooms;
}

async function enrollToPrivateRoom(roomToken,userId,action){
  try {
    const redisClient = Redis.getConnection();
    const room  = await getRoomByToken(roomToken);
    if(room != null){
        const invitation = await RoomInvitation.findOne({ to: userId, room:room._id, enrolled:0 });
        if(invitation != null){
          room.roomParticipants.push(userId);
          await room.save();
          if(action === 'accepted'){
            invitation.enrolled = 1;
          }else{
            invitation.enrolled = 2;
          }
          await invitation.save();
          redisClient.del(`userRoomInvitations:${userId}`);
          redisClient.del(`userCreatedEnrolledRooms:${userId}`);
          return true
        }
    }
    return false
  } catch (e) {
    return false
  }
}

async function createAnnouncement(data,roomToken){
  try {
    const room  = await getRoomByToken(roomToken);
    if(room != null){
      data['room'] = room._id;
      const announcement = new Announcement(data);
      const saveAnnouncement = await announcement.save();
     
      const s = new Promise(async (resolve, reject) => { 
          Announcement.populate(saveAnnouncement, {path:"announcementBy", select:"name email"}, function(err, a) { 
            if(err) return resolve(null);
            return resolve(a);
          });
      });
      let result = await s;
      result = result.toObject();
      result['comments'] = [];
      return result;
    }
    return null;
  } catch (e) {
    console.log(e);
    return null;
  }
}

async function getScheduledAnnouncements(){
  try {
    const pendingAnnouncements = await Announcement.find({
      announceOn: { $gte: moment().format('YYYY-MM-DD') + ' 00:00:00', $lte: moment().format('YYYY-MM-DD') + ' 23:00:00' },
      posted:false
    }).populate('room','roomToken');
    return pendingAnnouncements;
  } catch (e) {
    console.log(`getting scheduled announcement failed`);
    return [];
  }
}


async function postScheduledAnnouncements(){
  try {
    const API_URL = process.env.API_BASE_URL;  
    const redisClient = Redis.getConnection();
    const pendingAnnouncements = await getScheduledAnnouncements();
    

    if(pendingAnnouncements.length){
      //let current = new Date().toISOString();
      let current = moment().seconds(0).milliseconds(0).toISOString();
      console.log(`Current: ${current}`);
      pendingAnnouncements.forEach( async (a) => {
          let ann = moment(a.announceOn).seconds(0).milliseconds(0).toISOString();
          console.log(`announcement ${a.title}: ${ann}`);
          if(ann === current){
              console.log(`announcement ${a.title}: POSTING NOW`);
              a.posted = true;
              await a.save();
              redisClient.del(`roomAnnouncements:${a.room.roomToken}`);

              const URI  =`${API_URL}/api/rooms/triggerFetchRoomAnnouncements/${a.room.roomToken}/${a._id}`;
              try{
                const {data} = await axios.get(URI);
                console.log(data)
              }catch(e){
                console.log(e)
              }
             /*  await request({
                  url: `${API_URL}/api/rooms/triggerFetchRoomAnnouncements/${a.room.roomToken}/${a._id}`,
                  method: 'GET'
              }, function (error, response, body) {
                  console.log({error: error, response: response, body: body});
              }); */
          }
      })
    }
  } catch (e) {
    console.log(`posting scheduled announcement failed`);
  }
}

async function getRoomAnnouncements(roomToken){
  try {
    const room  = await getRoomByToken(roomToken);
    if(room != null){
        const roomAnnouncements = await Redis.getOrSetCache(`roomAnnouncements:${roomToken}`,3600,async () => {
          const roomAnnouncementsData = await getRoomAnnouncementsFromDB(room._id);
          return roomAnnouncementsData;
      })
      return roomAnnouncements;
    }
    return []
  } catch (e) {
    console.log(e);
    return []
  }
}

async function getRoomAnnouncementsFromDB(roomId){

  const announcements = await Announcement.aggregate(
    [
      { "$match": { "room": mongoose.Types.ObjectId(roomId), "posted": true } },
      {
         $lookup: {
           /*  from: "announcementcomments",
            let: { annId: "$_id" },
            pipeline: [ {
               $match: {
                 $expr:{
                    $and: [
                      { $eq: [ "$$annId", "$announcement" ] },
                    ]
                 }
               }
            } ], */
            from: "announcementcomments",
            localField: '_id',
            foreignField:'announcement',
            as: "matches"
         }
      }
   ]
  )/* .exec(async (err, data) => {
      await AnnouncementComment.populate(data,{path:'matches.sender'}, function(err, populatedTransactions) {
        console.log(populatedTransactions[0]);
      });
  }) */
/* 
  const z = await AnnouncementComment.populate(announcements,{path:'matches.sender'}); */
  
  const all = await populateAnnouncementComments(announcements);

  return all;
}

async function populateAnnouncementComments(announcements){
  const allAnnouncements = [];
  const data = await new Promise( async (resolve, reject) =>{
     for(const e of announcements){
        const ann = {
          _id: e._id,
          announceOn: e.announceOn,
          posted: e.posted,
          title: e.title,
          description: e.description,
          attachment: e.attachment,
          announcementBy:e.announcementBy,
          room: e.room,
          createdAt: e.createdAt,
          updatedAt: e.updatedAt,
          comments : []
        }

        const annBy = await Announcement.populate(e,{path:'announcementBy', select:  {_id: 1, name: 1}});
        ann['announcementBy'] = annBy.announcementBy;

        if(e['matches'].length){
          await new Promise( async (resolve, reject) =>{ 
            let comm = [];
             for(const c of e['matches']){
              const commz = await AnnouncementComment.populate(c,{path:'sender', select:  {_id: 1, name: 1}});
              await ann['comments'].push(commz);
             };
            return resolve(comm);
          });
        }
        allAnnouncements.push(ann);
      };
      return resolve(allAnnouncements);
  });
  return data;
}

async function getRoomAnnouncementsPaginate(room, page, limit){
  const redisClient = Redis.getConnection();

  const roomData = await Room.findOne({roomToken:room});
  const startIndex = (page - 1) * limit;
  let endIndex = page * limit;
  
  announcementData = {
    hasMoreMessages:false,
    data : []
  };
  if(roomData){
    const redisAnnouncementKey = `roomAnnouncements:${room}`;

    const isAnnouncementInRedis = await new Promise( async (resolve, reject) =>{
      await redisClient.zcard(redisAnnouncementKey, async(err, exists) => {
          if(err) return resolve(false);
       
          if(exists) {
            if(endIndex < exists){
              announcementData['hasMoreMessages'] = true;
            }
    
            if(endIndex > exists){
              endIndex = exists;
            }
            return resolve(true)
          }else{
            return resolve(false)
          }
      });

    });

   
    if(isAnnouncementInRedis){
      const announcement = await new Promise( async (resolve, reject) =>{
        await redisClient.zrevrange([redisAnnouncementKey, startIndex, endIndex-1], (err, data) => {
              if(err) return reject([]);
              if(data){
                const announcementDataCache = [];
                /* data.forEach((m) => {  */   for(const [i, m] of data.entries()){
                  announcementDataCache.push(JSON.parse(m))
                };
                //console.log(announcementDataCache);
                return resolve(announcementDataCache);
              }
              return reject([]);
        });
      });
      announcementData['data'] = await announcement;
    }
    
      //get data from db
      if(!announcementData['data'].length){
         const announcementDB = await new Promise(async (resolve, reject) => {
          
            const announcements = await getRoomAnnouncementsFromDB(roomData._id);
            
            const allAnnouncementsDB = [];
            if(announcements){
                if(endIndex < announcements.length){
                  announcementData['hasMoreMessages'] = true;
                }
                /* announcements.forEach((m,i) => { */  for(const [i, m] of announcements.entries()){
                  allAnnouncementsDB.push(m)
                  redisClient.zadd(redisAnnouncementKey, i, JSON.stringify(m))
                  redisClient.expire(redisAnnouncementKey,900)
                };
                return resolve(allAnnouncementsDB.reverse().slice(startIndex, endIndex));
            }
            
            return resolve([]);
         });

         announcementData['data'] = await announcementDB;
      }
   
  }
  return announcementData;
}

async function createAnnouncementComment(announcementId,message,gogoUserId){
   try {
      const redisClient = Redis.getConnection();
      const announcement = await Announcement.findOne({_id: mongoose.Types.ObjectId(announcementId)});

      if(announcement !== null){
          const newAnnouncementComment = new AnnouncementComment({
              announcement: announcement._id,
              sender: gogoUserId,
              message:message
          });

          const savedComment = await newAnnouncementComment.save();

          const s = new Promise(async (resolve, reject) => { 
            AnnouncementComment.populate(savedComment, {path:"sender", select: 'name email'}, function(err, a) { 
              if(err) return resolve(null);
              return resolve(a);
            });
          });
          const comment = await s;
       /*    const redisKey = `roomAnnouncementComment:${announcement._id}`;
          await redisClient.get(redisKey, async (err, data) =>{
            if(err) return reject(null);
            if(data != null){
              redisClient.set(redisKey, JSON.stringify([comment, ...JSON.parse(data)]));
            }else{
              redisClient.set(redisKey, JSON.stringify([comment]));
            }
          }); */
          return comment;
      }
      return null;
   } catch (e) {
    console.log(e);
      return null
   }
}

async function deleteRoomById(roomId){
  try {
    await Room.deleteMany({_id: roomId});

    const announcements = await Announcement.find({room: roomId}).select("_id");
    if(announcements.length){ 
      let announcementIds = announcements.map(({ _id }) => _id);
      await AnnouncementComment.deleteMany({announcement: { $in: announcementIds}});
      await Announcement.deleteMany({room: roomId});
      console.log(announcementIds);
    }

    const discussion = await RoomDiscussion.findOne({room: roomId});
    if(discussion){
      await RoomDiscussionMessages.deleteMany({discussionId: discussion._id});
      await RoomDiscussion.deleteMany({_id: discussion._id});
    }

    const roomInvitations = await RoomInvitation.findOne({room: roomId}).select("_id");
    if(roomInvitations){ 
      await RoomInvitation.deleteMany({room: roomId});
    }
    return true;
  } catch (err) {
    console.log(err)
    return false;
  }
}

