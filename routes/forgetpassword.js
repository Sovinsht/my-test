var express = require('express');
var router = express.Router();

/* GET forgetpassword page. */


router.get('/forgetpassword', function(req, res, next) {
  res.render('forgetpassword');
});

module.exports = router;
