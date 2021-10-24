const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {

    const token = req.headers['x-gogo-auth-token'];

    if(!token || token === 'undefined') {
        const error = new Error('Unauthorized')
        error.status = 'error'
        error.statusCode = 401;
        next(error)
        return;
    }
    try {
        const data = jwt.verify(token, process.env.JWT_SECRET)

        req.user = data;
       
        const user = await User.findById(req.user.userId);
        req.user.name = user.name;
        const refreshTokens = await RefreshToken.find({ user: user._id });
        req.user.ownsToken = token => !!refreshTokens.find(x => x.token === token);

        next();
    } catch (e) {
        //console.log(e);
        const error = new Error('Invalid Token')
        error.status = 'error'
        error.statusCode = 401;
        return next(error)
    }
}

module.exports = verifyToken;