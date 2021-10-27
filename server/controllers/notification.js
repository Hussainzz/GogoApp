const Notification = require("../models/Notification");
const Cache  = require("../helpers/Cache");

module.exports = {
    createNotification,
    getReceivedNotifications,
    markNotificationAsReadForReceiver
};

async function createNotification(senderId, receiverIds, message){
    try {
        const notification = new Notification({
            sender: senderId,
            receiver: receiverIds,
            message: message,
        })
        const record = await notification.save();
        return record;
    } catch (error) {
        return null;
    }
}

async function getReceivedNotifications(receiverId) {
    const notifications = await Cache.getOrSetCache(`notifications:${receiverId}`,3600,async () => {
        const notificationData = await getReceivedNotificationsFromDB(receiverId);
        console.log(notificationData)
        return notificationData;
    })
    return notifications;
  }
  
  
  async function getReceivedNotificationsFromDB(receiverId){
    const notifications = await Notification.find({ "receiver": { $elemMatch:{"user":receiverId, "read": false}}}, { 'receiver.$': 1,'message':1 }).lean().populate('sender', 'name');
   // const notifications = await Notification.find({ 'receiver.user': {$in:receiverId}}).lean().populate('sender', 'name');
    return notifications;
  }

  async function markNotificationAsReadForReceiver(notificationId,receiverId) {
    try {
        //const notification = await Notification.findOne({ _id: notificationId, "receiver": { $elemMatch:{"user":receiverId, "read": false}}});
     
        const notification = await Notification.findOne({ _id:notificationId, "receiver": { $elemMatch:{"user":receiverId, "read": false}}}, { 'receiver.$': 1 });
       
        if(notification){
            await Notification.updateOne({ _id: notificationId, "receiver": { $elemMatch:{"user":receiverId, "read": false}}}, {'$set': {
                'receiver.$.read': true,
                'receiver.$.read_at': Date().toLocaleString()
            }});
            return true;
        }else{
            return false;
        }
    } catch (e) {
        return false;
    }
  }
  