const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roomDiscussionMessages = new Schema({
    discussionId:{
        type: Schema.Types.ObjectId,
        ref:'RoomDiscussion',
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
    },
    sentOn:{
        type:Date,
        required:true
    }
},{ createdAt: 'created_at', updatedAt: 'updated_at' })

module.exports = mongoose.model('RoomDiscussionMessages', roomDiscussionMessages)