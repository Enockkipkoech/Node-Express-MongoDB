const express = require('express');
const userControllers = require('./../controllers/userController');
const authController = require('../controllers/authController')

//Users Route calls
const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login',authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//Protect All Routes after this middleware.
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.patch('/updateMe', userControllers.updateMe);
router.delete('/deleteMe', userControllers.deleteMe);

router.get('/me', userControllers.getMe, userControllers.getUser);

//Restricts Operations below this middleware to Admins
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get( userControllers.getAllUsers)
  .post(userControllers.createUser)
router
  .route('/:id')
  .get(userControllers.getUser)
  .patch(userControllers.updateUser)
  .delete(userControllers.deleteUser);

module.exports = router;
