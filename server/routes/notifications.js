const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();

const { getReceivedNotifications,markNotificationAsReadForReceiver } = require('../controllers/notification');
const {markReadNotificationSchema} = require('../validations');

const Redis = require('../helpers/Redis');
var mongoose = require('mongoose');
router.get('/',verifyToken , async (req,res,next) => {
    //const notifications = await Notification.find({ "receiver": { $elemMatch:{"user":'611749da03adea661a168540', "read": true}}}, { 'receiver.$': 1 ,'message':1});
    /* const notifications = await Notification.findOne({ _id: '6121d0723221b4dae6bc6058', "receiver": { $elemMatch:{"user":'610f4f377dae193d5b921ed5', "read": false}}}, { 'receiver.$': 1 }); */
/* 
    await Notification.updateOne({ _id: '6121d0723221b4dae6bc6058', "receiver": { $elemMatch:{"user":'611749da03adea661a168540', "read": true}}}, {'$set': {
        'receiver.$.read': false,
        'receiver.$.read_at': Date().toLocaleString()
    }});

    return; */

    const gogoUserId =  req.user.userId;

    try {
        const notifications = await getReceivedNotifications(gogoUserId);
        res.status(200).json({
            status: "success",
            data:notifications,
            count:notifications.length
        });
    } catch (e) {
        const err = new Error("Fetching notifications failed");
        err.status = "error";
        next(err);
    }
});

router.put('/mark-read', verifyToken, async(req, res, next) => {
    const { error } = markReadNotificationSchema(req.body);
    if (error) {
      const err = new Error(error.details.map(x => x.message).join(', '));
      err.status = "failed";
      err.statusCode = 400;
      next(err);
      return;
    }

    const notificationId =  req.body.notificationId;
    const gogoUserId =  req.user.userId;
    
    try {
        const markRead = await markNotificationAsReadForReceiver(notificationId,gogoUserId)
        if(markRead){
            const redisClient = Redis.getConnection();
            redisClient.del(`notifications:${gogoUserId}`);

            res.status(200).json({
                status: "success",
                message: "Marked Read"
            });
        }else{
            res.status(200).json({
                status: "failed",
                message: "Marked Read Failed / Already Marked"
            });
        }
    } catch (e) {
      const err = new Error('Marked Read Failed');
      err.status = "error";
      next(err);
      return;
    }
});

module.exports = router;