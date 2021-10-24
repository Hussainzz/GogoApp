const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');

module.exports = {
    generateJwtToken,
    generateJwtRefreshToken,
    saveUserRefreshToken,
    getRefreshTokenRecord,
    revokeUserToken
};


/* Generates a new JWT token with payload default expiry is 15min */
function generateJwtToken(payload, expiry='1h') {
    return jwt.sign(payload,  process.env.JWT_SECRET, { expiresIn: expiry });
}

/* Generates a new Refresh JWT token with payload , Token expiry is 24h*/
function generateJwtRefreshToken(payload) {
    return jwt.sign(payload,  process.env.REFERESH_SECRET, { expiresIn: '24h' });
}

function saveUserRefreshToken(userId, refreshToken) {
    return new RefreshToken({
        user: userId,
        token: refreshToken,
        expires: new Date(Date.now() + 24*60*60*1000)
    });
}

async function getRefreshTokenRecord(token) {
    const refreshTokenRecord = await RefreshToken.findOne({ token }).populate('user');
    
    let activeTokenRecord = true;
    if (!refreshTokenRecord || !refreshTokenRecord.isActive) {
        activeTokenRecord = false;
    };

    return {
        active: activeTokenRecord,
        refreshTokenRecord:refreshTokenRecord
    };
}

async function revokeUserToken(token){
    const {active, refreshTokenRecord} = await getRefreshTokenRecord(token);
    if(!active) {
        const error = new Error("Invalid Token");
        error.status = "error";
        error.statusCode = 403;
        next(error);
        return;
    }
    /* refreshTokenRecord.revoked = Date.now();
    await refreshTokenRecord.save(); */
    await RefreshToken.deleteMany({user: refreshTokenRecord.user});
}