const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const roomDiscussion = new Schema({
    roomToken:{
        type:String,
        required:true
    },
    room:{
        type: Schema.Types.ObjectId,
        ref: 'Room',
        required:true
    },
},{ createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = mongoose.model('RoomDiscussion',roomDiscussion)