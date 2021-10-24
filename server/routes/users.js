const express = require('express')
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');
const Redis  = require("../helpers/Redis");
const { addOnlineUser } = require('../controllers/users');
const redisClient = Redis.getConnection();

router.get('/me',verifyToken, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId).select('-password -resetPasswordToken -resetPasswordExpires');

        res.status(200).json({
            "status":"success",
            "data":user
        });
    } catch (e) {
        const err = new Error("Fetching user details failed");
        err.status = "error";
        next(err);
    }
});

router.post('/online',verifyToken,async (req, res, next) => {
    try {
        const newEntry = {
            userId: req.user.userId,
            socket:req.body.sId    
        };
        redisClient.get('onlineUsers', (err, data) =>{
            if(err){
                const error = new Error("Online Failed");
                error.status = "error";
                return next(error);
            }
            if(data != null){
                const onlineUsers = JSON.parse(data).filter(user => user.userId != req.user.userId);
                const newOnlineUsers = [
                    ...onlineUsers,
                    newEntry
                ];
                redisClient.set("onlineUsers", JSON.stringify(newOnlineUsers));
            }else{
                redisClient.set("onlineUsers", JSON.stringify([newEntry]));
            }
        });
       
        res.status(200).json({
            "status":"success"
        });
    } catch (e) {
        const err = new Error("ONline Failed");
        err.status = "error";
        next(err);
    }
});

router.get('/online',verifyToken,async (req, res, next) => {
    try {
       
        redisClient.get('onlineUsers', (err, data) =>{
            if(err){
                const error = new Error("Get Online Failed");
                error.status = "error";
                return next(error);
            }
            if(data != null){
                const onlineUsers = JSON.parse(data);
                return res.status(200).json({
                    "status":"success",
                    "data":onlineUsers
                });
            }else{
               return res.status(200).json({
                    "status":"success",
                    "data":[]
               });
            }
        });
        
    } catch (e) {
        const err = new Error("Get ONline Failed");
        err.status = "error";
        next(err);
    }
});

router.delete('/online',verifyToken,async (req, res, next) => {
    try {

        redisClient.get('onlineUsers', (err, data) =>{
            if(err){
                const error = new Error("Delete Online Failed");
                error.status = "error";
                return next(error);
            }
            if(data != null){
                const onlineUsers = JSON.parse(data).filter(user => user.userId != req.user.userId);
                redisClient.set("onlineUsers", JSON.stringify(onlineUsers));
                return res.status(200).json({
                    "status":"success"
                });
            }else{
                return res.status(200).json({
                    "status":"failed"
                });
            }
        });
    } catch(e){
        const err = new Error("Delete ONline Failed");
        err.status = "error";
        next(err);
    }
});

module.exports = router;