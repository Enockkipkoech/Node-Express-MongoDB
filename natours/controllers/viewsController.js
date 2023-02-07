const Tour = require('../models/tourModels');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req,res)=>{
  // 1) Get tour data from db collections
  const tours = await Tour.find();

  // 2) Build template
  // 3) Render that template using tour data from 1)
  res.status(200).render('overview',{
    title: 'All-Tours',
    tours,
    user: 'Enock kipkoech'
  })
});

exports.getTour = catchAsync( async(req,res) => {
  // 1) Get the data, for the requested tour (inludes reviews and guides)
  const tour = await Tour.findOne({slug: req.params.slug}).populate({
    path:'reviews',
    fields: 'review rating user'
  });
  // 2) Build Template
  // 3) Render template using data from 1
    res.status(200).render('tour',{
        title: `${tour.slug}`,
        tour,
        user: 'Enock Kipkoech'       
    });
  })