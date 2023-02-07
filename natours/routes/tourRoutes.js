const express = require('express');
const tourControllers = require('../controllers/tourController');
const authController = require('../controllers/authController');
//const reviewController = require('../controllers/reviewsController')
const reviewRouter = require('../routes/reviewsRoutes')

//Tours Routes Calls
const router = express.Router(); 


  // //POST /tour/tourId/reviews
  // //GET /tour/tourId/reviews
  // //GET /tour/tourId/reviews/reviedId
  // router.route('/:tourId/reviews').post(authController.protect,authController.restrictTo('user'), reviewController.createReview)
router.use('/:tourId/reviews', reviewRouter)

//ALIAS Middleware Router
router.route('/top-5-cheap').get(tourControllers.aliasTopTours,tourControllers.getAllTours);

//Tour STATISTICS Router
router.route('/tour-stats').get(tourControllers.getTourStats);

//MONTHLYPLAN Router
router.route('/monthly-plan/:year').get( authController.restrictTo('admin','lead-guide','guides'),tourControllers.getMonthlyPlan);

//Geospatial Query for Tours within radius
///tours-within/233/center/-40,45/unit/km
router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourControllers.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourControllers.getDistances);

//router.param('id', tourControllers.checkID);
router
  .route('/')
  .get(tourControllers.getAllTours)
  .post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourControllers.createTour);
router
  .route('/:id')
  .get(tourControllers.getTour)
  .patch(authController.restrictTo('admin','lead-guide'), tourControllers.updateTour)  
  .delete(authController.protect, authController.restrictTo('admin','lead-guide'),tourControllers.deleteTour);


 
module.exports = router;
