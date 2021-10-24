const mongoose = require('mongoose');
const redis = require('redis');
class Redis {
    constructor() {
        this.host = process.env.REDIS_HOST || 'localhost'
        this.port = process.env.REDIS_PORT || '6379'
        this.connected = false
        this.client = null

    }
   getConnection() {
        if(this.connected) return this.client
        else {
            let redisConf = {
                host: this.host,
                port: this.port,
                password: process.env.REDIS_PASSWORD
            };

            if(process.env.NODE_ENV !== 'production'){
                redisConf = {
                    host:  'localhost',
                    port:'6379'
                }
            }

           this.client =  redis.createClient(redisConf)
            return this.client
        }

    }

    getOrSetCache(key, exp, cb){
        return new Promise((resolve, reject) =>{
            const client = this.client;
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
        return new Promise((resolve, reject) =>{
            const client = this.client;
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
            })
        })
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

module.exports = new Redis()