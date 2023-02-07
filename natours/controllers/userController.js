const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const factory = require('./handlerFactory');
const Tour = require('../models/tourModels');

//USERS ROUTES FUNCTIONS

const filterObj = (obj, ...allowedFields) =>{
  const newObj = {};
  Object.keys(obj).forEach(el =>{
    if(allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
}

// /me endPoint Router
exports.getMe = (req, res,next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req,res,next) => {
  //1) Check if data has password or passwordConfirm
  if(req.body.password || req.body.passwordConfirm){
    return next( new AppError('This route is not for password updates. Please use /updateMyPassword.', 400));
  }

  //2) filter unwanted field names in req.body that are not allowed in the body.
  const filteredBody = filterObj(req.body, 'name','email');

  //3) Update the user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody,{
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'Success',
    data:{
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync( async (req, res, next) =>{
  await User.findByIdAndUpdate(req.user.id, {active: false});
  res.status(204).json({
    status: 'Success',   
    Data: null
  })
})

//GET All users
exports.getAllUsers = factory.getAll(User);
// exports.getAllUsers = catchAsync(async (req, res) => {
//   const users = await User.find();

//   res.status(200).json({
//     status: 'Success',
//     results: users.length,
//     data:{
//       users
//     }   
//   });
// });

//POST createUser
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead',
  });
};

//GET Single user ById
exports.getUser = factory.getOne(User);

//Do NOT Update passwords with this!
exports.updateUser = factory.updateOne(User)

//DELETE User ById

exports.deleteUser = factory.deleteOne(User);

// exports.deleteUser = (req, res) => {
//   res.status(201).json({
//     status: 'error',
//     message: 'This route is not yet implemented',
//   });
// };
