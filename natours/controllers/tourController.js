const { Model } = require('mongoose');
const Tour = require('../models/tourModels');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');

const factory = require('./handlerFactory');

// // Fetching data from JSON File (tours-simle.json)
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

/* +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
// CRUD HANDLER FUNCTIONS

//ALIAS TopTours Middleware
exports.aliasTopTours = (req, res, next) => {
  req.query.limit= "5";
  req.query.sort ='-ratingsAverage,price';
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();   
};

//GET All Tours
exports.getAllTours = factory.getAll(Tour)

// exports.getAllTours = catchAsync(async (req, res, next) => {  
   
//     //EXECUTE QUERY  
//     const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().paginate();  
//     const tours = await features.query;
    
//     //SEND RESPONSE
//     res.status(200).json({ 
//       status: 'Success',
//       results: tours.length,
//       data: {
//         tours          
//       },
//     })
//     next()  
// });

//GET single Tour ById
exports.getTour = factory.getOne(Tour, {path: 'reviews'});

// exports.getTour = catchAsync(async (req, res, next) => {
//   //Tour.findOne({_id: req.params.id})
//     const tour = await Tour.findById(req.params.id).populate('reviews');

//     if(!tour){
//       return next(new AppError("No tour found with that ID !", 404))
//     };

//     res.status(200).json({
//       status: "Success",
//       data: {
//         tour,
//       },
//     });
//  });



//POST Tour into tours Routes File
exports.createTour = factory.createOne(Tour)
// exports.createTour = catchAsync(async (req, res, next) => {
//     // const newTour = new Tour({})
//     // newTour.save()

//     const newTour = await Tour.create(req.body);

//     res.status(201).json({
//       status: 'Success',
//       data: {
//         tour: newTour,
//       },
//     });
//     next()
// });

//PATCH Tour data element(s) ById

exports.updateTour = factory.updateOne(Tour)
// exports.updateTour = catchAsync(async (req, res, next) => {

//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true,
//     });
     
//     if(!tour){
//       return next(new AppError("No tour found with that ID !", 404))
//     };

//     res.status(200).json({
//       status: 'Success',
//       data: {
//         tour,
//       },
//     });
//  });

//Delete Tour ById
exports.deleteTour = factory.deleteOne(Tour)

// exports.deleteTour =  catchAsync(async (req, res, next) => {

//   const tour = await Tour.findByIdAndDelete(req.params.id);

//     if(!tour){
//       return next(new AppError("No tour found with that ID !", 404))
//     };

//     res.status(204).json({
//       status: 'Success',
//       data: null
//     });

// });

exports.getTourStats = catchAsync(async (req,res, next)=>{  

    const stats = await Tour.aggregate([
      {
        $match: {ratingsAverage:{$gte:4.5}}
      },
      {
        $group:{ 
          //_id: '$ratingsAverage',
         _id: { $toUpper:'$difficulty'}, 
          numTours: { $sum: 1},
          numRating: { $sum: '$ratingsQuantity' },
          avgRating: { $avg:'$ratingsAverage' },
          avgPrice: { $avg:'$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }                    
        }
      },
      {
        $sort: { avgPrice: 1 }
      },
      // {
      //   $match: { _id: {$ne: 'EASY'}}
      // }
    ]);

    res.status(200).json({
      status: 'Success',
      data: {
        stats,
      },
    });
 })

exports.getMonthlyPlan=  catchAsync(async (req,res,next) => {
 
    const year = req.params.year * 1; //2021
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates'
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          }
        }
      },
      {
        $group:{
          _id: { $month: "$startDates"},
          numTourStarts:{ $sum: 1 },
          tours: { $push: "$name" }
        }
      },
      {
        $addFields: {month: '$_id'}
      },
      {
        $project: {_id: 0}
      },
      {
        $sort: { numTourStarts: -1 }
      },
      {
        $limit: 12 //Number of docs to display
      }
    ]);

    res.status(200).json({
      status: 'Success',
      results: plan.length,
      data: {
      plan
      },
    });
});

// '/tours-within/:distance/center/:latlng/unit/:unit'
//  /tours-within/233/center/-40,45/unit/km
exports.getToursWithin = catchAsync( async (req,res,next) => {
  const {distance, latlng, unit} = req.params;
  const [lat, lng] = latlng.split(',');
  
const radius = unit === 'mi' ? distance / 3963.2 : distance/6378.1;

  if(!lat || !lng) {
    next(
      new AppError('Please provide latitude and longitude in the format lat,lng', 400)
    );
  }

  //console.log(distance, lat, lng, unit);
  const tours = await Tour.find({
    startLocation: {$geoWithin: {$centerSphere: [[lng,lat], radius] } } 
  });

  res.status(200).json({
    status:'success',
    results: tours.length,
    data: {
      data:tours
    }
  });
}); 

exports.getDistances = catchAsync(async (req,res,next) => {
  const { latlng, unit} = req.params;
  const [lat,lng] = latlng.split(',')

  if(!lat || !lng) {
    next(
      new AppError('Please provide latitude and Longitude in the format lat,lng.', 400)
    );
  }

  console.log(lat,lng);

  //conversion from Meters to miles or kms- used in distanceMultiplier
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type:'Point',
          coordinates: [lng * 1, lat * 1]
        },
          distanceField: 'distance',
          distanceMultiplier:multiplier        
      }
    },{
      $project:{
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'Success',
    data: {
      data: distances
    }
  })

});



   // // 1a) Filtering
    // console.log(req.query);

    // const queryObj = {...req.query};
    // const excludedFields = ['page', 'sort', 'limit', 'fields'];
    // excludedFields.forEach(el => delete queryObj[el]);        
       
    // //const query = Tour.find().where('duration').equals(5).where('difficulty').equals('easy');      
    
    // // 1b) Advanced Filtering     
    // let queryStr = JSON.stringify(queryObj);   
    // queryStr = queryStr.replace(/\b(gte|gt|lte|lt|in)\b/g, match => `$${match}`);          
   
    // let query = Tour.find(JSON.parse(queryStr)); 

    // //3) Sorting

    // if(req.query.sort){
    //   const sortBy = req.query.sort.split(',').join(' ');
    //   query =query.sort(sortBy);
    // }else {
    //   query = query.sort('-createdAt');
    // }

    // //3) Fields Limiting
    // if(req.query.fields){
    //   const fields = req.query.fields.split(',').join(' ')
    //   query = query.select(fields)
    // } else{
    //   query = query.select('-__v')
    // }

    // //4)Pagination
    // const page = req.query.page * 1 || 1;
    // const limit = req.query.limit * 1 || 100;    
    // const skip = (page - 1) * limit
    // query = query.skip(skip).limit(limit)

    // if(req.query.page){
    //   const numTours = await Tour.countDocuments();
    //   if(skip >= numTours) throw new Error("This Page Does not Exist!");
    // }