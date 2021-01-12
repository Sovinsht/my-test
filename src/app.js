var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');
var session = require('express-session');
require('dotenv').config();
const flash = require('connect-flash');
// const flash = require('connect-flash');


require('./configs/db.config');
const authRoutes =  require('./routes/auth')
//const homeRoute =  require('./routes/home')
var bodyParser  = require('body-parser');
var app = express();
const bcryptjs = require('bcryptjs');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(morgan('dev'));
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());
app.use(express.static(path.join(__dirname + '/public/stylesheets')));
app.use(express.static(path.join(__dirname + '/public/javascripts')));

app.use(session({
    secret: 'Fa=_ZwQ3bC\>J:FV',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
  }))



//ROute
//app.use('/', homeRoute);
app.use('/', authRoutes);


module.exports = app;
