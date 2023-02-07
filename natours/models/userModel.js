const crypto = require('crypto')
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

//mongoose Schema Description
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true,'Please give us your name']
    },
    email:{
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate:[validator.isEmail, 'Please Provide a valid email']
    },
    roles:{
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
      },
    photo:{
        type: String,
    },              
    password:{
        type: String,
        required:[true, 'Please Provide password'],
        minlength: 8, 
        select: false       
    },
    passwordConfirm:{
        type: String,
        required:[true, 'Please confirm password'],
        validate:{
            // This only works on CREATE() & SAVE()!
            validator: function(el) {
                return el === this.password;
            },
            message: 'Passwords are not the same'
        }        
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active:{
        type: Boolean,
        default: true,
        select: false        
    },
});

userSchema.pre('save', async function(next){
    //only run this function if password is modified.
    if(!this.isModified('password')) return next();
    
    //Hash the password with cost of 12
    this.password =await bcrypt.hash(this.password, 12); 
    
    //Delete passwordConfirm field
    this.passwordConfirm = undefined;
    next();      
});

userSchema.pre('save', function(next){
if(!this.isModified('password') || this.isNew) return next();
this.passwordChangedAt = Date.now() - 2000;
next(); 
});

userSchema.pre(/^find/, function(next){
    //this points to current query
    this.find({active:{ $ne: false} });
    next();
})

//password compare instance method
userSchema.methods.correctPassword = async function(
    candidatePassword,
    userPassword
){
    return await bcrypt.compare(candidatePassword, userPassword);
};


userSchema.methods.changedPasswordAfter = function(JWTTimestamp){
    if(this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() /1000 , 10);
        return JWTTimestamp < changedTimestamp;        
    }    
    //false means not changed.
    return false;
};

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');    
    console.log({resetToken},this.passwordResetToken)   
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    
    return resetToken;

}

//Mongoose User model
const User = mongoose.model('User', userSchema); //Creates a document called users from User(name of model)

module.exports = User;
