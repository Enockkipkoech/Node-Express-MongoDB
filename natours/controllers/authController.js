const crypto = require('crypto')
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const sendEmail = require('../utils/email')

const createSendToken = (user, statusCode, res) =>{
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date( Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24* 60 * 60 * 1000),    
    httpOnly: true
  };
  
  if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  //Remove password from Output
  
  user.password = undefined;

  res.status(statusCode).json({
    status: "Success",
    token,
    data:{
      user
    }
  });
}


const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  createSendToken(newUser, 201, res)
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1) Check if email or password exit
  if (!email || !password) {
    return next(new AppError("Please provide email and Password!", 400));
  }

  //2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  //3) if everything is ok, send token to client
  createSendToken(user, 200, res);
 
});

exports.protect = catchAsync(async (req, res, next) => {
  //1) Getting token and check if it's there

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  //2)Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token no longer exist.", 401)
    );
  }

  //4) Check if user changed password afetr the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please logn again.", 401)
    );
  }

  //Grants access to protected Route
  req.user = currentUser;
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You  do not have permission to perform this Action💥", 403)
      )
    }
    return next();
  }

exports.forgotPassword =catchAsync(async (req,res,next) => {
    //1) Get User based on posted email
    const user = await User.findOne({email: req.body.email});
    if(!user){
        return next(new AppError('💥There is no user with that email address.', 404))
    }
    
    // 2) Generate the Random Reset Token
    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave: false});

    //3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Forgot your password? \n Submit a PATCH request with your new password and passwordConfirm to ${resetURL}. \nIf you didn't forget your password, please ignore this email.`

    try{
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (Valid for 10 mins)',
      message
    });
      
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });

  } catch(err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validationBedforeSave: false});

    return next(new AppError('There was an error sending the email. Try again later!'), 500)

  }

  });


exports.resetPassword = catchAsync(async (req,res,next) => {
  //1) Get user based on the token
  const hashedToken = crypto
  .createHash('sha256')
  .update(req.params.token)
  .digest('hex');

  const user = await User.findOne({paswordResetToken: hashedToken, passwordResetExpires: {gt:Date.now()}});

  //2) If token has not expired, and there is user, set new password
  if(!user){
    return next(new AppError('Invalid Token or Token has expired', 400))
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = udefined;
  await user.save()

  //3) update changedPasswordAt property for the user
  //4) Log the user in, send JWT
  createSendToken(user, 200, res);  
});

 exports.updatePassword =catchAsync( async (req,res,next) => {
   //1) Get user from collection
   const user = await User.findById(req.user.id).select('+password');

   //2) Check if posted current password is correct
   if(!(await user.correctPassword(req.body.passwordCurrent, user.password))){
     return next( new AppError('Your current password is wrong.', 401))
   }
   //3) if so, update password
   //NB usingf user.findByIdAndUpdate will not work as intended
   user.password = req.body.password;
   user.passwordConfirm = req.body.password;
   await user.save();

   //4) log user in,sent JWT
   createSendToken(user, 200, res);

 })