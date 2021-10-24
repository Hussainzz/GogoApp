const mongoose = require('mongoose');

const Schema = mongoose.Schema; 

const roomSchema = new Schema({

    roomName:{
        type:String,
        required:true
    },
    roomToken:{
        type:String,
        required:true
    },
    roomOwner:{
        type:Schema.Types.ObjectId,
        ref:"User", //user model
        required:true
    },
    roomParticipants:[{
        type:Schema.Types.ObjectId,
        ref:"User" 
    }],
    isRoomPrivate:{
        type:Schema.Types.Boolean,
        default:false
    }
},{timestamps:true});

module.exports = mongoose.model("Room",roomSchema);