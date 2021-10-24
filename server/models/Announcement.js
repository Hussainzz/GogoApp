const mongoose = require('mongoose');
const Schema = mongoose.Schema

const announcementSchema = new Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    attachment:{
        type:String
    },
    announcementBy:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required:true
    },
    room:{
        type: Schema.Types.ObjectId,
        ref: 'Room',
        required:true
    },
    announceOn:{
        type: Date,
        default:null
    },
    posted:{
        type:Schema.Types.Boolean,
        default:false
    }
},{timestamps:true})

module.exports = mongoose.model('Announcement', announcementSchema)