 const mongoose = require('mongoose');
 const slugify  = require('slugify'); 
 const User = require('./userModel')

//Mongoose Schema description
const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name!'],
    unique: true,
    trim: true,
    maxlength: [40, 'A tour name must have less or equal to 40 characters'],
    minlength:[10, 'A tour name must have more than or equal to 10 characters ']
  },  
  duration: {
    type: Number,
    required: [true, "A tour Must have a duration!"]
  },
  maxGroupSize:{
    type: Number,
    required: [true, "A Tour Must Have a Group Size!"]
  },
  difficulty:{
    type: String,
    required: [true, "A Tour Must Have a Difficulty"],
    enum: {
      values: ['easy', 'medium','difficult'],
      message: 'A tour must be either: easy, meduim, difficult'
    },
  },

  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1.0, "A Tour must have a rating above 1.0"], 
    max: [5.0, "A Tour must have a rating below 5.0"],
    Set: val => Math.round(val * 10)/10  //sets ratingsAverage value to 2 decimal place    
  },
  ratingsQuantity: {
    type: Number, 
    default: 0    
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price'],
  },
  priceDiscount: {
    type: Number,  
    validate: {
      //Custom validator 
      // this.property keyword only points to NEW Document being created/POST() 
        validator: function(val) {
          return val < this.price
        },
        message: "Discount price ({VALUE}) must be less than Regular Price!"
      }   
  },
  summary: {
    type: String,
    trim: true,
    required: [true, "Atour Must Have a Summary Description"]
  },
  description:{
    type: String,
    trim: true
  },
  imageCover: {
    type:String,
    required: [true, "A Tour Must Have a Cover Image"]
  },
  images: {
    type: [String]
  },
  createdAt:{
    type: Date,
    default: Date.now(),
    select: false
  },
  startDates: {
    type: [Date]
  },
  slug: String,
  secretTour:{
    type: Boolean,
    default: false
  },  

  startLocation: {
    //GeoJSON
    type: { 
      type: String,
      deafault: 'Point',
      enum: ['Point']
    },
    coordinates: [Number], 
    address: String,
    description: String, 
},
locations: [
  {
    type:String,
    default: ['Point'],
    address: String,
    description: String,
    day: Number 
  }
],
guides:[
  {
    type: mongoose.Schema.ObjectId,
    ref: 'User' 
  }
]
},

 { //schema options definition
  toJSON: { virtuals: true},
  toObject: { virtuals: true}  
});

//single field indexing 
//tourSchema.index({price:1});
tourSchema.index({slug: 1});

//compound fields Indexing
tourSchema.index({price:1,ratingsAverage:-1});

//Geospatial indexing 2dSphere
tourSchema.index({startLocation: '2dsphere'});

//VIRTUAL calculate 
tourSchema.virtual('durationWeeks').get( function (){
  return this.duration/7;
});

//virtual Populate reviews from Reviews Document
tourSchema.virtual('reviews',{
  ref: 'Reviews',
  foreignField: 'tour',
  localField:'_id'
});

//Document Middleware - Runs before the .save() and .create() and  not on insertMany()
 tourSchema.pre('save', function(next){
  this.slug = slugify(this.name, {lower: true}); 
  next();
 });


 //MIDDLEWARE TO PUPULATE GUIDES ARRAY
 tourSchema.pre('save', async function(next){
const guidesPromises = this.guides.map(async id => await User.findById(id));
this.guides = await Promise.all(guidesPromises);
  next();
 });

 tourSchema.pre('save', function(next){
   console.log("Will save the documents....");
   next();   
 })

 tourSchema.post('save', function (doc, next){
   console.log(doc); 
   next();
 }); 

//Query Middleware
tourSchema.pre(/^find/, function(next) {
//tourSchema.pre('find', function(next) {
  this.start = Date.now(); 
this.find({ secretTour:{$ne: true} });
next();
});

//populate guides middleware
tourSchema.pre(/^find/, function(next) {
  this.populate({ 
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
})
// populate reviews middleware
tourSchema.pre(/^find/, function(next) {
  this.populate({ 
    path: 'reviews',
    select: '-__v -passwordChangedAt -_id'
  });
  next();
})

tourSchema.post(/^find/, function(docs, next) {
//console.log(docs);
console.log(`The query Docs took ${Date.now() - this.start } milliseconds`);
next();
});

//AGGREGATE Middileware
// tourSchema.pre('aggregate', function (next) {
  
//   this.pipeline().unshift({$match: {secretTour:{$ne:true}}});
//    console.log(this)
//   next();
// })

//Mongoose Tour model
const Tour = mongoose.model('Tour', tourSchema); //Creates a document called tours from Tour name of model

module.exports = Tour;
