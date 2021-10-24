const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const announcementCommentSchema = new Schema({
    announcement:{
        type: Schema.Types.ObjectId,
        ref:'Announcement',
        required: true
    },
    sender:{
        type: Schema.Types.ObjectId,
        ref:'User',
        required: true,
    },
    message:{
        type:String,
        required:true
    }
},{timestamps:true});

module.exports = mongoose.model('AnnouncementComment',announcementCommentSchema)