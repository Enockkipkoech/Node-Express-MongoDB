const mongoose = require('mongoose');
const Tour = require('./tourModels');

const reviewsSchema = new mongoose.Schema({
review:{
    type: String,
    required: [true, 'Review can not be empty'],
    trim:true
},
rating:{
    type:Number,    
    min: 1.0,
    max: 5.0,
    default: 0
},
createdAt: {
    type: Date,
    default: Date.now()
},
tour:{
    type: mongoose.Schema.ObjectId,    
    ref: 'Tour',
    required:[true, 'Review must belong to a tour']
  },
 user:{ 
 type: mongoose.Schema.ObjectId,
 ref: 'User',
 required: [true, 'Review must belong to a user']
 }
}, 
{
    toJSON: {virtuals: true},
    toObject: {virtuals:true}
});

//Prvent dublicate Reviews from same user for same tour
reviewsSchema.index({tour:1, user:1}, {unique: true}); 

//populate guides middleware
reviewsSchema.pre(/^find/, function(next) {
    // this.populate({ 
    //   path:'tour',
    //   select:"name, id"      
    // }).populate({ 
    //     path:'user',
    //     select:"name, photo"      
    //   });
    this.populate({ 
          path:'user',
          select:"name photo"      
        });
    next();
  });

  //Static method to calculate statistics for review ratings(ratingsAverage) & no of ratings(nRatings)
  reviewsSchema.statics.calcAverageRatings = async function(tourId){
      const stats = await this.aggregate([
          {
              $match: {tour: tourId}
          },
          {
              $group:{
                  _id: '$tour',
                  nRating: {$sum: 1},
                  avgRating: {$avg: '$rating'}
              }
          }
      ]);
      //console.log(stats);

//Save statistics to current Tour
if(stats.length > 0 ){
    await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: stats[0].nRating,
        ratingsAverage: stats[0].avgRating
      });      
  } else {
    await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: 0,
    ratingsAverage: 4.5
  });    
  }
}      

//Post middleware Call the calcAverage Ratings function after a new rating has been added.  
reviewsSchema.post('save', function(){
// this will point to current review
this.constructor.calcAverageRatings(this.tour); 
  }); 

  //findByIdAndUpdate
  //findByIdAndDelete
  //Method to claculate stats in case of above operations
  reviewsSchema.pre(/^findOneAnd/, async function(next){
      this.rating = await this.findOne();
     // console.log(this.rating);
      next();
  });

  reviewsSchema.post(/^findOneAnd/, async function(){
      // await this.findOne(); does NOT work here, query has already executed.
      await this.rating.constructor.calcAverageRatings(this.rating.tour);
     });


const Reviews = mongoose.model('Reviews',reviewsSchema);

module.exports = Reviews;