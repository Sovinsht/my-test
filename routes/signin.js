var express = require('express');
var router = express.Router();

/* GET sign in page. */


router.get('/signin', function(req, res) {
  res.render('signin');
});

module.exports = router;
