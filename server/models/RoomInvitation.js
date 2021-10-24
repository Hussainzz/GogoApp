const mongoose = require('mongoose');

const Schema = mongoose.Schema; 

const roomInvitationSchema = new Schema({
    room:{
        type: Schema.Types.ObjectId,
        ref: 'Room',
        required:true
    },
    to:{
        type:Schema.Types.ObjectId,
        ref:"User", //user model
        required:true
    },
    enrolled:{
        type:Schema.Types.Number,
        default:0 //0-pending 1-accepted 2-rejected
    }
},{timestamps:true});

module.exports = mongoose.model("RoomInvitation",roomInvitationSchema);