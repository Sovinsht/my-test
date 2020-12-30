const express = require('express');
const router = express.Router();
//Auth route here

//Route: auth/signin
router.get('/signin', function(req, res) {
  res.render('signin');
});

//Route: auth/register
router.get('/register', function(req, res, next) {
  res.render('register');
});

//Route: auth/forget-password
router.get('/forget-password', function(req, res, next ){
 res.render('forgetpassword')
})

module.exports =  router


