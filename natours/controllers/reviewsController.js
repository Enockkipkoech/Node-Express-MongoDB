const Reviews = require('../models/reviewsModel');
const AppError= require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const factory = require('./handlerFactory');

exports.getAllReviews = factory.getAll(Reviews); 
// exports.getAllReviews = catchAsync(async (req,res, next) => {
//     let filter ={};
//     if(req.params.tourId) filter= {tour: req.params.tourId};
//     const reviews = await Reviews.find(filter);

//     if(!reviews) {
//         return next( new AppError('No review found!', 400))
//     }

//     res.status(200).json({
//         status: 'Success',
//         results: reviews.length,
//         data:{
//             reviews
//         }    
//     })
//     next();
// });

//Allow nested routes middleware
exports.setTourUserIds = (req, res, next) =>{ 
 if(!req.body.tour) req.body.tour = req.params.tourId;
 if(!req.body.user) req.body.user = req.user.id;
 next();
}

exports.createReview = factory.createOne(Reviews);

// exports.createReview = catchAsync(async (req,res,next) =>{
   

//     const newReview = await Reviews.create(req.body);

//     if(!newReview) {
//         return next( new AppError('Review is required field!', 400))
//     }

//     res.status(201).json({
//         status: 'Success',
//         data:{
//             review: newReview
//         }
//     })
//     next();
// });
exports.getReview = factory.getOne(Reviews);
exports.updateReview = factory.updateOne(Reviews);
exports.deleteReview = factory.deleteOne(Reviews);
