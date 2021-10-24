const express = require("express");
const router = express.Router();
const waterfall = require('async-waterfall');
const User = require("../models/User");
const { registrationValidation, loginValidation, resetPasswordValidation } = require("../validations");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const verifyToken = require('../middleware/verifyToken');

const Mail = require('../integration/mailer/Mail');
const Sendgrid = require('../integration/mailer/Sendgrid');

const {
  generateJwtToken,
  generateJwtRefreshToken,
  saveUserRefreshToken,
  getRefreshTokenRecord,
  revokeUserToken
} = require("../controllers/auth");

/* Register a user */
router.post("/register-user", async (req, res, next) => {
  const { error } = registrationValidation(req.body);
  
  if (error) {
    const err = new Error(error.details.map(x => x.message).join(', '));
    err.status = "error";
    err.statusCode = 400;
    next(err);
    return;
  }

  try {
    const user = await User.findOne({ email: req.body.email });
    if (user)
      return res
        .status(400)
        .json({ status: "error", message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });
    await newUser.save();

    res
      .status(200)
      .json({ id: newUser._id, status: "success", message: "User Registered" });
  } catch (e) {
    const err = new Error("Registering user failed");
    err.status = "error";
    next(err);
  }
});

/* Login a user */
router.post("/login", async (req, res, next) => {

  const { error } = loginValidation(req.body); 
  if (error) {
    const err = new Error(error.details.map(x => x.message).join(', '));
    err.status = "error";
    err.statusCode = 400;
    /* next(err);
    return; */
    return res
    .status(400)
    .json({ "auth-token": "", message: error.details.map(x => x.message).join(', ') });
  }

  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user)
      return res
        .status(400)
        .json({ "auth-token": "", message: "Invalid Credentials" });

    const isPasswordValid = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!isPasswordValid)
      return res
        .status(400)
        .json({ "auth-token": "", message: "Invalid Credentials" });

    const tokenData = { userId: user._id };
    const authToken = generateJwtToken(tokenData);
    const refreshToken = generateJwtRefreshToken(tokenData);

    await saveUserRefreshToken(tokenData.userId, refreshToken).save();

    res.cookie("gogoToken", refreshToken, {
      httpOnly: true,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    res.status(200).json({ "auth-token": authToken });
  } catch (e) {
    console.log(e);
    const err = new Error("Login failed");
    err.status = "error";
    next(err);
  }
});

/* referesh user token */
router.post("/refresh-token", async (req, res, next) => {
  const token = req.cookies.gogoToken;
    console.log(token);
  if (!token) {
    const error = new Error("Unauthorized");
    error.status = "error";
    error.statusCode = 401;
    next(error);
    return;
  }

  try {
     jwt.verify(token, process.env.REFERESH_SECRET)
  } catch (e) {
      console.log(e);
    const error = new Error("Token Expired");
    error.status = "error";
    error.statusCode = 401;
    return next(error);
    
  }
 
  try {
    const {active, refreshTokenRecord} = await getRefreshTokenRecord(token);
    if(!active) {
        const error = new Error("Token Record Expired");
        error.status = "error";
        error.statusCode = 401;
        next(error);
        return;
    }

    const { user } = refreshTokenRecord; //userId

    const tokenData = { userId: user._id };
    const newRefreshToken = generateJwtRefreshToken(tokenData);

    refreshTokenRecord.revoked = Date.now();
    refreshTokenRecord.replacedByToken = newRefreshToken;
    await refreshTokenRecord.save();

    //adds a new refresh token record as we revoked the previous refresh token
    await saveUserRefreshToken(user, newRefreshToken).save();

    const newAuthToken = generateJwtToken(tokenData);

    res.cookie("gogoToken", newRefreshToken, {
      httpOnly: true,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    res.status(200).json({ "auth-token": newAuthToken , status:"success"});

  } catch (e) {
    const err = new Error("Something went wrong!");
    err.status = "error";
    next(err);
  }
});

/* revoke a user token */
router.delete('/revoke-token',verifyToken, async(req,res,next) => {
    const token = req.body.token || req.cookies.token;
    if(!token){
        const error = new Error("Token is required");
        error.status = "error";
        error.statusCode = 400;
        next(error);
        return;
    }

    if(!req.user.ownsToken(token)){
        const error = new Error("Unauthorized");
        error.status = "error";
        error.statusCode = 403;
        next(error);
        return;
    }

    try {
      await revokeUserToken(token);

      res.status(200).json({
          'status': 'success',
          'message':'Token Revoked'
      })
        
    } catch (e) {
        const err = new Error("Revoke Token Failed");
        err.status = "error";
        next(err);
    }
});

/* forgot-password */
router.post('/forgot-password', async (req, res, next) => {

    try {
      const user = await User.findOne({email: req.body.email});

      if(!user) {
        const err = new Error("User with this email does not exist");
        err.status = "error";
        err.statusCode = 400;
        next(err);
        return;
      }

      waterfall([
        async function(done) {
          const user = await User.findOne({email: req.body.email});

          if(!user) {
            done('User not found.',null,null);
          }
        
          user.generatePasswordReset();
          await user.save();
          done(null,user.email,user.resetPasswordToken)
        },
        function(email,token,done) {
          var data = {
            receiver:email,
            sender:'arfazshaikh0212@gmail.com',
            templateId:process.env.PASSWORD_RESET_EMAIL_TEMPLATE,
            reset_url: `${process.env.CLIENT_BASE_URL}/reset-password/${token}`
          };
    
          const mail = new Mail();
          const sent = mail.sendMail(new Sendgrid(data))
          if(!sent){
            return res.status(200).json({
              'status': 'failed',
              'message':'Problems sending email, Please try again'
            })
          }

          res.status(200).json({
            'status': 'success',
            'message':'Password reset link has been sent, Kindly check your email for further instructions'
          })
          
        }
      ], function(err) {
        const errz = new Error(err);
        errz.status = "error";
        errz.statusCode = 400;
        next(errz);
      });
      
    } catch (error) {
      console.log(error);
      const err = new Error("Forgot Password Failed");
      err.status = "error";
      next(err);
    }
   
});

router.post(`/validate-reset-token`, async (req, res, next) => {
    const resetToken = req.body.resetToken;
    try {
      const userByResetToken = await User.findOne({resetPasswordToken : resetToken})
      if (!userByResetToken || !userByResetToken.isResetPasswordTokenValid) {
        const err = new Error("Reset Password Token Expired");
        err.status = "error";
        err.statusCode = 400;
        return next(err);
      }

      res.status(200).json({
        'status': 'success',
        'message':'Reset Password Token Is Valid'
      })

    }catch (error) {
      console.log(error);
      const err = new Error("Validate Reset Password Token Failed");
      err.status = "error";
      next(err);
    }
})

router.put(`/reset-password`,async (req, res, next) => {
  const { error } = resetPasswordValidation(req.body);
  
  if (error) {
    const err = new Error(error.details.map(x => x.message).join(', '));
    err.status = "error";
    err.statusCode = 400;
    return next(err);
  }

  const resetToken = req.body.resetToken;
    try {
      const user = await User.findOne({resetPasswordToken : resetToken})
      if (!user || !user.isResetPasswordTokenValid) {
        const err = new Error("Please check the reset password link");
        err.status = "error";
        err.statusCode = 400;
        return next(err);
      }

      const salt = await bcrypt.genSalt(10);
      const newHashedPassword = await bcrypt.hash(req.body.password, salt);

      user.password = newHashedPassword;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      res.status(200).json({
        'status': 'success',
        'message':'Reset password success'
      })

    }catch (error) {
      console.log(error);
      const err = new Error("Reset password failed");
      err.status = "error";
      next(err);
    }
})


module.exports = router;
