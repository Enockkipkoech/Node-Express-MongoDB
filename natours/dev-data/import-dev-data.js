const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Tour = require('../models/tourModels');
const User = require('../models/userModel');
const Review = require('../models/reviewsModel');


dotenv.config({ path: `../config.env` });

 /*const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
); */

mongoose
  //Connection to Localhost database 
  .connect(process.env.DATABASE_LOCAL, {
    //Connection to online hosted  database
   //.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Mongo DB Connection Successful!'));

//Reading JSON File

const tours = JSON.parse(fs.readFileSync(`${__dirname}/data/tours.json`, 'utf-8'))
const users = JSON.parse(fs.readFileSync(`${__dirname}/data/users.json`));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/data/reviews.json`));

//IMPORT DATA INTO DB
const importData = async () =>{
    try{
        await Tour.create(tours)
        await User.create(users, {validateBeforeSave: false})
        await Review.create(reviews)
        console.log('Data Successfully Loaded!')        
    } catch (err) {
        console.log(err)
    }
    process.exit()
}

//DELETE DATA FROM DB

const deleteData = async () => {
    try{
        await Tour.deleteMany()
        await User.deleteMany()
        await Review.deleteMany()
        console.log('Data Successfully Deleted!')        
    } catch (err) {
        console.log(err)
    }
    process.exit()
}

if(process.argv[2] === '--import'){
importData()
} else if (process.argv[2]=== '--delete'){
    deleteData()
}

