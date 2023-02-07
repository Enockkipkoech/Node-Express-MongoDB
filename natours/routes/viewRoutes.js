const express = require('express');
const viewsController = require('../controllers/viewsController');

//const router = express.Router();
const app = express();

//ROUTES
//1) Views route Rendering /overview page -  Views Rendering Base route page
app.get('/', viewsController.getOverview);

//2) Views route Rendering /tour page
app.get(`/tour/:slug`, viewsController.getTour);

module.exports = app;