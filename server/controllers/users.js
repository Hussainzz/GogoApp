
const Redis  = require("../helpers/Redis");
const redisClient = Redis.getConnection();

module.exports = {
    addOnlineUser,
    deleteOnlineUserBySocketId
};


function addOnlineUser(user,socketId) {
    const newEntry = {
        userId: user,
        socket: socketId    
    };
    redisClient.get('onlineUsers', (err, data) =>{
        if(err){
            return false
        }
        if(data != null){
            const onlineUsers = JSON.parse(data).filter(u => u.userId !== user);
            const newOnlineUsers = [
                ...onlineUsers,
                newEntry
            ];
            redisClient.set("onlineUsers", JSON.stringify(newOnlineUsers));
        }else{
            redisClient.set("onlineUsers", JSON.stringify([newEntry]));
        }
    });
    return true;
}

function deleteOnlineUserBySocketId(socketId){
    redisClient.get('onlineUsers', (err, data) =>{
        if(err){
            return false
        }
        if(data != null){
            const onlineUsers = JSON.parse(data).filter(u => u.socket !== socketId);
            redisClient.set("onlineUsers", JSON.stringify(onlineUsers));
            return true;
        }
    });
    return false;
}