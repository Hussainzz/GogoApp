const mongoose = require('mongoose');

const notificationSchema   = new mongoose.Schema({
    sender: {type:mongoose.Schema.Types.ObjectId, ref:'User'}, // Notification creator
    receiver: [
        {
            user:{type:mongoose.Schema.Types.ObjectId, ref:'User'},
            read:{type: Boolean, default: false}, 
            read_at: {type: Date, default: Date.now}
        }
    ],
    message: String, // any description of the notification message 
    created_at:{type: Date, default: Date.now}
});

module.exports = Notification = mongoose.model('Notification', notificationSchema)