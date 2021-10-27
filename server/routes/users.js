const express = require('express')
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');
const Cache  = require("../helpers/Cache");
const { addOnlineUser, getOnlineUsers } = require('../controllers/users');
const cacheClient = Cache.getConnection();
const cacheService = Cache.getServiceName();

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
        addOnlineUser(req.user.userId, req.body.sId)
        res.status(200).json({
            "status":"success"
        });
    } catch (e) {
        console.log(e);
        const err = new Error("ONline Failed");
        err.status = "error";
        next(err);
    }
});

router.get('/online',verifyToken,async (req, res, next) => {
    try {
     
        const response = await getOnlineUsers();
        return res.status(200).json(response);

    } catch (e) {
        const err = new Error("Get ONline Failed");
        err.status = "error";
        next(err);
    }
});

router.delete('/online',verifyToken,async (req, res, next) => {
    try {
        const cacheKey = 'onlineUsers';
        switch(cacheService){
            case 'REDIS':
                cacheClient.get(cacheKey, (err, data) =>{
                    if(err){
                        const error = new Error("Delete Online Failed");
                        error.status = "error";
                        return next(error);
                    }
                    if(data != null){
                        const onlineUsers = JSON.parse(data).filter(user => user.userId != req.user.userId);
                        cacheClient.set("onlineUsers", JSON.stringify(onlineUsers));
                        return res.status(200).json({
                            "status":"success"
                        });
                    }else{
                        return res.status(200).json({
                            "status":"failed"
                        });
                    }
                });
            break;
            case 'NODECACHE':
                const data = await cacheClient.get(cacheKey);
                if(data != undefined){
                    const onlineUsers = JSON.parse(data).filter(user => user.userId != req.user.userId);
                    cacheClient.set("onlineUsers", JSON.stringify(onlineUsers));
                    return res.status(200).json({
                        "status":"success"
                    });
                }else{
                    return res.status(200).json({
                        "status":"failed"
                    });
                }
            break;
        }
     
    } catch(e){
        const err = new Error("Delete ONline Failed");
        err.status = "error";
        next(err);
    }
});

module.exports = router;