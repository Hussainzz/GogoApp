const mongoose = require('mongoose');
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    resetPasswordToken:{
        type:String,
        required:false
    },
    resetPasswordExpires:{
        type:Date,
        required:false
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

userSchema.virtual('isResetPasswordTokenValid').get(function () {
    return Date.now() <= this.resetPasswordExpires;
});

userSchema.methods.generatePasswordReset = function() {
    this.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordExpires = Date.now() + 3600000; //expires in an hour
};


module.exports  = User = mongoose.model('User', userSchema);