const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');

const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewsRouter = require('./routes/reviewsRoutes');
const viewsRouter = require('./routes/viewRoutes');

const app = express();

//Views Set-up
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1.GLOBAL MIDDLEWARES

//Serving static Files
app.use(express.static(path.join(__dirname, 'public')));

//set security http headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//limit requests from the same API Requests
const limiter = rateLimit({
  max: 100,
  windowMS: 60 * 60 * 1000,
  message: 'Too many requests from this IP,please try again in 1 hour!',
});
app.use('/api', limiter);

//Body parser- Read data from body into req.body
app.use(express.json({ limit: '10kb' })); //MIDDLEWARE which modify POST data

//Data sanitization against NoSQL Query injections
app.use(mongoSanitize());

//Data sanitization againt XSS
app.use(xss());

//Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// 2. ROUTES
//test Route middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.cookies); //req.headers.authorization
  next();
});

//Mounting API Routes
app.use('/',viewsRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewsRouter);

app.all('*', (req, res, next) => {
  //SIMPLE ERROR MESSAGE
   /* res.status(404).json({
     status: 'fail',
     message: `This URL link ${req.originalUrl} Does not Exist on server!`
   });*/
    
  next(
    new AppError(
      `This URL link ${req.originalUrl} Does not Exist on server!`,
      404
    )
  );
});

app.use(globalErrorHandler);

module.exports = app;
