const NodeCache = require('node-cache');
const redis = require('redis');
class Cache {
    constructor() {
        this.connected = false
        this.client = null
        this.serviceName = process.env.CACHE_SERVICE
    }
   getConnection() {
        if(this.connected) return this.client
        else {

            switch(this.serviceName){
                case 'REDIS':
                    this.client = getRedisConnection();
                    this.connected = true;
                break;
                case "NODECACHE":
                    this.client = new NodeCache();
                    this.connected = true;
                break;    
            }
            return this.client
        }
    }

    getServiceName() {
        return this.serviceName;
    }

    getRedisConnection() {
        let redisConf = {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
            password: process.env.REDIS_PASSWORD
        };

        if(process.env.NODE_ENV !== 'production'){
            redisConf = {
                host:  'localhost',
                port:'6379'
            }
        }

        return redis.createClient(redisConf);
    }

    deleteKeyFromCache(key) {
        const client = this.client;
        switch(this.serviceName){
            case 'REDIS':
                client.del(key);
            break;
            case "NODECACHE":
                client.del(key);
            break;
        }
    }

    async getOrSetCache(key, exp, cb){
        return new Promise(async (resolve, reject) =>{
            const client = this.client;

            switch(this.serviceName){
                case 'REDIS':
                    client.get(key, async(err, data) => {
                        if(err) return reject(err)
                        if(data != null) return resolve(JSON.parse(data));
                        const freshData = await cb()
                        if(exp != null){
                            client.setex(key,exp,JSON.stringify(freshData));
                        }else{
                            client.set(key,JSON.stringify(freshData));
                        }
                        resolve(freshData)
                    })
                break;
                case "NODECACHE":
                    const data = await client.get(key);
                    if ( data != undefined ) return resolve(JSON.parse(data));
                    const freshData = await cb()
                    if(exp != null){
                        client.set(key,JSON.stringify(freshData),exp);
                    }else{
                        client.set(key,JSON.stringify(freshData));
                    }
                    resolve(freshData)
                break;    
            }

            
        })
    }

    /* async cacheToDB(key, model, data) {
        try {
            const insertedData = await model.insertMany(data);
            console.log(insertedData);
        } catch (error) {
            console.log(error)
        }
    } */

    async deleteRecordFromCache(key, delKey, delValue, nested=null){
        return new Promise(async(resolve, reject) =>{
            const client = this.client;
            switch(this.serviceName){
                case 'REDIS':
                    client.get(key, async(err, data) => {
                        if(err) return reject(err)
                        if(data != null) {
                            const currentData = JSON.parse(data);
                            let updatedData = null
                            if(nested != null){
                                updatedData = currentData.filter(d => d[nested][delKey] !== delValue);
        
                            }else{
                                updatedData = currentData.filter(d => d[delKey] !== delValue);
                            }
                            if(updatedData!= null) client.setex(key,900,JSON.stringify(updatedData));
                        }
                        return resolve(true);
                    });
                break;

                case 'NODECACHE':
                    const data = await client.get(key);
                    if(data !== undefined) {
                        const currentData = JSON.parse(data);
                        let updatedData = null
                        if(nested != null){
                            updatedData = currentData.filter(d => d[nested][delKey] !== delValue);
    
                        }else{
                            updatedData = currentData.filter(d => d[delKey] !== delValue);
                        }
                        if(updatedData!= null) client.set(key,JSON.stringify(updatedData),900);
                    }
                    return resolve(true);
                break;
            }
        });
    }

    async delRedisWithPattern(keyPatter){
        const client = this.client;
        client.scan("0", "MATCH", keyPatter ,(e , r)=>{
            if(e) return;
            if(r[1].length){
                r[1].forEach(d => {
                    client.del(d)
                })
            }else{
                console.log('no redis to del');
            }
        });
    }
}

module.exports = new Cache()