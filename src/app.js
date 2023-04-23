const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const morgan = require('morgan');
require('./config/config');
const app = express();

//Set more security to requests

app.use(helmet({
  crossOriginResourcePolicy: false,
}));
//Allow cors
app.use(cors());
//Set module for helper requests information
app.use(morgan("dev"));
//Allow json requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//Define public folder
app.use(express.static(path.join(__dirname, '/../public')));

//Configure routes
app.use('/user', require('./routes/user.route'));
app.use('/rol', require('./routes/rol.route'));
app.use('/product', require('./routes/product.route'));
app.use('/stripe', require('./routes/stripe.route'));

module.exports = app;
