const AppError = require("../utils/appError");

const handleJWTError = () => new AppError('Invalid token. Please login again!', 401);
const HandleJWTExpiredError = () => new AppError('Your Token has expired! Please login again!', 401);

const handleCastErrorDB = err =>{ 
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(?:\\.|[^\\])*?\1/);
  const message = `Dubplicate field value: ${value}. Try another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = object.values(err.errors).map(el => el.message);

  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
}

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,    
    stack: err.stack
  });
};

const sendErrorProd = (err, res) =>{
  //Operational error, trusted error: Send to client.
  if(err.isOperational){
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message     
  });

  //Programming/Other error, Don't leak details to the client
  } else {
    //log error
    //console.error('Error💥:', err);

    //send generic message.
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong! Just Take easy!'      
    });
  }
}

module.exports = (err,req, res, next) => {

    //console.log(err.stack)
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    
    if(process.env.NODE_ENV ==='development'|| 'production'){ // || 'production'
      sendErrorDev(err, res);
    } else if(process.env.NODE_ENV ='production'){      
      let error = {...err};
      if(error.name === 'castError') error = handleCastErrorDB(error);
      if(error.code === '11000') error = handleDuplicateFieldsDB(error);
      if(error.name === 'ValidationError') error= handleValidationErrorDB(error);      
      if(error.name === 'JsonWebTokenError') error = handleJWTError(error); 
      if(error.name === 'TokenExpiredError') error = HandleJWTExpiredError(error);
      sendErrorProd(error, res);  
}
next();
}

