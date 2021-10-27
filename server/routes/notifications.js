const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();

const { getReceivedNotifications,markNotificationAsReadForReceiver } = require('../controllers/notification');
const {markReadNotificationSchema} = require('../validations');

const Cache = require('../helpers/Cache');
var mongoose = require('mongoose');

router.get('/',verifyToken , async (req,res,next) => {
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
            Cache.deleteKeyFromCache(`notifications:${gogoUserId}`);

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