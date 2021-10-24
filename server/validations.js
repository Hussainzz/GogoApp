const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi)

const options = {
    abortEarly: false, // include all errors
    allowUnknown: true, // ignore unknown
};

const registrationValidation = (data) =>{
    const schema = Joi.object({
        name: Joi.string().min(5).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required()
    })
    return schema.validate(data,options);
}

const loginValidation = (data) =>{
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    })
    return schema.validate(data,options);
}

const resetPasswordValidation = (data) =>{
    const schema = Joi.object({
        resetToken: Joi.string().required(),
        password: Joi.string().min(6).required()
    })
    return schema.validate(data,options);
}

//["test@test.com","test@test.com","test@test.com","test@test.com"]
const createRoomValidation = (data) =>{
    const schema = Joi.object({
        roomName: Joi.string().min(5).required(),
        roomParticipants: Joi.array().max(parseInt(process.env.PARTICIPANT_LIMIT)).items(Joi.string().email().messages({
            'string.empty':"room participant value cannot be empty",
            'string.email':'Invalid room participant email passed'
        })).messages({
            'array.base':"room participant must be list of emails",
            'array.max':"only 3 roomParticipant allowed",
        })
    })
    return schema.validate(data,options);
}

const markReadNotificationSchema = (data) =>{
    const schema = Joi.object({
        notificationId: Joi.string().required()
    })
    return schema.validate(data,options);
}

const createDiscussionValidation = (data) =>{
    const schema = Joi.object({
        roomToken: Joi.string().required(),
        message: Joi.string().required()
    })
    return schema.validate(data,options);
}

const createAnnouncementCommentValidation = (data) =>{
    const schema = Joi.object({
        announcement: Joi.objectId().required(),
        message: Joi.string().max(90).required(),
        roomToken: Joi.string().required()
    })
    return schema.validate(data,options);
}

const getDiscussionValidation = (data) =>{
    const schema = Joi.object({
        roomToken: Joi.string().required(),
    })
    return schema.validate(data,options);
}

module.exports.registrationValidation = registrationValidation;
module.exports.loginValidation = loginValidation;
module.exports.resetPasswordValidation = resetPasswordValidation;

//rooms
module.exports.createRoomValidation = createRoomValidation;
module.exports.createDiscussionValidation = createDiscussionValidation;
module.exports.getDiscussionValidation = getDiscussionValidation;
module.exports.createAnnouncementCommentValidation = createAnnouncementCommentValidation;

//notifications
module.exports.markReadNotificationSchema = markReadNotificationSchema;
