
const Cache  = require("../helpers/Cache");
const cacheClient = Cache.getConnection();
const cacheService = Cache.getServiceName();

module.exports = {
    addOnlineUser,
    deleteOnlineUserBySocketId,
    getOnlineUsers,
    getOnlineUsersSocketIds
};


async function addOnlineUser(user,socketId) {
    const newEntry = {
        userId: user,
        socket: socketId    
    };
    const onlineUsersCacheKey = 'onlineUsers';
    switch(cacheService){
        case 'REDIS':
            cacheClient.get(onlineUsersCacheKey, (err, data) =>{
                if(err){
                    const error = new Error("Online Failed");
                    error.status = "error";
                    return next(error);
                }
                if(data != null){
                    const onlineUsers = JSON.parse(data).filter(user => user.userId != newEntry.userId);
                    const newOnlineUsers = [
                        ...onlineUsers,
                        newEntry
                    ];
                    cacheClient.set(onlineUsersCacheKey, JSON.stringify(newOnlineUsers));
                }else{
                    cacheClient.set(onlineUsersCacheKey, JSON.stringify([newEntry]));
                }
            });
        break;    
        case 'NODECACHE':
            const currentOnlineUsersData = await cacheClient.get(onlineUsersCacheKey);

            if ( currentOnlineUsersData == undefined ){
                console.log(`newEntry  --  ${JSON.stringify([newEntry])}`);

                cacheClient.set(onlineUsersCacheKey, JSON.stringify([newEntry]));
            }else{
                console.log(user);
                const onlineUsers = JSON.parse(currentOnlineUsersData).filter(user => user.userId != newEntry.userId);
                console.log(onlineUsers);

                const newOnlineUsers = [
                    ...onlineUsers,
                    newEntry
                ];
                console.log(newOnlineUsers);
                cacheClient.set(onlineUsersCacheKey, JSON.stringify(newOnlineUsers));
            }
        break;
    }
    return true;
}

async function deleteOnlineUserBySocketId(socketId){
    const onlineUsersCacheKey = 'onlineUsers';
    switch(cacheService){
        case 'REDIS':
            cacheClient.get('onlineUsers', (err, data) =>{
                if(err){
                    return false
                }
                if(data != null){
                    const onlineUsers = JSON.parse(data).filter(u => u.socket !== socketId);
                    cacheClient.set("onlineUsers", JSON.stringify(onlineUsers));
                    return true;
                }
            });
        break;

        case "NODECACHE":
            const currentOnlineUsersData = await cacheClient.get(onlineUsersCacheKey);
            if ( currentOnlineUsersData !== undefined ){
                const onlineUsers = JSON.parse(currentOnlineUsersData).filter(u => u.socket !== socketId);
                cacheClient.set(onlineUsersCacheKey, JSON.stringify(onlineUsers));
                return true;
            }
        break;
    }
    return false;
}

async function getOnlineUsers(){
    const response = {
        "status":"success",
        "data":[]
    };

    try{
        const onlineUsersCacheKey = 'onlineUsers';
        switch(cacheService){
            case 'REDIS':
                cacheClient.get(onlineUsersCacheKey, (err, data) =>{
                    if(err){
                        const error = new Error("Get Online Failed");
                        error.status = "error";
                        return next(error);
                    }
                    if(data != null){
                        const onlineUsers = JSON.parse(data);
                        response.data = onlineUsers
                    }
                });
            break;
    
            case 'NODECACHE':
                const onlineUsersData = await cacheClient.get(onlineUsersCacheKey);
                if ( onlineUsersData !== undefined ){
                    const onlineUsers = JSON.parse(onlineUsersData);
                    response.data = onlineUsers
                }
            break
        }
        return response;
    }catch(err){
        return response;
    }
}


async function getOnlineUsersSocketIds(user){
    const onlineUsersCacheKey = 'onlineUsers';
    let result = [];
    try{
        switch(cacheService){
            case 'REDIS':
                result  =  await new Promise( async (resolve, reject) => {
                    await cacheClient.get(onlineUsersCacheKey,(err ,data) =>{
                        if(err) return reject(err);
                        if(data !== null){
                            const onlineUserData = JSON.parse(data).filter(u => u.userId == user);
                            if(onlineUserData.length > 0){
                                return resolve(onlineUserData[0].socket)
                            }else{
                                return resolve(null);
                            }
                        }
                    });
                });
            break;
            case 'NODECACHE':
                result  =  await new Promise( async (resolve, reject) => {
                    const data =  await cacheClient.get(onlineUsersCacheKey);
                    if(data !== undefined){
                        const onlineUserData = JSON.parse(data).filter(u => u.userId == user);
                        if(onlineUserData.length > 0){
                            return resolve(onlineUserData[0].socket)
                        }else{
                            return resolve(null);
                        }
                    }
                });
            break;
        }
        return result;
    }catch(err){
        return result;
    }
}